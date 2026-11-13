import "./Messenger.css"
import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import API_URL from "../../services/api";
import {
  FaSearch,
  FaPaperPlane,
  FaPlus,
  FaUsers,
  FaUser,
  FaPhone,
  FaVideo,
  FaEllipsisV,
  FaPaperclip,
  FaSmile,
  FaArrowLeft,
  FaComments,
  FaTimes,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

// Backend server address (/api illama) - socket.io connect aaga
const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

const COLORS = ["purple", "orange", "green", "blue"];

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("ameToken")}`,
});

// Login token-kulla irukkura userId-a edukkum
const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem("ameToken");

    if (!token) return null;

    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    return payload.userId || null;
  } catch {
    return null;
  }
};

const getInitials = (name = "") => name.trim().slice(0, 2).toUpperCase() || "?";

const getColor = (name = "") =>
  COLORS[name.length ? name.charCodeAt(0) % COLORS.length : 0];

const byUpdated = (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt);

const formatMessageTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// Sidebar-la: indru-na neram, nethu-na "Yesterday", illa-na date
const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return formatMessageTime(value);
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], { day: "numeric", month: "short" });
};

// Conversation-a sidebar/header-ku vendiya name, avatar, color-a maathum
const getChatInfo = (conversation, myId) => {
  if (conversation.type === "group") {
    const name = conversation.groupName || "Group";

    return {
      name,
      avatar: getInitials(name),
      profilePhoto: "",
      color: getColor(name),
      role: `Group · ${conversation.participants.length} members`,
      type: "Group",
    };
  }

  const other = conversation.participants.find(
    (participant) => String(participant._id) !== String(myId)
  );

  const name = other?.username || "Unknown user";

  return {
    name,
    avatar: getInitials(name),
    profilePhoto: other?.profilePhoto || "",
    color: getColor(name),
    role: other?.email || "",
    type: "Personal",
  };
};

const getPreview = (conversation, myId) => {
  const last = conversation.lastMessage;

  if (!last) return "Start a conversation";

  const text = last.content || last.fileName || "Attachment";

  if (conversation.type === "group") {
    const mine = String(last.sender?._id) === String(myId);
    return `${mine ? "You" : last.sender?.username || "Someone"}: ${text}`;
  }

  return text;
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("ameUser") || "null");
  } catch {
    return null;
  }
};

function Messenger() {
  const navigate = useNavigate();
  const location = useLocation();

  // CURRENT USER PROFILE
const [currentUser, setCurrentUser] = useState(getStoredUser);

useEffect(() => {
  const updateUser = () => {
    setCurrentUser(getStoredUser());
  };

  window.addEventListener("ameUserUpdated", updateUser);
  window.addEventListener("storage", updateUser);

  return () => {
    window.removeEventListener("ameUserUpdated", updateUser);
    window.removeEventListener("storage", updateUser);
  };
}, []);

  const myId = getUserIdFromToken();

  const [activeTab, setActiveTab] = useState("Personal");
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");

  const [conversations, setConversations] = useState([]);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [unread, setUnread] = useState({});
  const [loading, setLoading] = useState(true);

  // Socket event-kulla latest value venum, adhanaala refs
  const activeChatRef = useRef(null);
  const conversationsRef = useRef([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Messages padichittom-nu backend-ku solluvom
  const markAsRead = useCallback((conversationId) => {
    fetch(`${API_URL}/messages/${conversationId}/read`, {
      method: "PUT",
      headers: authHeaders(),
    }).catch(() => {});
  }, []);

  // MY CONVERSATIONS LOAD
  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/conversations`, {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load conversations.");
      }

      setConversations(data);

      // Last message innum padikkala-na unread = 1
      setUnread((previous) => {
        const next = { ...previous };

        data.forEach((conversation) => {
          if (next[conversation._id] !== undefined) return;

          const last = conversation.lastMessage;

          const isUnread =
            last &&
            String(last.sender?._id) !== String(myId) &&
            !(last.readBy || []).some(
              (item) => String(item.user) === String(myId)
            );

          next[conversation._id] = isUnread ? 1 : 0;
        });

        return next;
      });
    } catch (error) {
      alert(error.message);
    }
  }, [myId]);

  // OPEN A CHAT + LOAD ITS MESSAGES
  const openChat = useCallback(
    async (conversationId) => {
      setActiveChat(conversationId);
      setUnread((previous) => ({ ...previous, [conversationId]: 0 }));

      try {
        const response = await fetch(
          `${API_URL}/messages/${conversationId}`,
          { headers: authHeaders() }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load messages.");
        }

        setMessagesByChat((previous) => ({
          ...previous,
          [conversationId]: data,
        }));

        markAsRead(conversationId);
      } catch (error) {
        alert(error.message);
      }
    },
    [markAsRead]
  );

  // Page open aagum pothu conversations load pannum
  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, [loadConversations]);

  // Contacts page-la Message click pannina, andha chat-a open pannum
  useEffect(() => {
    const target = location.state?.conversationId;

    if (!target || loading) return;

    const conversation = conversations.find((item) => item._id === target);

    if (conversation) {
      setActiveTab(conversation.type === "group" ? "Group" : "Personal");
      openChat(target);
    }

    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // REAL-TIME: socket connect
  useEffect(() => {
    const token = localStorage.getItem("ameToken");

    if (!token) return;

    const socket = io(SERVER_URL, { auth: { token } });

    // Vera oruthar message anuppina
    socket.on("new-message", (incoming) => {
      const conversationId = String(incoming.conversationId);

      // Puthu conversation-na list-a thirumba load pannum
      if (
        !conversationsRef.current.some((item) => item._id === conversationId)
      ) {
        loadConversations();
        return;
      }

      setMessagesByChat((previous) => {
        const list = previous[conversationId];

        if (!list || list.some((item) => item._id === incoming._id)) {
          return previous;
        }

        return { ...previous, [conversationId]: [...list, incoming] };
      });

      setConversations((previous) =>
        previous
          .map((item) =>
            item._id === conversationId
              ? { ...item, lastMessage: incoming, updatedAt: incoming.createdAt }
              : item
          )
          .sort(byUpdated)
      );

      if (activeChatRef.current === conversationId) {
        markAsRead(conversationId);
      } else {
        setUnread((previous) => ({
          ...previous,
          [conversationId]: (previous[conversationId] || 0) + 1,
        }));
      }
    });

    // Naan anuppina message-a avanga padichaanga
    socket.on("message-read", ({ messageId, conversationId, readBy, readAt }) => {
      const chatId = String(conversationId);

      setMessagesByChat((previous) => {
        const list = previous[chatId];

        if (!list) return previous;

        return {
          ...previous,
          [chatId]: list.map((item) =>
            item._id === String(messageId)
              ? {
                  ...item,
                  readBy: [...(item.readBy || []), { user: readBy, readAt }],
                }
              : item
          ),
        };
      });
    });

    return () => socket.disconnect();
  }, [loadConversations, markAsRead]);

  // SEND MESSAGE
  const sendMessage = async (e) => {
    e.preventDefault();

    const text = message.trim();

    if (!text || !activeChat) return;

    setMessage("");

    try {
      const response = await fetch(`${API_URL}/messages/${activeChat}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content: text }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send message.");
      }

      const sent = result.data;

      setMessagesByChat((previous) => ({
        ...previous,
        [activeChat]: [...(previous[activeChat] || []), sent],
      }));

      setConversations((previous) =>
        previous
          .map((item) =>
            item._id === activeChat
              ? { ...item, lastMessage: sent, updatedAt: sent.createdAt }
              : item
          )
          .sort(byUpdated)
      );
    } catch (error) {
      setMessage(text);
      alert(error.message);
    }
  };

  const chatList = conversations.map((conversation) => ({
    ...conversation,
    info: getChatInfo(conversation, myId),
  }));

  const filteredChats = chatList.filter((chat) => chat.info.type === activeTab);

  const selectedChat = chatList.find((chat) => chat._id === activeChat);

  const selectedMessages = messagesByChat[activeChat] || [];

  // Puthu message vandha keezha scroll aagum
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesByChat, activeChat]);

  return (
    <div className="messenger-page">
      <aside className="messenger-sidebar">
        <div className="messenger-brand">
           <img src="/102893.jpg" alt="AME Logo" className="logo-image" />
          <div>
            <h2>AME MESSENGER</h2>
            <p>Connect. Learn. Grow.</p>
          </div>
        </div>

       <div className="messenger-profile">
  <div className="messenger-avatar profile-avatar">
    {currentUser?.profilePhoto ? (
      <img
        src={currentUser.profilePhoto}
        alt="My Profile"
        className="messenger-profile-image"
      />
    ) : (
      currentUser?.username?.charAt(0).toUpperCase() || "M"
    )}
  </div>
          <div className="profile-info">
            <h4>My Account</h4>
            <p>
              <span className="online-dot"></span> Available
            </p>
          </div>
          <FaEllipsisV className="profile-menu" />
        </div>

        <div className="messenger-sidebar-heading">
          <h3>Messages</h3>
          <button
           className="new-chat-btn"
             onClick={() => navigate("/contact")}
            title="Create new chat"
          >
            <FaPlus />
          </button>
        </div>

        <div className="messenger-tabs">
          <button
            className={activeTab === "Personal" ? "active" : ""}
            onClick={() => setActiveTab("Personal")}
          >
            <FaUser /> Personal
          </button>

          <button
            className={activeTab === "Group" ? "active" : ""}
            onClick={() => setActiveTab("Group")}
          >
            <FaUsers /> Groups
          </button>
        </div>

        <div className="messenger-search">
          <FaSearch />
          <input type="text" placeholder="Search conversations..." />
        </div>

        <div className="messenger-contact-list">
          {filteredChats.map((chat) => (
            <button
              className={`messenger-contact ${
                activeChat === chat._id ? "selected" : ""
              }`}
              key={chat._id}
              onClick={() => openChat(chat._id)}
            >
              <div className={`messenger-avatar avatar-${chat.info.color}`}>
  {chat.info.profilePhoto ? (
    <img
      src={chat.info.profilePhoto}
      alt={chat.info.name}
      className="messenger-user-photo"
    />
  ) : (
    chat.info.avatar
  )}
</div>

              <div className="contact-details">
                <div className="contact-top">
                  <h4>{chat.info.name}</h4>
                  <span>{formatTime(chat.lastMessage?.createdAt)}</span>
                </div>
                <p>{getPreview(chat, myId)}</p>
                <small>{chat.info.role}</small>
              </div>

              {unread[chat._id] > 0 && (
                <span className="unread-count">{unread[chat._id]}</span>
              )}
            </button>
          ))}

          {!loading && filteredChats.length === 0 && (
            <p className="empty-chats">
              No conversations yet. Add a contact and start chatting.
            </p>
          )}

          {loading && <p className="empty-chats">Loading conversations...</p>}
        </div>

        <div className="messenger-sidebar-footer">
          <span>AME MESSENGER</span>
          <span>Stay connected 💙</span>
        </div>
      </aside>

      <main className="messenger-chat-area">
        {selectedChat ? (
          <>
            <header className="chat-header">
              <button
                className="mobile-back-btn"
                onClick={() => setActiveChat(null)}
                title="Back"
              >
                <FaArrowLeft />
              </button>
 
 <div
  className={`messenger-avatar avatar-${selectedChat.info.color}`}
>
  {selectedChat.info.profilePhoto ? (
    <img
      src={selectedChat.info.profilePhoto}
      alt={selectedChat.info.name}
      className="messenger-user-photo"
    />
  ) : (
    selectedChat.info.avatar
  )}
</div>

              <div className="chat-header-info">
                <h3>{selectedChat.info.name}</h3>
                <p>{selectedChat.info.role}</p>
              </div>

              <div className="chat-header-actions">
                <button title="Voice call">
                  <FaPhone />
                </button>
                <button title="Video call">
                  <FaVideo />
                </button>
                <button title="More options">
                  <FaEllipsisV />
                </button>
                <button
                  className="close-chat-btn"
                  title="Close chat"
                  onClick={() => setActiveChat(null)}
                >
                  <FaTimes />
                </button>
              </div>
            </header>

            <div className="chat-date-divider">
              <span>TODAY</span>
            </div>

            <section className="chat-messages">
              {selectedMessages.map((msg) => {
                const sent = String(msg.sender?._id) === String(myId);

                const seen = (msg.readBy || []).some(
                  (item) => String(item.user) !== String(myId)
                );

                return (
                  <div
                    className={`message-row ${sent ? "sent" : "received"}`}
                    key={msg._id}
                  >
                    {!sent && selectedChat.info.type === "Group" && (
                      <span className="group-sender">
                        {msg.sender?.username}
                      </span>
                    )}

                    <div className="message-bubble">
                      <p>{msg.content || msg.fileName || "Attachment"}</p>
                      <span className="message-time">
                        {formatMessageTime(msg.createdAt)}{" "}
                        {sent && (seen ? "✓✓" : "✓")}
                      </span>
                    </div>
                  </div>
                );
              })}

              {selectedMessages.length === 0 && (
                <div className="empty-conversation">
                  <div className="empty-chat-icon">
                    {selectedChat.info.type === "Group" ? (
                      <FaUsers />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <h3>Start a conversation</h3>
                  <p>Send a message to get things started.</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </section>

            <form className="chat-input-area" onSubmit={sendMessage}>
              <button
                type="button"
                className="input-icon-btn"
                title="Attach file"
              >
                <FaPaperclip />
              </button>

              <button
                type="button"
                className="input-icon-btn"
                title="Emoji"
              >
                <FaSmile />
              </button>

              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button
                type="submit"
                className="send-message-btn"
                disabled={!message.trim()}
                title="Send message"
              >
                <FaPaperPlane />
              </button>
            </form>
          </>
        ) : (
          <div className="empty-conversation welcome-chat">
            <div className="empty-chat-icon">
              <FaComments/>
            </div>
            <h2>Welcome to AME Messenger</h2>
            <p>Select a conversation to start messaging.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Messenger;




