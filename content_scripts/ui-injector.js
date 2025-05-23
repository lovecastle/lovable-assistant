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
                • Use Ctrl+Enter to enhance your prompts
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