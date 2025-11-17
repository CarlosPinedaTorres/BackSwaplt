import express from "express";
import { auth } from "../middlewares/auth.js"; 
import { getUserOperations,getUserWallet,createDirectPurchaseOperation,createOperationPaymentIntent,confirmOperationPayment,createOfferOperation } from "../controllers/paymentsController.js";

const router = express.Router();
router.post("/operation/create", auth, createDirectPurchaseOperation);
router.post("/operation/create-payment-intent", auth, createOperationPaymentIntent);
router.post("/operation/confirm-payment", auth, confirmOperationPayment);
router.post("/operation/create-offer", auth,createOfferOperation);

router.get("/operation/get-user-operations", auth,getUserOperations);
router.get("/wallet",auth,getUserWallet)

export default router;