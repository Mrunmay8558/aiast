import express from "express";
import {
  audioToTextController,
  voicebotController,
} from "../controller/aiassistantvoicebot.controller.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

router.post("/get-audio-file", voicebotController);
router.post(
  "/transcribe-audio",
  upload.single("audioFile"),
  audioToTextController
);

export default router;
