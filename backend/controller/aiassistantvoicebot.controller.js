import Groq from "groq-sdk";
import { AssemblyAI } from "assemblyai";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const client = new AssemblyAI({
  apiKey: "05565ac256aa47a6a7382658684fd21c",
});
export const voicebotController = async (req, res, next) => {
  try {
    const { transcribedText } = req.body;
    const payload = {
      text: transcribedText,
      voice_settings: {
        stability: 0.1,
        similarity_boost: 0.3,
        style: 0.2,
      },
    };

    const response = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/pMsXgVXv3BLzUgSXRplE",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVEN_LABS_API,
        },
      }
    );
    if (response && response.data) {
      return res.status(200).json(response.data);
    } else {
      return res
        .status(404)
        .json({ message: "Error while generating response" });
    }
  } catch (error) {
    next(error);
  }
};
