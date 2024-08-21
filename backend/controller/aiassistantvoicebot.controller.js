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

const deepgram = createClient(process.env.DEEPGRAM_API);

export const voicebotController = async (req, res, next) => {
  try {
    const { transcribedText } = req.body;

    if (!transcribedText) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Generate the assistant's response
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: transcribedText },
        {
          role: "system",
          content: `
            You are CliniQ360, a health loan and insurance agent voice assistant. Follow these steps:
            1. 'Welcome to CliniQ360 Health Loan and Insurance Assistant section.'
            2. 'Please fill out your Personal Health Details.'
            3. 'Let me verify if you've filled all required fields.'
            4. 'Now, provide your Work Details, such as your company name.'
            5. 'Verifying your work details.'
            6. 'Tell me to submit the form and give your consent.'
            7. 'Thank you for filling out the form.'
            Behave like a professional voice assistant, guiding users step-by-step.
          `,
        },
      ],
      model: "llama3-8b-8192",
    });

    // Extract text from the assistant's response
    const chatCompletion = completion.choices[0]?.message?.content || "";

    // Generate audio from the text
    const response = await deepgram.speak.request(
      { text: chatCompletion },
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
