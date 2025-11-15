import express from "express";
import Stripe from "stripe";
import prisma from "../prisma.js";
import { retryPrisma } from "../utils/retryPrisma.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);




export const getMyTransactions = async (req, res) => {
  try {
    const userId = req.userId; 

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        buyer: { select: { id: true, nombre: true, fotoPerfil: true } },
        seller: { select: { id: true, nombre: true, fotoPerfil: true } },
        product: { select: { id: true, nombre: true, precio: true } },
      },
      orderBy: { createdAt: "desc" },
    });


    res.json(transactions);
  } catch (error) {
    console.error("Error obteniendo transacciones:", error);
    res.status(500).json({ error: "Error al obtener transacciones del usuario" });
  }
};



export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, buyerId, sellerId, productId, metadata, receipt_email, description } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,         
      receipt_email,      
      metadata,            
      payment_method_types: ["card"], 
    });

    const transaction = await retryPrisma(() =>
      prisma.transaction.create({
        data: {
          buyerId,
          sellerId,
          productId,
          amount,
          currency,
          status: "pending",
        },
      })
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    res.status(500).json({ error: "Error al crear el pago" });
  }
};


export const confirmPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const updated = await retryPrisma(() =>
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "paid" },
      })
    );


    await retryPrisma(async () => {

      await prisma.wallet.update({
        where: { userId: updated.buyerId },
        data: {
          balance: {
            decrement: updated.amount / 100,
          },
        },
      });


      await prisma.wallet.update({
        where: { userId: updated.sellerId },
        data: {
          balance: {
            increment: updated.amount / 100,
          },
        },
      });
    });
    res.json({ message: "Pago confirmado, wallets actualizadas correctamente" });

  } catch (error) {
    console.error("Error confirmando pago:", error);
    res.status(500).json({ error: "Error al confirmar pago" });
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