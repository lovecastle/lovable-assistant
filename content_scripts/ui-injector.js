// UI Injector - Creates and manages the draggable chat interface
class UIInjector {
  constructor() {
    this.dialog = null;
    this.isVisible = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.currentPosition = { x: 100, y: 100 };
    this.conversations = [];
    this.currentView = 'chat';
    
    this.init();
  }

  init() {
    this.createDialog();
    this.setupEventListeners();
    this.loadSettings();
  }

  createDialog() {
    this.dialog = document.createElement('div');
    this.dialog.id = 'lovable-assistant-dialog';
    this.dialog.className = 'lovable-assistant-dialog';
    this.dialog.innerHTML = this.getDialogHTML();
    this.dialog.style.display = 'none';
    document.body.appendChild(this.dialog);
    this.setupDialogEvents();
  }

  getDialogHTML() {
    return `
      <div class="la-header">
        <div class="la-header-buttons">
          <button class="la-btn la-btn-icon" id="la-search" title="Search History">🔍</button>
          <button class="la-btn la-btn-icon" id="la-enhance" title="Enhance Prompt">⚡</button>
          <button class="la-btn la-btn-icon" id="la-suggest" title="Suggest Features">💡</button>
          <button class="la-btn la-btn-icon" id="la-settings" title="Settings">⚙️</button>
        </div>
        <div class="la-drag-handle" id="la-drag-handle">
          <span class="la-title">Lovable Assistant</span>
          <button class="la-btn la-btn-close" id="la-close">×</button>
        </div>
      </div>
      
      <div class="la-content" id="la-content">
        <div class="la-view" id="la-view-chat">
          <div class="la-messages" id="la-messages">
            <div class="la-message la-message-system">
              <div class="la-message-content">
                Welcome! I'm here to help enhance your Lovable.dev development experience.
                <br><br>
                • Type in the chat below to get real-time assistance
                • Use Ctrl+Enter to open prompt helper menu
                • Use Ctrl+K to search your conversation history
              </div>
            </div>
          </div>
          <div class="la-input-container">
            <textarea id="la-input" placeholder="Ask me anything about your project..." rows="2"></textarea>
            <div class="la-input-actions">
              <button class="la-btn la-btn-primary" id="la-send">Send</button>
              <button class="la-btn la-btn-icon" id="la-enhance-current" title="Enhance Current Input">🎯</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="la-resize-handle" id="la-resize-handle"></div>
    `;
  }

  setupEventListeners() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.showDialog('search');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (this.isVisible) {
          this.enhanceCurrentInput();
        }
      }
      if (e.key === 'Escape' && this.isVisible) {
        this.hideDialog();
      }
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'showAssistant') {
        this.showDialog(request.view || 'chat');
        sendResponse({ success: true });
      } else if (request.action === 'hideAssistant') {
        this.hideDialog();
        sendResponse({ success: true });
      }
      return true;
    });

    // Listen for conversation updates
    window.addEventListener('lovable-conversation-update', (event) => {
      this.updateConversations(event.detail);
    });
  }

  setupDialogEvents() {
    if (!this.dialog) return;

    // Header buttons
    const searchBtn = this.dialog.querySelector('#la-search');
    const enhanceBtn = this.dialog.querySelector('#la-enhance');
    const suggestBtn = this.dialog.querySelector('#la-suggest');
    const settingsBtn = this.dialog.querySelector('#la-settings');
    const closeBtn = this.dialog.querySelector('#la-close');

    searchBtn?.addEventListener('click', () => this.switchView('search'));
    enhanceBtn?.addEventListener('click', () => this.enhancePrompt());
    suggestBtn?.addEventListener('click', () => this.suggestFeatures());
    settingsBtn?.addEventListener('click', () => this.switchView('settings'));
    closeBtn?.addEventListener('click', () => this.hideDialog());

    // Chat functionality
    const sendBtn = this.dialog.querySelector('#la-send');
    const enhanceCurrentBtn = this.dialog.querySelector('#la-enhance-current');
    const input = this.dialog.querySelector('#la-input');

    sendBtn?.addEventListener('click', () => this.sendMessage());
    enhanceCurrentBtn?.addEventListener('click', () => this.enhanceCurrentInput());
    
    input?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.enhanceCurrentInput();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Drag functionality
    this.setupDragEvents();
    
    // Resize functionality
    this.setupResizeEvents();
  }

  setupDragEvents() {
    const dragHandle = this.dialog.querySelector('#la-drag-handle');
    
    dragHandle.addEventListener('mousedown', (e) => {
      if (e.target.closest('.la-btn')) return; // Don't drag when clicking buttons
      
      this.isDragging = true;
      this.dragOffset = {
        x: e.clientX - this.currentPosition.x,
        y: e.clientY - this.currentPosition.y
      };
      
      document.addEventListener('mousemove', this.handleDrag);
      document.addEventListener('mouseup', this.stopDrag);
      dragHandle.style.cursor = 'grabbing';
    });
  }

  handleDrag = (e) => {
    if (!this.isDragging) return;
    
    this.currentPosition = {
      x: e.clientX - this.dragOffset.x,
      y: e.clientY - this.dragOffset.y
    };
    
    // Keep dialog within viewport
    const rect = this.dialog.getBoundingClientRect();
    this.currentPosition.x = Math.max(0, Math.min(window.innerWidth - rect.width, this.currentPosition.x));
    this.currentPosition.y = Math.max(0, Math.min(window.innerHeight - rect.height, this.currentPosition.y));
    
    this.updateDialogPosition();
  };

  stopDrag = () => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    
    const dragHandle = this.dialog.querySelector('#la-drag-handle');
    dragHandle.style.cursor = 'grab';
    
    this.saveSettings();
  };

  setupResizeEvents() {
    const resizeHandle = this.dialog.querySelector('#la-resize-handle');
    let isResizing = false;
    let startSize = { width: 0, height: 0 };
    let startMouse = { x: 0, y: 0 };

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      const rect = this.dialog.getBoundingClientRect();
      startSize = { width: rect.width, height: rect.height };
      startMouse = { x: e.clientX, y: e.clientY };
      
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
    });

    const handleResize = (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startMouse.x;
      const deltaY = e.clientY - startMouse.y;
      
      const newWidth = Math.max(300, startSize.width + deltaX);
      const newHeight = Math.max(200, startSize.height + deltaY);
      
      this.dialog.style.width = newWidth + 'px';
      this.dialog.style.height = newHeight + 'px';
    };

    const stopResize = () => {
      isResizing = false;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      this.saveSettings();
    };
  }

  showDialog(view = 'chat') {
    if (!this.dialog) this.createDialog();
    
    this.dialog.style.display = 'block';
    this.isVisible = true;
    this.updateDialogPosition();
    
    if (view !== this.currentView) {
      this.switchView(view);
    }
    
    // Focus input if in chat view
    if (view === 'chat') {
      const input = this.dialog.querySelector('#la-input');
      input?.focus();
    }
  }

  hideDialog() {
    if (this.dialog) {
      this.dialog.style.display = 'none';
      this.isVisible = false;
    }
  }

  updateDialogPosition() {
    if (!this.dialog) return;
    
    this.dialog.style.left = this.currentPosition.x + 'px';
    this.dialog.style.top = this.currentPosition.y + 'px';
  }

  switchView(viewName) {
    this.currentView = viewName;
    const content = this.dialog.querySelector('#la-content');
    
    switch (viewName) {
      case 'search':
        content.innerHTML = this.getSearchViewHTML();
        this.setupSearchView();
        break;
      case 'settings':
        content.innerHTML = this.getSettingsViewHTML();
        this.setupSettingsView();
        break;
      case 'chat':
      default:
        content.innerHTML = this.getChatViewHTML();
        this.setupChatView();
        break;
    }
  }

  getChatViewHTML() {
    return `
      <div class="la-view" id="la-view-chat">
        <div class="la-messages" id="la-messages">
          <div class="la-message la-message-system">
            <div class="la-message-content">
              Welcome! I'm here to help enhance your Lovable.dev development experience.
              <br><br>
              • Type in the chat below to get real-time assistance
              • Use Ctrl+Enter to open prompt helper menu
              • Use Ctrl+K to search your conversation history
            </div>
          </div>
        </div>
        <div class="la-input-container">
          <textarea id="la-input" placeholder="Ask me anything about your project..." rows="2"></textarea>
          <div class="la-input-actions">
            <button class="la-btn la-btn-primary" id="la-send">Send</button>
            <button class="la-btn la-btn-icon" id="la-enhance-current" title="Enhance Current Input">🎯</button>
          </div>
        </div>
      </div>
    `;
  }

  getSearchViewHTML() {
    return `
      <div class="la-view" id="la-view-search">
        <div class="la-search-header">
          <input type="text" id="la-search-input" placeholder="Search conversations..." class="la-search-input">
          <button class="la-btn la-btn-secondary" id="la-back-to-chat">← Back to Chat</button>
        </div>
        <div class="la-search-results" id="la-search-results">
          <div class="la-search-placeholder">
            Start typing to search through your conversation history...
          </div>
        </div>
      </div>
    `;
  }

  getSettingsViewHTML() {
    return `
      <div class="la-view" id="la-view-settings">
        <div class="la-settings-header">
          <h3>Settings</h3>
          <button class="la-btn la-btn-secondary" id="la-back-to-chat">← Back to Chat</button>
        </div>
        <div class="la-settings-content">
          <div class="la-setting-group">
            <h4>API Configuration</h4>
            <div class="la-setting-item">
              <label for="la-claude-key">Claude API Key:</label>
              <input type="password" id="la-claude-key" placeholder="Enter your Claude API key">
              <button class="la-btn la-btn-icon" id="la-test-claude" title="Test Connection">🔗</button>
            </div>
            <div class="la-setting-item">
              <label for="la-supabase-url">Supabase URL:</label>
              <input type="text" id="la-supabase-url" placeholder="https://your-project.supabase.co">
            </div>
            <div class="la-setting-item">
              <label for="la-supabase-key">Supabase Key:</label>
              <input type="password" id="la-supabase-key" placeholder="Enter your Supabase anon key">
              <button class="la-btn la-btn-icon" id="la-test-supabase" title="Test Connection">🔗</button>
            </div>
          </div>
          
          <div class="la-setting-group">
            <h4>Preferences</h4>
            <div class="la-setting-item">
              <label>
                <input type="checkbox" id="la-auto-capture"> Auto-capture conversations
              </label>
            </div>
            <div class="la-setting-item">
              <label>
                <input type="checkbox" id="la-auto-enhance"> Auto-enhance prompts
              </label>
            </div>
            <div class="la-setting-item">
              <label>
                <input type="checkbox" id="la-show-suggestions"> Show feature suggestions
              </label>
            </div>
          </div>
          
          <div class="la-setting-actions">
            <button class="la-btn la-btn-primary" id="la-save-settings">Save Settings</button>
            <button class="la-btn la-btn-secondary" id="la-export-data">Export Data</button>
            <button class="la-btn la-btn-secondary" id="la-import-data">Import Data</button>
          </div>
        </div>
      </div>
    `;
  }

  setupChatView() {
    const sendBtn = this.dialog.querySelector('#la-send');
    const enhanceCurrentBtn = this.dialog.querySelector('#la-enhance-current');
    const input = this.dialog.querySelector('#la-input');

    sendBtn?.addEventListener('click', () => this.sendMessage());
    enhanceCurrentBtn?.addEventListener('click', () => this.enhanceCurrentInput());
    
    input?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.enhanceCurrentInput();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    input?.focus();
  }

  setupSearchView() {
    const backBtn = this.dialog.querySelector('#la-back-to-chat');
    const searchInput = this.dialog.querySelector('#la-search-input');
    
    backBtn?.addEventListener('click', () => this.switchView('chat'));
    
    searchInput?.addEventListener('input', (e) => {
      this.performSearch(e.target.value);
    });
    
    searchInput?.focus();
    this.loadConversationHistory();
  }

  setupSettingsView() {
    const backBtn = this.dialog.querySelector('#la-back-to-chat');
    const saveBtn = this.dialog.querySelector('#la-save-settings');
    const exportBtn = this.dialog.querySelector('#la-export-data');
    const importBtn = this.dialog.querySelector('#la-import-data');
    const testClaudeBtn = this.dialog.querySelector('#la-test-claude');
    const testSupabaseBtn = this.dialog.querySelector('#la-test-supabase');
    
    backBtn?.addEventListener('click', () => this.switchView('chat'));
    saveBtn?.addEventListener('click', () => this.saveSettings());
    exportBtn?.addEventListener('click', () => this.exportData());
    importBtn?.addEventListener('click', () => this.importData());
    testClaudeBtn?.addEventListener('click', () => this.testClaudeConnection());
    testSupabaseBtn?.addEventListener('click', () => this.testSupabaseConnection());
    
    this.loadSettingsIntoForm();
  }

  async sendMessage() {
    const input = this.dialog.querySelector('#la-input');
    const message = input?.value.trim();
    
    if (!message) return;
    
    this.addMessageToChat('user', message);
    input.value = '';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'chatWithClaude',
        message: message,
        context: await this.getProjectContext()
      });
      
      if (response.success) {
        this.addMessageToChat('assistant', response.content);
      } else {
        this.addMessageToChat('error', 'Failed to get response: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      this.addMessageToChat('error', 'Connection error: ' + error.message);
    }
  }

  async enhanceCurrentInput() {
    const input = this.dialog.querySelector('#la-input');
    const currentText = input?.value.trim();
    
    if (!currentText) return;
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'enhancePrompt',
        text: currentText,
        context: await this.getProjectContext()
      });
      
      if (response.success && input) {
        input.value = response.enhanced;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    } catch (error) {
      console.error('Failed to enhance prompt:', error);
    }
  }

  async enhancePrompt() {
    // Get current text from Lovable's input field
    const lovableInput = document.querySelector('textarea[placeholder*="message"], textarea[placeholder*="question"], .ProseMirror, [contenteditable="true"]');
    let currentText = '';
    
    if (lovableInput) {
      currentText = lovableInput.value || lovableInput.textContent || '';
    }
    
    if (!currentText.trim()) {
      this.addMessageToChat('system', 'No text found to enhance. Please type something in the Lovable chat first.');
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'enhancePrompt',
        text: currentText,
        context: await this.getProjectContext()
      });
      
      if (response.success) {
        this.addMessageToChat('system', 'Enhanced prompt suggestion:');
        this.addMessageToChat('assistant', response.enhanced);
        
        // Optionally copy to clipboard
        await navigator.clipboard.writeText(response.enhanced);
        this.addMessageToChat('system', 'Enhanced prompt copied to clipboard!');
      }
    } catch (error) {
      this.addMessageToChat('error', 'Failed to enhance prompt: ' + error.message);
    }
  }

  async suggestFeatures() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'suggestFeatures',
        context: await this.getProjectContext()
      });
      
      if (response.success) {
        this.addMessageToChat('system', 'Feature suggestions for your project:');
        this.addMessageToChat('assistant', response.suggestions);
      }
    } catch (error) {
      this.addMessageToChat('error', 'Failed to get feature suggestions: ' + error.message);
    }
  }

  addMessageToChat(type, content) {
    const messagesContainer = this.dialog.querySelector('#la-messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `la-message la-message-${type}`;
    messageDiv.innerHTML = `
      <div class="la-message-content">
        ${this.formatMessageContent(content)}
      </div>
      <div class="la-message-time">${new Date().toLocaleTimeString()}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  formatMessageContent(content) {
    // Check if content is HTML formatted (from newer captures)
    const isHTMLContent = this.isHTMLContent(content);
    
    if (isHTMLContent) {
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
    
    // Enhance list styling for proper display
    this.enhanceListStyling(temp);
    
    return temp.innerHTML;
  }

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
  }

  async getProjectContext() {
    return {
      url: window.location.href,
      title: document.title,
      projectId: this.extractProjectId(),
      timestamp: new Date().toISOString()
    };
  }

  extractProjectId() {
    const url = window.location.href;
    const match = url.match(/\/projects\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  async performSearch(query) {
    const resultsContainer = this.dialog.querySelector('#la-search-results');
    if (!resultsContainer) return;
    
    if (!query.trim()) {
      resultsContainer.innerHTML = '<div class="la-search-placeholder">Start typing to search...</div>';
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'searchConversations',
        query: query,
        projectId: this.extractProjectId()
      });
      
      if (response.success) {
        this.displaySearchResults(response.results);
      }
    } catch (error) {
      resultsContainer.innerHTML = '<div class="la-search-error">Search failed: ' + error.message + '</div>';
    }
  }

  displaySearchResults(results) {
    const resultsContainer = this.dialog.querySelector('#la-search-results');
    if (!resultsContainer) return;
    
    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="la-search-placeholder">No results found.</div>';
      return;
    }
    
    const html = results.map(result => `
      <div class="la-search-result" data-conversation-id="${result.id}">
        <div class="la-search-result-content">
          <strong>${result.speaker}:</strong> ${result.content.substring(0, 200)}...
        </div>
        <div class="la-search-result-meta">
          ${new Date(result.timestamp).toLocaleDateString()} • 
          ${result.categories.primary.join(', ')}
        </div>
      </div>
    `).join('');
    
    resultsContainer.innerHTML = html;
    
    // Add click handlers
    resultsContainer.querySelectorAll('.la-search-result').forEach(result => {
      result.addEventListener('click', () => {
        const conversationId = result.dataset.conversationId;
        this.viewConversation(conversationId);
      });
    });
  }

  async loadConversationHistory() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getConversations',
        projectId: this.extractProjectId(),
        limit: 50
      });
      
      if (response.success) {
        this.conversations = response.conversations;
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getSettings'
      });
      
      if (response.success) {
        const settings = response.settings;
        this.currentPosition = settings.position || { x: 100, y: 100 };
        
        if (settings.size) {
          this.dialog.style.width = settings.size.width + 'px';
          this.dialog.style.height = settings.size.height + 'px';
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    const settings = {
      position: this.currentPosition,
      size: {
        width: this.dialog.offsetWidth,
        height: this.dialog.offsetHeight
      }
    };
    
    // If in settings view, also save form data
    if (this.currentView === 'settings') {
      const claudeKey = this.dialog.querySelector('#la-claude-key')?.value;
      const supabaseUrl = this.dialog.querySelector('#la-supabase-url')?.value;
      const supabaseKey = this.dialog.querySelector('#la-supabase-key')?.value;
      const autoCapture = this.dialog.querySelector('#la-auto-capture')?.checked;
      const autoEnhance = this.dialog.querySelector('#la-auto-enhance')?.checked;
      const showSuggestions = this.dialog.querySelector('#la-show-suggestions')?.checked;
      
      Object.assign(settings, {
        claudeApiKey: claudeKey,
        supabaseUrl: supabaseUrl,
        supabaseKey: supabaseKey,
        autoCapture: autoCapture,
        autoEnhance: autoEnhance,
        showSuggestions: showSuggestions
      });
    }
    
    try {
      await chrome.runtime.sendMessage({
        action: 'saveSettings',
        settings: settings
      });
      
      if (this.currentView === 'settings') {
        this.addMessageToChat('system', 'Settings saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async loadSettingsIntoForm() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getSettings'
      });
      
      if (response.success) {
        const settings = response.settings;
        
        const claudeKey = this.dialog.querySelector('#la-claude-key');
        const supabaseUrl = this.dialog.querySelector('#la-supabase-url');
        const supabaseKey = this.dialog.querySelector('#la-supabase-key');
        const autoCapture = this.dialog.querySelector('#la-auto-capture');
        const autoEnhance = this.dialog.querySelector('#la-auto-enhance');
        const showSuggestions = this.dialog.querySelector('#la-show-suggestions');
        
        if (claudeKey) claudeKey.value = settings.claudeApiKey || '';
        if (supabaseUrl) supabaseUrl.value = settings.supabaseUrl || '';
        if (supabaseKey) supabaseKey.value = settings.supabaseKey || '';
        if (autoCapture) autoCapture.checked = settings.autoCapture !== false;
        if (autoEnhance) autoEnhance.checked = settings.autoEnhance !== false;
        if (showSuggestions) showSuggestions.checked = settings.showSuggestions !== false;
      }
    } catch (error) {
      console.error('Failed to load settings into form:', error);
    }
  }

  async testClaudeConnection() {
    const claudeKey = this.dialog.querySelector('#la-claude-key')?.value;
    if (!claudeKey) {
      this.addMessageToChat('error', 'Please enter a Claude API key first.');
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'testClaudeConnection',
        apiKey: claudeKey
      });
      
      if (response.success) {
        this.addMessageToChat('system', '✅ Claude connection successful!');
      } else {
        this.addMessageToChat('error', '❌ Claude connection failed: ' + response.error);
      }
    } catch (error) {
      this.addMessageToChat('error', '❌ Connection test failed: ' + error.message);
    }
  }

  async testSupabaseConnection() {
    const supabaseUrl = this.dialog.querySelector('#la-supabase-url')?.value;
    const supabaseKey = this.dialog.querySelector('#la-supabase-key')?.value;
    
    if (!supabaseUrl || !supabaseKey) {
      this.addMessageToChat('error', 'Please enter both Supabase URL and key first.');
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'testSupabaseConnection',
        url: supabaseUrl,
        key: supabaseKey
      });
      
      if (response.success) {
        this.addMessageToChat('system', '✅ Supabase connection successful!');
      } else {
        this.addMessageToChat('error', '❌ Supabase connection failed: ' + response.error);
      }
    } catch (error) {
      this.addMessageToChat('error', '❌ Connection test failed: ' + error.message);
    }
  }

  async exportData() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'exportData'
      });
      
      if (response.success) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lovable-assistant-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.addMessageToChat('system', '✅ Data exported successfully!');
      }
    } catch (error) {
      this.addMessageToChat('error', '❌ Export failed: ' + error.message);
    }
  }

  async importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        const response = await chrome.runtime.sendMessage({
          action: 'importData',
          data: data
        });
        
        if (response.success) {
          this.addMessageToChat('system', '✅ Data imported successfully!');
        } else {
          this.addMessageToChat('error', '❌ Import failed: ' + response.error);
        }
      } catch (error) {
        this.addMessageToChat('error', '❌ Import failed: ' + error.message);
      }
    };
    
    input.click();
  }

  viewConversation(conversationId) {
    // Switch back to chat view and load the specific conversation
    this.switchView('chat');
    // Implementation for loading specific conversation would go here
  }

  updateConversations(conversationData) {
    // Update internal conversation list
    this.conversations.unshift(conversationData);
    
    // If currently in search view, refresh results
    if (this.currentView === 'search') {
      const searchInput = this.dialog.querySelector('#la-search-input');
      if (searchInput && searchInput.value) {
        this.performSearch(searchInput.value);
      }
    }
  }

  // Cleanup method
  destroy() {
    if (this.dialog) {
      this.dialog.remove();
      this.dialog = null;
    }
    this.isVisible = false;
  }
}

// Initialize the UI injector
const uiInjector = new UIInjector();

// Make it globally accessible for debugging
window.uiInjector = uiInjector;

console.log('🎨 Lovable.dev UI Injector initialized');
