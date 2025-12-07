import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import dotenv from "dotenv";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { retryPrisma } from "../utils/retryPrisma.js";
dotenv.config();


const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;



router.post("/register", async (req, res) => {
  const { nombre, apellidos, edad, fechaNacimiento, ciudad, email, password, fotoPerfil } = req.body;

  try {

    const passwordHasheada = await hashPassword(password);

  
    const user = await retryPrisma(() =>
      prisma.user.create({
        data: {
          nombre,
          apellidos,
          fechaNacimiento,
          edad,
          ciudad,
          email,
          password: passwordHasheada,
          fotoPerfil,
          wallet: {
            create: {
              balance: 0,
              pendingBalance: 0,
            },
          },
        },
        include: {
          wallet: true, 
        },
      })
    );

    res.json(user);
  } catch (err) {
   
    if (err.code === "P2002" && err.meta?.target?.includes("email")) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    res.status(500).json({ error: err.message });
  }
});








router.post("/login", async (req, res) => {
  const { email, password, deviceInfo } = req.body;
  try {


    const user = await retryPrisma(() => prisma.user.findUnique({ where: { email } }));

    if (!user) return res.status(400).json({ error: "Usuario no encontrado" });
    if (user.email !== email) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }
    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: "30d" });



    const device = deviceInfo || "unknown device";

    const existingToken = await prisma.refreshToken.findFirst({
      where: {
        userId: user.id,
        deviceInfo: device,
      },
    });

    if (existingToken) {
      await prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: {
          token: refreshToken,
          userId: user.id,
          deviceInfo: device,
          expiredAT: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      await retryPrisma(() => prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          deviceInfo: deviceInfo || "dispositivo desconocido PC",
          expiredAT: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),

        },
      }));
    }

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error del servidor" })
  }

});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh Token requerido" });
    }

    // console.log(refreshToken)
    const token = refreshToken
      .toString()
      .normalize("NFKC")
      .trim()
      .replace(/[\s\r\n\u200B-\u200D\uFEFF]+/g, "");
    // console.log(token,"con trim refresh")

    const storedToken = await retryPrisma(() =>
      prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      })
    );

    if (!storedToken) {
      return res.status(401).json({ error: "Refresh token no encontrado" });
    }


    if (new Date() > storedToken.expiredAT) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return res.status(401).json({ error: "Refresh token caducado" });
    }


    let payload;
    try {
      payload = jwt.verify(token, process.env.REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Firma del token inválida" });
    }


    const accessToken = jwt.sign(
      { userId: storedToken.user.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { userId: storedToken.user.id },
      process.env.REFRESH_SECRET,
      { expiresIn: "30d" }
    );


    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: newRefreshToken,
        expiredAT: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });


    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        nombre: storedToken.user.nombre,
        email: storedToken.user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  // console.log(refreshToken)
  const cleanRefreshToken = refreshToken
    .toString()
    .normalize("NFKC")
    .trim()
    .replace(/[\s\r\n\u200B-\u200D\uFEFF]+/g, "");
  if (!cleanRefreshToken) return res.status(400).json({ error: "Refresh token requerido" });
  try {
    const storedToken = await retryPrisma(() => prisma.refreshToken.findUnique({
      where: { token: cleanRefreshToken }
    }));
    if (!storedToken)
      return res.status(404).json({ error: "Token no encontrado" });
    await retryPrisma(() => prisma.refreshToken.delete({
      where: { id: storedToken.id },
    }));

    res.json({ message: "Sesion cerrada correctamente" })

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }

})

router.post("/logoutAll", async (req, res) => {
  const { userId } = req.body;

  if (!userId)
    return res.status(400).json({ error: "ID de usuario requerido" });

  try {
    await retryPrisma(() => prisma.refreshToken.deleteMany({
      where: { userId },
    }));

    res.json({ message: "Sesión cerrada en todos los dispositivos" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});



export default router