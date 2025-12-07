import express from "express";
import Stripe from "stripe";
import prisma from "../prisma.js";
import { retryPrisma } from "../utils/retryPrisma.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const getOperationById = async (req, res) => {
  try {
    const operationId = Number(req.params.operationId);

    if (isNaN(operationId)) {
      return res.status(400).json({ error: "ID de operación inválido" });
    }
    const operation = await retryPrisma(() =>
      prisma.operation.findUnique({
        where: { id: operationId },
        include: {
          mainProduct: true,
          offeredProducts: {
            include: {
              product: true,
            },
          },
          requester: {
            select: { id: true, nombre: true },
          },
          receiver: {
            select: { id: true, nombre: true },
          },
        },
      })
    );

    if (!operation) {
      return res.status(404).json({ error: "Operación no encontrada" });
    }

    res.json(operation);
  } catch (error) {
    console.error("Error obteniendo operación:", error);
    res.status(500).json({ error: "No se pudo obtener la operación" });
  }
};



export const getUserOperations = async (req, res) => {
  try {
    const userId = req.userId;

    const operations = await retryPrisma(() =>
      prisma.operation.findMany({
        where: {
          OR: [
            { requesterId: userId },
            { receiverId: userId }
          ]
        },
        include: {
          mainProduct: true,
          offeredProducts: {
            include: {
              product: true
            }
          },
          requester: {
            select: { id: true, nombre: true }
          },
          receiver: {
            select: { id: true, nombre: true }
          }
        },
        orderBy: { updatedAt: "desc" }
      })
    );

    res.json(operations);
  } catch (error) {
    console.error("Error obteniendo operaciones del usuario:", error);
    res.status(500).json({ error: "No se pudieron obtener las operaciones" });
  }
};


export const rejectOperation = async (req, res) => {
  try {
    const { operationId } = req.body;
    const userId = req.userId;

    const operation = await prisma.operation.findUnique({
      where: { id: operationId }
    });

    if (!operation)
      return res.status(404).json({ error: "Operación no encontrada" });

    if (operation.receiverId !== userId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const updated = await prisma.operation.update({
      where: { id: operationId },
      data: { status: "REJECTED" },
      include: {
        mainProduct: true,
        offeredProducts: {
          include: { product: true }
        },
        requester: {
          select: { id: true, nombre: true }
        },
        receiver: {
          select: { id: true, nombre: true }
        }
      }
    });

    res.json(updated);

  } catch (error) {
    console.error("Error rechazando operación:", error);
    res.status(500).json({ error: "No se pudo rechazar la operación" });
  }
};

export const acceptOperation = async (req, res) => {
  try {
    const { operationId } = req.body;
    const userId = req.userId;
    let status = "";
    const operation = await prisma.operation.findUnique({
      where: { id: operationId },
      include: {
        offeredProducts: true,
      }
    });


    if (!operation)
      return res.status(404).json({ error: "Operación no encontrada" });

    if (operation.receiverId !== userId) {
      return res.status(403).json({ error: "No autorizado" });
    }
    if (operation.type === "TRADE") {
      status = "COMPLETED"
      await prisma.product.update({
        where: { id: operation.mainProductId },
        data: { visibilidad: false }
      });
      if (operation.offeredProducts?.length > 0) {
        const offeredProductIds = operation.offeredProducts.map(op => op.productId);
        await prisma.product.updateMany({
          where: { id: { in: offeredProductIds } },
          data: { visibilidad: false },
        });
      }

    } else {
      status = "PAYMENT_PENDING"
      await prisma.product.update({
        where: { id: operation.mainProductId },
        data: { visibilidad: false },
      });
    }

    await prisma.operation.deleteMany({
      where: {
        id: { not: operationId },
        OR: [
          { mainProductId: { in: allProductIds } },
          {
            offeredProducts: {
              some: { productId: { in: allProductIds } },
            },
          },
        ],
      },
    });
    const updated = await prisma.operation.update({
      where: { id: operationId },
      data: { status: status },
      include: {
        mainProduct: true,
        offeredProducts: {
          include: { product: true }
        },
        requester: {
          select: { id: true, nombre: true }
        },
        receiver: {
          select: { id: true, nombre: true }
        }
      }
    });

    res.json(updated);

  } catch (error) {
    console.error("Error aceptando operación:", error);
    res.status(500).json({ error: "No se pudo aceptar la operación" });
  }
};




export const deleteOfferOperation = async (req, res) => {
  try {

    const operationId = Number(req.params.id);

    const userId = req.userId;

    const operation = await retryPrisma(() =>
      prisma.operation.findUnique({
        where: { id: operationId },
        select: { requesterId: true, receiverId: true, status: true },
      })
    );

    if (!operation) {
      return res.status(404).json({ error: "La oferta no existe" });
    }

    if (operation.requesterId !== userId && operation.receiverId !== userId) {
      return res.status(403).json({ error: "No puedes eliminar esta oferta" });
    }

    if (["COMPLETED", "PAID"].includes(operation.status)) {
      return res.status(400).json({ error: "No puedes eliminar una oferta ya completada o pagada" });
    }


    await retryPrisma(() =>
      prisma.operation.delete({
        where: { id: operationId },
      })
    );

    res.json({ message: "Oferta eliminada correctamente" });

  } catch (error) {
    console.error("Error eliminando oferta:", error);
    res.status(500).json({ error: "Error eliminando oferta" });
  }
};


export const createOfferOperation = async (req, res) => {
  try {

    const { requesterId, mainProductId, moneyOffered, offeredProductIds } = req.body;


    const mainProduct = await retryPrisma(() =>
      prisma.product.findUnique({
        where: { id: mainProductId },
        select: { userId: true, nombre: true, precio: true },
      })
    );

    if (!mainProduct) {
      return res.status(404).json({ error: "Producto principal no encontrado" });
    }


    let operationType;
    if (moneyOffered) {
      operationType = "SALE";
    } else if (offeredProductIds?.length > 0) {
      operationType = "TRADE";
    } else {
      return res.status(400).json({ error: "Debes especificar dinero o productos para la oferta" });
    }


    const operation = await retryPrisma(() =>
      prisma.operation.create({
        data: {
          requesterId,
          receiverId: mainProduct.userId,
          mainProductId,
          type: operationType,
          moneyOffered: moneyOffered || null,
          isDirectPurchase: false,
          status: "PENDING",
        },
      })
    );


    if (operationType === "TRADE" && offeredProductIds?.length > 0) {
      await retryPrisma(() =>
        prisma.operationProduct.createMany({
          data: offeredProductIds.map((pid) => ({
            operationId: operation.id,
            productId: pid,
          })),
          skipDuplicates: true,
        })
      );
    }

    res.json({
      operationId: operation.id,
      mainProductId: mainProduct.id,
      type: operationType,
      moneyOffered: operation.moneyOffered,
      offeredProductIds: offeredProductIds || [],
    });
  } catch (error) {
    console.error("Error creando oferta:", error);
    res.status(500).json({ error: "Error creando oferta" });
  }
};




export const getUserWallet = async (req, res) => {
  try {
    const userId = req.userId;
    const wallet = await retryPrisma(() =>
      prisma.wallet.findUnique({
        where: { userId },
        select: {
          balance: true,
          pendingBalance: true,
        },
      })
    );
    if (!wallet) {
      return res.status(404).json({ error: "Wallet no encontrada" });
    }
    res.json(wallet);
  } catch (error) {
    console.error("Error obteniendo wallet:", error);
    res.status(500).json({ error: "Error obteniendo wallet del usuario" });
  }
}


export const createDirectPurchaseOperation = async (req, res) => {
  try {
    const { requesterId, mainProductId } = req.body;
    console.log("Producto ID recibido:", mainProductId);

    const product = await retryPrisma(() =>
      prisma.product.findUnique({
        where: { id: mainProductId },
        select: { userId: true, precio: true },
      })
    );

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const operation = await retryPrisma(() =>
      prisma.operation.create({
        data: {
          requesterId,
          receiverId: product.userId,
          mainProductId,
          type: "SALE",
          isDirectPurchase: true,
          status: "PENDING",
        },
      })
    );

    res.json({ operationId: operation.id });
  } catch (error) {
    console.error("Error creando operación de compra directa:", error);
    res.status(500).json({ error: "Error creando operación" });
  }
};

export const createOperationPaymentIntent = async (req, res) => {
  try {
    const { operationId } = req.body;
    console.log("ID operación:", operationId);

    const operation = await retryPrisma(() =>
      prisma.operation.findUnique({
        where: { id: operationId },
        include: { mainProduct: true },
      })
    );

    if (!operation) {
      return res.status(404).json({ error: "Operación no encontrada" });
    }

    const amount = operation.isDirectPurchase
      ? operation.mainProduct.precio * 100
      : operation.moneyOffered * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      metadata: {
        IdOperacion: operation.id.toString(),
        IdProducto: operation.mainProduct.id.toString(),
        Nombre_Producto: operation.mainProduct.nombre,
        Precio_Producto: (
          operation.isDirectPurchase
            ? operation.mainProduct.precio
            : operation.moneyOffered
        ).toString(),

        IdVendedor: operation.receiverId.toString(),
        IdComprador: operation.requesterId.toString(),
      },
      payment_method_types: ["card"],
    });

    await retryPrisma(() =>
      prisma.operation.update({
        where: { id: operationId },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          status: "PAYMENT_PENDING",
        },
      })
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      operationId: operation.id,
      productId: operation.mainProduct.id,
      productName: operation.mainProduct.nombre,
      productPrice: operation.mainProduct.precio,
      requesterId: operation.requesterId,
      receiverId: operation.receiverId,
    });
  } catch (error) {
    console.error("Error creando payment intent:", error);
    res.status(500).json({ error: "Error creando pago para operación" });
  }
};


export const confirmOperationPayment = async (req, res) => {
  try {
    const { operationId } = req.body;

    const operation = await retryPrisma(() =>
      prisma.operation.findUnique({
        where: { id: operationId },
        include: { mainProduct: true },
      })
    );

    if (!operation) {
      return res.status(404).json({ error: "Operación no encontrada" });
    }

    if (!operation.mainProduct) {
      return res
        .status(400)
        .json({ error: "Producto principal no encontrado en la operación" });
    }


    await retryPrisma(() =>
      prisma.operation.update({
        where: { id: operationId },
        data: { status: "PAID" },
      })
    );
    await prisma.product.update({
      where: { id: operation.mainProductId },
      data: { visibilidad: false }
    });



    await retryPrisma(() =>
      prisma.wallet.update({
        where: { userId: operation.requesterId },
        data: { balance: { decrement: operation.mainProduct.precio || 0 } },
      })
    );

    await retryPrisma(() =>
      prisma.wallet.update({
        where: { userId: operation.receiverId },
        data: { balance: { increment: operation.mainProduct.precio || 0 } },
      })
    );

    res.json({ message: "Pago confirmado, wallets actualizadas correctamente" });
  } catch (error) {
    console.error("Error confirmando pago:", error);
    res.status(500).json({ error: "Error al confirmar pago" });
  }
};
