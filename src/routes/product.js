import express from "express";
import { auth } from "../middlewares/auth.js";
import { createProduct,deleteProduct,getAllOptions,getAllProducts,getCategorias,getEstados,getTipos,getUserProducts,updateProduct } from "../controllers/productController.js";
const router = express.Router();


router.post("/create",auth,createProduct)
router.get("/getOptions",auth,getAllOptions);
router.get("/categorias",auth,getCategorias);
router.get("/tipos", auth,getTipos);
router.get("/estados",auth, getEstados);
router.get("/user", auth,getUserProducts);
router.get("/allProducts",auth,getAllProducts)
router.delete("/deleteProduct/:id",auth,deleteProduct)
router.patch("/updateProduct/:id", auth, updateProduct);
export default router;