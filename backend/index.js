import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import dotenv from "dotenv";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import Groq from "groq-sdk";
import { prompt1, prompt2 } from "./utils/creditPrompt.js";

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

async function generateAICompletion(transcribedText, formData) {
  console.log(formData);

  console.log("Entered into AI Generation");

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: "user", content: transcribedText },
        { role: "system", content: prompt2(formData) },
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
  console.log("Entered into Text to Speech");

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
  let parsedMessage;
  let translatedConcat = "";
  console.log("Client connected");

  ws.on("error", handleSocketError);

  const connection = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    smart_format: true,
    endpointing: 500,
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    let formData = {};
    console.log("Deepgram live transcription connection opened");

    // Relay transcription results to the client
    connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
      const transcript = data.channel.alternatives[0].transcript;
      translatedConcat += transcript;
      console.log(translatedConcat);
      if (parsedMessage?.type === "audioStop" && parsedMessage?.audioStop) {
        const parsedResponse = await generateAICompletion(
          translatedConcat,
          formData
        );

        formData = parsedResponse?.formData;

        translatedConcat = "";
        parsedMessage = {};
        const ttsBuffer = await generateTTS(parsedResponse?.ttsData);
        if (!ttsBuffer) {
          throw new Error("Error generating TTS audio.");
        }
        ws.send(
          JSON.stringify({
            success: true,
            base64Data: ttsBuffer.toString("base64"),
            ttsData: parsedResponse?.ttsData,
            loanform: parsedResponse?.formData,
            next_state: parsedResponse?.next_state,
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
    if (
      typeof data.toString("utf-8") === "string" &&
      data.toString("utf-8").includes("json")
    ) {
      console.log("Its is an json object");
      const decodedMessage = data.toString("utf-8");
      parsedMessage = JSON.parse(decodedMessage);
    } else {
      const audioChunk = Buffer.from(data);
      connection.send(audioChunk);
    }
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
