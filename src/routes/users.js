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

router.get("/:id",auth,async(req,res)=>{
  try{

    const userId = parseInt(req.params.id);
       if (userId !== req.userId) {
      return res.status(403).json({ error: "No autorizado para ver este perfil" });
    }

      const user=await prisma.user.findUnique({
      where:{id:userId},
      select:{
        id:true,
        nombre:true,
        apellidos:true,
        email:true,
        edad:true,
        ciudad:true,
        fotoPerfil:true,
      },
    });
    if(!user) return res.status(404).json({error:"Usuario no encontrado"});
    res.json(user);
  }catch(error){
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }

})

export default router;
