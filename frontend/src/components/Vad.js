export const createSilenceDetector = ({
  noiseThreshold = 10,
  silenceDurationThreshold = 3000,
  wordGapThreshold = 500,
  onSilence,
  onUtterance,
}) => {
  const audioContextRef = { current: null };
  const analyserRef = { current: null };
  const silenceStart = { current: null };
  const lastSpeechTime = { current: null };
  const mediaRecorderRef = { current: null };
  let running = false;
  let userSpeaking = false;
  let listening = false;
  let utterance = false;
  let wordGap = 0;
  let audioChunks = [];

  const initAudioAnalyser = async () => {
    const stream = await navigator.mediaDevices
      .getUserMedia({ audio: true })
      .catch((error) => {
        console.error("Microphone access denied:", error);
        throw error;
      });

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    const mediaRecorder = new MediaRecorder(stream);

    source.connect(analyser);

    analyser.fftSize = 2048;

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      if (listening && onSilence) {
        const audioBuffer = new Blob(audioChunks, { type: "audio/webm" });
        onSilence(audioBuffer);
        audioChunks = [];
      }
    };
  };

  const checkForSilence = () => {
    if (!running) return;

    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);

    const rms = Math.sqrt(
      dataArray.reduce((sum, value) => sum + (value - 128) ** 2, 0) /
        dataArray.length
    );

    const isSilent = rms < noiseThreshold;
    const currentTime = Date.now();

    if (!isSilent) {
      if (!userSpeaking) {
        userSpeaking = true;
        utterance = false;
        lastSpeechTime.current = currentTime;

        if (mediaRecorderRef.current?.state !== "recording") {
          mediaRecorderRef.current?.start();
        }
      }

      wordGap = currentTime - (lastSpeechTime.current || currentTime);

      // Detect fumbling/utterance if gap between sounds is very short
      if (wordGap < wordGapThreshold) {
        utterance = true;
        if (onUtterance) onUtterance();
      }

      listening = false;
      silenceStart.current = null;
    } else {
      if (userSpeaking) {
        userSpeaking = false;
      }

      if (!silenceStart.current) {
        silenceStart.current = currentTime;
      } else if (
        currentTime - silenceStart.current >
        silenceDurationThreshold
      ) {
        listening = true;

        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current?.stop();
        }
      }
    }

    requestAnimationFrame(checkForSilence);
  };

  const start = async () => {
    await initAudioAnalyser();
    running = true;
    checkForSilence();
  };

  const stop = () => {
    running = false;
    userSpeaking = false;
    listening = false;

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current?.stop();
    }
  };

  return {
    start,
    stop,
    getState: () => ({
      userSpeaking,
      listening,
      utterance,
      wordGap,
    }),
  };
};
