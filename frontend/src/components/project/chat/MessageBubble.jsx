import React from "react";
import { useChat } from "./context/ChatContext";

function MessageBubble({ message, openThread }) {

  const { addReaction } = useChat();

  return (

    <div className="message-bubble">

      <div className="message-user">

        {message.user}

      </div>

      <div className="message-text">

        {message.message}

      </div>

      <div className="message-actions">

        <button onClick={() => addReaction(message.id,"👍")}>
          👍
        </button>

        <button onClick={() => addReaction(message.id,"🔥")}>
          🔥
        </button>

        <button onClick={openThread}>
          Reply
        </button>

      </div>

    </div>

  );
}

export default MessageBubble;