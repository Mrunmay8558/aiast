import React, { useEffect, useState } from "react";

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

const ChatHistory = ({ chats }) => {
  return (
    <div style={chatStyles}>
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
  );
};

export default ChatHistory;
