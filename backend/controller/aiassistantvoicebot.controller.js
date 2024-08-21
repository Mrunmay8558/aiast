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
              ? "Hii"
              : step === 2
              ? JSON.stringify(transcribedText.formdata)
              : "hello",
        },
        {
          role: "system",
          content: `
            You are CliniQ360, a health loan and insurance agent voice assistant. Follow these steps:
            
             Always return an object containing the following keys:
            {
              ttsData: "the assistant's spoken response as a string",
              isFilled: true if all required fields are filled, false if any are missing, or null if no verification is required in the current step
            }
            Important: [Only return the JSON object. Do not add any text before or after the object.]
            Dont add anything alphaB
      
            Step 1: 'Welcome the user with them message like : Welcome to  CliniQ360 Health Loan and Insurance Assistant. Please fill out the Personal Detail form or upload your Aadhaar Card and PAN Card Photo for automatic documentation.
        
            Step 2: 'Verifying your data. Here are the required fields:'
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
            The user provided the following data: ${
              step === 2
                ? JSON.stringify(transcribedText.formdata)
                : transcribedText.message
            }. Confirm whether all required fields have been filled out.'
        
            Step 3: 'Now, provide your Work Details, such as your company name. Verifying your work details. After verifying, ask the user to submit the form and give their consent.'
        
            Step 4: 'Thank you for filling out the form.'
          `,
        },
        {
          role: "assistant",
          content: `This is step: ${step}. If user provides step 1, then welcome the user; if step 2, check the fields. Don't add anything in front of the object.`,
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
        ttsData: parsedObject?.ttsData,
        isFilled: parsedObject?.isFilled,
      });
    } else {
      res.status(500).json({ success: false, error: "Error generating audio" });
    }
  } catch (error) {
    next(error);
  }
};
