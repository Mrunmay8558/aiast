import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import dotenv from "dotenv";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import Groq from "groq-sdk";
import { prompt1 } from "./utils/creditPrompt.js";
import fs from "fs";

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

// Function to calculate time taken by each step
function calculateTimeTaken(startTime, endTime) {
  return endTime - startTime;
}

// Generate AI Completion using Groq
async function generateAICompletion(transcribedText, llmcontext) {
  const startTime = Date.now();
  try {
    console.log("llmContext", llmcontext);

    const response = await groq.chat.completions.create({
      messages: [
        { role: "user", content: transcribedText },
        { role: "system", content: prompt1(llmcontext) },
      ],
      model: "llama3-70b-8192",
      response_format: { type: "json_object" },
    });

    const completionText = response.choices[0]?.message?.content || "{}";
    const endTime = Date.now();
    return {
      result: JSON.parse(completionText),
      timeTaken: calculateTimeTaken(startTime, endTime),
    };
  } catch (error) {
    throw new Error("AI Completion Error: " + error.message);
  }
}

// Generate TTS audio
async function generateTTS(text) {
  const startTime = Date.now();
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
    const endTime = Date.now();
    return {
      result: buffer.toString("base64"),
      timeTaken: calculateTimeTaken(startTime, endTime),
    };
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
  let inactivityTimer = null;
  let llmcontext = "";
  let tranlatedAudioConcat = "";
  let parsedMessage;
  let audioChunkFr;
  let sttStartTime = null;

  ws.on("message", async (message) => {
    try {
      if (message.toString("utf-8").includes("json")) {
        const decodedMessage = message.toString("utf-8");
        parsedMessage = JSON.parse(decodedMessage);
      } else {
        audioChunkFr = message;
      }

      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }

      if (!connection) {
        connection = deepgram.listen.live({
          language: "en-US",
          model: "nova-2",
          smart_format: true,
          endpointing: 1000,
        });

        connection.on(LiveTranscriptionEvents.Open, () => {
          console.log("Deepgram connection opened.");
          ws.send(
            JSON.stringify({
              type: "dgConn",
              deepgramConnection: true,
            })
          );
        });

        connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
          const transcript = data.channel.alternatives[0]?.transcript;
          if (transcript) {
            tranlatedAudioConcat += transcript;

            if (
              parsedMessage?.type === "audioStop" &&
              parsedMessage?.audioStop === true
            ) {
              const sttEndTime = Date.now();
              const sttTimeTaken = calculateTimeTaken(sttStartTime, sttEndTime);

              console.log(`STT completed in ${sttTimeTaken} ms`);
              tranlatedAudioConcat = "";

              const aiResponse = await generateAICompletion(
                transcript,
                llmcontext
              );
              llmcontext += aiResponse.result?.ttsData;

              const ttsBuffer = await generateTTS(aiResponse.result?.ttsData);
              if (!ttsBuffer) throw new Error("TTS Generation Failed.");

              ws.send(
                JSON.stringify({
                  success: true,
                  base64Data: ttsBuffer.result,
                  ttsData: aiResponse.result?.ttsData,
                  timeTaken: {
                    sttGeneration: sttTimeTaken,
                    aiCompletion: aiResponse.timeTaken,
                    ttsGeneration: ttsBuffer.timeTaken,
                  },
                })
              );
            }
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
        });
      }

      if (audioChunkFr && connection) {
        if (!sttStartTime) sttStartTime = Date.now(); // Start timing on first audio chunk
        const audioBuffer = Buffer.from(audioChunkFr, "base64");
        connection?.send(audioBuffer);
        console.log("Sent audio chunk to Deepgram.");
      }

      inactivityTimer = setTimeout(() => {
        console.log("Closing Deepgram connection due to inactivity.");
        if (connection) {
          connection.finish();
          connection = null;
        }
      }, 10000);
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
      connection.finish();
      connection = null;
    }
  });
});

function handleSocketError(err) {
  console.error("WebSocket error:", err);
}

const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
