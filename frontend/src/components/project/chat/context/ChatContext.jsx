import React, {
  createContext,
  useContext,
  useState,
  useCallback
} from "react";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {

  const [messages, setMessages] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);

  /* ---------------- MESSAGE MANAGEMENT ---------------- */

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateMessage = useCallback((id, newText) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === id ? { ...m, message: newText } : m
      )
    );
  }, []);

  const deleteMessage = useCallback((id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  /* ---------------- REACTIONS ---------------- */

  const addReaction = useCallback((messageId, emoji) => {
    setMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId) return m;

        return {
          ...m,
          reactions: [...(m.reactions || []), emoji]
        };
      })
    );
  }, []);

  /* ---------------- PIN MESSAGE ---------------- */

  const pinMessage = useCallback((msg) => {
    setPinnedMessages(prev => {

      if (prev.find(m => m.id === msg.id)) return prev;

      return [...prev, msg];
    });
  }, []);

  const unpinMessage = useCallback((id) => {
    setPinnedMessages(prev =>
      prev.filter(m => m.id !== id)
    );
  }, []);

  /* ---------------- THREAD MANAGEMENT ---------------- */

  const openThread = useCallback((message) => {
    setActiveThread(message);
  }, []);

  const closeThread = useCallback(() => {
    setActiveThread(null);
  }, []);

  /* ---------------- TYPING USERS ---------------- */

  const addTypingUser = useCallback((userId) => {
    setTypingUsers(prev => {

      if (prev.includes(userId)) return prev;

      return [...prev, userId];
    });
  }, []);

  const removeTypingUser = useCallback((userId) => {
    setTypingUsers(prev =>
      prev.filter(id => id !== userId)
    );
  }, []);

  /* ---------------- ONLINE USERS ---------------- */

  const setUserOnline = useCallback((userId) => {
    setOnlineUsers(prev => {

      if (prev.includes(userId)) return prev;

      return [...prev, userId];
    });
  }, []);

  const setUserOffline = useCallback((userId) => {
    setOnlineUsers(prev =>
      prev.filter(id => id !== userId)
    );
  }, []);

  /* ---------------- CONTEXT VALUE ---------------- */

  const value = {
    messages,
    addMessage,
    updateMessage,
    deleteMessage,

    addReaction,

    pinnedMessages,
    pinMessage,
    unpinMessage,

    activeThread,
    openThread,
    closeThread,

    typingUsers,
    addTypingUser,
    removeTypingUser,

    onlineUsers,
    setUserOnline,
    setUserOffline
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

/* ---------------- CUSTOM HOOK ---------------- */

export const useChat = () => {

  const context = useContext(ChatContext);

  if (!context) {
    throw new Error(
      "useChat must be used inside ChatProvider"
    );
  }

  return context;
};