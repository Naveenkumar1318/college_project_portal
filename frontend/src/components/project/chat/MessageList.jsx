import React from "react";
import { useChat } from "./context/ChatContext";
import MessageBubble from "./MessageBubble";

function MessageList({ openThread }) {

  const { messages } = useChat();

  return (

    <div className="message-list">

      {messages.map(msg => (

        <MessageBubble
          key={msg.id}
          message={msg}
          openThread={openThread}
        />

      ))}

    </div>

  );
}

export default MessageList;