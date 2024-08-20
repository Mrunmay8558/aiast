import express from "express";
import { voicebotController } from "../controller/aiassistantvoicebot.controller.js";

const router = express.Router();

router.post("/get-audio-file", voicebotController);

export default router;
