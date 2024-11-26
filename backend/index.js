import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import dotenv from "dotenv";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import Groq from "groq-sdk";
import { prompt1 } from "./utils/creditPrompt.js";

dotenv.config();

if (!process.env.DEEPGRAM_API_KEY || !process.env.GROQ_API_KEY) {
  console.error("Missing Deepgram API key in .env file. Please add it.");
  process.exit(1);
}

const app = express();
const server = createServer(app);
const wsServer = new WebSocketServer({ noServer: true });

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
    console.log(stream);

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

// Handle WebSocket upgrades
server.on("upgrade", (req, socket, head) => {
  socket.on("error", handleSocketError);
  wsServer.handleUpgrade(req, socket, head, (ws) => {
    socket.removeListener("error", handleSocketError);
    wsServer.emit("connection", ws, req);
  });
});

// Handle WebSocket connections
wsServer.on("connection", (ws) => {
  console.log("Client connected");
  const connectionMap = new Map(); // Store Deepgram connections

  ws.on("error", handleSocketError);

  ws.on("message", async (data) => {
    try {
      const { type, audioChunk, model } = JSON.parse(data);

      // Handle startRecording
      if (type === "startRecording") {
        if (connectionMap.has(ws)) {
          console.warn("Connection already active for this client");
          return;
        }

        const deepgramConnection = deepgram.listen.live({
          model: "nova-2",
          language: "en-US",
          smart_format: true,
          endpointing: 500,
        });

        connectionMap.set(ws, deepgramConnection);

        deepgramConnection.on(LiveTranscriptionEvents.Open, () => {
          console.log("Deepgram connection opened");
        });

        deepgramConnection.on(
          LiveTranscriptionEvents.Transcript,
          async (transcriptionData) => {
            const transcript =
              transcriptionData.channel.alternatives[0]?.transcript;
            if (transcript) {
              console.log("Transcript received:", transcript);

              let parsedResponse, ttsBuffer;
              if (model === "groq") {
                // Use Groq for AI Completion and TTS
                parsedResponse = await generateAICompletion(transcript);
                ttsBuffer = await generateTTS(parsedResponse?.ttsData);
              } else {
                // Use Deepgram for TTS only
                parsedResponse = { ttsData: transcript }; // No external AI processing
                ttsBuffer = await generateTTS(transcript);
              }

              ws.send(
                JSON.stringify({
                  success: true,
                  base64Data: ttsBuffer.toString("base64"),
                  ttsData: parsedResponse?.ttsData,
                })
              );
            }
          }
        );

        deepgramConnection.on(LiveTranscriptionEvents.Close, () => {
          console.log("Deepgram connection closed");
        });

        deepgramConnection.on(LiveTranscriptionEvents.Error, (err) => {
          console.error("Deepgram error:", err);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Deepgram transcription error occurred.",
            })
          );
        });
      }

      // Handle stopRecording
      if (type === "stopRecording") {
        const deepgramConnection = connectionMap.get(ws);
        if (deepgramConnection) {
          deepgramConnection.close();
          connectionMap.delete(ws);
          console.log("Deepgram connection closed by client");
        }
      }

      // Handle audioChunk
      if (type === "audioChunk" && connectionMap.has(ws)) {
        const audioBuffer = Buffer.from(audioChunk);
        connectionMap.get(ws).send(audioBuffer);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: error.message,
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    const deepgramConnection = connectionMap.get(ws);
    if (deepgramConnection) {
      deepgramConnection.close();
      connectionMap.delete(ws);
    }
  });
});

// Handle WebSocket errors
function handleSocketError(err) {
  console.error("Socket error:", err);
}

// Start the server
const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
