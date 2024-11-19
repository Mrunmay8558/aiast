import "./App.css";
import ShowTranscriptedData from "./components/ShowTranscriptedData";
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
  const { startRecording, stopRecording } = useWebSocket("ws://localhost:8000");

  return (
    <div className="App" style={PageStyle}>
      <ShowTranscriptedData />
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
