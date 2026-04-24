import { useEffect, useState } from "react";
import API from "../../services/api";
import "../../styles/components/tasks/TaskMessages.css";

interface Props {
  projectId: number;
}

const TaskMessages = ({ projectId }: Props) => {

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const loadMessages = async () => {
    try {

      const res = await API.get(`/projects/${projectId}/messages`);
      setMessages(res.data.data);

    } catch (err) {
      console.error("Message load error:", err);
    }
  };

  const sendMessage = async () => {

    if (!text.trim()) return;

    try {

      await API.post(`/projects/${projectId}/messages`, {
        message: text
      });

      setText("");
      loadMessages();

    } catch (err) {
      console.error("Send message error:", err);
    }

  };

useEffect(() => {

  loadMessages();

  const interval = setInterval(() => {
    loadMessages();
  }, 4000);

  return () => clearInterval(interval);

}, [projectId]);

  return (

    <div className="task-chat">

      <div className="task-chat-messages">

        {messages.map((m) => (

          <div key={m.id} className={`task-msg ${m.role}`}>

            <div className="task-msg-user">
              {m.role} • {m.sender}
            </div>

            <div className="task-msg-text">
              {m.message}
            </div>

          </div>

        ))}

      </div>

      <div className="task-chat-input">

        <input
  value={text}
  onChange={(e) => setText(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") sendMessage();
  }}
  placeholder="Type message..."
/>

        <button onClick={sendMessage}>
          Send
        </button>

      </div>

    </div>

  );

};

export default TaskMessages;