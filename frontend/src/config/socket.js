import React, { useState, useRef, useEffect, useContext } from "react";
import { createSilenceDetector } from "../components/Vad";
import { TranscriptionContext } from "../context/context";

const useWebSocket = (url) => {
  const [isRecording, setIsRecording] = useState(false);
  const { setTranscriptionText } = useContext(TranscriptionContext);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const socketRef = useRef(null);
  const isBufferingRef = useRef(false);
  const [isSilent, setIsSilent] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  const startRecording = async () => {
    // Start WebSocket connection when recording starts
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      socketRef.current = new WebSocket(url);

      socketRef.current.onopen = () => {
        console.log("WebSocket connected");
      };

      socketRef.current.onmessage = (event) => {
        try {
          const responseData = JSON.parse(event.data);
          console.log("resData", responseData);

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

      socketRef.current.onclose = () => {
        console.log("WebSocket disconnected");
      };
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleStop;

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(1100);
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing audio devices:", err);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleDataAvailable = (event) => {
    if (
      event.data.size > 0 &&
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN
    ) {
      const chunk = event.data;
      chunksRef.current.push(chunk);

      if (!isBufferingRef.current && chunksRef.current.length > 0) {
        isBufferingRef.current = true;

        sendNextChunk();
      }
    }
  };

  const sendNextChunk = () => {
    if (chunksRef.current.length > 0) {
      const chunkToSend = chunksRef.current.shift();
      socketRef.current.send(chunkToSend);

      setTimeout(() => {
        if (chunksRef.current.length > 0) {
          sendNextChunk();
        } else {
          isBufferingRef.current = false;
        }
      }, 1000);
    }
  };

  const handleStop = () => {
    chunksRef.current = [];
    isBufferingRef.current = false;
  };

  const onSilence = () => {
    console.log("Silence Detected");
    setIsSilent(true);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ type: "audioStop", audioStop: true, key: "json" })
      );
    }
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

  useEffect(() => {
    const silenceDetector = createSilenceDetector({
      noiseThreshold: 10,
      silenceDurationThreshold: 2000,
      wordGapThreshold: 500,
      onSilence,
      onSound: () => {
        console.log("User is speaking.");
        setIsSilent(false);
        setIsSpeaking(true);
      },
    });

    silenceDetector.start();

    return () => {
      silenceDetector.stop();
    };
  }, []);

  return {
    startRecording,
    stopRecording,
  };
};

export default useWebSocket;
