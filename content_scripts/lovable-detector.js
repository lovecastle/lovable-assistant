// Lovable.dev Page Detection and Enhanced Markdown Chat
console.log('Lovable Assistant: Content script loaded');

class LovableDetector {
  constructor() {
    this.isLovablePage = false;
    this.projectId = null;
    this.assistantDialog = null;
    this.init();
  }

  init() {
    this.detectLovablePage();
    
    // Setup keyboard shortcuts once
    this.setupKeyboardShortcuts();
  }

  detectLovablePage() {
    const url = window.location.href;
    const isProjectPage = url.includes('lovable.dev/projects/');
    
    if (isProjectPage) {
      this.isLovablePage = true;
      this.projectId = this.extractProjectId(url);
      
      console.log('✅ Lovable.dev project detected:', this.projectId);
      console.log('🔍 Debug: this object:', this);
      console.log('🔍 Debug: showReadyNotification exists:', typeof this.showReadyNotification);
      
      // Ensure the method is called with proper context
      setTimeout(() => {
        console.log('🔍 Debug: In setTimeout, this:', this);
        if (typeof this.showReadyNotification === 'function') {
          this.showReadyNotification();
        } else {
          console.warn('showReadyNotification method not found');
        }
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
    // Create bound function once
    this.handleKeydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        console.log('🤖 Assistant shortcut triggered');
        e.preventDefault();
        e.stopPropagation();
        this.toggleAssistant();
        return false;
      }
    };
    
    // Add listeners
    document.addEventListener('keydown', this.handleKeydown, true);
    window.addEventListener('keydown', this.handleKeydown, true);
    
    console.log('🎹 Keyboard shortcuts registered at', new Date().toLocaleTimeString());
  }





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

  extractProjectId(url) {
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
                  Development History
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

    messageBubble.innerHTML = this.formatMessage(content);
    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  formatMessage(content) {
    return content
      .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre style="background: #f8fafc; border: 1px solid #c9cfd7; border-radius: 8px; padding: 10px; margin: 16px 0; overflow-x: auto; font-family: 'SF Mono', Monaco, monospace; font-size: 13px; line-height: 1.5; color: #1a202c;"><code>${this.escapeHtml(code.trim())}</code></pre>`;
      })
      .replace(/`([^`\n]+)`/g, '<code style="background: #f1f5f9; color: #d63384; padding: 3px 6px; border-radius: 4px; font-family: \'SF Mono\', Monaco, monospace; font-size: 0.9em;">$1</code>')
      .replace(/^### (.*$)/gm, '<h3 style="font-size: 18px; font-weight: 600; margin: 20px 0 8px 0; color: #1a202c;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 20px; font-weight: 600; margin: 24px 0 12px 0; color: #1a202c;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 24px; font-weight: 700; margin: 24px 0 16px 0; color: #1a202c;">$1</h1>')
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong style="font-weight: 600;"><em style="font-style: italic;">$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
      .replace(/~~(.*?)~~/g, '<del style="text-decoration: line-through; color: #718096;">$1</del>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #3182ce; text-decoration: underline;">$1</a>')
      .replace(/^> (.*$)/gm, '<blockquote style="border-left: 4px solid #3182ce; margin: 16px 0; padding: 12px 20px; background: #f7fafc; font-style: italic; color: #4a5568; border-radius: 0 6px 6px 0;">$1</blockquote>')
      .replace(/^---+$/gm, '<hr style="border: none; border-top: 2px solid #c9cfd7; margin: 24px 0;">')
      .replace(/^[-*+] (.+)$/gm, '<li style="margin: 6px 0; padding-left: 8px;">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li style="margin: 6px 0; padding-left: 8px;">$1</li>')
      .replace(/(<li[^>]*>.*?<\/li>(?:\s*<li[^>]*>.*?<\/li>)*)/gs, '<ul style="margin: 12px 0; padding-left: 24px; list-style-type: disc; color: #2d3748;">$1</ul>')
      .replace(/\n\s*\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(?!<[^>]+>)(.+?)(?=<|$)/gm, '<p style="margin: 12px 0; line-height: 1.6;">$1</p>')
      .replace(/<p[^>]*>\s*<\/p>/g, '');
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
        this.showDevelopmentHistory();
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

  showDevelopmentHistory() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '📚 Development History';
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
    // Load real conversations from conversation capture
    this.allHistoryMessages = [];
    
    // Add detected messages from conversation capture if available
    // Load messages from the new simple capture system
    if (window.simpleConversationCapture && window.simpleConversationCapture.messageGroups) {
      const allMessages = [];
      
      // Convert message groups back to individual messages for UI compatibility
      for (const group of window.simpleConversationCapture.messageGroups.values()) {
        // Add user message
        allMessages.push({
          id: group.userId,
          timestamp: new Date(group.timestamp),
          speaker: 'user',
          content: group.userContent,
          category: this.mapCategoriesToOldFormat(group.categories),
          categories: group.categories,
          isDetected: true,
          techTerms: [],
          projectId: group.projectId
        });
        
        // Add lovable message
        allMessages.push({
          id: group.lovableId,
          timestamp: new Date(group.timestamp),
          speaker: 'lovable',
          content: group.lovableContent,
          category: this.mapCategoriesToOldFormat(group.categories),
          categories: group.categories,
          isDetected: true,
          techTerms: [],
          projectId: group.projectId
        });
      }
      
      const detectedMessages = allMessages.map(msg => ({
        id: msg.id,
        timestamp: msg.timestamp,
        speaker: msg.speaker,
        content: msg.content,
        category: msg.category,
        categories: msg.categories,
        isDetected: true,
        techTerms: msg.techTerms || [],
        codeSnippets: msg.codeSnippets || []
      }));
      
      this.allHistoryMessages = detectedMessages;
      
      console.log(`📚 Loaded ${detectedMessages.length} real conversations`);
    }
    
    // If no real messages, show helpful empty state message
    if (this.allHistoryMessages.length === 0) {
      console.log('📝 No conversation history found. Try using "Scrape All Messages" in Utilities to capture your chat history.');
    }
    
    // Sort all messages by timestamp (chronological order: oldest first)
    this.allHistoryMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    this.filteredHistoryMessages = [...this.allHistoryMessages];
    this.renderHistoryMessages();
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

  cleanAllFilteredMessages() {
    if (!this.filteredHistoryMessages || this.filteredHistoryMessages.length === 0) {
      console.log('No filtered messages to clean');
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${this.filteredHistoryMessages.length} filtered messages? This action cannot be undone.`)) {
      return;
    }

    try {
      // Get the IDs of messages to remove
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
      
      console.log(`🗑️ Cleaned ${idsToRemove.size} messages from history`);
      
      // Refresh the display
      this.renderHistoryMessages();
      
    } catch (error) {
      console.error('Error cleaning filtered messages:', error);
      alert('An error occurred while cleaning messages. Please try again.');
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

    messageBubble.innerHTML = headerHtml + this.highlightSearchTerms(this.formatMessage(content));
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
}

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
    this.scrollDelay = 1500; // Reduced from 5000ms for faster scraping
    this.isRunning = false;
    this.hasReachedTop = false;
  }

  async startScraping() {
    this.isRunning = true;
    this.updateStatus('🔍 Finding chat container...', '#667eea');
    
    // Test database connection first
    this.updateStatus('🧪 Testing database connection...', '#667eea');
    const dbTestResult = await this.testDatabaseConnection();
    
    if (!dbTestResult) {
      throw new Error('Database connection test failed. Please check your Supabase configuration in extension settings.');
    }
    
    this.updateStatus('✅ Database connection verified', '#48bb78');
    
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
    this.maxNoNewDataAttempts = 5; // Stop after 5 scrolls with no new data
    
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
      
      // Check if we got new message groups
      const afterScrollCount = window.simpleConversationCapture?.messageGroups?.size || 0;
      
      if (afterScrollCount > beforeScrollCount) {
        // We got new data
        const newGroups = afterScrollCount - beforeScrollCount;
        console.log(`✅ New data detected: +${newGroups} groups (total: ${afterScrollCount})`);
        this.noNewDataCounter = 0; // Reset counter
        
        // Save new conversations to database after each successful scroll
        this.updateStatus(`💾 Saving ${newGroups} new conversations...`, '#48bb78');
        await this.saveNewConversationsToDatabase(beforeScrollCount, afterScrollCount);
        
      } else {
        // No new data
        this.noNewDataCounter++;
        console.log(`⚠️ No new data on attempt ${this.scrollAttempts} (${this.noNewDataCounter}/${this.maxNoNewDataAttempts})`);
        
        if (this.noNewDataCounter >= this.maxNoNewDataAttempts) {
          console.log(`🛑 No new data after ${this.maxNoNewDataAttempts} scroll attempts, stopping`);
          break;
        }
      }
      
      // Update last count for next iteration
      this.lastMessageGroupCount = afterScrollCount;
      
      // Brief delay between scroll attempts
      await this.wait(300);
    }
    
    // Final comprehensive save of any remaining data
    console.log('🔚 Performing final database save...');
    await this.saveAllRemainingConversations();
  }

  async scrollUpAndWait() {
    const initialScrollTop = this.chatContainer.scrollTop;
    
    // More aggressive scroll up strategy - scroll larger distances
    const scrollDistance = Math.min(this.chatContainer.scrollTop, 3000); // Scroll up to 3000px or to top
    this.chatContainer.scrollTop = Math.max(0, this.chatContainer.scrollTop - scrollDistance);
    
    // Wait for content to load
    await this.wait(600);
    
    // Check if scroll position actually changed
    const finalScrollTop = this.chatContainer.scrollTop;
    const scrollChanged = Math.abs(finalScrollTop - initialScrollTop) > 10;
    
    if (scrollChanged) {
      console.log(`⬆️ Scrolled up ${initialScrollTop - finalScrollTop}px (from ${initialScrollTop} to ${finalScrollTop})`);
      return true;
    } else {
      return false;
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

  async saveNewConversationsToDatabase(startIndex, endIndex) {
    try {
      if (!window.simpleConversationCapture?.messageGroups) {
        console.warn('⚠️ No message groups found for incremental save');
        return;
      }

      const messageGroups = window.simpleConversationCapture.messageGroups;
      const messageGroupsArray = Array.from(messageGroups.entries());
      
      // Get only the new message groups (this is approximate since we're using Map)
      const newGroups = messageGroupsArray.slice(startIndex);
      
      if (newGroups.length === 0) {
        console.log('📝 No new conversations to save');
        return;
      }
      
      console.log(`💾 Saving ${newGroups.length} new conversations incrementally...`);
      
      let savedCount = 0;
      let errorCount = 0;
      
      for (const [groupId, group] of newGroups) {
        try {
          const success = await this.saveConversationGroup(groupId, group);
          if (success) {
            savedCount++;
          } else {
            errorCount++;
          }
          
          // Small delay to prevent API overwhelming
          await this.wait(50);
          
        } catch (error) {
          errorCount++;
          console.error(`❌ Error saving conversation group ${groupId}:`, error);
        }
      }
      
      console.log(`✅ Incremental save complete: ${savedCount} saved, ${errorCount} errors`);
      
    } catch (error) {
      console.error('❌ Incremental database save failed:', error);
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
      // Prepare conversation data for database with proper UUID
      const conversationData = {
        id: this.generateUUID(), // Always generate a proper UUID for database
        projectId: this.extractProjectId(),
        userMessage: group.userMessage?.content || '',
        lovableResponse: group.lovableMessage?.content || '',
        timestamp: group.userMessage?.timestamp || group.lovableMessage?.timestamp || new Date().toISOString(),
        projectContext: {
          url: window.location.href,
          projectId: this.extractProjectId(),
          scrapedAt: new Date().toISOString(),
          messageGroupId: groupId, // Keep original groupId in context
          userMessageId: group.userMessage?.id,
          lovableMessageId: group.lovableMessage?.id
        },
        tags: this.extractTagsFromMessages(group),
        effectivenessScore: null
      };

      // Only save if we have meaningful content
      if (!conversationData.userMessage && !conversationData.lovableResponse) {
        console.warn(`⚠️ Skipping empty conversation group: ${groupId}`);
        return 'skipped';
      }

      console.log(`🔍 Saving conversation with UUID: ${conversationData.id} (from group: ${groupId})`);

      // Send to background script for database saving
      const response = await this.safeSendMessage({
        action: 'saveConversation',
        data: conversationData
      });

      if (response?.success) {
        console.log(`✅ Saved conversation group: ${groupId} → UUID: ${conversationData.id}`);
        return true;
      } else {
        console.warn(`❌ Failed to save conversation ${groupId}: ${response?.error || 'Unknown error'}`);
        return false;
      }

    } catch (error) {
      console.error(`❌ Error saving conversation group ${groupId}:`, error);
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

  extractTagsFromMessages(group) {
    const tags = [];
    
    // Extract tags from user message categories
    if (group.userMessage?.categories) {
      tags.push(...group.userMessage.categories.primary);
      tags.push(...group.userMessage.categories.secondary);
    }
    
    // Extract tags from lovable message categories
    if (group.lovableMessage?.categories) {
      tags.push(...group.lovableMessage.categories.primary);
      tags.push(...group.lovableMessage.categories.secondary);
    }
    
    // Add scraping tag
    tags.push('scraped');
    
    // Remove duplicates and empty values
    return [...new Set(tags.filter(tag => tag && tag.trim()))];
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

  // Test database connection and saving functionality
  async testDatabaseConnection() {
    console.log('🧪 Testing database connection...');
    
    try {
      // Test basic connection
      const testResponse = await this.safeSendMessage({
        action: 'testConnection'
      });
      
      console.log('🔍 Connection test result:', testResponse);
      
      if (!testResponse?.success) {
        console.error('❌ Database connection test failed');
        return false;
      }
      
      // Test saving a sample conversation with proper UUID
      const sampleConversation = {
        id: this.generateUUID(), // Use proper UUID format
        projectId: this.extractProjectId() || 'test_project',
        userMessage: 'Test user message',
        lovableResponse: 'Test Lovable response',
        timestamp: new Date().toISOString(),
        projectContext: {
          url: window.location.href,
          test: true
        },
        tags: ['test'],
        effectivenessScore: null
      };
      
      console.log('🧪 Testing conversation save with sample data (UUID:', sampleConversation.id, ')...');
      const saveResponse = await this.safeSendMessage({
        action: 'saveConversation',
        data: sampleConversation
      });
      
      console.log('🔍 Save test result:', saveResponse);
      
      if (saveResponse?.success) {
        console.log('✅ Database connection and saving test PASSED');
        return true;
      } else {
        console.error('❌ Database saving test FAILED:', saveResponse?.error);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Database test error:', error);
      return false;
    }
  }

  async finalizeScraping() {
    this.isRunning = false;
    
    // Final scan to ensure we captured everything
    if (window.simpleConversationCapture) {
      window.simpleConversationCapture.scanForNewGroups();
    }
    
    // Get final count
    const finalCount = window.simpleConversationCapture?.messageGroups?.size || 0;
    
    console.log(`🎉 Scraping complete! Total message groups captured: ${finalCount}`);
    
    this.updateStatus(
      `🎉 Scraping complete! Found ${finalCount} message groups`,
      '#48bb78'
    );
    
    // Refresh history if available
    if (window.lovableDetector && window.lovableDetector.loadHistoryMessages) {
      await window.lovableDetector.loadHistoryMessages();
    }
    
    // Reset UI elements
    this.btn.disabled = false;
    this.btn.textContent = 'Scrape All Messages';
    this.btn.style.display = 'inline-block';
    
    // Hide stop button
    const stopBtn = document.getElementById('stop-scraping-btn');
    if (stopBtn) stopBtn.style.display = 'none';
    
    // Clear status after 8 seconds and hide status area
    setTimeout(() => {
      if (this.statusDiv) {
        this.statusDiv.innerHTML = '';
        this.statusDiv.style.display = 'none';
      }
    }, 8000);
  }

  updateStatus(message, color = '#4a5568') {
    if (this.statusDiv) {
      this.statusDiv.innerHTML = `<span style="color: ${color};">${message}</span>`;
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to stop scraping if needed
  stop() {
    this.isRunning = false;
    console.log('🛑 Scraping stopped by user');
    this.updateStatus('🛑 Scraping stopped by user', '#f56565');
    
    // Reset UI elements
    this.btn.disabled = false;
    this.btn.textContent = 'Scrape All Messages';
    this.btn.style.display = 'inline-block';
    
    // Hide stop button
    const stopBtn = document.getElementById('stop-scraping-btn');
    if (stopBtn) stopBtn.style.display = 'none';
    
    // Clear status after 5 seconds and hide status area
    setTimeout(() => {
      if (this.statusDiv) {
        this.statusDiv.innerHTML = '';
        this.statusDiv.style.display = 'none';
      }
    }, 5000);
  }
}

// Initialize the detector
const lovableDetector = new LovableDetector();
window.lovableDetector = lovableDetector;

// Global debugging and testing functions
window.testDatabaseConnection = async function() {
  if (window.currentMessageScraper) {
    return await window.currentMessageScraper.testDatabaseConnection();
  } else {
    console.log('🧪 Creating temporary scraper for database test...');
    const tempScraper = new ComprehensiveMessageScraper(null, null);
    return await tempScraper.testDatabaseConnection();
  }
};

window.debugScrapingIssues = function() {
  console.log('🔧 ===== SCRAPING DEBUG INFORMATION =====');
  console.log('📊 Current State:');
  console.log(`  - Message groups: ${window.simpleConversationCapture?.messageGroups?.size || 0}`);
  console.log(`  - Scraper running: ${window.currentMessageScraper?.isRunning || false}`);
  console.log(`  - Chat containers: ${document.querySelectorAll('.ChatMessageContainer[data-message-id]').length}`);
  
  console.log('\n🧪 Testing Database Connection...');
  window.testDatabaseConnection().then(result => {
    console.log(`Database test result: ${result ? '✅ PASSED' : '❌ FAILED'}`);
  });
  
  console.log('\n💡 Available Commands:');
  console.log('  - window.testDatabaseConnection() - Test database connection');
  console.log('  - window.debugScrapingIssues() - Show this debug info');
  console.log('===============================');
};

console.log('🚀 Lovable Assistant: Enhanced scraping with database saving ready!');
console.log('💡 Debug commands: window.testDatabaseConnection(), window.debugScrapingIssues()');