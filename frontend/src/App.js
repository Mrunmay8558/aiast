import "./App.css";
import ShowTranscriptedData from "./components/ShowTranscriptedData";
import useWebSocket from "./config/socket";

const PageStyle = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "flex-start",
  height: "100vh",
  padding: "10px",
};

function App() {
  useWebSocket("ws://localhost:8000");
  return (
    <div className="App" style={PageStyle}>
      <ShowTranscriptedData />
    </div>
  );
}

export default App;
