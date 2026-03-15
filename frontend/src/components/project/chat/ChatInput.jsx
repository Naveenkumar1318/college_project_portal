import React, { useState } from "react";
import { useChat } from "./context/ChatContext";
import { v4 as uuid } from "uuid";

function ChatInput({ userId }) {

  const [text,setText] = useState("");
  const { addMessage } = useChat();

  const sendMessage = () => {

    if(!text) return;

    addMessage({
      id: uuid(),
      user: userId,
      message: text,
      created_at: new Date().toISOString()
    });

    setText("");
  };

  return (

    <div className="chat-input">

      <input
        value={text}
        onChange={e=>setText(e.target.value)}
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>
        Send
      </button>

    </div>

  );
}

export default ChatInput;