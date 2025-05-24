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
    
    // Setup keyboard shortcuts with continuous monitoring
    this.setupKeyboardShortcuts();
    
    // Monitor and re-register shortcuts every 2 seconds to prevent loss
    this.shortcutMonitorInterval = setInterval(() => {
      this.ensureKeyboardShortcuts();
    }, 2000);
    
    // Also re-register on page interactions that might interfere
    this.setupPageMonitoring();
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
    // Remove existing listeners if they exist
    if (this.handleKeydown) {
      document.removeEventListener('keydown', this.handleKeydown, true);
      window.removeEventListener('keydown', this.handleKeydown, true);
      document.removeEventListener('keydown', this.handleKeydown, false);
      window.removeEventListener('keydown', this.handleKeydown, false);
      
      if (document.body) {
        document.body.removeEventListener('keydown', this.handleKeydown, true);
        document.body.removeEventListener('keydown', this.handleKeydown, false);
      }
    }
    
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
    
    // Add listeners with both capture and bubble phases for maximum coverage
    document.addEventListener('keydown', this.handleKeydown, true);
    window.addEventListener('keydown', this.handleKeydown, true);
    document.addEventListener('keydown', this.handleKeydown, false);
    window.addEventListener('keydown', this.handleKeydown, false);
    
    // Also add to body specifically (in case document listeners get overridden)
    if (document.body) {
      document.body.addEventListener('keydown', this.handleKeydown, true);
      document.body.addEventListener('keydown', this.handleKeydown, false);
    }
    
    // Mark that shortcuts are registered
    this.shortcutsRegistered = true;
    this.lastShortcutRegistration = Date.now();
    
    console.log('🎹 Keyboard shortcuts registered at', new Date().toLocaleTimeString());
  }

  ensureKeyboardShortcuts() {
    // Simple but effective: just re-register shortcuts regularly
    const timeSinceLastRegistration = Date.now() - (this.lastShortcutRegistration || 0);
    
    if (!this.shortcutsRegistered || timeSinceLastRegistration > 5000) {
      console.log('🔄 Re-registering keyboard shortcuts (monitoring)');
      this.setupKeyboardShortcuts();
    }
  }

  setupPageMonitoring() {
    // Re-register shortcuts when the page changes or loads new content
    const observer = new MutationObserver((mutations) => {
      let shouldReRegister = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if significant DOM changes occurred
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && 
                (node.tagName === 'SCRIPT' || node.classList?.contains('app') || 
                 node.id?.includes('root') || node.id?.includes('app'))) {
              shouldReRegister = true;
            }
          });
        }
      });
      
      if (shouldReRegister) {
        console.log('🔄 Page content changed, re-registering shortcuts');
        setTimeout(() => this.setupKeyboardShortcuts(), 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Re-register on focus events (when user returns to tab)
    window.addEventListener('focus', () => {
      console.log('🔄 Window focused, ensuring shortcuts');
      setTimeout(() => this.setupKeyboardShortcuts(), 100);
    });

    // Re-register on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('🔄 Tab visible, ensuring shortcuts');
        setTimeout(() => this.setupKeyboardShortcuts(), 100);
      }
    });
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
        #dialog-content::-webkit-scrollbar,
        #chat-messages::-webkit-scrollbar { 
          width: 4px; 
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
        background: white; border: 1px solid #e2e8f0; border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15); z-index: 10001;
        font-family: system-ui, sans-serif; display: flex; flex-direction: column;
      ">
        <div id="drag-handle" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 16px; border-radius: 12px 12px 0 0;
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
            background: white; border: 2px solid #e2e8f0; border-radius: 12px;
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
            background: white; border: 2px solid #e2e8f0; border-radius: 12px;
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
            background: white; border: 2px solid #e2e8f0; border-radius: 12px;
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
          
          <!-- Settings -->
          <div class="feature-card" data-feature="settings" style="
            background: white; border: 2px solid #e2e8f0; border-radius: 12px;
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
          background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px;
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
      max-width: 85%; border: ${type === 'assistant' ? '1px solid #e2e8f0' : 'none'};
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
        return `<pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; overflow-x: auto; font-family: 'SF Mono', Monaco, monospace; font-size: 13px; line-height: 1.5; color: #1a202c;"><code>${this.escapeHtml(code.trim())}</code></pre>`;
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
      .replace(/^---+$/gm, '<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 24px 0;">')
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
      <div style="background: white; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 18px; max-width: 85%;">
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
    if (this.shortcutMonitorInterval) {
      clearInterval(this.shortcutMonitorInterval);
    }
    
    if (this.handleKeydown) {
      document.removeEventListener('keydown', this.handleKeydown, true);
      window.removeEventListener('keydown', this.handleKeydown, true);
      document.removeEventListener('keydown', this.handleKeydown, false);
      window.removeEventListener('keydown', this.handleKeydown, false);
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
        card.style.borderColor = '#e2e8f0';
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
        flex: 1; overflow-y: auto; padding: 16px; background: #f8fafc;
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
        border-top: 1px solid #e2e8f0; padding: 16px; background: white;
        border-radius: 0 0 12px 12px;
      ">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #e2e8f0;
            padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;
          ">← Back</button>
        </div>
        <div style="display: flex; gap: 8px;">
          <textarea id="chat-input" placeholder="Ask me anything about your project..." style="
            flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;
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
            background: #f7fafc; color: #4a5568; border: 1px solid #e2e8f0;
            padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;
          ">← Back to Welcome</button>
        </div>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
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
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            📊 Usage & Limits
          </h3>
          <p style="margin: 0; color: #4a5568; font-size: 14px;">
            Coming soon: Track your API usage and set spending limits.
          </p>
        </div>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
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
      <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
        <!-- Header with Back Button -->
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #e2e8f0;
            padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;
          ">← Back</button>
          <div style="color: #718096; font-size: 12px;">
            <span id="conversation-count">0</span> conversations found
          </div>
        </div>
        
        <!-- Filters Section -->
        <div style="
          background: white; border: 1px solid #e2e8f0; border-radius: 8px;
          padding: 16px; margin-bottom: 16px;
        ">
          <h3 style="margin: 0 0 12px 0; color: #1a202c; font-size: 14px; font-weight: 600;">
            🔍 Filters
          </h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <!-- Date Filter -->
            <div>
              <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #4a5568; font-weight: 500;">
                Date Range
              </label>
              <select id="date-filter" style="
                width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 4px;
                font-size: 12px; background: white;
              ">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            <!-- Category Filter -->
            <div>
              <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #4a5568; font-weight: 500;">
                Category
              </label>
              <select id="category-filter" style="
                width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 4px;
                font-size: 12px; background: white;
              ">
                <option value="all">All Categories</option>
                <option value="coding">🔧 Coding</option>
                <option value="debugging">🐛 Debugging</option>
                <option value="design">🎨 Design</option>
                <option value="deployment">🚀 Deployment</option>
                <option value="planning">📋 Planning</option>
                <option value="other">📁 Other</option>
              </select>
            </div>
            
            <!-- Speaker Filter -->
            <div>
              <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #4a5568; font-weight: 500;">
                Speaker
              </label>
              <select id="speaker-filter" style="
                width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 4px;
                font-size: 12px; background: white;
              ">
                <option value="all">All Messages</option>
                <option value="user">👤 You</option>
                <option value="lovable">🤖 Lovable</option>
                <option value="assistant">💬 AI Assistant</option>
              </select>
            </div>
          </div>
          
          <!-- Search Field -->
          <div>
            <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #4a5568; font-weight: 500;">
              Search in conversations
            </label>
            <input type="text" id="search-input" placeholder="Search messages, code, or any content..." style="
              width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px;
              font-size: 14px; outline: none; box-sizing: border-box;
            ">
          </div>
          
          <!-- Filter Actions -->
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            <button id="apply-filters-btn" style="
              background: #667eea; color: white; border: none; padding: 6px 12px;
              border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;
            ">Apply Filters</button>
            <button id="clear-filters-btn" style="
              background: #f7fafc; color: #4a5568; border: 1px solid #e2e8f0;
              padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
            ">Clear All</button>
          </div>
        </div>
        
        <!-- Conversations List -->
        <div style="flex: 1; overflow-y: auto;">
          <div id="conversations-container" style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Conversations will be loaded here -->
          </div>
          
          <!-- Empty State -->
          <div id="empty-state" style="
            text-align: center; padding: 40px 20px; color: #718096;
            display: none;
          ">
            <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
            <h3 style="margin: 0 0 8px 0; color: #4a5568; font-size: 16px;">
              No conversations found
            </h3>
            <p style="margin: 0; font-size: 14px;">
              Start chatting to see your development history here!
            </p>
          </div>
          
          <!-- Loading State -->
          <div id="loading-state" style="
            text-align: center; padding: 40px 20px; color: #718096;
          ">
            <div style="font-size: 24px; margin-bottom: 12px;">⏳</div>
            <p style="margin: 0; font-size: 14px;">Loading conversations...</p>
          </div>
        </div>
      </div>
    `;
    
    this.setupBackButton();
    this.setupHistoryFilters();
    this.loadConversations();
  }

  setupHistoryFilters() {
    const applyBtn = document.getElementById('apply-filters-btn');
    const clearBtn = document.getElementById('clear-filters-btn');
    const searchInput = document.getElementById('search-input');
    
    // Apply filters
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }
    
    // Clear filters
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }
    
    // Real-time search
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.applyFilters();
      }, 300));
    }
    
    // Auto-apply on filter change
    const filters = ['date-filter', 'category-filter', 'speaker-filter'];
    filters.forEach(filterId => {
      const element = document.getElementById(filterId);
      if (element) {
        element.addEventListener('change', () => {
          this.applyFilters();
        });
      }
    });
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

  async loadConversations() {
    // For now, we'll create some sample data
    // In the future, this will load from Supabase
    this.allConversations = this.generateSampleConversations();
    this.filteredConversations = [...this.allConversations];
    this.renderConversations();
  }

  generateSampleConversations() {
    const projectName = this.extractProjectName();
    const sampleConversations = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        category: 'coding',
        messages: [
          { speaker: 'user', content: 'How do I add a dark mode toggle to my React app?' },
          { speaker: 'assistant', content: 'I can help you implement a dark mode toggle! Here\'s a complete solution using React hooks and CSS variables...' }
        ]
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        category: 'debugging',
        messages: [
          { speaker: 'user', content: 'I\'m getting a "Cannot read property of undefined" error in my component' },
          { speaker: 'assistant', content: 'This error typically occurs when trying to access a property on an undefined object. Let me help you debug this...' }
        ]
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
        category: 'design',
        messages: [
          { speaker: 'user', content: 'What are some good color schemes for a SaaS dashboard?' },
          { speaker: 'assistant', content: 'For SaaS dashboards, I recommend using neutral base colors with strategic accent colors. Here are some proven combinations...' }
        ]
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        category: 'deployment',
        messages: [
          { speaker: 'user', content: 'How do I deploy this to Vercel with environment variables?' },
          { speaker: 'lovable', content: 'I\'ve updated your project configuration. Here are the deployment steps...' }
        ]
      }
    ];
    
    return sampleConversations;
  }

  applyFilters() {
    const dateFilter = document.getElementById('date-filter')?.value || 'all';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const speakerFilter = document.getElementById('speaker-filter')?.value || 'all';
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    
    this.filteredConversations = this.allConversations.filter(conv => {
      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const convDate = new Date(conv.timestamp);
        
        switch (dateFilter) {
          case 'today':
            if (convDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (convDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (convDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (convDate < monthAgo) return false;
            break;
        }
      }
      
      // Category filter
      if (categoryFilter !== 'all' && conv.category !== categoryFilter) {
        return false;
      }
      
      // Speaker filter
      if (speakerFilter !== 'all') {
        const hasMatchingSpeaker = conv.messages.some(msg => msg.speaker === speakerFilter);
        if (!hasMatchingSpeaker) return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchableText = conv.messages
          .map(msg => msg.content)
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }
      
      return true;
    });
    
    this.renderConversations();
  }

  clearFilters() {
    document.getElementById('date-filter').value = 'all';
    document.getElementById('category-filter').value = 'all';
    document.getElementById('speaker-filter').value = 'all';
    document.getElementById('search-input').value = '';
    
    this.filteredConversations = [...this.allConversations];
    this.renderConversations();
  }

  renderConversations() {
    const container = document.getElementById('conversations-container');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const countElement = document.getElementById('conversation-count');
    
    if (!container) return;
    
    // Hide loading state
    if (loadingState) loadingState.style.display = 'none';
    
    // Update count
    if (countElement) {
      countElement.textContent = this.filteredConversations.length;
    }
    
    // Show/hide empty state
    if (this.filteredConversations.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      container.innerHTML = '';
      return;
    } else {
      if (emptyState) emptyState.style.display = 'none';
    }
    
    // Render conversations
    container.innerHTML = this.filteredConversations
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map(conv => this.renderConversationCard(conv))
      .join('');
  }

  renderConversationCard(conversation) {
    const timeAgo = this.getTimeAgo(conversation.timestamp);
    const categoryIcon = this.getCategoryIcon(conversation.category);
    const firstMessage = conversation.messages[0];
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    
    return `
      <div class="conversation-card" data-id="${conversation.id}" style="
        background: white; border: 1px solid #e2e8f0; border-radius: 8px;
        padding: 16px; cursor: pointer; transition: all 0.2s ease;
      ">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">${categoryIcon}</span>
            <span style="
              background: #f7fafc; color: #4a5568; padding: 2px 8px;
              border-radius: 12px; font-size: 11px; font-weight: 500; text-transform: uppercase;
            ">${conversation.category}</span>
          </div>
          <div style="color: #718096; font-size: 12px;">${timeAgo}</div>
        </div>
        
        <!-- Preview -->
        <div style="margin-bottom: 8px;">
          <div style="color: #2d3748; font-size: 14px; line-height: 1.4; margin-bottom: 4px;">
            <strong>You:</strong> ${this.truncateText(firstMessage.content, 80)}
          </div>
          ${lastMessage.speaker !== firstMessage.speaker ? `
            <div style="color: #4a5568; font-size: 13px; line-height: 1.4;">
              <strong>${this.getSpeakerName(lastMessage.speaker)}:</strong> ${this.truncateText(lastMessage.content, 60)}
            </div>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div style="display: flex; justify-content: between; align-items: center; font-size: 12px; color: #718096;">
          <span>${conversation.messages.length} messages</span>
        </div>
      </div>
    `;
  }

  getCategoryIcon(category) {
    const icons = {
      coding: '🔧',
      debugging: '🐛',
      design: '🎨',
      deployment: '🚀',
      planning: '📋',
      other: '📁'
    };
    return icons[category] || '📁';
  }

  getSpeakerName(speaker) {
    const names = {
      user: 'You',
      assistant: 'AI Assistant',
      lovable: 'Lovable'
    };
    return names[speaker] || speaker;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return time.toLocaleDateString();
  }
}

// Initialize the detector
const lovableDetector = new LovableDetector();
window.lovableDetector = lovableDetector;