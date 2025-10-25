class RafiqChat {
    constructor() {
        this.backendUrl = 'rafiq-ul-islam-production.up.railway.app';
        this.currentChatId = this.generateChatId();
        this.chatHistory = this.loadChatHistory();
        this.settings = this.loadSettings();
        
        this.initializeElements();
        this.init();
    }

    initializeElements() {
        // Core elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.menuToggle = document.getElementById('menuToggle');
        this.mobileOverlay = document.getElementById('mobileOverlay');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.chatHistoryElement = document.getElementById('chatHistory');
        
        // Settings elements
        this.settingsPanel = document.getElementById('settingsPanel');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.closeSettings = document.getElementById('closeSettings');
        
        // Settings controls
        this.memorySetting = document.getElementById('memorySetting');
        this.responseLength = document.getElementById('responseLength');
        this.themeSetting = document.getElementById('themeSetting');
        this.fontSize = document.getElementById('fontSize');
        this.madhabSetting = document.getElementById('madhabSetting');
        this.languageStyle = document.getElementById('languageStyle');
        
        // Quick questions
        this.quickQuestions = document.querySelectorAll('.question-chip');
    }

    init() {
        this.setupEventListeners();
        this.autoResizeTextarea();
        this.applySettings();
        this.renderChatHistory();
        this.testBackendConnection();
        this.loadCurrentChat();
    }

    setupEventListeners() {
        // Message sending
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Sidebar controls
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.menuToggle.addEventListener('click', () => this.toggleSidebar());
        this.mobileOverlay.addEventListener('click', () => this.toggleSidebar());
        this.newChatBtn.addEventListener('click', () => this.startNewChat());

        // Settings controls
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettings.addEventListener('click', () => this.closeSettingsPanel());

        // Settings changes
        if (this.memorySetting) {
            this.memorySetting.addEventListener('change', () => this.saveSettings());
        }
        if (this.responseLength) {
            this.responseLength.addEventListener('change', () => this.saveSettings());
        }
        if (this.themeSetting) {
            this.themeSetting.addEventListener('change', () => this.changeTheme());
        }
        if (this.fontSize) {
            this.fontSize.addEventListener('change', () => this.changeFontSize());
        }
        if (this.madhabSetting) {
            this.madhabSetting.addEventListener('change', () => this.saveSettings());
        }
        if (this.languageStyle) {
            this.languageStyle.addEventListener('change', () => this.saveSettings());
        }

        // Quick questions
        this.quickQuestions.forEach(chip => {
            chip.addEventListener('click', () => {
                const question = chip.getAttribute('data-question');
                this.messageInput.value = question;
                this.sendMessage();
            });
        });

        // Click outside settings to close
        document.addEventListener('click', (e) => {
            if (this.settingsPanel && !this.settingsPanel.contains(e.target) && 
                this.settingsBtn && !this.settingsBtn.contains(e.target)) {
                this.closeSettingsPanel();
            }
        });

        // PWA Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('Service Worker Registered'))
                .catch(err => console.log('Service Worker Registration Failed'));
        }
    }

    generateChatId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    loadChatHistory() {
        try {
            const history = localStorage.getItem('rafiq_chat_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading chat history:', error);
            return [];
        }
    }

    saveChatHistory() {
        try {
            localStorage.setItem('rafiq_chat_history', JSON.stringify(this.chatHistory));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    loadSettings() {
        try {
            const settings = localStorage.getItem('rafiq_settings');
            const defaultSettings = {
                memory: 'full',
                responseLength: 'medium',
                theme: 'dark',
                fontSize: 'medium',
                madhab: 'none',
                languageStyle: 'balanced'
            };
            
            if (settings) {
                return { ...defaultSettings, ...JSON.parse(settings) };
            }
            return defaultSettings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return {
                memory: 'full',
                responseLength: 'medium',
                theme: 'dark',
                fontSize: 'medium',
                madhab: 'none',
                languageStyle: 'balanced'
            };
        }
    }

    saveSettings() {
        try {
            this.settings = {
                memory: this.memorySetting?.value || 'full',
                responseLength: this.responseLength?.value || 'medium',
                theme: this.themeSetting?.value || 'dark',
                fontSize: this.fontSize?.value || 'medium',
                madhab: this.madhabSetting?.value || 'none',
                languageStyle: this.languageStyle?.value || 'balanced'
            };
            
            localStorage.setItem('rafiq_settings', JSON.stringify(this.settings));
            this.applySettings();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    applySettings() {
        // Apply theme
        if (this.settings.theme) {
            document.documentElement.setAttribute('data-theme', this.settings.theme);
            if (this.themeSetting) {
                this.themeSetting.value = this.settings.theme;
            }
        }

        // Apply font size
        if (this.settings.fontSize) {
            document.body.style.fontSize = this.getFontSizeValue(this.settings.fontSize);
            if (this.fontSize) {
                this.fontSize.value = this.settings.fontSize;
            }
        }

        // Apply other settings
        if (this.memorySetting && this.settings.memory) {
            this.memorySetting.value = this.settings.memory;
        }
        if (this.responseLength && this.settings.responseLength) {
            this.responseLength.value = this.settings.responseLength;
        }
        if (this.madhabSetting && this.settings.madhab) {
            this.madhabSetting.value = this.settings.madhab;
        }
        if (this.languageStyle && this.settings.languageStyle) {
            this.languageStyle.value = this.settings.languageStyle;
        }
    }

    getFontSizeValue(size) {
        const sizes = { small: '14px', medium: '16px', large: '18px' };
        return sizes[size] || '16px';
    }

    changeTheme() {
        if (this.themeSetting) {
            this.settings.theme = this.themeSetting.value;
            this.saveSettings();
        }
    }

    changeFontSize() {
        if (this.fontSize) {
            this.settings.fontSize = this.fontSize.value;
            this.saveSettings();
        }
    }

    autoResizeTextarea() {
        this.messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    async testBackendConnection() {
        try {
            const response = await fetch(`${this.backendUrl}/`);
            if (response.ok) {
                console.log('✅ Backend connection successful');
            }
        } catch (error) {
            console.log('❌ Cannot connect to backend');
        }
    }

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('active');
        }
        if (this.mobileOverlay) {
            this.mobileOverlay.classList.toggle('active');
        }
    }

    openSettings() {
        if (this.settingsPanel) {
            this.settingsPanel.classList.add('active');
        }
    }

    closeSettingsPanel() {
        if (this.settingsPanel) {
            this.settingsPanel.classList.remove('active');
        }
    }

    startNewChat() {
        this.currentChatId = this.generateChatId();
        this.clearChatMessages();
        this.renderChatHistory();
        this.toggleSidebar();
    }

    clearChatMessages() {
        if (!this.chatMessages) return;

        this.chatMessages.innerHTML = `
            <div class="welcome-container">
                <div class="welcome-icon">
                    <i class="fas fa-mosque"></i>
                </div>
                <h1>Assalamu Alaikum!</h1>
                <p>I'm Rafiq ul-Islam, your companion in Islamic learning. How can I assist you today?</p>
                
                <div class="quick-questions">
                    <div class="question-chip" data-question="What are the five pillars of Islam?">
                        <i class="fas fa-star"></i>
                        <span>Five Pillars of Islam</span>
                    </div>
                    <div class="question-chip" data-question="Explain the importance of Salah">
                        <i class="fas fa-pray"></i>
                        <span>Importance of Salah</span>
                    </div>
                    <div class="question-chip" data-question="Tell me about Prophet Muhammad's (PBUH) life">
                        <i class="fas fa-book"></i>
                        <span>Prophet's Life</span>
                    </div>
                    <div class="question-chip" data-question="What does the Quran say about patience?">
                        <i class="fas fa-heart"></i>
                        <span>Patience in Quran</span>
                    </div>
                </div>
            </div>
        `;

        // Re-attach event listeners to new question chips
        document.querySelectorAll('.question-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const question = chip.getAttribute('data-question');
                if (this.messageInput) {
                    this.messageInput.value = question;
                }
                this.sendMessage();
            });
        });
    }

    renderChatHistory() {
        if (!this.chatHistoryElement) return;

        const todayChats = this.chatHistory.filter(chat => {
            try {
                const chatDate = new Date(chat.timestamp);
                const today = new Date();
                return chatDate.toDateString() === today.toDateString();
            } catch (error) {
                return false;
            }
        });

        const previousChats = this.chatHistory.filter(chat => {
            try {
                const chatDate = new Date(chat.timestamp);
                const today = new Date();
                const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));
                return chatDate > sevenDaysAgo && chatDate.toDateString() !== new Date().toDateString();
            } catch (error) {
                return false;
            }
        });

        let html = '';

        if (todayChats.length > 0) {
            html += `<div class="history-section"><h3>Today</h3>`;
            todayChats.forEach(chat => {
                html += this.createChatItemHTML(chat);
            });
            html += `</div>`;
        }

        if (previousChats.length > 0) {
            html += `<div class="history-section"><h3>Previous 7 Days</h3>`;
            previousChats.forEach(chat => {
                html += this.createChatItemHTML(chat);
            });
            html += `</div>`;
        }

        // Add current chat if no history
        if (html === '') {
            html = `
                <div class="history-section">
                    <h3>Today</h3>
                    <div class="chat-item active" data-chat-id="${this.currentChatId}">
                        <i class="fas fa-message"></i>
                        <span>New Conversation</span>
                    </div>
                </div>
            `;
        }

        this.chatHistoryElement.innerHTML = html;

        // Add event listeners to chat items
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.getAttribute('data-chat-id');
                this.loadChat(chatId);
            });
        });
    }

    createChatItemHTML(chat) {
        const title = chat.messages && chat.messages[0] && chat.messages[0].content 
            ? (chat.messages[0].content.substring(0, 30) + (chat.messages[0].content.length > 30 ? '...' : ''))
            : 'New Chat';
            
        const isActive = chat.id === this.currentChatId;
        
        return `
            <div class="chat-item ${isActive ? 'active' : ''}" data-chat-id="${chat.id}">
                <i class="fas fa-message"></i>
                <span>${title}</span>
            </div>
        `;
    }

    loadChat(chatId) {
        const chat = this.chatHistory.find(c => c.id === chatId);
        if (chat) {
            this.currentChatId = chatId;
            this.displayChatMessages(chat.messages || []);
            this.renderChatHistory();
            this.toggleSidebar();
        }
    }

    loadCurrentChat() {
        const currentChat = this.chatHistory.find(chat => chat.id === this.currentChatId);
        if (currentChat && currentChat.messages) {
            this.displayChatMessages(currentChat.messages);
        }
    }

    displayChatMessages(messages) {
        this.clearChatMessages();
        
        messages.forEach(message => {
            if (message.content && message.role) {
                this.addMessage(message.content, message.role === 'user' ? 'user' : 'bot', false);
            }
        });
        
        this.scrollToBottom();
    }

    async sendMessage() {
        const message = this.messageInput?.value.trim();
        if (!message || !this.chatMessages) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        if (this.messageInput) {
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
        }
        
        // Show typing indicator IMMEDIATELY
        this.showTypingIndicator();
        if (this.sendButton) {
            this.sendButton.disabled = true;
        }

        try {
            const response = await fetch(`${this.backendUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Remove typing indicator and add the actual response
            this.hideTypingIndicator();
            this.addMessage(data.reply, 'bot');
            
            // Save to chat history
            this.saveMessageToHistory(message, data.reply);
            
        } catch (error) {
    console.error('Error:', error);
    this.hideTypingIndicator();
    
    // Better error messages
    let errorMessage = "Assalamu alaikum! There seems to be a temporary connection issue. ";
    errorMessage += "Please check your internet connection and try again. ";
    errorMessage += "May Allah make it easy for us.";
    
    this.addMessage(errorMessage, 'bot');
} finally {
            if (this.sendButton) {
                this.sendButton.disabled = false;
            }
            if (this.messageInput) {
                this.messageInput.focus();
            }
        }
    }

    saveMessageToHistory(userMessage, botReply) {
        let currentChat = this.chatHistory.find(chat => chat.id === this.currentChatId);
        
        if (!currentChat) {
            currentChat = {
                id: this.currentChatId,
                timestamp: new Date().toISOString(),
                messages: []
            };
            this.chatHistory.unshift(currentChat);
        }

        if (currentChat.messages) {
            currentChat.messages.push(
                { role: 'user', content: userMessage },
                { role: 'assistant', content: botReply }
            );
        } else {
            currentChat.messages = [
                { role: 'user', content: userMessage },
                { role: 'assistant', content: botReply }
            ];
        }

        // Keep only last 20 chats
        if (this.chatHistory.length > 20) {
            this.chatHistory = this.chatHistory.slice(0, 20);
        }

        this.saveChatHistory();
        this.renderChatHistory();
    }

    addMessage(text, sender, animate = true) {
        if (!this.chatMessages) return;

        // Remove welcome message if it exists
        const welcomeContainer = this.chatMessages.querySelector('.welcome-container');
        if (welcomeContainer && sender === 'user') {
            welcomeContainer.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        if (animate) {
            messageDiv.style.animation = 'fadeInUp 0.3s ease';
        }
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        // Preserve formatting and spaces
        bubbleDiv.innerHTML = this.formatMessage(text);
        
        messageDiv.appendChild(bubbleDiv);
        this.chatMessages.appendChild(messageDiv);
        
        this.scrollToBottom();
    }

    formatMessage(text) {
        if (!text) return '';
        
        // Convert line breaks to <br> tags and preserve spaces
        return text
            .replace(/\n/g, '<br>')
            .replace(/  /g, ' &nbsp;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>');
    }

    showTypingIndicator() {
        if (!this.chatMessages) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-bubble typing-indicator">
                <span>Rafiq ul-Islam is thinking</span>
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', () => {
    new RafiqChat();
});

// Simple PWA Installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('App can be installed');
});

window.addEventListener('appinstalled', () => {
    console.log('App was installed');
    deferredPrompt = null;
});