// ===========================
// LOVABLE.DEV ASSISTANT - MAIN DETECTOR
// ===========================
// Organized into focused sections for better maintainability
// Each section has a clear responsibility and purpose
// 
// FILE ORGANIZATION (MODULAR STRUCTURE):
// 1. Core Detector Class (lines ~25-140) - Page detection, initialization, keyboard shortcuts
// 2. UI Dialog Management - EXTRACTED to content_scripts/ui-dialog-manager.js
// 3. Project Manager - EXTRACTED to content_scripts/project-manager.js
// 4. Chat Interface - EXTRACTED to content_scripts/chat-interface.js
// 5. Conversation History - EXTRACTED to content_scripts/conversation-history.js
// 6. Utilities Management - EXTRACTED to content_scripts/utilities-manager.js
// 7. Working Status Monitor - EXTRACTED to content_scripts/status-monitor.js
// 8. Message Scraper - EXTRACTED to content_scripts/message-scraper.js
// 9. Helper Methods (lines ~220-580) - Communication and utility functions
// 10. Initialization (lines ~580+) - Global setup and extension startup
//
// All extracted modules are mixed into the main class via Object.assign() in the constructor.
// This modular approach reduces the main file from ~5850 lines to ~600 lines while maintaining all functionality.
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
  // *** EXTRACTED TO EXTERNAL MODULE ***
  // 
  // All Chat Interface functionality has been moved to:
  // content_scripts/chat-interface.js
  // 
  // Methods available through Object.assign() mixin in constructor:
  // - showChatInterface() - Display the AI chat interface with project context
  // - showSettingsPage() - Display settings page with AI provider and database configuration
  // - setupPromptEnhancement() - Enable Ctrl+Enter shortcuts for prompt enhancement
  // - showPromptEnhancementMenu() - Display prompt helper menu with templates
  // - translatePrompt() - AI-powered prompt translation
  // - rewritePrompt() - AI-powered prompt grammar and style correction
  // - enhancePromptWithHandbook() - AI-powered prompt enhancement using Lovable best practices
  // - setupInputAutoExpansion() - Auto-expand textarea inputs
  // - All helper methods for AI integration and prompt processing
  // 
  // This refactoring reduces main file size while keeping all functionality intact.

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
