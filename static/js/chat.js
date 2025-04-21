// Import wood definitions
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatToggle = document.getElementById('chat-toggle');
    const chatContainer = document.getElementById('chat-container');
    const closeChat = document.getElementById('close-chat');
    const refreshChat = document.getElementById('refresh-chat');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    
    // Track if we've shown the greeting
    let greetingShown = false;
    
    // Toggle chat visibility (open/close)
    chatToggle.addEventListener('click', function() {
        // If chat is visible, hide it; otherwise, show it
        if (chatContainer.style.display === 'flex') {
            chatContainer.style.display = 'none';
        } else {
            chatContainer.style.display = 'flex';
            
            // Show greeting message if it's the first time opening
            if (!greetingShown) {
                showGreeting();
                greetingShown = true;
            }
            
            // Focus the input field
            userInput.focus();
        }
    });
    
    // Close chat when X button is clicked
    closeChat.addEventListener('click', function() {
        chatContainer.style.display = 'none';
    });
    
    // Refresh chat (clear all messages) when refresh button is clicked
    refreshChat.addEventListener('click', function() {
        // Clear all messages
        chatMessages.innerHTML = '';
        
        // Add a small animation to the refresh button
        refreshChat.classList.add('refreshing');
        setTimeout(() => {
            refreshChat.classList.remove('refreshing');
        }, 500);
        
        // Show greeting again
        showGreeting();
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
    
    // Add a bot message to the chat with markdown support and typing animation
    function addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        // Check if message contains wood material HTML
        if (message.includes('wood-comparison')) {
            messageDiv.innerHTML = message;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return;
        }
        
        // Process markdown-like formatting for regular messages
        let formattedMessage = message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
            .replace(/\n/g, '<br>'); // Line breaks
        
        messageDiv.innerHTML = '';
        chatMessages.appendChild(messageDiv);
        
        // Type the message character by character for non-HTML content
        let i = 0;
        const typingSpeed = 5;
        const plainText = formattedMessage.replace(/<[^>]*>/g, '');
        
        function typeNextChar() {
            if (i < plainText.length) {
                messageDiv.innerHTML += plainText.charAt(i);
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
                const randomDelay = Math.floor(Math.random() * 5) + typingSpeed;
                setTimeout(typeNextChar, randomDelay);
            } else {
                // Animation complete - speak the message if supported
                if ('speechSynthesis' in window) {
                    const cleanText = message.replace(/\*\*/g, '');
                    speakMessage(cleanText);
                }
            }
        }
        
        setTimeout(typeNextChar, 100);
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
        
        // Check if it's a wood material query
        const messageLC = message.toLowerCase();
        const isWoodQuery = [
            'mdf', 'particle board', 'particleboard', 'hdhmr', 'boilo',
            'compare', 'vs', 'versus', 'difference between', 'better',
            'best', 'stronger', 'which is', 'recommend', 'prefer',
            'advantages', 'disadvantages', 'pros and cons'
        ].some(term => messageLC.includes(term));

        if (isWoodQuery) {
            // Handle wood material queries locally using wood definitions
            setTimeout(() => {
                removeTypingIndicator();
                const response = getWoodMaterialResponse(message);
                if (response) {
                    addBotMessage(response);
                } else {
                    // If no specific comparison found, send to backend
                    sendToBackend(message);
                }
            }, 500);
        } else {
            // Send all other queries to backend
            sendToBackend(message);
        }
    }

    // Function to send message to backend
    function sendToBackend(message) {
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
                // Check if this is a contact information message and format it properly
                if (data.answer.includes("I'm sorry, I don't have enough information") && 
                    data.answer.includes("Please contact our Tesa expert team")) {
                    // Create a custom formatted message with HTML
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message bot-message';
                    
                    // Clean HTML formatting with no extra line breaks
                    messageDiv.innerHTML = `
                        <p>I'm sorry, I don't have enough information to answer that question.</p>
                        <p>Please contact our Tesa expert team:</p>
                        <div style="margin-top: 10px;">
                            <div><strong>Email: </strong>customerservices@ actiontesa.com</div>
                            <div><strong>Phone: </strong>1800-3090-707</div>
                            <div><strong>Hours: </strong>Monday to Saturday, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;9 AM to 6 PM</div>
                        </div>
                    `;
                    
                    // Add directly to chat messages
                    chatMessages.appendChild(messageDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    // Custom text for speech synthesis
                    const contactText = "I'm sorry, I don't have enough information to answer that question. " +
                        "Please contact our Tesa expert team. Email: support@tesa.com. " +
                        "Phone: +91-1234567890. Hours: Monday to Saturday, 9 AM to 6 PM.";
                    if ('speechSynthesis' in window) {
                        speakMessage(contactText);
                    }
                } else if (data.answer.includes("wood comparison") || data.answer.toLowerCase().includes("compare")) {
                    // Create a custom formatted message for wood comparisons
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message bot-message';
                    
                    // Extract wood properties from the answer
                    const formattedAnswer = data.answer.replace(/\n/g, '<br>');
                    
                    // Add styled comparison table with enhanced styling
                    messageDiv.innerHTML = `
                        <div class="wood-comparison">
                            <div class="comparison-header">
                                <h4>Wood Comparison</h4>
                            </div>
                            <div class="wood-material">
                                <div class="wood-material-description">
                                    ${formattedAnswer}
                                </div>
                            </div>
                            <div class="comparison-footer">
                                <p><em>Note: Properties may vary based on specific grade and treatment</em></p>
                            </div>
                        </div>
                    `;
                    
                    // Add to chat messages
                    chatMessages.appendChild(messageDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    if ('speechSynthesis' in window) {
                        speakMessage(data.answer);
                    }
                } else {
                    addBotMessage(data.answer);
                }
            }
        })
        .catch(error => {
            // Remove typing indicator
            removeTypingIndicator();
            
            console.error('Error:', error);
            addBotMessage("Sorry, I couldn't process your request. Please try again.");
        });
    }
    
    
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

function displayMessage(message, isBot = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
    
    // For bot messages containing wood material info, render directly without escaping HTML
    if (isBot && message.includes('wood-comparison')) {
        messageDiv.innerHTML = message;
    } else {
        // For regular messages, escape HTML and handle line breaks
        const textContent = document.createElement('div');
        textContent.className = 'message-text';
        textContent.textContent = message;
        messageDiv.appendChild(textContent);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
