export const createSilenceDetector = ({
  noiseThreshold = 10,
  silenceDurationThreshold = 3000,
  onSilence,
  onSound,
}) => {
  const audioContextRef = { current: null };
  const analyserRef = { current: null };
  const silenceStart = { current: null };
  let running = false;
  let silenceDetected = false;
  let soundDetected = false;

  const initAudioAnalyser = () => {
    return navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
      })
      .catch((error) => {
        console.error("Microphone access denied:", error);
      });
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

    if (isSilent && !silenceDetected) {
      if (!silenceStart.current) {
        silenceStart.current = Date.now();
      } else if (Date.now() - silenceStart.current > silenceDurationThreshold) {
        onSilence();
        silenceDetected = true;
        silenceStart.current = null;
      }
    } else if (!isSilent) {
      silenceStart.current = null;
      silenceDetected = false;

      if (!soundDetected) {
        onSound(true);
        soundDetected = true;
      }
    } else {
      soundDetected = false;
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
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  return { start, stop };
};
