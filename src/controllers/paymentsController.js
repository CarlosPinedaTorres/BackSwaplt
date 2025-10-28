import express from "express";
import Stripe from "stripe";
import prisma from "../prisma.js";
import { retryPrisma } from "../utils/retryPrisma.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, buyerId, sellerId, productId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
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
    console.log(updated)

    await retryPrisma(() =>
      prisma.wallet.update({
        where: { userId: updated.sellerId },
        data: {
          pendingBalance: {
            increment: updated.amount / 100,
          },
        },
      })
    );

    res.json({ message: "Pago confirmado y wallet actualizada" });
  } catch (error) {
    console.error("Error confirmando pago:", error);
    res.status(500).json({ error: "Error al confirmar pago" });
  }
};