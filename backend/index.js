import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error(
    "Missing API key. Ensure GROQ_API_KEY is set in your .env file."
  );
  process.exit(1);
}

const app = express();
const server = createServer(app);
const wsServer = new WebSocketServer({ noServer: true });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// WebSocket Error Handler
function onSocketPreError(err) {
  console.error("Socket error:", err);
}

// Handle HTTP Upgrade to WebSocket
server.on("upgrade", (req, socket, head) => {
  socket.on("error", onSocketPreError);
  wsServer.handleUpgrade(req, socket, head, (ws) => {
    socket.removeListener("error", onSocketPreError);
    wsServer.emit("connection", ws, req);
  });
});

// Handle WebSocket Connections
wsServer.on("connection", (ws, req) => {
  console.log("Client connected");

  ws.on("error", onSocketPreError);

  ws.on("message", async (msg, isBinary) => {
    try {
      console.log("Received audio data from client");

      // Assuming msg is a buffer containing audio data
      const audioBuffer = Buffer.from(msg);

      // Transcribe the audio buffer using Groq Whisper API
      const transcriptionResponse = await groq.audio.transcriptions.create({
        audio: audioBuffer,
        model: "whisper-1", // Ensure this is the correct Whisper model
        format: "json",
      });

      const transcribedText = transcriptionResponse?.text;
      if (!transcribedText) {
        throw new Error("Transcription failed or returned empty text.");
      }

      console.log("Transcribed Text:", transcribedText);

      // Process transcription through the Groq language model
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "user", content: transcribedText },
          {
            role: "system",
            content: "Respond in JSON format with required details.",
          },
        ],
        model: "llama3-70b-8192", // Specify the desired Groq model
        response_format: { type: "json_object" },
      });

      const chatCompletion = completion.choices[0]?.message?.content || "{}";
      console.log("LLM Response:", chatCompletion);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(chatCompletion);
      } catch (err) {
        throw new Error("Failed to parse LLM response: " + chatCompletion);
      }

      // Send JSON response back to the client
      ws.send(JSON.stringify({ success: true, data: parsedResponse }));
    } catch (error) {
      console.error("Error processing audio or LLM response:", error);
      ws.send(JSON.stringify({ success: false, error: error.message }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
