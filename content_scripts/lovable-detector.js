// ===========================
// LOVABLE.DEV ASSISTANT - MAIN DETECTOR
// ===========================
// Organized into focused sections for better maintainability
// Each section has a clear responsibility and purpose
// 
// FILE ORGANIZATION:
// 1. Core Detector Class (lines ~25-120) - Page detection, initialization, keyboard shortcuts
// 2. UI Dialog Management (lines ~125-930) - Dialog creation, styling, navigation
// 3. Project Manager (lines ~935-1500) - Project detection, auto-save, settings management  
// 4. Chat Interface (lines ~1505-1800) - AI chat functionality and message handling
// 5. Conversation History (lines ~1980-2500) - History management and display
// 6. Utilities Management (lines ~1805-1975) - Settings, prompt templates, tools
// 7. Working Status Monitor (lines ~4530-4650) - Status detection and notifications
// 8. Message Scraper (lines ~4665-5850) - Comprehensive message extraction
// 9. Initialization (lines ~5860+) - Global setup and extension startup
//
// *** KEY FEATURE: AUTO-SAVE PROJECT INFO ***
// Located in: detectLovablePage() line ~78 and getCurrentProject() line ~1286
// Automatically saves project information when page loads - no manual action needed!

// Lovable Assistant: Loading enhanced detector...

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
    this.verboseLogging = false; // Control verbose console logging
    this.isClosing = false; // Flag to prevent race conditions
    this.lastToggleTime = 0; // Debounce rapid toggles
    
    // Mix in UI Dialog Manager methods
    Object.assign(this, window.UIDialogManager);
    
    // Mix in Project Manager methods
    Object.assign(this, window.ProjectManager);
    
    // Mix in Chat Interface methods
    Object.assign(this, window.ChatInterface);
    
    // Mix in Conversation History methods
    Object.assign(this, window.ConversationHistory);
    
    // Mix in Utilities Manager methods
    Object.assign(this, window.UtilitiesManager);
    
    // Mix in Status Monitor methods
    Object.assign(this, window.StatusMonitor);
    
    try {
      this.init();
    } catch (error) {
      console.error('Error during LovableDetector initialization:', error);
    }
  }

  init() {
    this.detectLovablePage();
    this.setupKeyboardShortcuts();
    this.setupPromptEnhancement();
  }

  detectLovablePage() {
    const url = window.location.href;
    const isProjectPage = url.includes('lovable.dev/projects/');
    
    if (isProjectPage) {
      this.isLovablePage = true;
      this.projectId = this.extractProjectId(url);
      
      // Lovable.dev project detected
      
      setTimeout(() => {
        this.showReadyNotification();
      }, 100);
      
      // Safely send message to background
      if (chrome.runtime?.id) {
        chrome.runtime.sendMessage({
          action: 'lovablePageDetected',
          data: {
            projectId: this.projectId,
            url: url,
            timestamp: new Date().toISOString()
          }
        }).catch(error => {
          if (!error.message?.includes('Extension context invalidated')) {
            // Could not send message to background
          }
        });
      }
      
      // *** NEW FEATURE: AUTO-SAVE PROJECT INFO ***
      // Automatically saves project name and URL to database on page load
      // No user interaction required - eliminates manual "Save Settings" step
      setTimeout(() => {
        this.autoSaveProjectInfo();
      }, 2000); // 2-second delay ensures page is fully loaded
      
      // Initialize working status monitor after page detection
      setTimeout(() => {
        this.initializeWorkingStatusMonitor();
      }, 1000);
    }
  }

  setupKeyboardShortcuts() {
    // Remove any existing listeners first
    if (this.handleKeydown) {
      document.removeEventListener('keydown', this.handleKeydown, true);
      window.removeEventListener('keydown', this.handleKeydown, true);
    }
    
    this.handleKeydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Add small delay to prevent event conflicts
        setTimeout(() => {
          this.toggleAssistant();
        }, 10);
        
        return false;
      }
    };
    
    // Only use document listener to avoid double events
    document.addEventListener('keydown', this.handleKeydown, true);
  }






  // ===========================
  // SECTION 2: UI DIALOG MANAGEMENT
  // ===========================
  // *** EXTRACTED TO EXTERNAL MODULE ***
  // 
  // All UI Dialog Management functionality has been moved to:
  // content_scripts/ui-dialog-manager.js
  // 
  // Methods available through Object.assign() mixin in constructor:
  // - toggleAssistant() - Toggle dialog open/close
  // - closeAssistant() - Close dialog and cleanup
  // - showAssistant() - Create and show dialog
  // - showWelcomePage() - Display welcome interface
  // - createAssistantDialog() - Build dialog structure
  // - makeDraggable() - Enable drag functionality
  // - setupCloseButton() - Handle close button events
  // - addMessage() - Add chat messages
  // - formatMessage() - Format chat content
  // - showTypingIndicator() - Show AI thinking state
  // - All helper methods for UI styling and interaction
  // 
  // This refactoring reduces main file size while keeping all functionality intact.

  // ========================================
  // PROJECT MANAGER SECTION - EXTRACTED MODULE
  // ========================================
  // Project Manager functionality has been moved to: content_scripts/project-manager.js
  // Methods are mixed into this class via Object.assign() in the constructor
  // 
  // This section handles all project management functionality including:
  // - Project detection and auto-save (NEW FEATURE)
  // - Project list display and management
  // - Project settings interface
  // - Database integration for project data
  // - Debug and testing utilities
  // 
  // Key Feature: Auto-save functionality that saves project info on page load
  // without requiring user to click "Save Settings" button
  //
  // Available methods (from project-manager.js):
  // - showProjectManager()
  // - showProjectSettings(project)
  // - loadProjectsList()
  // - createProjectElement(project, isCurrent)
  // - getCurrentProject()
  // - autoSaveProjectInfo()
  // - getProjectNameFromTitle()
  // - getSavedProjects()
  // - saveProjectSettings(project)
  // - debugSaveCurrentProject()
  // - debugCurrentUrl()
  // - testDatabaseTable()

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
    
    // Scroll to top of the dialog content
    content.scrollTop = 0;
    
    content.innerHTML = `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;
          ">← Back to Welcome</button>
        </div>
        
        <!-- AI Provider Configuration -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            🤖 AI Model Configuration
          </h3>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: #4a5568; font-size: 14px; font-weight: 500;">
              Select AI Provider
            </label>
            <div style="display: flex; gap: 12px; margin-bottom: 16px;">
              <label style="
                display: flex; align-items: center; gap: 8px; padding: 12px 16px;
                border: 2px solid #c9cfd7; border-radius: 8px; cursor: pointer;
                transition: all 0.2s; flex: 1;
              " class="ai-provider-option">
                <input type="radio" name="ai-provider" value="claude" id="provider-claude" style="width: 16px; height: 16px;">
                <div>
                  <div style="font-weight: 600; color: #1a202c;">Claude</div>
                  <div style="font-size: 12px; color: #718096;">Anthropic</div>
                </div>
              </label>
              
              <label style="
                display: flex; align-items: center; gap: 8px; padding: 12px 16px;
                border: 2px solid #c9cfd7; border-radius: 8px; cursor: pointer;
                transition: all 0.2s; flex: 1;
              " class="ai-provider-option">
                <input type="radio" name="ai-provider" value="openai" id="provider-openai" style="width: 16px; height: 16px;">
                <div>
                  <div style="font-weight: 600; color: #1a202c;">GPT</div>
                  <div style="font-size: 12px; color: #718096;">OpenAI</div>
                </div>
              </label>
              
              <label style="
                display: flex; align-items: center; gap: 8px; padding: 12px 16px;
                border: 2px solid #c9cfd7; border-radius: 8px; cursor: pointer;
                transition: all 0.2s; flex: 1;
              " class="ai-provider-option">
                <input type="radio" name="ai-provider" value="gemini" id="provider-gemini" style="width: 16px; height: 16px;">
                <div>
                  <div style="font-weight: 600; color: #1a202c;">Gemini</div>
                  <div style="font-size: 12px; color: #718096;">Google</div>
                </div>
              </label>
            </div>
            
            <!-- Claude API Key -->
            <div id="claude-config" style="display: none;">
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Claude API Key</label>
              <input type="password" id="claude-api-key" placeholder="sk-ant-..." style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 12px;
                background: white; color: #1a202c;
              ">
              
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Model</label>
              <select id="claude-model" style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 8px; background: white;
                color: #1a202c; appearance: auto; -webkit-appearance: menulist;
              ">
                <option value="claude-opus-4-20250514">Claude Opus 4</option>
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                <option value="claude-3-7-sonnet-latest">Claude 3.7 Sonnet</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku</option>
              </select>
              
              <div style="font-size: 12px; color: #718096;">
                Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color: #667eea;">console.anthropic.com</a>
              </div>
              
              <button id="test-claude-connection" style="
                background: #48bb78; color: white; border: none; padding: 8px 16px;
                border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
                margin-top: 12px;
              ">Test Claude Connection</button>
              
              <div id="claude-status" style="
                margin-top: 8px; padding: 8px; border-radius: 6px; font-size: 12px;
                display: none;
              "></div>
            </div>
            
            <!-- OpenAI API Key -->
            <div id="openai-config" style="display: none;">
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">OpenAI API Key</label>
              <input type="password" id="openai-api-key" placeholder="sk-..." style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 12px;
                background: white; color: #1a202c;
              ">
              
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Model</label>
              <select id="openai-model" style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 8px; background: white;
                color: #1a202c; appearance: auto; -webkit-appearance: menulist;
              ">
                <option value="o4-mini-2025-04-16">O4 Mini</option>
                <option value="gpt-4.1-2025-04-14">GPT-4.1</option>
                <option value="gpt-4.1-mini-2025-04-14">GPT-4.1 Mini</option>
                <option value="gpt-4o-2024-08-06">GPT-4o</option>
                <option value="gpt-4o-mini-2024-07-18">GPT-4o Mini</option>
              </select>
              
              <div style="font-size: 12px; color: #718096;">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #667eea;">platform.openai.com</a>
              </div>
              
              <button id="test-openai-connection" style="
                background: #48bb78; color: white; border: none; padding: 8px 16px;
                border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
                margin-top: 12px;
              ">Test OpenAI Connection</button>
              
              <div id="openai-status" style="
                margin-top: 8px; padding: 8px; border-radius: 6px; font-size: 12px;
                display: none;
              "></div>
            </div>
            
            <!-- Gemini API Key -->
            <div id="gemini-config" style="display: none;">
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Gemini API Key</label>
              <input type="password" id="gemini-api-key" placeholder="AIza..." style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 12px;
                background: white; color: #1a202c;
              ">
              
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Model</label>
              <select id="gemini-model" style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 8px; background: white;
                color: #1a202c; appearance: auto; -webkit-appearance: menulist;
              ">
                <option value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro-preview-05-06">Gemini 2.5 Pro</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
              
              <div style="font-size: 12px; color: #718096;">
                Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: #667eea;">Google AI Studio</a>
              </div>
              
              <button id="test-gemini-connection" style="
                background: #48bb78; color: white; border: none; padding: 8px 16px;
                border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
                margin-top: 12px;
              ">Test Gemini Connection</button>
              
              <div id="gemini-status" style="
                margin-top: 8px; padding: 8px; border-radius: 6px; font-size: 12px;
                display: none;
              "></div>
            </div>
          </div>
        </div>
        
        <!-- Database Configuration -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            💾 Database Configuration (Supabase)
          </h3>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Project ID</label>
            <input type="text" id="supabase-project-id" placeholder="your-project-id" style="
              width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; font-family: inherit;
              background: white; color: #1a202c;
            ">
            <div style="margin-top: 4px; font-size: 12px; color: #718096;">
              Find this in your Supabase dashboard URL: https://[project-id].supabase.co
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Anon/Public Key</label>
            <input type="password" id="supabase-key" placeholder="eyJ..." style="
              width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; font-family: inherit;
              background: white; color: #1a202c;
            ">
          </div>
          
          <button id="test-database-connection" style="
            background: #48bb78; color: white; border: none; padding: 10px 16px;
            border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
          ">Test Database Connection</button>
          
          <div id="database-status" style="
            margin-top: 12px; padding: 10px; border-radius: 6px; font-size: 13px;
            display: none;
          "></div>
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
    this.setupAPIProviderSelection();
    this.setupAPIConfiguration();
    this.loadAPISettings();
    
    // Ensure dialog content is scrolled to top
    const dialogContent = document.getElementById('dialog-content');
    if (dialogContent) {
      dialogContent.scrollTop = 0;
    }
  }

  // ===========================
  // SECTION 5: UTILITIES MANAGEMENT  
  // ===========================
  // This section has been extracted to utilities-manager.js
  // All utilities functionality is now provided via the UtilitiesManager mixin
  // See content_scripts/utilities-manager.js for implementation details

  // --- Communication Helper Methods ---
  // Safe message passing and error handling functions

  async safeSendMessage(message) {
    try {
      // Check if chrome runtime is available
      if (!chrome?.runtime?.sendMessage) {
        throw new Error('Extension context invalidated');
      }
      
      // Only log if verbose mode is enabled
      if (this.verboseLogging) {
        console.log('🔍 LovableDetector: Sending message to background:', {
          action: message.action,
          dataId: message.data?.id,
          dataKeys: message.data ? Object.keys(message.data) : []
        });
      }
      
      const response = await chrome.runtime.sendMessage(message);
      
      // Only log if verbose mode is enabled
      if (this.verboseLogging) {
        console.log('🔍 LovableDetector: Received response from background:', {
          success: response?.success,
          error: response?.error,
          hasData: !!response?.data
        });
      }
      
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

  // ===========================
  // WORKING STATUS MONITORING SYSTEM
  // ===========================
  // This section has been extracted to status-monitor.js
  // All working status monitoring functionality is now provided via the StatusMonitor mixin
  // See content_scripts/status-monitor.js for implementation details
}

// ===========================
// SECTION 6: COMPREHENSIVE MESSAGE SCRAPER
// ===========================
// This section has been extracted to message-scraper.js
// The ComprehensiveMessageScraper class is now available globally as window.ComprehensiveMessageScraper
// See content_scripts/message-scraper.js for implementation details


// ===========================
// SECTION 7: INITIALIZATION
// ===========================
// Initializes the extension and makes it globally available
// This section starts the extension and sets up global access

// Initialize the detector
const lovableDetector = new LovableDetector();
window.lovableDetector = lovableDetector;

// Set up message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openAssistantSettings') {
    // Open the assistant and navigate to utilities page
    lovableDetector.toggleAssistant();
    // Give it a moment to open, then navigate to utilities
    setTimeout(() => {
      lovableDetector.showUtilitiesPage();
    }, 100);
    sendResponse({ success: true });
    return true;
  }
});

// Lovable Assistant: Enhanced scraping with database saving ready!
