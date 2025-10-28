import prisma from "../prisma.js";
import { retryPrisma } from "../utils/retryPrisma.js";


export const getAllOptions=async(req,res)=>{
    try{
        const categorias = await retryPrisma(() => prisma.categoria.findMany());
        const tipos=await retryPrisma(()=>prisma.tipo.findMany());
        const estados=await retryPrisma(()=>prisma.estado.findMany());

        res.json({categorias,tipos,estados});

    }catch(err){
        console.log("Error obteniendo opciones: ",err);
        res.status(500).json({error:"Error obtenendo opciones"});
    }
};


export const getCategorias = async (req, res) => {
  try {
    const categorias = await retryPrisma(() => prisma.categoria.findMany());
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo categorías" });
  }
};




export const getTipos = async (req, res) => {
  try {
    const tipos = await retryPrisma(() => prisma.tipo.findMany());
    res.json(tipos);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo tipos" });
  }
};

export const getEstados = async (req, res) => {
  try {
    const estados = await retryPrisma(() => prisma.estado.findMany());
    res.json(estados);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo estados" });
  }
};

export const createProduct=async(req,res)=>{
    try{




        const { nombre, descripcion, precio, categoriaId, tipoId, estadoId, userId, ubicacion } = req.body;

        const nuevoProducto=await retryPrisma(()=>prisma.product.create({
            data:{
                nombre,
                descripcion,
                precio,
                categoriaId,
                tipoId,
                estadoId,
                userId,
                ubicacion,

            },
        }));

        res.status(201).json(nuevoProducto);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Error creando producto"})
    }
}

export const deleteProduct=async(req,res)=>{
  try {
    const { id } = req.params; 

 
    if (!id) {
      return res.status(400).json({ error: "Falta el ID del producto" });
    }


    const productoEliminado = await retryPrisma(() =>
      prisma.product.delete({
        where: { id: parseInt(id) }, 
      })
    );

    res.status(200).json({
      message: "Producto eliminado correctamente",
      productoEliminado,
    });
  } catch (err) {
    console.log(err);


    if (err.code === "P2025") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(500).json({ error: "Error eliminando producto" });
  }
}



export const getUserProducts = async (req, res) => {
  try {
    const userId = req.userId; 

const productos = await prisma.product.findMany({
  where: { userId },
  select: {
    id:true,
    nombre: true,
    descripcion: true,
    precio: true,
    categoria: { select: { nombre: true } },
    tipo: { select: { nombre: true } },
    estado: { select: { nombre: true } },
    usuario: { select: { id: true, nombre: true } }, 
    ubicacion: true,       
    disponibilidad: true,  
 
  },
  orderBy:{fechaCreacion:"desc"}
});


    res.json(productos);
  } catch (err) {
    console.error(" Error obteniendo productos del usuario:", err);
    res.status(500).json({ error: "Error obteniendo productos del usuario" });
  }
};

export const getAllProducts=async(req,res)=>{
  try{
    const productos=await prisma.product.findMany({
        select: {
    id:true,
    nombre: true,
    descripcion: true,
    precio: true,
    categoria: { select: { nombre: true } },
    tipo: { select: { nombre: true } },
    estado: { select: { nombre: true } },
    ubicacion: true,       
    disponibilidad: true, 
    userId:true ,
  },
  orderBy:{fechaCreacion:"desc"}})
      res.json(productos);
  }catch(err){
        console.error(" Error obteniendo productos :", err);
    res.status(500).json({ error: "Error obteniendo productos " });
  }
}

