import React, { createContext, useEffect, useState } from "react";

const TranscriptionContext = createContext();

const TranscriptionProvider = ({ children }) => {
  const [transcriptionText, setTranscriptionText] = useState("");
  const [timeTaken, setTimeTaken] = useState({});
  const [ttsProvider, setTtsProvider] = useState(() => {
    return sessionStorage.getItem("ttsProvider") || "groq";
  });
  const [sttProvider, setSttProvider] = useState(() => {
    return sessionStorage.getItem("sttProvider") || "groq";
  });

  const updateTtsProvider = (value) => {
    setTtsProvider(value);
    sessionStorage.setItem("ttsProvider", value);
  };

  const updateSttProvider = (value) => {
    setSttProvider(value);
    sessionStorage.setItem("sttProvider", value);
  };

  useEffect(() => {
    updateSttProvider(sttProvider);
    updateTtsProvider(ttsProvider);
  }, [sttProvider, ttsProvider]);

  return (
    <TranscriptionContext.Provider
      value={{
        transcriptionText,
        setTranscriptionText,
        ttsProvider,
        setTtsProvider,
        sttProvider,
        setSttProvider,
        timeTaken,
        setTimeTaken,
      }}
    >
      {children}
    </TranscriptionContext.Provider>
  );
};

export { TranscriptionContext, TranscriptionProvider };
