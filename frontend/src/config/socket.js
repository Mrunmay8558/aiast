import { useContext, useEffect, useRef } from "react";
import { TranscriptionContext } from "../context/context";
import testAudio from "../asset/testAudio.mp3";

const useWebSocket = (url) => {
  const { setTranscriptionText, ttsProvider, sttProvider } =
    useContext(TranscriptionContext);
  const wsRef = useRef(null); // Persist WebSocket across renders
  const mediaRecorderRef = useRef(null); // Store MediaRecorder instance

  // Utility to convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Fetch and convert audio file to a Base64 string
  const getAudioBase64 = async (filePath) => {
    try {
      const response = await fetch(filePath);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      return arrayBufferToBase64(arrayBuffer);
    } catch (error) {
      console.error("Error converting file to Base64:", error);

      throw error;
    }
  };

  const startRecording = async () => {
    try {
      // Send the test audio file (optional step)
      const audioBase64 = await getAudioBase64(testAudio);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const payload = {
          base64Audio: audioBase64, // Send audio as Base64 string
          sttProvider: sttProvider || "Deepgram", // Use Deepgram for STT
          ttsProvider: ttsProvider || "Deepgram", // Use Deepgram for TTS
        };
        console.log(payload);

        wsRef.current.send(JSON.stringify(payload)); // Send the payload as JSON
        console.log("Sent test audio file as Base64");
      }
    } catch (error) {
      console.error("Error during startRecording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      console.log("Recording stopped");
    }
  };

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      startRecording(); // Automatically start recording on connection
    };

    ws.onmessage = (event) => {
      try {
        const responseData = JSON.parse(event.data);
        const { success, base64Data, ttsData, error } = responseData;

        console.log("Received message:", responseData);

        if (success) {
          console.log("TTS Data:", ttsData);
          setTranscriptionText(ttsData); // Update transcription text state
          if (base64Data) {
            // Optionally handle TTS base64 audio for playback or further processing
            const audio = new Audio(`data:audio/wav;base64,${base64Data}`);
            audio.play(); // Play the received TTS audio
          }
        } else {
          console.error("Error:", error);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      stopRecording(); // Stop recording if the connection closes
    };

    return () => {
      ws.close();
      stopRecording(); // Cleanup recorder on unmount
    };
  }, [url, setTranscriptionText]);

  return { startRecording, stopRecording };
};

export default useWebSocket;
