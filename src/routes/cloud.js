import express from "express";
import cloudinary from "../config/cloudConfig.js";
import fs from "fs"
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); 

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path,{
      folder:"Swaplt"
    });
    fs.unlinkSync(req.file.path);
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error subiendo la imagen" });
  }
});

export default router;
