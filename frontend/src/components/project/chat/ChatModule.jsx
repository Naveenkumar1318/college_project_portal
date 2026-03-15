import { useEffect, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import EmojiPicker from "emoji-picker-react";
import API from "../../../services/api";
import "./styles/chat.css";

const WS_URL = "ws://localhost:8000";

function ChatModule({ projectId, userId }) {
  // ================= STATE MANAGEMENT =================
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [search, setSearch] = useState("");
  const [reactionPicker, setReactionPicker] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [reply, setReply] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [menu, setMenu] = useState(null);
  const [thread, setThread] = useState(null);
  const [call, setCall] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  // ================= REFS =================
  const socket = useRef(null);
  const chatRef = useRef(null);
  const recorder = useRef(null);
  const videoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const hoverTimeout = useRef(null);

  // ================= INITIAL LOAD =================
  useEffect(() => {
    loadMessages(1);
    connectSocket();

    return () => {
      socket.current?.close();
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, [projectId]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    if (chatRef.current && !loading) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // ================= API FUNCTIONS =================
  async function loadMessages(pageNum = 1) {
    try {
      setLoading(true);
      const res = await API.get(`/projects/${projectId}/messages?page=${pageNum}`);
      
      if (pageNum === 1) {
        setMessages(res.data.messages || []);
      } else {
        setMessages(prev => [...res.data.messages, ...prev]);
      }
      
      setHasMore(res.data.has_more || false);
      setLoading(false);
    } catch (err) {
      console.error("Load messages failed", err);
      setLoading(false);
    }
  }

  async function deleteMessage(id) {
    try {
      await API.delete(`/projects/messages/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch {
      console.error("Delete failed");
    }
  }

  async function editMessage(id, newText) {
    try {
      await API.put(`/projects/messages/${id}`, { message: newText });
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, message: newText, edited: true } : m))
      );
    } catch {
      console.error("Edit failed");
    }
  }

  async function uploadFile(file) {
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await API.post(`/projects/${projectId}/chat-upload`, form);
      sendMessage(res.data.file_url);
    } catch (err) {
      console.error("Upload failed");
    }
  }

  // ================= WEBSOCKET =================
  function connectSocket() {
    const ws = new WebSocket(`${WS_URL}/ws/chat/${projectId}?user_id=${userId}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = e => {
      const data = JSON.parse(e.data);

      // Presence updates
      if (data.type === "presence") {
        setOnlineUsers(data.online_users);
        return;
      }

      // Typing indicator
      if (data.type === "typing") {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
        return;
      }

      // Read receipts
      if (data.type === "read") {
        setMessages(prev =>
          prev.map(m => {
            if (m.id !== data.message_id) return m;

            const readers = m.read_by ? m.read_by.split(",") : [];
            if (!readers.includes(String(data.user_id))) {
              readers.push(String(data.user_id));
            }

            return {
              ...m,
              read_by: readers.join(",")
            };
          })
        );
        return;
      }

      // New message
      setMessages(prev => [...prev, data]);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      // Reconnect after 3 seconds
      setTimeout(connectSocket, 3000);
    };

    socket.current = ws;
  }

  function sendWS(payload) {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(payload));
    }
  }

  // ================= MESSAGE FUNCTIONS =================
  function sendMessage(file = null) {
    if (!text && !file) return;

    const messageData = {
      type: "message",
      sender_id: userId,
      message: text,
      file_url: file,
      reply_to: reply?.id
    };

    sendWS(messageData);

    // Optimistic update
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender_id: userId,
        message: text,
        file_url: file,
        reply_to: reply?.id,
        status: "sending",
        created_at: new Date().toISOString()
      }
    ]);

    setText("");
    setReply(null);
  }

  function addReaction(id, emoji) {
    setMessages(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, reactions: [...(m.reactions || []), emoji] }
          : m
      )
    );
  }

  // ================= VOICE RECORDING =================
  async function startRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder.current = new MediaRecorder(stream);

      let chunks = [];
      recorder.current.ondataavailable = e => chunks.push(e.data);
      recorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        uploadFile(new File([blob], "voice.webm", { type: "audio/webm" }));
      };

      recorder.current.start();
    } catch {
      console.error("Mic permission denied");
    }
  }

  function stopRecord() {
    recorder.current?.stop();
  }

  // ================= DRAG & DROP =================
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: files => uploadFile(files[0])
  });

  // ================= INFINITE SCROLL =================
  function handleScroll() {
    if (!chatRef.current || loading || !hasMore) return;

    if (chatRef.current.scrollTop === 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(nextPage);
    }
  }

  // ================= VIDEO CALL =================
  async function startCall() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStream.current = stream;
      videoRef.current.srcObject = stream;
      setCall(true);

      // Simple WebRTC setup (you'd need a signaling server for production)
      const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
      peerConnection.current = new RTCPeerConnection(configuration);

      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

    } catch (err) {
      console.error("Call failed:", err);
    }
  }

  async function shareScreen() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });

      videoRef.current.srcObject = stream;
      
      // Replace video track in peer connection
      const [videoTrack] = stream.getVideoTracks();
      const sender = peerConnection.current
        .getSenders()
        .find(s => s.track?.kind === "video");

      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  }

  function endCall() {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
    peerConnection.current?.close();
    setCall(false);
  }

  // ================= FILE RENDERER =================
  function renderFile(url) {
    if (!url) return null;

    const ext = url.split(".").pop().toLowerCase();
    const fullUrl = `http://localhost:8000${url}`;

    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
      return (
        <img
          src={fullUrl}
          className="chat-image"
          alt="shared"
          loading="lazy"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewImage(fullUrl);
          }}
        />
      );
    }

    if (["mp4", "webm", "mov"].includes(ext)) {
      return <video src={fullUrl} controls className="chat-video" />;
    }

    if (["mp3", "wav", "ogg"].includes(ext)) {
      return <audio src={fullUrl} controls className="chat-audio" />;
    }

    return (
      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="file-link">
        📎 Download {url.split("/").pop()}
      </a>
    );
  }

  // ================= FILTER MESSAGES =================
  const filtered = messages.filter(m =>
    (m.message || "").toLowerCase().includes(search.toLowerCase())
  );

  // ================= UI RENDER =================
  return (
    <div
      className="chat-container"
      onDragOver={e => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => {
        e.preventDefault();
        setDrag(false);
        const file = e.dataTransfer.files[0];
        if (file) uploadFile(file);
      }}
    >
      {/* Drag overlay */}
      {drag && <div className="drag-overlay">📁 Drop file to upload</div>}

      {/* Header */}
      <div className="chat-header">
        <h3>Project Chat</h3>
        <div className="header-actions">
          <button onClick={() => setShowGallery(true)} className="header-btn">
            📁 Files
          </button>
          <button onClick={startCall} className="header-btn">
            📹 Call
          </button>
          <input
            className="chat-search"
            placeholder="Search messages..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Pinned messages */}
      {pinned.length > 0 && (
        <div className="pinned-bar">
          <span>📌 Pinned Messages</span>
          <div className="pinned-items">
            {pinned.map(p => (
              <div key={p.id} className="pinned-item">
                {p.message}
                <button onClick={() => setPinned(prev => prev.filter(i => i.id !== p.id))}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages container */}
      <div
        className="chat-messages"
        ref={chatRef}
        onScroll={handleScroll}
      >
        {loading && <div className="loading-msg">Loading older messages...</div>}

        {filtered.map((msg, index) => {
          const mine = msg.sender_id === userId;
          const prev = filtered[index - 1];
          const showAvatar = !prev || prev.sender_id !== msg.sender_id;

          return (
            <div key={msg.id} className={`chat-row ${mine ? "mine" : ""}`}>
              {/* Avatar */}
              {!mine && showAvatar && (
                <div className="chat-avatar">
                  {msg.sender_name?.charAt(0) || "U"}
                  {onlineUsers.includes(msg.sender_id) && (
                    <span className="online-dot" title="Online"></span>
                  )}
                </div>
              )}

              {/* Message bubble */}
              <div
                className="chat-bubble"
                onMouseEnter={(e) => {
                  const bubble = e.currentTarget;
                  const reactionBtn = bubble.querySelector('.reaction-hover-btn');
                  const toolbar = bubble.querySelector('.hover-toolbar');
                  
                  if (reactionBtn) reactionBtn.style.opacity = '1';
                  if (toolbar) toolbar.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const bubble = e.currentTarget;
                  const reactionBtn = bubble.querySelector('.reaction-hover-btn');
                  const toolbar = bubble.querySelector('.hover-toolbar');
                  
                  if (reactionBtn) reactionBtn.style.opacity = '0';
                  if (toolbar) toolbar.style.opacity = '0';
                }}
                onClick={(e) => {
                  // Only open reaction picker if clicking on the bubble itself, not its children
                  if (e.target === e.currentTarget) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setReactionPicker({
                      id: msg.id,
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10
                    });
                  }
                }}
                onContextMenu={e => {
                  e.preventDefault();
                  setMenu({
                    x: e.clientX,
                    y: e.clientY,
                    msg
                  });
                }}
              >
                {/* WhatsApp-style hover reaction button */}
                <button
                  className="reaction-hover-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.parentElement.getBoundingClientRect();
                    setReactionPicker({
                      id: msg.id,
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10
                    });
                  }}
                >
                  😊
                </button>

                {/* WhatsApp-style hover toolbar */}
                <div className="hover-toolbar">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReply(msg);
                    }}
                    title="Reply"
                  >
                    ↩️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(msg.message);
                      // Show temporary feedback
                      const btn = e.currentTarget;
                      const originalText = btn.textContent;
                      btn.textContent = '✓';
                      setTimeout(() => {
                        btn.textContent = originalText;
                      }, 1000);
                    }}
                    title="Copy"
                  >
                    📋
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setText(msg.message);
                    }}
                    title="Forward"
                  >
                    📤
                  </button>
                </div>

                {/* Reply preview */}
                {msg.reply_message && (
                  <div className="reply-box">
                    <span>↪️ {msg.reply_message}</span>
                  </div>
                )}

                {/* Edit mode */}
                {editingMessage?.id === msg.id ? (
                  <input
                    className="edit-input"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        editMessage(msg.id, text);
                        setEditingMessage(null);
                        setText("");
                      }
                    }}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <div className="chat-text">{msg.message}</div>
                )}

                {/* File preview */}
                {renderFile(msg.file_url)}

                {/* Edited indicator */}
                {msg.edited && <span className="edited-label">(edited)</span>}

                {/* Time */}
                <div className="chat-time">
                  {msg.created_at &&
                    new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  {msg.status === "sending" && " ⏳"}
                </div>

                {/* Reactions */}
                {msg.reactions?.length > 0 && (
                  <div className="chat-reactions">
                    {msg.reactions.map((r, i) => (
                      <span key={i}>{r}</span>
                    ))}
                  </div>
                )}

                {/* Read receipts */}
                {msg.read_by && (
                  <div className="read-users">
                    ✓✓ {msg.read_by.split(",").length}
                  </div>
                )}

                {/* Message actions (existing) */}
                <div className="chat-actions">
                  <button onClick={(e) => { e.stopPropagation(); addReaction(msg.id, "👍"); }}>👍</button>
                  <button onClick={(e) => { e.stopPropagation(); addReaction(msg.id, "🔥"); }}>🔥</button>
                  <button onClick={(e) => { e.stopPropagation(); setReply(msg); }}>↩️ Reply</button>
                  <button onClick={(e) => { e.stopPropagation(); setPinned(prev => [msg, ...prev]); }}>
                    📌 Pin
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setThread(msg); }}>💬 Thread</button>
                  {mine && (
                    <>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setEditingMessage(msg);
                        setText(msg.message);
                      }}>
                        ✏️ Edit
                      </button>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage(msg.id);
                      }}>🗑️ Delete</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>

      {/* Reaction picker popup */}
      {reactionPicker && (
        <div
          className="reaction-picker"
          style={{
            top: reactionPicker.y,
            left: reactionPicker.x,
            transform: "translate(-50%, -100%)"
          }}
        >
          {["👍", "❤️", "😂", "😮", "😢", "🙏"].map(e => (
            <button
              key={e}
              onClick={() => {
                addReaction(reactionPicker.id, e);
                setReactionPicker(null);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Context menu */}
      {menu && (
        <div
          className="context-menu"
          style={{ top: menu.y, left: menu.x }}
        >
          <button onClick={() => {
            setReply(menu.msg);
            setMenu(null);
          }}>
            Reply
          </button>
          <button onClick={() => {
            navigator.clipboard.writeText(menu.msg.message);
            setMenu(null);
          }}>
            Copy Text
          </button>
          <button onClick={() => {
            setPinned(prev => [menu.msg, ...prev]);
            setMenu(null);
          }}>
            Pin
          </button>
          {menu.msg.sender_id === userId && (
            <button onClick={() => {
              deleteMessage(menu.msg.id);
              setMenu(null);
            }}>
              Delete
            </button>
          )}
        </div>
      )}

      {/* Thread sidebar */}
      {thread && (
        <div className="thread-panel">
          <div className="thread-header">
            <h4>Thread</h4>
            <button onClick={() => setThread(null)}>✕</button>
          </div>
          <div className="thread-message">
            <div className="thread-bubble">
              <strong>{thread.sender_name || "User"}</strong>
              <p>{thread.message}</p>
            </div>
          </div>
          <div className="thread-replies">
            <h5>Replies</h5>
            {messages
              .filter(m => m.reply_to === thread.id)
              .map(r => (
                <div key={r.id} className="thread-reply">
                  <strong>{r.sender_name || "User"}</strong>
                  <p>{r.message}</p>
                </div>
              ))}
          </div>
          <div className="thread-input">
            <input
              placeholder="Reply in thread..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  sendWS({
                    type: "message",
                    sender_id: userId,
                    message: text,
                    reply_to: thread.id
                  });
                  setText("");
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Video call */}
      {call && (
        <div className="call-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="video-box"
          />
          <div className="call-controls">
            <button onClick={shareScreen}>🖥️ Share</button>
            <button onClick={endCall} className="end-call">📞 End</button>
          </div>
        </div>
      )}

      {/* File gallery */}
      {showGallery && (
        <div className="file-gallery">
          <div className="gallery-header">
            <h3>Shared Files</h3>
            <button onClick={() => setShowGallery(false)}>✕</button>
          </div>
          <div className="gallery-grid">
            {messages
              .filter(m => m.file_url)
              .map(file => {
                const ext = file.file_url.split(".").pop();
                const fullUrl = `http://localhost:8000${file.file_url}`;

                if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
                  return (
                    <div 
                      key={file.id} 
                      className="gallery-item"
                      onClick={() => setPreviewImage(fullUrl)}
                    >
                      <img src={fullUrl} alt="shared" loading="lazy" />
                    </div>
                  );
                }

                return (
                  <a
                    key={file.id}
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gallery-item file"
                  >
                    📎 {file.file_url.split("/").pop()}
                  </a>
                );
              })}
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {previewImage && (
        <div
          className="image-lightbox"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="preview" />
        </div>
      )}

      {/* Input area */}
      <div className="chat-input">
        <div {...getRootProps()} className="upload-btn">
          <input {...getInputProps()} />
          📎
        </div>

        <button onClick={() => setEmojiOpen(!emojiOpen)}>😊</button>

        {emojiOpen && (
          <div className="emoji-box">
            <EmojiPicker 
              onEmojiClick={e => setText(t => t + e.emoji)} 
              theme="dark"
            />
          </div>
        )}

        <div className="input-wrapper">
          {/* Reply preview */}
          {reply && (
            <div className="reply-preview">
              <span>Replying to: {reply.message?.substring(0, 30)}...</span>
              <button onClick={() => setReply(null)}>✕</button>
            </div>
          )}

          <input
            value={text}
            onChange={e => {
              setText(e.target.value);
              sendWS({ type: "typing" });
            }}
            placeholder="Message..."
            className="chat-text-input"
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
        </div>

        <button
          onMouseDown={startRecord}
          onMouseUp={stopRecord}
          onMouseLeave={stopRecord}
          className="voice-btn"
        >
          🎤
        </button>

        <button onClick={() => sendMessage()} className="send-btn">
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatModule;