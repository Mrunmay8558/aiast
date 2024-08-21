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

let step1 = {};

const deepgram = createClient(process.env.DEEPGRAM_API);

export const voicebotController = async (req, res, next) => {
  try {
    const { transcribedText, step } = req.body;
    if (!transcribedText) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Generate the assistant's response
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content:
            step === 1
              ? transcribedText.message
              : step === 3
              ? JSON.stringify(transcribedText.formdata)
              : "hello",
        },
        {
          role: "system",
          content: `
            You are CliniQ360, a health loan and insurance agent voice assistant. Follow these steps:
    
            Step 1: 'Welcome to CliniQ360 Health Loan and Insurance Assistant section. and ask to fill the form or upload addhar Card and Pan Card Photo for automatic Documentation'
    
            Step 2: 'Please fill out your Personal Health Details. Here is the JSON format for the data we need:'
            {
              "name": "",
              "age": "",
              "dob": "",
              "aadhaar_number": "",
              "address": {
                "street": "",
                "locality": "",
                "city": "",
                "state": "",
                "country": ""
              },
              "pincode": "",
              "mobile_number": ""
            }
    
            Step 3: 'Let me verify if you have filled all required fields. Here are the required fields:'
            {
              "name": "",
              "age": "",
              "dob": "",
              "aadhaar_number": "",
              "address": {
                "street": "",
                "locality": "",
                "city": "",
                "state": "",
                "country": ""
              },
              "pincode": "",
              "mobile_number": ""
            }
            Here is the data provided by the user: ${
              step === 3
                ? JSON.stringify(transcribedText.formdata)
                : transcribedText.message
            }. Please provide feedback on whether all required fields have been filled out.
    
            Step 4: 'Now, provide your Work Details, such as your company name.'
    
            Step 5: 'Verifying your work details.'
    
            Step 6: 'Tell me to submit the form and give your consent.'
    
            Step 7: 'Thank you for filling out the form.'
    
            Behave like a professional voice assistant, guiding users step-by-step. After the first interaction, keep the conversation limited to 1-2 lines only. in the end 
          `,
        },
        {
          role: "assistant",
          content: `This is my step: ${step}`,
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
