import React from "react";
import PresenceIndicator from "./PresenceIndicator";

function ChatHeader({ openGallery, startCall }) {

  return (

    <div className="chat-header">

      <div className="chat-title">

        <h3>Project Chat</h3>

        <PresenceIndicator status="online" />

      </div>

      <div className="chat-actions">

        <button onClick={openGallery}>
          Files
        </button>

        <button onClick={startCall}>
          Video Call
        </button>

      </div>

    </div>

  );
}

export default ChatHeader;