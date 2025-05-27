// ===========================
// LOVABLE.DEV ASSISTANT - MAIN DETECTOR
// ===========================
// Organized into focused sections for better maintainability
// Each section has a clear responsibility and purpose

console.log('🚀 Lovable Assistant: Loading enhanced detector...');

// ===========================
// SECTION 1: CORE DETECTOR CLASS
// ===========================
// Handles page detection, keyboard shortcuts, and initialization

// Lovable.dev Page Detection and Enhanced Markdown Chat
class LovableDetector {
  constructor() {
    this.isLovablePage = false;
    this.projectId = null;
    this.assistantDialog = null;
    this.init();
  }

  init() {
    this.detectLovablePage();
    this.setupKeyboardShortcuts();
  }

  detectLovablePage() {
    const url = window.location.href;
    const isProjectPage = url.includes('lovable.dev/projects/');
    
    if (isProjectPage) {
      this.isLovablePage = true;
      this.projectId = this.extractProjectId(url);
      
      console.log('✅ Lovable.dev project detected:', this.projectId);
      
      setTimeout(() => {
        this.showReadyNotification();
      }, 100);
      
      chrome.runtime.sendMessage({
        action: 'lovablePageDetected',
        data: {
          projectId: this.projectId,
          url: url,
          timestamp: new Date().toISOString()
        }
      }).catch(error => {
        console.log('Could not send message to background:', error);
      });
    }
  }

  setupKeyboardShortcuts() {
    this.handleKeydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        console.log('🤖 Assistant shortcut triggered');
        e.preventDefault();
        e.stopPropagation();
        this.toggleAssistant();
        return false;
      }
    };
    
    document.addEventListener('keydown', this.handleKeydown, true);
    window.addEventListener('keydown', this.handleKeydown, true);
    
    console.log('🎹 Keyboard shortcuts registered');
  }






  // ===========================
  // SECTION 2: UI DIALOG MANAGEMENT
  // ===========================
  // Handles dialog creation, styling, navigation, and user interactions
  // This section manages the main assistant dialog and all its views

  toggleAssistant() {
    console.log('🎯 toggleAssistant called, current dialog:', !!this.assistantDialog);
    
    if (this.assistantDialog && document.body.contains(this.assistantDialog)) {
      console.log('🔒 Closing assistant dialog');
      this.assistantDialog.remove();
      this.assistantDialog = null;
    } else {
      console.log('🚀 Opening assistant dialog');
      this.showAssistant();
    }
  }

  showReadyNotification() {
    console.log('🎉 showReadyNotification called successfully!');
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
  }

  showAssistant() {
    if (this.assistantDialog) {
      this.assistantDialog.remove();
    }
    
    this.assistantDialog = this.createAssistantDialog();
    document.body.appendChild(this.assistantDialog);
    
    setTimeout(() => {
      this.makeDraggable();
      this.showWelcomePage(); // Start with welcome page instead of chat
    }, 50);
  }

  extractProjectId(url = window.location.href) {
    if (!url) return null;
    const match = url.match(/\/projects\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  extractProjectName() {
    // Try to get project name from the page
    const nameElement = document.querySelector('p.hidden.truncate.text-sm.font-medium.md\\:block');
    if (nameElement && nameElement.textContent.trim()) {
      return nameElement.textContent.trim();
    }
    
    // Fallback: try other common selectors
    const fallbackSelectors = [
      'h1[data-testid="project-name"]',
      '.project-name',
      'h1',
      'title'
    ];
    
    for (const selector of fallbackSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const text = element.textContent.trim();
        if (text !== 'Lovable' && text.length > 0) {
          return text;
        }
      }
    }
    
    return this.projectId || 'Unknown Project';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

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
            padding: 0px 6px; border-radius: 4px; cursor: pointer; font-size: 16px;
          ">×</button>
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
  }

  showWelcomePage() {
    const projectName = this.extractProjectName();
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
            AI Assistant for project <strong style="color: #667eea;">${projectName}</strong>
          </p>
        </div>
        
        <div style="display: grid; gap: 12px; margin-bottom: 24px;">
          <!-- Project Manager -->
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
                  Project Manager
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  AI-powered chat for development assistance and coding help
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
          </div>
          
          <!-- Prompt History -->
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
                  Conversation History
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Browse and search your past conversations and development activities
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
          </div>
          
          <!-- Project Knowledge -->
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
                  Project Knowledge
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Store important project information, instructions, and knowledge
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
            <div style="
              position: absolute; top: 8px; right: 8px;
              background: #fed7d7; color: #c53030; padding: 2px 6px;
              border-radius: 4px; font-size: 10px; font-weight: 600;
            ">COMING SOON</div>
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
  }

  setupChatFunctionality() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const closeBtn = document.getElementById('close-btn');
    
    if (!chatInput || !sendBtn) return;

    // Setup close button handler
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.toggleAssistant(); // Use toggleAssistant for proper cleanup
      });
    }

    const sendMessage = async () => {
      const message = chatInput.value.trim();
      if (!message) return;

      this.addMessage(message, 'user');
      chatInput.value = '';
      this.showTypingIndicator();

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'chatMessage',
          message: message,
          context: { projectId: this.projectId, url: window.location.href }
        });

        this.hideTypingIndicator();

        if (response.success) {
          this.addMessage(response.data, 'assistant');
        } else {
          this.addMessage('Sorry, I encountered an error: ' + response.error, 'error');
        }
      } catch (error) {
        this.hideTypingIndicator();
        this.addMessage('Connection error. Please check your Claude API key.', 'error');
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
  }

  addMessage(content, type) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.display = 'flex';
    messageDiv.style.marginBottom = '12px';
    messageDiv.style.justifyContent = type === 'user' ? 'flex-end' : 'flex-start';
    
    let bgColor = type === 'user' ? '#667eea' : type === 'error' ? '#fed7d7' : 'white';
    let textColor = type === 'user' ? 'white' : type === 'error' ? '#742a2a' : '#2d3748';

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      background: ${bgColor}; color: ${textColor}; padding: 12px 16px; border-radius: 18px;
      max-width: 85%; border: ${type === 'assistant' ? '1px solid #c9cfd7' : 'none'};
      line-height: 1.4; word-wrap: break-word; font-size: 14px;
    `;

    // For chat messages, detect if content is HTML and format accordingly
    const isHTMLContent = this.isHTMLContent(content);
    const formattedContent = this.formatMessage(content, isHTMLContent);
    
    messageBubble.innerHTML = formattedContent;
    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

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
  }

  isHTMLContent(content) {
    // Detect if content contains HTML tags (simple heuristic)
    return /<\/?(p|br|h[1-6]|ol|ul|li|blockquote|pre|code|strong|em|span|div)[^>]*>/i.test(content);
  }

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
    
    return temp.innerHTML;
  }

  escapeRegex(string) {
    // Escape special regex characters to treat them as literal characters
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

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
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) typingIndicator.remove();
  }

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
  }

  // Cleanup method
  destroy() {
    if (this.handleKeydown) {
      document.removeEventListener('keydown', this.handleKeydown, true);
      window.removeEventListener('keydown', this.handleKeydown, true);
    }
    
    if (this.assistantDialog) {
      this.assistantDialog.remove();
    }
  }

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
      card.addEventListener('click', () => {
        this.handleFeatureSelection(feature);
      });
    });
    
    // Setup close button
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.toggleAssistant();
      });
    }
  }

  handleFeatureSelection(feature) {
    switch (feature) {
      case 'chat':
        this.showChatInterface();
        break;
      case 'history':
        this.showConversationHistory();
        break;
      case 'utilities':
        this.showUtilitiesPage();
        break;
      case 'knowledge':
        this.showComingSoon('Project Knowledge');
        break;
      case 'settings':
        this.showSettingsPage();
        break;
      default:
        console.log('Unknown feature:', feature);
    }
  }

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
        ">← Back to Welcome</button>
      </div>
    `;
    
    this.setupBackButton();
  }

  // ===========================
  // SECTION 3: CHAT INTERFACE
  // ===========================
  // Handles chat functionality, message formatting, and Claude API integration
  // This section manages the interactive chat experience with the AI assistant

  showChatInterface() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '💬 Project Manager';
    }
    
    if (!content) return;
    
    const projectName = this.extractProjectName();
    
    content.innerHTML = `
      <div id="chat-messages" style="
        flex: 1; overflow-y: auto; padding: 10px; background: #f8fafc;
        display: flex; flex-direction: column;
      ">
        <div style="
          background: #e6fffa; border: 1px solid #81e6d9; border-radius: 18px;
          padding: 12px 16px; margin-bottom: 12px; font-size: 14px; color: #234e52;
          align-self: flex-start; max-width: 85%;
        ">
          👋 Hello! I'm your AI assistant for project <strong>${projectName}</strong>.
        </div>
      </div>
      
      <div style="
        border-top: 1px solid #c9cfd7; padding: 10px; background: white;
        border-radius: 0 0 12px 12px;
      ">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;
          ">← Back</button>
        </div>
        <div style="display: flex; gap: 8px;">
          <textarea id="chat-input" placeholder="Ask me anything about your project..." style="
            flex: 1; padding: 12px; border: 1px solid #c9cfd7; border-radius: 8px;
            font-family: inherit; font-size: 14px; resize: none; min-height: 40px;
            max-height: 120px; outline: none; background: white; color: #2d3748;
          "></textarea>
          <button id="send-btn" style="
            background: #667eea; color: white; border: none; padding: 12px 16px;
            border-radius: 8px; cursor: pointer; font-size: 14px; min-width: 60px;
          ">Send</button>
        </div>
      </div>
    `;
    
    this.setupBackButton();
    this.setupChatFunctionality();
  }

  showSettingsPage() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '⚙️ Settings';
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;
          ">← Back to Welcome</button>
        </div>
        
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            🔑 API Configuration
          </h3>
          <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px;">
            Click the extension icon in your toolbar to configure your Claude API key and Supabase settings.
          </p>
          <button onclick="chrome.action.openPopup()" style="
            background: #667eea; color: white; border: none; padding: 8px 16px;
            border-radius: 6px; cursor: pointer; font-size: 14px;
          ">Open Settings</button>
        </div>
        
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            📊 Usage & Limits
          </h3>
          <p style="margin: 0; color: #4a5568; font-size: 14px;">
            Coming soon: Track your API usage and set spending limits.
          </p>
        </div>
        
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            🎨 Appearance
          </h3>
          <p style="margin: 0; color: #4a5568; font-size: 14px;">
            Coming soon: Customize fonts, colors, and dialog size.
          </p>
        </div>
      </div>
    `;
    
    this.setupBackButton();
  }

  // ===========================
  // SECTION 5: UTILITIES MANAGEMENT  
  // ===========================
  // Handles utilities page, settings, prompt enhancement, and advanced features
  // This section manages all utility functions and user preferences

  showUtilitiesPage() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '🛠️ Utilities';
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;
          ">← Back to Welcome</button>
        </div>
        
        <!-- Message Scraping -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            📥 Comprehensive Message Scraping
          </h3>
          <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px;">
            Intelligently scroll through the entire chat history to capture all messages, including older ones that aren't currently visible.
          </p>
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <button id="scrape-messages-btn" style="
              background: #667eea; color: white; border: none; padding: 10px 16px;
              border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
            ">Scrape All Messages</button>
            <button id="stop-scraping-btn" style="
              background: #f56565; color: white; border: none; padding: 10px 16px;
              border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
              display: none;
            ">Stop Scraping</button>
          </div>
          <div id="scrape-status" style="
            margin-top: 10px; font-size: 13px; color: #4a5568;
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
            padding: 8px 12px; min-height: 20px; display: none;
          "></div>
          <div style="
            background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;
            padding: 10px; margin-top: 12px; font-size: 13px; color: #0369a1;
          ">
            <strong>💡 How it works:</strong> This feature automatically scrolls up through your chat history, 
            capturing messages as they load. It handles Lovable's lazy loading and will continue running 
            even if you switch browser tabs. The process may take a few minutes for long conversations.
          </div>
        </div>
        
        <!-- Notifications -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            🔔 Notifications
          </h3>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <label style="color: #4a5568; font-size: 14px;">Show notification when Lovable finishes response</label>
            <label class="toggle-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
              <input type="checkbox" id="notification-toggle" style="opacity: 0; width: 0; height: 0;">
              <span class="toggle-slider" style="
                position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                background-color: #ccc; transition: .4s; border-radius: 24px;
              "></span>
            </label>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <label style="color: #4a5568; font-size: 14px;">Auto switch to Lovable tab after response</label>
            <label class="toggle-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
              <input type="checkbox" id="auto-switch-toggle" style="opacity: 0; width: 0; height: 0;">
              <span class="toggle-slider" style="
                position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                background-color: #ccc; transition: .4s; border-radius: 24px;
              "></span>
            </label>
          </div>
        </div>
        
        <!-- Input Enhancement -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            ✨ Input Enhancement
          </h3>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <label style="color: #4a5568; font-size: 14px;">Auto-expand input area on new lines</label>
            <label class="toggle-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
              <input type="checkbox" id="auto-expand-toggle" style="opacity: 0; width: 0; height: 0;">
              <span class="toggle-slider" style="
                position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                background-color: #ccc; transition: .4s; border-radius: 24px;
              "></span>
            </label>
          </div>
          <div style="background: #f8fafc; border: 1px solid #c9cfd7; border-radius: 6px; padding: 12px;">
            <h4 style="margin: 0 0 8px 0; color: #1a202c; font-size: 14px; font-weight: 600;">
              Prompt Enhancement (Ctrl+Enter / Cmd+Enter)
            </h4>
            <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 13px;">
              Press Ctrl+Enter (Windows) or Cmd+Enter (Mac) in the Lovable input field to get prompt suggestions:
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: #718096;">
              <div>
                <strong>🎨 Designing:</strong><br>
                • UI Change<br>
                • Optimize for Mobile
              </div>
              <div>
                <strong>⚙️ Functioning:</strong><br>
                • Modifying Function
              </div>
              <div>
                <strong>🐛 Debugging:</strong><br>
                • Minor Errors<br>
                • Persistent Errors<br>
                • Major Errors<br>
                • Critical Errors
              </div>
              <div>
                <strong>🔄 Refactoring:</strong><br>
                • Code Refactoring
              </div>
            </div>
          </div>
        </div>
        
        <!-- Settings -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            ⚙️ Utility Settings
          </h3>
          <button id="reset-utilities-btn" style="
            background: #f56565; color: white; border: none; padding: 8px 16px;
            border-radius: 6px; cursor: pointer; font-size: 14px; margin-right: 8px;
          ">Reset All Settings</button>
          <button id="export-settings-btn" style="
            background: #48bb78; color: white; border: none; padding: 8px 16px;
            border-radius: 6px; cursor: pointer; font-size: 14px;
          ">Export Settings</button>
        </div>
      </div>
    `;
    
    this.setupBackButton();
    this.setupUtilitiesEvents();
    this.loadUtilitiesSettings();
  }

  setupBackButton() {
    const backBtn = document.getElementById('back-to-welcome-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showWelcomePage();
      });
    }
  }

  // ===========================
  // SECTION 4: CONVERSATION HISTORY MANAGEMENT
  // ===========================
  // Handles loading, filtering, searching, and displaying conversation history
  // This section manages the conversation history view and all related functionality

  showConversationHistory() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '📚 Conversation History';
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div id="chat-messages" style="
        flex: 1; overflow-y: auto; padding: 10px; background: #f8fafc;
        display: flex; flex-direction: column;
      ">
        <!-- Chat messages will be loaded here -->
      </div>
      
      <div style="
        border-top: 1px solid #c9cfd7; padding: 10px; background: white;
        border-radius: 0 0 12px 12px;
      ">
        <!-- Back Button Top Right -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;
          ">← Back</button>
          <div style="color: #718096; font-size: 12px;">
            <span id="message-count">0</span>
          </div>
        </div>
        
        <!-- Filter Section - Single Line -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="color: #4a5568; font-size: 14px; font-weight: 500; white-space: nowrap;">
            Filter by:
          </div>
          <select id="date-filter" style="
            padding: 6px 8px; border: 1px solid #c9cfd7; border-radius: 6px;
            font-size: 14px; background: white; color: #4a5568; min-width: 80px;
          ">
            <option value="all">Date</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          
          <select id="category-filter" style="
            padding: 6px 8px; border: 1px solid #c9cfd7; border-radius: 6px;
            font-size: 14px; background: white; color: #4a5568; min-width: 90px;
          ">
            <option value="all">Category</option>
            <option value="coding">🔧 Coding</option>
            <option value="debugging">🐛 Debugging</option>
            <option value="design">🎨 Design</option>
            <option value="deployment">🚀 Deployment</option>
            <option value="planning">📋 Planning</option>
            <option value="other">📁 Other</option>
          </select>
          
          <select id="speaker-filter" style="
            padding: 6px 8px; border: 1px solid #c9cfd7; border-radius: 6px;
            font-size: 14px; background: white; color: #4a5568; min-width: 80px;
          ">
            <option value="all">Speaker</option>
            <option value="user">👤 You</option>
            <option value="lovable">🤖 Lovable</option>
          </select>
        </div>
        
        <!-- Search Section with Navigation -->
        <div style="display: flex; gap: 8px;">
          <input type="text" id="search-input" placeholder="Search in conversations..." style="
            flex: 1; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
            font-family: inherit; font-size: 14px; outline: none; background: white; color: #2d3748;
          ">
          <button id="search-prev-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; min-width: 50px;
          " disabled>Back</button>
          <button id="search-next-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; min-width: 50px;
          " disabled>Next</button>
        </div>
      </div>
    `;
    
    this.setupBackButton();
    this.setupHistoryFilters();
    this.loadHistoryMessages();
  }

  setupHistoryFilters() {
    const searchPrevBtn = document.getElementById('search-prev-btn');
    const searchNextBtn = document.getElementById('search-next-btn');
    const searchInput = document.getElementById('search-input');
    
    // Initialize search navigation
    this.currentSearchIndex = 0;
    this.searchMatches = [];
    
    // Bind methods to ensure proper context
    const applyFilters = this.applyHistoryFilters.bind(this);
    const navigateSearchPrev = () => this.navigateSearch(-1);
    const navigateSearchNext = () => this.navigateSearch(1);
    
    // Search navigation
    if (searchPrevBtn) {
      searchPrevBtn.addEventListener('click', navigateSearchPrev);
    }
    
    if (searchNextBtn) {
      searchNextBtn.addEventListener('click', navigateSearchNext);
    }
    
    // Real-time search
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(applyFilters, 300));
    }
    
    // Auto-apply on filter change
    const filters = ['date-filter', 'category-filter', 'speaker-filter'];
    filters.forEach(filterId => {
      const element = document.getElementById(filterId);
      if (element) {
        element.addEventListener('change', applyFilters);
      }
    });
  }

  navigateSearch(direction) {
    if (this.searchMatches.length === 0) return;
    
    this.currentSearchIndex += direction;
    
    if (this.currentSearchIndex < 0) {
      this.currentSearchIndex = this.searchMatches.length - 1;
    } else if (this.currentSearchIndex >= this.searchMatches.length) {
      this.currentSearchIndex = 0;
    }
    
    // Scroll to the current match
    const currentMatch = this.searchMatches[this.currentSearchIndex];
    if (currentMatch) {
      currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight current match
      this.highlightCurrentMatch();
    }
    
    this.updateSearchNavigation();
  }

  updateSearchNavigation() {
    const prevBtn = document.getElementById('search-prev-btn');
    const nextBtn = document.getElementById('search-next-btn');
    
    if (this.searchMatches.length === 0) {
      if (prevBtn) {
        prevBtn.disabled = true;
        prevBtn.textContent = 'Back';
        prevBtn.style.opacity = '0.5';
      }
      if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.textContent = 'Next';
        nextBtn.style.opacity = '0.5';
      }
    } else {
      if (prevBtn) {
        prevBtn.disabled = false;
        prevBtn.textContent = `Back`;
        prevBtn.style.opacity = '1';
      }
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.textContent = `Next`;
        nextBtn.style.opacity = '1';
      }
      
      // Update the message count to show search progress
      const countElement = document.getElementById('message-count');
      const searchInput = document.getElementById('search-input');
      const searchTerm = searchInput?.value.trim();
      
      if (countElement && searchTerm) {
        const currentPos = this.currentSearchIndex + 1;
        const totalMatches = this.searchMatches.length;
        countElement.innerHTML = `${this.filteredHistoryMessages.length} messages found • <strong>${currentPos}/${totalMatches}</strong> matches`;
      }
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async loadHistoryMessages() {
    console.log('📚 Loading history messages from Supabase database...');
    
    // Load conversations from Supabase database only
    this.allHistoryMessages = [];
    
    try {
      const projectId = this.extractProjectId();
      if (!projectId) {
        console.warn('⚠️ No project ID found - make sure you are on a Lovable.dev project page');
        this.allHistoryMessages = [];
        this.filteredHistoryMessages = [];
        this.renderHistoryMessages();
        return;
      }

      const response = await this.safeSendMessage({
        action: 'getConversations',
        filters: {
          projectId: projectId,
          limit: 1000 // Get more conversations for full history
        }
      });

      if (response?.success && response.data) {
        console.log(`📊 Retrieved ${response.data.length} conversations from database`);
        
        // Convert database conversations to message format
        const allMessages = [];
        
        response.data.forEach(conversation => {
          // Add user message if exists
          if (conversation.user_message) {
            allMessages.push({
              id: `user_${conversation.id}`,
              timestamp: new Date(conversation.timestamp),
              speaker: 'user',
              content: conversation.user_message,
              category: this.extractCategoryFromTags(conversation.tags),
              categories: this.convertTagsToCategories(conversation.tags),
              isDetected: true,
              techTerms: [],
              projectId: conversation.project_id,
              conversationId: conversation.id
            });
          }
          
          // Add lovable message if exists
          if (conversation.lovable_response) {
            allMessages.push({
              id: `lovable_${conversation.id}`,
              timestamp: new Date(conversation.timestamp),
              speaker: 'lovable',
              content: conversation.lovable_response,
              category: this.extractCategoryFromTags(conversation.tags),
              categories: this.convertTagsToCategories(conversation.tags),
              isDetected: true,
              techTerms: [],
              projectId: conversation.project_id,
              conversationId: conversation.id
            });
          }
        });
        
        this.allHistoryMessages = allMessages;
        console.log(`📚 Loaded ${allMessages.length} messages from ${response.data.length} conversations`);
      } else {
        console.error('❌ Failed to load conversations from database:', response?.error);
        throw new Error(`Database load failed: ${response?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error loading conversations from database:', error);
      // Don't fallback to local storage - let the error surface
      this.allHistoryMessages = [];
      // Instead of throwing, just show empty state
      console.warn('⚠️ Could not load conversations from database, showing empty state');
    }
    
    // If no messages found, that's fine - just show empty state
    if (this.allHistoryMessages.length === 0) {
      console.log('📝 No conversation history found in database. Use "Scrape All Messages" or have conversations to populate history.');
    }
    
    // Sort all messages by timestamp (chronological order: oldest first)
    this.allHistoryMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    this.filteredHistoryMessages = [...this.allHistoryMessages];
    this.renderHistoryMessages();
  }

  extractCategoryFromTags(tags) {
    if (!tags || tags.length === 0) return 'other';
    
    const mapping = {
      'Planning': 'planning',
      'Functioning': 'coding',
      'Designing': 'design',
      'Debugging': 'debugging',
      'Deployment': 'deployment'
    };
    
    for (const tag of tags) {
      if (mapping[tag]) return mapping[tag];
    }
    
    return 'other';
  }

  convertTagsToCategories(tags) {
    if (!tags || tags.length === 0) return { primary: [], secondary: [] };
    
    const primaryCategories = ['Planning', 'Functioning', 'Designing', 'Debugging', 'Deployment'];
    const primary = tags.filter(tag => primaryCategories.includes(tag));
    const secondary = tags.filter(tag => !primaryCategories.includes(tag) && tag !== 'scraped' && tag !== 'auto-captured');
    
    return { primary, secondary };
  }

  mapCategoriesToOldFormat(categories) {
    if (!categories || !categories.primary) return 'other';
    
    const mapping = {
      'Planning': 'planning',
      'Functioning': 'coding',
      'Designing': 'design',
      'Debugging': 'debugging',
      'Deployment': 'deployment'
    };
    
    return mapping[categories.primary[0]] || 'other';
  }

  // Method to add detected messages from conversation capture
  addDetectedMessage(messageData) {
    if (!this.allHistoryMessages) this.allHistoryMessages = [];
    
    const formattedMessage = {
      id: messageData.id,
      timestamp: new Date(messageData.timestamp),
      speaker: messageData.speaker,
      content: messageData.content,
      category: this.mapCategoriesToOldFormat(messageData.categories),
      categories: messageData.categories,
      isDetected: true
    };
    
    // Avoid duplicates
    if (!this.allHistoryMessages.find(msg => msg.id === formattedMessage.id)) {
      this.allHistoryMessages.push(formattedMessage);
      
      // Re-sort messages by timestamp (chronological order: oldest first)
      this.allHistoryMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Update filtered messages if currently viewing history
      if (this.filteredHistoryMessages) {
        this.filteredHistoryMessages = [...this.allHistoryMessages];
        this.applyHistoryFilters();
      }
    }
  }

  applyHistoryFilters() {
    const dateFilter = document.getElementById('date-filter')?.value || 'all';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const speakerFilter = document.getElementById('speaker-filter')?.value || 'all';
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    
    this.filteredHistoryMessages = this.allHistoryMessages.filter(msg => {
      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const msgDate = new Date(msg.timestamp);
        
        switch (dateFilter) {
          case 'today':
            if (msgDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (msgDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (msgDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (msgDate < monthAgo) return false;
            break;
        }
      }
      
      // Category filter
      if (categoryFilter !== 'all' && msg.category !== categoryFilter) {
        return false;
      }
      
      // Speaker filter (only show user and lovable, exclude assistant)
      if (speakerFilter !== 'all' && msg.speaker !== speakerFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchableText = msg.content.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }
      
      return true;
    });
    
    // Sort filtered messages by timestamp (chronological order: oldest first)
    this.filteredHistoryMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    this.renderHistoryMessages();
  }

  clearHistoryFilters() {
    document.getElementById('date-filter').value = 'all';
    document.getElementById('category-filter').value = 'all';
    document.getElementById('speaker-filter').value = 'all';
    document.getElementById('search-input').value = '';
    
    this.filteredHistoryMessages = [...this.allHistoryMessages];
    this.renderHistoryMessages();
  }

  async cleanAllFilteredMessages() {
    if (!this.filteredHistoryMessages || this.filteredHistoryMessages.length === 0) {
      console.log('No filtered messages to clean');
      return;
    }

    const messageCount = this.filteredHistoryMessages.length;
    if (!confirm(`Are you sure you want to delete all ${messageCount} filtered messages? This will permanently delete them from the database. This action cannot be undone.`)) {
      return;
    }

    try {
      console.log(`🗑️ Starting bulk cleanup of ${messageCount} messages...`);
      
      // Collect all unique conversation IDs for bulk delete
      const conversationIds = new Set();
      this.filteredHistoryMessages.forEach(msg => {
        if (msg.conversationId) {
          conversationIds.add(msg.conversationId);
        }
      });

      // Perform efficient bulk delete in a single request
      if (conversationIds.size > 0) {
        console.log(`🗑️ Bulk deleting ${conversationIds.size} conversations from database...`);
        
        const response = await this.safeSendMessage({
          action: 'deleteConversations',
          filters: { ids: Array.from(conversationIds) } // Send all IDs in single request
        });
        
        if (response?.success) {
          const deletedCount = response.data?.deletedCount || conversationIds.size;
          console.log(`✅ Bulk delete successful: ${deletedCount} conversations deleted`);
        } else {
          console.warn(`⚠️ Bulk delete failed:`, response?.error);
          throw new Error(response?.error || 'Bulk delete failed');
        }
      }
      
      // Get the IDs of messages to remove from local memory
      const idsToRemove = new Set(this.filteredHistoryMessages.map(msg => msg.id));
      
      // Remove from allHistoryMessages
      this.allHistoryMessages = this.allHistoryMessages.filter(msg => !idsToRemove.has(msg.id));
      
      // Remove from message groups in simple conversation capture if available
      if (window.simpleConversationCapture && window.simpleConversationCapture.messageGroups) {
        // Remove groups that contain any of the IDs to remove
        for (const [groupId, group] of window.simpleConversationCapture.messageGroups.entries()) {
          if (idsToRemove.has(group.userId) || idsToRemove.has(group.lovableId)) {
            window.simpleConversationCapture.messageGroups.delete(groupId);
            // Also remove from processed IDs
            if (window.simpleConversationCapture.processedLovableIds) {
              window.simpleConversationCapture.processedLovableIds.delete(group.lovableId);
            }
          }
        }
      }
      
      // Update filtered messages
      this.filteredHistoryMessages = [...this.allHistoryMessages];
      this.applyHistoryFilters();
      
      console.log(`🗑️ Successfully cleaned ${idsToRemove.size} messages from history and database using bulk delete`);
      
      // Refresh the display
      this.renderHistoryMessages();
      
      // Show success message
      alert(`Successfully deleted ${messageCount} messages from the database using efficient bulk delete.`);
      
    } catch (error) {
      console.error('❌ Error during bulk cleanup:', error);
      alert('An error occurred while cleaning messages. Please check the console and try again.');
    }
  }

  renderHistoryMessages() {
    const container = document.getElementById('chat-messages');
    const countElement = document.getElementById('message-count');
    
    if (!container) return;
    
    // Update count with "Clean all!" link
    if (countElement) {
      const searchInput = document.getElementById('search-input');
      const searchTerm = searchInput?.value.trim();
      
      const cleanAllLink = this.filteredHistoryMessages.length > 0 ? 
        ` • <a href="#" id="clean-all-link" style="color: #dc2626; text-decoration: underline; font-weight: 500; cursor: pointer;">Clean all!</a>` : '';
      
      if (searchTerm) {
        countElement.innerHTML = `${this.filteredHistoryMessages.length} messages found${cleanAllLink}`;
      } else {
        countElement.innerHTML = `${this.filteredHistoryMessages.length} messages found${cleanAllLink}`;
      }
      
      // Add click handler for clean all link
      const cleanAllElement = document.getElementById('clean-all-link');
      if (cleanAllElement) {
        cleanAllElement.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('🗑️ Clean all button clicked');
          try {
            this.cleanAllFilteredMessages();
          } catch (error) {
            console.error('Error in cleanAllFilteredMessages:', error);
          }
        });
      }
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Show empty state if no messages
    if (this.filteredHistoryMessages.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #718096;">
          <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
          <h3 style="margin: 0 0 8px 0; color: #4a5568; font-size: 16px;">
            No messages found
          </h3>
          <p style="margin: 0; font-size: 14px;">
            Try adjusting your filters or search terms.
          </p>
        </div>
      `;
      return;
    }
    
    // Render messages (already sorted by timestamp, newest first)
    this.filteredHistoryMessages.forEach(msg => {
      this.addHistoryMessage(msg.content, msg.speaker, msg.timestamp, msg);
    });
    
    // Update search matches after rendering
    setTimeout(() => {
      this.updateSearchMatches();
    }, 100);
    
    // Scroll to bottom to show newest messages in viewport (while maintaining chronological order)
    container.scrollTop = container.scrollHeight;
  }

  addHistoryMessage(content, speaker, timestamp, messageData = {}) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.display = 'flex';
    messageDiv.style.marginBottom = '12px';
    messageDiv.style.justifyContent = speaker === 'user' ? 'flex-end' : 'flex-start';
    
    let bgColor = speaker === 'user' ? '#667eea' : 'white';
    let textColor = speaker === 'user' ? 'white' : '#2d3748';
    let speakerIcon = speaker === 'user' ? '👤' : '🤖';
    let speakerName = speaker === 'user' ? 'You' : 'Lovable';

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      background: ${bgColor}; color: ${textColor}; padding: 12px 16px; border-radius: 18px;
      max-width: 85%; border: ${speaker === 'lovable' ? '1px solid #c9cfd7' : 'none'};
      line-height: 1.4; word-wrap: break-word; font-size: 14px; position: relative;
    `;

    // Add timestamp and speaker info
    const timeString = this.formatMessageTime(timestamp);
    const headerHtml = `
      <div style="
        font-size: 11px; opacity: 0.7; margin-bottom: 4px;
        ${speaker === 'user' ? 'text-align: right;' : ''}
      ">
        ${speakerIcon} ${speakerName} • ${timeString}
      </div>
    `;

    // Check if this is HTML content from newer captures
    const isHTMLContent = messageData.contentFormat === 'html' || 
                         messageData.projectContext?.contentFormat === 'html' ||
                         this.isHTMLContent(content);

    const formattedContent = this.formatMessage(content, isHTMLContent);
    const highlightedContent = this.highlightSearchTerms(formattedContent);

    messageBubble.innerHTML = headerHtml + highlightedContent;
    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
  }

  formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  highlightSearchTerms(content) {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput?.value.trim().toLowerCase();
    
    if (!searchTerm) {
      this.searchMatches = [];
      this.updateSearchNavigation();
      return content;
    }
    
    // Create a regex to find the search term (case insensitive)
    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
    
    const highlightedContent = content.replace(regex, '<mark class="search-highlight" style="background: #fef08a; color: #92400e; padding: 1px 2px; border-radius: 2px;">$1</mark>');
    
    return highlightedContent;
  }

  updateSearchMatches() {
    // Get all search highlights in the current view
    this.searchMatches = Array.from(document.querySelectorAll('.search-highlight'));
    this.currentSearchIndex = 0;
    
    console.log(`🔍 Found ${this.searchMatches.length} search matches`);
    
    this.updateSearchNavigation();
    if (this.searchMatches.length > 0) {
      this.highlightCurrentMatch();
    }
  }

  highlightCurrentMatch() {
    // Remove previous current highlight
    document.querySelectorAll('.search-highlight').forEach(el => {
      el.style.background = '#fef08a';
      el.style.border = 'none';
    });
    
    // Highlight current match
    if (this.searchMatches[this.currentSearchIndex]) {
      const currentMatch = this.searchMatches[this.currentSearchIndex];
      currentMatch.style.background = '#f59e0b';
      currentMatch.style.border = '2px solid #d97706';
      currentMatch.style.boxShadow = '0 0 0 2px rgba(217, 119, 6, 0.2)';
      
      console.log(`📍 Highlighting match ${this.currentSearchIndex + 1} of ${this.searchMatches.length}`);
    }
  }

  setupUtilitiesEvents() {
    // Message scraping
    const scrapeBtn = document.getElementById('scrape-messages-btn');
    const stopBtn = document.getElementById('stop-scraping-btn');
    
    if (scrapeBtn) {
      scrapeBtn.addEventListener('click', () => this.scrapeAllMessages());
    }
    
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        if (window.currentMessageScraper) {
          window.currentMessageScraper.stop();
          stopBtn.style.display = 'none';
          scrapeBtn.style.display = 'inline-block';
        }
      });
    }

    // Toggle switches
    this.setupToggleSwitch('notification-toggle', 'lovable-notifications');
    this.setupToggleSwitch('auto-switch-toggle', 'lovable-auto-switch');
    this.setupToggleSwitch('auto-expand-toggle', 'lovable-auto-expand');

    // Settings buttons
    const resetBtn = document.getElementById('reset-utilities-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetUtilitiesSettings());
    }

    const exportBtn = document.getElementById('export-settings-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportUtilitiesSettings());
    }

    // Initialize toggle CSS
    this.addToggleCSS();
    
    // Setup prompt enhancement
    this.setupPromptEnhancement();
    
    // Setup input auto-expansion
    this.setupInputAutoExpansion();
    
    // Setup Lovable response monitoring
    this.setupLovableResponseMonitoring();
  }

  setupToggleSwitch(toggleId, settingKey) {
    const toggle = document.getElementById(toggleId);
    if (!toggle) return;

    toggle.addEventListener('change', () => {
      const isEnabled = toggle.checked;
      localStorage.setItem(settingKey, isEnabled.toString());
      console.log(`🔧 ${settingKey} ${isEnabled ? 'enabled' : 'disabled'}`);
    });
  }

  addToggleCSS() {
    if (document.getElementById('toggle-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'toggle-styles';
    style.textContent = `
      .toggle-switch input:checked + .toggle-slider {
        background-color: #667eea;
      }
      
      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(26px);
      }
    `;
    document.head.appendChild(style);
  }

  loadUtilitiesSettings() {
    // Load saved settings from localStorage
    const settings = [
      { id: 'notification-toggle', key: 'lovable-notifications' },
      { id: 'auto-switch-toggle', key: 'lovable-auto-switch' },
      { id: 'auto-expand-toggle', key: 'lovable-auto-expand' }
    ];

    settings.forEach(({ id, key }) => {
      const toggle = document.getElementById(id);
      if (toggle) {
        const saved = localStorage.getItem(key);
        toggle.checked = saved === 'true';
      }
    });
  }

  async scrapeAllMessages() {
    const statusDiv = document.getElementById('scrape-status');
    const btn = document.getElementById('scrape-messages-btn');
    const stopBtn = document.getElementById('stop-scraping-btn');
    
    if (!statusDiv || !btn) return;
    
    // Show status area and stop button
    statusDiv.style.display = 'block';
    btn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-block';
    
    btn.disabled = true;
    btn.textContent = 'Scraping...';
    statusDiv.innerHTML = '<span style="color: #667eea;">🔄 Initializing comprehensive message scraping...</span>';
    
    try {
      // Initialize the comprehensive scraper
      const scraper = new ComprehensiveMessageScraper(statusDiv, btn);
      
      // Store globally so stop button can access it
      window.currentMessageScraper = scraper;
      
      await scraper.startScraping();
      
      // Clean up
      window.currentMessageScraper = null;
      
    } catch (error) {
      console.error('Scraping error:', error);
      statusDiv.innerHTML = '<span style="color: #f56565;">❌ Error during scraping: ' + error.message + '</span>';
      
      // Reset UI
      btn.disabled = false;
      btn.textContent = 'Scrape All Messages';
      btn.style.display = 'inline-block';
      if (stopBtn) stopBtn.style.display = 'none';
      
      // Hide status after error
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 5000);
    }
  }

  setupPromptEnhancement() {
    // Monitor for Ctrl+Enter / Cmd+Enter in Lovable input fields
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const target = e.target;
        
        // Check if we're in a Lovable input field
        if (this.isLovableInputField(target)) {
          e.preventDefault();
          this.showPromptEnhancementMenu(target);
        }
      }
    });
  }

  isLovableInputField(element) {
    // Check if the element is likely a Lovable input field
    if (!element || element.tagName !== 'TEXTAREA') return false;
    
    // Look for common Lovable input characteristics
    const commonSelectors = [
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="ask"]',
      'textarea[data-testid*="input"]',
      'textarea[class*="input"]'
    ];
    
    return commonSelectors.some(selector => element.matches(selector)) ||
           element.closest('[class*="chat"]') ||
           element.closest('[class*="input"]') ||
           element.closest('[data-testid*="chat"]');
  }

  showPromptEnhancementMenu(inputElement) {
    // Remove existing menu
    const existingMenu = document.getElementById('prompt-enhancement-menu');
    if (existingMenu) existingMenu.remove();
    
    const menu = document.createElement('div');
    menu.id = 'prompt-enhancement-menu';
    menu.innerHTML = `
      <div style="
        position: absolute; z-index: 10002; background: white; 
        border: 1px solid #c9cfd7; border-radius: 8px; box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        padding: 16px; min-width: 300px; font-family: system-ui, sans-serif;
      ">
        <h4 style="margin: 0 0 12px 0; color: #1a202c; font-size: 14px; font-weight: 600;">
          ✨ Enhance Your Prompt
        </h4>
        <div style="display: grid; gap: 8px;">
          <div class="prompt-category" data-category="designing">
            <div style="font-weight: 600; color: #667eea; margin-bottom: 4px;">🎨 Designing</div>
            <button class="prompt-option" data-text="Please help me with UI changes - ">UI Change</button>
            <button class="prompt-option" data-text="Please optimize this for mobile devices - ">Optimize for Mobile</button>
          </div>
          
          <div class="prompt-category" data-category="functioning">
            <div style="font-weight: 600; color: #48bb78; margin-bottom: 4px;">⚙️ Functioning</div>
            <button class="prompt-option" data-text="I need to modify this function - ">Modifying Function</button>
          </div>
          
          <div class="prompt-category" data-category="debugging">
            <div style="font-weight: 600; color: #f56565; margin-bottom: 4px;">🐛 Debugging</div>
            <button class="prompt-option" data-text="I'm experiencing minor errors - ">Minor Errors</button>
            <button class="prompt-option" data-text="I have persistent errors that keep occurring - ">Persistent Errors</button>
            <button class="prompt-option" data-text="There are major errors affecting functionality - ">Major Errors</button>
            <button class="prompt-option" data-text="URGENT: Critical errors need immediate attention - ">Critical Errors</button>
          </div>
          
          <div class="prompt-category" data-category="refactoring">
            <div style="font-weight: 600; color: #805ad5; margin-bottom: 4px;">🔄 Refactoring</div>
            <button class="prompt-option" data-text="Please help me refactor this code to improve - ">Code Refactoring</button>
          </div>
        </div>
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center;">
          <button id="close-prompt-menu" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
          ">Cancel</button>
        </div>
      </div>
    `;
    
    // Position menu near the input
    const rect = inputElement.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = (rect.top - 200) + 'px';
    menu.style.left = rect.left + 'px';
    
    // Add menu styles
    if (!document.getElementById('prompt-menu-styles')) {
      const style = document.createElement('style');
      style.id = 'prompt-menu-styles';
      style.textContent = `
        .prompt-option {
          display: block; width: 100%; text-align: left; 
          background: #f8fafc; border: 1px solid #e2e8f0; 
          padding: 6px 10px; margin: 2px 0; border-radius: 4px; 
          cursor: pointer; font-size: 13px; color: #4a5568;
        }
        .prompt-option:hover {
          background: #667eea; color: white;
        }
        .prompt-category {
          margin-bottom: 12px;
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(menu);
    
    // Add event listeners
    menu.querySelectorAll('.prompt-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const enhancementText = btn.getAttribute('data-text');
        const currentValue = inputElement.value;
        inputElement.value = enhancementText + currentValue;
        inputElement.focus();
        menu.remove();
      });
    });
    
    document.getElementById('close-prompt-menu')?.addEventListener('click', () => {
      menu.remove();
    });
    
    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
  }

  setupInputAutoExpansion() {
    // Monitor for input changes and auto-expand
    document.addEventListener('input', (e) => {
      if (localStorage.getItem('lovable-auto-expand') !== 'true') return;
      
      const target = e.target;
      if (this.isLovableInputField(target)) {
        this.autoExpandTextarea(target);
      }
    });
  }

  autoExpandTextarea(textarea) {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set new height based on content
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px
    textarea.style.height = newHeight + 'px';
  }

  setupLovableResponseMonitoring() {
    // Monitor for Lovable response completion
    if (!window.lovableResponseMonitor) {
      window.lovableResponseMonitor = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // Check if a Lovable response just completed
            this.checkForLovableResponseCompletion(mutation);
          }
        });
      });
      
      // Start observing
      window.lovableResponseMonitor.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  checkForLovableResponseCompletion(mutation) {
    // Look for signs that Lovable finished responding
    const addedNodes = Array.from(mutation.addedNodes);
    
    addedNodes.forEach(node => {
      if (node.nodeType === 1 && node.textContent) {
        // Check for completion indicators
        const completionIndicators = [
          'I\'ve made some changes',
          'The updates have been',
          'I\'ve updated the',
          'Changes have been applied'
        ];
        
        const hasCompletionIndicator = completionIndicators.some(indicator => 
          node.textContent.includes(indicator)
        );
        
        if (hasCompletionIndicator) {
          this.onLovableResponseComplete();
        }
      }
    });
  }

  onLovableResponseComplete() {
    // Show notification if enabled
    if (localStorage.getItem('lovable-notifications') === 'true') {
      this.showLovableCompletionNotification();
    }
    
    // Auto-switch to tab if enabled
    if (localStorage.getItem('lovable-auto-switch') === 'true') {
      this.switchToLovableTab();
    }
  }

  showLovableCompletionNotification() {
    // Check if browser supports notifications
    if (!('Notification' in window)) return;
    
    // Request permission if needed
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createNotification();
        }
      });
    } else if (Notification.permission === 'granted') {
      this.createNotification();
    }
  }

  createNotification() {
    const notification = new Notification('Lovable Response Complete', {
      body: 'Your Lovable.dev assistant has finished responding',
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
    
    // Click to focus tab
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  switchToLovableTab() {
    // Focus the current window/tab
    window.focus();
    
    // Scroll to top to ensure visibility
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetUtilitiesSettings() {
    if (!confirm('Are you sure you want to reset all utility settings? This will disable all features.')) return;
    
    const settings = [
      'lovable-notifications',
      'lovable-auto-switch', 
      'lovable-auto-expand'
    ];
    
    settings.forEach(key => localStorage.removeItem(key));
    
    // Reload settings
    this.loadUtilitiesSettings();
    
    console.log('🔧 All utility settings reset');
  }

  exportUtilitiesSettings() {
    const settings = {
      notifications: localStorage.getItem('lovable-notifications') === 'true',
      autoSwitch: localStorage.getItem('lovable-auto-switch') === 'true',
      autoExpand: localStorage.getItem('lovable-auto-expand') === 'true',
      exportDate: new Date().toISOString(),
      projectId: this.projectId
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `lovable-utilities-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📥 Settings exported');
  }

  // --- Communication Helper Methods ---
  // Safe message passing and error handling functions

  async safeSendMessage(message) {
    try {
      console.log('🔍 LovableDetector: Sending message to background:', {
        action: message.action,
        dataId: message.data?.id,
        dataKeys: message.data ? Object.keys(message.data) : []
      });
      
      const response = await chrome.runtime.sendMessage(message);
      
      console.log('🔍 LovableDetector: Received response from background:', {
        success: response?.success,
        error: response?.error,
        hasData: !!response?.data
      });
      
      return response;
    } catch (error) {
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.warn('⚠️ Extension context invalidated - background communication unavailable');
        return { success: false, error: 'Extension context invalidated' };
      }
      
      if (error.message && error.message.includes('receiving end does not exist')) {
        console.warn('⚠️ Background script not available');
        return { success: false, error: 'Background script not available' };
      }
      
      console.error('❌ Chrome runtime message error:', error);
      return { success: false, error: error.message };
    }
  }
}

// ===========================
// SECTION 6: COMPREHENSIVE MESSAGE SCRAPER
// ===========================  
// Handles intelligent scrolling, batch processing, and comprehensive message scraping
// This section manages the advanced scraping functionality with progress tracking

// Comprehensive Message Scraper Class
class ComprehensiveMessageScraper {
  constructor(statusDiv, btn) {
    this.statusDiv = statusDiv;
    this.btn = btn;
    this.chatContainer = null;
    this.lastMessageGroupCount = 0;
    this.scrollAttempts = 0;
    this.noNewDataCounter = 0;
    this.maxNoNewDataAttempts = 10; // Stop after 10 scrolls with no new data
    this.scrollDelay = 2000; // Consistent 2-second delay before scrolling
    this.saveSuccessDelay = 2000; // 2-second delay after successful batch saves
    this.pendingSaveDelay = 2000; // 2-second delay for pending save completion
    this.errorDelay = 2000; // 2-second delay for error cases
    this.duplicateDelay = 2000; // 2-second delay for duplicate detection cases
    this.isRunning = false;
    this.hasReachedTop = false;
    this.verboseLogging = false; // Set to true for detailed debugging
    
    // Add tracking for batch save completion
    this.pendingSaves = new Set(); // Track IDs of conversations being saved
    this.batchSavePromises = []; // Track active save promises
    this.saveCompletionCallbacks = new Map(); // Track completion callbacks for saves
    
    // Add cancellation token and request throttling - INITIALIZE ALL SETS
    this.isCancelled = false;
    this.activeRequests = new Set(); // Track active save requests
    this.maxConcurrentRequests = 5; // Limit concurrent requests
    this.requestQueue = []; // Queue for throttled requests
    
    // Enhanced deduplication and persistence tracking - INITIALIZE ALL SETS
    this.processedGroupIds = new Set(); // Track processed groups in current session
    this.scrapedGroupIds = new Set(); // Persistent tracking across sessions
    this.sessionScrapedIds = new Set(); // Track what was scraped in current scraping session
  }

  // Control verbose logging for debugging
  setVerboseLogging(enabled) {
    this.verboseLogging = enabled;
    console.log(`🔧 Verbose logging ${enabled ? 'enabled' : 'disabled'} for scraper`);
  }

  // Clear all scraper internal state for fresh session
  clearScrapingState() {
    // Clear any leftover state from previous runs
    this.activeRequests.clear();
    this.requestQueue = [];
    this.batchSavePromises = [];
    this.pendingSaves.clear();
    this.processedGroupIds.clear();
    this.sessionScrapedIds.clear();
    this.scrapedGroupIds.clear(); // Clear persistent tracking for fresh start
    
    // Reset scraping state
    this.lastMessageGroupCount = 0;
    this.scrollAttempts = 0;
    this.noNewDataCounter = 0;
    this.hasReachedTop = false;
    
    console.log('🧹 Cleared all scraper internal state for fresh session');
  }

  // Reset simpleConversationCapture to prevent reprocessing old groups
  resetSimpleConversationCapture() {
    if (window.simpleConversationCapture) {
      const oldSize = window.simpleConversationCapture.messageGroups?.size || 0;
      
      // Clear message groups to prevent reprocessing
      window.simpleConversationCapture.messageGroups?.clear();
      window.simpleConversationCapture.processedLovableIds?.clear();
      
      // Reset pending group
      window.simpleConversationCapture.pendingGroup = null;
      
      console.log(`🧹 Reset simpleConversationCapture: cleared ${oldSize} message groups`);
    } else {
      console.log('⚠️ simpleConversationCapture not found - skipping reset');
    }
  }

  async startScraping() {
    this.isRunning = true;
    this.isCancelled = false; // Reset cancellation flag for new scraping session
    
    // CRITICAL: Reset all state for clean scraping session
    this.clearScrapingState();
    this.resetSimpleConversationCapture(); // Clear previous session data to prevent reprocessing
    
    this.updateStatus('🔍 Finding chat container...', '#667eea');
    
    // Find the chat container
    this.chatContainer = this.findChatContainer();
    if (!this.chatContainer) {
      throw new Error('Could not find chat container. Make sure you are on a Lovable project page with chat messages.');
    }
    
    this.updateStatus('📝 Recording initial state...', '#667eea');
    
    // Record initial message group count
    await this.recordInitialState();
    
    this.updateStatus('🚀 Starting continuous message scraping...', '#667eea');
    console.log('🚀 Starting continuous message scraping with database saving');
    
    // Start the scraping process
    await this.performComprehensiveScrape();
    
    // Final processing
    await this.finalizeScraping();
  }

  findChatContainer() {
    // Look for Lovable's chat scroll container
    const possibleSelectors = [
      // Main chat container with scrolling
      'div.h-full.w-full.overflow-y-auto.scrollbar-thin.scrollbar-track-transparent.scrollbar-thumb-muted-foreground',
      // Alternative containers that might contain messages
      'div[class*="overflow-y-auto"][class*="h-full"]',
      // Fallback: any scrollable container with ChatMessageContainer children
      'div[class*="overflow-y-auto"]'
    ];
    
    for (const selector of possibleSelectors) {
      const containers = document.querySelectorAll(selector);
      for (const container of containers) {
        // Check if this container has ChatMessageContainer children
        const messages = container.querySelectorAll('.ChatMessageContainer[data-message-id]');
        if (messages.length > 0) {
          return container;
        }
      }
    }
    
    // Final fallback: find any container that has ChatMessageContainer descendants
    const messageContainers = document.querySelectorAll('.ChatMessageContainer[data-message-id]');
    if (messageContainers.length > 0) {
      // Find the common scrollable ancestor
      let container = messageContainers[0];
      while (container && container.parentElement) {
        const style = window.getComputedStyle(container);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          return container;
        }
        container = container.parentElement;
      }
    }
    
    return null;
  }

  async recordInitialState() {
    // Scroll to bottom first to establish baseline
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    await this.wait(500);
    
    // Get initial message group count from simple capture system
    const initialCount = window.simpleConversationCapture?.messageGroups?.size || 0;
    this.lastMessageGroupCount = initialCount;
    
    console.log(`📍 Initial message group count: ${initialCount}`);
  }

  async performComprehensiveScrape() {
    console.log('🚀 Starting continuous scrolling scraping...');
    this.scrollAttempts = 0;
    this.noNewDataCounter = 0;
    this.maxNoNewDataAttempts = 10; // Increased from 5 to 10 attempts
    
    // Start from bottom and scroll up continuously
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    await this.wait(500);
    
    // Record initial state
    const initialCount = window.simpleConversationCapture?.messageGroups?.size || 0;
    this.lastMessageGroupCount = initialCount;
    console.log(`📍 Starting with ${initialCount} message groups`);
    
    while (this.isRunning && !this.hasReachedTop && this.noNewDataCounter < this.maxNoNewDataAttempts) {
      this.scrollAttempts++;
      
      // Get current message group count before scrolling
      const beforeScrollCount = window.simpleConversationCapture?.messageGroups?.size || 0;
      
      this.updateStatus(
        `⬆️ Scroll attempt ${this.scrollAttempts} - Found ${beforeScrollCount} message groups`,
        '#667eea'
      );
      
      // Check if we've reached the top
      if (this.checkIfAtTop()) {
        console.log('🔝 Reached the top of the chat');
        this.hasReachedTop = true;
        break;
      }
      
      // Scroll up to load older messages
      const scrollSuccess = await this.scrollUpAndWait();
      console.log(`📜 Scroll ${this.scrollAttempts}: ${scrollSuccess ? 'Success' : 'Failed'}`);
      
      if (!scrollSuccess) {
        // If scroll failed, we might be at the top
        if (this.checkIfAtTop()) {
          console.log('🔝 Reached the top (scroll failed)');
          this.hasReachedTop = true;
          break;
        }
        // Try alternative scroll methods
        await this.tryAlternativeScrollMethods();
      }
      
      // Wait for new messages to load
      await this.wait(800);
      
      // Trigger scan in simple capture system
      if (window.simpleConversationCapture) {
        window.simpleConversationCapture.scanForNewGroups();
      }
      
      // Wait a bit more for processing
      await this.wait(400);
      
      // Check if we got new message groups and batch them
      const afterScrollCount = window.simpleConversationCapture?.messageGroups?.size || 0;
      
      if (afterScrollCount > beforeScrollCount) {
        // We got new data - collect the new message groups for batch processing
        const newGroupsCount = afterScrollCount - beforeScrollCount;
        console.log(`✅ New data detected: +${newGroupsCount} groups (total: ${afterScrollCount})`);
        this.noNewDataCounter = 0; // Reset counter
        
        // Get the actual new message groups for batch processing
        const messageGroups = window.simpleConversationCapture.messageGroups;
        const messageGroupsArray = Array.from(messageGroups.entries());
        const newGroups = messageGroupsArray.slice(beforeScrollCount); // Get only the new groups
        
        // Process the batch of new message groups
        this.updateStatus(`💾 Processing batch of ${newGroupsCount} new message groups...`, '#48bb78');
        
        const batchResult = await this.processBatchOfMessageGroups(newGroups);
        
        // Show clean summary message
        const successCount = batchResult.saved || 0;
        const skippedCount = batchResult.skipped || 0;
        const errorCount = batchResult.errors || 0;
        const cancelled = batchResult.cancelled || false;
        
        if (cancelled) {
          console.log(`🛑 Batch processing cancelled - scraper stopped`);
          this.updateStatus(`🛑 Processing cancelled by user`, '#f59e0b');
          break; // Exit the main loop immediately
        } else if (successCount > 0) {
          console.log(`✅ Success saved ${successCount}/${newGroupsCount} message groups to the database (${skippedCount} skipped, ${errorCount} errors)`);
          this.updateStatus(`✅ Saved ${successCount}/${newGroupsCount} groups successfully!`, '#48bb78');
        } else if (skippedCount > 0) {
          console.log(`⚠️ Skipped ${skippedCount}/${newGroupsCount} message groups (duplicates)`);
          this.updateStatus(`⚠️ Skipped ${skippedCount}/${newGroupsCount} groups (duplicates)`, '#f6ad55');
        } else {
          console.log(`❌ Failed to save any of ${newGroupsCount} message groups`);
          this.updateStatus(`❌ Failed to save ${newGroupsCount} groups`, '#f56565');
        }
        
        // Ensure all saves are completed before proceeding
        if (this.batchSavePromises.length > 0) {
          console.log(`⏳ Ensuring all ${this.batchSavePromises.length} batch saves are completed...`);
          await Promise.allSettled(this.batchSavePromises);
          this.batchSavePromises = [];
          console.log(`✅ All batch saves verified complete`);
        }
        
        // Add 2-second delay before next scroll to prevent backend overload and missing data
        await this.waitWithCountdown(2000, `⏱️ Batch processing complete! Next scroll in`, '#48bb78');
        
      } else {
        // No new data
        this.noNewDataCounter++;
        console.log(`⚠️ No new data on attempt ${this.scrollAttempts} (${this.noNewDataCounter}/${this.maxNoNewDataAttempts})`);
        
        // If no new data, still wait for any pending saves to complete
        if (this.batchSavePromises.length > 0) {
          console.log(`⏳ No new data, waiting for ${this.batchSavePromises.length} pending saves...`);
          await this.waitWithCountdown(this.pendingSaveDelay, `⏳ Completing pending saves. Next scroll in`, '#f6ad55');
          
          const pendingResults = await Promise.allSettled(this.batchSavePromises);
          this.batchSavePromises = [];
          console.log(`✅ All pending saves completed`);
        } else {
          // Add 2-second delay even when no new data to maintain consistent timing
          await this.waitWithCountdown(2000, `⏱️ No new data found. Next scroll in`, '#f6ad55');
        }
        
        if (this.noNewDataCounter >= this.maxNoNewDataAttempts) {
          console.log(`🛑 No new data after ${this.maxNoNewDataAttempts} scroll attempts, stopping`);
          break;
        }
      }
      
      // Update last count for next iteration
      this.lastMessageGroupCount = afterScrollCount;
    }
    
    // Final comprehensive save of any remaining data
    console.log('🔚 Performing final database save...');
    await this.saveAllRemainingConversations();
  }

  async scrollUpAndWait() {
    const initialScrollTop = this.chatContainer.scrollTop;
    
    console.log(`📜 Starting aggressive scroll to top from position: ${initialScrollTop}px`);
    
    // Method 1: Direct scrollTop assignment (immediate)
    this.chatContainer.scrollTop = 0;
    
    // Method 2: ScrollTo with instant behavior
    this.chatContainer.scrollTo({ 
      top: 0, 
      left: 0, 
      behavior: 'instant' 
    });
    
    // Method 3: Focus and keyboard Home command
    this.chatContainer.focus();
    this.chatContainer.dispatchEvent(new KeyboardEvent('keydown', { 
      key: 'Home', 
      ctrlKey: true,
      bubbles: true
    }));
    
    // Method 4: Manual scrollIntoView on first element (if exists)
    const firstMessage = this.chatContainer.querySelector('.ChatMessageContainer[data-message-id]');
    if (firstMessage) {
      firstMessage.scrollIntoView({ 
        behavior: 'instant', 
        block: 'start' 
      });
    }
    
    // Method 5: Force DOM update and then scroll again
    this.chatContainer.style.scrollBehavior = 'auto';
    await this.wait(100);
    this.chatContainer.scrollTop = 0;
    
    // Wait longer for content to load and lazy loading to trigger
    await this.wait(1200); // Increased wait time
    
    // Final verification and force scroll if needed
    let finalScrollTop = this.chatContainer.scrollTop;
    if (finalScrollTop > 50) {
      console.log(`🔄 First attempt resulted in ${finalScrollTop}px, forcing additional scroll...`);
      
      // Force additional scroll attempts
      for (let i = 0; i < 3; i++) {
        this.chatContainer.scrollTop = 0;
        this.chatContainer.scrollTo({ top: 0, behavior: 'instant' });
        await this.wait(300);
        finalScrollTop = this.chatContainer.scrollTop;
        
        if (finalScrollTop <= 10) {
          console.log(`✅ Reached top after ${i + 1} additional attempts`);
          break;
        }
      }
    }
    
    const totalScrolled = initialScrollTop - finalScrollTop;
    const scrollChanged = Math.abs(totalScrolled) > 10;
    
    if (scrollChanged) {
      console.log(`⬆️ Aggressive scroll completed: ${initialScrollTop} → ${finalScrollTop}px (scrolled ${totalScrolled}px)`);
      return true;
    } else {
      console.log(`⚠️ Minimal scroll change: ${initialScrollTop} → ${finalScrollTop}px (may be at top already)`);
      return finalScrollTop <= 10; // Consider success if we're very close to top
    }
  }

  async tryAlternativeScrollMethods() {
    console.log('🔄 Trying alternative scroll methods...');
    
    // Method 1: Try jumping to absolute top
    const beforeTop = this.chatContainer.scrollTop;
    this.chatContainer.scrollTop = 0;
    await this.wait(400);
    
    // Method 2: Try keyboard simulation  
    this.chatContainer.focus();
    this.chatContainer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', ctrlKey: true }));
    await this.wait(300);
    
    // Method 3: Try scrollTo with behavior
    this.chatContainer.scrollTo({ top: 0, behavior: 'smooth' });
    await this.wait(400);
    
    const afterTop = this.chatContainer.scrollTop;
    console.log(`🔄 Alternative scroll: ${beforeTop} → ${afterTop}`);
  }

  async processBatchOfMessageGroups(newGroups) {
    const batchSize = newGroups.length;
    if (batchSize === 0) {
      return { success: true, saved: 0, errors: 0, skipped: 0 };
    }
    
    // Check if scraping was stopped
    if (!this.isRunning) {
      console.log('🛑 Batch processing cancelled - scraper stopped');
      return { success: false, saved: 0, errors: 0, skipped: 0, cancelled: true };
    }
    
    let savedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    console.log(`🔍 Processing batch of ${batchSize} message groups...`);
    
    // Process each message group in the batch
    const savePromises = [];
    
    for (const [groupId, group] of newGroups) {
      // Check if scraping was stopped before each save
      if (!this.isRunning) {
        console.log('🛑 Stopping batch processing - scraper stopped');
        break;
      }
      
      const savePromise = this.saveConversationGroup(groupId, group)
        .then(result => {
          if (result === true) {
            savedCount++;
          } else if (result === 'skipped') {
            skippedCount++;
          } else {
            errorCount++;
          }
          return result;
        })
        .catch(error => {
          errorCount++;
          console.error(`❌ Error in batch processing for ${groupId}:`, error);
          return false;
        });
      
      savePromises.push(savePromise);
      
      // Small delay between starting saves to prevent overwhelming
      await this.wait(50);
    }
    
    // Wait for all saves in this batch to complete
    console.log(`⏳ Waiting for all ${savePromises.length} saves in batch to complete...`);
    await Promise.allSettled(savePromises);
    
    // Return batch results
    const result = {
      success: errorCount === 0,
      saved: savedCount,
      errors: errorCount,
      skipped: skippedCount,
      total: batchSize
    };
    
    console.log(`✅ Batch processing complete: ${savedCount} saved, ${skippedCount} skipped, ${errorCount} errors`);
    return result;
  }

  async saveNewConversationsToDatabase(startIndex, endIndex) {
    try {
      if (!window.simpleConversationCapture?.messageGroups) {
        console.warn('⚠️ No message groups found for incremental save');
        return { success: true, saved: 0, errors: 0, skipped: 0 };
      }

      const messageGroups = window.simpleConversationCapture.messageGroups;
      const messageGroupsArray = Array.from(messageGroups.entries());
      
      // Get only the new message groups (this is approximate since we're using Map)
      const newGroups = messageGroupsArray.slice(startIndex);
      
      if (newGroups.length === 0) {
        console.log('📝 No new conversations to save');
        return { success: true, saved: 0, errors: 0, skipped: 0 };
      }
      
      console.log(`💾 Starting batch save of ${newGroups.length} new conversations...`);
      
      let savedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      
      // Create array to track all save promises for this batch
      const savePromises = [];
      
      for (const [groupId, group] of newGroups) {
        // Add to pending saves tracking
        this.pendingSaves.add(groupId);
        
        // Create the save promise and track it
        const savePromise = this.saveConversationGroup(groupId, group)
          .then(success => {
            // Remove from pending saves when complete
            this.pendingSaves.delete(groupId);
            
            if (success === true) {
              savedCount++;
              console.log(`✅ Batch save: Saved conversation ${groupId} (${savedCount}/${newGroups.length})`);
            } else if (success === 'skipped') {
              skippedCount++;
              console.log(`⚠️ Batch save: Skipped duplicate ${groupId} (${skippedCount} duplicates so far)`);
            } else {
              errorCount++;
              console.error(`❌ Batch save: Failed to save ${groupId} (${errorCount} errors so far)`);
            }
            
            return success;
          })
          .catch(error => {
            // Remove from pending saves on error
            this.pendingSaves.delete(groupId);
            errorCount++;
            console.error(`❌ Error saving conversation group ${groupId}:`, error);
            return false;
          });
        
        savePromises.push(savePromise);
        
        // Small delay between starting saves to prevent overwhelming
        await this.wait(25);
      }
      
      console.log(`⏳ Waiting for all ${savePromises.length} saves in this batch to complete...`);
      
      // Wait for ALL saves in this batch to complete
      const results = await Promise.allSettled(savePromises);
      
      // Count actual results from Promise.allSettled
      const finalCounts = results.reduce((acc, result) => {
        if (result.status === 'fulfilled') {
          if (result.value === true) acc.saved++;
          else if (result.value === 'skipped') acc.skipped++;
          else acc.errors++;
        } else {
          acc.errors++;
        }
        return acc;
      }, { saved: 0, errors: 0, skipped: 0 });
      
      console.log(`✅ Batch save complete: ${finalCounts.saved} saved, ${finalCounts.skipped} skipped, ${finalCounts.errors} errors`);
      
      // Verify no pending saves remain for this batch
      const remainingPendingCount = this.pendingSaves.size;
      if (remainingPendingCount > 0) {
        console.warn(`⚠️ Warning: ${remainingPendingCount} saves still pending after batch completion`);
      }
      
      return {
        success: finalCounts.errors === 0,
        saved: finalCounts.saved,
        errors: finalCounts.errors,
        skipped: finalCounts.skipped,
        total: newGroups.length
      };
      
    } catch (error) {
      console.error('❌ Batch save operation failed:', error);
      return { success: false, saved: 0, errors: 1, skipped: 0, error: error.message };
    }
  }

  async saveAllRemainingConversations() {
    try {
      console.log('💾 Final save: Ensuring all conversations are in database...');
      
      if (!window.simpleConversationCapture?.messageGroups) {
        console.warn('⚠️ No message groups found for final save');
        return;
      }

      const messageGroups = window.simpleConversationCapture.messageGroups;
      let savedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      this.updateStatus(`💾 Final save: Processing ${messageGroups.size} conversations...`, '#48bb78');

      // Save all conversations (with duplicate checking)
      for (const [groupId, group] of messageGroups) {
        try {
          const success = await this.saveConversationGroup(groupId, group, true); // Force save
          if (success === true) {
            savedCount++;
          } else if (success === 'skipped') {
            skippedCount++;
          } else {
            errorCount++;
          }

          // Update progress every 10 items
          if ((savedCount + errorCount + skippedCount) % 10 === 0) {
            this.updateStatus(
              `💾 Final save: ${savedCount} saved, ${skippedCount} skipped, ${errorCount} errors`, 
              '#48bb78'
            );
          }

          // Small delay
          await this.wait(100);

        } catch (error) {
          errorCount++;
          console.error(`❌ Error in final save for ${groupId}:`, error);
        }
      }

      // Final status update
      this.updateStatus(
        `✅ Final save complete! ${savedCount} saved, ${skippedCount} skipped, ${errorCount} errors`,
        '#48bb78'
      );
      
      console.log(`✅ Final database save complete: ${savedCount} saved, ${skippedCount} already existed, ${errorCount} errors`);

    } catch (error) {
      console.error('❌ Final database save operation failed:', error);
      this.updateStatus('❌ Final save failed: ' + error.message, '#f56565');
    }
  }

  async saveConversationGroup(groupId, group, forceSave = false) {
    try {
      // Check if scraping was stopped (unless forced)
      if (!forceSave && !this.isRunning) {
        console.log(`🛑 Save cancelled for ${groupId} - scraper stopped`);
        return 'cancelled';
      }
      
      // Only show minimal debug info for batch processing
      if (this.verboseLogging) {
        console.log(`🔍 Processing ${groupId}: userContent=${group.userContent?.length || 0}chars, lovableContent=${group.lovableContent?.length || 0}chars`);
      }

      // Prepare conversation data for database with proper UUID - same structure as auto-capture with HTML support
      const conversationData = {
        id: this.generateUUID(), // Always generate a proper UUID for database
        projectId: this.extractProjectId(),
        // Fix: Use correct property names from conversation capture
        userMessage: group.userContent || group.userMessage?.content || '',
        lovableResponse: group.lovableContent || group.lovableMessage?.content || '',
        timestamp: group.timestamp || new Date().toISOString(),
        projectContext: {
          messageGroupId: groupId, // Keep original groupId in context
          userId: group.userId,
          lovableId: group.lovableId,
          autoCapture: false, // This is from scraping, not auto-capture
          contentFormat: 'html' // Indicate this is HTML formatted content
        },
        categories: this.extractCategoriesFromGroup(group)
      };

      // Only save if we have meaningful content
      if (!conversationData.userMessage && !conversationData.lovableResponse) {
        if (this.verboseLogging) {
          console.warn(`⚠️ Skipping empty conversation group: ${groupId}`);
        }
        return 'skipped';
      }

      // Send to background script for database saving
      const response = await this.safeSendMessage({
        action: 'saveConversation',
        data: conversationData
      });

      if (response?.success) {
        if (response.skipped) {
          // Duplicate detected - this is expected with unique constraints
          return 'skipped';
        } else {
          // Successfully saved new conversation
          return true;
        }
      } else {
        if (this.verboseLogging) {
          console.warn(`❌ Failed to save conversation ${groupId}: ${response?.error || 'Unknown error'}`);
        }
        return false;
      }

    } catch (error) {
      if (this.verboseLogging) {
        console.error(`❌ Error saving conversation group ${groupId}:`, error);
      }
      return false;
    }
  }

  checkIfAtTop() {
    return this.chatContainer.scrollTop <= 5; // Small threshold for rounding errors
  }

  async saveMessagesToDatabase() {
    try {
      console.log('💾 Starting database save operation...');
      
      if (!window.simpleConversationCapture?.messageGroups) {
        console.warn('⚠️ No message groups found to save');
        this.updateStatus('⚠️ No messages to save', '#f56565');
        return;
      }

      const messageGroups = window.simpleConversationCapture.messageGroups;
      const projectId = this.extractProjectId();
      let savedCount = 0;
      let errorCount = 0;

      this.updateStatus(`💾 Saving ${messageGroups.size} conversations...`, '#48bb78');

      // Process each message group
      for (const [groupId, group] of messageGroups) {
        try {
          // Prepare conversation data for database
          const conversationData = {
            id: this.generateUUID(),
            projectId: projectId,
            userMessage: group.userMessage?.content || '',
            lovableResponse: group.lovableMessage?.content || '',
            timestamp: group.userMessage?.timestamp || group.lovableMessage?.timestamp || new Date().toISOString(),
            projectContext: {
              url: window.location.href,
              projectId: projectId,
              scrapedAt: new Date().toISOString(),
              messageGroupId: groupId
            },
            tags: this.extractTagsFromMessages(group),
            effectivenessScore: null // Will be calculated later if needed
          };

          // Send to background script for database saving
          const response = await this.safeSendMessage({
            action: 'saveConversation',
            data: conversationData
          });

          if (response?.success) {
            savedCount++;
            console.log(`✅ Saved conversation ${savedCount}/${messageGroups.size}`);
          } else {
            errorCount++;
            console.warn(`❌ Failed to save conversation: ${response?.error || 'Unknown error'}`);
          }

          // Update progress
          if (savedCount % 5 === 0) {
            this.updateStatus(`💾 Saved ${savedCount}/${messageGroups.size} conversations...`, '#48bb78');
          }

          // Small delay to prevent overwhelming the API
          await this.wait(100);

        } catch (error) {
          errorCount++;
          console.error(`❌ Error saving conversation:`, error);
        }
      }

      // Final status update
      if (savedCount > 0) {
        this.updateStatus(
          `✅ Database save complete! Saved ${savedCount} conversations${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
          '#48bb78'
        );
        console.log(`✅ Database save complete: ${savedCount} saved, ${errorCount} errors`);
      } else {
        this.updateStatus('❌ No conversations were saved to database', '#f56565');
        console.warn('❌ No conversations were saved to database');
      }

    } catch (error) {
      console.error('❌ Database save operation failed:', error);
      this.updateStatus('❌ Database save failed: ' + error.message, '#f56565');
    }
  }

  extractCategoriesFromGroup(group) {
    const categories = [];
    
    // Extract categories from group categories (if available)
    if (group.categories) {
      if (group.categories.primary) {
        categories.push(...group.categories.primary);
      }
      if (group.categories.secondary) {
        categories.push(...group.categories.secondary);
      }
    }
    
    // Extract categories from legacy message structure (fallback)
    if (group.userMessage?.categories) {
      categories.push(...group.userMessage.categories.primary);
      categories.push(...group.userMessage.categories.secondary);
    }
    
    if (group.lovableMessage?.categories) {
      categories.push(...group.lovableMessage.categories.primary);
      categories.push(...group.lovableMessage.categories.secondary);
    }
    
    // Remove duplicates and empty values, ensure first item is priority
    const uniqueCategories = [...new Set(categories.filter(cat => cat && cat.trim()))];
    
    // Ensure priority categories come first
    const priorityOrder = ['Planning', 'Functioning', 'Designing', 'Debugging', 'Deployment'];
    const sorted = [];
    
    // Add priority categories first
    priorityOrder.forEach(priority => {
      if (uniqueCategories.includes(priority)) {
        sorted.push(priority);
      }
    });
    
    // Add remaining categories
    uniqueCategories.forEach(cat => {
      if (!priorityOrder.includes(cat)) {
        sorted.push(cat);
      }
    });
    
    return sorted;
  }

  extractTagsFromGroup(group) {
    // Legacy method - redirect to new method
    return this.extractCategoriesFromGroup(group);
  }

  extractTagsFromMessages(group) {
    // Legacy method - redirect to new method
    return this.extractCategoriesFromGroup(group);
  }

  extractProjectId() {
    const url = window.location.href;
    const match = url.match(/\/projects\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async safeSendMessage(message) {
    try {
      console.log('🔍 Content Script: Sending message to background:', {
        action: message.action,
        dataId: message.data?.id,
        dataKeys: message.data ? Object.keys(message.data) : []
      });
      
      const response = await chrome.runtime.sendMessage(message);
      
      console.log('🔍 Content Script: Received response from background:', {
        success: response?.success,
        error: response?.error,
        hasData: !!response?.data
      });
      
      return response;
    } catch (error) {
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.warn('⚠️ Extension context invalidated - background communication unavailable');
        return { success: false, error: 'Extension context invalidated' };
      }
      
      if (error.message && error.message.includes('receiving end does not exist')) {
        console.warn('⚠️ Background script not available');
        return { success: false, error: 'Background script not available' };
      }
      
      console.error('❌ Chrome runtime message error:', error);
      return { success: false, error: error.message };
    }
  }

  async finalizeScraping() {
    this.isRunning = false;
    
    console.log('🔚 Finalizing scraping process...');
    
    // Wait for any remaining batch save promises to complete
    if (this.batchSavePromises.length > 0) {
      console.log(`⏳ Waiting for ${this.batchSavePromises.length} remaining batch saves to complete...`);
      this.updateStatus(`⏳ Completing final ${this.batchSavePromises.length} batch saves...`, '#f59e0b');
      
      await Promise.allSettled(this.batchSavePromises);
      this.batchSavePromises = [];
      console.log('✅ All batch saves completed');
    }
    
    // Wait for any individual pending saves to complete
    if (this.pendingSaves.size > 0) {
      console.log(`⏳ Waiting for ${this.pendingSaves.size} individual pending saves to complete...`);
      this.updateStatus(`⏳ Completing final ${this.pendingSaves.size} individual saves...`, '#f59e0b');
      
      // Wait up to 30 seconds for pending saves to complete
      let waitTime = 0;
      const maxWaitTime = 30000; // 30 seconds
      
      while (this.pendingSaves.size > 0 && waitTime < maxWaitTime) {
        await this.wait(500);
        waitTime += 500;
        
        if (waitTime % 5000 === 0) { // Log every 5 seconds
          console.log(`⏳ Still waiting for ${this.pendingSaves.size} saves to complete... (${waitTime/1000}s elapsed)`);
        }
      }
      
      if (this.pendingSaves.size > 0) {
        console.warn(`⚠️ Timeout: ${this.pendingSaves.size} saves still pending after ${maxWaitTime/1000}s`);
      } else {
        console.log('✅ All individual pending saves completed');
      }
    }
    
    // Final scan to ensure we captured everything
    if (window.simpleConversationCapture) {
      console.log('🔍 Final scan for any remaining messages...');
      window.simpleConversationCapture.scanForNewGroups();
      await this.wait(1000); // Give time for final scan
    }
    
    // Get final count
    const finalCount = window.simpleConversationCapture?.messageGroups?.size || 0;
    
    console.log(`🎉 Scraping complete! Total message groups captured: ${finalCount}`);
    
    this.updateStatus(
      `🎉 Scraping complete! Found ${finalCount} message groups. All data saved to database.`,
      '#48bb78'
    );
    
    // Refresh history if available
    if (window.lovableDetector && window.lovableDetector.loadHistoryMessages) {
      console.log('🔄 Refreshing history view...');
      await window.lovableDetector.loadHistoryMessages();
    }
    
    // Reset UI elements
    this.btn.disabled = false;
    this.btn.textContent = 'Scrape All Messages';
    this.btn.style.display = 'inline-block';
    
    // Hide stop button
    const stopBtn = document.getElementById('stop-scraping-btn');
    if (stopBtn) stopBtn.style.display = 'none';
    
    // Clear status after 10 seconds and hide status area
    setTimeout(() => {
      if (this.statusDiv) {
        this.statusDiv.style.display = 'none';
      }
    }, 10000);
  }

  // Helper method to wait for all pending operations
  async waitForAllPendingOperations() {
    console.log(`⏳ Ensuring all operations complete. Batch saves: ${this.batchSavePromises.length}, Individual saves: ${this.pendingSaves.size}`);
    
    // Wait for batch saves
    if (this.batchSavePromises.length > 0) {
      await Promise.allSettled(this.batchSavePromises);
      this.batchSavePromises = [];
    }
    
    // Wait for individual saves with timeout
    let waitTime = 0;
    const maxWaitTime = 15000; // 15 seconds
    
    while (this.pendingSaves.size > 0 && waitTime < maxWaitTime) {
      await this.wait(200);
      waitTime += 200;
    }
    
    if (this.pendingSaves.size > 0) {
      console.warn(`⚠️ ${this.pendingSaves.size} saves still pending after ${maxWaitTime/1000}s wait`);
    }
    
    console.log('✅ All tracked operations completed');
  }

  updateStatus(message, color = '#4a5568') {
    if (this.statusDiv) {
      this.statusDiv.innerHTML = `<span style="color: ${color};">${message}</span>`;
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitWithCountdown(ms, message, color = '#667eea') {
    const totalSeconds = Math.ceil(ms / 1000);
    for (let remaining = totalSeconds; remaining > 0; remaining--) {
      const statusMessage = `${message} ${remaining}s...`;
      this.updateStatus(statusMessage, color);
      await this.wait(1000);
    }
  }

  // Method to stop scraping if needed
  stop() {
    console.log('🛑 Manually stopping scraper...');
    this.isRunning = false;
    this.isCancelled = true; // Set cancellation flag
    
    // Update status
    this.updateStatus('🛑 Scraping stopped by user. Cleaning up state...', '#f59e0b');
    
    // Cancel all pending requests in queue
    while (this.requestQueue.length > 0) {
      const { resolve } = this.requestQueue.shift();
      resolve({ success: false, error: 'Request cancelled', cancelled: true });
    }
    
    // Clear all state immediately for clean restart
    this.clearScrapingState(); // Clear scraper state
    this.resetSimpleConversationCapture(); // Clear capture storage to prevent reprocessing
    
    const cancelledCount = this.pendingSaves.size + this.batchSavePromises.length;
    console.log(`🛑 Cancelled ${cancelledCount} pending operations and cleared all state`);
    
    // Immediate cleanup
    this.cleanupAfterStop();
  }

  cleanupAfterStop() {
    // Ensure all state is cleared for immediate clean restart capability
    this.clearScrapingState();
    this.resetSimpleConversationCapture();
    
    // Reset UI
    this.btn.disabled = false;
    this.btn.textContent = 'Scrape All Messages';
    this.btn.style.display = 'inline-block';
    
    const stopBtn = document.getElementById('stop-scraping-btn');
    if (stopBtn) stopBtn.style.display = 'none';
    
    // Update final status
    this.updateStatus(
      `🛑 Scraping stopped. All state cleared for clean restart.`,
      '#f59e0b'
    );
    
    // Hide status after 5 seconds
    setTimeout(() => {
      if (this.statusDiv) {
        this.statusDiv.style.display = 'none';
      }
    }, 5000);
  }
}

// ===========================
// SECTION 7: INITIALIZATION
// ===========================
// Initializes the extension and makes it globally available
// This section starts the extension and sets up global access

// Initialize the detector
const lovableDetector = new LovableDetector();
window.lovableDetector = lovableDetector;

console.log('🚀 Lovable Assistant: Enhanced scraping with database saving ready!');