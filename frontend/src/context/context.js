import React, { createContext, useState } from "react";

const TranscriptionContext = createContext();

const TranscriptionProvider = ({ children }) => {
  const [transcriptionText, setTranscriptionText] = useState("");

  return (
    <TranscriptionContext.Provider
      value={{ transcriptionText, setTranscriptionText }}
    >
      {children}
    </TranscriptionContext.Provider>
  );
};

export { TranscriptionContext, TranscriptionProvider };
