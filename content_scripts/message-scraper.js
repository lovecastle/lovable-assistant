// ===========================
// MESSAGE SCRAPER - EXTRACTED MODULE
// ===========================
// This section handles comprehensive message scraping functionality including:
// - Intelligent scrolling and batch processing for message scraping
// - Advanced scraping functionality with progress tracking
// - Chat container detection using multiple strategies
// - Comprehensive message extraction with deduplication
// - Database saving with concurrent request management
// - State management and cleanup for scraping sessions
// - Integration with simple conversation capture system

// Comprehensive Message Scraper Class
class ComprehensiveMessageScraper {
  constructor(statusDiv, btn) {
    this.statusDiv = statusDiv;
    this.btn = btn;
    this.chatContainer = null;
    this.lastMessageGroupCount = 0;
    this.scrollAttempts = 0;
    this.noNewDataCounter = 0;
    this.maxNoNewDataAttempts = 10; // Stop after 10 scrolls with no new data
    this.scrollDelay = 2000; // Consistent 2-second delay before scrolling
    this.saveSuccessDelay = 2000; // 2-second delay after successful batch saves
    this.pendingSaveDelay = 2000; // 2-second delay for pending save completion
    this.errorDelay = 2000; // 2-second delay for error cases
    this.duplicateDelay = 2000; // 2-second delay for duplicate detection cases
    this.isRunning = false;
    this.hasReachedTop = false;
    this.verboseLogging = false; // Set to true for detailed debugging
    
    // Add tracking for batch save completion
    this.pendingSaves = new Set(); // Track IDs of conversations being saved
    this.batchSavePromises = []; // Track active save promises
    this.saveCompletionCallbacks = new Map(); // Track completion callbacks for saves
    
    // Add cancellation token and request throttling - INITIALIZE ALL SETS
    this.isCancelled = false;
    this.activeRequests = new Set(); // Track active save requests
    this.maxConcurrentRequests = 5; // Limit concurrent requests
    this.requestQueue = []; // Queue for throttled requests
    
    // Enhanced deduplication and persistence tracking - INITIALIZE ALL SETS
    this.processedGroupIds = new Set(); // Track processed groups in current session
    this.scrapedGroupIds = new Set(); // Persistent tracking across sessions
    this.sessionScrapedIds = new Set(); // Track what was scraped in current scraping session
  }

  // Control verbose logging for debugging
  setVerboseLogging(enabled) {
    this.verboseLogging = enabled;
    console.log(`🔧 Verbose logging ${enabled ? 'enabled' : 'disabled'} for scraper`);
  }

  // Clear all scraper internal state for fresh session
  clearScrapingState() {
    // Clear any leftover state from previous runs
    this.activeRequests.clear();
    this.requestQueue = [];
    this.batchSavePromises = [];
    this.pendingSaves.clear();
    this.processedGroupIds.clear();
    this.sessionScrapedIds.clear();
    this.scrapedGroupIds.clear(); // Clear persistent tracking for fresh start
    
    // Reset scraping state
    this.lastMessageGroupCount = 0;
    this.scrollAttempts = 0;
    this.noNewDataCounter = 0;
    this.hasReachedTop = false;
    
    console.log('🧹 Cleared all scraper internal state for fresh session');
  }

  // Reset simpleConversationCapture to prevent reprocessing old groups
  resetSimpleConversationCapture() {
    if (window.simpleConversationCapture) {
      const oldSize = window.simpleConversationCapture.messageGroups?.size || 0;
      
      // Clear message groups to prevent reprocessing
      window.simpleConversationCapture.messageGroups?.clear();
      window.simpleConversationCapture.processedLovableIds?.clear();
      
      // Reset pending group
      window.simpleConversationCapture.pendingGroup = null;
      
      console.log(`🧹 Reset simpleConversationCapture: cleared ${oldSize} message groups`);
    } else {
      console.log('⚠️ simpleConversationCapture not found - skipping reset');
    }
  }

  async startScraping() {
    this.isRunning = true;
    this.isCancelled = false; // Reset cancellation flag for new scraping session
    
    // CRITICAL: Reset all state for clean scraping session
    this.clearScrapingState();
    this.resetSimpleConversationCapture(); // Clear previous session data to prevent reprocessing
    
    this.updateStatus('🔍 Finding chat container...', '#667eea');
    
    // Find the chat container
    this.chatContainer = this.findChatContainer();
    if (!this.chatContainer) {
      throw new Error('Could not find chat container. Make sure you are on a Lovable project page with chat messages.');
    }
    
    this.updateStatus('📝 Recording initial state...', '#667eea');
    
    // Record initial message group count
    await this.recordInitialState();
    
    this.updateStatus('🚀 Starting continuous message scraping...', '#667eea');
    console.log('🚀 Starting continuous message scraping with database saving');
    
    // Start the scraping process
    await this.performComprehensiveScrape();
    
    // Final processing
    await this.finalizeScraping();
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
    
    // Look for Lovable's chat scroll container (legacy and extended selectors)
    const possibleSelectors = [
      // Legacy selectors
      'div.h-full.w-full.overflow-y-auto.scrollbar-thin.scrollbar-track-transparent.scrollbar-thumb-muted-foreground',
      'div[class*="overflow-y-auto"][class*="h-full"]',
      'div[class*="overflow-y-auto"]',
      // New selectors based on observed structure
      'div[style*="overflow-anchor"]',
      'div[style*="visibility: visible"]',
      'main div[class*="flex"] div[class*="overflow"]',
      'div[style*="overflow"]',
      '.group-container > div'
    ];
    
    for (const selector of possibleSelectors) {
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
    return this.findContainerDeepScan();
  }
  
  // Helper method for deep scanning
  findContainerDeepScan() {
    if (this.verboseLogging) {
      console.log('⚠️ Using deep DOM scan to find chat container');
    }
    
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

  async recordInitialState() {
    // Scroll to bottom first to establish baseline
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    await this.wait(500);
    
    // Get initial message group count from simple capture system
    const initialCount = window.simpleConversationCapture?.messageGroups?.size || 0;
    this.lastMessageGroupCount = initialCount;
    
    console.log(`📍 Initial message group count: ${initialCount}`);
  }

  async performComprehensiveScrape() {
    console.log('🚀 Starting continuous scrolling scraping...');
    this.scrollAttempts = 0;
    this.noNewDataCounter = 0;
    this.maxNoNewDataAttempts = 10; // Increased from 5 to 10 attempts
    
    // Start from bottom and scroll up continuously
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    await this.wait(500);
    
    // Record initial state
    const initialCount = window.simpleConversationCapture?.messageGroups?.size || 0;
    this.lastMessageGroupCount = initialCount;
    console.log(`📍 Starting with ${initialCount} message groups`);
    
    while (this.isRunning && !this.hasReachedTop && this.noNewDataCounter < this.maxNoNewDataAttempts) {
      this.scrollAttempts++;
      
      // Get current message group count before scrolling
      const beforeScrollCount = window.simpleConversationCapture?.messageGroups?.size || 0;
      
      this.updateStatus(
        `⬆️ Scroll attempt ${this.scrollAttempts} - Found ${beforeScrollCount} message groups`,
        '#667eea'
      );
      
      // Check if we've reached the top
      if (this.checkIfAtTop()) {
        console.log('🔝 Reached the top of the chat');
        this.hasReachedTop = true;
        break;
      }
      
      // Scroll up to load older messages
      const scrollSuccess = await this.scrollUpAndWait();
      console.log(`📜 Scroll ${this.scrollAttempts}: ${scrollSuccess ? 'Success' : 'Failed'}`);
      
      if (!scrollSuccess) {
        // If scroll failed, we might be at the top
        if (this.checkIfAtTop()) {
          console.log('🔝 Reached the top (scroll failed)');
          this.hasReachedTop = true;
          break;
        }
        // Try alternative scroll methods
        await this.tryAlternativeScrollMethods();
      }
      
      // Wait for new messages to load
      await this.wait(800);
      
      // Trigger scan in simple capture system
      if (window.simpleConversationCapture) {
        window.simpleConversationCapture.scanForNewGroups();
      }
      
      // Wait a bit more for processing
      await this.wait(400);
      
      // Check if we got new message groups and batch them
      const afterScrollCount = window.simpleConversationCapture?.messageGroups?.size || 0;
      
      if (afterScrollCount > beforeScrollCount) {
        // We got new data - collect the new message groups for batch processing
        const newGroupsCount = afterScrollCount - beforeScrollCount;
        console.log(`✅ New data detected: +${newGroupsCount} groups (total: ${afterScrollCount})`);
        this.noNewDataCounter = 0; // Reset counter
        
        // Get the actual new message groups for batch processing
        const messageGroups = window.simpleConversationCapture.messageGroups;
        const messageGroupsArray = Array.from(messageGroups.entries());
        const newGroups = messageGroupsArray.slice(beforeScrollCount); // Get only the new groups
        
        // Process the batch of new message groups
        this.updateStatus(`💾 Processing batch of ${newGroupsCount} new message groups...`, '#48bb78');
        
        const batchResult = await this.processBatchOfMessageGroups(newGroups);
        
        // Show clean summary message
        const successCount = batchResult.saved || 0;
        const skippedCount = batchResult.skipped || 0;
        const errorCount = batchResult.errors || 0;
        const cancelled = batchResult.cancelled || false;
        
        if (cancelled) {
          console.log(`🛑 Batch processing cancelled - scraper stopped`);
          this.updateStatus(`🛑 Processing cancelled by user`, '#f59e0b');
          break; // Exit the main loop immediately
        } else if (successCount > 0) {
          console.log(`✅ Success saved ${successCount}/${newGroupsCount} message groups to the database (${skippedCount} skipped, ${errorCount} errors)`);
          this.updateStatus(`✅ Saved ${successCount}/${newGroupsCount} groups successfully!`, '#48bb78');
        } else if (skippedCount > 0) {
          console.log(`⚠️ Skipped ${skippedCount}/${newGroupsCount} message groups (duplicates)`);
          this.updateStatus(`⚠️ Skipped ${skippedCount}/${newGroupsCount} groups (duplicates)`, '#f6ad55');
        } else {
          console.log(`❌ Failed to save any of ${newGroupsCount} message groups`);
          this.updateStatus(`❌ Failed to save ${newGroupsCount} groups`, '#f56565');
        }
        
        // Ensure all saves are completed before proceeding
        if (this.batchSavePromises.length > 0) {
          console.log(`⏳ Ensuring all ${this.batchSavePromises.length} batch saves are completed...`);
          await Promise.allSettled(this.batchSavePromises);
          this.batchSavePromises = [];
          console.log(`✅ All batch saves verified complete`);
        }
        
        // Add 2-second delay before next scroll to prevent backend overload and missing data
        await this.waitWithCountdown(2000, `⏱️ Batch processing complete! Next scroll in`, '#48bb78');
        
      } else {
        // No new data
        this.noNewDataCounter++;
        console.log(`⚠️ No new data on attempt ${this.scrollAttempts} (${this.noNewDataCounter}/${this.maxNoNewDataAttempts})`);
        
        // If no new data, still wait for any pending saves to complete
        if (this.batchSavePromises.length > 0) {
          console.log(`⏳ No new data, waiting for ${this.batchSavePromises.length} pending saves...`);
          await this.waitWithCountdown(this.pendingSaveDelay, `⏳ Completing pending saves. Next scroll in`, '#f6ad55');
          
          const pendingResults = await Promise.allSettled(this.batchSavePromises);
          this.batchSavePromises = [];
          console.log(`✅ All pending saves completed`);
        } else {
          // Add 2-second delay even when no new data to maintain consistent timing
          await this.waitWithCountdown(2000, `⏱️ No new data found. Next scroll in`, '#f6ad55');
        }
        
        if (this.noNewDataCounter >= this.maxNoNewDataAttempts) {
          console.log(`🛑 No new data after ${this.maxNoNewDataAttempts} scroll attempts, stopping`);
          break;
        }
      }
      
      // Update last count for next iteration
      this.lastMessageGroupCount = afterScrollCount;
    }
    
    // Final comprehensive save of any remaining data
    console.log('🔚 Performing final database save...');
    await this.saveAllRemainingConversations();
  }

  async scrollUpAndWait() {
    const initialScrollTop = this.chatContainer.scrollTop;
    
    console.log(`📜 Starting aggressive scroll to top from position: ${initialScrollTop}px`);
    
    // Method 1: Direct scrollTop assignment (immediate)
    this.chatContainer.scrollTop = 0;
    
    // Method 2: ScrollTo with instant behavior
    this.chatContainer.scrollTo({ 
      top: 0, 
      left: 0, 
      behavior: 'instant' 
    });
    
    // Method 3: Focus and keyboard Home command
    this.chatContainer.focus();
    this.chatContainer.dispatchEvent(new KeyboardEvent('keydown', { 
      key: 'Home', 
      ctrlKey: true,
      bubbles: true
    }));
    
    // Method 4: Manual scrollIntoView on first element (if exists)
    const firstMessage = this.chatContainer.querySelector('.ChatMessageContainer[data-message-id]');
    if (firstMessage) {
      firstMessage.scrollIntoView({ 
        behavior: 'instant', 
        block: 'start' 
      });
    }
    
    // Method 5: Force DOM update and then scroll again
    this.chatContainer.style.scrollBehavior = 'auto';
    await this.wait(100);
    this.chatContainer.scrollTop = 0;
    
    // Wait longer for content to load and lazy loading to trigger
    await this.wait(1200); // Increased wait time
    
    // Final verification and force scroll if needed
    let finalScrollTop = this.chatContainer.scrollTop;
    if (finalScrollTop > 50) {
      console.log(`🔄 First attempt resulted in ${finalScrollTop}px, forcing additional scroll...`);
      
      // Force additional scroll attempts
      for (let i = 0; i < 3; i++) {
        this.chatContainer.scrollTop = 0;
        this.chatContainer.scrollTo({ top: 0, behavior: 'instant' });
        await this.wait(300);
        finalScrollTop = this.chatContainer.scrollTop;
        
        if (finalScrollTop <= 10) {
          console.log(`✅ Reached top after ${i + 1} additional attempts`);
          break;
        }
      }
    }
    
    const totalScrolled = initialScrollTop - finalScrollTop;
    const scrollChanged = Math.abs(totalScrolled) > 10;
    
    if (scrollChanged) {
      console.log(`⬆️ Aggressive scroll completed: ${initialScrollTop} → ${finalScrollTop}px (scrolled ${totalScrolled}px)`);
      return true;
    } else {
      console.log(`⚠️ Minimal scroll change: ${initialScrollTop} → ${finalScrollTop}px (may be at top already)`);
      return finalScrollTop <= 10; // Consider success if we're very close to top
    }
  }

  async tryAlternativeScrollMethods() {
    console.log('🔄 Trying alternative scroll methods...');
    
    // Method 1: Try jumping to absolute top
    const beforeTop = this.chatContainer.scrollTop;
    this.chatContainer.scrollTop = 0;
    await this.wait(400);
    
    // Method 2: Try keyboard simulation  
    this.chatContainer.focus();
    this.chatContainer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', ctrlKey: true }));
    await this.wait(300);
    
    // Method 3: Try scrollTo with behavior
    this.chatContainer.scrollTo({ top: 0, behavior: 'smooth' });
    await this.wait(400);
    
    const afterTop = this.chatContainer.scrollTop;
    console.log(`🔄 Alternative scroll: ${beforeTop} → ${afterTop}`);
  }

  async processBatchOfMessageGroups(newGroups) {
    const batchSize = newGroups.length;
    if (batchSize === 0) {
      return { success: true, saved: 0, errors: 0, skipped: 0 };
    }
    
    // Check if scraping was stopped
    if (!this.isRunning) {
      console.log('🛑 Batch processing cancelled - scraper stopped');
      return { success: false, saved: 0, errors: 0, skipped: 0, cancelled: true };
    }
    
    // Filter out already processed groups to prevent duplicates
    const unprocessedGroups = newGroups.filter(([groupId, group]) => {
      // Skip if processed in current session
      if (this.processedGroupIds.has(groupId)) {
        if (this.verboseLogging) {
          console.log(`⚠️ Skipping already processed in session: ${groupId}`);
        }
        return false;
      }
      
      // Skip if already scraped by manual scraper in previous sessions
      if (this.scrapedGroupIds.has(groupId)) {
        if (this.verboseLogging) {
          console.log(`⚠️ Skipping previously scraped group: ${groupId}`);
        }
        return false;
      }
      
      // Skip if it was auto-captured (check if lovableId exists in auto-capture tracking)
      if (group.lovableId && this.wasAutoCaptured(group.lovableId)) {
        if (this.verboseLogging) {
          console.log(`⚠️ Skipping auto-captured group: ${groupId}`);
        }
        return false;
      }
      
      return true;
    });
    
    const actualBatchSize = unprocessedGroups.length;
    
    if (actualBatchSize === 0) {
      console.log('📝 All groups in batch already processed - skipping');
      return { success: true, saved: 0, errors: 0, skipped: batchSize };
    }
    
    console.log(`🔍 Processing batch of ${actualBatchSize} unprocessed message groups (${batchSize - actualBatchSize} already processed)...`);
    
    let savedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process each message group in the batch
    const savePromises = [];
    
    for (const [groupId, group] of unprocessedGroups) {
      // Check if scraping was stopped before each save
      if (!this.isRunning) {
        console.log('🛑 Stopping batch processing - scraper stopped');
        break;
      }
      
      // Mark as being processed
      this.processedGroupIds.add(groupId);
      
      const savePromise = this.saveConversationGroup(groupId, group)
        .then(result => {
          if (result === true) {
            savedCount++;
          } else if (result === 'skipped') {
            skippedCount++;
          } else if (result === 'cancelled') {
            // Don't count cancelled requests in error count
            return result;
          } else {
            errorCount++;
          }
          return result;
        })
        .catch(error => {
          errorCount++;
          console.error(`❌ Error in batch processing for ${groupId}:`, error);
          return false;
        });
      
      savePromises.push(savePromise);
      
      // Small delay between starting saves to prevent overwhelming
      await this.wait(50);
    }
    
    // Wait for all saves in this batch to complete
    console.log(`⏳ Waiting for all ${savePromises.length} saves in batch to complete...`);
    await Promise.allSettled(savePromises);
    
    // Return batch results
    const result = {
      success: errorCount === 0,
      saved: savedCount,
      errors: errorCount,
      skipped: skippedCount + (batchSize - actualBatchSize), // Include already processed groups
      total: batchSize
    };
    
    console.log(`✅ Batch processing complete: ${savedCount} saved, ${skippedCount + (batchSize - actualBatchSize)} skipped, ${errorCount} errors`);
    return result;
  }

  async saveAllRemainingConversations() {
    try {
      console.log('💾 Final save: Ensuring all conversations are in database...');
      
      if (!window.simpleConversationCapture?.messageGroups) {
        console.warn('⚠️ No message groups found for final save');
        return;
      }

      const messageGroups = window.simpleConversationCapture.messageGroups;
      let savedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      this.updateStatus(`💾 Final save: Processing ${messageGroups.size} conversations...`, '#48bb78');

      // Save all conversations (with duplicate checking)
      for (const [groupId, group] of messageGroups) {
        try {
          const success = await this.saveConversationGroup(groupId, group, true); // Force save
          if (success === true) {
            savedCount++;
          } else if (success === 'skipped') {
            skippedCount++;
          } else {
            errorCount++;
          }

          // Update progress every 10 items
          if ((savedCount + errorCount + skippedCount) % 10 === 0) {
            this.updateStatus(
              `💾 Final save: ${savedCount} saved, ${skippedCount} skipped, ${errorCount} errors`, 
              '#48bb78'
            );
          }

          // Small delay
          await this.wait(100);

        } catch (error) {
          errorCount++;
          console.error(`❌ Error in final save for ${groupId}:`, error);
        }
      }

      // Final status update
      this.updateStatus(
        `✅ Final save complete! ${savedCount} saved, ${skippedCount} skipped, ${errorCount} errors`,
        '#48bb78'
      );
      
      console.log(`✅ Final database save complete: ${savedCount} saved, ${skippedCount} already existed, ${errorCount} errors`);

    } catch (error) {
      console.error('❌ Final database save operation failed:', error);
      this.updateStatus('❌ Final save failed: ' + error.message, '#f56565');
    }
  }

  wasAutoCaptured(lovableId) {
    // Check if this lovableId was processed by auto-capture
    return window.simpleConversationCapture?.processedLovableIds?.has(lovableId) || false;
  }

  async saveConversationGroup(groupId, group, forceSave = false) {
    try {
      // Check if scraping was stopped (unless forced)
      if (!forceSave && !this.isRunning) {
        console.log(`🛑 Save cancelled for ${groupId} - scraper stopped`);
        return 'cancelled';
      }
      
      // Only show minimal debug info for batch processing
      if (this.verboseLogging) {
        console.log(`🔍 Processing ${groupId}: userContent=${group.userContent?.length || 0}chars, lovableContent=${group.lovableContent?.length || 0}chars`);
      }

      // Prepare conversation data for database with proper UUID - same structure as auto-capture with HTML support
      const conversationData = {
        id: this.generateUUID(), // Always generate a proper UUID for database
        projectId: this.extractProjectId(),
        // Fix: Use correct property names from conversation capture
        userMessage: group.userContent || group.userMessage?.content || '',
        lovableResponse: group.lovableContent || group.lovableMessage?.content || '',
        timestamp: group.timestamp || new Date().toISOString(),
        projectContext: {
          messageGroupId: groupId, // Keep original groupId in context
          userId: group.userId,
          lovableId: group.lovableId,
          autoCapture: false, // This is from scraping, not auto-capture
          contentFormat: 'html' // Indicate this is HTML formatted content
        },
        categories: this.extractCategoriesFromGroup(group)
      };

      // Only save if we have meaningful content
      if (!conversationData.userMessage && !conversationData.lovableResponse) {
        if (this.verboseLogging) {
          console.warn(`⚠️ Skipping empty conversation group: ${groupId}`);
        }
        return 'skipped';
      }

      // Send to background script for database saving
      const response = await this.safeSendMessage({
        action: 'saveConversation',
        data: conversationData
      });

      if (response?.success) {
        if (response.skipped) {
          // Duplicate detected - this is expected with unique constraints
          return 'skipped';
        } else {
          // Successfully saved new conversation - track it
          this.sessionScrapedIds.add(groupId);
          this.processedGroupIds.add(groupId);
          return true;
        }
      } else {
        if (this.verboseLogging) {
          console.warn(`❌ Failed to save conversation ${groupId}: ${response?.error || 'Unknown error'}`);
        }
        return false;
      }

    } catch (error) {
      if (this.verboseLogging) {
        console.error(`❌ Error saving conversation group ${groupId}:`, error);
      }
      return false;
    }
  }

  checkIfAtTop() {
    return this.chatContainer.scrollTop <= 5; // Small threshold for rounding errors
  }

  async saveMessagesToDatabase() {
    try {
      console.log('💾 Starting database save operation...');
      
      if (!window.simpleConversationCapture?.messageGroups) {
        console.warn('⚠️ No message groups found to save');
        this.updateStatus('⚠️ No messages to save', '#f56565');
        return;
      }

      const messageGroups = window.simpleConversationCapture.messageGroups;
      const projectId = this.extractProjectId();
      let savedCount = 0;
      let errorCount = 0;

      this.updateStatus(`💾 Saving ${messageGroups.size} conversations...`, '#48bb78');

      // Process each message group
      for (const [groupId, group] of messageGroups) {
        try {
          // Prepare conversation data for database
          const conversationData = {
            id: this.generateUUID(),
            projectId: projectId,
            userMessage: group.userMessage?.content || '',
            lovableResponse: group.lovableMessage?.content || '',
            timestamp: group.userMessage?.timestamp || group.lovableMessage?.timestamp || new Date().toISOString(),
            projectContext: {
              url: window.location.href,
              projectId: projectId,
              scrapedAt: new Date().toISOString(),
              messageGroupId: groupId
            },
            tags: this.extractTagsFromMessages(group),
            effectivenessScore: null // Will be calculated later if needed
          };

          // Send to background script for database saving
          const response = await this.safeSendMessage({
            action: 'saveConversation',
            data: conversationData
          });

          if (response?.success) {
            savedCount++;
            console.log(`✅ Saved conversation ${savedCount}/${messageGroups.size}`);
          } else {
            errorCount++;
            console.warn(`❌ Failed to save conversation: ${response?.error || 'Unknown error'}`);
          }

          // Update progress
          if (savedCount % 5 === 0) {
            this.updateStatus(`💾 Saved ${savedCount}/${messageGroups.size} conversations...`, '#48bb78');
          }

          // Small delay to prevent overwhelming the API
          await this.wait(100);

        } catch (error) {
          errorCount++;
          console.error(`❌ Error saving conversation:`, error);
        }
      }

      // Final status update
      if (savedCount > 0) {
        this.updateStatus(
          `✅ Database save complete! Saved ${savedCount} conversations${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
          '#48bb78'
        );
        console.log(`✅ Database save complete: ${savedCount} saved, ${errorCount} errors`);
      } else {
        this.updateStatus('❌ No conversations were saved to database', '#f56565');
        console.warn('❌ No conversations were saved to database');
      }

    } catch (error) {
      console.error('❌ Database save operation failed:', error);
      this.updateStatus('❌ Database save failed: ' + error.message, '#f56565');
    }
  }

  extractCategoriesFromGroup(group) {
    const categories = [];
    
    // Extract categories from group categories (if available)
    if (group.categories) {
      if (group.categories.primary) {
        categories.push(...group.categories.primary);
      }
      if (group.categories.secondary) {
        categories.push(...group.categories.secondary);
      }
    }
    
    // Extract categories from legacy message structure (fallback)
    if (group.userMessage?.categories) {
      categories.push(...group.userMessage.categories.primary);
      categories.push(...group.userMessage.categories.secondary);
    }
    
    if (group.lovableMessage?.categories) {
      categories.push(...group.lovableMessage.categories.primary);
      categories.push(...group.lovableMessage.categories.secondary);
    }
    
    // Remove duplicates and empty values, ensure first item is priority
    const uniqueCategories = [...new Set(categories.filter(cat => cat && cat.trim()))];
    
    // Ensure priority categories come first
    const priorityOrder = ['Planning', 'Functioning', 'Designing', 'Debugging', 'Deployment'];
    const sorted = [];
    
    // Add priority categories first
    priorityOrder.forEach(priority => {
      if (uniqueCategories.includes(priority)) {
        sorted.push(priority);
      }
    });
    
    // Add remaining categories
    uniqueCategories.forEach(cat => {
      if (!priorityOrder.includes(cat)) {
        sorted.push(cat);
      }
    });
    
    return sorted;
  }

  extractTagsFromGroup(group) {
    // Legacy method - redirect to new method
    return this.extractCategoriesFromGroup(group);
  }

  extractTagsFromMessages(group) {
    // Legacy method - redirect to new method
    return this.extractCategoriesFromGroup(group);
  }

  extractProjectId() {
    const url = window.location.href;
    const match = url.match(/\/projects\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async safeSendMessage(message) {
    // Check if scraper was cancelled before sending
    if (this.isCancelled || !this.isRunning) {
      console.log('🛑 Request cancelled before sending:', message.action);
      return { success: false, error: 'Request cancelled', cancelled: true };
    }

    // Check concurrent request limit
    if (this.activeRequests.size >= this.maxConcurrentRequests) {
      console.log(`⏳ Request queued (${this.activeRequests.size}/${this.maxConcurrentRequests} active):`, message.action);
      return this.queueRequest(message);
    }

    return this.executeRequest(message);
  }

  async queueRequest(message) {
    return new Promise((resolve) => {
      this.requestQueue.push({ message, resolve });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.requestQueue.length === 0 || this.activeRequests.size >= this.maxConcurrentRequests) {
      return;
    }

    const { message, resolve } = this.requestQueue.shift();
    
    // Check cancellation again before processing queued request
    if (this.isCancelled || !this.isRunning) {
      resolve({ success: false, error: 'Request cancelled', cancelled: true });
      return;
    }

    this.executeRequest(message).then(resolve);
  }

  async executeRequest(message) {
    const requestId = `${message.action}_${Date.now()}_${Math.random()}`;
    this.activeRequests.add(requestId);

    try {
      // Final cancellation check before sending
      if (this.isCancelled || !this.isRunning) {
        return { success: false, error: 'Request cancelled', cancelled: true };
      }

      // Only log if verbose mode is enabled
      if (this.verboseLogging) {
        console.log('🔍 Content Script: Sending message to background:', {
          action: message.action,
          dataId: message.data?.id,
          dataKeys: message.data ? Object.keys(message.data) : []
        });
      }
      
      const response = await chrome.runtime.sendMessage(message);
      
      // Only log if verbose mode is enabled
      if (this.verboseLogging) {
        console.log('🔍 Content Script: Received response from background:', {
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
    } finally {
      this.activeRequests.delete(requestId);
      
      // Process next item in queue
      setTimeout(() => this.processQueue(), 10);
    }
  }

  async finalizeScraping() {
    this.isRunning = false;
    
    console.log('🔚 Finalizing scraping process...');
    
    // Wait for any remaining batch save promises to complete
    if (this.batchSavePromises.length > 0) {
      console.log(`⏳ Waiting for ${this.batchSavePromises.length} remaining batch saves to complete...`);
      this.updateStatus(`⏳ Completing final ${this.batchSavePromises.length} batch saves...`, '#f59e0b');
      
      await Promise.allSettled(this.batchSavePromises);
      this.batchSavePromises = [];
      console.log('✅ All batch saves completed');
    }
    
    // Wait for any individual pending saves to complete
    if (this.pendingSaves.size > 0) {
      console.log(`⏳ Waiting for ${this.pendingSaves.size} individual pending saves to complete...`);
      this.updateStatus(`⏳ Completing final ${this.pendingSaves.size} individual saves...`, '#f59e0b');
      
      // Wait up to 30 seconds for pending saves to complete
      let waitTime = 0;
      const maxWaitTime = 30000; // 30 seconds
      
      while (this.pendingSaves.size > 0 && waitTime < maxWaitTime) {
        await this.wait(500);
        waitTime += 500;
        
        if (waitTime % 5000 === 0) { // Log every 5 seconds
          console.log(`⏳ Still waiting for ${this.pendingSaves.size} saves to complete... (${waitTime/1000}s elapsed)`);
        }
      }
      
      if (this.pendingSaves.size > 0) {
        console.warn(`⚠️ Timeout: ${this.pendingSaves.size} saves still pending after ${maxWaitTime/1000}s`);
      } else {
        console.log('✅ All individual pending saves completed');
      }
    }
    
    // Final scan to ensure we captured everything
    if (window.simpleConversationCapture) {
      console.log('🔍 Final scan for any remaining messages...');
      window.simpleConversationCapture.scanForNewGroups();
      await this.wait(1000); // Give time for final scan
    }
    
    // Get final count
    const finalCount = window.simpleConversationCapture?.messageGroups?.size || 0;
    
    console.log(`🎉 Scraping complete! Total message groups captured: ${finalCount}`);
    
    this.updateStatus(
      `🎉 Scraping complete! Found ${finalCount} message groups. All data saved to database.`,
      '#48bb78'
    );
    
    // Refresh history if available
    if (window.lovableDetector && window.lovableDetector.loadHistoryMessages) {
      console.log('🔄 Refreshing history view...');
      await window.lovableDetector.loadHistoryMessages();
    }
    
    // Reset UI elements
    this.btn.disabled = false;
    this.btn.textContent = 'Scrape All Messages';
    this.btn.style.display = 'inline-block';
    
    // Hide stop button
    const stopBtn = document.getElementById('stop-scraping-btn');
    if (stopBtn) stopBtn.style.display = 'none';
    
    // Clear status after 10 seconds and hide status area
    setTimeout(() => {
      if (this.statusDiv) {
        this.statusDiv.style.display = 'none';
      }
    }, 10000);
  }

  // Helper method to wait for all pending operations
  async waitForAllPendingOperations() {
    console.log(`⏳ Ensuring all operations complete. Batch saves: ${this.batchSavePromises.length}, Individual saves: ${this.pendingSaves.size}`);
    
    // Wait for batch saves
    if (this.batchSavePromises.length > 0) {
      await Promise.allSettled(this.batchSavePromises);
      this.batchSavePromises = [];
    }
    
    // Wait for individual saves with timeout
    let waitTime = 0;
    const maxWaitTime = 15000; // 15 seconds
    
    while (this.pendingSaves.size > 0 && waitTime < maxWaitTime) {
      await this.wait(200);
      waitTime += 200;
    }
    
    if (this.pendingSaves.size > 0) {
      console.warn(`⚠️ ${this.pendingSaves.size} saves still pending after ${maxWaitTime/1000}s wait`);
    }
    
    console.log('✅ All tracked operations completed');
  }

  updateStatus(message, color = '#4a5568') {
    if (this.statusDiv) {
      this.statusDiv.innerHTML = `<span style="color: ${color};">${message}</span>`;
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitWithCountdown(ms, message, color = '#667eea') {
    const totalSeconds = Math.ceil(ms / 1000);
    for (let remaining = totalSeconds; remaining > 0; remaining--) {
      const statusMessage = `${message} ${remaining}s...`;
      this.updateStatus(statusMessage, color);
      await this.wait(1000);
    }
  }

  // Method to stop scraping if needed
  stop() {
    console.log('🛑 Manually stopping scraper...');
    this.isRunning = false;
    this.isCancelled = true; // Set cancellation flag
    
    // Update status
    this.updateStatus('🛑 Scraping stopped by user. Cleaning up state...', '#f59e0b');
    
    // Cancel all pending requests in queue
    while (this.requestQueue.length > 0) {
      const { resolve } = this.requestQueue.shift();
      resolve({ success: false, error: 'Request cancelled', cancelled: true });
    }
    
    // Clear all state immediately for clean restart
    this.clearScrapingState(); // Clear scraper state
    this.resetSimpleConversationCapture(); // Clear capture storage to prevent reprocessing
    
    const cancelledCount = this.pendingSaves.size + this.batchSavePromises.length;
    console.log(`🛑 Cancelled ${cancelledCount} pending operations and cleared all state`);
    
    // Immediate cleanup
    this.cleanupAfterStop();
  }

  cleanupAfterStop() {
    // Ensure all state is cleared for immediate clean restart capability
    this.clearScrapingState();
    this.resetSimpleConversationCapture();
    
    // Reset UI
    this.btn.disabled = false;
    this.btn.textContent = 'Scrape All Messages';
    this.btn.style.display = 'inline-block';
    
    const stopBtn = document.getElementById('stop-scraping-btn');
    if (stopBtn) stopBtn.style.display = 'none';
    
    // Update final status
    this.updateStatus(
      `🛑 Scraping stopped. All state cleared for clean restart.`,
      '#f59e0b'
    );
    
    // Hide status after 5 seconds
    setTimeout(() => {
      if (this.statusDiv) {
        this.statusDiv.style.display = 'none';
      }
    }, 5000);
  }
}

// Make the class globally available
window.ComprehensiveMessageScraper = ComprehensiveMessageScraper;