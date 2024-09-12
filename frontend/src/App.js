import { useEffect, useState } from "react";
import "./App.css";
import Form from "./components/form";
import TTS from "./components/tts";
import STT from "./components/stt";
import ChatHistory from "./components/chatHistory";

const formContainerStyle = {
  display: "flex",
  flexDirection: "column",
  padding: "10px",
  border: "1px solid #ccc",
  height: "90%",
  width: "40%",
  overflowY: "scroll",
  scrollbarWidth: "none",
};

const chatBotStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "10px",
  border: "1px solid #ccc",
  height: "90%",
  width: "50%",
  gap: "10px",
};

const PageStyle = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "flex-start",
  height: "100vh",
  padding: "10px",
};

function App() {
  const [step, setStep] = useState(1);
  const [submit, setSubmit] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState(null);
  const [userChats, setUserChats] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    contactNumber: "",
    pan: "",
    pincode: "",
    city: "",
    state: "",
    email: "",
    gender: "",
    addressL1: "",
    addressL2: "",
    endUse: "",
    companyName: "",
    officialEmail: "",
    employmentType: "",
    income: "",
    udyamNumber: "",
    aa_id: "",
    bureauConsent: "",
  });

  useEffect(() => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      aa_id: prevFormData.contactNumber + "@finvu",
    }));
  }, [formData.contactNumber]);

  useEffect(() => {
    if (step === 1) {
      setSubmit(true);
    }
  }, []);

  const addChat = (message) => {
    if (message === null) return;
    setUserChats((prevChats) => [
      ...prevChats,
      { sender: "user", message: message },
    ]);
  };

  const addAudioUrl = (message) => {
    setUserChats((prevChats) => [
      ...prevChats,
      { sender: "Bot", message: message },
    ]);
  };

  return (
    <div className="App" style={PageStyle}>
      <div style={chatBotStyle}>
        <ChatHistory
          chats={userChats}
          setFormData={setFormData}
          setStep={setStep}
        />
        <STT
          transcriptionText={transcriptionText}
          setTranscriptionText={setTranscriptionText}
          addChat={addChat}
          addAudioUrl={addAudioUrl}
          setSubmit={setSubmit}
        />
        {/* <TTS
          transcriptionText={transcriptionText}
          addURL={addAudioUrl}
          formdata={formData}
          setFormData={setFormData}
          step={step}
          setStep={setStep}
          submit={submit}
          setSubmit={setSubmit}
        /> */}
      </div>
      <div style={formContainerStyle}>
        <Form
          formData={formData}
          setFormData={setFormData}
          setSubmit={setSubmit}
        />
      </div>
    </div>
  );
}

export default App;
