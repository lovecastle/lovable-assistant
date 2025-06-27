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
    this.contextLossHandled = false; // Track if context loss has been handled
    this.projectChecked = false; // Track if project ownership has been checked
    this.isProjectOwned = false; // Track if current project is owned by user
    
    // Mix in UI Dialog Manager methods
    if (window.UIDialogManager) {
      Object.assign(this, window.UIDialogManager);
    }
    
    // Mix in Project Manager methods
    if (window.ProjectManager) {
      Object.assign(this, window.ProjectManager);
    }
    
    // Mix in Chat Interface methods (for prompt enhancement)
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
    
    // Setup prompt enhancement (CMD+Enter functionality)
    if (typeof this.setupPromptEnhancement === 'function') {
      this.setupPromptEnhancement();
    }
    
    // Note: Auto-expansion removed - Lovable now handles this natively
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
      
      // Note: Ready notification will be shown after project ownership is confirmed
      
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
      
      // Check project ownership after page URL is confirmed
      const checkProjectWhenReady = () => {
        // Only check once
        if (this.projectChecked) {
          return;
        }
        
        // Only check ownership, don't auto-save yet
        if (typeof this.isUserOwnedProject === 'function') {
          this.isUserOwnedProject().then(isOwned => {
            this.projectChecked = true;
            this.isProjectOwned = isOwned;
            
            // Only auto-save after ownership is confirmed
            if (isOwned && typeof this.autoSaveProjectInfo === 'function') {
              this.autoSaveProjectInfo();
            }
          });
        }
      };
      
      // Start checking immediately after page detection
      checkProjectWhenReady();
      
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
        
        // Reset project checked flag for new project
        this.projectChecked = false;
        
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
        console.info('ℹ️ Extension context lost - runtime ID not available. This is normal after extension updates.');
        this.handleExtensionContextLoss();
        return { success: false, error: 'Extension context invalidated' };
      }
      
      if (!chrome?.runtime?.sendMessage) {
        console.info('ℹ️ Extension context lost - sendMessage not available. This is normal after extension updates.');
        this.handleExtensionContextLoss();
        return { success: false, error: 'Extension context invalidated' };
      }
      
      // Check if extension is being reloaded
      try {
        // This will throw if extension context is invalid
        chrome.runtime.getURL('');
      } catch (contextError) {
        console.info('ℹ️ Extension context invalidated during runtime check. This is normal after extension updates.');
        this.handleExtensionContextLoss();
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
      // Use longer timeout for AI requests
      const isAIRequest = message.action === 'callAI';
      const timeoutDuration = isAIRequest ? 60000 : 10000; // 60 seconds for AI, 10 seconds for others
      
      const messagePromise = chrome.runtime.sendMessage(message);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Message timeout after ${timeoutDuration/1000} seconds`)), timeoutDuration);
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
        console.info('ℹ️ Extension context invalidated during message send. This is normal after extension updates.');
        this.handleExtensionContextLoss();
        return { success: false, error: 'Extension context invalidated' };
      }
      
      if (error.message?.includes('receiving end does not exist')) {
        console.info('ℹ️ Background script not available - extension may be reloading. This is normal after extension updates.');
        this.handleExtensionContextLoss();
        return { success: false, error: 'Background script not available' };
      }
      
      if (error.message?.includes('message channel closed')) {
        console.info('ℹ️ Message channel closed - extension context lost. This is normal after extension updates.');
        this.handleExtensionContextLoss();
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

  handleExtensionContextLoss() {
    // Only run this once to avoid multiple reloads
    if (this.contextLossHandled) return;
    this.contextLossHandled = true;

    console.info('🔄 Extension context lost. This usually happens after extension updates or browser restarts.');
    console.info('💡 Tip: Refresh the page to restore full extension functionality.');
    
    // Show a non-intrusive notification to the user
    this.showContextLossNotification();
  }

  showContextLossNotification() {
    // Only show if we're on a Lovable page
    if (!this.isLovablePage) return;

    // Check if notification already exists
    if (document.getElementById('extension-context-loss-notification')) return;

    const notification = document.createElement('div');
    notification.id = 'extension-context-loss-notification';
    notification.innerHTML = `
      <div style="
        position: fixed; top: 20px; right: 20px; z-index: 999999;
        background: #1a202c; color: white; border: 1px solid #4a5568;
        border-radius: 8px; padding: 16px; max-width: 350px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: system-ui, sans-serif;
      ">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="font-size: 18px;">🔄</div>
          <div style="font-weight: 600; font-size: 14px;">Extension Updated</div>
          <button id="close-context-notification" style="
            margin-left: auto; background: none; border: none; color: #a0aec0;
            cursor: pointer; font-size: 18px; padding: 0;
          ">×</button>
        </div>
        <div style="font-size: 13px; line-height: 1.4; margin-bottom: 12px;">
          The Lovable Assistant extension was updated. Refresh the page to restore full functionality.
        </div>
        <button id="refresh-page-btn" style="
          background: #667eea; color: white; border: none; padding: 8px 16px;
          border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
        ">Refresh Page</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Add event listeners
    document.getElementById('close-context-notification')?.addEventListener('click', () => {
      notification.remove();
    });

    document.getElementById('refresh-page-btn')?.addEventListener('click', () => {
      window.location.reload();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
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
