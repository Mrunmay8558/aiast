import express from "express";
import dotenv from "dotenv";
import { upload } from "../utils/multer.js";
import { fetchImageController } from "../controller/fetchimage.controller.js";

const router = express.Router();

router.post(
  "/fetch-image-data",
  upload.single("document"),
  fetchImageController
);

export default router;
