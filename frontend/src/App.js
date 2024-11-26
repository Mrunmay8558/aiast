import "./App.css";
import { useContext, useState } from "react";
import ShowTranscriptedData from "./components/ShowTranscriptedData";
import { TranscriptionContext } from "./context/context";
import useWebSocket from "./config/socket";

const PageStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around",
  alignItems: "center",
  padding: "10px",
};

const ButtonStyle = {
  padding: "10px",
  margin: "10px",
  fontSize: "16px",
  backgroundColor: "#007bff",
  color: "#ffffff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

function App() {
  const { startRecording, stopRecording } = useWebSocket("ws://localhost:8001");
  const { ttsProvider, setTtsProvider, sttProvider, setSttProvider } =
    useContext(TranscriptionContext);

  return (
    <div className="App" style={PageStyle}>
      <ShowTranscriptedData />
      <div>
        <label>
          TTS Provider:
          <select
            value={ttsProvider}
            onChange={(e) => setTtsProvider(e.target.value)}
          >
            <option value="Deepgram">Deepgram</option>
            <option value="groq">Groq</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          STT Provider:
          <select
            value={sttProvider}
            onChange={(e) => setSttProvider(e.target.value)}
          >
            <option value="Deepgram">Deepgram</option>
            <option value="groq">Groq</option>
          </select>
        </label>
      </div>
      <div>
        <button style={ButtonStyle} onClick={startRecording}>
          Start Recording
        </button>
        <button style={ButtonStyle} onClick={stopRecording}>
          Stop Recording
        </button>
      </div>
    </div>
  );
}

export default App;
