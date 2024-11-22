import { useContext, useEffect, useRef } from "react";
import { TranscriptionContext } from "../context/context";
import { createSilenceDetector } from "../components/Vad";

const useWebSocket = (url) => {
  const { setTranscriptionText } = useContext(TranscriptionContext);
  const wsRef = useRef(null); // WebSocket instance
  const silenceDetectorRef = useRef(null); // Silence detector instance
  const audioRef = useRef(null); // Ref to manage audio playback

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
      try {
        const responseData = JSON.parse(event.data);
        console.log(responseData);

        if (responseData?.success) {
          const transcript = responseData.ttsData;
          console.log("Transcription received:", transcript);
          setTranscriptionText(transcript); // Update transcription state

          if (responseData?.base64Data) {
            // Handle TTS base64 audio playback
            const audioData = `data:audio/wav;base64,${responseData?.base64Data}`;
            playAudio(audioData);
          }
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
      stopSilenceDetector(); // Stop silence detection on WebSocket close
    };

    return () => {
      ws.close();
      stopSilenceDetector(); // Cleanup on component unmount
    };
  }, [url, setTranscriptionText]);

  const playAudio = (audioData) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioData);
    audioRef.current = audio;

    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  };

  const pauseAudio = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      console.log("Audio paused");
    }
  };

  const startSilenceDetector = async () => {
    silenceDetectorRef.current = createSilenceDetector({
      noiseThreshold: 10,
      silenceDurationThreshold: 3000,
      wordGapThreshold: 500,
      onSilence: (audioBuffer) => {
        // Send audio buffer to WebSocket
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(audioBuffer);
          console.log("Sent audio buffer on silence");
        }
      },
      onUtterance: () => {
        console.log("User started speaking");
        pauseAudio(); // Pause audio playback when user starts speaking
      },
    });

    try {
      await silenceDetectorRef.current.start();
      console.log("Silence detector started");
    } catch (error) {
      console.error("Error starting silence detector:", error);
    }
  };

  const stopSilenceDetector = () => {
    if (silenceDetectorRef.current) {
      silenceDetectorRef.current.stop();
      silenceDetectorRef.current = null;
      console.log("Silence detector stopped");
    }
  };

  return { startSilenceDetector, stopSilenceDetector };
};

export default useWebSocket;
