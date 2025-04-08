document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatToggle = document.getElementById('chat-toggle');
    const chatContainer = document.getElementById('chat-container');
    const closeChat = document.getElementById('close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    
    // Track if we've shown the greeting
    let greetingShown = false;
    
    // Toggle chat visibility
    chatToggle.addEventListener('click', function() {
        chatContainer.style.display = 'flex';
        // Keep the toggle button visible (removed the line that hides it)
        
        // Show greeting message if it's the first time opening
        if (!greetingShown) {
            showGreeting();
            greetingShown = true;
        }
        
        // Focus the input field
        userInput.focus();
    });
    
    // Close chat
    closeChat.addEventListener('click', function() {
        chatContainer.style.display = 'none';
        chatToggle.style.display = 'flex';
    });
    
    // Send message on button click
    sendBtn.addEventListener('click', function() {
        sendMessage();
    });
    
    // Send message on Enter key
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Show greeting message
    function showGreeting() {
        addBotMessage("👋 Hi there! I'm your Tesa Assistant.");
        setTimeout(() => {
            addBotMessage("I can answer questions about wood, MDF, particle board, HDHMR, BOILO, and more. How can I help you today?");
        }, 300); // Made the delay shorter for faster transitions
    }
    
    // Add a user message to the chat
    function addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Add a bot message to the chat with markdown support
    function addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        // Process markdown-like formatting (bold text and line breaks)
        let formattedMessage = message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
            .replace(/\n/g, '<br>'); // Line breaks
            
        messageDiv.innerHTML = formattedMessage;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Speak the message if speech synthesis is supported
        if ('speechSynthesis' in window) {
            // Remove HTML tags for speech
            const cleanText = message.replace(/\*\*/g, '');
            speakMessage(cleanText);
        }
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // Send message to the backend
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addUserMessage(message);
        
        // Clear input field
        userInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Send message to backend
        fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: message }),
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            removeTypingIndicator();
            
            if (data.error) {
                addBotMessage("Sorry, I encountered an error: " + data.error);
            } else {
                addBotMessage(data.answer);
            }
        })
        .catch(error => {
            // Remove typing indicator
            removeTypingIndicator();
            
            console.error('Error:', error);
            addBotMessage("Sorry, I couldn't process your request. Please try again.");
        });
    }
    
    // Function to speak the message using Web Speech API
    function speakMessage(message) {
        // Cancel any previous speech
        window.speechSynthesis.cancel();
        
        // Create new speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(message);
        
        // Set properties
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        // Speak the message
        window.speechSynthesis.speak(utterance);
    }
});
