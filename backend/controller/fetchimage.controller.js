import OpenAI from "openai";
import dotenv from "dotenv";
import { errorHandler } from "../utils/error.js";
import { Completions } from "openai/resources/completions.mjs";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API });

export const fetchImageController = async (req, res, next) => {
  try {
    const { image_url } = req.body;

    const prompt = `
      Please analyze the provided image of an import document and extract the relevant details to match the following JSON format. The document should include information such as name, age, date of birth, Aadhaar number, address details, pincode, and mobile number. Here is the required JSON structure:
       {
           firstName: "", // User's first name
           lastName: "", // User's last name
           dob: "", // User's date of birth
           gender: "", // User's gender Based on the Gender Give just M stands for Male or Female
           pan: "", // User's PAN (Permanent Account Number)
           contactNumber: "", // User's contact number
           email: "", // User's email address
           endUse: "", // The intended end-use of the form or service (options: education, health, travel, other)
           addressL1: "", // User's primary address line 1
           addressL2: "", // User's secondary address line 2 (optional)
           city: "", // User's city
           state: "", // User's state
           pincode: "" // User's postal code (PIN code)
          }
  
      Please ensure that the extracted data matches this structure accurately. Your response should be a valid JSON object only, starting with "{" and ending with "}". Do not include any additional text or explanations. If certain fields are missing or ambiguous, make a note of it within the JSON object. 
    `;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Here is my image" },
            {
              type: "image_url",
              image_url: {
                url: image_url,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    if (completion) {
      try {
        const result = JSON.parse(completion.choices[0].message.content);
        return res.status(200).json(result);
      } catch (error) {
        return errorHandler(500, "Error parsing response JSON");
      }
    } else {
      return errorHandler(404, "Error while generating response");
    }
  } catch (error) {
    next(error);
  }
};
