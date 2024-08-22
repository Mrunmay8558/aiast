import express from "express";
import {
  audioToTextController,
  voicebotController,
} from "../controller/aiassistantvoicebot.controller.js";

const router = express.Router();

router.post("/get-audio-file", voicebotController);
router.post("/transcribe-audio", audioToTextController);

export default router;
