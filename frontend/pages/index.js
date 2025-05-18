import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import Head from "next/head";

export default function Home() {
  // ...existing code...
  const [conversationsBySubject, setConversationsBySubject] = useState({
    Math: [],
    Science: [],
    History: [],
    Language: [],
    Technology: [],
    General: [],
  });
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messageEndRef = useRef(null);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [notification, setNotification] = useState("");

  // Fetch messages and organize them by subject
  const fetchMessages = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/messages");

      // Group messages by subject
      const messagesBySubject = {
        Math: [],
        Science: [],
        History: [],
        Language: [],
        Technology: [],
        General: [],
      };

      response.data.forEach((message) => {
        // Check if subject exists and is one of our predefined subjects
        const validSubjects = ["Math", "Science", "History", "Language", "Technology", "General"];
        const messageSubject = message.subject || "";
        const subject = validSubjects.includes(messageSubject) ? messageSubject : "General";
        messagesBySubject[subject].push(message);
      });

      // Sort messages in each subject by timestamp
      Object.keys(messagesBySubject).forEach((subject) => {
        messagesBySubject[subject].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });

      console.log(
        "Organized messages by subject:",
        Object.keys(messagesBySubject).map((subject) => `${subject}: ${messagesBySubject[subject].length} messages`)
      );

      setConversationsBySubject(messagesBySubject);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
    }
  };

  // Detect the likely subject from message text
  const detectSubject = (text) => {
    text = text.toLowerCase();

    if (
      text.includes("math") ||
      text.includes("equation") ||
      text.includes("calculate") ||
      text.includes("algebra") ||
      text.includes("geometry") ||
      text.includes("number")
    ) {
      return "Math";
    } else if (
      text.includes("science") ||
      text.includes("biology") ||
      text.includes("chemistry") ||
      text.includes("physics") ||
      text.includes("molecule") ||
      text.includes("atom")
    ) {
      return "Science";
    } else if (text.includes("history") || text.includes("war") || text.includes("century") || text.includes("ancient") || text.includes("civilization")) {
      return "History";
    } else if (
      text.includes("language") ||
      text.includes("grammar") ||
      text.includes("vocabulary") ||
      text.includes("word") ||
      text.includes("sentence") ||
      text.includes("speak")
    ) {
      return "Language";
    } else if (
      text.includes("technology") ||
      text.includes("computer") ||
      text.includes("software") ||
      text.includes("program") ||
      text.includes("code") ||
      text.includes("internet")
    ) {
      return "Technology";
    }
    return "General";
  };

  // Handle subject change with notification
  const handleSubjectChange = (newSubject) => {
    if (subjectFilter !== newSubject) {
      setSubjectFilter(newSubject);

      // Show notification when changing subjects
      if (newSubject) {
        setNotification(`Switched to ${newSubject} conversation`);
        setTimeout(() => setNotification(""), 3000);
      }
    }
  };

  const getUserMessageCountsBySubject = () => {
    const userCounts = {};
    Object.keys(conversationsBySubject).forEach((subject) => {
      userCounts[subject] = conversationsBySubject[subject].filter((msg) => msg.isUser).length;
    });
    return userCounts;
  };

  const handleClearSubjectMessages = async (subject) => {
    try {
      // Confirm before deleting
      if (!confirm(`Are you sure you want to clear all ${subject} messages? This cannot be undone.`)) {
        return;
      }

      setLoading(true);

      // Call API to delete messages for this subject
      const response = await axios.delete(`http://localhost:3000/api/messages/subject/${subject}`);

      // Update the local state to remove the cleared messages
      setConversationsBySubject((prev) => ({
        ...prev,
        [subject]: [], // Clear the messages for this subject
      }));

      // Show notification
      setNotification(`Cleared ${response.data.deletedCount} messages from ${subject}`);
      setTimeout(() => setNotification(""), 3000);

      setLoading(false);
    } catch (error) {
      console.error("Error clearing messages:", error);
      setNotification(`Error: Could not clear ${subject} messages`);
      setTimeout(() => setNotification(""), 3000);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setIsTyping(true);
      const userMsg = newMessage;
      setNewMessage("");

      // Detect subject for message
      const detectedSubject = detectSubject(userMsg);

      // If the user has a subject filter selected, use that subject instead of auto-detecting
      // This ensures messages stay in the currently selected conversation if there is one
      const targetSubject = subjectFilter || detectedSubject;

      // Optimistically add user message to UI with subject
      const tempUserMsg = {
        _id: Date.now().toString(),
        text: userMsg,
        isUser: true,
        subject: targetSubject, // Use the selected subject or detected one
        createdAt: new Date().toISOString(),
      };

      // Add to the appropriate subject conversation
      setConversationsBySubject((prev) => ({
        ...prev,
        [targetSubject]: [...prev[targetSubject], tempUserMsg],
      }));

      // Send to backend and get AI response with subject
      const response = await axios.post("http://localhost:3000/api/messages", {
        text: userMsg,
        subject: targetSubject, // Pass the subject to backend explicitly
      });

      console.log("Message response with subject:", `User: ${response.data.userMessage.subject}, AI: ${response.data.aiMessage.subject}`);

      // Update with real messages from server
      setConversationsBySubject((prev) => {
        // Get the current conversation for this subject
        let updatedConversation = [...prev[targetSubject]];

        // Remove temp message
        updatedConversation = updatedConversation.filter((msg) => msg._id !== tempUserMsg._id);

        // Add real messages
        updatedConversation.push(response.data.userMessage, response.data.aiMessage);

        // Return updated state
        return {
          ...prev,
          [targetSubject]: updatedConversation,
        };
      });

      // Make sure we stay on the current subject view - important to keep us in the current conversation
      if (!subjectFilter) {
        handleSubjectChange(targetSubject);
      }
    } catch (error) {
      // Error handling
      console.error("Error posting message:", error);

      // Show error in the active conversation
      const errorSubject = subjectFilter || "General";

      setConversationsBySubject((prev) => ({
        ...prev,
        [errorSubject]: [
          ...prev[errorSubject],
          {
            _id: Date.now().toString(),
            text: "Sorry, I couldn't process your request. Please try again later.",
            isUser: false,
            subject: errorSubject,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    } finally {
      setIsTyping(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    // Add a small delay to ensure DOM updates are complete
    const scrollTimer = setTimeout(() => {
      if (messageEndRef.current) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);

    return () => clearTimeout(scrollTimer);
  }, [subjectFilter, conversationsBySubject]);

  // Load messages on component mount
  useEffect(() => {
    fetchMessages();
  }, []);

  // Get messages for current subject or all messages if no filter
  const currentMessages = subjectFilter ? conversationsBySubject[subjectFilter] || [] : [].concat(...Object.values(conversationsBySubject));

  // Count messages in each category for the filter buttons
  const messageCounts = {};
  Object.keys(conversationsBySubject).forEach((subject) => {
    messageCounts[subject] = conversationsBySubject[subject].length;
  });

  return (
    <>
      <Head>
        <title>BrainBytes AI Tutor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="container">
        <header>
          <h1>BrainBytes AI Tutor</h1>
          <nav>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/profile">Profile</Link>
          </nav>
        </header>

        {notification && <div className="notification">{notification}</div>}

        <div className="subject-filters">
          <button className={`filter-btn ${subjectFilter === "" ? "active" : ""}`} onClick={() => handleSubjectChange("")}>
            All ({[].concat(...Object.values(conversationsBySubject)).filter((msg) => msg.isUser).length})
          </button>

          {Object.keys(conversationsBySubject).map((subject) => {
            const userCount = getUserMessageCountsBySubject()[subject];
            return (
              <div key={subject} className="subject-filter-container">
                <button className={`filter-btn ${subjectFilter === subject ? "active" : ""}`} onClick={() => handleSubjectChange(subject)}>
                  {subject} ({userCount})
                </button>
                {conversationsBySubject[subject].length > 0 && (
                  <button className="clear-subject-btn" onClick={() => handleClearSubjectMessages(subject)} title={`Clear all ${subject} messages`}>
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="messages-container">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading conversation history...</p>
            </div>
          ) : (
            <div className="messages-list">
              {currentMessages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <h3>Welcome to BrainBytes AI Tutor!</h3>
                  <p>
                    {subjectFilter
                      ? `Start a new conversation about ${subjectFilter}!`
                      : "Ask me any question about math, science, history, or other subjects."}
                  </p>
                </div>
              ) : (
                <ul>
                  {currentMessages.map((message) => (
                    <li key={message._id} className={`message ${message.isUser ? "user" : "ai"}`}>
                      <div className="message-content">{message.text}</div>
                      <div className="message-meta">
                        <span className="sender">{message.isUser ? "You" : "AI Tutor"}</span>
                        <span className="separator">•</span>
                        <span className="time">{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {message.subject && !subjectFilter && (
                          <>
                            <span className="separator">•</span>
                            <span className="subject-tag">{message.subject}</span>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                  {isTyping && (
                    <li className="message ai typing">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <div className="message-meta">
                        <span>AI Tutor is thinking...</span>
                      </div>
                    </li>
                  )}
                  <div ref={messageEndRef} />
                </ul>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="message-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={subjectFilter ? `Ask a question about ${subjectFilter}...` : "Ask a question..."}
            disabled={isTyping}
          />
          <button type="submit" disabled={isTyping}>
            {isTyping ? "Sending..." : "Send"}
          </button>
        </form>
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          color: #333;
          background-color: #f5f7fa;
          line-height: 1.6;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eaedf3;
        }

        header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a56db;
          margin: 0;
        }

        header nav {
          display: flex;
          gap: 16px;
        }

        header nav a {
          color: #4b5563;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
          padding: 6px 10px;
          border-radius: 6px;
        }

        header nav a:hover {
          color: #1a56db;
          background-color: rgba(26, 86, 219, 0.05);
        }

        .notification {
          background-color: #eef6ff;
          color: #1e40af;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 500;
          animation: fadeIn 0.3s ease-in-out;
          border-left: 4px solid #3b82f6;
        }

        .subject-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eaedf3;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }

        .subject-filters button {
          padding: 8px 16px;
          background-color: #ffffff;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .subject-filters button:hover {
          background-color: #f9fafb;
          border-color: #d1d5db;
        }

        .subject-filters button.active {
          background-color: #1a56db;
          color: white;
          border-color: #1a56db;
        }

        .count-badge {
          background-color: rgba(255, 255, 255, 0.2);
          color: inherit;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
        }

        button:not(.active) .count-badge {
          background-color: #e5e7eb;
          color: #4b5563;
        }

        .messages-container {
          flex: 1;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          margin-bottom: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 220px); /* Set a max height */
        }

        .messages-list {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
          display: flex;
          flex-direction: column; /* Ensure vertical stacking */
        }

        .messages-list ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .message {
          margin-bottom: 16px;
          max-width: 80%;
          position: relative;
          animation: fadeIn 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .message.user {
          align-self: flex-end;
          margin-left: auto; /* Properly align to the right */
        }

        .message.ai {
          align-self: flex-start;
          margin-right: auto; /* Properly align to the left */
        }

        .message-content {
          padding: 12px 16px;
          border-radius: 12px;
          line-height: 1.5;
        }

        .user .message-content {
          background-color: #1a56db;
          color: white;
          border-bottom-right-radius: 2px;
          border-top-right-radius: 8px;
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
        }

        .ai .message-content {
          background-color: #f3f4f6;
          color: #1f2937;
          border-bottom-left-radius: 2px;
          border-top-right-radius: 12px;
          border-top-left-radius: 8px;
          border-bottom-right-radius: 12px;
        }

        .message-meta {
          font-size: 0.75rem;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0.8;
        }

        .user .message-meta {
          justify-content: flex-end;
          padding-right: 4px;
        }

        .ai .message-meta {
          padding-left: 4px;
        }

        .separator {
          font-size: 0.6rem;
          opacity: 0.6;
        }

        .subject-tag {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .user .subject-tag {
          background-color: rgba(255, 255, 255, 0.2);
          color: #1a56db;
        }

        .ai .subject-tag {
          background-color: #e5e7eb;
          color: #4b5563;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          height: 100%;
          padding: 40px 20px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          opacity: 0.8;
        }

        .empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: #111827;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 16px;
          color: #6b7280;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background-color: #9ca3af;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }

        .message-form {
          display: flex;
          gap: 12px;
          position: relative;
        }

        .message-form input {
          flex: 1;
          padding: 14px 20px;
          border: 1px solid #e5e7eb;
          background-color: #ffffff;
          border-radius: 12px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .message-form input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }

        .message-form input::placeholder {
          color: #9ca3af;
        }

        .message-form input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        .message-form button {
          padding: 14px 24px;
          background-color: #1a56db;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .message-form button:hover {
          background-color: #1e429f;
        }

        .message-form button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        /* Responsive styles */
        @media (max-width: 768px) {
          .container {
            padding: 16px;
            height: 100vh;
          }

          header {
            margin-bottom: 16px;
          }

          header h1 {
            font-size: 1.5rem;
          }

          .messages-container {
            margin-bottom: 16px;
          }

          .message {
            max-width: 90%;
          }
        }

        @media (max-width: 640px) {
          .subject-filters {
            padding-bottom: 12px;
            margin-bottom: 12px;
          }

          .subject-filters button {
            padding: 6px 12px;
            font-size: 0.8125rem;
          }

          .message-form {
            flex-direction: column;
            gap: 8px;
          }

          .message-form input,
          .message-form button {
            width: 100%;
            border-radius: 8px;
            padding: 12px 16px;
          }

          .message {
            max-width: 95%;
          }
        }

        @media (max-width: 480px) {
          header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          header nav {
            width: 100%;
            justify-content: flex-start;
          }
          .subject-filter-container {
            position: relative;
            display: inline-flex;
            align-items: center;
          }

          .clear-subject-btn {
            position: absolute;
            top: -8px;
            right: -6px;
            width: 16px;
            height: 16px;
            background-color: #e5e7eb;
            color: #6b7280;
            border: none;
            border-radius: 50%;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            padding: 0;
            line-height: 1;
          }

          .clear-subject-btn:hover {
            background-color: #ef4444;
            color: white;
          }
        }
      `}</style>
    </>
  );
}
