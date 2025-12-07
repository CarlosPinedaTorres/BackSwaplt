import express from "express";
import { auth } from "../middlewares/auth.js"; 
import {deleteOfferOperation,getOperationById,rejectOperation, acceptOperation,getUserOperations,getUserWallet,createDirectPurchaseOperation,createOperationPaymentIntent,confirmOperationPayment,createOfferOperation } from "../controllers/paymentsController.js";

const router = express.Router();
router.post("/operation/create", auth, createDirectPurchaseOperation);
router.post("/operation/create-payment-intent", auth, createOperationPaymentIntent);
router.post("/operation/confirm-payment", auth, confirmOperationPayment);
router.post("/operation/create-offer", auth,createOfferOperation);
router.post("/operation/accept-operation",auth,acceptOperation)


router.get("/operation/get-user-operations",auth,getUserOperations);
router.post("/operation/reject-operation",auth,rejectOperation)
router.get("/wallet",auth,getUserWallet)

router.get("/operation/:operationId", auth, getOperationById);

router.delete("/operation/:id/delete", auth, deleteOfferOperation);
export default router;