import express from "express";
import prisma from "./prisma.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import cloudRoutes from "./routes/cloud.js";
import productRoutes from "./routes/product.js";
import chatsRoutes from "./routes/chats.js";
import { configureChatSocket } from "./sockets/chatSocket.js";
import { createServer } from "http";
import { Server } from "socket.io";
import paymentsRoutes from "./routes/payments.js";


const app = express();
app.use(express.json());

app.use("/cloud", cloudRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/chats", chatsRoutes);
app.use("/payments", paymentsRoutes);

const server = createServer(app);


const io = new Server(server, { cors: { origin: "*" } });
configureChatSocket(io);


const gracefulShutdown = async (signal) => {
  console.log(`Señal recibida: ${signal}`);
  console.log("Cerrando conexiones de Prisma...");

  try {
    await prisma.$disconnect();
    console.log("Conexiones cerradas correctamente.");
  } catch (err) {
    console.error("Error cerrando Prisma:", err);
  } finally {
    console.log("Cerrando servidor...");
    server.close(() => process.exit(0));
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));


server.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
