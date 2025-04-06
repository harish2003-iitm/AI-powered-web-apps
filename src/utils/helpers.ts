import { Message, MessageType } from '../types';

/**
 * Generate a random ID string
 * @returns A random ID string
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Generates a random ticket ID
 */
export const generateTicketId = (): string => {
  return `TICKET-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

/**
 * Creates a new message object
 */
export const createMessage = (type: MessageType, text: string): Message => {
  return {
    id: generateId(),
    type,
    text,
    timestamp: new Date()
  };
};

/**
 * Converts a conversation to the format expected by the API
 */
export const formatConversation = (messages: Message[]): string => {
  return messages
    .filter(msg => msg.type !== 'system')
    .map(msg => {
      if (msg.type === 'agent') return `Agent: ${msg.text}`;
      if (msg.type === 'user') return `Customer: ${msg.text}`;
      return '';
    })
    .filter(text => text !== '')
    .join('\n\n');
};

/**
 * Extracts JSON data for display
 */
export const formatJsonForDisplay = (data: any): string => {
  return JSON.stringify(data, null, 2);
}; 