import Groq from "groq-sdk";
import { AssemblyAI } from "assemblyai";
import axios from "axios";
import dotenv from "dotenv";
import { createClient } from "@deepgram/sdk";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const client = new AssemblyAI({
  apiKey: "05565ac256aa47a6a7382658684fd21c",
});
// export const voicebotController = async (req, res, next) => {
//   try {
//     const { transcribedText } = req.body;
//     console.log(process.env.ELEVEN_LABS_API);

//     if (!transcribedText) {
//       return res.status(400).json({ error: "Text is required" });
//     }

//     // Data for the Eleven Labs API
//     const data = {
//       text: transcribedText,
//       model_id: "eleven_turbo_v2_5",
//       voice: "Rachel",
//     };

//     // Generate audio using Eleven Labs API
//     const audioResponse = await axios.post(
//       "https://api.elevenlabs.io/v1/text-to-speech/pMsXgVXv3BLzUgSXRplE",
//       data,
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "xi-api-key": process.env.ELEVEN_LABS_API,
//         },
//         responseType: "stream", // We expect a stream of audio data in the response
//       }
//     );
//     // Send the audio stream back to the client
//     res.setHeader("Content-Type", "audio/mpeg");
//     res.setHeader(
//       "Content-Disposition",
//       'attachment; filename="generated_audio.mp3"'
//     );
//     audioResponse.data.pipe(res);
//   } catch (error) {
//     next(error);
//   }
// };
const deepgram = createClient(process.env.DEEPGRAM_API);

export const voicebotController = async (req, res, next) => {
  try {
    const { transcribedText } = req.body;

    if (!transcribedText) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Generate audio using Deepgram API
    const response = await deepgram.speak.request(
      { text: transcribedText },
      {
        model: "aura-asteria-en",
        encoding: "linear16",
        container: "wav",
      }
    );

    const stream = await response.getStream();

    if (stream) {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      const base64Audio = buffer.toString("base64");
      res.json({ success: true, data: base64Audio });
    } else {
      res.status(500).json({ success: false, error: "Error generating audio" });
    }
  } catch (error) {
    next(error);
  }
};
