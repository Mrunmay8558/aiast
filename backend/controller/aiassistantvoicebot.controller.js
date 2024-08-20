import Groq from "groq-sdk";
import { AssemblyAI } from "assemblyai";
import axios from "axios";
import dotenv from "dotenv";
import { ElevenLabsClient, ElevenLabs } from "elevenlabs";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const client = new AssemblyAI({
  apiKey: "05565ac256aa47a6a7382658684fd21c",
});
export const voicebotController = async (req, res, next) => {
  try {
    const { transcribedText } = req.body;
    console.log(transcribedText);

    const data = {
      text: "Born and raised in the charming south, I can add a touch of sweet southern hospitality to your audiobooks and podcasts",
      model_id: "eleven_monolingual_v1",

      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true,
      },
    };

    const response = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/pMsXgVXv3BLzUgSXRplE?output_format=mp3_44100_128",
      data,
      {
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVEN_LABS_API,
        },
        responseType: "arraybuffer",
      }
    );

    console.log(response);

    if (response.data) {
      return res.status(200).json({ data: response.data });
    } else {
      return res
        .status(404)
        .json({ message: "Error while generating response" });
    }
  } catch (error) {
    next(error);
  }
};
