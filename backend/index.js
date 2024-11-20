import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import axios from "axios";
import { createClient } from "@deepgram/sdk";
import { prompt1 } from "./utils/creditPrompt.js";
import fs from "fs";
import FormData from "form-data";
import { writeFile } from "fs/promises";
import { Buffer } from "buffer";
import path from "path";
import { model } from "mongoose";

dotenv.config();

if (!process.env.GROQ_API_KEY || !process.env.DEEPGRAM_API_KEY) {
  console.error("Missing API keys in .env file. Please add them.");
  process.exit(1);
}

const app = express();
const server = createServer(app);
const wsServer = new WebSocketServer({ noServer: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

server.on("upgrade", (req, socket, head) => {
  socket.on("error", handleSocketError);
  wsServer.handleUpgrade(req, socket, head, (ws) => {
    socket.removeListener("error", handleSocketError);
    wsServer.emit("connection", ws, req);
  });
});

const saveBase64AudioToFile = async (base64Data, outputPath) => {
  try {
    const audioBuffer = Buffer.from(base64Data, "base64");
    await writeFile(outputPath, audioBuffer);
    console.log(`Audio saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error saving audio file:", error);
    throw error;
  }
};

wsServer.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("error", handleSocketError);

  ws.on("message", async (data) => {
    console.log("Received audio data from client");
    const { base64Audio, sttProvider } = JSON.parse(data);
    console.log(base64Audio);
    const outputPath = path.resolve("./debug_audio.mp3");
    await saveBase64AudioToFile(base64Audio, outputPath);

    try {
      await processAudioBuffer(base64Audio, sttProvider, ws);
    } catch (error) {
      console.error("Error processing message:", error);
      sendError(ws, error.message);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

function handleSocketError(err) {
  console.error("Socket error:", err);
}

function sendError(ws, message) {
  ws.send(JSON.stringify({ success: false, error: message }));
}

async function processAudioBuffer(base64Audio, sttProvider, ws) {
  try {
    const transcribedText = await transcribeAudio(base64Audio, sttProvider);
    if (!transcribedText) {
      throw new Error("Transcription failed or returned empty text.");
    }

    const parsedResponse = await generateAICompletion(transcribedText);

    const ttsBuffer = await generateTTS(parsedResponse?.ttsData);
    if (!ttsBuffer) {
      throw new Error("Error generating TTS audio.");
    }

    ws.send(
      JSON.stringify({
        success: true,
        base64Data: ttsBuffer.toString("base64"),
        ttsData: parsedResponse?.ttsData,
      })
    );
  } catch (error) {
    console.error("Error in processAudioBuffer:", error);
    sendError(ws, error.message);
  }
}

async function transcribeAudio(base64Audio, sttProvider) {
  const formData = new FormData();

  // Save base64 audio to file
  const base64String = base64Audio.includes("base64,")
    ? base64Audio.split("base64,")[1]
    : base64Audio;

  const audioBuffer = Buffer.from(base64String, "base64");
  const outputPath = path.resolve("./debug_audio.mp3");

  await writeFile(outputPath, audioBuffer); // Save the base64 audio as a file

  // Append the file stream to FormData
  formData.append("file", fs.createReadStream(outputPath), "audio.mp3");
  formData.append("model", "whisper-large-v3");

  if (sttProvider !== "Deepgram") {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data?.text || null;
    } catch (error) {
      throw new Error(`Groq Transcription Error: ${error.message}`);
    }
  } else {
    try {
      const response = await axios.post(
        "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true",
        formData,
        {
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return (
        response.data?.results?.channels[0]?.alternatives[0]?.transcript || null
      );
    } catch (error) {
      throw new Error(`Deepgram Transcription Error: ${error.message}`);
    }
  }
}

async function generateAICompletion(transcribedText) {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: "user", content: transcribedText },
        { role: "system", content: prompt1 },
      ],
      model: "llama3-70b-8192",
      response_format: { type: "json_object" },
    });

    const completionText = response.choices[0]?.message?.content || "{}";

    // Parse JSON response
    return JSON.parse(completionText);
  } catch (error) {
    throw new Error("AI Completion Error: " + error.message);
  }
}

async function generateTTS(text) {
  console.log(text);

  if (!text) {
    throw new Error("No text provided for TTS generation.");
  }
  try {
    const response = await deepgram.speak.request(
      { text },
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
      return base64Audio;
    }
  } catch (error) {
    throw new Error("TTS Generation Error: " + error.message);
  }
}

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
