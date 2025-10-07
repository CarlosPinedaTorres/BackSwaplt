import express from "express";
import prisma from "./prisma.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js"
const app = express();
app.use(express.json());

app.use("/auth",authRoutes);
app.use("/users", userRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));
