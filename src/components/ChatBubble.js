import React from 'react';

const ChatBubble = ({ from, text }) => (
  <div className={`chat-bubble ${from === 'user' ? 'user' : 'ai'}`}>
    <span>{text}</span>
  </div>
);

export default ChatBubble;
