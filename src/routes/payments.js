import express from "express";
import { auth } from "../middlewares/auth.js"; 
import { confirmPayment, createPaymentIntent } from "../controllers/paymentsController.js";

const router = express.Router();

router.post("/create-intent", auth,createPaymentIntent);
router.post("/confirm", auth,confirmPayment);
export default router;