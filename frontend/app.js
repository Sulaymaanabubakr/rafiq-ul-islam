class RafiqChat {
    constructor() {
        this.backendUrl = 'https://rafiq-ul-islam-production.up.railway.app';
        this.currentChatId = this.generateChatId();
        this.chatHistory = this.loadChatHistory();
        this.settings = this.loadSettings();
        this.isFirstMessage = true;
        
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
        this.mobileNewChat = document.getElementById('mobileNewChat');
        this.chatHistoryElement = document.getElementById('chatHistory');
        
        // Header elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.messageCount = document.getElementById('messageCount');
        this.chatCount = document.getElementById('chatCount');
        
        // Settings elements
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettings = document.getElementById('closeSettings');
        this.themeSetting = document.getElementById('themeSetting');
        this.fontSize = document.getElementById('fontSize');
        this.responseStyle = document.getElementById('responseStyle');
        this.madhabSetting = document.getElementById('madhabSetting');
        this.clearHistory = document.getElementById('clearHistory');
        this.exportData = document.getElementById('exportData');
        
        // Search elements
        this.searchPanel = document.getElementById('searchPanel');
        this.mobileSearch = document.getElementById('mobileSearch');
        this.closeSearch = document.getElementById('closeSearch');
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');
        
        // Action buttons
        this.startEmpty = document.getElementById('startEmpty');
        this.themeToggle = document.getElementById('themeToggle');
        this.clearChat = document.getElementById('clearChat');
        this.exportChat = document.getElementById('exportChat');
        this.attachBtn = document.getElementById('attachBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        
        // About elements
        this.aboutPanel = document.getElementById('aboutPanel');
        this.closeAbout = document.getElementById('closeAbout');
        this.menuAbout = document.getElementById('menuAbout');
        
        // Quick actions and suggestions
        this.actionButtons = document.querySelectorAll('.action-btn');
        this.suggestionChips = document.querySelectorAll('.suggestion-chip');
    }

    init() {
        this.setupEventListeners();
        this.autoResizeTextarea();
        this.applySettings();
        this.renderChatHistory();
        this.updateStats();
        this.testBackendConnection();
        this.handleMobileKeyboard(); // Add this line
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

        // Focus on input to start chat
        this.messageInput.addEventListener('focus', () => {
            this.hideWelcomeScreen();
        });

        // Start empty chat
        this.startEmpty?.addEventListener('click', () => {
            this.hideWelcomeScreen();
            this.messageInput.focus();
        });

        // Navigation and UI
        this.menuToggle?.addEventListener('click', () => this.toggleSidebar());
        this.sidebarToggle?.addEventListener('click', () => this.toggleSidebar());
        this.mobileOverlay?.addEventListener('click', () => this.toggleSidebar());
        
        // New chat buttons
        this.newChatBtn?.addEventListener('click', () => this.startNewChat());
        this.mobileNewChat?.addEventListener('click', () => this.startNewChat());

        // Settings
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());
        this.clearChat?.addEventListener('click', () => this.clearCurrentChat());
        this.exportChat?.addEventListener('click', () => this.exportCurrentChat());

        // Settings panel
        this.closeSettings?.addEventListener('click', () => this.closeSettingsPanel());
        this.themeSetting?.addEventListener('change', () => this.changeTheme());
        this.fontSize?.addEventListener('change', () => this.changeFontSize());
        this.responseStyle?.addEventListener('change', () => this.saveSettings());
        this.madhabSetting?.addEventListener('change', () => this.saveSettings());
        this.clearHistory?.addEventListener('click', () => this.clearAllHistory());
        this.exportData?.addEventListener('click', () => this.exportAllData());

        // Search panel
        this.mobileSearch?.addEventListener('click', () => this.openSearchPanel());
        this.closeSearch?.addEventListener('click', () => this.closeSearchPanel());
        this.searchInput?.addEventListener('input', () => this.performSearch());

        // About panel
        this.menuAbout?.addEventListener('click', () => this.openAboutPanel());
        this.closeAbout?.addEventListener('click', () => this.closeAboutPanel());

        // Quick actions
        this.actionButtons.forEach(btn => {
            if (btn.id !== 'startEmpty') {
                btn.addEventListener('click', (e) => {
                    const question = e.currentTarget.getAttribute('data-question');
                    if (question) {
                        this.messageInput.value = question;
                        this.sendMessage();
                    }
                });
            }
        });

        // Suggestion chips
        this.suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const question = chip.getAttribute('data-question');
                this.messageInput.value = question;
                this.sendMessage();
            });
        });

        // Close panels when clicking overlay
        this.mobileOverlay?.addEventListener('click', () => {
            this.closeAllPanels();
        });

        // PWA Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('Service Worker Registered'))
                .catch(err => console.log('Service Worker Registration Failed'));
        }
    }

    handleMobileKeyboard() {
        if (window.innerWidth <= 768) {
            // Focus management for mobile
            this.messageInput?.addEventListener('focus', () => {
                setTimeout(() => {
                    this.scrollToBottom();
                }, 300);
            });
            
            // Handle viewport changes (keyboard showing/hiding)
            let viewportHeight = window.innerHeight;
            window.addEventListener('resize', () => {
                if (window.innerHeight < viewportHeight) {
                    // Keyboard is showing
                    setTimeout(() => {
                        this.scrollToBottom();
                    }, 100);
                }
                viewportHeight = window.innerHeight;
            });
        }
    }

    hideWelcomeScreen() {
        if (this.isFirstMessage) {
            const welcomeContainer = this.chatMessages.querySelector('.welcome-container');
            if (welcomeContainer) {
                welcomeContainer.style.opacity = '0';
                welcomeContainer.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    welcomeContainer.remove();
                    this.isFirstMessage = false;
                }, 300);
            }
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
            this.updateStats();
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    loadSettings() {
        try {
            const settings = localStorage.getItem('rafiq_settings');
            const defaultSettings = {
                theme: 'auto',
                fontSize: 'medium',
                responseStyle: 'balanced',
                madhab: 'none'
            };
            
            return settings ? { ...defaultSettings, ...JSON.parse(settings) } : defaultSettings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return {
                theme: 'auto',
                fontSize: 'medium',
                responseStyle: 'balanced',
                madhab: 'none'
            };
        }
    }

    saveSettings() {
        try {
            this.settings = {
                theme: this.themeSetting?.value || 'auto',
                fontSize: this.fontSize?.value || 'medium',
                responseStyle: this.responseStyle?.value || 'balanced',
                madhab: this.madhabSetting?.value || 'none'
            };
            
            localStorage.setItem('rafiq_settings', JSON.stringify(this.settings));
            this.applySettings();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    applySettings() {
        // Apply theme
        if (this.settings.theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', this.settings.theme);
        }
        
        if (this.themeSetting) this.themeSetting.value = this.settings.theme;

        // Apply font size
        if (this.settings.fontSize) {
            document.body.style.fontSize = this.getFontSizeValue(this.settings.fontSize);
            if (this.fontSize) this.fontSize.value = this.settings.fontSize;
        }

        // Apply other settings
        if (this.responseStyle && this.settings.responseStyle) {
            this.responseStyle.value = this.settings.responseStyle;
        }
        if (this.madhabSetting && this.settings.madhab) {
            this.madhabSetting.value = this.settings.madhab;
        }
    }

    getFontSizeValue(size) {
        const sizes = { small: '14px', medium: '16px', large: '18px' };
        return sizes[size] || '16px';
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        this.settings.theme = newTheme;
        this.saveSettings();
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
        this.messageInput?.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    async testBackendConnection() {
        try {
            const response = await fetch(`${this.backendUrl}/`);
            if (response.ok) {
                console.log('✅ Backend connection successful');
                this.statusIndicator.textContent = '● Online';
                this.statusIndicator.style.color = 'var(--success-color)';
            }
        } catch (error) {
            console.log('❌ Cannot connect to backend');
            this.statusIndicator.textContent = '● Offline';
            this.statusIndicator.style.color = 'var(--danger-color)';
        }
    }

    updateStats() {
        let totalMessages = 0;
        this.chatHistory.forEach(chat => {
            totalMessages += chat.messages ? chat.messages.length : 0;
        });

        if (this.messageCount) {
            this.messageCount.textContent = totalMessages;
        }
        if (this.chatCount) {
            this.chatCount.textContent = this.chatHistory.length;
        }
    }

    // Panel Management
    toggleSidebar() {
        this.sidebar?.classList.toggle('active');
        this.mobileOverlay?.classList.toggle('active');
    }

    openSettingsPanel() {
        this.closeAllPanels();
        this.settingsPanel?.classList.add('active');
        this.mobileOverlay?.classList.add('active');
    }

    closeSettingsPanel() {
        this.settingsPanel?.classList.remove('active');
        this.mobileOverlay?.classList.remove('active');
    }

    openSearchPanel() {
        this.closeAllPanels();
        this.searchPanel?.classList.add('active');
        this.mobileOverlay?.classList.add('active');
        this.searchInput?.focus();
    }

    closeSearchPanel() {
        this.searchPanel?.classList.remove('active');
        this.mobileOverlay?.classList.remove('active');
    }

    openAboutPanel() {
        this.closeAllPanels();
        this.aboutPanel?.classList.add('active');
        this.mobileOverlay?.classList.add('active');
    }

    closeAboutPanel() {
        this.aboutPanel?.classList.remove('active');
        this.mobileOverlay?.classList.remove('active');
    }

    closeAllPanels() {
        this.sidebar?.classList.remove('active');
        this.settingsPanel?.classList.remove('active');
        this.searchPanel?.classList.remove('active');
        this.aboutPanel?.classList.remove('active');
        this.mobileOverlay?.classList.remove('active');
    }

    // Chat Management
    startNewChat() {
        this.currentChatId = this.generateChatId();
        this.clearChatMessages();
        this.renderChatHistory();
        this.closeAllPanels();
        this.messageInput?.focus();
    }

    clearCurrentChat() {
        this.clearChatMessages();
    }

    clearAllHistory() {
        if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            this.chatHistory = [];
            this.saveChatHistory();
            this.startNewChat();
            this.closeSettingsPanel();
        }
    }

    clearChatMessages() {
        if (!this.chatMessages) return;

        this.chatMessages.innerHTML = `
            <div class="welcome-container">
                <div class="welcome-content">
                    <div class="welcome-icon">
                        <i class="fas fa-hands-praying"></i>
                    </div>
                    <h1>Assalamu Alaikum!</h1>
                    <p class="welcome-subtitle">I'm Rafiq ul-Islam, your AI companion for Islamic knowledge. I'm here to help you learn and understand Islam better.</p>
                    
                    <div class="capabilities-grid">
                        <div class="capability-card">
                            <i class="fas fa-quran"></i>
                            <h4>Quran & Tafsir</h4>
                            <p>Understand Quranic verses and their meanings</p>
                        </div>
                        <div class="capability-card">
                            <i class="fas fa-book"></i>
                            <h4>Hadith Studies</h4>
                            <p>Learn from authentic Prophetic traditions</p>
                        </div>
                        <div class="capability-card">
                            <i class="fas fa-pray"></i>
                            <h4>Daily Worship</h4>
                            <p>Guidance on Salah, Duas, and spirituality</p>
                        </div>
                        <div class="capability-card">
                            <i class="fas fa-heart"></i>
                            <h4>Islamic Ethics</h4>
                            <p>Develop character and moral excellence</p>
                        </div>
                    </div>

                    <div class="quick-actions">
                        <h3>Quick Start</h3>
                        <div class="action-buttons">
                            <button class="action-btn primary" data-question="Assalamu alaikum">
                                <i class="fas fa-handshake"></i>
                                <span>Start with Salam</span>
                            </button>
                            <button class="action-btn secondary" id="startEmpty">
                                <i class="fas fa-keyboard"></i>
                                <span>Type My Question</span>
                            </button>
                        </div>
                    </div>

                    <div class="suggestions-section">
                        <h3>Popular Questions</h3>
                        <div class="suggestions-grid">
                            <div class="suggestion-chip" data-question="What are the five pillars of Islam?">
                                <i class="fas fa-star-and-crescent"></i>
                                <span>Five Pillars of Islam</span>
                            </div>
                            <div class="suggestion-chip" data-question="Explain the importance of Salah in detail">
                                <i class="fas fa-pray"></i>
                                <span>Importance of Prayer</span>
                            </div>
                            <div class="suggestion-chip" data-question="Tell me about Prophet Muhammad's life and character">
                                <i class="fas fa-book-quran"></i>
                                <span>Prophet's Seerah</span>
                            </div>
                            <div class="suggestion-chip" data-question="What does the Quran say about patience and perseverance?">
                                <i class="fas fa-heart"></i>
                                <span>Patience in Quran</span>
                            </div>
                        </div>
                    </div>

                    <div class="welcome-footer">
                        <div class="welcome-note">
                            <i class="fas fa-lightbulb"></i>
                            <span>You can also simply type your question in the chat below to get started</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Re-attach event listeners
        this.reattachWelcomeListeners();
        this.isFirstMessage = true;
    }

    reattachWelcomeListeners() {
        // Re-attach action buttons
        document.querySelectorAll('.action-btn:not(#startEmpty)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const question = e.currentTarget.getAttribute('data-question');
                if (question) {
                    this.messageInput.value = question;
                    this.sendMessage();
                }
            });
        });

        // Re-attach suggestion chips
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const question = chip.getAttribute('data-question');
                this.messageInput.value = question;
                this.sendMessage();
            });
        });

        // Re-attach start empty button
        const startEmptyBtn = document.getElementById('startEmpty');
        if (startEmptyBtn) {
            startEmptyBtn.addEventListener('click', () => {
                this.hideWelcomeScreen();
                this.messageInput.focus();
            });
        }
    }

    renderChatHistory() {
        if (!this.chatHistoryElement) return;

        let html = '';

        // Today's chats
        const todayChats = this.chatHistory.filter(chat => {
            try {
                const chatDate = new Date(chat.timestamp);
                const today = new Date();
                return chatDate.toDateString() === today.toDateString();
            } catch (error) {
                return false;
            }
        });

        if (todayChats.length > 0) {
            html += `<div class="history-section"><h3>Today</h3>`;
            todayChats.forEach(chat => {
                html += this.createChatItemHTML(chat);
            });
            html += `</div>`;
        }

        // Previous 7 days
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

        if (previousChats.length > 0) {
            html += `<div class="history-section"><h3>Previous 7 Days</h3>`;
            previousChats.forEach(chat => {
                html += this.createChatItemHTML(chat);
            });
            html += `</div>`;
        }

        // Favorites (you can implement favorite functionality later)
        html += `
            <div class="history-section">
                <h3>Favorites</h3>
                <div class="chat-item">
                    <i class="fas fa-star"></i>
                    <span>Five Pillars</span>
                </div>
                <div class="chat-item">
                    <i class="fas fa-star"></i>
                    <span>Prophet's Seerah</span>
                </div>
            </div>
        `;

        this.chatHistoryElement.innerHTML = html;

        // Add event listeners to chat items
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.getAttribute('data-chat-id');
                if (chatId) {
                    this.loadChat(chatId);
                }
            });
        });
    }

    createChatItemHTML(chat) {
        const title = chat.messages && chat.messages[0] && chat.messages[0].content 
            ? (chat.messages[0].content.substring(0, 25) + (chat.messages[0].content.length > 25 ? '...' : ''))
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
            this.closeAllPanels();
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
        this.isFirstMessage = false;
    }

    async sendMessage() {
        const message = this.messageInput?.value.trim();
        if (!message || !this.chatMessages) return;

        // Hide welcome screen on first message
        this.hideWelcomeScreen();

        // Add user message to chat
        this.addMessage(message, 'user');
        if (this.messageInput) {
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
        }
        
        // Scroll to bottom before showing typing indicator
        this.scrollToBottom();
        
        // Show typing indicator
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
            
            // Remove typing indicator and add response
            this.hideTypingIndicator();
            this.addMessage(data.reply, 'bot');
            
            // Save to chat history
            this.saveMessageToHistory(message, data.reply);
            
        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.addMessage('Assalamu alaikum! There seems to be a temporary connection issue. Please check your internet and try again.', 'bot');
        } finally {
            if (this.sendButton) {
                this.sendButton.disabled = false;
            }
            if (this.messageInput) {
                this.messageInput.focus();
            }
            // Ensure we're scrolled to bottom after everything
            setTimeout(() => this.scrollToBottom(), 100);
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

        currentChat.messages = currentChat.messages || [];
        currentChat.messages.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: botReply }
        );

        // Keep only last 50 chats
        if (this.chatHistory.length > 50) {
            this.chatHistory = this.chatHistory.slice(0, 50);
        }

        this.saveChatHistory();
        this.renderChatHistory();
    }

    addMessage(text, sender, animate = true) {
        if (!this.chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        if (animate) {
            messageDiv.style.animation = 'messageSlideIn 0.4s ease';
        }
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.innerHTML = this.formatMessage(text);
        
        messageDiv.appendChild(bubbleDiv);
        this.chatMessages.appendChild(messageDiv);
        
        this.scrollToBottom();
    }

    formatMessage(text) {
        if (!text) return '';
        
        // Clean formatting while preserving important structure
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
            .trim();
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
            requestAnimationFrame(() => {
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            });
        }
    }

    // Search functionality
    performSearch() {
        const query = this.searchInput?.value.toLowerCase().trim();
        if (!query) {
            this.searchResults.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Search your chat history</p>
                </div>
            `;
            return;
        }

        const results = [];
        this.chatHistory.forEach(chat => {
            chat.messages?.forEach(message => {
                if (message.content.toLowerCase().includes(query)) {
                    results.push({
                        chatId: chat.id,
                        content: message.content,
                        role: message.role,
                        timestamp: chat.timestamp
                    });
                }
            });
        });

        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No results found</p>
                </div>
            `;
            return;
        }

        let html = '';
        results.forEach(result => {
            html += `
                <div class="search-result-item" data-chat-id="${result.chatId}">
                    <div class="result-content">${this.highlightText(result.content, this.searchInput.value)}</div>
                    <div class="result-meta">
                        <span class="result-role">${result.role}</span>
                        <span class="result-time">${new Date(result.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
        });

        this.searchResults.innerHTML = html;

        // Add click listeners to search results
        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.getAttribute('data-chat-id');
                this.loadChat(chatId);
                this.closeSearchPanel();
            });
        });
    }

    highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Export functionality
    exportCurrentChat() {
        const currentChat = this.chatHistory.find(chat => chat.id === this.currentChatId);
        if (currentChat) {
            this.exportChatData([currentChat], `rafiq-chat-${this.currentChatId}.json`);
        }
    }

    exportAllData() {
        this.exportChatData(this.chatHistory, 'rafiq-all-chats.json');
        this.closeSettingsPanel();
    }

    exportChatData(chats, filename) {
        const dataStr = JSON.stringify(chats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', () => {
    new RafiqChat();
});

// PWA Installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
});

// Handle theme based on system preference
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const currentSettings = JSON.parse(localStorage.getItem('rafiq_settings') || '{}');
    if (currentSettings.theme === 'auto') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
});