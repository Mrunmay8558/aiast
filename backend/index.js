import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import dotenv from "dotenv";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import Groq from "groq-sdk";
import { prompt1 } from "./utils/creditPrompt.js";

dotenv.config();

if (!process.env.DEEPGRAM_API_KEY || !process.env.GROQ_API_KEY) {
  console.error("Missing API keys in .env file. Please add them.");
  process.exit(1);
}

const app = express();
const server = createServer(app);
const wsServer = new WebSocketServer({ noServer: true });

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Generate AI Completion using Groq
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
    return JSON.parse(completionText);
  } catch (error) {
    throw new Error("AI Completion Error: " + error.message);
  }
}

// Generate TTS audio
async function generateTTS(text) {
  if (!text) {
    throw new Error("No text provided for TTS generation.");
  }
  try {
    const response = await deepgram.speak.request(
      { text },
      {
        encoding: "linear16",
        container: "wav",
      }
    );

    const stream = await response.getStream();
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return buffer.toString("base64");
  } catch (error) {
    throw new Error("TTS Generation Error: " + error.message);
  }
}

// WebSocket Upgrade Handling
server.on("upgrade", (req, socket, head) => {
  socket.on("error", handleSocketError);
  wsServer.handleUpgrade(req, socket, head, (ws) => {
    socket.removeListener("error", handleSocketError);
    wsServer.emit("connection", ws, req);
  });
});

wsServer.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("error", handleSocketError);

  let connection = null;

  ws.on("message", async (message) => {
    try {
      console.log("Received message:", message);
      const parsedMessage = JSON.parse(message);
      // console.log("Received message:", parsedMessage);

      if (parsedMessage.connection === true && !connection) {
        console.log("Starting Deepgram connection");

        connection = deepgram.listen.live({
          language: "en-US",
          smart_format: true,
          endpointing: 500,
        });

        connection.on(LiveTranscriptionEvents.Open, () => {
          console.log("Deepgram connection opened.");
        });

        connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
          const transcript = data.channel.alternatives[0]?.transcript;
          if (transcript) {
            console.log("Transcript:", transcript);

            const aiResponse = await generateAICompletion(transcript);
            const ttsBuffer = await generateTTS(aiResponse?.ttsData);

            if (!ttsBuffer) throw new Error("TTS Generation Failed.");

            ws.send(
              JSON.stringify({
                success: true,
                base64Data: ttsBuffer,
                ttsData: aiResponse?.ttsData,
              })
            );
          }
        });

        connection.on(LiveTranscriptionEvents.Error, (err) => {
          console.error("Deepgram error:", err);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "An error occurred with the transcription.",
            })
          );
        });

        connection.on(LiveTranscriptionEvents.Close, () => {
          console.log("Deepgram connection closed.");
          connection = null;
        });
      } else if (parsedMessage.connection === false && connection) {
        console.log("Closing Deepgram connection");
        connection?.close();
        connection = null;
      }
    } catch (error) {
      console.error("Error handling message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: error.message || "An unknown error occurred.",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected.");
    if (connection) {
      connection.close();
      connection = null;
    }
  });
});

// WebSocket Error Handling
function handleSocketError(err) {
  console.error("WebSocket error:", err);
}

// Start Server
const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
