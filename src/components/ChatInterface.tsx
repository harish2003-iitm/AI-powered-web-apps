import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageType, Ticket, ProcessingResults } from '../types';
import { createMessage, generateTicketId, formatConversation } from '../utils/helpers';
import { apiService } from '../services/api';
import ChatMessage from './ChatMessage';
import ProcessingIndicator from './ProcessingIndicator';
import ResultPanel from './ResultPanel';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState('');
  const [results, setResults] = useState<ProcessingResults | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resultsPanelRef = useRef<HTMLDivElement>(null);
  const chatInterfaceRef = useRef<HTMLDivElement>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Check if API is available on mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await apiService.healthCheck();
        setIsApiAvailable(response.status === 'ok');
        
        if (response.status === 'ok') {
          addSystemMessage('Connected to support system. How can I help you today?');
        } else {
          addSystemMessage('Warning: Could not connect to support system. Chat functionality will be limited.');
        }
      } catch (error) {
        console.error('API health check failed:', error);
        setIsApiAvailable(false);
        addSystemMessage('Warning: Could not connect to support system. Chat functionality will be limited.');
      }
    };
    
    checkApiStatus();
    
    // Initialize with a welcome message
    addSystemMessage('Welcome to the support chat! Please describe your issue.');
    
    // Generate a ticket ID
    setTicketId(generateTicketId());
    
    return () => {
      // Clean up interval on unmount
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to results panel when results are received
  useEffect(() => {
    if (results && resultsPanelRef.current) {
      setTimeout(() => {
        resultsPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300); // Small delay to ensure panel is rendered
    }
  }, [results]);

  // Setup scroll watcher
  useEffect(() => {
    const handleScroll = () => {
      if (!resultsPanelRef.current || !chatInterfaceRef.current) return;
      
      // Check if results panel is out of view and show/hide scroll button accordingly
      const resultsPanelTop = resultsPanelRef.current.getBoundingClientRect().top;
      const chatInterfaceBottom = chatInterfaceRef.current.getBoundingClientRect().bottom;
      
      // Show button if results panel is below the visible area
      setShowScrollButton(resultsPanelTop > chatInterfaceBottom);
    };
    
    // Add scroll event listener
    const chatInterface = chatInterfaceRef.current;
    if (chatInterface && results) {
      chatInterface.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
    }
    
    return () => {
      if (chatInterface) {
        chatInterface.removeEventListener('scroll', handleScroll);
      }
    };
  }, [results]);

  // Poll for job status when jobId changes
  useEffect(() => {
    if (jobId && jobStatus !== 'completed' && jobStatus !== 'failed') {
      // Clear any existing interval
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      
      // Set up polling for job status
      statusCheckInterval.current = setInterval(checkJobStatus, 3000);
      
      // Initial check
      checkJobStatus();
      
      return () => {
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
        }
      };
    }
  }, [jobId, jobStatus]);

  const checkJobStatus = async () => {
    if (!jobId) return;
    
    try {
      const statusResult = await apiService.getJobStatus(jobId);
      console.log("API Response:", statusResult); // Debug log to see full response
      
      // Check the first result in the array for the job we're interested in
      const jobResult = statusResult.results.find(result => result.ticket_id === ticketId);
      
      if (jobResult) {
        setJobStatus(jobResult.status);
        
        if (jobResult.status === 'completed' && jobResult.results) {
          // Create a modified results object that includes the submitted content
          const enhancedResults = {
            ...jobResult.results,
            // Ensure we capture the raw API response
            raw_json: statusResult,
            // Add query information to help with debugging
            query_info: {
              ticket_id: ticketId,
              submitted_at: new Date().toISOString(),
              conversation: formatConversation(messages),
            }
          };
          
          console.log("Enhanced results being set:", enhancedResults); // Debug log
          setResults(enhancedResults);
          addSystemMessage('Ticket analysis complete. View the results in the panel below.');
          
          // Clear interval when job is complete
          if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current);
          }
        } else if (jobResult.status === 'failed') {
          addSystemMessage('Ticket analysis failed. Please try again or contact support.');
          
          // Clear interval when job fails
          if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current);
          }
        }
      }
    } catch (error) {
      console.error('Error checking job status:', error);
      
      // Don't set job status to failed here to allow retrying
      addSystemMessage('Error checking ticket status. Will retry shortly.');
    }
  };

  const addSystemMessage = (text: string) => {
    const systemMessage = createMessage('system', text);
    setMessages(prev => [...prev, systemMessage]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToResults = () => {
    resultsPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    const userMessage = createMessage('user', inputValue);
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // If we have enough messages (at least one user message), submit the ticket
    if (isApiAvailable && messages.length > 0) {
      await submitTicket();
    }
  };

  const submitTicket = async () => {
    setIsProcessing(true);
    
    try {
      // Create ticket object
      const userMessages = [...messages, ...messages.filter(m => m.type === 'user')];
      const conversation = formatConversation(userMessages);
      
      const ticket: Ticket = {
        ticket_id: ticketId,
        conversation: conversation,
        metadata: {
          priority: 'medium'
        }
      };
      
      // Submit ticket to API
      const response = await apiService.submitTicket(ticket);
      
      // Store job ID for status polling
      if (response.job_id) {
        setJobId(response.job_id);
        addSystemMessage(`Ticket ${ticketId} submitted successfully. Processing...`);
      } else {
        throw new Error('No job ID returned from API');
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      addSystemMessage('Error submitting ticket. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetChat = () => {
    // Clear all state
    setMessages([]);
    setJobId('');
    setJobStatus('');
    setResults(null);
    setIsProcessing(false);
    setShowScrollButton(false);
    
    // Generate a new ticket ID
    const newTicketId = generateTicketId();
    setTicketId(newTicketId);
    
    // Add welcome message
    addSystemMessage('Chat reset. New ticket ID: ' + newTicketId);
    addSystemMessage('Welcome to the support chat! Please describe your issue.');
  };

  return (
    <div ref={chatInterfaceRef} className="chat-interface">
      <div className="chat-header">
        <h2>Customer Support Chat</h2>
        <div className="ticket-info">
          <span>Ticket ID: {ticketId}</span>
        </div>
      </div>
      
      <div className="chat-container">
        <div className="messages-container">
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <ProcessingIndicator 
          visible={isProcessing}
          jobId={jobId}
          status={jobStatus}
        />
        
        <form className="message-input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type your message here..."
            disabled={isProcessing}
          />
          <button 
            type="submit" 
            disabled={isProcessing || !inputValue.trim()}
          >
            Send
          </button>
          <button 
            type="button" 
            className="reset-button"
            onClick={handleResetChat}
          >
            New Chat
          </button>
        </form>
      </div>
      
      {results && (
        <div ref={resultsPanelRef} className="results-container">
          <ResultPanel results={results} />
        </div>
      )}
      
      {showScrollButton && results && (
        <div className="scroll-to-panel" onClick={scrollToResults}>
          <i></i>
        </div>
      )}
    </div>
  );
};

export default ChatInterface; 