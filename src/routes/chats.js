import express from "express";
import { auth } from "../middlewares/auth.js";
const router = express.Router();

import { getMessages, createOrGetChat,sendMessage,getMyChats } from "../controllers/chatsController.js";


router.post("/create",auth,createOrGetChat)
router.get("/getMessages/:chatId",auth,getMessages)
router.post("/sendMessages",auth,sendMessage)
router.get("/getMyChats/:userId",auth,getMyChats)
export default router;