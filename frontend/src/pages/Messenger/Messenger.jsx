
import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import html2pdf from "html2pdf.js";
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
  FaImage,
  FaFileVideo,
  FaFileAlt,
  FaFolderOpen,
  FaDownload,
  FaCamera,
  FaFilePdf,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "./Messenger.css";

const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

const COLORS = ["purple", "orange", "green", "blue"];

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅",
  "😂", "🤣", "😊", "😇", "🙂", "🙃",
  "😉", "😍", "🥰", "😘", "😋", "😎",
  "🤩", "🥳", "😔", "😢", "😭", "😡",
  "👍", "👎", "👏", "🙌", "🙏", "❤️",
  "💕", "💖", "🔥", "🎉", "💯", "✅",
  "📚", "📖", "✏️", "🎓", "💻", "📎",
];

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("ameToken")}`,
});

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

  let text = last.content || last.fileName || "Attachment";

  if (last.messageType === "image") text = "📷 Photo";
  if (last.messageType === "video") text = "🎥 Video";
  if (last.messageType === "file") text = `📎 ${last.fileName || "File"}`;

  if (last.messageType === "assignment") text = `📚 ${text}`;

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

  // MESSAGE MANAGEMENT
  const [openMessageMenu, setOpenMessageMenu] = useState(null);
  const [selectedActionMessage, setSelectedActionMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [forwardTargetId, setForwardTargetId] = useState("");

  // ASSIGNMENT SHARING
  const [showAssignmentPicker, setShowAssignmentPicker] = useState(false);
  const [shareableAssignments, setShareableAssignments] = useState([]);
  const [loadingShareableAssignments, setLoadingShareableAssignments] = useState(false);

  // ATTACHMENT AND EMOJI
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [scanImages, setScanImages] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const scanInputRef = useRef(null);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeChatRef = useRef(null);
  const conversationsRef = useRef([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const markAsRead = useCallback((conversationId) => {
    fetch(`${API_URL}/messages/${conversationId}/read`, {
      method: "PUT",
      headers: authHeaders(),
    }).catch(() => {});
  }, []);

  // LOAD CONVERSATIONS
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

  // OPEN CHAT
  const openChat = useCallback(
    async (conversationId) => {
      setActiveChat(conversationId);
      setUnread((previous) => ({ ...previous, [conversationId]: 0 }));

      setOpenMessageMenu(null);
      setSelectedActionMessage(null);
      setReplyingTo(null);
      setEditingMessageId(null);
      setMessage("");
      setShowAttachmentMenu(false);
      setShowEmojiPicker(false);
      setShowAssignmentPicker(false);

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

  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, [loadConversations]);

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

  // SOCKET EVENTS
  useEffect(() => {
    const token = localStorage.getItem("ameToken");

    if (!token) return undefined;

    const socket = io(SERVER_URL, { auth: { token } });

    socket.on("new-message", (incoming) => {
      const conversationId = String(incoming.conversationId);

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

        if (
          !list ||
          list.some((item) => String(item._id) === String(incoming._id))
        ) {
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

  // REPLY
  const handleReplyMessage = (msg) => {
    if (msg.isDeletedForEveryone) return;

    setReplyingTo(msg);
    setEditingMessageId(null);
    setMessage("");
    setOpenMessageMenu(null);
  };

  // EDIT
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

  // DELETE
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

  // FORWARD
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

  const closeForwardModal = () => {
    if (forwarding) return;

    setShowForwardModal(false);
    setForwardingMessage(null);
    setForwardTargetId("");
  };

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

  // SEND TEXT MESSAGE / REPLY / EDIT
  const sendMessage = async (e) => {
    e.preventDefault();

    const text = message.trim();

    if (!text || !activeChat) return;

    try {
      if (editingMessageId) {
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

  // ADD EMOJI TO MESSAGE INPUT
  const addEmoji = (emoji) => {
    setMessage((previous) => previous + emoji);
    setShowEmojiPicker(false);
  };

  // UPLOAD IMAGE / VIDEO / FILE
  const handleFileUpload = async (event, selectedType) => {
    const file = event.target.files?.[0];

    if (!file || !activeChat) {
      event.target.value = "";
      return;
    }

    try {
      setUploadingFile(true);
      setShowAttachmentMenu(false);
      setShowEmojiPicker(false);

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("ameToken");

      // IMPORTANT: FormData-ku Content-Type manually set panna koodathu.
      const uploadResponse = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || "File upload failed.");
      }

      const uploadedFile = uploadData.data;

      const response = await fetch(`${API_URL}/messages/${activeChat}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          messageType: selectedType,
          content: "",
          fileUrl: uploadedFile.fileUrl,
          fileName: uploadedFile.fileName || file.name,
          replyToId: replyingTo?._id || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to send attachment.");
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
    } catch (error) {
      console.error("Attachment Upload Error:", error);
      alert(error.message);
    } finally {
      setUploadingFile(false);
      event.target.value = "";
    }
  };

  // OPEN ASSIGNMENT PICKER
  const openAssignmentPicker = async () => {
    const user = getStoredUser();

    if (user?.role !== "teacher") {
      alert("Only teachers can share assignments.");
      return;
    }

    setShowAssignmentPicker((previous) => !previous);
    setLoadingShareableAssignments(true);

    try {
      const response = await fetch(`${API_URL}/assignments`, {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load assignments.");
      }

      setShareableAssignments(data.assignments || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoadingShareableAssignments(false);
    }
  };

  // SHARE ASSIGNMENT
  const shareAssignmentInChat = async (assignment) => {
    if (!activeChat) return;

    try {
      const response = await fetch(`${API_URL}/messages/${activeChat}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          messageType: "assignment",
          assignmentId: assignment._id,
          content: assignment.title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to share assignment.");
      }

      const sent = data.data;

      setMessagesByChat((previous) => ({
        ...previous,
        [activeChat]: [...(previous[activeChat] || []), sent],
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

      setShowAssignmentPicker(false);
    } catch (error) {
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

        <div className="messenger-profile">
          <button type="button" className="messenger-avatar profile-avatar messenger-profile-open" onClick={() => navigate("/Setting")} aria-label="Open profile settings">
            {currentUser?.profilePhoto ? (
              <img
                src={currentUser.profilePhoto}
                alt="My Profile"
                className="messenger-profile-image"
              />
            ) : (
              currentUser?.username?.charAt(0).toUpperCase() || "M"
            )}
          </button>

          <button type="button" className="profile-info messenger-profile-info-button" onClick={() => navigate("/Setting")}>

            <h4>{currentUser?.username || "My Account"}</h4>
            <p>
              <span className="online-dot"></span> Available
            </p>
          </button>

          <button type="button" className="profile-menu messenger-profile-menu-button" onClick={() => navigate("/Setting")} aria-label="Open settings"><FaEllipsisV /></button>
        </div>

        <div className="messenger-sidebar-heading">
          <h3>Messages</h3>

          <button
            type="button"
            className="new-chat-btn"
            onClick={() => navigate("/Contact")}
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

              <div className={`chat-header-actions ${selectedActionMessage ? "message-selection-actions" : ""}`}>
                {selectedActionMessage ? (
                  <>
                    <button
                      type="button"
                      title="Reply"
                      onClick={() => {
                        handleReplyMessage(selectedActionMessage);
                        setSelectedActionMessage(null);
                      }}
                    >
                      <FaReply />
                    </button>

                    {String(selectedActionMessage.sender?._id || selectedActionMessage.sender) === String(myId) &&
                      selectedActionMessage.messageType === "text" &&
                      !selectedActionMessage.isDeletedForEveryone && (
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => {
                            handleEditMessage(selectedActionMessage);
                            setSelectedActionMessage(null);
                          }}
                        >
                          <FaEdit />
                        </button>
                      )}

                    <button
                      type="button"
                      title="Forward"
                      onClick={() => {
                        handleForwardMessage(selectedActionMessage);
                        setSelectedActionMessage(null);
                      }}
                    >
                      <FaShare />
                    </button>

                    <button
                      type="button"
                      title="Delete for me"
                      onClick={() => {
                        handleDeleteMessage(selectedActionMessage, "me");
                        setSelectedActionMessage(null);
                      }}
                    >
                      <FaTrash />
                    </button>

                    {String(selectedActionMessage.sender?._id || selectedActionMessage.sender) === String(myId) &&
                      !selectedActionMessage.isDeletedForEveryone && (
                        <button
                          type="button"
                          title="Delete for everyone"
                          onClick={() => {
                            handleDeleteMessage(selectedActionMessage, "everyone");
                            setSelectedActionMessage(null);
                          }}
                        >
                          <FaTrash />
                        </button>
                      )}

                    <button
                      type="button"
                      title="Cancel selection"
                      onClick={() => setSelectedActionMessage(null)}
                    >
                      <FaTimes />
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </header>

            <div className="chat-date-divider">
              <span>TODAY</span>
            </div>

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
                      {!deleted && msg.forwardedFrom && (
                        <div className="forwarded-label">
                          <FaShare />
                          <span>Forwarded</span>
                        </div>
                      )}

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

                      {deleted ? (
                        <p className="deleted-message-text">
                          <FaTrash /> This message was deleted
                        </p>
                      ) : msg.messageType === "assignment" ? (
                        <div className="chat-assignment-card">
                          <strong><FaCheck /> Shared Assignment</strong>
                          <h4>
                            {msg.assignmentRef?.title ||
                              msg.content ||
                              "Assignment"}
                          </h4>
                          <p>
                            {msg.assignmentRef?.subject || "Academic task"}
                          </p>

                          {msg.assignmentRef?.dueDate && (
                            <small>
                              Due: {new Date(msg.assignmentRef.dueDate).toLocaleDateString()}
                            </small>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const assignmentId =
                                msg.assignmentRef?._id || msg.assignmentRef;

                              navigate(
                                assignmentId
                                  ? `/Assignment?open=${assignmentId}`
                                  : "/Assignment"
                              );
                            }}
                          >
                            View Assignment
                          </button>
                        </div>
                      ) : msg.messageType === "image" ? (
                        <div className="chat-image-attachment">
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={msg.fileUrl}
                              alt={msg.fileName || "Shared image"}
                              loading="lazy"
                            />
                          </a>
                          {msg.fileName && <small>{msg.fileName}</small>}
                        </div>
                      ) : msg.messageType === "video" ? (
                        <div className="chat-video-attachment">
                          <video controls preload="metadata">
                            <source src={msg.fileUrl} />
                            Your browser does not support video playback.
                          </video>
                          {msg.fileName && <small>{msg.fileName}</small>}
                        </div>
                      ) : msg.messageType === "file" ? (
                        <a
                          className="chat-file-attachment"
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaFileAlt />
                          <span>{msg.fileName || "Shared file"}</span>
                          <FaDownload />
                        </a>
                      ) : (
                        <p>{msg.content || "Attachment"}</p>
                      )}

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
                          onClick={() => {
                            setSelectedActionMessage((previous) =>
                              previous?._id === msg._id ? null : msg
                            );
                            setOpenMessageMenu(null);
                          }}
                        >
                          <FaEllipsisV />
                        </button>
                      </div>

                      {openMessageMenu === msg._id && !selectedActionMessage && (
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

            {/* MESSAGE INPUT */}
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

              {/* HIDDEN FILE INPUTS */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                ref={scanInputRef}
                hidden
                onChange={(event) => {
                  const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
                  if (files.length) {
                    const additions = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
                    setScanImages((previous) => [...previous, ...additions].slice(0, 12));
                    setShowScanner(true);
                  }
                  event.target.value = "";
                }}
              />
              <input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                hidden
                onChange={(e) => handleFileUpload(e, "image")}
              />

              <input
                type="file"
                accept="video/*"
                ref={videoInputRef}
                hidden
                onChange={(e) => handleFileUpload(e, "video")}
              />

              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={(e) => handleFileUpload(e, "file")}
              />

              {/* ATTACHMENT BUTTON */}
              <div className="attachment-control">
                <button
                  type="button"
                  className="input-icon-btn"
                  title="Attach image, video or file"
                  onClick={() => {
                    setShowAttachmentMenu((previous) => !previous);
                    setShowEmojiPicker(false);
                    setShowAssignmentPicker(false);
                  }}
                >
                  <FaPaperclip />
                </button>

                {showAttachmentMenu && (
                  <div className="attachment-menu">
                    <button type="button" onClick={() => imageInputRef.current?.click()}>
                      <FaImage /><span>Photo</span>
                    </button>
                    <button type="button" onClick={() => scanInputRef.current?.click()}>
                      <FaCamera /><span>Scan to PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <FaFileVideo />
                      <span>Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FaFileAlt />
                      <span>Document / File</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachmentMenu(false);
                        openAssignmentPicker();
                      }}
                    >
                      <FaFolderOpen />
                      <span>Share Assignment</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ASSIGNMENT PICKER */}
              {showAssignmentPicker && (
                <div className="assignment-share-menu">
                  <strong>Share an assignment</strong>

                  {loadingShareableAssignments ? (
                    <p>Loading assignments...</p>
                  ) : shareableAssignments.length === 0 ? (
                    <p>No assignments created yet.</p>
                  ) : (
                    shareableAssignments.map((assignment) => (
                      <button
                        type="button"
                        key={assignment._id}
                        onClick={() => shareAssignmentInChat(assignment)}
                      >
                        <span>{assignment.title}</span>
                        <small>
                          {assignment.subject} · Due{" "}
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </small>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* EMOJI PICKER */}
              <div className="emoji-control">
                <button
                  type="button"
                  className="input-icon-btn"
                  title="Choose emoji"
                  onClick={() => {
                    setShowEmojiPicker((previous) => !previous);
                    setShowAttachmentMenu(false);
                    setShowAssignmentPicker(false);
                  }}
                >
                  <FaSmile />
                </button>

                {showEmojiPicker && (
                  <div className="emoji-picker">
                    <div className="emoji-picker-heading">
                      <strong>Choose an emoji</strong>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        title="Close emoji picker"
                      >
                        <FaTimes />
                      </button>
                    </div>

                    <div className="emoji-grid">
                      {EMOJIS.map((emoji, index) => (
                        <button
                          type="button"
                          key={`${emoji}-${index}`}
                          onClick={() => addEmoji(emoji)}
                          title={`Add ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
                disabled={!message.trim() || uploadingFile}
                title={editingMessageId ? "Save changes" : "Send message"}
              >
                {editingMessageId ? <FaCheck /> : <FaPaperPlane />}
              </button>
            </form>

            {uploadingFile && (
              <div className="uploading-indicator">
                Uploading attachment... Please wait.
              </div>
            )}
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

      {/* CAMERA SCANNER / PDF MAKER */}
      {showScanner && (
        <div className="forward-modal-overlay" onClick={() => { scanImages.forEach((page) => URL.revokeObjectURL(page.preview)); setScanImages([]); setShowScanner(false); }}>
          <section className="ame-scan-modal" onClick={(event) => event.stopPropagation()}>
            <header><div><h3>Camera Scanner</h3><p>Capture pages, arrange them, then export one PDF.</p></div><button type="button" onClick={() => { scanImages.forEach((page) => URL.revokeObjectURL(page.preview)); setScanImages([]); setShowScanner(false); }} aria-label="Close scanner"><FaTimes /></button></header>
            <div className="ame-scan-pages">
              {scanImages.map((page, index) => (
                <div className="ame-scan-page" key={`${page.file.name}-${index}`}>
                  <img src={page.preview} alt={`Scanned page ${index + 1}`} />
                  <span>Page {index + 1}</span>
                  <button type="button" onClick={() => setScanImages((items) => { URL.revokeObjectURL(page.preview); return items.filter((_, i) => i !== index); })}>Remove</button>
                </div>
              ))}
              {!scanImages.length && <p>No pages captured. Use Add page to take a photo.</p>}
            </div>
            <footer>
              <button type="button" onClick={() => scanInputRef.current?.click()}><FaCamera /> Add page</button>
              <button type="button" disabled={!scanImages.length} onClick={async () => {
                const wrapper = document.createElement("div");
                wrapper.style.width = "190mm";
                scanImages.forEach((page) => {
                  const image = document.createElement("img");
                  image.src = page.preview;
                  image.style.width = "100%";
                  image.style.maxHeight = "265mm";
                  image.style.objectFit = "contain";
                  image.style.display = "block";
                  image.style.margin = "0 auto 8mm";
                  wrapper.appendChild(image);
                });
                try {
                  await Promise.all(Array.from(wrapper.querySelectorAll("img")).map((image) => image.decode().catch(() => {})));
                  await html2pdf().set({ margin: 10, filename: `ame-scan-${Date.now()}.pdf`, image: { type: "jpeg", quality: 0.95 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }).from(wrapper).save();
                  setShowScanner(false);
                  setScanImages((items) => { items.forEach((page) => URL.revokeObjectURL(page.preview)); return []; });
                } catch (error) { alert("Could not create PDF: " + error.message); }
              }}><FaFilePdf /> Create PDF</button>
            </footer>
          </section>
        </div>
      )}

      {/* FORWARD MODAL */}
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
                  (forwardingMessage.messageType === "image"
                    ? "Photo"
                    : forwardingMessage.messageType === "video"
                      ? "Video"
                      : "Attachment")}
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
