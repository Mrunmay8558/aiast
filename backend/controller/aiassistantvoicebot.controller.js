import Groq from "groq-sdk";
import { AssemblyAI } from "assemblyai";
import axios from "axios";
import dotenv from "dotenv";
import { createClient } from "@deepgram/sdk";
import { prompt1, prompt2, prompt3 } from "../utils/creditPrompt.js";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const deepgram = createClient(process.env.DEEPGRAM_API);

export const voicebotController = async (req, res, next) => {
  try {
    const { transcribedText, step } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content:
            step === 1
              ? "Hii"
              : step === 2
              ? transcribedText?.message +
                JSON.stringify(transcribedText?.formdata)
              : step === 3
              ? JSON.stringify(transcribedText.formdata) +
                transcribedText.message
              : "hey",
        },
        {
          role: "system",
          content: `
                      You are CliniQ360, a health loan and insurance agent voice assistant. 
                      Respond in JSON format with the required details.
                       ${
                         step === 1
                           ? prompt1
                           : step === 2
                           ? prompt2
                           : step === 3
                           ? prompt3
                           : "hello"
                       }
                  `,
        },
        {
          role: "assistant",
          content: `According to the user input please provide the correct details`,
        },
      ],
      model: "llama3-70b-8192",
      response_format: {
        type: "json_object",
      },
    });

    // Extract text from the assistant's response
    const chatCompletion = completion.choices[0]?.message?.content || "";
    console.log(chatCompletion);

    const parsedObject = JSON.parse(chatCompletion);
    // Generate audio from the text
    const response = await deepgram.speak.request(
      { text: parsedObject?.ttsData },
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
      res.json({
        success: true,
        data: base64Audio,
        step: step,
        formdata: parsedObject?.formData,
        ttsData: parsedObject?.ttsData,
        isFilled: parsedObject?.isFilled,
        isVerify: parsedObject?.isVerify,
      });
    } else {
      res.status(500).json({ success: false, error: "Error generating audio" });
    }
  } catch (error) {
    next(error);
  }
};
