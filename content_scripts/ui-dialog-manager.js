// ===========================
// UI DIALOG MANAGER - EXTRACTED MODULE
// ===========================
// Handles dialog creation, styling, navigation, and user interactions
// This section manages the main assistant dialog and all its views
// 
// Key responsibilities:
// - Creating and styling the main dialog window
// - Managing dialog state (open/close)
// - Handling drag functionality
// - Welcome page and navigation setup
// - Cross-section UI coordination

// Create UIDialogManager class that will be mixed into LovableDetector
window.UIDialogManager = {
  // UI Dialog Management Methods
  toggleAssistant() {
    const now = Date.now();
    
    // Debounce rapid toggles (prevent toggles within 300ms)
    if (now - this.lastToggleTime < 300) {
      return;
    }
    
    this.lastToggleTime = now;
    
    // Prevent actions if currently in the middle of closing
    if (this.isClosing) {
      return;
    }
    
    if (this.assistantDialog && document.body.contains(this.assistantDialog)) {
      this.closeAssistant();
    } else {
      this.showAssistant();
    }
  },

  closeAssistant() {
    if (this.assistantDialog && !this.isClosing) {
      this.isClosing = true;
      
      try {
        // Remove any existing event listeners to prevent conflicts
        this.removeDialogEventListeners();
        
        // Remove the dialog from DOM
        this.assistantDialog.remove();
        this.assistantDialog = null;
      } catch (error) {
        console.error('Error during close:', error);
      } finally {
        // Reset closing flag after a short delay
        setTimeout(() => {
          this.isClosing = false;
        }, 100);
      }
    }
  },

  removeDialogEventListeners() {
    // Remove any close button listeners that might be attached
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
      // Clone the button to remove all event listeners
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    }
  },

  showReadyNotification() {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: system-ui, sans-serif;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        🤖 AI Chat Ready
        <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
          Press Cmd+K to start chatting
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    notification.addEventListener('click', () => {
      this.showAssistant();
      notification.remove();
    });
  },

  showAssistant() {
    if (this.assistantDialog) {
      this.assistantDialog.remove();
    }
    
    this.assistantDialog = this.createAssistantDialog();
    document.body.appendChild(this.assistantDialog);
    
    // Set up the close button handler immediately after creating the dialog
    this.setupCloseButton();
    
    setTimeout(() => {
      this.makeDraggable();
      this.showWelcomePage(); // Start with welcome page instead of chat
      
      // Ensure close button is working with a retry mechanism
      this.ensureCloseButtonWorks();
    }, 50);
  },

  setupCloseButton() {
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
      // Remove any existing listeners first
      closeBtn.onclick = null;
      closeBtn.removeEventListener('click', this.handleCloseClick);
      
      // Create bound handler for proper context
      this.handleCloseClick = (e) => {
        console.log('Close button clicked'); // Debug log
        const now = Date.now();
        if (this.lastCloseClickTime && now - this.lastCloseClickTime < 300) {
          return;
        }
        this.lastCloseClickTime = now;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Close immediately without delay
        this.closeAssistant();
      };
      
      // Add multiple event listeners for reliability
      closeBtn.addEventListener('click', this.handleCloseClick, true);
      closeBtn.addEventListener('mousedown', this.handleCloseClick, true);
      
      // Add visual feedback
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255,255,255,0.4)';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(255,255,255,0.2)';
      });
      
      console.log('Close button event handlers attached'); // Debug log
    } else {
      console.warn('Close button not found!'); // Debug log
    }
  },

  ensureCloseButtonWorks() {
    // Retry mechanism to ensure close button is always clickable
    let retryCount = 0;
    const maxRetries = 3;
    
    const checkAndSetup = () => {
      const closeBtn = document.getElementById('close-btn');
      if (closeBtn && retryCount < maxRetries) {
        // Test if the button is actually clickable
        const rect = closeBtn.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        
        if (isVisible) {
          // Force setup the close button again
          this.setupCloseButton();
          console.log('Close button setup verified');
        } else {
          retryCount++;
          setTimeout(checkAndSetup, 100);
        }
      }
    };
    
    setTimeout(checkAndSetup, 100);
  },

  // Loading state management for dialog content
  showDialogLoading(title = 'Loading...') {
    const content = document.getElementById('dialog-content');
    const dialogTitle = document.getElementById('dialog-title');
    
    if (dialogTitle) {
      dialogTitle.textContent = `🤖 ${title}`;
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #4a5568;
        font-size: 14px;
        gap: 16px;
      ">
        <div style="
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <div>Loading...</div>
      </div>
    `;
    
    // Add spinner animation if not exists
    if (!document.getElementById('spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  },

  extractProjectId(url = window.location.href) {
    if (!url) return null;
    const match = url.match(/\/projects\/([^\/\?]+)/);
    return match ? match[1] : null;
  },

  // extractProjectName() method moved to chat-interface.js

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  createAssistantDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'lovable-assistant-dialog';
    
    // Add CSS styles for scrollbar and markdown
    if (!document.getElementById('chat-styles')) {
      const style = document.createElement('style');
      style.id = 'chat-styles';
      style.textContent = `
        /* Global minimalist scrollbar styles for the extension */
        #lovable-assistant-dialog *::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        #lovable-assistant-dialog *::-webkit-scrollbar-track {
          background: transparent;
        }
        #lovable-assistant-dialog *::-webkit-scrollbar-thumb {
          background: rgba(203, 213, 224, 0.6);
          border-radius: 2px;
        }
        #lovable-assistant-dialog *::-webkit-scrollbar-thumb:hover {
          background: rgba(160, 174, 192, 0.8);
        }
        #lovable-assistant-dialog *::-webkit-scrollbar-corner {
          background: transparent;
        }
        
        /* Specific styles for dialog content areas */
        #dialog-content::-webkit-scrollbar,
        #chat-messages::-webkit-scrollbar { 
          width: 4px; 
          height: 4px;
        }
        #dialog-content::-webkit-scrollbar-track,
        #chat-messages::-webkit-scrollbar-track { 
          background: transparent; 
        }
        #dialog-content::-webkit-scrollbar-thumb,
        #chat-messages::-webkit-scrollbar-thumb { 
          background: rgba(203, 213, 224, 0.6); 
          border-radius: 2px; 
        }
        #dialog-content::-webkit-scrollbar-thumb:hover,
        #chat-messages::-webkit-scrollbar-thumb:hover { 
          background: rgba(160, 174, 192, 0.8); 
        }
        
        /* Enhanced list styling for HTML content */
        #lovable-assistant-dialog ul {
          list-style-type: disc !important;
          padding-left: 20px !important;
          margin: 8px 0 !important;
        }
        
        #lovable-assistant-dialog ol {
          list-style-type: decimal !important;
          padding-left: 20px !important;
          margin: 8px 0 !important;
        }
        
        #lovable-assistant-dialog li {
          display: list-item !important;
          margin-bottom: 4px !important;
        }
        
        #lovable-assistant-dialog ul ul,
        #lovable-assistant-dialog ol ol,
        #lovable-assistant-dialog ul ol,
        #lovable-assistant-dialog ol ul {
          margin: 4px 0 !important;
        }
        
        /* Ensure nested lists have different styles */
        #lovable-assistant-dialog ul ul {
          list-style-type: circle !important;
        }
        
        #lovable-assistant-dialog ul ul ul {
          list-style-type: square !important;
        }
        
        @keyframes pulse { 0%, 60%, 100% { opacity: 0.4; transform: scale(1); } 30% { opacity: 1; transform: scale(1.2); } }
      `;
      document.head.appendChild(style);
    }
    
    dialog.innerHTML = `
      <div id="assistant-window" style="
        position: fixed; top: 100px; left: 100px; width: 450px; height: 600px;
        background: white; border: 1px solid #c9cfd7; border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15); z-index: 10001;
        font-family: system-ui, sans-serif; display: flex; flex-direction: column;
      ">
        <div id="drag-handle" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 10px; border-radius: 12px 12px 0 0;
          display: flex; justify-content: space-between; align-items: center;
          cursor: move; user-select: none;
        ">
          <h3 id="dialog-title" style="margin: 0; font-size: 16px;">🤖 Lovable Assistant</h3>
          <button id="close-btn" style="
            background: rgba(255,255,255,0.2); border: none; color: white;
            padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 16px;
            position: relative; z-index: 10002; min-width: 24px; min-height: 24px;
            display: flex; align-items: center; justify-content: center;
            transition: background-color 0.2s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
             onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
        </div>
        
        <div id="dialog-content" style="
          flex: 1; overflow-y: auto; background: #f8fafc;
          display: flex; flex-direction: column;
        ">
          <!-- Content will be dynamically loaded here -->
        </div>
      </div>
    `;
    
    return dialog;
  },

  showWelcomePage() {
    // Safely get project name with fallback
    let projectName = 'Current Project';
    if (typeof this.extractProjectName === 'function') {
      projectName = this.extractProjectName();
    } else {
      // Fallback: extract project ID from URL
      const url = window.location.href;
      const match = url.match(/\/projects\/([^\/\?]+)/);
      projectName = match ? match[1] : 'Current Project';
    }
    
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '🤖 Lovable Assistant';
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <div style="margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px 0; color: #1a202c; font-size: 24px; font-weight: 600;">
            Welcome! 👋
          </h2>
          <p style="margin: 0; color: #4a5568; font-size: 16px;">
            AI assistant for project <strong style="color: #667eea;" data-project-name>${projectName}</strong>
          </p>
        </div>
        
        <div style="display: grid; gap: 12px; margin-bottom: 24px;">
          <!-- PROJECT SETTING -->
          <div class="feature-card" data-feature="knowledge" style="
            background: white; border: 2px solid #c9cfd7; border-radius: 12px;
            padding: 20px; cursor: pointer; transition: all 0.2s ease;
            text-align: left; position: relative; overflow: hidden;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
                color: white; width: 40px; height: 40px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; font-weight: bold;
              ">🧠</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 4px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
                  Project Manager
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Manage your own projects, settings, and knowledge base
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
          </div>
          
          <!-- PROJECT AI ASSISTANT -->
          <div class="feature-card" data-feature="chat" style="
            background: white; border: 2px solid #c9cfd7; border-radius: 12px;
            padding: 20px; cursor: pointer; transition: all 0.2s ease;
            text-align: left; position: relative; overflow: hidden;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; width: 40px; height: 40px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; font-weight: bold;
              ">💬</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 4px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
                  Project Assistant
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  AI-powered chat for development assistance and coding help
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
          </div>
          
          <!-- Lovable Chat History -->
          <div class="feature-card" data-feature="history" style="
            background: white; border: 2px solid #c9cfd7; border-radius: 12px;
            padding: 20px; cursor: pointer; transition: all 0.2s ease;
            text-align: left; position: relative; overflow: hidden;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white; width: 40px; height: 40px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; font-weight: bold;
              ">📚</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 4px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
                  Lovable Chat History
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Browse and search your past conversations and development activities
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
          </div>
          
          <!-- Utilities -->
          <div class="feature-card" data-feature="utilities" style="
            background: white; border: 2px solid #c9cfd7; border-radius: 12px;
            padding: 20px; cursor: pointer; transition: all 0.2s ease;
            text-align: left; position: relative; overflow: hidden;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white; width: 40px; height: 40px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; font-weight: bold;
              ">🛠️</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 4px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
                  Utilities
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Advanced tools for message scraping, notifications, and prompt enhancement
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
          </div>
          
          <!-- Settings -->
          <div class="feature-card" data-feature="settings" style="
            background: white; border: 2px solid #c9cfd7; border-radius: 12px;
            padding: 20px; cursor: pointer; transition: all 0.2s ease;
            text-align: left; position: relative; overflow: hidden;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                background: linear-gradient(135deg, #805ad5 0%, #6b46c1 100%);
                color: white; width: 40px; height: 40px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; font-weight: bold;
              ">⚙️</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 4px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
                  Settings
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Configure API settings, usage limits, fonts, and styles
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
          </div>
        </div>
        
        <div style="
          background: #f7fafc; border: 1px solid #c9cfd7; border-radius: 8px;
          padding: 12px; font-size: 13px; color: #4a5568; text-align: center;
        ">
          💡 <strong>Tip:</strong> Press <kbd style="
            background: white; border: 1px solid #cbd5e0; border-radius: 3px;
            padding: 2px 4px; font-size: 11px; font-family: monospace;
          ">Cmd+K</kbd> anywhere on this page to toggle this assistant
        </div>
      </div>
    `;
    
    this.setupWelcomePageEvents();
  },

  setupChatFunctionality() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (!chatInput || !sendBtn) return;

    // Load conversation history when chat opens
    this.loadConversationHistory();

    // Note: Close button is handled centrally in setupCloseButton()

    const sendMessage = async () => {
      const message = chatInput.value.trim();
      if (!message) return;

      this.addMessage(message, 'user');
      chatInput.value = '';
      this.showTypingIndicator();

      try {
        // Get conversation history for context
        const conversationHistory = await this.getRecentConversations();
        
        const response = await chrome.runtime.sendMessage({
          action: 'chatMessage',
          message: message,
          context: { 
            projectId: this.projectId, 
            url: window.location.href,
            projectName: this.extractProjectName(),
            conversationHistory: conversationHistory
          }
        });

        this.hideTypingIndicator();

        if (response.success) {
          this.addMessage(response.data, 'assistant');
          
          // Save the conversation to database
          this.saveConversation(message, response.data);
        } else {
          this.addMessage('Sorry, I encountered an error: ' + response.error, 'error');
        }
      } catch (error) {
        this.hideTypingIndicator();
        this.addMessage('Connection error. Please check your API configuration.', 'error');
      }
    };

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.toggleAssistant(); // Close dialog on Escape
      }
    });
    chatInput.focus();
  },

  async loadConversationHistory() {
    try {
      const response = await this.safeSendMessage({
        action: 'getAssistantConversations',
        projectId: this.projectId,
        limit: 10
      });
      
      if (response.success && response.data && response.data.length > 0) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        // Clear the initial greeting
        messagesContainer.innerHTML = '';
        
        // Add conversation history
        response.data.reverse().forEach(conv => {
          this.addMessage(conv.user_message, 'user', false);
          this.addMessage(conv.assistant_response, 'assistant', false);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  },

  async getRecentConversations() {
    try {
      const response = await this.safeSendMessage({
        action: 'getAssistantConversations',
        projectId: this.projectId,
        limit: 5
      });
      
      if (response.success && response.data) {
        return response.data.map(conv => ({
          user: conv.user_message,
          assistant: conv.assistant_response
        }));
      }
    } catch (error) {
      console.error('Failed to get recent conversations:', error);
    }
    return [];
  },

  async saveConversation(userMessage, assistantResponse) {
    try {
      const response = await this.safeSendMessage({
        action: 'saveAssistantConversation',
        data: {
          project_id: this.projectId,
          user_message: userMessage,
          assistant_response: assistantResponse,
          metadata: {
            project_name: this.extractProjectName(),
            url: window.location.href,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      if (!response.success) {
        console.error('Failed to save conversation:', response.error);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  },

  addMessage(content, type, addTimestamp = true) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.display = 'flex';
    messageDiv.style.marginBottom = '12px';
    messageDiv.style.justifyContent = type === 'user' ? 'flex-end' : 'flex-start';
    
    let bgColor = type === 'user' ? '#667eea' : type === 'error' ? '#fed7d7' : 'white';
    let textColor = type === 'user' ? 'white' : type === 'error' ? '#742a2a' : '#2d3748';
    let lineHeight = type === 'user' ? '1.5' : '1.4'; // User messages need more spacing due to blue background

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      background: ${bgColor}; color: ${textColor}; padding: 12px 16px; border-radius: 18px;
      max-width: 85%; border: ${type === 'assistant' ? '1px solid #c9cfd7' : 'none'};
      line-height: ${lineHeight}; word-wrap: break-word; font-size: 14px;
      white-space: pre-wrap; text-align: left; font-family: inherit;
    `;
    
    // Ensure markdown elements inherit proper styling
    if (type === 'user') {
      messageBubble.setAttribute('style', messageBubble.getAttribute('style') + `
        --user-message: true;
      `);
    }

    // For chat messages, detect if content is HTML and format accordingly
    const isHTMLContent = this.isHTMLContent(content);
    const formattedContent = this.formatMessage(content, isHTMLContent, type);
    
    messageBubble.innerHTML = formattedContent;
    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  // --- UI Helper Methods ---
  // Message formatting, styling, and UI manipulation functions

  formatMessage(content, isHTML = false) {
    // Check if content is HTML formatted (from newer captures)
    if (isHTML || this.isHTMLContent(content)) {
      // For HTML content, return as-is but sanitize dangerous elements
      return this.sanitizeHTML(content);
    } else {
      // For plain text content, use the advanced MarkdownFormatter
      return MarkdownFormatter.format(content);
    }
  },

  isHTMLContent(content) {
    // Detect if content contains HTML tags (simple heuristic)
    return /<\/?(p|br|h[1-6]|ol|ul|li|blockquote|pre|code|strong|em|span|div)[^>]*>/i.test(content);
  },

  sanitizeHTML(htmlContent) {
    // Create a temporary element to sanitize HTML
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    
    // Remove potentially dangerous elements and attributes
    const dangerousElements = temp.querySelectorAll('script, iframe, object, embed, form, input, button');
    dangerousElements.forEach(el => el.remove());
    
    // Remove dangerous attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
      const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'];
      dangerousAttrs.forEach(attr => el.removeAttribute(attr));
    });
    
    // Enhance list styling for proper display
    this.enhanceListStyling(temp);
    
    return temp.innerHTML;
  },

  enhanceListStyling(container) {
    // Add proper styling to unordered lists (bullet points)
    const ulLists = container.querySelectorAll('ul');
    ulLists.forEach(ul => {
      ul.style.listStyleType = 'disc';
      ul.style.paddingLeft = '20px';
      ul.style.marginLeft = '0';
      
      // Ensure list items display properly
      const listItems = ul.querySelectorAll('li');
      listItems.forEach(li => {
        li.style.display = 'list-item';
        li.style.marginBottom = '4px';
      });
    });
    
    // Add proper styling to ordered lists (numbers)
    const olLists = container.querySelectorAll('ol');
    olLists.forEach(ol => {
      ol.style.listStyleType = 'decimal';
      ol.style.paddingLeft = '20px';
      ol.style.marginLeft = '0';
      
      // Ensure list items display properly with numbers
      const listItems = ol.querySelectorAll('li');
      listItems.forEach(li => {
        li.style.display = 'list-item';
        li.style.marginBottom = '4px';
      });
    });
    
    // Handle nested lists
    const nestedLists = container.querySelectorAll('ul ul, ol ol, ul ol, ol ul');
    nestedLists.forEach(nestedList => {
      nestedList.style.marginTop = '4px';
      nestedList.style.marginBottom = '4px';
    });
  },

  escapeRegex(string) {
    // Escape special regex characters to treat them as literal characters
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  setVerboseLogging(enabled) {
    this.verboseLogging = enabled;
    console.log(`🔧 LovableDetector verbose logging ${enabled ? 'enabled' : 'disabled'}`);
  },

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.style.cssText = 'display: flex; justify-content: flex-start; margin-bottom: 12px;';
    typingDiv.innerHTML = `
      <div style="background: white; border: 1px solid #c9cfd7; padding: 12px 16px; border-radius: 18px; max-width: 85%;">
        <div style="display: flex; gap: 4px; align-items: center;">
          <div style="width: 8px; height: 8px; background: #cbd5e0; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
          <div style="width: 8px; height: 8px; background: #cbd5e0; border-radius: 50%; animation: pulse 1.5s infinite 0.2s;"></div>
          <div style="width: 8px; height: 8px; background: #cbd5e0; border-radius: 50%; animation: pulse 1.5s infinite 0.4s;"></div>
          <span style="margin-left: 8px; color: #718096; font-size: 13px;">AI is thinking...</span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) typingIndicator.remove();
  },

  makeDraggable() {
    const dialogEl = document.getElementById('assistant-window');
    const dragHandle = document.getElementById('drag-handle');
    
    if (!dialogEl || !dragHandle) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    dragHandle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      if (e.target.id === 'close-btn') return;
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      let newTop = dialogEl.offsetTop - pos2;
      let newLeft = dialogEl.offsetLeft - pos1;
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - dialogEl.offsetHeight));
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - dialogEl.offsetWidth));
      dialogEl.style.top = newTop + "px";
      dialogEl.style.left = newLeft + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  },

  // Cleanup method
  destroy() {
    // Reset flags
    this.isClosing = false;
    this.lastToggleTime = 0;
    
    // Remove keyboard listeners
    if (this.handleKeydown) {
      document.removeEventListener('keydown', this.handleKeydown, true);
      window.removeEventListener('keydown', this.handleKeydown, true);
      this.handleKeydown = null;
    }
    
    // Close dialog and clean up
    if (this.assistantDialog) {
      this.removeDialogEventListeners();
      this.assistantDialog.remove();
      this.assistantDialog = null;
    }
    
    // The notification monitoring system has been removed
  },

  setupWelcomePageEvents() {
    // Add hover effects and click handlers for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
      const feature = card.getAttribute('data-feature');
      
      // Hover effects
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = '#667eea';
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = '#c9cfd7';
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      });
      
      // Click handlers
      card.addEventListener('click', async () => {
        await this.handleFeatureSelection(feature);
      });
    });
    
    // Note: Close button is handled centrally in setupCloseButton()
  },

  async handleFeatureSelection(feature) {
    switch (feature) {
      case 'chat':
        if (typeof this.showChatInterface === 'function') {
          this.showChatInterface();
        } else {
          console.error('showChatInterface method not available');
        }
        break;
      case 'history':
        if (typeof this.showConversationHistory === 'function') {
          await this.showConversationHistory();
        } else {
          console.error('showConversationHistory method not available');
        }
        break;
      case 'utilities':
        if (typeof this.showUtilitiesPage === 'function') {
          await this.showUtilitiesPage();
        } else {
          console.error('showUtilitiesPage method not available');
        }
        break;
      case 'knowledge':
        if (typeof this.showProjectManager === 'function') {
          await this.showProjectManager();
        } else {
          console.error('showProjectManager method not available');
        }
        break;
      case 'settings':
        if (typeof this.showSettingsPage === 'function') {
          this.showSettingsPage();
        } else {
          console.error('showSettingsPage method not available');
        }
        break;
      default:
        console.log('Unknown feature:', feature);
    }
  },

  showComingSoon(featureName) {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = `🚧 ${featureName}`;
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 16px;">🚧</div>
        <h2 style="margin: 0 0 8px 0; color: #1a202c; font-size: 24px; font-weight: 600;">
          ${featureName}
        </h2>
        <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.5;">
          This feature is coming soon! We're working hard to bring you the best experience.
        </p>
        <button id="back-to-welcome-btn" style="
          background: #667eea; color: white; border: none; padding: 12px 24px;
          border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 44px; min-width: 140px; transition: all 0.2s ease;
        " onmouseover="this.style.background='#5a67d8'" 
           onmouseout="this.style.background='#667eea'">← Back to Welcome</button>
      </div>
    `;
    
    this.setupBackButton();
  }
};