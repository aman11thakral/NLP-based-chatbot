document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const userInput = document.getElementById('user-input');
    const voiceStatus = document.getElementById('voice-status');
    
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        // Configure recognition
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        // Variable to track if we're currently listening
        let isListening = false;
        
        // Add event listener to microphone button
        voiceInputBtn.addEventListener('click', toggleListening);
        
        function toggleListening() {
            if (isListening) {
                // Stop listening
                recognition.stop();
                voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceInputBtn.classList.remove('btn-danger');
                voiceInputBtn.classList.add('btn-secondary');
                voiceStatus.textContent = '';
                isListening = false;
            } else {
                // Start listening
                recognition.start();
                voiceInputBtn.innerHTML = '<i class="fas fa-stop"></i>';
                voiceInputBtn.classList.remove('btn-secondary');
                voiceInputBtn.classList.add('btn-danger');
                voiceStatus.textContent = 'Listening...';
                isListening = true;
            }
        }
        
        // Recognition event handlers
        recognition.onresult = function(event) {
            const speechResult = event.results[0][0].transcript;
            userInput.value = speechResult;
            
            // Automatically submit if confidence is high enough
            if (event.results[0][0].confidence > 0.75) {
                // Trigger the send button click after a short delay
                setTimeout(() => {
                    document.getElementById('send-btn').click();
                }, 500);
            }
            
            voiceStatus.textContent = '';
            isListening = false;
            voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceInputBtn.classList.remove('btn-danger');
            voiceInputBtn.classList.add('btn-secondary');
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            voiceStatus.textContent = 'Error: ' + event.error;
            isListening = false;
            voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceInputBtn.classList.remove('btn-danger');
            voiceInputBtn.classList.add('btn-secondary');
        };
        
        recognition.onend = function() {
            // Reset the button state if recognition ends for any reason
            isListening = false;
            voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceInputBtn.classList.remove('btn-danger');
            voiceInputBtn.classList.add('btn-secondary');
            
            if (voiceStatus.textContent === 'Listening...') {
                voiceStatus.textContent = '';
            }
        };
    } else {
        // Browser doesn't support speech recognition
        voiceInputBtn.style.display = 'none';
        voiceStatus.textContent = 'Voice input not supported in this browser';
    }
});
