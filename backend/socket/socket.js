import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import axios from "axios";
import FormData from "form-data";
import { Buffer } from "buffer";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WHISPER_API_KEY = process.env.GROQ_API_KEY;

if (!OPENAI_API_KEY || !WHISPER_API_KEY) {
  throw new Error("API keys are missing");
}

const agentTools = [new TavilySearchResults({ maxResults: 3 })];
const agentModel = new ChatOpenAI({ temperature: 0, apiKey: OPENAI_API_KEY });
const agentCheckpointer = new MemorySaver();

const agent = createReactAgent({
  llm: agentModel,
  tools: agentTools,
  checkpointSaver: agentCheckpointer,
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("upload_audio", async (data) => {
    try {
      if (!data) {
        throw new Error("File data is missing");
      }

      // Convert the ArrayBuffer to Buffer
      const audioBuffer = Buffer.from(new Uint8Array(data));

      // Create a FormData instance and append the audio buffer
      const form = new FormData();
      form.append("file", audioBuffer, {
        filename: "audio.wav",
        contentType: "audio/wav",
      });
      form.append("model", "distil-whisper-large-v3-en"); // Add the model parameter

      // Convert FormData to a stream
      const formHeaders = form.getHeaders();

      // Convert speech to text using Groq Whisper
      const whisperResponse = await axios.post(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        form,
        {
          headers: {
            ...formHeaders,
            Authorization: `Bearer ${WHISPER_API_KEY}`,
            response_format: "verbose_json",
          },
        }
      );

      const text = whisperResponse.data.text;
      socket.emit("transcribed_text", {
        response: text,
      });
      // Generate a response using LangGraph agent
      const agentResponse = await agent.invoke(
        { messages: [new HumanMessage(text)] },
        { configurable: { thread_id: socket.id } }
      );

      // Send the generated response back to the client
      socket.emit("response_generated", {
        genratedResponse:
          agentResponse.messages[agentResponse.messages.length - 1].content,
      });
    } catch (error) {
      console.error(
        "Error processing audio:",
        error.response?.data || error.message
      );
      socket.emit("error", "Error processing audio.");
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

export { app, server };
