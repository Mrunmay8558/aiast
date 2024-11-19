import { useContext, useEffect, useRef } from "react";
import { TranscriptionContext } from "../context/context";

const chatStyles = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  height: "500px",
  width: "90%",
  overflowY: "auto", // Improved for scrolling behavior
  padding: "15px",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#ffffff",
  color: "#333333",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  fontSize: "14px",
  lineHeight: "1.6",
  scrollbarWidth: "thin",
  scrollbarColor: "#ccc transparent",
  marginBottom: "20px",
};

// To further customize the scrollbar (works for Webkit-based browsers):
const customScrollbarStyles = `
    div::-webkit-scrollbar {
      width: 6px;
    }
    div::-webkit-scrollbar-track {
      background: transparent;
    }
    div::-webkit-scrollbar-thumb {
      background: #cccccc;
      border-radius: 3px;
    }
    div::-webkit-scrollbar-thumb:hover {
      background: #aaaaaa;
    }
  `;

const ShowTranscriptedData = () => {
  const chatContainerRef = useRef(null);
  const { transcriptionText } = useContext(TranscriptionContext);

  useEffect(() => {
    // Inject custom scrollbar styles into the document head
    const styleElement = document.createElement("style");
    styleElement.innerHTML = customScrollbarStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div style={chatStyles} ref={chatContainerRef}>
      {transcriptionText && <p>{transcriptionText}</p>}
    </div>
  );
};

export default ShowTranscriptedData;
