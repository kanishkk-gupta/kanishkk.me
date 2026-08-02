// chatbot.js

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const container = document.getElementById('chatbot-container');
    const closeBtn = document.getElementById('close-chatbot');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatBody = document.getElementById('chatbot-body');
    const typingIndicator = document.getElementById('typing-indicator');
    
    let chatHistory = [];
    
    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = '24px';
        this.style.height = (this.scrollHeight) + 'px';
        // Enable/disable send button
        sendBtn.disabled = this.value.trim().length === 0;
    });

    // Toggle Chatbot
    const toggleChat = () => {
        container.classList.toggle('active');
        toggleBtn.classList.toggle('open');
        if (container.classList.contains('active')) {
            chatInput.focus();
            // Add initial message if empty
            if (chatBody.querySelectorAll('.chat-message').length === 0) {
                addMessage('bot', "Hi! I'm KanishkGPT. Feel free to ask me anything about Kanishk, his projects, or his experience!");
            }
        }
    };

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Handle Enter and Shift+Enter
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Reset input
        chatInput.value = '';
        chatInput.style.height = '24px';
        sendBtn.disabled = true;
        chatInput.focus();

        // Add user message to UI
        addMessage('user', text);

        // Show typing indicator
        showTyping();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    history: chatHistory
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch response');
            }

            const data = await response.json();
            
            // Hide typing indicator
            hideTyping();
            
            // Add bot message
            addMessage('bot', data.response);
            
            // Update history
            chatHistory.push({ role: 'user', content: text });
            chatHistory.push({ role: 'model', content: data.response });
            
        } catch (error) {
            console.error('Chatbot Error:', error);
            hideTyping();
            addMessage('bot', "Oops! Something went wrong. I might be taking a coffee break. Try again later! ☕");
        }
    }

    function addMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message message-${sender}`;
        
        if (sender === 'bot') {
            msgDiv.innerHTML = formatMarkdown(text);
        } else {
            msgDiv.textContent = text; // Prevent HTML injection from user
        }
        
        // Insert before typing indicator
        chatBody.insertBefore(msgDiv, typingIndicator);
        
        // Scroll to bottom
        scrollToBottom();
    }

    function showTyping() {
        typingIndicator.classList.add('active');
        scrollToBottom();
    }

    function hideTyping() {
        typingIndicator.classList.remove('active');
    }

    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Basic Markdown Formatter for the bot's response
    function formatMarkdown(text) {
        let html = text
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Bold
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            // Bullet points
            .replace(/^\s*-\s+(.+)/gm, '<li>$1</li>')
            // Paragraphs (double newlines)
            .split(/\n\n+/)
            .map(p => {
                // If it's a list, wrap in <ul>
                if (p.includes('<li>')) {
                    return `<ul>${p}</ul>`;
                }
                // If it's a code block, leave as is
                if (p.startsWith('<pre>')) {
                    return p;
                }
                return `<p>${p.replace(/\n/g, '<br>')}</p>`;
            })
            .join('');
            
        return html;
    }
});
