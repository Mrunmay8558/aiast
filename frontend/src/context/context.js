import React, { createContext, useState } from "react";

const TranscriptionContext = createContext();

const TranscriptionProvider = ({ children }) => {
  const [transcriptionText, setTranscriptionText] = useState("");
  const [ttsProvider, setTtsProvider] = useState("groq");
  const [sttProvider, setSttProvider] = useState("groq");

  return (
    <TranscriptionContext.Provider
      value={{
        transcriptionText,
        setTranscriptionText,
        ttsProvider,
        setTtsProvider,
        sttProvider,
        setSttProvider,
      }}
    >
      {children}
    </TranscriptionContext.Provider>
  );
};

export { TranscriptionContext, TranscriptionProvider };
