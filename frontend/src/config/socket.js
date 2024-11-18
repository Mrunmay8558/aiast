import { useContext, useEffect } from "react";
import { TranscriptionContext } from "../context/context";

const useWebSocket = (url) => {
  const { setTranscriptionText } = useContext(TranscriptionContext);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("Connected to WebSocket server");

      // Example: Send audio data
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        mediaRecorder.start(1000); // Send audio chunks every second
      });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.success) {
        console.log("LLM Response:", data.response);
        setTranscriptionText(data.response);
      } else {
        console.error("Error:", data.error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, [url, setTranscriptionText]);
};

export default useWebSocket;
