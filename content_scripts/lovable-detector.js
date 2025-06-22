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
    this.setupUrlChangeDetection();
    
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
      
      // Check project info after page is fully loaded AND chat interface is ready
      // This ensures all elements are rendered before checking
      const checkProjectWhenReady = () => {
        // Wait for chat interface to be fully loaded
        const waitForChatInterface = setInterval(() => {
          // Check if either the send button or form exists
          const hasChat = document.querySelector('form') || 
                         document.getElementById('chatinput-send-message-button') ||
                         document.querySelector('button[type="submit"]') ||
                         document.querySelector('textarea') ||
                         document.querySelector('input[type="text"]');
          
          // Also check if the page has the lock icon (which loads early)
          const hasLockIcon = document.evaluate(
            '/html/body/div[1]/div/div[2]/nav/div[1]/div/div/div[1]/div[1]/button/svg[2]',
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          
          // If we found either chat elements or lock icon, the page is ready
          if (hasChat || hasLockIcon) {
            clearInterval(waitForChatInterface);
            console.log('📋 Page elements loaded, checking project ownership...');
            
            if (typeof this.autoSaveProjectInfo === 'function') {
              this.autoSaveProjectInfo();
            }
          }
        }, 500); // Check every 500ms
        
        // Maximum wait time of 10 seconds
        setTimeout(() => {
          clearInterval(waitForChatInterface);
          console.log('⏱️ Timeout waiting for page elements, checking anyway...');
          if (typeof this.autoSaveProjectInfo === 'function') {
            this.autoSaveProjectInfo();
          }
        }, 10000);
      };
      
      // Start checking after a small initial delay
      setTimeout(checkProjectWhenReady, 2000);
      
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

  setupUrlChangeDetection() {
    // Store current URL and project ID
    this.currentUrl = window.location.href;
    this.currentProjectId = this.projectId;
    
    // Monitor URL changes (for SPA navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    const handleUrlChange = () => {
      const newUrl = window.location.href;
      if (newUrl !== this.currentUrl) {
        console.log('🔄 URL changed, checking for project switch...');
        this.handleProjectSwitch(newUrl);
      }
    };
    
    // Override pushState and replaceState
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleUrlChange, 100);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleUrlChange, 100);
    };
    
    // Also listen for popstate (back/forward buttons)
    window.addEventListener('popstate', () => {
      setTimeout(handleUrlChange, 100);
    });
    
    // Periodic check as fallback (every 2 seconds)
    setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== this.currentUrl) {
        this.handleProjectSwitch(currentUrl);
      }
    }, 2000);
  }

  handleProjectSwitch(newUrl) {
    this.currentUrl = newUrl;
    
    // Extract new project ID
    const isProjectPage = newUrl.includes('lovable.dev/projects/');
    if (isProjectPage) {
      const match = newUrl.match(/\/projects\/([^\/\?]+)/);
      const newProjectId = match ? match[1] : null;
      
      if (newProjectId && newProjectId !== this.currentProjectId) {
        console.log('🔄 Project switched from', this.currentProjectId, 'to', newProjectId);
        
        this.currentProjectId = newProjectId;
        this.projectId = newProjectId;
        
        // Refresh project-specific data in the dialog if it's open
        if (this.assistantDialog && document.body.contains(this.assistantDialog)) {
          this.refreshProjectData();
        }
        
        // Reset conversation capture for the new project
        if (window.simpleConversationCapture) {
          console.log('🔄 Resetting conversation capture for new project...');
          window.simpleConversationCapture.waitingForOwnershipConfirmation = true;
          window.simpleConversationCapture.isMonitoring = false;
          if (window.simpleConversationCapture.chatObserver) {
            window.simpleConversationCapture.chatObserver.disconnect();
            window.simpleConversationCapture.chatObserver = null;
          }
        }
        
        // Auto-save new project info (which will restart conversation capture if project is owned)
        setTimeout(() => {
          if (typeof this.autoSaveProjectInfo === 'function') {
            console.log('📝 Auto-saving new project info...');
            this.autoSaveProjectInfo();
          }
        }, 1000);
      }
    }
  }

  refreshProjectData() {
    console.log('🔄 Refreshing project-specific data for project:', this.projectId);
    
    // Refresh conversation history if the conversation history tab is currently open
    if (typeof this.loadHistoryMessages === 'function') {
      // Check if conversation history is currently visible
      const dialogTitle = document.getElementById('dialog-title');
      if (dialogTitle && dialogTitle.textContent.includes('Chat History')) {
        console.log('🔄 Refreshing conversation history for new project...');
        this.loadHistoryMessages();
      }
    }
    
    // Refresh project information in utilities if utilities is currently open
    if (typeof this.autoSaveProjectInfo === 'function') {
      // Check if utilities/project manager is currently visible
      const dialogTitle = document.getElementById('dialog-title');
      if (dialogTitle && (dialogTitle.textContent.includes('Utilities') || dialogTitle.textContent.includes('Project Manager'))) {
        console.log('🔄 Refreshing project info for new project...');
        this.autoSaveProjectInfo();
      }
    }
    
    // Update project title in dialog if visible
    this.updateProjectTitle();
  }

  updateProjectTitle() {
    // Update any project-specific titles or info displayed in the dialog
    const titleElements = document.querySelectorAll('.project-title, .current-project');
    titleElements.forEach(element => {
      if (element.textContent.includes(this.currentProjectId)) {
        element.textContent = element.textContent.replace(this.currentProjectId, this.projectId);
      }
    });
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

  /**
   * SAFE SEND MESSAGE WITH RETRY
   * 
   * Enhanced version of safeSendMessage with automatic retry for extension context errors.
   * Provides better reliability for database operations that might fail due to extension reloads.
   */
  async safeSendMessageWithRetry(message, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add progressive delay for retries
        if (attempt > 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 2), 5000); // Exponential backoff, max 5s
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for message: ${message.action}`);
        }
        
        const response = await this.safeSendMessage(message);
        
        // If successful, return immediately
        if (response?.success) {
          if (attempt > 1) {
            console.log(`✅ Message succeeded on retry attempt ${attempt}/${maxRetries}`);
          }
          return response;
        }
        
        // Check if error is worth retrying
        const isRetryableError = response?.error?.includes('Extension context invalidated') ||
                                response?.error?.includes('Background script not available') ||
                                response?.error?.includes('runtime ID not available') ||
                                response?.error?.includes('Message timeout') ||
                                response?.error?.includes('message channel closed');
        
        if (!isRetryableError) {
          // Not a retry-worthy error, return immediately
          console.warn(`⚠️ Non-retryable error for ${message.action}:`, response?.error);
          return response;
        }
        
        if (attempt === maxRetries) {
          console.warn(`⚠️ Failed ${message.action} after ${maxRetries} attempts: ${response?.error}`);
          
          // Show user notification for persistent extension context issues
          if (typeof this.showExtensionContextError === 'function') {
            this.showExtensionContextError();
          }
          
          return {
            ...response,
            error: `${response?.error} (after ${maxRetries} retries)`
          };
        }
        
        // Log retry reason
        console.warn(`⚠️ Retrying ${message.action} (attempt ${attempt}/${maxRetries}): ${response?.error}`);
        
      } catch (error) {
        const isRetryableError = error.message?.includes('Extension context invalidated') ||
                                error.message?.includes('Background script not available') ||
                                error.message?.includes('runtime ID not available') ||
                                error.message?.includes('Message timeout') ||
                                error.message?.includes('message channel closed');
        
        if (!isRetryableError || attempt === maxRetries) {
          console.error(`❌ Final error for ${message.action} after ${attempt}/${maxRetries} attempts:`, error);
          
          // Show user notification for persistent extension context issues
          if (isRetryableError && attempt === maxRetries && typeof this.showExtensionContextError === 'function') {
            this.showExtensionContextError();
          }
          
          return { success: false, error: error.message || 'Unknown error' };
        }
        
        console.warn(`⚠️ Exception on attempt ${attempt}/${maxRetries} for ${message.action}:`, error.message);
      }
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
