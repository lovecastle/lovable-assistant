// ===========================
// CORE DETECTOR CLASS
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
    if (window.UIDialogManager) {
      Object.assign(this, window.UIDialogManager);
    }
    
    // Mix in Project Manager methods
    if (window.ProjectManager) {
      Object.assign(this, window.ProjectManager);
    }
    
    // Mix in Chat Interface methods
    if (window.ChatInterface) {
      Object.assign(this, window.ChatInterface);
    }
    
    // Mix in Conversation History methods
    if (window.ConversationHistory) {
      Object.assign(this, window.ConversationHistory);
    }
    
    // Mix in Utilities Manager methods
    if (window.UtilitiesManager) {
      Object.assign(this, window.UtilitiesManager);
    }
    
    // Mix in Status Monitor methods
    if (window.StatusMonitor) {
      Object.assign(this, window.StatusMonitor);
    }
    
    // Initialize after a brief delay to ensure all mixins are loaded
    setTimeout(() => {
      try {
        this.init();
      } catch (error) {
        console.error('Error during LovableDetector initialization:', error);
      }
    }, 100);
  }

  init() {
    this.detectLovablePage();
    this.setupKeyboardShortcuts();
    
    // Only call setupPromptEnhancement if it exists (from ChatInterface mixin)
    if (typeof this.setupPromptEnhancement === 'function') {
      this.setupPromptEnhancement();
    }
  }

  detectLovablePage() {
    const url = window.location.href;
    const isProjectPage = url.includes('lovable.dev/projects/');
    
    if (isProjectPage) {
      this.isLovablePage = true;
      
      // Extract project ID from URL (fallback if extractProjectId method not available)
      if (typeof this.extractProjectId === 'function') {
        this.projectId = this.extractProjectId(url);
      } else {
        const match = url.match(/\/projects\/([^\/\?]+)/);
        this.projectId = match ? match[1] : null;
      }
      
      // Lovable.dev project detected
      
      setTimeout(() => {
        if (typeof this.showReadyNotification === 'function') {
          this.showReadyNotification();
        }
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
      
      // *** IMMEDIATE PROJECT INFO DETECTION AND SAVE ***
      // Automatically saves project name and URL to database on page load
      // No user interaction required - eliminates manual "Save Settings" step
      setTimeout(() => {
        if (typeof this.autoSaveProjectInfo === 'function') {
          this.autoSaveProjectInfo();
        }
      }, 500); // Immediate detection for faster saving
      
      // Initialize working status monitor after page detection
      setTimeout(() => {
        if (typeof this.initializeWorkingStatusMonitor === 'function') {
          this.initializeWorkingStatusMonitor();
        }
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
  // UTILITIES MANAGEMENT  
  // ===========================
  // This section has been extracted to utilities-manager.js
  // All utilities functionality is now provided via the UtilitiesManager mixin
  // See content_scripts/utilities-manager.js for implementation details

  // --- Communication Helper Methods ---
  // Safe message passing and error handling functions

  async safeSendMessage(message) {
    try {
      // Enhanced extension context validation
      if (!chrome?.runtime?.id) {
        console.warn('⚠️ Extension context lost - runtime ID not available');
        return { success: false, error: 'Extension context invalidated' };
      }
      
      if (!chrome?.runtime?.sendMessage) {
        console.warn('⚠️ Extension context lost - sendMessage not available');
        return { success: false, error: 'Extension context invalidated' };
      }
      
      // Check if extension is being reloaded
      try {
        // This will throw if extension context is invalid
        chrome.runtime.getURL('');
      } catch (contextError) {
        console.warn('⚠️ Extension context invalidated during runtime check');
        return { success: false, error: 'Extension context invalidated' };
      }
      
      // Only log if verbose mode is enabled
      if (this.verboseLogging) {
        console.log('🔍 LovableDetector: Sending message to background:', {
          action: message.action,
          dataId: message.data?.id,
          dataKeys: message.data ? Object.keys(message.data) : []
        });
      }
      
      // Set a timeout for the message to prevent hanging
      const messagePromise = chrome.runtime.sendMessage(message);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Message timeout after 10 seconds')), 10000);
      });
      
      const response = await Promise.race([messagePromise, timeoutPromise]);
      
      // Validate response structure
      if (response === undefined) {
        console.warn('⚠️ Received undefined response from background script');
        return { success: false, error: 'No response from background script' };
      }
      
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
      // Handle specific Chrome extension errors
      if (error.message?.includes('Extension context invalidated')) {
        console.warn('⚠️ Extension context invalidated during message send');
        return { success: false, error: 'Extension context invalidated' };
      }
      
      if (error.message?.includes('receiving end does not exist')) {
        console.warn('⚠️ Background script not available - extension may be reloading');
        return { success: false, error: 'Background script not available' };
      }
      
      if (error.message?.includes('message channel closed')) {
        console.warn('⚠️ Message channel closed - extension context lost');
        return { success: false, error: 'Extension context invalidated' };
      }
      
      if (error.message?.includes('Message timeout')) {
        console.warn('⚠️ Message timeout - background script may be busy');
        return { success: false, error: 'Background script timeout' };
      }
      
      // Log unexpected errors with more detail
      console.error('❌ Unexpected Chrome runtime error:', {
        message: error.message,
        stack: error.stack,
        action: message?.action
      });
      
      return { success: false, error: error.message || 'Unknown communication error' };
    }
  }
}

// ===========================
// INITIALIZATION
// ===========================
// Initializes the extension and makes it globally available
// This section starts the extension and sets up global access

// Initialize the detector
const lovableDetector = new LovableDetector();
window.lovableDetector = lovableDetector;

// Set up message listener for popup communication
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
