// ===========================
// LOVABLE DETECTOR - REFACTORED FOR MAINTAINABILITY
// ===========================
// This file is organized into focused sections for better maintainability
// while keeping all functionality intact and Chrome extension compatibility

console.log('🚀 Lovable Assistant: Loading refactored detector...');

// ===========================
// MAIN DETECTOR CLASS
// ===========================
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
      this.projectId = LovableHelpers.extractProjectId(url);
      
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