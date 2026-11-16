import "./Messenger.css";
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
  FaEdit,
  FaTrash,
  FaShare,
  FaReply,
  FaCheck,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

// Backend server address (/api illama) - Socket.IO connect aaga
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

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("ameUser") || "null");
  } catch {
    return null;
  }
};

const getInitials = (name = "") =>
  name.trim().slice(0, 2).toUpperCase() || "?";

const getColor = (name = "") =>
  COLORS[name.length ? name.charCodeAt(0) % COLORS.length : 0];

const byUpdated = (a, b) =>
  new Date(b.updatedAt) - new Date(a.updatedAt);

const formatMessageTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// Sidebar-la: indru-na neram, nethu-na Yesterday, illa-na date
const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return formatMessageTime(value);
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
};

// Conversation-a sidebar/header-ku vendiya name, avatar, color-a maathum
const getChatInfo = (conversation, myId) => {
  const participants = conversation.participants || [];

  if (conversation.type === "group") {
    const name = conversation.groupName || "Group";

    return {
      name,
      avatar: getInitials(name),
      profilePhoto: "",
      color: getColor(name),
      role: `Group · ${participants.length} members`,
      type: "Group",
    };
  }

  const other = participants.find(
    (participant) =>
      String(participant?._id || participant) !== String(myId)
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

  if (last.isDeletedForEveryone) {
    return "This message was deleted";
  }

  const deletedFor = (last.deletedFor || []).some(
    (user) => String(user?._id || user) === String(myId)
  );

  if (deletedFor) {
    return "Message deleted for you";
  }

  const text = last.content || last.fileName || "Attachment";

  if (conversation.type === "group") {
    const mine =
      String(last.sender?._id || last.sender) === String(myId);

    return `${mine ? "You" : last.sender?.username || "Someone"}: ${text}`;
  }

  return text;
};

function Messenger() {
  const navigate = useNavigate();
  const location = useLocation();

  const myId = getUserIdFromToken();

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

  const [activeTab, setActiveTab] = useState("Personal");
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");

  const [conversations, setConversations] = useState([]);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [unread, setUnread] = useState({});
  const [loading, setLoading] = useState(true);

  // MESSAGE MANAGEMENT STATES
  const [openMessageMenu, setOpenMessageMenu] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [forwardTargetId, setForwardTargetId] = useState("");

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
            String(last.sender?._id || last.sender) !== String(myId) &&
            !(last.readBy || []).some(
              (item) => String(item.user?._id || item.user) === String(myId)
            );

          next[conversation._id] = isUnread ? 1 : 0;
        });

        return next;
      });
    } catch (error) {
      console.error("Load Conversations Error:", error);
      alert(error.message);
    }
  }, [myId]);

  // OPEN A CHAT + LOAD ITS MESSAGES
  const openChat = useCallback(
    async (conversationId) => {
      setActiveChat(conversationId);
      setUnread((previous) => ({ ...previous, [conversationId]: 0 }));

      // Clear action state when switching conversations
      setOpenMessageMenu(null);
      setReplyingTo(null);
      setEditingMessageId(null);
      setMessage("");

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
        console.error("Open Chat Error:", error);
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

    const conversation = conversations.find(
      (item) => String(item._id) === String(target)
    );

    if (conversation) {
      setActiveTab(conversation.type === "group" ? "Group" : "Personal");
      openChat(target);
    }

    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // REAL-TIME SOCKET EVENTS
  useEffect(() => {
    const token = localStorage.getItem("ameToken");

    if (!token) return undefined;

    const socket = io(SERVER_URL, { auth: { token } });

    // Vera oruthar message anuppina
    socket.on("new-message", (incoming) => {
      const conversationId = String(incoming.conversationId);

      // Puthu conversation-na list-a thirumba load pannum
      if (
        !conversationsRef.current.some(
          (item) => String(item._id) === conversationId
        )
      ) {
        loadConversations();
        return;
      }

      setMessagesByChat((previous) => {
        const list = previous[conversationId];

        if (!list || list.some((item) => String(item._id) === String(incoming._id))) {
          return previous;
        }

        return {
          ...previous,
          [conversationId]: [...list, incoming],
        };
      });

      setConversations((previous) =>
        previous
          .map((item) =>
            String(item._id) === conversationId
              ? {
                  ...item,
                  lastMessage: incoming,
                  updatedAt: incoming.createdAt,
                }
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
    socket.on(
      "message-read",
      ({ messageId, conversationId, readBy, readAt }) => {
        const chatId = String(conversationId);

        setMessagesByChat((previous) => {
          const list = previous[chatId];

          if (!list) return previous;

          return {
            ...previous,
            [chatId]: list.map((item) =>
              String(item._id) === String(messageId)
                ? {
                    ...item,
                    readBy: [
                      ...(item.readBy || []),
                      { user: readBy, readAt },
                    ],
                  }
                : item
            ),
          };
        });
      }
    );

    // REAL-TIME MESSAGE EDIT
    socket.on("message-updated", (updatedMessage) => {
      const chatId = String(updatedMessage.conversationId);

      setMessagesByChat((previous) => {
        const list = previous[chatId];

        if (!list) return previous;

        return {
          ...previous,
          [chatId]: list.map((item) =>
            String(item._id) === String(updatedMessage._id)
              ? updatedMessage
              : item
          ),
        };
      });

      setConversations((previous) =>
        previous.map((item) =>
          String(item._id) === chatId &&
          String(item.lastMessage?._id) === String(updatedMessage._id)
            ? { ...item, lastMessage: updatedMessage }
            : item
        )
      );
    });

    // REAL-TIME MESSAGE DELETE
    socket.on("message-deleted", (payload) => {
      const chatId = String(payload.conversationId);
      const deletedId = String(payload.messageId);

      setMessagesByChat((previous) => {
        const list = previous[chatId];

        if (!list) return previous;

        if (payload.deleteFor === "me") {
          return {
            ...previous,
            [chatId]: list.filter(
              (item) => String(item._id) !== deletedId
            ),
          };
        }

        return {
          ...previous,
          [chatId]: list.map((item) =>
            String(item._id) === deletedId
              ? {
                  ...item,
                  content: "",
                  fileUrl: "",
                  fileName: "",
                  isDeletedForEveryone: true,
                }
              : item
          ),
        };
      });

      setConversations((previous) =>
        previous.map((item) => {
          if (
            String(item._id) !== chatId ||
            String(item.lastMessage?._id) !== deletedId
          ) {
            return item;
          }

          if (payload.deleteFor === "me") {
            return {
              ...item,
              lastMessage: {
                ...item.lastMessage,
                deletedFor: [
                  ...(item.lastMessage.deletedFor || []),
                  myId,
                ],
              },
            };
          }

          return {
            ...item,
            lastMessage: {
              ...item.lastMessage,
              content: "",
              fileUrl: "",
              fileName: "",
              isDeletedForEveryone: true,
            },
          };
        })
      );
    });

    return () => socket.disconnect();
  }, [loadConversations, markAsRead, myId]);

  // REPLY TO MESSAGE
  const handleReplyMessage = (msg) => {
    if (msg.isDeletedForEveryone) return;

    setReplyingTo(msg);
    setEditingMessageId(null);
    setMessage("");
    setOpenMessageMenu(null);
  };

  // EDIT OWN TEXT MESSAGE
  const handleEditMessage = (msg) => {
    const senderId = msg.sender?._id || msg.sender;

    if (
      String(senderId) !== String(myId) ||
      msg.messageType !== "text" ||
      msg.isDeletedForEveryone
    ) {
      alert("You can edit only your own active text messages.");
      return;
    }

    setEditingMessageId(msg._id);
    setReplyingTo(null);
    setMessage(msg.content || "");
    setOpenMessageMenu(null);
  };

  // DELETE MESSAGE
  const handleDeleteMessage = async (msg, deleteFor) => {
    const senderId = msg.sender?._id || msg.sender;

    if (deleteFor === "everyone") {
      if (String(senderId) !== String(myId)) {
        alert("You can delete only your own messages for everyone.");
        return;
      }

      const confirmed = window.confirm(
        "Delete this message for everyone?"
      );

      if (!confirmed) return;
    }

    try {
      const response = await fetch(`${API_URL}/messages/${msg._id}`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ deleteFor }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete message.");
      }

      const chatId = String(msg.conversationId || activeChat);

      setMessagesByChat((previous) => ({
        ...previous,
        [chatId]:
          deleteFor === "me"
            ? (previous[chatId] || []).filter(
                (item) => String(item._id) !== String(msg._id)
              )
            : (previous[chatId] || []).map((item) =>
                String(item._id) === String(msg._id)
                  ? {
                      ...item,
                      content: "",
                      fileUrl: "",
                      fileName: "",
                      isDeletedForEveryone: true,
                    }
                  : item
              ),
      }));

      setConversations((previous) =>
        previous.map((item) => {
          if (
            String(item._id) !== chatId ||
            String(item.lastMessage?._id) !== String(msg._id)
          ) {
            return item;
          }

          if (deleteFor === "me") {
            return {
              ...item,
              lastMessage: {
                ...item.lastMessage,
                deletedFor: [
                  ...(item.lastMessage.deletedFor || []),
                  myId,
                ],
              },
            };
          }

          return {
            ...item,
            lastMessage: {
              ...item.lastMessage,
              content: "",
              fileUrl: "",
              fileName: "",
              isDeletedForEveryone: true,
            },
          };
        })
      );

      setOpenMessageMenu(null);

      if (String(editingMessageId) === String(msg._id)) {
        setEditingMessageId(null);
        setMessage("");
      }

      if (String(replyingTo?._id) === String(msg._id)) {
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Delete Message Error:", error);
      alert(error.message);
    }
  };

  // OPEN FORWARD MESSAGE WINDOW
  const handleForwardMessage = (msg) => {
    if (msg.isDeletedForEveryone) {
      alert("Deleted messages cannot be forwarded.");
      return;
    }

    setForwardingMessage(msg);
    setForwardTargetId("");
    setShowForwardModal(true);
    setOpenMessageMenu(null);
  };

  // CLOSE FORWARD WINDOW
  const closeForwardModal = () => {
    if (forwarding) return;

    setShowForwardModal(false);
    setForwardingMessage(null);
    setForwardTargetId("");
  };

  // CONFIRM FORWARD MESSAGE
  const confirmForwardMessage = async () => {
    if (!forwardingMessage || !forwardTargetId) {
      alert("Please select a conversation.");
      return;
    }

    try {
      setForwarding(true);

      const response = await fetch(
        `${API_URL}/messages/${forwardingMessage._id}/forward`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            targetConversationId: forwardTargetId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to forward message.");
      }

      const forwarded = data.data;

      // UPDATE TARGET CONVERSATION LAST MESSAGE
      setConversations((previous) =>
        previous
          .map((item) =>
            String(item._id) === String(forwardTargetId)
              ? {
                  ...item,
                  lastMessage: forwarded,
                  updatedAt: forwarded.createdAt,
                }
              : item
          )
          .sort(byUpdated)
      );

      // UPDATE TARGET CHAT IF ITS MESSAGES ARE ALREADY LOADED
      setMessagesByChat((previous) => {
        const targetMessages = previous[forwardTargetId];

        if (!targetMessages) return previous;

        if (
          targetMessages.some(
            (item) => String(item._id) === String(forwarded._id)
          )
        ) {
          return previous;
        }

        return {
          ...previous,
          [forwardTargetId]: [...targetMessages, forwarded],
        };
      });

      setShowForwardModal(false);
      setForwardingMessage(null);
      setForwardTargetId("");

      alert("Message forwarded successfully!");
    } catch (error) {
      console.error("Forward Message Error:", error);
      alert(error.message);
    } finally {
      setForwarding(false);
    }
  };

  // SEND MESSAGE, REPLY MESSAGE OR SAVE EDIT
  const sendMessage = async (e) => {
    e.preventDefault();

    const text = message.trim();

    if (!text || !activeChat) return;

    try {
      if (editingMessageId) {
        // EDIT EXISTING MESSAGE
        const response = await fetch(
          `${API_URL}/messages/${editingMessageId}`,
          {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ content: text }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to edit message.");
        }

        const updatedMessage = data.data;

        setMessagesByChat((previous) => ({
          ...previous,
          [activeChat]: (previous[activeChat] || []).map((item) =>
            String(item._id) === String(editingMessageId)
              ? updatedMessage
              : item
          ),
        }));

        setConversations((previous) =>
          previous.map((item) =>
            String(item._id) === String(activeChat) &&
            String(item.lastMessage?._id) === String(editingMessageId)
              ? { ...item, lastMessage: updatedMessage }
              : item
          )
        );

        setEditingMessageId(null);
        setMessage("");
      } else {
        // SEND NORMAL MESSAGE OR REPLY
        const response = await fetch(`${API_URL}/messages/${activeChat}`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            content: text,
            replyToId: replyingTo?._id || null,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to send message.");
        }

        const sent = result.data;

        setMessagesByChat((previous) => ({
          ...previous,
          [activeChat]: [
            ...(previous[activeChat] || []),
            sent,
          ],
        }));

        setConversations((previous) =>
          previous
            .map((item) =>
              String(item._id) === String(activeChat)
                ? {
                    ...item,
                    lastMessage: sent,
                    updatedAt: sent.createdAt,
                  }
                : item
            )
            .sort(byUpdated)
        );

        setReplyingTo(null);
        setMessage("");
      }
    } catch (error) {
      console.error("Send/Edit Message Error:", error);
      alert(error.message);
    }
  };

  const chatList = conversations.map((conversation) => ({
    ...conversation,
    info: getChatInfo(conversation, myId),
  }));

  const filteredChats = chatList.filter(
    (chat) => chat.info.type === activeTab
  );

  const selectedChat = chatList.find(
    (chat) => String(chat._id) === String(activeChat)
  );

  const selectedMessages = messagesByChat[activeChat] || [];

  const forwardTargets = chatList.filter(
    (chat) => String(chat._id) !== String(activeChat)
  );

  // Puthu message vandha keezha scroll aagum
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesByChat, activeChat]);

  return (
    <div className="messenger-page">
      <aside className="messenger-sidebar">
        <div className="messenger-brand">
          <img
            src="/102893.jpg"
            alt="AME Logo"
            className="logo-image"
          />
          <div>
            <h2>AME MESSENGER</h2>
            <p>Connect. Learn. Grow.</p>
          </div>
        </div>

        {/* CURRENT USER PROFILE */}
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
            <h4>{currentUser?.username || "My Account"}</h4>
            <p>
              <span className="online-dot"></span> Available
            </p>
          </div>
          <FaEllipsisV className="profile-menu" />
        </div>

        <div className="messenger-sidebar-heading">
          <h3>Messages</h3>
          <button
            type="button"
            className="new-chat-btn"
            onClick={() => navigate("/contact")}
            title="Create new chat"
          >
            <FaPlus />
          </button>
        </div>

        <div className="messenger-tabs">
          <button
            type="button"
            className={activeTab === "Personal" ? "active" : ""}
            onClick={() => setActiveTab("Personal")}
          >
            <FaUser /> Personal
          </button>

          <button
            type="button"
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
              type="button"
              className={`messenger-contact ${
                String(activeChat) === String(chat._id) ? "selected" : ""
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

          {loading && (
            <p className="empty-chats">Loading conversations...</p>
          )}
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
                type="button"
                className="mobile-back-btn"
                onClick={() => setActiveChat(null)}
                title="Back"
              >
                <FaArrowLeft />
              </button>

              {/* CHAT HEADER USER / GROUP PHOTO */}
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
                <button type="button" title="Voice call">
                  <FaPhone />
                </button>
                <button type="button" title="Video call">
                  <FaVideo />
                </button>
                <button type="button" title="More options">
                  <FaEllipsisV />
                </button>
                <button
                  type="button"
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

            {/* CHAT MESSAGES WITH ACTION MENU */}
            <section className="chat-messages">
              {selectedMessages.map((msg) => {
                const senderId = msg.sender?._id || msg.sender;
                const sent = String(senderId) === String(myId);

                const seen = (msg.readBy || []).some(
                  (item) =>
                    String(item.user?._id || item.user) !== String(myId)
                );

                const deleted = msg.isDeletedForEveryone;

                return (
                  <div
                    className={`message-row ${sent ? "sent" : "received"}`}
                    key={msg._id}
                  >
                    {!sent && selectedChat.info.type === "Group" && (
                      <span className="group-sender">
                        {msg.sender?.username || "Member"}
                      </span>
                    )}

                    <div className="message-bubble">
                      {/* FORWARDED LABEL */}
                      {!deleted && msg.forwardedFrom && (
                        <div className="forwarded-label">
                          <FaShare />
                          <span>Forwarded</span>
                        </div>
                      )}

                      {/* ORIGINAL REPLY MESSAGE */}
                      {msg.replyTo && (
                        <div className="reply-quoted-message">
                          <strong>
                            {msg.replyTo.sender?.username || "Original message"}
                          </strong>
                          <p>
                            {msg.replyTo.isDeletedForEveryone
                              ? "This message was deleted"
                              : msg.replyTo.content ||
                                msg.replyTo.fileName ||
                                "Attachment"}
                          </p>
                        </div>
                      )}

                      {/* MESSAGE CONTENT */}
                      {deleted ? (
                        <p className="deleted-message-text">
                          <FaTrash /> This message was deleted
                        </p>
                      ) : (
                        <p>
                          {msg.content || msg.fileName || "Attachment"}
                        </p>
                      )}

                      {/* MESSAGE TIME AND ACTIONS */}
                      <div className="message-bubble-footer">
                        <span className="message-time">
                          {formatMessageTime(msg.createdAt)}
                          {msg.editedAt && (
                            <small className="edited-label"> (edited)</small>
                          )}
                          {sent && !deleted && (
                            <span className="read-tick">
                              {seen ? "✓✓" : "✓"}
                            </span>
                          )}
                        </span>

                        <button
                          type="button"
                          className="message-actions-trigger"
                          title="Message actions"
                          aria-label="Message actions"
                          onClick={() =>
                            setOpenMessageMenu((previous) =>
                              previous === msg._id ? null : msg._id
                            )
                          }
                        >
                          <FaEllipsisV />
                        </button>
                      </div>

                      {/* MESSAGE ACTION MENU */}
                      {openMessageMenu === msg._id && (
                        <div className="message-actions-menu">
                          {!deleted && (
                            <button
                              type="button"
                              onClick={() => handleReplyMessage(msg)}
                            >
                              <FaReply /> Reply
                            </button>
                          )}

                          {!deleted && sent && msg.messageType === "text" && (
                            <button
                              type="button"
                              onClick={() => handleEditMessage(msg)}
                            >
                              <FaEdit /> Edit
                            </button>
                          )}

                          {!deleted && (
                            <button
                              type="button"
                              onClick={() => handleForwardMessage(msg)}
                            >
                              <FaShare /> Forward
                            </button>
                          )}

                          <button
                            type="button"
                            className="delete-action"
                            onClick={() => handleDeleteMessage(msg, "me")}
                          >
                            <FaTrash /> Delete for me
                          </button>

                          {!deleted && sent && (
                            <button
                              type="button"
                              className="delete-action"
                              onClick={() =>
                                handleDeleteMessage(msg, "everyone")
                              }
                            >
                              <FaTrash /> Delete for everyone
                            </button>
                          )}
                        </div>
                      )}
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

            {/* MESSAGE INPUT + REPLY / EDIT PREVIEW */}
            <form className="chat-input-area" onSubmit={sendMessage}>
              {replyingTo && (
                <div className="message-compose-context">
                  <div>
                    <strong>
                      Replying to {replyingTo.sender?.username || "Message"}
                    </strong>
                    <p>
                      {replyingTo.content ||
                        replyingTo.fileName ||
                        "Attachment"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    title="Cancel reply"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}

              {editingMessageId && (
                <div className="message-compose-context edit-context">
                  <div>
                    <strong>Editing message</strong>
                    <p>Update your message and press save.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessageId(null);
                      setMessage("");
                    }}
                    title="Cancel edit"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}

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
                placeholder={
                  editingMessageId
                    ? "Edit your message..."
                    : replyingTo
                      ? "Write a reply..."
                      : "Type your message..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button
                type="submit"
                className="send-message-btn"
                disabled={!message.trim()}
                title={editingMessageId ? "Save changes" : "Send message"}
              >
                {editingMessageId ? <FaCheck /> : <FaPaperPlane />}
              </button>
            </form>
          </>
        ) : (
          <div className="empty-conversation welcome-chat">
            <div className="empty-chat-icon">
              <FaComments />
            </div>
            <h2>Welcome to AME Messenger</h2>
            <p>Select a conversation to start messaging.</p>
          </div>
        )}
      </main>

      {/* FORWARD MESSAGE MODAL */}
      {showForwardModal && forwardingMessage && (
        <div className="forward-modal-overlay">
          <div className="forward-modal">
            <div className="forward-modal-header">
              <div>
                <h3>Forward Message</h3>
                <p>Select a contact or group.</p>
              </div>

              <button
                type="button"
                onClick={closeForwardModal}
                disabled={forwarding}
                aria-label="Close forward window"
              >
                <FaTimes />
              </button>
            </div>

            <div className="forward-message-preview">
              <FaShare />
              <p>
                {forwardingMessage.content ||
                  forwardingMessage.fileName ||
                  "Attachment"}
              </p>
            </div>

            <label className="forward-select-label">
              Select conversation
            </label>

            <select
              value={forwardTargetId}
              onChange={(e) => setForwardTargetId(e.target.value)}
            >
              <option value="">Choose contact or group</option>
              {forwardTargets.map((chat) => (
                <option key={chat._id} value={chat._id}>
                  {chat.info.type === "Group" ? "Group: " : ""}
                  {chat.info.name}
                </option>
              ))}
            </select>

            {forwardTargets.length === 0 && (
              <p className="forward-empty">
                No other conversations available.
              </p>
            )}

            <div className="forward-modal-actions">
              <button
                type="button"
                className="forward-cancel-btn"
                onClick={closeForwardModal}
                disabled={forwarding}
              >
                Cancel
              </button>

              <button
                type="button"
                className="forward-send-btn"
                onClick={confirmForwardMessage}
                disabled={!forwardTargetId || forwarding}
              >
                {forwarding ? "Forwarding..." : "Forward"}
                <FaShare />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messenger;











