import "./Messenger.css"
import React, { useState } from "react";
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
} from "react-icons/fa";

function Messenger() {
  const [activeTab, setActiveTab] = useState("Personal");
  const [activeChat, setActiveChat] = useState(1);
  const [message, setMessage] = useState("");

  const [chats, setChats] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Teacher",
      type: "Personal",
      avatar: "SJ",
      color: "purple",
      lastMessage: "Please submit your assignment.",
      time: "09:30 AM",
      online: true,
      unread: 2,
      messages: [
        {
          id: 1,
          text: "Good morning! 👋",
          time: "09:20 AM",
          sent: false,
        },
        {
          id: 2,
          text: "Good morning, Miss!",
          time: "09:22 AM",
          sent: true,
        },
        {
          id: 3,
          text: "Please submit your assignment before 5 PM.",
          time: "09:30 AM",
          sent: false,
        },
      ],
    },
    {
      id: 2,
      name: "John David",
      role: "Student",
      type: "Personal",
      avatar: "JD",
      color: "orange",
      lastMessage: "Thank you!",
      time: "Yesterday",
      online: false,
      unread: 0,
      messages: [
        {
          id: 1,
          text: "Did you finish the project?",
          time: "Yesterday",
          sent: false,
        },
        {
          id: 2,
          text: "Yes, I finished it.",
          time: "Yesterday",
          sent: true,
        },
        {
          id: 3,
          text: "Thank you!",
          time: "Yesterday",
          sent: false,
        },
      ],
    },
    {
      id: 3,
      name: "Web Development Group",
      role: "Group · 24 members",
      type: "Group",
      avatar: "WD",
      color: "green",
      lastMessage: "Alex: New notes uploaded",
      time: "10:15 AM",
      online: true,
      unread: 5,
      messages: [
        {
          id: 1,
          text: "Welcome to our Web Development group!",
          time: "10:00 AM",
          sent: false,
          sender: "Sarah",
        },
        {
          id: 2,
          text: "The new class notes are available.",
          time: "10:10 AM",
          sent: false,
          sender: "Alex",
        },
        {
          id: 3,
          text: "Thank you for sharing!",
          time: "10:15 AM",
          sent: true,
        },
      ],
    },
    {
      id: 4,
      name: "University Students",
      role: "Group · 48 members",
      type: "Group",
      avatar: "US",
      color: "blue",
      lastMessage: "Meeting at 2 PM",
      time: "Yesterday",
      online: false,
      unread: 0,
      messages: [
        {
          id: 1,
          text: "Our next meeting is at 2 PM.",
          time: "Yesterday",
          sent: false,
          sender: "Admin",
        },
      ],
    },
  ]);

  const selectedChat = chats.find((chat) => chat.id === activeChat);

  const filteredChats = chats.filter((chat) => {
    return chat.type === activeTab;
  });

  const sendMessage = (e) => {
    e.preventDefault();

    if (!message.trim() || !selectedChat) return;

    const newMessage = {
      id: Date.now(),
      text: message.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sent: true,
    };

    setChats((previousChats) =>
      previousChats.map((chat) =>
        chat.id === activeChat
          ? {
              ...chat,
              lastMessage: newMessage.text,
              time: newMessage.time,
              messages: [...chat.messages, newMessage],
            }
          : chat
      )
    );

    setMessage("");
  };

  const createChat = () => {
    const name = window.prompt(
      activeTab === "Personal"
        ? "Enter contact name:"
        : "Enter group name:"
    );

    if (!name || !name.trim()) return;

    const newChat = {
      id: Date.now(),
      name: name.trim(),
      role: activeTab === "Personal" ? "New contact" : "Group · 1 member",
      type: activeTab,
      avatar: name.trim().slice(0, 2).toUpperCase(),
      color: "blue",
      lastMessage: "Start a conversation",
      time: "Now",
      online: false,
      unread: 0,
      messages: [],
    };

    setChats((previousChats) => [...previousChats, newChat]);
    setActiveChat(newChat.id);
  };

  return (
    <div className="messenger-page">
      <aside className="messenger-sidebar">
        <div className="messenger-brand">
          <div className="messenger-logo">A</div>
          <div>
            <h2>AME MESSENGER</h2>
            <p>Connect. Learn. Grow.</p>
          </div>
        </div>

        <div className="messenger-profile">
          <div className="messenger-avatar profile-avatar">M</div>
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
            onClick={createChat}
            title="Create new chat"
          >
            <FaPlus />
          </button>
        </div>

        <div className="messenger-tabs">
          <button
            className={activeTab === "Personal" ? "active" : ""}
            onClick={() => {
              setActiveTab("Personal");
              const first = chats.find((chat) => chat.type === "Personal");
              if (first) setActiveChat(first.id);
            }}
          >
            <FaUser /> Personal
          </button>

          <button
            className={activeTab === "Group" ? "active" : ""}
            onClick={() => {
              setActiveTab("Group");
              const first = chats.find((chat) => chat.type === "Group");
              if (first) setActiveChat(first.id);
            }}
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
                activeChat === chat.id ? "selected" : ""
              }`}
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
            >
              <div className={`messenger-avatar avatar-${chat.color}`}>
                {chat.avatar}
                {chat.online && <span className="avatar-online"></span>}
              </div>

              <div className="contact-details">
                <div className="contact-top">
                  <h4>{chat.name}</h4>
                  <span>{chat.time}</span>
                </div>
                <p>{chat.lastMessage}</p>
                <small>{chat.role}</small>
              </div>

              {chat.unread > 0 && (
                <span className="unread-count">{chat.unread}</span>
              )}
            </button>
          ))}

          {filteredChats.length === 0 && (
            <p className="empty-chats">No conversations yet.</p>
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
                className="mobile-back-btn"
                onClick={() => setActiveChat(null)}
                title="Back"
              >
                <FaArrowLeft />
              </button>

              <div
                className={`messenger-avatar avatar-${selectedChat.color}`}
              >
                {selectedChat.avatar}
                {selectedChat.online && <span className="avatar-online"></span>}
              </div>

              <div className="chat-header-info">
                <h3>{selectedChat.name}</h3>
                <p>
                  {selectedChat.type === "Group" ? (
                    selectedChat.role
                  ) : selectedChat.online ? (
                    <>
                      <span className="online-dot"></span> Online
                    </>
                  ) : (
                    "Offline"
                  )}
                </p>
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
              </div>
            </header>

            <div className="chat-date-divider">
              <span>TODAY</span>
            </div>

            <section className="chat-messages">
              {selectedChat.messages.map((msg) => (
                <div
                  className={`message-row ${msg.sent ? "sent" : "received"}`}
                  key={msg.id}
                >
                  {!msg.sent && selectedChat.type === "Group" && (
                    <span className="group-sender">
                      {msg.sender || selectedChat.name}
                    </span>
                  )}

                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    <span className="message-time">
                      {msg.time} {msg.sent && "✓✓"}
                    </span>
                  </div>
                </div>
              ))}

              {selectedChat.messages.length === 0 && (
                <div className="empty-conversation">
                  <div className="empty-chat-icon">
                    {selectedChat.type === "Group" ? (
                      <FaUsers />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <h3>Start a conversation</h3>
                  <p>Send a message to get things started.</p>
                </div>
              )}
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
              <FaComments />
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