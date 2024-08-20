import Groq from "groq-sdk";
import { AssemblyAI } from "assemblyai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const client = new AssemblyAI({
  apiKey: "05565ac256aa47a6a7382658684fd21c",
});
export const voicebotController = (req, res, next) => {
  try {
    const { transcribedText } = req.body;
  } catch (error) {
    next(error);
  }
};
