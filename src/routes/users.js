import express from "express";
import prisma from "../prisma.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  res.json(user);
});


router.get("/", auth, async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

export default router;
