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

  ws.on("error", handleSocketError);

  const connection = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    smart_format: true,
    encoding: "linear16",
    channels: 1,
    sample_rate: 16000,
    interim_results: true,
    utterance_end_ms: "1000",
    endpointing: 500,
    vad_events: true,
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log("Deepgram live transcription connection opened");

    // Relay transcription results to the client
    connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
      const transcript = data.channel.alternatives[0].transcript;

      if (transcript) {
        console.log("transcript", transcript);

        const parsedResponse = await generateAICompletion(transcript);
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
      }
    });

    connection.on(LiveTranscriptionEvents.Metadata, (metadata) => {
      console.log("Received metadata:", metadata);
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log("Deepgram live transcription connection closed");
    });

    connection.on(LiveTranscriptionEvents.Error, (err) => {
      console.error("Deepgram live transcription error:", err);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Transcription error occurred.",
        })
      );
    });
  });

  ws.on("message", (data) => {
    console.log("Received audio data from client");
    const audioChunk = Buffer.from(data);

    // Send the audio chunk to Deepgram
    connection.send(audioChunk);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
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
