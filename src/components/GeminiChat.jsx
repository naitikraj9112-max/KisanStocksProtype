import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiMinimize2 } from 'react-icons/fi';
import { sendMessage, resetChat } from '../services/geminiService';
import { useLanguage } from '../utils/LanguageContext';

export default function GeminiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { lang } = useLanguage();

  const welcomeMessage = lang === 'hi' 
    ? "नमस्ते! मैं किसानबॉट (ओपनराउटर) हूँ। खेती, मिट्टी या मौसम से जुड़ी कोई भी जानकारी पूछें।"
    : "Hello! I am KisanBot (powered by OpenRouter). Ask me anything about farming, soil, or weather.";

  // Initialize with welcome message and update it if language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0) {
        return [{ role: 'assistant', text: welcomeMessage, isWelcome: true }];
      }
      // Only update the first message if it's our placeholder welcome message
      if (prev[0].isWelcome) {
        const newMsgs = [...prev];
        newMsgs[0].text = welcomeMessage;
        return newMsgs;
      }
      return prev;
    });
  }, [welcomeMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await sendMessage(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (err) {
      console.error(err);
      
      let errorMsg = lang === 'hi' ? "क्षमा करें, मुझे इसका उत्तर देने में समस्या आ रही है।" : "Sorry, I am having trouble responding right now.";
      
      // If the error mentions API key or fetching, provide a helpful hint
      if (err.message.includes("API key not valid") || err.message.includes("placeholder")) {
        errorMsg += lang === 'hi' ? "\n\n(API Key अमान्य है। कृपया .env जांचें)" : "\n\n(API Key is invalid. Please check .env and restart server if needed.)";
      } else if (err.message) {
        errorMsg += `\n\n[Error: ${err.message}]`;
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: errorMsg,
        isError: true 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    resetChat();
    setMessages([{ role: 'assistant', text: welcomeMessage, isWelcome: true }]);
  };

  if (!isOpen) {
    return (
      <button className="gemini-chat-fab" onClick={() => setIsOpen(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="gemini-sparkle-icon">
          <path d="M12 2v20"></path>
          <path d="M2 12h20"></path>
          <path d="m19 5-14 14"></path>
          <path d="M5 5l14 14"></path>
        </svg>
        <span className="fab-tooltip">{lang === 'hi' ? 'AI से पूछें' : 'Ask AI'}</span>
      </button>
    );
  }

  return (
    <div className="gemini-chat-window animate-slide-up">
      <div className="chat-header">
        <div className="chat-header-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20"></path>
            <path d="M2 12h20"></path>
            <path d="m19 5-14 14"></path>
            <path d="M5 5l14 14"></path>
          </svg>
          KisanBot (OpenRouter)
        </div>
        <div className="chat-actions">
          <button onClick={handleClear} className="chat-action-btn" title={lang === 'hi' ? 'चैट साफ़ करें' : 'Clear Chat'}>
            <FiMinimize2 size={16} />
          </button>
          <button onClick={() => setIsOpen(false)} className="chat-action-btn" title={lang === 'hi' ? 'बंद करें' : 'Close'}>
            <FiX size={18} />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble-wrapper ${msg.role === 'user' ? 'user-msg' : 'ai-msg'}`}>
            <div className={`chat-bubble ${msg.isError ? 'chat-bubble-error' : ''}`}>
              {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="chat-bubble-wrapper ai-msg">
             <div className="chat-bubble typing-indicator">
               <span></span><span></span><span></span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={lang === 'hi' ? 'कोई प्रश्न पूछें...' : 'Ask a question...'}
          className="chat-input"
          disabled={isTyping}
        />
        <button type="submit" className="chat-send-btn" disabled={!inputValue.trim() || isTyping}>
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
}
