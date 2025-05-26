// Simplified Conversation Capture for Lovable.dev
class SimpleConversationCapture {
  constructor() {
    this.messageGroups = new Map(); // Store completed message groups
    this.pendingGroup = null; // Current group waiting for completion
    this.processedLovableIds = new Set(); // Track processed Lovable messages
    this.isMonitoring = false;
    this.chatObserver = null;
    this.verboseLogging = false;
    
    this.init();
  }

  init() {
    console.log('🚀 Simple Conversation Capture initialized');
    this.startMonitoring();
    
    // Process periodically
    setInterval(() => this.processPendingGroups(), 3000);
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('👀 Starting chat monitoring...');
    
    // Find and monitor chat container
    this.findAndSetupMonitoring();
    
    // Re-scan periodically in case chat loads later
    setInterval(() => {
      if (!this.chatObserver) {
        this.findAndSetupMonitoring();
      }
    }, 5000);
  }

  findAndSetupMonitoring() {
    // Find chat container
    const chatContainer = this.findChatContainer();
    if (!chatContainer) {
      if (this.verboseLogging) {
        console.log('⚠️ Chat container not found, will retry...');
      }
      return;
    }

    // Set up observer
    this.setupObserver(chatContainer);
    
    // Initial scan
    this.scanForNewGroups();
  }

  findChatContainer() {
    const selectors = [
      'div.h-full.w-full.overflow-y-auto.scrollbar-thin.scrollbar-track-transparent.scrollbar-thumb-muted-foreground',
      'div[class*="overflow-y-auto"][class*="h-full"]',
      'main div div div div.overflow-y-auto'
    ];

    for (const selector of selectors) {
      const containers = document.querySelectorAll(selector);
      for (const container of containers) {
        if (container.querySelector('.ChatMessageContainer[data-message-id]')) {
          if (this.verboseLogging) {
            console.log('✅ Found chat container');
          }
          return container;
        }
      }
    }

    // Fallback: find any container with ChatMessageContainer children
    const messageContainers = document.querySelectorAll('.ChatMessageContainer[data-message-id]');
    if (messageContainers.length > 0) {
      let container = messageContainers[0].parentElement;
      while (container && !container.matches('div[class*="overflow-y-auto"]')) {
        container = container.parentElement;
      }
      return container || document.body;
    }

    return null;
  }

  setupObserver(container) {
    if (this.chatObserver) {
      this.chatObserver.disconnect();
    }

    this.chatObserver = new MutationObserver(() => {
      // Debounce scanning
      clearTimeout(this.scanTimeout);
      this.scanTimeout = setTimeout(() => {
        this.scanForNewGroups();
      }, 1000);
    });

    this.chatObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-message-id']
    });

    if (this.verboseLogging) {
      console.log('👀 Chat observer set up');
    }
  }

  scanForNewGroups() {
    if (this.verboseLogging) {
      console.log('🔍 Scanning for new message groups...');
    }

    // Find all Lovable messages (aimsg_*) in DOM order
    const lovableMessages = Array.from(document.querySelectorAll('[data-message-id^="aimsg_"]'))
      .sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.top - rectB.top;
      });

    if (this.verboseLogging) {
      console.log(`📊 Found ${lovableMessages.length} Lovable messages in DOM`);
    }

    let newGroupsFound = 0;

    lovableMessages.forEach((lovableElement, index) => {
      const lovableId = lovableElement.getAttribute('data-message-id');
      
      if (this.verboseLogging) {
        console.log(`\n🔍 Processing Lovable message ${index + 1}/${lovableMessages.length}: ${lovableId}`);
      }
      
      // Skip if already processed
      if (this.processedLovableIds.has(lovableId)) {
        if (this.verboseLogging) {
          console.log(`⏭️ Already processed: ${lovableId}`);
        }
        return;
      }

      // Extract Lovable response content
      const lovableContent = this.extractContent(lovableElement);
      if (!lovableContent) {
        if (this.verboseLogging) {
          console.log(`⚠️ No content found for Lovable message: ${lovableId}`);
        }
        return;
      }

      if (this.verboseLogging) {
        console.log(`📝 Lovable content (${lovableContent.length} chars): "${lovableContent.substring(0, 100)}..."`);
      }

      // Find the user message that comes before this Lovable response
      const userElement = this.findPrecedingUserMessage(lovableElement);
      if (!userElement) {
        if (this.verboseLogging) {
          console.log(`⚠️ No user message found before Lovable: ${lovableId}`);
        }
        return;
      }

      const userId = userElement.getAttribute('data-message-id');
      const userContent = this.extractContent(userElement);
      if (!userContent) {
        if (this.verboseLogging) {
          console.log(`⚠️ No content found for user message: ${userId}`);
        }
        return;
      }

      if (this.verboseLogging) {
        console.log(`📝 User content (${userContent.length} chars): "${userContent.substring(0, 100)}..."`);
      }

      // Check if we should ignore this group
      if (this.shouldIgnoreGroup(userContent, lovableContent)) {
        console.log(`🚫 Ignoring message group: ${userId} -> ${lovableId}`);
        this.processedLovableIds.add(lovableId);
        return;
      }

      // Create message group
      const messageGroup = {
        id: `group_${lovableId}`,
        userId: userId,
        lovableId: lovableId,
        userContent: userContent.trim(),
        lovableContent: lovableContent.trim(),
        timestamp: this.extractTimestamp(lovableElement),
        categories: this.categorizeUserMessage(userContent),
        projectId: this.extractProjectId(),
        createdAt: new Date().toISOString()
      };

      // If we have a pending group, save it (previous group is now complete)
      if (this.pendingGroup) {
        if (this.verboseLogging) {
          console.log(`💾 Saving previous pending group: ${this.pendingGroup.id}`);
        }
        this.saveCompletedGroup(this.pendingGroup);
      }

      // Set this as the new pending group
      this.pendingGroup = messageGroup;
      this.processedLovableIds.add(lovableId);
      newGroupsFound++;

      console.log(`✅ New message group pending: [${userId.substring(0, 15)}...] -> [${lovableId.substring(0, 15)}...]`);
    });

    if (newGroupsFound > 0) {
      console.log(`📊 Found ${newGroupsFound} new message groups`);
    }
  }

  findPrecedingUserMessage(lovableElement) {
    // Get all message containers in DOM order
    const allMessages = Array.from(document.querySelectorAll('.ChatMessageContainer[data-message-id]'))
      .sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.top - rectB.top;
      });

    // Find the index of the Lovable message
    const lovableIndex = allMessages.indexOf(lovableElement);
    if (lovableIndex <= 0) {
      return null;
    }

    // Return the message immediately before it (should be user message)
    return allMessages[lovableIndex - 1];
  }

  extractContent(element) {
    // Enhanced content extraction with better filtering
    const clone = element.cloneNode(true);
    
    // Remove specific UI elements that shouldn't be part of content
    const uiSelectors = [
      'svg', 
      'button[aria-haspopup]', 
      '.opacity-0', 
      '[class*="icon"]',
      'button[data-state]', // Remove dropdown buttons
      '.shrink-0', // Remove icon containers
      '[viewBox]' // Remove SVG elements
    ];
    
    uiSelectors.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // For Lovable messages, focus on prose content first
    if (element.getAttribute('data-message-id')?.startsWith('aimsg_')) {
      const proseElements = clone.querySelectorAll('.prose, .prose-markdown, [class*="prose"]');
      if (proseElements.length > 0) {
        let proseContent = '';
        proseElements.forEach(prose => {
          const text = prose.textContent?.trim();
          if (text && text.length > 10) {
            proseContent += text + ' ';
          }
        });
        
        if (proseContent.trim()) {
          if (this.verboseLogging) {
            console.log(`✅ Extracted Lovable prose content: "${proseContent.substring(0, 100)}..."`);
          }
          return proseContent.trim();
        }
      }
    }
    
    // For user messages or fallback, get all text content
    let content = '';
    const walker = document.createTreeWalker(
      clone,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip text inside buttons unless it's main content
          const parent = node.parentElement;
          if (parent?.tagName === 'BUTTON' && 
              !parent.textContent?.includes('Enable Crop') &&
              !parent.textContent?.includes('Cancel Crop') &&
              !parent.textContent?.includes('Crop Image')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      content += node.textContent + ' ';
    }
    
    const finalContent = content.replace(/\s+/g, ' ').trim();
    
    if (this.verboseLogging) {
      console.log(`📝 Extracted content (${finalContent.length} chars): "${finalContent.substring(0, 100)}..."`);
    }
    
    return finalContent;
  }

  extractTimestamp(lovableElement) {
    // Look for timestamp in Lovable message header
    const timestampElement = lovableElement.querySelector('.text-muted-foreground, [class*="text-muted"]');
    if (timestampElement && timestampElement.textContent.includes('on')) {
      const timestampText = timestampElement.textContent.trim();
      const match = timestampText.match(/(\d{1,2}:\d{2})\s+on\s+(.+)/);
      if (match) {
        try {
          const [, time, date] = match;
          return new Date(`${date} ${time}`).toISOString();
        } catch (e) {
          // Fallback to current time
        }
      }
    }
    return new Date().toISOString();
  }

  shouldIgnoreGroup(userContent, lovableContent) {
    // Rule 1: Ignore if user prompt starts with error report
    if (userContent.trim().startsWith('For the code present, I get the error below')) {
      if (this.verboseLogging) {
        console.log('🚫 Ignoring: User message starts with error report');
      }
      return true;
    }

    // Rule 2: Ignore if Lovable response starts with refactoring
    // Be more specific - only check the actual response text, not button text
    const lovableMainContent = lovableContent.trim();
    if (userContent.trim().startsWith('Refactor')) {
      if (this.verboseLogging) {
        console.log('🚫 Ignoring: User message starts with refactoring');
      }
      return true;
    }

    return false;
  }

  categorizeUserMessage(userContent) {
    const content = userContent.toLowerCase();
    const categories = { primary: [], secondary: [] };

    // Simple categorization
    if (content.includes('debug') || content.includes('error') || content.includes('fix') || content.includes('bug')) {
      categories.primary.push('Debugging');
    } else if (content.includes('design') || content.includes('style') || content.includes('color') || content.includes('ui')) {
      categories.primary.push('Designing');
    } else if (content.includes('plan') || content.includes('structure') || content.includes('architecture')) {
      categories.primary.push('Planning');
    } else {
      categories.primary.push('Functioning');
    }

    return categories;
  }

  extractProjectId() {
    const url = window.location.href;
    const match = url.match(/\/projects\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  processPendingGroups() {
    // This is called periodically to handle any remaining pending groups
    // In most cases, groups are saved when a new group is detected
    // This handles edge cases like page navigation or long pauses
  }

  saveCompletedGroup(group) {
    console.log(`💾 Auto-capture: Saving completed message group: ${group.id}`);
    
    // Store locally
    this.messageGroups.set(group.id, group);
    
    // Save to database via background script
    this.saveToDatabaseAsync(group);

    // Notify UI components
    this.notifyUI(group);
  }

  async saveToDatabaseAsync(group) {
    try {
      console.log(`🔍 Auto-capture: Saving to database:`, {
        groupId: group.id,
        lovableId: group.lovableId,
        userContentLength: group.userContent?.length || 0,
        lovableContentLength: group.lovableContent?.length || 0
      });

      // Convert group to conversation format with proper lovableId checking
      const conversationData = {
        id: this.generateUUID(),
        projectId: group.projectId,
        userMessage: group.userContent || '',
        lovableResponse: group.lovableContent || '',
        timestamp: group.timestamp || new Date().toISOString(),
        projectContext: {
          messageGroupId: group.id,
          userId: group.userId,
          lovableId: group.lovableId, // Store lovableId for duplicate detection
          autoCapture: true
        },
        categories: group.categories ? [
          ...(group.categories.primary || []),
          ...(group.categories.secondary || [])
        ] : []
      };

      const response = await this.safeSendMessage({
        action: 'saveConversation', // Use saveConversation directly for better duplicate checking
        data: conversationData
      });

      if (response?.success) {
        if (response.skipped) {
          console.log(`⚠️ Auto-capture: Skipped duplicate group ${group.id} (lovableId: ${group.lovableId})`);
        } else {
          console.log(`✅ Auto-capture: Successfully saved group ${group.id} to database`);
        }
      } else {
        console.warn(`⚠️ Auto-capture: Failed to save group ${group.id}:`, response?.error);
      }
    } catch (error) {
      console.error(`❌ Auto-capture: Error saving group ${group.id}:`, error);
    }
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async safeSendMessage(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      if (this.verboseLogging && !error.message.includes('Extension context invalidated')) {
        console.warn('⚠️ Background communication failed:', error);
      }
      return { success: false, error: error.message };
    }
  }

  notifyUI(group) {
    // Notify Development History
    if (window.lovableDetector && window.lovableDetector.addDetectedMessage) {
      // Convert group format to expected message format
      const userMessage = {
        id: group.userId,
        content: group.userContent,
        speaker: 'user',
        timestamp: group.timestamp,
        categories: group.categories,
        projectId: group.projectId
      };

      const lovableMessage = {
        id: group.lovableId,
        content: group.lovableContent,
        speaker: 'lovable',
        timestamp: group.timestamp,
        categories: group.categories,
        projectId: group.projectId
      };

      window.lovableDetector.addDetectedMessage(userMessage);
      window.lovableDetector.addDetectedMessage(lovableMessage);
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('lovable-message-group-captured', {
      detail: group
    }));
  }

  // Essential production methods only
  setVerbose(enabled) {
    this.verboseLogging = enabled;
    console.log(`🔊 Verbose logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  getStats() {
    return {
      totalGroups: this.messageGroups.size,
      pendingGroup: this.pendingGroup ? this.pendingGroup.id : null,
      processedLovableIds: this.processedLovableIds.size,
      isMonitoring: this.isMonitoring
    };
  }

  restart() {
    console.log('🔄 Restarting capture...');
    if (this.chatObserver) {
      this.chatObserver.disconnect();
      this.chatObserver = null;
    }
    this.isMonitoring = false;
    setTimeout(() => {
      this.startMonitoring();
    }, 1000);
  }

  destroy() {
    console.log('🧹 Cleaning up capture...');
    if (this.chatObserver) {
      this.chatObserver.disconnect();
    }
    this.isMonitoring = false;
    clearTimeout(this.scanTimeout);
  }
}

// Initialize the simple capture system
const simpleConversationCapture = new SimpleConversationCapture();

// Make it globally accessible
window.simpleConversationCapture = simpleConversationCapture;

// Create compatibility layer for old system references
window.conversationCapture = {
  // Redirect to new system methods
  setVerbose: (enabled) => {
    return window.simpleConversationCapture.setVerbose(enabled);
  },
  
  scanForNewLovableMessages: () => {
    return window.simpleConversationCapture.scanForNewGroups();
  },
  
  restart: () => {
    return window.simpleConversationCapture.restart();
  },
  
  // Legacy properties for compatibility
  get detectedMessages() {
    // Convert message groups back to individual messages
    const messages = [];
    if (window.simpleConversationCapture.messageGroups) {
      for (const group of window.simpleConversationCapture.messageGroups.values()) {
        messages.push({
          id: group.userId,
          content: group.userContent,
          speaker: 'user',
          timestamp: group.timestamp,
          categories: group.categories
        });
        messages.push({
          id: group.lovableId,
          content: group.lovableContent,
          speaker: 'lovable',
          timestamp: group.timestamp,
          categories: group.categories
        });
      }
    }
    return messages;
  },
  
  get processedMessageIds() {
    return new Set(); // Return empty set for compatibility
  }
};

console.log('✅ Lovable.dev Simple Conversation Capture ready');
