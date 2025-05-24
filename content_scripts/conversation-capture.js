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
    this.scanCooldown = 5000; // 5 seconds between scans (user requested)
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
      console.log('🔍 ===== SCANNING FOR LOVABLE MESSAGES =====');
    }
    
    // Find all Lovable message containers
    const messageContainers = document.querySelectorAll('.ChatMessageContainer[data-message-id]');
    
    if (messageContainers.length === 0) {
      if (this.verboseLogging) {
        console.log('⚠️ No ChatMessageContainer elements found! Check if the page has loaded completely.');
      }
      return;
    }
    
    // Process messages in order to maintain conversation flow
    const messagesInOrder = Array.from(messageContainers).sort((a, b) => {
      const aTop = this.getElementTop(a);
      const bTop = this.getElementTop(b);
      return aTop - bTop;
    });
    
    let newMessagesCount = 0;
    let ignoredMessagesCount = 0;
    let duplicateMessagesCount = 0;
    let lastProcessedMessage = null;
    
    messagesInOrder.forEach((container, index) => {
      const messageData = this.extractLovableMessageData(container);
      if (messageData) {
        // Quick duplicate check using message ID
        if (this.processedMessageIds.has(messageData.id)) {
          duplicateMessagesCount++;
          return; // Skip already processed messages
        }
        
        // Check if we should ignore this message
        if (!this.shouldIgnoreMessage(messageData, lastProcessedMessage)) {
          if (!this.isDuplicateMessage(messageData)) {
            this.detectedMessages.push(messageData);
            this.processedMessageIds.add(messageData.id);
            this.processDetectedMessage(messageData);
            newMessagesCount++;
            
            if (this.verboseLogging) {
              console.log(`✅ Message ${index + 1} processed: [${messageData.speaker}] ${messageData.content.substring(0, 30)}...`);
            }
          } else {
            duplicateMessagesCount++;
          }
        } else {
          ignoredMessagesCount++;
          if (this.verboseLogging) {
            console.log(`🚫 Message ${index + 1} ignored - automated/unwanted`);
          }
        }
        
        // Update last processed message regardless of whether it was ignored
        lastProcessedMessage = messageData;
      }
    });
    
    // Apply message pairing logic after processing all messages
    if (newMessagesCount > 0) {
      this.applyMessagePairing();
    }
    
    // Only show summary if there were new messages or in verbose mode
    if (newMessagesCount > 0 || this.verboseLogging) {
      console.log(`📊 Scan Summary: ${newMessagesCount} new | ${ignoredMessagesCount} ignored | ${duplicateMessagesCount} duplicates | Total: ${this.detectedMessages.length}`);
    }
  }

  getElementTop(element) {
    // Get the top position from inline styles or computed position
    const style = element.getAttribute('style') || '';
    const topMatch = style.match(/top:\s*([0-9.]+)px/);
    return topMatch ? parseFloat(topMatch[1]) : 0;
  }

  shouldIgnoreMessage(messageData, lastProcessedMessage) {
    // Ignore automated deployment error messages
    if (messageData.speaker === 'user') {
      // Check for the specific automated message pattern
      if (messageData.content.startsWith('I\'ve made some changes in the code') ||
          messageData.content.startsWith('I have made some changes in the code') ||
          messageData.content.startsWith('For the code present, I get the error below.')) {
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
           lastProcessedMessage.content.startsWith('For the code present, I get the error below.'))) {
        if (this.verboseLogging) {
          console.log('🚫 Ignoring Lovable response to automated deployment error message');
        }
        return true;
      }
    }
    
    return false;
  }

  applyMessagePairing() {
    // Apply pairing logic: Lovable responses inherit categories from preceding user messages
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
        
        console.log(`🔗 Paired Lovable response with user message categories:`, currentMessage.categories);
      }
    }
  }

  extractLovableMessageData(container) {
    const messageId = container.getAttribute('data-message-id');
    if (!messageId) return null;

    // Determine speaker based on message ID prefix
    const speaker = messageId.startsWith('umsg_') ? 'user' : 
                  messageId.startsWith('aimsg_') ? 'lovable' : 'unknown';

    // Extract content based on speaker
    let content = '';
    let timestamp = null;

    if (speaker === 'user') {
      content = this.extractUserMessageContent(container);
    } else if (speaker === 'lovable') {
      content = this.extractLovableMessageContent(container);
      timestamp = this.extractLovableTimestamp(container);
    }

    if (!content || content.length < 10) return null;

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

  extractUserMessageContent(container) {
    // Based on the provided HTML structure - user messages are in specific div with classes
    const contentSelectors = [
      '.overflow-wrap-anywhere.overflow-auto.whitespace-pre-wrap.rounded-xl',
      '.overflow-wrap-anywhere.whitespace-pre-wrap',
      '.overflow-wrap-anywhere',
      '.whitespace-pre-wrap'
    ];
    
    for (const selector of contentSelectors) {
      const contentDiv = container.querySelector(selector);
      if (contentDiv) {
        const content = contentDiv.textContent.trim();
        if (this.verboseLogging) {
          console.log(`✅ Extracted user content using: ${selector}`);
          console.log(`📝 User content: "${content.substring(0, 100)}..."`);
        }
        return content;
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

  extractLovableMessageContent(container) {
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
    try {
      const response = await chrome.runtime.sendMessage({
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
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
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

  // Method to manually test parsing with sample HTML
  testParsing(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const containers = doc.querySelectorAll('.ChatMessageContainer[data-message-id]');
    
    const results = [];
    containers.forEach(container => {
      const messageData = this.extractLovableMessageData(container);
      if (messageData) {
        results.push(messageData);
      }
    });
    
    return results;
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