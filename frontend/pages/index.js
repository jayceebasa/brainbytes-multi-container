import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function Home() {
  // Changed from a single messages array to an object with subject keys
  const [conversationsBySubject, setConversationsBySubject] = useState({
    "Math": [],
    "Science": [],
    "History": [],
    "Language": [],
    "Technology": [],
    "General": []
  });
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messageEndRef = useRef(null);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [notification, setNotification] = useState('');

  // Fetch messages and organize them by subject
  const fetchMessages = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/messages');
      
      // Group messages by subject
      const messagesBySubject = {
        "Math": [],
        "Science": [],
        "History": [],
        "Language": [],
        "Technology": [],
        "General": []
      };
      
      response.data.forEach(message => {
        // Make sure the subject exists in our object, if not put it in General
        const subject = messagesBySubject.hasOwnProperty(message.subject) ? message.subject : "General";
        messagesBySubject[subject].push(message);
      });
      
      // Sort messages in each subject by timestamp
      Object.keys(messagesBySubject).forEach(subject => {
        messagesBySubject[subject].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
      
      console.log("Organized messages by subject:", 
        Object.keys(messagesBySubject).map(subject => 
          `${subject}: ${messagesBySubject[subject].length} messages`
        ));
      
      setConversationsBySubject(messagesBySubject);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  // Detect the likely subject from message text
  const detectSubject = (text) => {
    text = text.toLowerCase();
    
    if (text.includes("math") || text.includes("equation") || text.includes("calculate") || 
        text.includes("algebra") || text.includes("geometry") || text.includes("number")) {
      return "Math";
    } else if (text.includes("science") || text.includes("biology") || text.includes("chemistry") || 
              text.includes("physics") || text.includes("molecule") || text.includes("atom")) {
      return "Science";
    } else if (text.includes("history") || text.includes("war") || text.includes("century") || 
              text.includes("ancient") || text.includes("civilization")) {
      return "History";
    } else if (text.includes("language") || text.includes("grammar") || text.includes("vocabulary") || 
              text.includes("word") || text.includes("sentence") || text.includes("speak")) {
      return "Language";
    } else if (text.includes("technology") || text.includes("computer") || text.includes("software") || 
              text.includes("program") || text.includes("code") || text.includes("internet")) {
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
        setTimeout(() => setNotification(''), 3000);
      }
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!newMessage.trim()) return;
  
  try {
    setIsTyping(true);
    const userMsg = newMessage;
    setNewMessage('');
    
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
      subject: targetSubject,  // Use the selected subject or detected one
      createdAt: new Date().toISOString()
    };
    
    // Add to the appropriate subject conversation
    setConversationsBySubject(prev => ({
      ...prev,
      [targetSubject]: [...prev[targetSubject], tempUserMsg]
    }));
    
    // Send to backend and get AI response with subject
    const response = await axios.post('http://localhost:3000/api/messages', { 
      text: userMsg,
      subject: targetSubject  // Pass the subject to backend explicitly
    });
    
    console.log("Message response with subject:", 
      `User: ${response.data.userMessage.subject}, AI: ${response.data.aiMessage.subject}`);
    
    // Update with real messages from server
    setConversationsBySubject(prev => {
      // Get the current conversation for this subject
      let updatedConversation = [...prev[targetSubject]];
      
      // Remove temp message
      updatedConversation = updatedConversation.filter(msg => msg._id !== tempUserMsg._id);
      
      // Add real messages
      updatedConversation.push(response.data.userMessage, response.data.aiMessage);
      
      // Return updated state
      return {
        ...prev,
        [targetSubject]: updatedConversation
      };
    });
    
    // Make sure we stay on the current subject view - important to keep us in the current conversation
    if (!subjectFilter) {
      handleSubjectChange(targetSubject);
    }
    
  } catch (error) {
    // Error handling
    console.error('Error posting message:', error);
    
    // Show error in the active conversation
    const errorSubject = subjectFilter || "General";
    
    setConversationsBySubject(prev => ({
      ...prev,
      [errorSubject]: [...prev[errorSubject], {
        _id: Date.now().toString(),
        text: "Sorry, I couldn't process your request. Please try again later.",
        isUser: false,
        subject: errorSubject,
        createdAt: new Date().toISOString()
      }]
    }));
  } finally {
    setIsTyping(false);
  }
};

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [subjectFilter, conversationsBySubject]);

  // Load messages on component mount
  useEffect(() => {
    fetchMessages();
  }, []);

  // Get messages for current subject or all messages if no filter
  const currentMessages = subjectFilter 
    ? conversationsBySubject[subjectFilter] || []
    : [].concat(...Object.values(conversationsBySubject));
  
  // Count messages in each category for the filter buttons
  const messageCounts = {};
  Object.keys(conversationsBySubject).forEach(subject => {
    messageCounts[subject] = conversationsBySubject[subject].length;
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h1 style={{ textAlign: 'center', color: '#333', margin: '0' }}>BrainBytes AI Tutor</h1>
        <div>
          <Link href="/dashboard" style={{ marginRight: '15px', color: '#2196f3', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Link href="/profile" style={{ color: '#2196f3', textDecoration: 'none' }}>
            Profile
          </Link>
        </div>
      </div>
      
      {notification && (
        <div style={{
          backgroundColor: '#e3f2fd',
          color: '#0d47a1',
          padding: '8px 16px',
          borderRadius: '8px',
          marginBottom: '15px',
          textAlign: 'center',
          transition: 'opacity 0.5s',
          opacity: notification ? 1 : 0
        }}>
          {notification}
        </div>
      )}
      
      {/* Subject filter buttons */}
      <div style={{ marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button 
          onClick={() => handleSubjectChange('')}
          style={{
            padding: '8px 12px',
            backgroundColor: !subjectFilter ? '#2196f3' : '#f5f5f5',
            color: !subjectFilter ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          All Conversations
        </button>
        
        {Object.keys(conversationsBySubject).map(subject => (
          <button 
            key={subject}
            onClick={() => handleSubjectChange(subject)}
            style={{
              padding: '8px 12px',
              backgroundColor: subjectFilter === subject ? '#2196f3' : '#f5f5f5',
              color: subjectFilter === subject ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {subject}
            {messageCounts[subject] > 0 && (
              <span style={{
                backgroundColor: subjectFilter === subject ? 'rgba(255,255,255,0.3)' : '#e0e0e0',
                color: subjectFilter === subject ? 'white' : '#666',
                borderRadius: '50%',
                padding: '0 6px',
                fontSize: '12px',
                marginLeft: '6px'
              }}>
                {messageCounts[subject]}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div 
        style={{ 
          border: '1px solid #ddd', 
          borderRadius: '12px', 
          height: '500px', 
          overflowY: 'auto',
          padding: '16px',
          marginBottom: '20px',
          backgroundColor: '#f9f9f9',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading conversation history...</p>
          </div>
        ) : (
          <div>
            {currentMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h3>Welcome to BrainBytes AI Tutor!</h3>
                <p>{subjectFilter 
                  ? `Start a new conversation about ${subjectFilter}!` 
                  : 'Ask me any question about math, science, history, or other subjects.'}</p>
              </div>
            ) : (
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {currentMessages.map((message) => (
                  <li 
                    key={message._id} 
                    style={{ 
                      padding: '12px 16px', 
                      margin: '8px 0', 
                      backgroundColor: message.isUser ? '#e3f2fd' : '#e8f5e9',
                      color: '#333',
                      borderRadius: '12px',
                      maxWidth: '80%',
                      wordBreak: 'break-word',
                      marginLeft: message.isUser ? 'auto' : '0',
                      marginRight: message.isUser ? '0' : 'auto',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ margin: '0 0 5px 0', lineHeight: '1.5' }}>{message.text}</div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      textAlign: message.isUser ? 'right' : 'left',
                      display: 'flex',
                      justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                      alignItems: 'center'
                    }}>
                      <span>{message.isUser ? 'You' : 'AI Tutor'}</span>
                      <span style={{ margin: '0 4px'}}>•</span>
                      <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                      {message.subject && !subjectFilter && (
                        <>
                          <span style={{ margin: '0 4px'}}>•</span>
                          <span style={{
                            backgroundColor: message.isUser ? '#bbdefb' : '#c8e6c9',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '10px'
                          }}>
                            {message.subject}
                          </span>
                        </>
                      )}
                    </div>
                  </li>
                ))}
                {isTyping && (
                  <li 
                    style={{ 
                      padding: '12px 16px', 
                      margin: '8px 0', 
                      backgroundColor: '#e8f5e9',
                      color: '#333',
                      borderRadius: '12px',
                      maxWidth: '80%',
                      marginLeft: '0',
                      marginRight: 'auto',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ margin: '0' }}>AI tutor is typing...</div>
                  </li>
                )}
                <div ref={messageEndRef} />
              </ul>
            )}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={subjectFilter 
            ? `Ask a question about ${subjectFilter}...` 
            : "Ask a question..."}
          style={{ 
            flex: '1', 
            padding: '14px 16px',
            borderRadius: '12px 0 0 12px',
            border: '1px solid #ddd',
            fontSize: '16px',
            outline: 'none'
          }}
          disabled={isTyping}
        />
        <button 
          type="submit" 
          style={{ 
            padding: '14px 24px',
            backgroundColor: isTyping ? '#90caf9' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '0 12px 12px 0',
            fontSize: '16px',
            cursor: isTyping ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
          disabled={isTyping}
        >
          {isTyping ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}