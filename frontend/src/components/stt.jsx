import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { api } from "../config/socket";

const BaseURL = "http://localhost:8000/";

const STT = ({ setTranscriptionText, addChat, setSubmit }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceStart = useRef(null);
  const silenceDurationThreshold = 3000; // 3 seconds threshold for longer pauses
  const noiseThreshold = 10; // Threshold to filter out background noise

  useEffect(() => {
    if (recording) {
      checkForSilence();
    }
    return () => {
      stopRecording();
    };
  }, [recording]);

  const startRecording = () => {
    // Reset audio chunks before starting a new recording
    audioChunks.current = [];
    silenceStart.current = null;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          } else {
            console.warn("Received empty data chunk.");
          }
        };

        mediaRecorder.onstop = () => {
          if (audioChunks.current.length > 0) {
            const audioBlob = new Blob(audioChunks.current, {
              type: "audio/wav",
            });
            sttPost(audioBlob);
          } else {
            console.error("No audio chunks collected.");
          }
        };

        mediaRecorder.start();
        setRecording(true);
        console.log("Recording started...");
      })
      .catch((error) => {
        console.error("Microphone access denied:", error);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
      setRecording(false);
    }
  };

  const sttPost = async (audioBlob) => {
    if (audioBlob && audioBlob?.size > 0) {
      const audioFile = new File([audioBlob], "recording.wav", {
        type: "audio/wav",
      });
      try {
        const formData = new FormData();
        formData.append("audioFile", audioFile);

        // const response = await axios.post(
        //   `${BaseURL}v1/transcribe-audio`,
        //   formData,
        //   {
        //     headers: {
        //       "Content-Type": "multipart/form-data",
        //     },
        //   }
        // );
        const res = await api.post(`${BaseURL}v1/transcribe-audio`, formData);

        const transcriptionText = res.transcribedText;
        setTranscriptionText(transcriptionText);
        addChat(transcriptionText);
        setSubmit(true);
      } catch (error) {
        console.error("Error during transcription:", error);
      }
    } else {
      console.error("AudioBlob is empty or null");
    }
  };

  const checkForSilence = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);

    // Calculate the root mean square (RMS) to filter out background noise
    const rms = Math.sqrt(
      dataArray.reduce((sum, value) => sum + (value - 128) ** 2, 0) /
        dataArray.length
    );

    const isSilent = rms < noiseThreshold;

    if (isSilent) {
      if (!silenceStart.current) {
        silenceStart.current = Date.now();
      } else if (Date.now() - silenceStart.current > silenceDurationThreshold) {
        stopRecording(); // Stop recording after the defined silence threshold
      }
    } else {
      silenceStart.current = null; // Reset silence start if sound is detected
    }

    if (recording) {
      requestAnimationFrame(checkForSilence);
    }
  };

  return (
    <>
      <div>
        <button onClick={startRecording} disabled={recording}>
          Start
        </button>
        <button onClick={stopRecording} disabled={!recording}>
          Stop Recording
        </button>
      </div>
    </>
  );
};

export default STT;
