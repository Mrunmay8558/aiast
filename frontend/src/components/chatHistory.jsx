import React, { useEffect, useRef } from "react";
import UploadImg from "./uploadImg";

const chatStyles = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  height: "85%",
  width: "90%",
  overflowY: "scroll",
  scrollbarWidth: "none",
  padding: "10px",
  border: "1px solid #ccc",
};

const userInputStyle = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-end",
  alignItems: "flex-end",
  width: "98%",
  padding: "10px",
};

const botInputStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  width: "90%",
  padding: "10px",
  gap: "10px",
};

const uploadImgStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  width: "90%",
  padding: "10px",
};

const ChatHistory = ({ chats, setFormData, setStep }) => {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom of the chat container
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chats]);
  return (
    <>
      <div style={uploadImgStyle}>
        <UploadImg setFormData={setFormData} setStep={setStep} />
      </div>
      <div style={chatStyles} ref={chatContainerRef}>
        {chats.map((chat, index) => (
          <React.Fragment key={index}>
            {chat.sender === "user" ? (
              <div style={userInputStyle}>
                <span
                  style={{
                    backgroundColor: "grey",
                    padding: "10px",
                    borderRadius: "10px",
                  }}
                >
                  {chat.message}
                </span>
              </div>
            ) : (
              <div style={botInputStyle}>
                <span
                  style={{
                    backgroundColor: "black",
                    padding: "10px",
                    borderRadius: "10px",
                    color: "white",
                  }}
                >
                  {chat.message}
                </span>
                <audio src={chat.url} autoPlay={true} controls />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default ChatHistory;
