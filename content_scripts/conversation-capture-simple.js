// Simplified Conversation Capture for Lovable.dev
class SimpleConversationCapture {
  constructor() {
    this.messageGroups = new Map(); // Store completed message groups
    this.pendingGroup = null; // Current group waiting for completion
    this.processedLovableIds = new Set(); // Track processed Lovable messages
    this.isMonitoring = false;
    this.chatObserver = null;
    this.verboseLogging = false;
    this.waitingForAuthentication = false; // Track authentication status
    
    this.init();
  }

  async init() {
    // Set flags to wait for ownership confirmation
    this.waitingForOwnershipConfirmation = true;
    this.waitingForAuthentication = true;
    
    // Process periodically (but only if monitoring has started)
    setInterval(() => {
      if (this.isMonitoring) {
        this.processPendingGroups();
      }
    }, 3000);
  }

  // Method to start monitoring after project ownership is confirmed
  async startMonitoringAfterOwnershipConfirmed(projectId) {
    if (this.isMonitoring) return;
    
    console.log('✅ Project ownership confirmed for project:', projectId);
    this.projectId = projectId; // Store the confirmed project ID
    this.waitingForOwnershipConfirmation = false;
    
    // NOW check authentication AFTER ownership is confirmed
    try {
      const response = await this.safeSendMessage({ action: 'checkAuth' });
      
      if (!response?.success || !response.data?.isAuthenticated) {
        console.log('🔒 User not authenticated - conversation capture will not start');
        this.waitingForAuthentication = true;
        return;
      }
      
      console.log('✅ User authenticated - starting conversation capture');
      this.waitingForAuthentication = false;
    } catch (error) {
      console.log('⚠️ Could not verify authentication - conversation capture will not start');
      this.waitingForAuthentication = true;
      return;
    }
    
    // Both ownership and authentication confirmed - start monitoring
    console.log('🚀 Starting conversation capture for project:', projectId);
    this.startMonitoring();
  }

  // Method to stop monitoring when project ownership is not confirmed
  stopMonitoringDueToOwnership(reason = 'Project ownership not confirmed') {
    console.log('🚫 Stopping conversation capture:', reason);
    this.waitingForOwnershipConfirmation = true;
    this.isMonitoring = false;
    
    if (this.chatObserver) {
      this.chatObserver.disconnect();
      this.chatObserver = null;
    }
    
    // Clear any pending groups for non-owned projects
    this.pendingGroup = null;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    if (this.waitingForAuthentication) {
      console.log('🔒 Conversation capture is waiting for user authentication...');
      return;
    }
    
    if (this.waitingForOwnershipConfirmation) {
      console.log('⏳ Conversation capture is waiting for project ownership confirmation...');
      return;
    }
    
    this.isMonitoring = true;
    console.log('🚀 Starting conversation monitoring...');
    
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
    // Try the specific XPath first for exact matching
    try {
      const xpathResult = document.evaluate(
        '/html/body/div[1]/div/div[2]/main/div/div/div[1]/div/div[1]/div[1]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      
      if (xpathResult.singleNodeValue) {
        if (this.verboseLogging) {
          console.log('✅ Found chat container using XPath');
        }
        return xpathResult.singleNodeValue;
      }
    } catch (e) {
      if (this.verboseLogging) {
        console.log('⚠️ XPath evaluation failed:', e);
      }
    }

    // Try to find by message containers (more resilient to structure changes)
    const messageContainers = document.querySelectorAll('[data-message-id^="umsg_"], [data-message-id^="aimsg_"], .ChatMessageContainer[data-message-id]');
    if (messageContainers.length > 0) {
      // Find common scrollable parent
      let container = messageContainers[0];
      let scrollableParent = null;
      
      // Traverse up to find scrollable container
      while (container && container.parentElement) {
        const style = window.getComputedStyle(container.parentElement);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          scrollableParent = container.parentElement;
          break;
        }
        container = container.parentElement;
      }
      
      if (scrollableParent) {
        if (this.verboseLogging) {
          console.log('✅ Found chat container via message containers');
        }
        return scrollableParent;
      }
      
      // Find closest common parent for all message containers
      if (messageContainers.length > 1) {
        const parent = this.findCommonAncestor(Array.from(messageContainers));
        if (parent) {
          if (this.verboseLogging) {
            console.log('✅ Found chat container via common ancestor');
          }
          return parent;
        }
      }
    }

    // Legacy and extended selectors as fallback
    const selectors = [
      'div.h-full.w-full.overflow-y-auto.scrollbar-thin.scrollbar-track-transparent.scrollbar-thumb-muted-foreground',
      'div[class*="overflow-y-auto"][class*="h-full"]',
      'main div div div div.overflow-y-auto',
      // New selectors based on observed structure
      'div[style*="overflow-anchor"]',
      'div[style*="visibility: visible"]',
      'main div[class*="flex"] div[class*="overflow"]',
      'div[style*="overflow"]',
      '.group-container > div'
    ];

    for (const selector of selectors) {
      try {
        const containers = document.querySelectorAll(selector);
        for (const container of containers) {
          const hasMessages = container.querySelector('[data-message-id^="umsg_"]') || 
                              container.querySelector('[data-message-id^="aimsg_"]') ||
                              container.querySelector('.ChatMessageContainer[data-message-id]');
          
          if (hasMessages) {
            if (this.verboseLogging) {
              console.log(`✅ Found chat container using selector: ${selector}`);
            }
            return container;
          }
        }
      } catch (e) {
        if (this.verboseLogging) {
          console.log(`⚠️ Error with selector ${selector}:`, e);
        }
      }
    }

    // Deep DOM scan as last resort
    if (this.verboseLogging) {
      console.log('⚠️ Using deep DOM scan to find chat container');
    }
    return this.findContainerDeepScan();
  }
  
  // Helper method for deep scanning
  findContainerDeepScan() {
    // Find any element containing message IDs
    const allElements = document.querySelectorAll('*');
    const potentialContainers = [];
    
    for (const el of allElements) {
      if (el.querySelectorAll('[data-message-id]').length > 1) {
        potentialContainers.push({
          element: el,
          messageCount: el.querySelectorAll('[data-message-id]').length,
          isScrollable: this.isScrollable(el)
        });
      }
    }
    
    // Sort by most likely (scrollable with most messages)
    potentialContainers.sort((a, b) => {
      // Prioritize scrollable elements
      if (a.isScrollable && !b.isScrollable) return -1;
      if (!a.isScrollable && b.isScrollable) return 1;
      // Then by message count
      return b.messageCount - a.messageCount;
    });
    
    return potentialContainers.length > 0 ? potentialContainers[0].element : document.body;
  }
  
  isScrollable(element) {
    const style = window.getComputedStyle(element);
    return style.overflowY === 'scroll' || 
           style.overflowY === 'auto' || 
           element.scrollHeight > element.clientHeight;
  }
  
  findCommonAncestor(elements) {
    if (!elements.length) return null;
    if (elements.length === 1) return elements[0].parentElement;
    
    let ancestor = elements[0].parentElement;
    while (ancestor) {
      let isCommon = true;
      for (let i = 1; i < elements.length; i++) {
        if (!ancestor.contains(elements[i])) {
          isCommon = false;
          break;
        }
      }
      if (isCommon) return ancestor;
      ancestor = ancestor.parentElement;
    }
    
    return document.body;
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

    // Find all message elements in DOM order
    // Include both prefix style IDs (aimsg_*) and UUID style IDs
    const allMessages = Array.from(document.querySelectorAll('[data-message-id]'))
      .sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.top - rectB.top;
      });
      
    // Separate user and lovable messages
    const lovableMessages = allMessages.filter(el => {
      const messageId = el.getAttribute('data-message-id');
      // Lovable message can be identified by aimsg_ prefix or by checking for prose content
      return messageId.startsWith('aimsg_') || 
             (el.querySelector('.prose, .prose-markdown, [class*="prose"]') !== null && 
              !this.isUuidUserMessage(el));
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
      const userElement = this.findPrecedingUserMessage(lovableElement, allMessages);
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
  
  // Helper function to determine if an element with UUID-style message ID is a user message
  isUuidUserMessage(element) {
    // Check if it has the user message styling
    const hasUserStyling = element.querySelector('.bg-secondary') !== null;
    
    // Check if it's positioned on the right side of the chat (user messages typically are)
    const hasRightAlignment = element.querySelector('.items-end') !== null;
    
    // Ensure it doesn't have AI-specific elements
    const hasAiElements = element.querySelector('.lovable-logo_svg__b, .lovable-logo, svg[fill="currentColor"][viewBox="0 0 23 24"]') !== null;
    
    return hasUserStyling && hasRightAlignment && !hasAiElements;
  }

  findPrecedingUserMessage(lovableElement, allMessages = null) {
    // If allMessages is not provided, get all message containers in DOM order
    if (!allMessages) {
      allMessages = Array.from(document.querySelectorAll(
        '.ChatMessageContainer[data-message-id], [data-message-id^="umsg_"], [data-message-id^="aimsg_"], [data-message-id]'
      )).sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.top - rectB.top;
      });
    }

    // Find the index of the Lovable message
    const lovableIndex = allMessages.indexOf(lovableElement);
    if (lovableIndex <= 0) {
      return null;
    }
    
    // Look for a suitable user message before the lovable message
    for (let i = lovableIndex - 1; i >= 0; i--) {
      const candidateElement = allMessages[i];
      const messageId = candidateElement.getAttribute('data-message-id');
      
      // Check if it's a user message based on ID prefix or visual characteristics
      if (messageId.startsWith('umsg_') || this.isUuidUserMessage(candidateElement)) {
        return candidateElement;
      }
    }

    // If we can't find a clear user message, return the message immediately before (fallback)
    return allMessages[lovableIndex - 1];
  }
  
  isUuidUserMessage(element) {
    // Check if it has the user message styling
    const hasUserStyling = element.querySelector('.bg-secondary') !== null;
    
    // Check if it's positioned on the right side of the chat (user messages typically are)
    const hasRightAlignment = element.querySelector('.items-end') !== null;
    
    // Ensure it doesn't have AI-specific elements
    const hasAiElements = element.querySelector('.lovable-logo_svg__b, .lovable-logo, svg[fill="currentColor"][viewBox="0 0 23 24"]') !== null;
    
    return hasUserStyling && hasRightAlignment && !hasAiElements;
  }

  extractContent(element) {
    // Enhanced content extraction with HTML formatting preservation
    const messageId = element.getAttribute('data-message-id');
    const isLovableMessage = messageId?.startsWith('aimsg_');
    const isUserMessage = messageId?.startsWith('umsg_');
    
    if (isLovableMessage) {
      return this.extractLovableContentAsHTML(element);
    } else if (isUserMessage) {
      return this.extractUserContentAsHTML(element);
    }
    
    // Fallback to plain text extraction
    return this.extractPlainTextContent(element);
  }

  extractLovableContentAsHTML(element) {
    // For Lovable messages, preserve the rich HTML formatting
    const proseElements = element.querySelectorAll('.prose, .prose-markdown, [class*="prose"]');
    
    if (proseElements.length > 0) {
      let htmlContent = '';
      
      proseElements.forEach(prose => {
        // Clone to avoid modifying original
        const clone = prose.cloneNode(true);
        
        // Remove UI elements that shouldn't be part of content
        const uiSelectors = [
          'svg', 
          'button[aria-haspopup]', 
          '.opacity-0', 
          '[class*="icon"]',
          'button[data-state]',
          '.shrink-0',
          '[viewBox]'
        ];
        
        uiSelectors.forEach(selector => {
          const elements = clone.querySelectorAll(selector);
          elements.forEach(el => el.remove());
        });
        
        // Get the inner HTML, preserving formatting
        const proseHTML = clone.innerHTML?.trim();
        if (proseHTML && proseHTML.length > 10) {
          htmlContent += proseHTML + ' ';
        }
      });
      
      if (htmlContent.trim()) {
        if (this.verboseLogging) {
          console.log(`✅ Extracted Lovable HTML content: "${htmlContent.substring(0, 100)}..."`);
        }
        return htmlContent.trim();
      }
    }
    
    // Fallback to plain text if no prose elements found
    return this.extractPlainTextContent(element);
  }

  extractUserContentAsHTML(element) {
    // For user messages, get the text content and convert line breaks to <br> tags
    // Support both classic and UUID-style user messages
    
    // First try to find the message content div with common selectors
    const contentSelectors = [
      '.overflow-wrap-anywhere', 
      '.whitespace-pre-wrap',
      '.overflow-wrap-anywhere.overflow-auto.whitespace-pre-wrap'
    ];
    
    let contentDiv = null;
    for (const selector of contentSelectors) {
      const found = element.querySelector(selector);
      if (found) {
        contentDiv = found;
        break;
      }
    }
    
    if (!contentDiv) {
      // Fallback: look for div elements containing text
      const divs = element.querySelectorAll('div');
      for (const div of divs) {
        if (div.textContent.trim().length > 0 && !div.querySelector('div, button, svg')) {
          contentDiv = div;
          break;
        }
      }
    }
    
    if (contentDiv) {
      // Get the text content preserving line breaks
      let textContent = '';
      const walker = document.createTreeWalker(
        contentDiv,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            // Skip text inside buttons unless it's main content
            const parent = node.parentElement;
            if (parent?.tagName === 'BUTTON') {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        },
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        textContent += node.textContent;
      }
      
      if (textContent.trim()) {
        // Convert line breaks to <br> tags and escape HTML characters
        const htmlContent = textContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/\r?\n/g, '<br>')  // Convert line breaks to <br> tags
          .trim();
        
        if (this.verboseLogging) {
          console.log(`✅ Extracted User HTML content: "${htmlContent.substring(0, 100)}..."`);
        }
        
        return htmlContent;
      }
    }
    
    // Fallback to plain text extraction
    return this.extractPlainTextContent(element);
  }

  extractPlainTextContent(element) {
    // Legacy plain text extraction method (fallback)
    const clone = element.cloneNode(true);
    
    // Remove specific UI elements that shouldn't be part of content
    const uiSelectors = [
      'svg', 
      'button[aria-haspopup]', 
      '.opacity-0', 
      '[class*="icon"]',
      'button[data-state]',
      '.shrink-0',
      '[viewBox]'
    ];
    
    uiSelectors.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    let content = '';
    const walker = document.createTreeWalker(
      clone,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
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
      console.log(`📝 Extracted plain text content (${finalContent.length} chars): "${finalContent.substring(0, 100)}..."`);
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
    // Rule 1: Ignore if user prompt starts with specific patterns
    const ignorePrefixes = [
      'For the code present, I get the error below',
      'Refactor',
      'Implement the plan'
    ];
    
    const userContentTrimmed = userContent.trim();
    for (const prefix of ignorePrefixes) {
      if (userContentTrimmed.startsWith(prefix)) {
        if (this.verboseLogging) {
          console.log(`🚫 Ignoring: User message starts with "${prefix}"`);
        }
        return true;
      }
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
    // Use the stored project ID if available (from ownership confirmation)
    if (this.projectId) {
      return this.projectId;
    }
    
    // Fallback to URL extraction
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

      // Convert group to conversation format with proper lovableId checking and HTML support
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
          autoCapture: true,
          contentFormat: 'html' // Indicate this is HTML formatted content
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
      // Enhanced extension context validation
      if (!chrome?.runtime?.id) {
        if (this.verboseLogging) {
          console.warn('⚠️ Extension context lost - runtime ID not available');
        }
        return { success: false, error: 'Extension context invalidated' };
      }
      
      if (!chrome?.runtime?.sendMessage) {
        if (this.verboseLogging) {
          console.warn('⚠️ Extension context lost - sendMessage not available');
        }
        return { success: false, error: 'Extension context invalidated' };
      }
      
      // Check if extension is being reloaded
      try {
        chrome.runtime.getURL('');
      } catch (contextError) {
        if (this.verboseLogging) {
          console.warn('⚠️ Extension context invalidated during runtime check');
        }
        return { success: false, error: 'Extension context invalidated' };
      }
      
      // Set a timeout for the message to prevent hanging
      const messagePromise = chrome.runtime.sendMessage(message);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Message timeout after 8 seconds')), 8000);
      });
      
      const response = await Promise.race([messagePromise, timeoutPromise]);
      
      // Validate response structure
      if (response === undefined) {
        if (this.verboseLogging) {
          console.warn('⚠️ Received undefined response from background script');
        }
        return { success: false, error: 'No response from background script' };
      }
      
      return response;
    } catch (error) {
      // Handle specific Chrome extension errors silently unless verbose
      if (error.message?.includes('Extension context invalidated') || 
          error.message?.includes('receiving end does not exist') ||
          error.message?.includes('message channel closed')) {
        if (this.verboseLogging) {
          console.warn('⚠️ Extension context invalidated or background unavailable');
        }
        return { success: false, error: 'Extension context invalidated' };
      }
      
      if (error.message?.includes('Message timeout')) {
        if (this.verboseLogging) {
          console.warn('⚠️ Message timeout - background script may be busy');
        }
        return { success: false, error: 'Background script timeout' };
      }
      
      // Log unexpected errors only in verbose mode
      if (this.verboseLogging) {
        console.warn('⚠️ Background communication failed:', error);
      }
      
      return { success: false, error: error.message || 'Unknown communication error' };
    }
  }

  notifyUI(group) {
    // Notify Conversation History
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

  async restartAfterAuth() {
    console.log('🔄 Restarting capture after authentication...');
    // Re-check authentication status
    try {
      const response = await this.safeSendMessage({ action: 'checkAuth' });
      
      if (response?.success && response.data?.isAuthenticated) {
        console.log('✅ User authenticated - restarting conversation capture');
        this.waitingForAuthentication = false;
        
        // Restart monitoring if project ownership was already confirmed
        if (!this.waitingForOwnershipConfirmation && this.projectId) {
          this.startMonitoring();
        }
      } else {
        console.log('🔒 User still not authenticated');
        this.waitingForAuthentication = true;
      }
    } catch (error) {
      console.log('⚠️ Could not verify authentication during restart');
      this.waitingForAuthentication = true;
    }
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
  // Get debug information including ownership status
  debugInfo() {
    const capture = window.simpleConversationCapture;
    return {
      isMonitoring: capture.isMonitoring,
      waitingForAuthentication: capture.waitingForAuthentication,
      waitingForOwnership: capture.waitingForOwnershipConfirmation,
      projectId: capture.projectId,
      hasObserver: !!capture.chatObserver,
      messageGroupsCount: capture.messageGroups.size,
      pendingGroup: !!capture.pendingGroup,
      status: capture.waitingForAuthentication ? 
        'Waiting for user authentication' :
        (capture.waitingForOwnershipConfirmation ? 
          'Waiting for project ownership confirmation' : 
          (capture.isMonitoring ? 'Active - capturing conversations' : 'Inactive'))
    };
  },
  
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
  
  restartAfterAuth: () => {
    return window.simpleConversationCapture.restartAfterAuth();
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

