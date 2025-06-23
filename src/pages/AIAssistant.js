import React, { useState } from 'react';
import { getAllUserTransactions } from '../firebase/transactionService';
import { askGemini } from '../services/ai/geminiService';
import ChatBubble from '../components/ChatBubble';
import VoiceInput from '../components/VoiceInput';
import '../styles/ai-assistant.css';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: 'user', text: input }]);
    setLoading(true);
    const transactions = await getAllUserTransactions();
    const aiResponse = await askGemini(input, transactions);
    setMessages(prev => [...prev, { from: 'ai', text: aiResponse }]);
    setInput('');
    setLoading(false);
  };

  return (
    <div className="ai-assistant-container">
      <h2>AI Assistant</h2>
      <div className="chat-window">
        {messages.map((msg, idx) => <ChatBubble key={idx} {...msg} />)}
        {loading && <ChatBubble from="ai" text="Thinking..." />}
      </div>
      <div className="chat-input-row">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your finances..." />
        <button onClick={handleSend} disabled={loading}>Send</button>
        <VoiceInput onResult={setInput} />
      </div>
    </div>
  );
};

export default AIAssistant;
