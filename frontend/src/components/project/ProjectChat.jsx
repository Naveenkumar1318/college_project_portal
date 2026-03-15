import React from "react";
import ChatModule from "./chat/ChatModule";
import "./ProjectChat.css";

function ProjectChat({ projectId, userId }) {

  if (!projectId) {
    return <div className="chat-error">Invalid project</div>;
  }

  if (!userId) {
    return <div className="chat-error">User not authenticated</div>;
  }

  return (

    <div className="project-chat-page">

      <ChatModule
        projectId={projectId}
        userId={userId}
      />

    </div>

  );
}

export default ProjectChat;