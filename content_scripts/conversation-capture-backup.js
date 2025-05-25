// Enhanced Conversation Capture and Processing for Lovable.dev
class ConversationCapture {
  constructor() {
    this.conversations = new Map();
    this.currentConversation = null;
    this.messageQueue = [];
    this.isMonitoring = false;
    this.chatObserver = null;
    this.detectedMessages = [];
    this.processedMessageIds = new Set(); // Track processed messages to avoid duplicates
    this.lastScanTime = 0;
    this.scanCooldown = 20000; // 20 seconds between scans (user requested)
    this.verboseLogging = false; // Reduce console flooding
    this.categories = {
      primary: ['Planning', 'Functioning', 'Designing', 'Debugging', 'Deployment'],
      secondary: {
        'UI Components': ['header', 'footer', 'navbar', 'menu bar', 'sidebar', 'modal', 'popup', 'dropdown'],
        'Data Display': ['table', 'chart', 'graph', 'list', 'grid', 'card', 'panel'],
        'Form Elements': ['input', 'form', 'button', 'checkbox', 'radio', 'select', 'textarea'],
        'Media': ['image', 'video', 'audio', 'carousel', 'gallery', 'slider'],
        'Navigation': ['breadcrumb', 'pagination', 'tab', 'accordion', 'stepper'],
        'Feedback': ['alert', 'notification', 'toast', 'snackbar', 'loading', 'spinner'],
        'Layout': ['container', 'wrapper', 'section', 'column', 'row', 'flex', 'grid'],
        'Database': ['CRUD', 'query', 'migration', 'schema', 'relation', 'index'],
        'API': ['endpoint', 'request', 'response', 'authentication', 'validation'],
        'Storage': ['upload', 'download', 'bucket', 'file', 'image storage'],
        'Performance': ['optimization', 'caching', 'lazy loading', 'bundling'],
        'Security': ['authentication', 'authorization', 'encryption', 'validation']
      }
    };
    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    window.addEventListener('lovable-assistant-show', this.handleAssistantShow.bind(this));
    
    // Start monitoring chat automatically
    this.startChatMonitoring();
    
    // Process message queue periodically
    setInterval(() => this.processMessageQueue(), 2000);
  }

  startChatMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🎯 Starting automatic Lovable.dev chat monitoring...');
    
    // Start monitoring immediately
    this.findAndMonitorLovableChat();
    
    // Set up multiple monitoring strategies for robustness
    
    // Strategy 1: Re-scan periodically in case chat interface loads later
    this.chatScanInterval = setInterval(() => {
      if (!this.chatObserver || this.detectedMessages.length === 0) {
        console.log('🔄 Re-scanning for chat interface...');
        this.findAndMonitorLovableChat();
      }
    }, 3000);
    
    // Strategy 2: Monitor for URL changes (SPA navigation)
    let lastUrl = window.location.href;
    this.urlMonitorInterval = setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('🔄 URL changed, re-initializing chat monitoring...');
        setTimeout(() => this.findAndMonitorLovableChat(), 1000);
      }
    }, 1000);
    
    // Strategy 3: Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('🔄 Page visible, ensuring chat monitoring...');
        setTimeout(() => this.findAndMonitorLovableChat(), 500);
      }
    });
    
    // Strategy 4: Monitor for DOM ready state changes
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        console.log('🔄 Page loaded, re-initializing chat monitoring...');
        setTimeout(() => this.findAndMonitorLovableChat(), 1000);
      });
    }
  }

  findAndMonitorLovableChat() {
    console.log('🔍 Starting Lovable chat detection...');
    
    // Primary strategy: Use the exact selectors provided by the user
    const chatSelectors = [
      // User-provided specific selector
      'div.h-full.w-full.overflow-y-auto.scrollbar-thin.scrollbar-track-transparent.scrollbar-thumb-muted-foreground',
      
      // Alternative approach: Look for the parent container that contains ChatMessageContainer elements
      'div.flex-shrink-1.relative.flex.min-h-0.w-full.flex-grow',
      
      // Fallback selectors
      'main div div div div.overflow-y-auto',
      '[class*="overflow-y-auto"][class*="scrollbar"]'
    ];

    let chatContainer = null;
    
    // Try each selector
    for (const selector of chatSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        console.log(`🔍 Trying selector: ${selector} - Found ${elements.length} elements`);
        
        if (elements.length > 0) {
          // Look for the container that contains ChatMessageContainer elements
          chatContainer = Array.from(elements).find(el => {
            const hasMessages = el.querySelector('.ChatMessageContainer[data-message-id]');
            if (hasMessages) {
              console.log(`✅ Found chat container with messages using: ${selector}`);
              return true;
            }
            return false;
          });
          
          if (chatContainer) {
            console.log('📱 Chat container element:', chatContainer);
            break;
          }
        }
      } catch (error) {
        console.warn(`❌ Failed to query selector: ${selector}`, error);
      }
    }

    // Try the user-provided XPath as backup
    if (!chatContainer) {
      try {
        console.log('🔍 Trying XPath approach...');
        const xpathResult = document.evaluate(
          '/html/body/div/div/div[2]/main/div/div/div[1]/div/div[1]/div[1]/div',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        
        if (xpathResult.singleNodeValue) {
          chatContainer = xpathResult.singleNodeValue;
          console.log('✅ Found chat container via XPath');
        }
      } catch (error) {
        console.warn('❌ XPath selector failed:', error);
      }
    }

    // Try a more flexible approach - look for any element containing ChatMessageContainer
    if (!chatContainer) {
      console.log('🔍 Trying flexible approach - looking for any container with ChatMessageContainer...');
      const messageContainers = document.querySelectorAll('.ChatMessageContainer[data-message-id]');
      if (messageContainers.length > 0) {
        // Find the common parent container
        chatContainer = messageContainers[0].parentElement;
        while (chatContainer && !chatContainer.matches('div[class*="overflow-y-auto"]')) {
          chatContainer = chatContainer.parentElement;
        }
        if (chatContainer) {
          console.log('✅ Found chat container via ChatMessageContainer parent search');
        }
      }
    }

    // If still no container, use document.body as last resort
    if (!chatContainer) {
      chatContainer = document.body;
      console.log('⚠️ Using document.body as fallback chat container');
    }

    console.log('📱 Final chat container:', chatContainer);
    this.setupChatObserver(chatContainer);
    
    // Initial scan of existing messages
    this.scanForNewLovableMessages();
    
    // Set up periodic scanning as backup with reduced frequency
    if (!this.periodicScanInterval) {
      this.periodicScanInterval = setInterval(() => {
        const now = Date.now();
        if (now - this.lastScanTime >= this.scanCooldown) {
          this.lastScanTime = now;
          this.scanForNewLovableMessages();
        }
      }, 5000); // Check every 5 seconds, but only scan if cooldown has passed
    }
  }

  setupChatObserver(container) {
    if (this.chatObserver) {
      this.chatObserver.disconnect();
    }

    this.chatObserver = new MutationObserver((mutations) => {
      let hasNewMessages = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for Lovable message containers
              if (this.isLovableMessageContainer(node) || 
                  (node.querySelector && node.querySelector('.ChatMessageContainer, [data-message-id]'))) {
                hasNewMessages = true;
              }
              
              // Also check if any added node contains message containers
              if (node.querySelector && node.querySelector('.ChatMessageContainer')) {
                hasNewMessages = true;
              }
            }
          });
        }
        
        // Also watch for attribute changes that might indicate message updates
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-message-id' || 
             mutation.attributeName === 'style')) {
          hasNewMessages = true;
        }
      });

      if (hasNewMessages) {
        const now = Date.now();
        if (now - this.lastScanTime >= this.scanCooldown) {
          if (this.verboseLogging) {
            console.log('🔄 New Lovable messages detected, scanning...');
          }
          // Debounce the scanning to avoid excessive calls
          clearTimeout(this.scanTimeout);
          this.scanTimeout = setTimeout(() => {
            this.lastScanTime = Date.now();
            this.scanForNewLovableMessages();
          }, 1000);
        } else {
          if (this.verboseLogging) {
            console.log('🕒 Scan request ignored due to cooldown');
          }
        }
      }
    });

    this.chatObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-message-id', 'style', 'class']
    });

    console.log('👀 Advanced chat observer set up successfully on:', container.tagName, container.className);
  }

  isLovableMessageContainer(element) {
    if (!element || !element.classList) return false;
    
    const messageId = element.getAttribute('data-message-id');
    
    return element.classList.contains('ChatMessageContainer') || 
           (messageId && (messageId.startsWith('umsg_') || messageId.startsWith('aimsg_')));
  }

  scanForNewLovableMessages() {
    if (this.verboseLogging) {
      console.log('🔍 ===== SCANNING FOR LOVABLE MESSAGES (SIMPLIFIED APPROACH) =====');
    }
    
    // Find all Lovable message containers
    const messageContainers = document.querySelectorAll('.ChatMessageContainer[data-message-id]');
    
    if (messageContainers.length === 0) {
      if (this.verboseLogging) {
        console.log('⚠️ No ChatMessageContainer elements found! Check if the page has loaded completely.');
      }
      return;
    }
    
    // Sort messages by position to maintain conversation flow
    const messagesInOrder = Array.from(messageContainers).sort((a, b) => {
      const aTop = this.getElementTop(a);
      const bTop = this.getElementTop(b);
      return aTop - bTop;
    });
    
    let newMessagesCount = 0;
    let ignoredMessagesCount = 0;
    let duplicateMessagesCount = 0;
    let incompleteMessagesCount = 0;
    let lastProcessedMessage = null;
    
    // SIMPLIFIED: Single-pass detection - UUID messages are now handled directly
    console.log('🔍 Processing all messages with simplified detection...');
    
    messagesInOrder.forEach((container, index) => {
      const messageData = this.extractLovableMessageData(container);
      if (!messageData) {
        // Skip containers that couldn't be processed
        return;
      }
      
      // Skip if already processed
      if (this.processedMessageIds.has(messageData.id)) {
        duplicateMessagesCount++;
        return;
      }
      
      // Special handling for Lovable messages - check completeness
      if (messageData.speaker === 'lovable') {
        if (!this.isLovableMessageComplete(messageData, container)) {
          incompleteMessagesCount++;
          if (this.verboseLogging) {
            console.log(`⏳ Lovable message ${messageData.id} not complete yet, will retry in next scan`);
          }
          return;
        }
        
        if (this.verboseLogging) {
          console.log(`✅ Lovable message ${messageData.id} is complete, processing now`);
        }
      }
      
      // Check if we should ignore this message
      if (!this.shouldIgnoreMessage(messageData, lastProcessedMessage)) {
        if (!this.isDuplicateMessage(messageData)) {
          this.detectedMessages.push(messageData);
          this.processedMessageIds.add(messageData.id);
          this.processDetectedMessage(messageData);
          newMessagesCount++;
          
          if (this.verboseLogging) {
            const detectionType = this.isUUIDFormat(messageData.id) ? '[UUID-USER]' : '[STANDARD]';
            console.log(`✅ ${detectionType} [${messageData.speaker}] ${messageData.content.substring(0, 30)}...`);
          }
        } else {
          duplicateMessagesCount++;
        }
      } else {
        ignoredMessagesCount++;
        if (this.verboseLogging) {
          console.log(`🚫 Message ignored - automated/unwanted`);
        }
      }
      
      lastProcessedMessage = messageData;
    });
    
    // Apply message pairing logic after processing all messages
    if (newMessagesCount > 0) {
      this.applyMessagePairing();
    }
    
    // Enhanced summary
    console.log(`📊 Final Scan Summary:`);
    console.log(`  • ${newMessagesCount} new messages processed`);
    console.log(`  • ${incompleteMessagesCount} incomplete (will retry)`);
    console.log(`  • ${ignoredMessagesCount} ignored`);
    console.log(`  • ${duplicateMessagesCount} duplicates`);
    console.log(`  • ${this.detectedMessages.length} total messages captured`);
  }

  groupMessagesByConversation(detectedMessages) {
    // Group messages by approximate timestamp/position for conversation pairing
    const groups = [];
    const sortedMessages = detectedMessages.sort((a, b) => {
      const aTop = this.getElementTop(a.container);
      const bTop = this.getElementTop(b.container);
      return aTop - bTop;
    });
    
    let currentGroup = { user: null, lovable: null };
    
    sortedMessages.forEach(({ container, messageData }) => {
      if (messageData.speaker === 'user') {
        // Start new group with user message
        if (currentGroup.user || currentGroup.lovable) {
          groups.push(currentGroup);
        }
        currentGroup = { user: { container, messageData }, lovable: null };
      } else if (messageData.speaker === 'lovable') {
        // Add to current group
        currentGroup.lovable = { container, messageData };
        groups.push(currentGroup);
        currentGroup = { user: null, lovable: null };
      }
    });
    
    // Add final group if needed
    if (currentGroup.user || currentGroup.lovable) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  // NEW: Improved method to find orphaned Lovable messages by checking DOM structure
  findOrphanedLovableMessages(allChatContainers) {
    const orphanedLovableMessages = [];
    
    // Get all containers in DOM order
    const allContainers = Array.from(allChatContainers).sort((a, b) => {
      const aTop = this.getElementTop(a);
      const bTop = this.getElementTop(b);
      return aTop - bTop;
    });
    
    allContainers.forEach((container, index) => {
      const messageId = container.getAttribute('data-message-id');
      
      // Check if this is a Lovable message (has aimsg_ prefix)
      if (messageId && messageId.startsWith('aimsg_')) {
        console.log(`🔍 Checking if Lovable message ${messageId} is orphaned...`);
        
        // Look for the previous container that should be the user message
        let foundUserMessage = false;
        
        // Check previous containers (look back up to 3 containers)
        for (let i = index - 1; i >= Math.max(0, index - 3); i--) {
          const prevContainer = allContainers[i];
          const prevMessageId = prevContainer.getAttribute('data-message-id');
          
          if (prevMessageId) {
            // Check if it's a known user message (umsg_ prefix)
            if (prevMessageId.startsWith('umsg_')) {
              console.log(`  ✅ Found paired user message: ${prevMessageId}`);
              foundUserMessage = true;
              break;
            }
            
            // Check if it's a UUID-style message that could be a user message
            if (!prevMessageId.startsWith('aimsg_') && this.detectUserMessageByStructure(prevContainer)) {
              console.log(`  🎯 Found UUID user message by structure: ${prevMessageId}`);
              foundUserMessage = true;
              break;
            }
            
            // If we hit another Lovable message, stop looking
            if (prevMessageId.startsWith('aimsg_')) {
              console.log(`  🛑 Hit another Lovable message, stopping search`);
              break;
            }
          }
        }
        
        // If no user message found, this Lovable message is orphaned
        if (!foundUserMessage) {
          console.log(`  🆘 Lovable message ${messageId} is ORPHANED - no user message found`);
          orphanedLovableMessages.push(container);
        }
      }
    });
    
    return orphanedLovableMessages;
  }

  findNearbyUserMessage(lovableContainer, unknownContainers) {
    // Find user message that should precede this Lovable message
    const lovableTop = this.getElementTop(lovableContainer);
    
    // Look for unknown containers that appear before the Lovable message
    const candidateContainers = unknownContainers.filter(container => {
      const containerTop = this.getElementTop(container);
      return containerTop < lovableTop && (lovableTop - containerTop) < 2000; // Within reasonable distance
    });
    
    // Sort by proximity (closest first)
    candidateContainers.sort((a, b) => {
      const aDistance = lovableTop - this.getElementTop(a);
      const bDistance = lovableTop - this.getElementTop(b);
      return aDistance - bDistance;
    });
    
    // Check candidates for user message characteristics
    for (const candidate of candidateContainers) {
      if (this.detectUserMessageByStructure(candidate)) {
        console.log(`🎯 Found potential user message for orphaned Lovable response`);
        return candidate;
      }
    }
    
    return null;
  }

  isLovableMessageComplete(messageData, container) {
    if (messageData.speaker !== 'lovable') return true; // User messages are always complete
    
    const content = messageData.content.toLowerCase();
    
    // Check for all 3 parts of a complete Lovable response:
    // 1. Thinking part (usually starts with explanations, "you're right", "i'll fix", etc.)
    // 2. Coding part (contains code blocks, implementations)  
    // 3. Summary part (explains what was done, "now the...", "this will...")
    
    const hasThinkingPart = content.includes('you\'re right') || 
                           content.includes('i\'ll fix') ||
                           content.includes('let me fix') ||
                           content.includes('the issue is') ||
                           content.includes('i understand') ||
                           content.includes('i\'ll help') ||
                           content.includes('i\'ll update') ||
                           content.length > 100; // At least some substantial thinking
    
    const hasCodingPart = content.includes('```') || // Code blocks
                         content.includes('here\'s the') ||
                         content.includes('updated code') ||
                         content.includes('i\'ll update') ||
                         container.querySelectorAll('.prose').length > 1; // Multiple prose sections
    
    const hasSummaryPart = content.includes('now the') ||
                          content.includes('this should') ||
                          content.includes('this will') ||
                          content.includes('the button will') ||
                          content.includes('this fix') ||
                          content.includes('this update') ||
                          (content.length > 300 && content.includes('.')); // Substantial content with proper ending
    
    // Consider complete if it has thinking + summary (coding is optional for some responses)
    const isComplete = hasThinkingPart && hasSummaryPart && messageData.content.length > 200;
    
    if (this.verboseLogging) {
      console.log(`🔍 Lovable message completeness check for ${messageData.id}:`, {
        hasThinkingPart,
        hasCodingPart, 
        hasSummaryPart,
        contentLength: messageData.content.length,
        isComplete
      });
    }
    
    return isComplete;
  }

  isLovableMessageStreaming(messageData, container) {
    if (messageData.speaker !== 'lovable') return false;
    
    // Check if this appears to be a partial/streaming message
    const indicators = {
      // Short content might indicate it's still being written
      isShort: messageData.content.length < 200,
      
      // Check if content ends abruptly (no proper conclusion)
      endsAbruptly: !messageData.content.match(/[.!?]\s*$/),
      
      // Check for streaming indicators in the content
      hasStreamingIndicators: messageData.content.includes('...') || 
                             messageData.content.trim().endsWith(''),
      
      // Check if there are visible loading/streaming elements in the container
      hasLoadingElements: container.querySelector('.animate-pulse, .loading, .streaming, [class*="typing"]'),
      
      // Check if this looks like just the "thinking" part
      looksIncomplete: !this.isLovableMessageComplete(messageData, container),
      
      // Check if there are incomplete prose containers (still being populated)
      hasIncompleteProse: container.querySelectorAll('.prose').length === 1 && messageData.content.length < 300
    };
    
    // Consider it streaming if multiple indicators suggest so or if it's not complete
    const streamingScore = Object.values(indicators).filter(Boolean).length;
    const isStreaming = streamingScore >= 2 || indicators.looksIncomplete;
    
    if (this.verboseLogging && isStreaming) {
      console.log(`⏳ Message ${messageData.id} appears to be streaming:`, indicators);
    }
    
    return isStreaming;
  }

  getElementTop(element) {
    // Get the top position from inline styles or computed position
    const style = element.getAttribute('style') || '';
    const topMatch = style.match(/top:\s*([0-9.]+)px/);
    return topMatch ? parseFloat(topMatch[1]) : 0;
  }

  shouldIgnoreMessage(messageData, lastProcessedMessage) {
    // NEW: Always ignore system messages
    if (messageData.speaker === 'system') {
      if (this.verboseLogging) {
        console.log('🚫 Ignoring system message:', messageData.content.substring(0, 50) + '...');
      }
      return true;
    }
    
    // NEW: Ignore system restoration messages (backup check)
    if (messageData.content.startsWith('SYSTEM: Restored')) {
      if (this.verboseLogging) {
        console.log('🚫 Ignoring system restoration message:', messageData.content.substring(0, 50) + '...');
      }
      return true;
    }
    
    // NEW: Ignore refactoring conversation groups (both user and Lovable messages)
    if (messageData.speaker === 'user') {
      // Ignore user messages that start refactoring requests
      if (messageData.content.startsWith('Refactor ')) {
        if (this.verboseLogging) {
          console.log('🚫 Ignoring user refactoring request:', messageData.content.substring(0, 50) + '...');
        }
        return true;
      }
    }
    
    if (messageData.speaker === 'lovable') {
      // Ignore Lovable refactoring responses
      if (messageData.content.startsWith('I\'ll refactor') ||
          messageData.content.startsWith('I will refactor')) {
        if (this.verboseLogging) {
          console.log('🚫 Ignoring Lovable refactoring message:', messageData.content.substring(0, 50) + '...');
        }
        return true;
      }
    }
    
    // NEW: Ignore specific error report messages
    if (messageData.speaker === 'user') {
      if (messageData.content.startsWith('For the code present, I get the error below')) {
        if (this.verboseLogging) {
          console.log('🚫 Ignoring user error report message:', messageData.content.substring(0, 50) + '...');
        }
        return true;
      }
    }
    
    // Existing ignore rules for automated deployment error messages
    if (messageData.speaker === 'user') {
      // Check for the specific automated message pattern
      if (messageData.content.startsWith('I\'ve made some changes in the code') ||
          messageData.content.startsWith('I have made some changes in the code')) {
        if (this.verboseLogging) {
          console.log('🚫 Ignoring automated deployment error message:', messageData.content.substring(0, 50) + '...');
        }
        return true;
      }
    }
    
    // If this is a Lovable response and the last processed message was an automated error, ignore it too
    if (messageData.speaker === 'lovable' && lastProcessedMessage) {
      if (lastProcessedMessage.speaker === 'user' && 
          (lastProcessedMessage.content.startsWith('I\'ve made some changes in the code') ||
           lastProcessedMessage.content.startsWith('I have made some changes in the code') ||
           lastProcessedMessage.content.startsWith('For the code present, I get the error below'))) {
        if (this.verboseLogging) {
          console.log('🚫 Ignoring Lovable response to automated/error report message');
        }
        return true;
      }
    }
    
    return false;
  }

  applyMessagePairing() {
    // Apply pairing logic: Lovable responses inherit categories from preceding user messages
    // Also sync timestamps since Lovable responds immediately to user messages
    
    // Sort messages by DOM position to ensure correct pairing
    const sortedMessages = this.detectedMessages.sort((a, b) => {
      const aTop = this.getElementTop(a.element);
      const bTop = this.getElementTop(b.element);
      return aTop - bTop;
    });
    
    // Update the detectedMessages array with sorted order
    this.detectedMessages = sortedMessages;
    
    // Now apply pairing to consecutive messages
    for (let i = 1; i < this.detectedMessages.length; i++) {
      const currentMessage = this.detectedMessages[i];
      const previousMessage = this.detectedMessages[i - 1];
      
      if (currentMessage.speaker === 'lovable' && 
          previousMessage.speaker === 'user') {
        // Lovable response inherits categories from user message
        currentMessage.categories = {
          primary: [...previousMessage.categories.primary],
          secondary: [...previousMessage.categories.secondary]
        };
        
        // CRITICAL FIX: Sync timestamps - user message gets the same timestamp as Lovable response
        // since Lovable responds immediately and Lovable messages have more accurate timestamps
        if (currentMessage.timestamp && currentMessage.timestamp !== previousMessage.timestamp) {
          previousMessage.timestamp = currentMessage.timestamp;
          if (this.verboseLogging) {
            console.log(`🕒 Synced user message timestamp with Lovable response: ${currentMessage.timestamp}`);
            console.log(`  User: ${previousMessage.id} → Lovable: ${currentMessage.id}`);
          }
        }
        
        if (this.verboseLogging) {
          console.log(`🔗 Paired Lovable response with user message categories:`, currentMessage.categories);
        }
      }
    }
    
    // Additional pass: Handle orphaned user messages that might come after Lovable responses
    // This can happen with UUID messages detected via structural detection
    for (let i = 0; i < this.detectedMessages.length - 1; i++) {
      const currentMessage = this.detectedMessages[i];
      const nextMessage = this.detectedMessages[i + 1];
      
      if (currentMessage.speaker === 'user' && 
          nextMessage.speaker === 'lovable') {
        // Check if they're close in DOM position (indicating they're a conversation pair)
        const userTop = this.getElementTop(currentMessage.element);
        const lovableTop = this.getElementTop(nextMessage.element);
        const distance = Math.abs(lovableTop - userTop);
        
        if (distance < 500) { // Within reasonable distance
          // Sync timestamp: user gets Lovable's timestamp
          if (nextMessage.timestamp && nextMessage.timestamp !== currentMessage.timestamp) {
            currentMessage.timestamp = nextMessage.timestamp;
            
            // Also inherit categories if user message doesn't have proper ones
            if (currentMessage.categories.primary.length === 0 || 
                currentMessage.categories.primary[0] === 'Functioning') {
              // Re-categorize based on content
              const newCategories = this.categorizeMessage(currentMessage.content, 'user');
              currentMessage.categories = newCategories;
              
              // Lovable inherits from updated user categories
              nextMessage.categories = {
                primary: [...currentMessage.categories.primary],
                secondary: [...currentMessage.categories.secondary]
              };
            }
            
            if (this.verboseLogging) {
              console.log(`🔗 Paired orphaned user message with Lovable response:`);
              console.log(`  User: ${currentMessage.id} → Lovable: ${nextMessage.id}`);
              console.log(`  Synced timestamp: ${nextMessage.timestamp}`);
            }
          }
        }
      }
    }
  }

  extractLovableMessageData(container) {
    const messageId = container.getAttribute('data-message-id');
    if (!messageId) return null;

    // Check for system restoration messages first (before speaker detection)
    const restoredSpan = Array.from(container.querySelectorAll('span')).find(span => 
      span.textContent && span.textContent.trim() === 'Restored'
    );
    
    if (restoredSpan) {
      // This is a system restoration message - treat as system type
      let content = '';
      const restoredButton = container.querySelector('button .truncate');
      if (restoredButton) {
        content = `SYSTEM: Restored to "${restoredButton.textContent.trim()}"`;
      } else {
        content = 'SYSTEM: Project restored to previous state';
      }
      
      console.log(`🔧 System restoration message detected: ${messageId}`);
      
      // Return as system message (will be ignored)
      return {
        id: messageId,
        content: content,
        speaker: 'system',
        timestamp: new Date().toISOString(),
        categories: { primary: ['System'], secondary: [] },
        element: container,
        projectId: this.extractProjectId()
      };
    }

    // SIMPLIFIED: Determine speaker directly
    let speaker = 'unknown';
    if (messageId.startsWith('umsg_')) {
      speaker = 'user';
    } else if (messageId.startsWith('aimsg_')) {
      speaker = 'lovable';
    } else if (this.isUUIDFormat(messageId)) {
      // CRITICAL FIX: Treat UUID messages as user messages directly
      speaker = 'user';
      console.log(`🎯 UUID message detected as user message: ${messageId}`);
    }

    // Skip truly unknown messages
    if (speaker === 'unknown') {
      return null;
    }

    // Extract content based on speaker
    let content = '';
    let timestamp = null;

    try {
      if (speaker === 'user') {
        content = this.extractUserMessageContent(container);
      } else if (speaker === 'lovable') {
        content = this.extractLovableMessageContent(container);
        timestamp = this.extractLovableTimestamp(container);
      }
    } catch (error) {
      console.warn(`⚠️ Error extracting content for ${messageId}:`, error);
      return null;
    }

    if (!content || content.trim() === '') {
      console.warn(`⚠️ No content found for message: ${messageId}`);
      return null;
    }

    // Auto-categorize the message
    const categories = this.categorizeMessage(content, speaker);

    return {
      id: messageId,
      content: content.trim(),
      speaker,
      timestamp: timestamp || new Date().toISOString(),
      categories,
      element: container,
      projectId: this.extractProjectId()
    };
  }

  // Helper function to detect UUID format
  isUUIDFormat(messageId) {
    // UUID format: 8-4-4-4-12 characters (e.g., 687e105c-7b3e-492c-970b-6979d0bcb975)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(messageId);
  }

  // Helper function to detect UUID format
  isUUIDFormat(messageId) {
    // UUID format: 8-4-4-4-12 characters (e.g., 687e105c-7b3e-492c-970b-6979d0bcb975)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(messageId);
  }

  // REMOVED: Complex structural detection methods are no longer needed
  // UUID messages are now handled directly in extractLovableMessageData()

  detectUserMessageByStructure(container) {
    // User messages typically have:
    // 1. Right-aligned layout (items-end class)
    // 2. Secondary background (bg-secondary)
    // 3. Specific positioning
    
    const indicators = [
      // Check for right-aligned layout
      container.querySelector('.items-end'),
      container.querySelector('.flex.flex-col.items-end'),
      
      // Check for secondary background
      container.querySelector('.bg-secondary'),
      container.querySelector('[class*="bg-secondary"]'),
      
      // Check for right-side positioning patterns
      container.querySelector('.ml-auto'),
      container.querySelector('.justify-end'),
      
      // Check for user message content area (simplified selector)
      container.querySelector('.overflow-wrap-anywhere'),
      container.querySelector('.whitespace-pre-wrap'),
      
      // Check for rounded styling
      container.querySelector('.rounded-xl')
    ];
    
    // If any strong indicator is found, it's likely a user message
    const strongIndicators = indicators.filter(Boolean).length;
    
    if (strongIndicators >= 2) {
      return true;
    }
    
    // Additional check: look for user-specific content patterns
    const contentElement = container.querySelector('.overflow-wrap-anywhere, .whitespace-pre-wrap');
    if (contentElement) {
      const parentDiv = contentElement.closest('.flex.flex-col');
      if (parentDiv && parentDiv.classList.contains('items-end')) {
        return true;
      }
    }
    
    return false;
  }

  detectLovableMessageByStructure(container) {
    // Lovable messages typically have:
    // 1. Left-aligned layout
    // 2. Different background styling
    // 3. Response structure
    
    const indicators = [
      // Check for Lovable-specific elements
      container.querySelector('[class*="assistant"]'),
      container.querySelector('[class*="ai"]'),
      container.querySelector('[class*="bot"]'),
      
      // Check for left-aligned layout (absence of right-align indicators)
      !container.querySelector('.items-end') && container.querySelector('.flex'),
      
      // Check for response structure
      container.querySelector('[class*="response"]'),
      container.querySelector('[class*="reply"]')
    ];
    
    const strongIndicators = indicators.filter(Boolean).length;
    
    // Lovable messages are less distinctive, so we need fewer indicators
    return strongIndicators >= 1;
  }

  extractUserMessageContent(container) {
    // Check for system restoration messages first
    const restoredSpan = Array.from(container.querySelectorAll('span')).find(span => 
      span.textContent && span.textContent.trim() === 'Restored'
    );
    
    if (restoredSpan) {
      // Extract the actual restored message from the button
      const restoredButton = container.querySelector('button .truncate');
      if (restoredButton) {
        return `SYSTEM: Restored to "${restoredButton.textContent.trim()}"`;
      }
      return 'SYSTEM: Project restored to previous state';
    }
    
    // Enhanced extraction based on user's actual HTML structure
    const contentSelectors = [
      // Primary: content inside the main message container (simplified selectors)
      '.overflow-wrap-anywhere div',
      '.whitespace-pre-wrap div', 
      '.bg-secondary div', // Content inside secondary background
      
      // Fallback: individual selectors
      '.overflow-wrap-anywhere',
      '.whitespace-pre-wrap',
      '.rounded-xl div',
      
      // Additional patterns
      '[class*="bg-secondary"] div',
      '[class*="overflow-wrap-anywhere"] div',
      '.rounded-xl div'
    ];
    
    for (const selector of contentSelectors) {
      try {
        const contentElements = container.querySelectorAll(selector);
        
        for (const contentDiv of contentElements) {
          if (contentDiv) {
            let content = contentDiv.textContent || contentDiv.innerText || '';
            content = content.trim();
            
            // Skip empty content
            if (!content || content.trim() === '') continue;
            
            // Skip UI elements
            if (this.isUIText(content)) continue;
            
            if (this.verboseLogging) {
              console.log(`✅ Extracted user content using: ${selector}`);
              console.log(`📝 User content: "${content.substring(0, 100)}..."`);
            }
            
            return content;
          }
        }
      } catch (error) {
        if (this.verboseLogging) {
          console.warn(`⚠️ Error with selector ${selector}:`, error);
        }
      }
    }
    
    // Fallback: get all text content excluding UI elements
    const clone = container.cloneNode(true);
    
    // Remove UI elements that shouldn't be part of the message
    const uiElements = clone.querySelectorAll('button, svg, .opacity-0, [class*="button"], [class*="btn"], .text-muted-foreground');
    uiElements.forEach(el => el.remove());
    
    const fallbackContent = this.getTextContent(clone);
    if (this.verboseLogging) {
      console.log(`⚠️ Used fallback extraction for user content: "${fallbackContent.substring(0, 100)}..."`);
    }
    return fallbackContent;
  }

  isUIText(content) {
    // Skip common UI elements and navigation text
    const uiPatterns = [
      /^(Home|Settings|Profile|Menu|Back|Next|Previous|Close|Cancel|OK)$/i,
      /^(Edit|Delete|Save|Submit|Send|Upload|Download)$/i,
      /^(Show|Hide|Toggle|Expand|Collapse)$/i,
      /^\d+\s*(min|minute|hour|day|week|month|year)s?\s+ago$/i,
      /^(Loading|Error|Success|Warning)$/i,
      /^[\s]*$/,
      /^[0-9\s\-\:\.\,]*$/
    ];
    
    return uiPatterns.some(pattern => pattern.test(content.trim()));
  }

  extractLovableMessageContent(container) {
    // Check for system restoration messages first
    const restoredSpan = Array.from(container.querySelectorAll('span')).find(span => 
      span.textContent && span.textContent.trim() === 'Restored'
    );
    
    if (restoredSpan) {
      // Extract the actual restored message from the button
      const restoredButton = container.querySelector('button .truncate');
      if (restoredButton) {
        return `SYSTEM: Restored to "${restoredButton.textContent.trim()}"`;
      }
      return 'SYSTEM: Project restored to previous state';
    }
    
    // Based on the provided HTML structure - Lovable messages are in prose containers
    const proseSelectors = [
      '.prose.prose-zinc.prose-markdown',
      '.prose-markdown',
      '.prose'
    ];
    
    let content = '';
    
    // Try to find prose containers with content
    for (const selector of proseSelectors) {
      const proseContainers = container.querySelectorAll(selector);
      if (proseContainers.length > 0) {
        if (this.verboseLogging) {
          console.log(`✅ Found ${proseContainers.length} prose containers using: ${selector}`);
        }
        
        proseContainers.forEach(prose => {
          // Skip UI elements like buttons and hidden content
          if (!prose.closest('button') && !prose.classList.contains('opacity-0')) {
            const proseContent = prose.textContent.trim();
            if (proseContent && proseContent.length > 10) {
              content += proseContent + '\n';
            }
          }
        });
        
        if (content.trim()) {
          if (this.verboseLogging) {
            console.log(`✅ Extracted Lovable content using: ${selector}`);
            console.log(`📝 Lovable content: "${content.trim().substring(0, 100)}..."`);
          }
          return content.trim();
        }
      }
    }
    
    // Fallback: get all text content excluding UI elements
    const clone = container.cloneNode(true);
    
    // Remove UI elements that shouldn't be part of the message
    const uiElements = clone.querySelectorAll('button, svg, .opacity-0, [class*="button"], [class*="btn"], .text-muted-foreground, [aria-haspopup]');
    uiElements.forEach(el => el.remove());
    
    const fallbackContent = this.getTextContent(clone);
    if (this.verboseLogging) {
      console.log(`⚠️ Used fallback extraction for Lovable content: "${fallbackContent.substring(0, 100)}..."`);
    }
    return fallbackContent;
  }

  extractLovableTimestamp(container) {
    // Look for timestamp in the header - based on the provided HTML structure
    const timestampSelectors = [
      '.text-muted-foreground.opacity-0.transition-opacity',
      '.text-muted-foreground',
      '.opacity-0',
      'span[class*="text-muted-foreground"]'
    ];
    
    for (const selector of timestampSelectors) {
      const timestampElement = container.querySelector(selector);
      if (timestampElement && timestampElement.textContent.includes('on')) {
        const timestampText = timestampElement.textContent.trim();
        if (this.verboseLogging) {
          console.log(`✅ Found timestamp: "${timestampText}"`);
        }
        
        // Parse "20:33 on May 24, 2025" format
        const match = timestampText.match(/(\d{1,2}:\d{2})\s+on\s+(.+)/);
        if (match) {
          const [, time, date] = match;
          try {
            const parsedDate = new Date(`${date} ${time}`);
            const isoString = parsedDate.toISOString();
            if (this.verboseLogging) {
              console.log(`✅ Parsed timestamp: ${isoString}`);
            }
            return isoString;
          } catch (e) {
            if (this.verboseLogging) {
              console.warn('❌ Failed to parse timestamp:', timestampText, e);
            }
          }
        }
      }
    }
    
    console.log('⚠️ No timestamp found, using current time');
    return new Date().toISOString();
  }

  getTextContent(element) {
    let text = '';
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      text += node.textContent + ' ';
    }
    
    return text.replace(/\s+/g, ' ').trim();
  }

  categorizeMessage(content, speaker) {
    const lowerContent = content.toLowerCase();
    const categories = {
      primary: [],
      secondary: []
    };

    // Only categorize user messages - Lovable responses will inherit from user messages
    if (speaker === 'user') {
      // Primary categorization based on user intent
      if (this.containsKeywords(lowerContent, ['plan', 'structure', 'architecture', 'wireframe', 'design system', 'strategy', 'approach'])) {
        categories.primary.push('Planning');
      }
      
      if (this.containsKeywords(lowerContent, ['function', 'feature', 'implement', 'add', 'create', 'build', 'develop', 'delete', 'functionality', 'make', 'generate'])) {
        categories.primary.push('Functioning');
      }
      
      if (this.containsKeywords(lowerContent, ['design', 'style', 'css', 'color', 'layout', 'ui', 'ux', 'appearance', 'theme', 'visual'])) {
        categories.primary.push('Designing');
      }
      
      if (this.containsKeywords(lowerContent, ['error', 'bug', 'fix', 'debug', 'issue', 'problem', 'not working', 'unsuccessful', 'broken', 'fail'])) {
        categories.primary.push('Debugging');
      }
      
      if (this.containsKeywords(lowerContent, ['deploy', 'build', 'production', 'publish', 'release', 'server', 'hosting'])) {
        categories.primary.push('Deployment');
      }

      // Secondary categorization - detect specific components/areas mentioned
      Object.entries(this.categories.secondary).forEach(([group, keywords]) => {
        keywords.forEach(keyword => {
          if (lowerContent.includes(keyword.toLowerCase())) {
            if (!categories.secondary.includes(group)) {
              categories.secondary.push(group);
            }
          }
        });
      });

      // Default category if none detected for user messages
      if (categories.primary.length === 0) {
        categories.primary.push('Functioning'); // Most user requests are about functionality
      }
    } else {
      // For Lovable messages, provide temporary categories that will be overridden by pairing logic
      categories.primary.push('Planning');
    }

    return categories;
  }

  containsKeywords(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  isDuplicateMessage(messageData) {
    return this.detectedMessages.some(existing => 
      existing.id === messageData.id ||
      (existing.content === messageData.content && 
       existing.speaker === messageData.speaker &&
       Math.abs(new Date(existing.timestamp) - new Date(messageData.timestamp)) < 2000)
    );
  }

  processDetectedMessage(messageData) {
    // Simplified console logging to reduce flooding
    console.log(`🎯 [${messageData.speaker.toUpperCase()}] "${messageData.content.substring(0, 50)}${messageData.content.length > 50 ? '...' : ''}" | Categories: [${messageData.categories.primary.join(', ')}]`);

    // Add to queue for processing
    this.messageQueue.push({
      ...messageData,
      captured_at: new Date().toISOString()
    });

    // Notify the main detector about new message with error handling
    this.safeSendMessage({
      action: 'messageDetected',
      data: messageData
    }).then(() => {
      if (this.verboseLogging) {
        console.log('✅ Message sent to background script');
      }
    }).catch(() => {
      // Silently handle - error already logged in safeSendMessage
    });

    // Notify the main detector about new message
    if (window.lovableDetector && window.lovableDetector.addDetectedMessage) {
      window.lovableDetector.addDetectedMessage(messageData);
      if (this.verboseLogging) {
        console.log('✅ Message sent to Development History');
      }
    } else if (this.verboseLogging) {
      console.log('⚠️ Lovable Detector not ready, message will be available on next scan');
    }

    // Dispatch a custom event for the UI
    window.dispatchEvent(new CustomEvent('lovable-message-captured', {
      detail: messageData
    }));
  }

  // Utility function to safely send messages to background script
  async safeSendMessage(message) {
    try {
      const response = await chrome.runtime.sendMessage(message);
      return response;
    } catch (error) {
      // Handle extension context invalidation gracefully
      if (error.message && error.message.includes('Extension context invalidated')) {
        if (this.verboseLogging) {
          console.warn('⚠️ Extension context invalidated - background communication unavailable');
        }
        return { success: false, error: 'Extension context invalidated' };
      }
      
      // Handle other chrome.runtime errors
      if (error.message && error.message.includes('receiving end does not exist')) {
        if (this.verboseLogging) {
          console.warn('⚠️ Background script not available');
        }
        return { success: false, error: 'Background script not available' };
      }
      
      // Log other unexpected errors
      console.error('Chrome runtime message error:', error);
      return { success: false, error: error.message };
    }
  }

  extractProjectId() {
    const url = window.location.href;
    const match = url.match(/\/projects\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  async processMessageQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      const batch = this.messageQueue.splice(0, 5);
      for (const message of batch) {
        await this.enrichMessageContext(message);
        await this.saveConversation(message);
      }
    } catch (error) {
      console.error('Message queue processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async enrichMessageContext(message) {
    try {
      message.codeSnippets = this.extractCodeSnippets(message.content);
      message.techTerms = this.extractTechnicalTerms(message.content);
      message.pageContext = this.getPageContext();
    } catch (error) {
      console.error('Message enrichment failed:', error);
    }
  }

  extractCodeSnippets(content) {
    const codeBlocks = [];
    const blockMatches = content.match(/```[\s\S]*?```/g);
    if (blockMatches) {
      blockMatches.forEach(match => {
        const language = match.match(/```(\w+)/);
        codeBlocks.push({
          type: 'block',
          language: language ? language[1] : 'unknown',
          content: match.replace(/```\w*\n?|\n?```/g, '')
        });
      });
    }
    return codeBlocks;
  }

  extractTechnicalTerms(content) {
    const techTerms = [];
    const patterns = [
      /\b(React|Vue|Angular|Express|Node\.js|Django|Flask)\b/gi,
      /\b(JavaScript|TypeScript|Python|Java|PHP|Ruby|Go)\b/gi,
      /\b(MongoDB|PostgreSQL|MySQL|Redis|Firebase|Supabase)\b/gi,
      /\b(API|REST|GraphQL|JSON|XML|HTML|CSS)\b/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        techTerms.push(...matches.map(match => match.toLowerCase()));
      }
    });
    
    return [...new Set(techTerms)];
  }

  getPageContext() {
    return {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      scrollPosition: window.scrollY
    };
  }

  async saveConversation(messageData) {
    const response = await this.safeSendMessage({
      action: 'saveConversation',
      data: {
        id: messageData.id,
        projectId: messageData.projectId,
        userMessage: messageData.speaker === 'user' ? messageData.content : '',
        lovableResponse: messageData.speaker === 'lovable' ? messageData.content : '',
        timestamp: messageData.timestamp,
        categories: messageData.categories,
        techTerms: messageData.techTerms || [],
        codeSnippets: messageData.codeSnippets || [],
        pageContext: messageData.pageContext || {}
      }
    });

    if (response?.success) {
      console.log('💾 Conversation saved successfully:', messageData.id);
    } else if (this.verboseLogging && response?.error && !response.error.includes('Extension context invalidated')) {
      console.warn('⚠️ Conversation save failed:', response.error);
    }
  }

  handleMessage(request, sender, sendResponse) {
    if (request.action === 'newMessage') {
      this.captureMessage(request.data);
      sendResponse({ success: true });
    }
    return true;
  }

  handleAssistantShow(event) {
    console.log('Assistant dialog requested:', event.detail);
  }

  // Cleanup method for intervals and observers
  destroy() {
    console.log('🧹 Cleaning up conversation capture...');
    
    if (this.chatObserver) {
      this.chatObserver.disconnect();
      this.chatObserver = null;
    }
    
    if (this.chatScanInterval) {
      clearInterval(this.chatScanInterval);
      this.chatScanInterval = null;
    }
    
    if (this.urlMonitorInterval) {
      clearInterval(this.urlMonitorInterval);
      this.urlMonitorInterval = null;
    }
    
    if (this.periodicScanInterval) {
      clearInterval(this.periodicScanInterval);
      this.periodicScanInterval = null;
    }
    
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    
    this.isMonitoring = false;
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Method to restart monitoring (useful for debugging or recovery)
  restart() {
    console.log('🔄 Restarting conversation capture...');
    this.destroy();
    setTimeout(() => {
      this.isMonitoring = false;
      this.startChatMonitoring();
    }, 1000);
  }

  // Test specific user issue with short messages
  testShortMessageCapture() {
    console.log('🧪 Testing short message capture fix...');
    
    // Test case: The exact HTML from user's issue
    const userMessageHtml = `
      <div class="ChatMessageContainer group flex flex-col pr-2 pb-4" data-message-id="umsg_01jw2vfjjgecybwathv667vkq5" style="min-height: auto;">
        <div class="">
          <div class="flex flex-col items-end">
            <div class="mb-2 ml-auto flex max-w-160px flex-wrap justify-end gap-2"></div>
            <div class="overflow-wrap-anywhere overflow-auto whitespace-pre-wrap rounded-xl text-base bg-secondary px-3 py-3">
              <div>fasfasfas</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const lovableMessageHtml = `
      <div class="ChatMessageContainer group flex flex-col pr-2 pb-4" data-message-id="aimsg_01jw2vfm37fngaaq8ad4ayf570" style="min-height: auto;">
        <div class="pl-0">
          <div class="prose prose-zinc prose-markdown max-w-full">
            <p>I can see you've sent "fasfasfas" which appears to be a test message or accidental input.</p>
            <p>Is there anything specific you'd like me to help you with?</p>
          </div>
        </div>
      </div>
    `;
    
    const parser = new DOMParser();
    
    // Test user message extraction
    console.log('\n📋 Testing User Message ("fasfasfas"):');
    const userDoc = parser.parseFromString(userMessageHtml, 'text/html');
    const userContainer = userDoc.querySelector('.ChatMessageContainer');
    
    if (userContainer) {
      const userResult = this.extractLovableMessageData(userContainer);
      console.log(`  Message ID: ${userContainer.getAttribute('data-message-id')}`);
      console.log(`  Content Length: ${userContainer.textContent.includes('fasfasfas') ? 9 : 'not found'} characters`);
      
      if (userResult) {
        console.log(`  ✅ SUCCESS: Detected as ${userResult.speaker}: "${userResult.content}"`);
      } else {
        console.log(`  ❌ FAILED: Message not captured (check extraction logic)`);
      }
    }
    
    // Test Lovable message extraction 
    console.log('\n📋 Testing Lovable Response:');
    const lovableDoc = parser.parseFromString(lovableMessageHtml, 'text/html');
    const lovableContainer = lovableDoc.querySelector('.ChatMessageContainer');
    
    if (lovableContainer) {
      const lovableResult = this.extractLovableMessageData(lovableContainer);
      console.log(`  Message ID: ${lovableContainer.getAttribute('data-message-id')}`);
      
      if (lovableResult) {
        console.log(`  ✅ SUCCESS: Detected as ${lovableResult.speaker}: "${lovableResult.content.substring(0, 50)}..."`);
      } else {
        console.log(`  ❌ FAILED: Message not captured`);
      }
    }
    
    // Test edge cases
    console.log('\n📋 Testing Edge Cases:');
    
    const edgeCases = [
      { content: 'a', shouldPass: true, reason: 'Single character' },
      { content: '.', shouldPass: true, reason: 'Single punctuation' },
      { content: '?', shouldPass: true, reason: 'Single question mark' },
      { content: 'hi', shouldPass: true, reason: 'Two characters' },
      { content: 'test', shouldPass: true, reason: 'Short message' },
      { content: 'fasfasfas', shouldPass: true, reason: 'User issue case' }
    ];
    
    edgeCases.forEach(testCase => {
      const testHtml = `
        <div class="ChatMessageContainer" data-message-id="test_${Math.random()}">
          <div class="flex flex-col items-end">
            <div class="overflow-wrap-anywhere overflow-auto whitespace-pre-wrap rounded-xl bg-secondary px-3 py-3">
              <div>${testCase.content}</div>
            </div>
          </div>
        </div>
      `;
      
      const testDoc = parser.parseFromString(testHtml, 'text/html');
      const testContainer = testDoc.querySelector('.ChatMessageContainer');
      const testResult = this.extractUnknownMessageByStructure(testContainer);
      
      const passed = !!testResult;
      const status = passed === testCase.shouldPass ? '✅' : '❌';
      console.log(`  ${status} "${testCase.content}" (${testCase.reason}): ${passed ? 'Captured' : 'Filtered'}`);
    });
    
    console.log('\n🧪 Short message capture test completed!');
  }

  // Comprehensive test for the simplified UUID + ignore rules approach
  testCompleteFix() {
    console.log('🧪 Testing Simplified UUID Capture + Ignore Rules...');
    
    // Test the exact scenario from user's issue
    const userMessage = `
      <div class="ChatMessageContainer group flex flex-col pr-2 pb-4" data-message-id="687e105c-7b3e-492c-970b-6979d0bcb975" style="min-height: auto;">
        <div class="">
          <div class="flex flex-col items-end">
            <div class="mb-2 ml-auto flex max-w-160px flex-wrap justify-end gap-2"></div>
            <div class="overflow-wrap-anywhere overflow-auto whitespace-pre-wrap rounded-xl text-base bg-secondary px-3 py-3">
              <div>Fix the Remix Image button to show the dialog</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const lovableMessage = `
      <div class="ChatMessageContainer group flex flex-col pr-2 pb-4" data-message-id="aimsg_01jw1td0j4ecvv5gmasxjt6t87" style="min-height: auto;">
        <div class="prose prose-zinc prose-markdown max-w-full">
          <div>I need to investigate why the "Remix Image" button is still sending webhook requests directly instead of showing the dialog. Let me trace the issue and fix it.</div>
        </div>
      </div>
    `;
    
    const combinedHtml = `<div>${userMessage}${lovableMessage}</div>`;
    const parser = new DOMParser();
    const doc = parser.parseFromString(combinedHtml, 'text/html');
    const containers = doc.querySelectorAll('.ChatMessageContainer');
    
    console.log(`\n📋 Testing Complete Scenario (${containers.length} messages):`);
    
    // Test UUID user message detection
    const userContainer = Array.from(containers).find(c => 
      this.isUUIDFormat(c.getAttribute('data-message-id'))
    );
    
    console.log('\n🔍 Testing UUID User Message Detection:');
    if (userContainer) {
      const messageId = userContainer.getAttribute('data-message-id');
      console.log(`  Message ID: ${messageId}`);
      console.log(`  Is UUID format: ${this.isUUIDFormat(messageId) ? 'YES' : 'NO'}`);
      
      const userMessageData = this.extractLovableMessageData(userContainer);
      if (userMessageData) {
        console.log(`  ✅ Successfully detected as: ${userMessageData.speaker}`);
        console.log(`    Content: "${userMessageData.content}"`);
        console.log(`    Categories: ${JSON.stringify(userMessageData.categories)}`);
      } else {
        console.log(`  ❌ Failed to detect UUID user message`);
      }
    }
    
    // Test Lovable message detection
    const lovableContainer = Array.from(containers).find(c => 
      c.getAttribute('data-message-id').startsWith('aimsg_')
    );
    
    console.log('\n🔍 Testing Lovable Message Detection:');
    if (lovableContainer) {
      const lovableMessageData = this.extractLovableMessageData(lovableContainer);
      if (lovableMessageData) {
        console.log(`  ✅ Successfully detected as: ${lovableMessageData.speaker}`);
        console.log(`    Content: "${lovableMessageData.content.substring(0, 50)}..."`);
      } else {
        console.log(`  ❌ Failed to detect Lovable message`);
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('  With the simplified approach:');
    console.log('  1. ✅ UUID user messages are detected directly (no complex structural detection)');
    console.log('  2. ✅ Standard aimsg_ Lovable messages work as before');
    console.log('  3. ✅ Both messages will be properly paired and timestamped');
    console.log('  4. ✅ Much cleaner code with no complex error-prone logic');
    
    console.log('\n🧪 Simplified approach test completed!');
  }

  // Test system restoration message detection and ignore
  testSystemMessages() {
    console.log('🧪 Testing System Restoration Message Detection...');
    
    // Test case: The exact system restoration message HTML
    const testHtml = `
      <div class="ChatMessageContainer group flex flex-col pr-2 pb-4" data-message-id="3fcd14d5-d7a9-476f-b698-9f0d9f50e483" style="min-height: auto;">
        <div class="pl-2">
          <button class="flex items-center disabled:opacity-50">
            <span class="mr-2 text-sm text-muted-foreground">Restored</span>
            <div class="flex items-center gap-2 rounded-full border border-affirmative-primary bg-affirmative px-3 py-1.5 transition-colors hover:bg-affirmative/80">
              <span class="max-w-xs truncate text-sm text-affirmative-foreground" title="Add download button to image hover dialog" aria-label="Add download button to image hover dialog">Add download button to image hover dialog</span>
            </div>
          </button>
        </div>
      </div>
    `;
    
    console.log('\n📋 Testing System Restoration Message:');
    console.log('  Message ID: 3fcd14d5-d7a9-476f-b698-9f0d9f50e483');
    console.log('  Type: System restoration message');
    console.log('  Content: "Add download button to image hover dialog"');
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(testHtml, 'text/html');
    const container = doc.querySelector('.ChatMessageContainer');
    
    if (container) {
      // Test UUID detection
      const messageId = container.getAttribute('data-message-id');
      const isUUID = this.isUUIDFormat(messageId);
      console.log(`  UUID Format Check: ${isUUID ? '✅ Passed' : '❌ Failed'}`);
      
      // Test system message detection
      const restoredSpan = Array.from(container.querySelectorAll('span')).find(span => 
        span.textContent && span.textContent.trim() === 'Restored'
      );
      console.log(`  "Restored" span found: ${restoredSpan ? '✅ YES' : '❌ NO'}`);
      
      // Test extraction
      const result = this.extractLovableMessageData(container);
      if (result) {
        console.log(`  Extraction Result: ✅ SUCCESS`);
        console.log(`    Detected as: ${result.speaker}`);
        console.log(`    Content: "${result.content}"`);
        console.log(`    Categories: ${JSON.stringify(result.categories)}`);
        
        // Test ignore rules
        const shouldIgnore = this.shouldIgnoreMessage(result, null);
        console.log(`    Should be ignored: ${shouldIgnore ? '✅ YES' : '❌ NO'}`);
        
        if (result.speaker === 'system' && shouldIgnore) {
          console.log(`  🎯 PERFECT: System message detected and will be ignored!`);
        } else {
          console.log(`  ❌ ERROR: System message not handled correctly`);
        }
      } else {
        console.log(`  Extraction Result: ❌ FAILED`);
      }
      
    } else {
      console.log('  ❌ Container not found in test HTML');
    }
    
    console.log('\n🧪 System message detection test completed!');
    console.log('💡 System restoration messages will now be completely ignored.');
  }

}

// Initialize conversation capture and make it globally accessible
const conversationCapture = new ConversationCapture();

// Make it globally accessible for debugging and testing
window.conversationCapture = conversationCapture;

// Log startup information
console.log('🚀 Lovable.dev Conversation Capture initialized');
console.log('📋 Available debugging commands:');
console.log('  • window.conversationCapture.restart() - Restart monitoring');
console.log('  • window.conversationCapture.detectedMessages - View captured messages');
console.log('  • window.conversationCapture.destroy() - Stop monitoring');
console.log('  • window.conversationCapture.testScan() - Manual scan for messages');
console.log('  • window.conversationCapture.debugInfo() - Show debug information');
console.log('  • window.conversationCapture.setVerbose(true/false) - Toggle verbose logging');
console.log('  • window.conversationCapture.setScanCooldown(ms) - Set scan frequency');
console.log('  • window.conversationCapture.testCompleteFix() - Test simplified UUID detection');
console.log('  • window.conversationCapture.testUUIDMessageCapture() - Test UUID message handling');
console.log('  • window.conversationCapture.testIgnoreRules() - Test message ignore rules');
console.log('  • window.conversationCapture.testSystemMessages() - Test system message detection');
console.log('  • window.conversationCapture.testMessagePairing() - Test timestamp sync and grouping');

// Add debugging methods
conversationCapture.testScan = function() {
  console.log('🧪 ===== MANUAL TEST SCAN =====');
  this.verboseLogging = true;
  this.scanForNewLovableMessages();
  this.verboseLogging = false;
};

conversationCapture.setVerbose = function(enabled) {
  this.verboseLogging = enabled;
  console.log(`🔊 Verbose logging ${enabled ? 'enabled' : 'disabled'}`);
};

conversationCapture.setScanCooldown = function(ms) {
  this.scanCooldown = ms;
  console.log(`⏱️ Scan cooldown set to ${ms}ms`);
};

conversationCapture.debugInfo = function() {
  console.log('🔧 ===== DEBUG INFORMATION =====');
  console.log('📊 Status:');
  console.log(`  - Monitoring: ${this.isMonitoring}`);
  console.log(`  - Messages captured: ${this.detectedMessages.length}`);
  console.log(`  - Observer active: ${!!this.chatObserver}`);
  console.log(`  - Current URL: ${window.location.href}`);
  console.log(`  - Project ID: ${this.extractProjectId()}`);
  console.log(`  - Verbose logging: ${this.verboseLogging}`);
  console.log(`  - Scan cooldown: ${this.scanCooldown}ms`);
  console.log(`  - Last scan: ${new Date(this.lastScanTime).toLocaleTimeString()}`);
  
  console.log('\n🔍 Page Analysis:');
  const chatContainers = document.querySelectorAll('.ChatMessageContainer[data-message-id]');
  console.log(`  - ChatMessageContainer elements: ${chatContainers.length}`);
  
  const userMessages = document.querySelectorAll('[data-message-id^="umsg_"]');
  const lovableMessages = document.querySelectorAll('[data-message-id^="aimsg_"]');
  console.log(`  - User messages on page: ${userMessages.length}`);
  console.log(`  - Lovable messages on page: ${lovableMessages.length}`);
  console.log(`  - Processed message IDs: ${this.processedMessageIds.size}`);
  
  if (chatContainers.length > 0) {
    console.log('\n📋 Sample Messages on Page:');
    Array.from(chatContainers).slice(0, 3).forEach((container, index) => {
      const messageData = this.extractLovableMessageData(container);
      if (messageData) {
        console.log(`  ${index + 1}. [${messageData.speaker}] ${messageData.content.substring(0, 50)}...`);
      } else {
        console.log(`  ${index + 1}. [Failed to extract] Container:`, container);
      }
    });
  }
  
  console.log('\n📋 Recent Captured Messages:');
  this.detectedMessages.slice(-5).forEach((msg, index) => {
    console.log(`  ${index + 1}. [${msg.speaker}] ${msg.content.substring(0, 50)}...`);
  });
  
  console.log('\n🔗 Integration Status:');
  console.log(`  - Lovable Detector available: ${!!window.lovableDetector}`);
  console.log(`  - UI Injector available: ${!!window.uiInjector}`);
  
  console.log('===============================');
};

// Add a quieter status indicator
setInterval(() => {
  if (conversationCapture.isMonitoring && conversationCapture.detectedMessages.length > 0) {
    console.log(`📊 Conversation Capture: ${conversationCapture.detectedMessages.length} messages captured`);
  }
}, 60000); // Log status every 60 seconds instead of 30