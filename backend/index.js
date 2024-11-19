import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import axios from "axios";
import { createClient } from "@deepgram/sdk";
import { prompt1 } from "./utils/creditPrompt.js";

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

function handleSocketError(err) {
  console.error("Socket error:", err);
}

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

  ws.on("message", async (data) => {
    console.log("Received audio data from client");
    try {
      const { buffer, sttProvider, ttsProvider } = JSON.parse(data);

      if (!buffer || !sttProvider || !ttsProvider) {
        throw new Error("Invalid data received from client.");
      }

      const audioBuffer = Buffer.from(buffer, "base64");

      await processAudioBuffer(audioBuffer, ws, sttProvider, ttsProvider);
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ success: false, error: error.message }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

async function processAudioBuffer(buffer, ws, sttProvider, ttsProvider) {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error("Received empty audio buffer.");
    }

    const base64Audio = buffer.toString("base64");

    let transcribedText;

    // Speech-to-Text Processing
    if (sttProvider === "Groq") {
      const transcriptionResponse = await axios.post(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          audio: `data:audio/wav;base64,${base64Audio}`,
          model: "distil-whisper-large-v3-en",
          response_format: "verbose_json",
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      transcribedText = transcriptionResponse.data?.text;
      if (!transcribedText) {
        throw new Error("Groq transcription failed or returned empty text.");
      }
    } else if (sttProvider === "Deepgram") {
      const transcriptionResponse = await axios.post(
        "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true",
        { url: `data:audio/wav;base64,${base64Audio}` },
        {
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      transcribedText =
        transcriptionResponse.data?.results?.channels[0]?.alternatives[0]
          ?.transcript;
      if (!transcribedText) {
        throw new Error(
          "Deepgram transcription failed or returned empty text."
        );
      }
    } else {
      throw new Error("Unsupported STT provider.");
    }

    // Generate AI Completion
    const completionResponse = await groq.chat.completions.create({
      messages: [
        { role: "user", content: transcribedText },
        { role: "system", content: prompt1 },
      ],
      model: "llama3-70b-8192",
      response_format: { type: "json_object" },
    });

    const completionText =
      completionResponse.choices[0]?.message?.content || "{}";

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(completionText);
    } catch (error) {
      throw new Error("Failed to parse LLM response: " + completionText);
    }

    // Text-to-Speech Processing
    const ttsResponse = await deepgram.speak.request(
      { text: parsedResponse?.ttsData },
      {
        model: "aura-asteria-en",
        encoding: "linear16",
        container: "wav",
      }
    );

    const stream = await ttsResponse.getStream();
    if (stream) {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const ttsBuffer = Buffer.concat(chunks);
      const base64TTSAudio = ttsBuffer.toString("base64");

      ws.send(
        JSON.stringify({
          success: true,
          base64Data: base64TTSAudio,
          ttsData: parsedResponse?.ttsData,
        })
      );
    } else {
      throw new Error("Error generating TTS audio");
    }
  } catch (error) {
    console.error("Error in processAudioBuffer:", error);
    ws.send(JSON.stringify({ success: false, error: error.message }));
  }
}

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
