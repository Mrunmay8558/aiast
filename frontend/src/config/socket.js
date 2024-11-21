import { useContext, useEffect, useRef } from "react";
import { TranscriptionContext } from "../context/context";

const useWebSocket = (url) => {
  const { setTranscriptionText } = useContext(TranscriptionContext);
  const wsRef = useRef(null); // WebSocket instance
  const mediaRecorderRef = useRef(null); // MediaRecorder instance for live audio
  const audioChunksRef = useRef([]); // Store audio chunks

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(event.data); // Send audio chunk to backend WebSocket
          console.log("Sent audio chunk");
        }
      };

      mediaRecorder.onstart = () => {
        console.log("Recording started");
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped");
      };

      mediaRecorder.start(500); // Capture audio chunks every 100ms
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
      try {
        const responseData = JSON.parse(event.data);

        if (responseData.type === "transcription") {
          const transcript = responseData.transcript;
          console.log("Transcription received:", transcript);
          setTranscriptionText(transcript); // Update transcription state
        }

        if (responseData.type === "error") {
          console.error("Error from server:", responseData.message);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      stopRecording(); // Stop recording on WebSocket close
    };

    return () => {
      ws.close();
      stopRecording(); // Cleanup on component unmount
    };
  }, [url, setTranscriptionText]);

  return { startRecording, stopRecording };
};

export default useWebSocket;
