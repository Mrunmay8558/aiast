import { useContext, useEffect, useRef } from "react";
import { TranscriptionContext } from "../context/context";
import { createSilenceDetector } from "../components/Vad";
import { str1, str2, str3 } from "../asset/audios/questions";

const useWebSocket = (url) => {
  const { setTranscriptionText } = useContext(TranscriptionContext);
  const wsRef = useRef(null); // WebSocket instance
  const silenceDetectorRef = useRef(null); // Silence detector instance
  const audioRef = useRef(null); // Ref to manage audio playback
  const audioChunks = useRef([]); // Buffer for collected audio chunks
  let audioSendInterval = null; // Interval ID for sending audio
  let dgConnected = null; // Deepgram connection status
  let payload;

  const startRecording = () => {
    // Open WebSocket connection
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log("WebSocket connection opened");
        wsRef.current.send(
          JSON.stringify({
            type: "startRecording",
            connection: "true",
            key: "json",
          })
        );
      };

      wsRef.current.onmessage = (event) => {
        try {
          const responseData = JSON.parse(event.data);
          console.log(responseData);

          if (responseData?.success && responseData?.type === "transcript") {
            const transcript = responseData.ttsData;
            console.log("Transcription received:", transcript);
            setTranscriptionText(transcript); // Update transcription state

            if (responseData?.base64Data) {
              // Handle TTS base64 audio playback
              const audioData = `data:audio/wav;base64,${responseData?.base64Data}`;
              playAudio(audioData);
            }
          } else if (responseData?.type === "dgConn") {
            console.log("Deepgram connection opened");
            dgConnected = responseData?.deepgramConnection;
          }

          if (responseData.type === "error") {
            console.error("Error from server:", responseData.message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket connection closed");
        stopSilenceDetector(); // Stop silence detection on WebSocket close
      };
    }

    // Start silence detection
    startSilenceDetector();
  };

  const stopRecording = () => {
    // Send stop signal to the WebSocket server
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "stopRecording",
          connection: false,
          key: "json",
        })
      );
    }

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop silence detection
    stopSilenceDetector();
  };

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
      console.log("Main audio paused");

      // Array of random audio snippets
      const randomAudioSnippets = [str1, str2, str3];

      // Choose a random snippet from the array
      const randomSnippet =
        randomAudioSnippets[
          Math.floor(Math.random() * randomAudioSnippets.length)
        ];
      const audioSrc = `data:audio/mp3;base64,${randomSnippet}`;
      // Play the randomly selected snippet
      const snippetAudio = new Audio(audioSrc);
      snippetAudio
        .play()
        .then(() => {
          console.log("Playing random snippet:", audioSrc);
        })
        .catch((error) => {
          console.error("Error playing random snippet:", error);
        });
    }
  };

  const startSilenceDetector = async () => {
    silenceDetectorRef.current = createSilenceDetector({
      noiseThreshold: 10,
      silenceDurationThreshold: 1600,
      wordGapThreshold: 1000,
      onSilence: () => {
        console.log("Silence detected. Sending stop flag to backend...");
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({ type: "audioStop", audioStop: true, key: "json" })
          );
        }
      },
      onUtterance: (eventData) => {
        console.log(
          "Utterance detected. Sending audio chunks to backend...",
          eventData
        );

        pauseAudio(); // Pause playback when speaking starts

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          // Ensure there is data to send
          if (eventData?.size > 0 && dgConnected !== null) {
            wsRef.current.send(eventData); // Send audio blob via WebSocket
            console.log("Audio chunk sent to backend");
          }
        }
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
    if (audioSendInterval) {
      clearInterval(audioSendInterval);
      audioSendInterval = null;
      dgConnected = null;
    }
  };

  return { startRecording, stopRecording };
};

export default useWebSocket;
