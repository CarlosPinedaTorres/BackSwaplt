import prisma from "../prisma.js";
import { retryPrisma } from "../utils/retryPrisma.js";





export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      nombre,
      descripcion,
      precio,
      categoriaId,
      tipoId,
      estadoId,
      ubicacion,
      disponibilidad,
      fotos,
    } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de producto inválido o faltante" });
    }
    // console.log(fotos)
    const productoExistente = await retryPrisma(() =>
      prisma.product.findUnique({
        where: { id: parseInt(id) },
        select: { id: true, userId: true, fotos: true },
      })
    );

    if (!productoExistente) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (userId && productoExistente.userId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para editar este producto" });
    }

    const dataToUpdate = {};

    if (nombre) dataToUpdate.nombre = nombre;
    if (descripcion) dataToUpdate.descripcion = descripcion;
    if (precio !== undefined) dataToUpdate.precio = precio;
    if (categoriaId) dataToUpdate.categoriaId = categoriaId;
    if (tipoId) dataToUpdate.tipoId = tipoId;
    if (estadoId) dataToUpdate.estadoId = estadoId;
    if (ubicacion) dataToUpdate.ubicacion = ubicacion;
    if (disponibilidad !== undefined) dataToUpdate.disponibilidad = disponibilidad;


    if (fotos && Array.isArray(fotos)) {
      const fotosToCreate = fotos.filter(f => !f.id && f.url);
      const fotosToUpdate = fotos.filter(f => f.id && f.url);
      // console.log(fotosToCreate,"aqui")
   
      if (fotosToCreate.length > 0 || fotosToUpdate.length > 0) {
        dataToUpdate.fotos = {};

        if (fotosToCreate.length > 0) {
          dataToUpdate.fotos.create = fotosToCreate.map(f => ({ url: f.url }));
        }

        if (fotosToUpdate.length > 0) {
          dataToUpdate.fotos.update = fotosToUpdate.map(f => ({
            where: { id: f.id },
            data: { url: f.url },
          }));
        }
      }
    }


    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: "No se enviaron campos para actualizar" });
    }

    const productoActualizado = await retryPrisma(() =>
      prisma.product.update({
        where: { id: parseInt(id) },
        data: dataToUpdate,
        include: { fotos: true },
      })
    );

    res.status(200).json({
      message: "Producto actualizado correctamente",
      producto: productoActualizado,
    });
  } catch (err) {
    console.error("Error actualizando producto:", err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.status(500).json({ error: "Error actualizando producto" });
  }
};



export const getAllOptions = async (req, res) => {
  try {

    const categorias = await retryPrisma(() => prisma.categoria.findMany());
    const tipos = await retryPrisma(() => prisma.tipo.findMany());
    const estados = await retryPrisma(() => prisma.estado.findMany());

    res.json({ categorias, tipos, estados });

  } catch (err) {
    console.log("Error obteniendo opciones: ", err);
    res.status(500).json({ error: "Error obtenendo opciones" });
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

export const createProduct = async (req, res) => {
  try {




    const { nombre, descripcion, precio, categoriaId, tipoId, estadoId, userId, ubicacion, fotos = [] } = req.body;

    const nuevoProducto = await retryPrisma(() => prisma.product.create({
      data: {
        nombre,
        descripcion,
        precio,
        categoriaId,
        tipoId,
        estadoId,
        userId,
        ubicacion,
        fotos: {
          createMany: {
            data: fotos.map(url => ({ url }))
          }
        }
      },
      include: {
        fotos: true
      }
    })
    );

    res.status(201).json(nuevoProducto);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error creando producto" })
  }
}

export const deleteProduct = async (req, res) => {
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
        id: true,
        nombre: true,
        descripcion: true,
        precio: true,
        categoria: { select: { nombre: true } },
        tipo: { select: { nombre: true } },
        estado: { select: { nombre: true } },
        usuario: { select: { id: true, nombre: true } },
        ubicacion: true,
        disponibilidad: true,
        visibilidad:true,
        fotos: {
          select: { id: true, url: true }
        }
      },
      orderBy: { fechaCreacion: "desc" }
    });


    res.json(productos);
  } catch (err) {
    console.error(" Error obteniendo productos del usuario:", err);
    res.status(500).json({ error: "Error obteniendo productos del usuario" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const userId = req.userId;

    const productos = await prisma.product.findMany({
      where: {
        userId: { not: userId },
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        precio: true,
        categoria: { select: { nombre: true } },
        tipo: { select: { nombre: true } },
        estado: { select: { nombre: true } },
        usuario: { select: { id: true, nombre: true } },
        ubicacion: true,
        disponibilidad: true,
        visibilidad:true,
        userId: true,
        fotos: {
          select: { url: true }
        }
      },
      orderBy: { fechaCreacion: "desc" }
    })
    res.json(productos);
  } catch (err) {
    console.error(" Error obteniendo productos :", err);
    res.status(500).json({ error: "Error obteniendo productos " });
  }
}

