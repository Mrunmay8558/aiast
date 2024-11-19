import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import fs from "fs";
import { Readable } from "stream";
import axios from "axios"; // Use axios for HTTP requests
import FormData from "form-data"; // Import FormData for handling multipart data
import { prompt1 } from "./utils/creditPrompt.js";

dotenv.config();

// Validate environment variables
if (!process.env.GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY in .env file. Please add it.");
  process.exit(1);
}

const app = express();
const server = createServer(app);
const wsServer = new WebSocketServer({ noServer: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// WebSocket error handler
function handleSocketError(err) {
  console.error("Socket error:", err);
}

// Upgrade HTTP connection to WebSocket
server.on("upgrade", (req, socket, head) => {
  socket.on("error", handleSocketError);
  wsServer.handleUpgrade(req, socket, head, (ws) => {
    socket.removeListener("error", handleSocketError);
    wsServer.emit("connection", ws, req);
  });
});

// WebSocket connection handler
wsServer.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("error", handleSocketError);

  let audioBuffer = Buffer.alloc(0);

  ws.on("message", async (msg) => {
    console.log("Received audio data from client");
    try {
      // Append received audio data

      // Check if buffer exceeds the maximum size

      if (msg) {
        console.log("Processing buffered audio data");
        await processAudioBuffer(msg, ws);
        audioBuffer = Buffer.alloc(0); // Reset buffer after processing
      }
    } catch (error) {
      console.error("Error processing message:", error);

      ws.send(JSON.stringify({ success: false, error: error.message }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Process audio buffer

async function processAudioBuffer(buffer, ws) {
  try {
    console.log("Processing audio buffer...");

    // Ensure the buffer is not empty
    if (!buffer || buffer.length === 0) {
      throw new Error("Received empty audio buffer.");
    }

    // Convert buffer to readable stream
    const audioStream = new Readable();
    audioStream.push(buffer); // Push buffer into stream
    audioStream.push(null); // Signal end of stream

    const debugFile = "debug_audio.wav";
    fs.writeFileSync(debugFile, buffer);

    // Prepare form data to send the audio stream
    const formData = new FormData();
    formData.append("file", audioStream, "audio.wav"); // Pass only name, not an options object
    formData.append("model", "distil-whisper-large-v3-en");
    formData.append("response_format", "verbose_json");

    const transcriptionResponse = await axios.post(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("Transcription successful:", transcriptionResponse?.data?.text);

    const transcribedText = transcriptionResponse.data?.text;
    if (!transcribedText) {
      throw new Error("Transcription failed or returned empty text.");
    }

    const completionResponse = await groq.chat.completions.create({
      messages: [
        { role: "user", content: transcribedText },
        {
          role: "system",
          content: prompt1,
        },
      ],
      model: "llama3-70b-8192",
      response_format: { type: "json_object" },
    });

    const completionText =
      completionResponse.choices[0]?.message?.content || "{}";
    console.log("LLM Response:", completionText);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(completionText);
    } catch (error) {
      throw new Error("Failed to parse LLM response: " + completionText);
    }

    // Send the parsed response back to the client
    ws.send(JSON.stringify({ success: true, data: parsedResponse }));
  } catch (error) {
    console.error("Error processing audio buffer:", error.message);
    ws.send(JSON.stringify({ success: false, error: error.message }));
  }
}

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
