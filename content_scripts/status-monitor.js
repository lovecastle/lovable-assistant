// ===========================
// STATUS MONITOR - EXTRACTED MODULE
// ===========================
// This section handles working status monitoring and tab management functionality including:
// - Monitoring Lovable's working status (detecting stop buttons)
// - Tab renaming functionality with animated dots
// - Auto-switch functionality when work completes
// - Chrome extension message handling for status requests
// - Service worker communication for status monitoring
// - Working status detection using multiple strategies

// Create StatusMonitor class that will be mixed into LovableDetector
window.StatusMonitor = {
  initializeWorkingStatusMonitor() {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      console.warn('Extension context not available - skipping working status monitor');
      return;
    }
    
    // Initialize tab renaming state
    this.originalTitle = document.title;
    this.tabRenameInterval = null;
    this.currentDots = '';
    
    // Set up message listener for status requests from service worker
    try {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getWorkingStatus') {
          const isWorking = this.detectWorkingStatus();
          
          // Handle tab renaming if enabled
          if (localStorage.getItem('lovable-tab-rename') === 'true') {
            this.handleTabRename(isWorking);
          }
          
          sendResponse({ success: true, isWorking });
          return true;
        }
      });
      
      // Notify service worker to start monitoring this tab
      chrome.runtime.sendMessage({
        action: 'startWorkingStatusMonitor'
      }).catch(error => {
        if (error.message?.includes('Extension context invalidated')) {
          console.warn('Extension was reloaded - working status monitor unavailable until page refresh');
        } else {
          console.error('Failed to initialize working status monitor:', error);
        }
      });
    } catch (error) {
      console.warn('Could not set up working status monitor:', error);
    }
  },
  
  detectWorkingStatus() {
    // Check for stop button using multiple strategies
    // Strategy 1: Look for buttons with the NEW stop icon SVG path
    const newStopButtonPath = 'M240-300v-360q0-24.75 17.63-42.38Q275.25-720 300-720h360q24.75 0 42.38 17.62Q720-684.75 720-660v360q0 24.75-17.62 42.37Q684.75-240 660-240H300q-24.75 0-42.37-17.63Q240-275.25 240-300';
    const oldStopButtonPath = 'M360-330h240q12.75 0 21.38-8.63Q630-347.25 630-360v-240q0-12.75-8.62-21.38Q612.75-630 600-630H360q-12.75 0-21.37 8.62Q330-612.75 330-600v240q0 12.75 8.63 21.37Q347.25-330 360-330';
    
    // Check for new stop button path
    const newPathElements = document.querySelectorAll(`path[d*="${newStopButtonPath.substring(0, 50)}"]`);
    for (const path of newPathElements) {
      const button = path.closest('button');
      if (button) {
        const rect = button.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return true;
        }
      }
    }
    
    // Check for old stop button path (backward compatibility)
    const oldPathElements = document.querySelectorAll(`path[d*="${oldStopButtonPath.substring(0, 50)}"]`);
    for (const path of oldPathElements) {
      const button = path.closest('button');
      if (button) {
        const rect = button.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return true;
        }
      }
    }
    
    // Strategy 2: Look for buttons in the chat form area with square icon
    const formButtons = document.querySelectorAll('form button svg[viewBox*="-960 960 960"]');
    for (const svg of formButtons) {
      const button = svg.closest('button');
      if (button) {
        // Check if it's a small square button (typical stop button size)
        const rect = button.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.width <= 30 && rect.height <= 30) {
          // Check if the path contains either stop icon pattern
          const path = svg.querySelector('path');
          if (path) {
            const d = path.getAttribute('d');
            if (d && (d.includes('M240-300') || d.includes('M360-330'))) {
              return true;
            }
          }
        }
      }
    }
    
    // Strategy 3: Look for buttons with the new classes (size-6 rounded-full)
    const sizeButtons = document.querySelectorAll('button.size-6.rounded-full');
    for (const button of sizeButtons) {
      const svg = button.querySelector('svg[viewBox*="-960 960 960"]');
      if (svg) {
        const rect = button.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Additional check for stop icon path if needed
          const path = svg.querySelector('path');
          if (path && path.getAttribute('d')?.includes('M240-300')) {
            return true;
          }
        }
      }
    }
    
    // Strategy 4: XPath-based detection for both old and new button classes
    const xpathQueries = [
      '//form//button[contains(@class, "size-6") and contains(@class, "rounded-full") and .//svg[contains(@viewBox, "-960 960 960")]]',
      '//form//button[contains(@class, "h-6 w-6") and .//svg[contains(@viewBox, "-960 960 960")]]'
    ];
    
    for (const query of xpathQueries) {
      const xpathResult = document.evaluate(
        query,
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      
      for (let i = 0; i < xpathResult.snapshotLength; i++) {
        const button = xpathResult.snapshotItem(i);
        const rect = button.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return true;
        }
      }
    }
    
    return false;
  },
  
  handleTabRename(isWorking) {
    if (isWorking && !this.tabRenameInterval) {
      // Start animated dots
      this.tabRenameInterval = setInterval(() => {
        if (this.currentDots.length >= 3) {
          this.currentDots = '';
        } else {
          this.currentDots += '.';
        }
        document.title = `Working${this.currentDots}`;
      }, 500); // Update every 500ms
      
      // Set initial title
      document.title = 'Working';
    } else if (!isWorking && this.tabRenameInterval) {
      // Stop animation and restore original title
      clearInterval(this.tabRenameInterval);
      this.tabRenameInterval = null;
      this.currentDots = '';
      document.title = this.originalTitle || 'Lovable';
      
      // Handle auto-switch back if enabled
      if (localStorage.getItem('lovable-auto-switch') === 'true') {
        // Focus the window/tab
        window.focus();
        
        // Send message to service worker to activate this tab
        chrome.runtime.sendMessage({
          action: 'activateTab'
        }).catch(error => {
          console.warn('Could not activate tab:', error);
        });
      }
    }
  }
};