import express from "express";
import { auth } from "../middlewares/auth.js"; 
import { confirmPayment, createPaymentIntent, getMyTransactions, getUserWallet } from "../controllers/paymentsController.js";

const router = express.Router();

router.post("/create-intent", auth,createPaymentIntent);
router.post("/confirm", auth,confirmPayment);
router.get("/wallet",auth,getUserWallet)
router.get("/transactions",auth,getMyTransactions)
export default router;