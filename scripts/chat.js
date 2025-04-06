// Chat application script
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatMessages = document.getElementById('chat-messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const ticketIdEl = document.getElementById('ticket-id');
  const resultsPanel = document.getElementById('results-panel');
  
  // Tab content elements
  const summaryData = document.getElementById('summary-data');
  const routingData = document.getElementById('routing-data');
  const recommendationsData = document.getElementById('recommendations-data');
  const estimationData = document.getElementById('estimation-data');
  const insightsData = document.getElementById('insights-data');
  
  // State
  const state = {
    ticketId: 'TICKET-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
    isProcessing: false,
    jobId: null,
    refreshInterval: null,
    results: null
  };
  
  // Initialize ticket ID
  ticketIdEl.textContent = `Ticket: ${state.ticketId}`;
  
  // Initialize with agent greeting
  addMessage('agent', 'Hello! I\'m your support assistant. How can I help you today?');
  addMessage('system', `Your ticket ID is ${state.ticketId}`);
  
  // Event Listeners
  sendButton.addEventListener('click', handleSendMessage);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  
  // Set up tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const contentId = `${tab.dataset.tab}-content`;
      document.getElementById(contentId).classList.add('active');
    });
  });
  
  // Functions
  function addMessage(type, text) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', `${type}-message`);
    messageEl.textContent = text;
    chatMessages.appendChild(messageEl);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function addProcessingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('processing-indicator');
    indicator.id = 'processing-indicator';
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      indicator.appendChild(dot);
    }
    
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function removeProcessingIndicator() {
    const indicator = document.getElementById('processing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  async function handleSendMessage() {
    if (!messageInput.value.trim() || state.isProcessing) return;
    
    // Add user message to chat
    addMessage('user', messageInput.value);
    const userInput = messageInput.value;
    messageInput.value = '';
    
    // If this is the first user message, begin processing
    if (!state.isProcessing && !state.jobId) {
      // Add waiting message and processing indicator
      addMessage('agent', 'Thanks for sharing your issue. I\'m processing your request and will get back to you in 2-3 minutes. A team of specialized agents are analyzing your case.');
      addProcessingIndicator();
      
      state.isProcessing = true;
      messageInput.disabled = true;
      sendButton.disabled = true;
      
      // Prepare conversation text (gather all messages)
      const messages = Array.from(document.querySelectorAll('.message'));
      const conversationText = messages
        .map(msg => {
          if (msg.classList.contains('agent-message')) return `Agent: ${msg.textContent}`;
          if (msg.classList.contains('user-message')) return `Customer: ${msg.textContent}`;
          return '';
        })
        .filter(text => text !== '')
        .join('\n\n');
      
      try {
        // Submit the ticket
        const response = await fetch('http://127.0.0.1:8001/process_tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tickets: [
              {
                ticket_id: state.ticketId,
                conversation: conversationText,
                metadata: {
                  priority: "medium"
                }
              }
            ]
          }),
        });
        
        const data = await response.json();
        state.jobId = data.job_id;
        
        // Start polling for results
        state.refreshInterval = setInterval(() => {
          checkJobStatus(data.job_id);
        }, 3000);
      } catch (err) {
        addMessage('system', `Error: ${err.message}`);
        state.isProcessing = false;
        messageInput.disabled = false;
        sendButton.disabled = false;
        removeProcessingIndicator();
      }
    }
  }
  
  async function checkJobStatus(id) {
    try {
      const response = await fetch(`http://127.0.0.1:8001/job_status/${id}`, {
        method: 'GET',
      });
      
      const data = await response.json();
      
      // Check if processing is complete
      const ticket = data.results[0];
      if (ticket && ticket.status === 'completed') {
        state.results = ticket.results;
        clearInterval(state.refreshInterval);
        state.refreshInterval = null;
        state.isProcessing = false;
        messageInput.disabled = false;
        sendButton.disabled = false;
        removeProcessingIndicator();
        
        // Display results
        displayResults(ticket.results);
        
        // Add final message from agent
        const summaryText = ticket.results.summary.error 
          ? "I couldn't summarize your issue properly, but here's what I understand:" 
          : ticket.results.summary.summary;
          
        addMessage('agent', `I've completed analyzing your issue. ${summaryText}\n\nBased on my analysis, I've routed this to the appropriate team and provided recommendations. You can view the full details in the results panel below.`);
      }
    } catch (err) {
      console.error("Error checking job status:", err);
    }
  }
  
  function displayResults(results) {
    // Show results panel
    resultsPanel.classList.add('visible');
    
    // Populate data
    summaryData.textContent = JSON.stringify(results.summary, null, 2);
    routingData.textContent = JSON.stringify(results.routing, null, 2);
    recommendationsData.textContent = JSON.stringify(results.recommendations, null, 2);
    estimationData.textContent = JSON.stringify(results.estimation, null, 2);
    insightsData.textContent = results.final_insights;
  }
}); 