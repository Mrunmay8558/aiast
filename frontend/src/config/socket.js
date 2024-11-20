import { useContext, useEffect, useRef } from "react";
import { TranscriptionContext } from "../context/context";
import testAudio from "../asset/testAudio.mp3";

const useWebSocket = (url) => {
  const { setTranscriptionText,ttsProvider, setTtsProvider,sttProvider, setSttProvider } = useContext(TranscriptionContext);
  const wsRef = useRef(null); // Persist WebSocket across renders
  const mediaRecorderRef = useRef(null); // Store MediaRecorder instance

  // Fetch and convert audio file to an ArrayBuffer
  const getAudioArrayBuffer = async (filePath) => {
    try {
      const response = await fetch(filePath);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      return arrayBuffer;
    } catch (error) {
      console.error("Error converting file to ArrayBuffer:", error);
      throw error;
    }
  };

  const startRecording = async () => {
    try {
      // Send the test audio file
      const audioArrayBuffer = await getAudioArrayBuffer(testAudio);
      // if (wsRef.current?.readyState === WebSocket.OPEN) {
      //   wsRef.current.send(audioArrayBuffer);
      //   console.log("Sent test audio file as ArrayBuffer");
      // }

      // Access microphone and start recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (
          event.data.size > 0 &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          wsRef.current.send(event.data,);
          console.log("Sent live audio chunk");
        }
      };

      mediaRecorder.start(100); // Record audio in 100ms chunks
      mediaRecorderRef.current = mediaRecorder;
      console.log("Recording started");
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
        const data = JSON.parse(event.data).data;
        const resSuccess = JSON.parse(event.data).success;
        console.log("Received message:", data);

        if (resSuccess) {
          console.log("LLM Response:", data.ttsData);
          setTranscriptionText(data.ttsData);
        } else {
          console.error("Error:", data.error);
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
