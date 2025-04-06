import React from 'react';
import { ChatMessageProps } from '../types';

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { type, text, timestamp } = message;
  
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const messageClass = `message ${type}-message`;
  const name = type === 'user' ? 'Customer' : type === 'agent' ? 'Agent' : 'System';

  return (
    <div className={messageClass}>
      <div className="message-header">
        <span className="message-sender">{name}</span>
        <span className="message-time">{formattedTime}</span>
      </div>
      <div className="message-content">
        {text}
      </div>
    </div>
  );
};

export default ChatMessage; 