// ===========================
// CONVERSATION HISTORY - EXTRACTED MODULE
// ===========================
// This section handles loading, filtering, searching, and displaying conversation history
// This section manages the conversation history view and all related functionality including:
// - Loading conversation data from the database
// - Filtering and searching through messages
// - Rendering messages in the UI
// - Highlighting search results
// - Navigation through search matches
// - Message categorization and formatting

// Create ConversationHistory class that will be mixed into LovableDetector
window.ConversationHistory = {
  showConversationHistory() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '📚 Lovable\'s Chat History';
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div id="chat-messages" style="
        flex: 1; overflow-y: auto; padding: 10px; background: #f8fafc;
        display: flex; flex-direction: column;
      ">
        <!-- Chat messages will be loaded here -->
      </div>
      
      <div style="
        border-top: 1px solid #c9cfd7; padding: 10px; background: white;
        border-radius: 0 0 12px 12px;
      ">
        <!-- Back Button Top Right -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;
          ">← Back</button>
          <div style="color: #718096; font-size: 12px;">
            <span id="message-count">0</span>
          </div>
        </div>
        
        <!-- Filter Section - Single Line -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="color: #4a5568; font-size: 14px; font-weight: 500; white-space: nowrap;">
            Filter by:
          </div>
          <select id="date-filter" style="
            padding: 6px 8px; border: 1px solid #c9cfd7; border-radius: 6px;
            font-size: 14px; background: white; color: #4a5568; min-width: 80px;
          ">
            <option value="all">Date</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          
          <select id="category-filter" style="
            padding: 6px 8px; border: 1px solid #c9cfd7; border-radius: 6px;
            font-size: 14px; background: white; color: #4a5568; min-width: 90px;
          ">
            <option value="all">Category</option>
            <option value="coding">🔧 Coding</option>
            <option value="debugging">🐛 Debugging</option>
            <option value="design">🎨 Design</option>
            <option value="deployment">🚀 Deployment</option>
            <option value="planning">📋 Planning</option>
            <option value="other">📁 Other</option>
          </select>
          
          <select id="speaker-filter" style="
            padding: 6px 8px; border: 1px solid #c9cfd7; border-radius: 6px;
            font-size: 14px; background: white; color: #4a5568; min-width: 80px;
          ">
            <option value="all">Speaker</option>
            <option value="user">👤 You</option>
            <option value="lovable">🤖 Lovable</option>
          </select>
        </div>
        
        <!-- Search Section with Navigation -->
        <div style="display: flex; gap: 8px;">
          <input type="text" id="search-input" placeholder="Search in conversations..." style="
            flex: 1; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
            font-family: inherit; font-size: 14px; outline: none; background: white; color: #2d3748;
          ">
          <button id="search-prev-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; min-width: 50px;
          " disabled>Back</button>
          <button id="search-next-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; min-width: 50px;
          " disabled>Next</button>
        </div>
      </div>
    `;
    
    this.setupBackButton();
    this.setupHistoryFilters();
    this.loadHistoryMessages();
  },

  setupHistoryFilters() {
    const searchPrevBtn = document.getElementById('search-prev-btn');
    const searchNextBtn = document.getElementById('search-next-btn');
    const searchInput = document.getElementById('search-input');
    
    // Initialize search navigation
    this.currentSearchIndex = 0;
    this.searchMatches = [];
    
    // Bind methods to ensure proper context
    const applyFilters = this.applyHistoryFilters.bind(this);
    const navigateSearchPrev = () => this.navigateSearch(-1);
    const navigateSearchNext = () => this.navigateSearch(1);
    
    // Search navigation
    if (searchPrevBtn) {
      searchPrevBtn.addEventListener('click', navigateSearchPrev);
    }
    
    if (searchNextBtn) {
      searchNextBtn.addEventListener('click', navigateSearchNext);
    }
    
    // Real-time search
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(applyFilters, 300));
    }
    
    // Auto-apply on filter change
    const filters = ['date-filter', 'category-filter', 'speaker-filter'];
    filters.forEach(filterId => {
      const element = document.getElementById(filterId);
      if (element) {
        element.addEventListener('change', applyFilters);
      }
    });
  },

  navigateSearch(direction) {
    if (this.searchMatches.length === 0) return;
    
    this.currentSearchIndex += direction;
    
    if (this.currentSearchIndex < 0) {
      this.currentSearchIndex = this.searchMatches.length - 1;
    } else if (this.currentSearchIndex >= this.searchMatches.length) {
      this.currentSearchIndex = 0;
    }
    
    // Scroll to the current match
    const currentMatch = this.searchMatches[this.currentSearchIndex];
    if (currentMatch) {
      currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight current match
      this.highlightCurrentMatch();
    }
    
    this.updateSearchNavigation();
  },

  updateSearchNavigation() {
    const prevBtn = document.getElementById('search-prev-btn');
    const nextBtn = document.getElementById('search-next-btn');
    
    if (this.searchMatches.length === 0) {
      if (prevBtn) {
        prevBtn.disabled = true;
        prevBtn.textContent = 'Back';
        prevBtn.style.opacity = '0.5';
      }
      if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.textContent = 'Next';
        nextBtn.style.opacity = '0.5';
      }
    } else {
      if (prevBtn) {
        prevBtn.disabled = false;
        prevBtn.textContent = `Back`;
        prevBtn.style.opacity = '1';
      }
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.textContent = `Next`;
        nextBtn.style.opacity = '1';
      }
      
      // Update the message count to show search progress
      const countElement = document.getElementById('message-count');
      const searchInput = document.getElementById('search-input');
      const searchTerm = searchInput?.value.trim();
      
      if (countElement && searchTerm) {
        const currentPos = this.currentSearchIndex + 1;
        const totalMatches = this.searchMatches.length;
        countElement.innerHTML = `${this.filteredHistoryMessages.length} messages found • <strong>${currentPos}/${totalMatches}</strong> matches`;
      }
    }
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  async loadHistoryMessages() {
    console.log('📚 Loading history messages from Supabase database...');
    
    // Load conversations from Supabase database only
    this.allHistoryMessages = [];
    
    try {
      const projectId = this.extractProjectId();
      if (!projectId) {
        console.warn('⚠️ No project ID found - make sure you are on a Lovable.dev project page');
        this.allHistoryMessages = [];
        this.filteredHistoryMessages = [];
        this.renderHistoryMessages();
        return;
      }

      const response = await this.safeSendMessage({
        action: 'getConversations',
        filters: {
          projectId: projectId,
          limit: 1000 // Get more conversations for full history
        }
      });

      if (response?.success && response.data) {
        console.log(`📊 Retrieved ${response.data.length} conversations from database`);
        
        // Convert database conversations to message format
        const allMessages = [];
        
        response.data.forEach(conversation => {
          // Add user message if exists
          if (conversation.user_message) {
            allMessages.push({
              id: `user_${conversation.id}`,
              timestamp: new Date(conversation.timestamp),
              speaker: 'user',
              content: conversation.user_message,
              category: this.extractCategoryFromTags(conversation.tags),
              categories: this.convertTagsToCategories(conversation.tags),
              isDetected: true,
              techTerms: [],
              projectId: conversation.project_id,
              conversationId: conversation.id
            });
          }
          
          // Add lovable message if exists
          if (conversation.lovable_response) {
            allMessages.push({
              id: `lovable_${conversation.id}`,
              timestamp: new Date(conversation.timestamp),
              speaker: 'lovable',
              content: conversation.lovable_response,
              category: this.extractCategoryFromTags(conversation.tags),
              categories: this.convertTagsToCategories(conversation.tags),
              isDetected: true,
              techTerms: [],
              projectId: conversation.project_id,
              conversationId: conversation.id
            });
          }
        });
        
        this.allHistoryMessages = allMessages;
        console.log(`📚 Loaded ${allMessages.length} messages from ${response.data.length} conversations`);
      } else {
        console.error('❌ Failed to load conversations from database:', response?.error);
        throw new Error(`Database load failed: ${response?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error loading conversations from database:', error);
      // Don't fallback to local storage - let the error surface
      this.allHistoryMessages = [];
      // Instead of throwing, just show empty state
      console.warn('⚠️ Could not load conversations from database, showing empty state');
    }
    
    // If no messages found, that's fine - just show empty state
    if (this.allHistoryMessages.length === 0) {
      console.log('📝 No conversation history found in database. Use "Scrape All Messages" or have conversations to populate history.');
    }
    
    // Sort all messages by timestamp (chronological order: oldest first)
    this.allHistoryMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    this.filteredHistoryMessages = [...this.allHistoryMessages];
    this.renderHistoryMessages();
  },

  extractCategoryFromTags(tags) {
    if (!tags || tags.length === 0) return 'other';
    
    const mapping = {
      'Planning': 'planning',
      'Functioning': 'coding',
      'Designing': 'design',
      'Debugging': 'debugging',
      'Deployment': 'deployment'
    };
    
    for (const tag of tags) {
      if (mapping[tag]) return mapping[tag];
    }
    
    return 'other';
  },

  convertTagsToCategories(tags) {
    if (!tags || tags.length === 0) return { primary: [], secondary: [] };
    
    const primaryCategories = ['Planning', 'Functioning', 'Designing', 'Debugging', 'Deployment'];
    const primary = tags.filter(tag => primaryCategories.includes(tag));
    const secondary = tags.filter(tag => !primaryCategories.includes(tag) && tag !== 'scraped' && tag !== 'auto-captured');
    
    return { primary, secondary };
  },

  mapCategoriesToOldFormat(categories) {
    if (!categories || !categories.primary) return 'other';
    
    const mapping = {
      'Planning': 'planning',
      'Functioning': 'coding',
      'Designing': 'design',
      'Debugging': 'debugging',
      'Deployment': 'deployment'
    };
    
    return mapping[categories.primary[0]] || 'other';
  },

  // Method to add detected messages from conversation capture
  addDetectedMessage(messageData) {
    if (!this.allHistoryMessages) this.allHistoryMessages = [];
    
    const formattedMessage = {
      id: messageData.id,
      timestamp: new Date(messageData.timestamp),
      speaker: messageData.speaker,
      content: messageData.content,
      category: this.mapCategoriesToOldFormat(messageData.categories),
      categories: messageData.categories,
      isDetected: true
    };
    
    // Avoid duplicates
    if (!this.allHistoryMessages.find(msg => msg.id === formattedMessage.id)) {
      this.allHistoryMessages.push(formattedMessage);
      
      // Re-sort messages by timestamp (chronological order: oldest first)
      this.allHistoryMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Update filtered messages if currently viewing history
      if (this.filteredHistoryMessages) {
        this.filteredHistoryMessages = [...this.allHistoryMessages];
        this.applyHistoryFilters();
      }
    }
  },

  applyHistoryFilters() {
    const dateFilter = document.getElementById('date-filter')?.value || 'all';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const speakerFilter = document.getElementById('speaker-filter')?.value || 'all';
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    
    this.filteredHistoryMessages = this.allHistoryMessages.filter(msg => {
      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const msgDate = new Date(msg.timestamp);
        
        switch (dateFilter) {
          case 'today':
            if (msgDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (msgDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (msgDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (msgDate < monthAgo) return false;
            break;
        }
      }
      
      // Category filter
      if (categoryFilter !== 'all' && msg.category !== categoryFilter) {
        return false;
      }
      
      // Speaker filter (only show user and lovable, exclude assistant)
      if (speakerFilter !== 'all' && msg.speaker !== speakerFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchableText = msg.content.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }
      
      return true;
    });
    
    // Sort filtered messages by timestamp (chronological order: oldest first)
    this.filteredHistoryMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    this.renderHistoryMessages();
  },

  clearHistoryFilters() {
    document.getElementById('date-filter').value = 'all';
    document.getElementById('category-filter').value = 'all';
    document.getElementById('speaker-filter').value = 'all';
    document.getElementById('search-input').value = '';
    
    this.filteredHistoryMessages = [...this.allHistoryMessages];
    this.renderHistoryMessages();
  },

  async cleanAllFilteredMessages() {
    if (!this.filteredHistoryMessages || this.filteredHistoryMessages.length === 0) {
      console.log('No filtered messages to clean');
      return;
    }

    const messageCount = this.filteredHistoryMessages.length;
    if (!confirm(`Are you sure you want to delete all ${messageCount} filtered messages? This will permanently delete them from the database. This action cannot be undone.`)) {
      return;
    }

    try {
      console.log(`🗑️ Starting bulk cleanup of ${messageCount} messages...`);
      
      // Collect all unique conversation IDs for bulk delete
      const conversationIds = new Set();
      this.filteredHistoryMessages.forEach(msg => {
        if (msg.conversationId) {
          conversationIds.add(msg.conversationId);
        }
      });

      // Perform efficient bulk delete in a single request
      if (conversationIds.size > 0) {
        console.log(`🗑️ Bulk deleting ${conversationIds.size} conversations from database...`);
        
        const response = await this.safeSendMessage({
          action: 'deleteConversations',
          filters: { ids: Array.from(conversationIds) } // Send all IDs in single request
        });
        
        if (response?.success) {
          const deletedCount = response.data?.deletedCount || conversationIds.size;
          console.log(`✅ Bulk delete successful: ${deletedCount} conversations deleted`);
        } else {
          console.warn(`⚠️ Bulk delete failed:`, response?.error);
          throw new Error(response?.error || 'Bulk delete failed');
        }
      }
      
      // Get the IDs of messages to remove from local memory
      const idsToRemove = new Set(this.filteredHistoryMessages.map(msg => msg.id));
      
      // Remove from allHistoryMessages
      this.allHistoryMessages = this.allHistoryMessages.filter(msg => !idsToRemove.has(msg.id));
      
      // Remove from message groups in simple conversation capture if available
      if (window.simpleConversationCapture && window.simpleConversationCapture.messageGroups) {
        // Remove groups that contain any of the IDs to remove
        for (const [groupId, group] of window.simpleConversationCapture.messageGroups.entries()) {
          if (idsToRemove.has(group.userId) || idsToRemove.has(group.lovableId)) {
            window.simpleConversationCapture.messageGroups.delete(groupId);
            // Also remove from processed IDs
            if (window.simpleConversationCapture.processedLovableIds) {
              window.simpleConversationCapture.processedLovableIds.delete(group.lovableId);
            }
          }
        }
      }
      
      // Update filtered messages
      this.filteredHistoryMessages = [...this.allHistoryMessages];
      this.applyHistoryFilters();
      
      console.log(`🗑️ Successfully cleaned ${idsToRemove.size} messages from history and database using bulk delete`);
      
      // Refresh the display
      this.renderHistoryMessages();
      
      // Show success message
      alert(`Successfully deleted ${messageCount} messages from the database using efficient bulk delete.`);
      
    } catch (error) {
      console.error('❌ Error during bulk cleanup:', error);
      alert('An error occurred while cleaning messages. Please check the console and try again.');
    }
  },

  renderHistoryMessages() {
    const container = document.getElementById('chat-messages');
    const countElement = document.getElementById('message-count');
    
    if (!container) return;
    
    // Update count with "Clean all!" link
    if (countElement) {
      const searchInput = document.getElementById('search-input');
      const searchTerm = searchInput?.value.trim();
      
      const cleanAllLink = this.filteredHistoryMessages.length > 0 ? 
        ` • <a href="#" id="clean-all-link" style="color: #dc2626; text-decoration: underline; font-weight: 500; cursor: pointer;">Clean all!</a>` : '';
      
      if (searchTerm) {
        countElement.innerHTML = `${this.filteredHistoryMessages.length} messages found${cleanAllLink}`;
      } else {
        countElement.innerHTML = `${this.filteredHistoryMessages.length} messages found${cleanAllLink}`;
      }
      
      // Add click handler for clean all link
      const cleanAllElement = document.getElementById('clean-all-link');
      if (cleanAllElement) {
        cleanAllElement.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('🗑️ Clean all button clicked');
          try {
            this.cleanAllFilteredMessages();
          } catch (error) {
            console.error('Error in cleanAllFilteredMessages:', error);
          }
        });
      }
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Show empty state if no messages
    if (this.filteredHistoryMessages.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #718096;">
          <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
          <h3 style="margin: 0 0 8px 0; color: #4a5568; font-size: 16px;">
            No messages found
          </h3>
          <p style="margin: 0; font-size: 14px;">
            Try adjusting your filters or search terms.
          </p>
        </div>
      `;
      return;
    }
    
    // Render messages (already sorted by timestamp, newest first)
    this.filteredHistoryMessages.forEach(msg => {
      this.addHistoryMessage(msg.content, msg.speaker, msg.timestamp, msg);
    });
    
    // Update search matches after rendering
    setTimeout(() => {
      this.updateSearchMatches();
    }, 100);
    
    // Scroll to bottom to show newest messages in viewport (while maintaining chronological order)
    container.scrollTop = container.scrollHeight;
  },

  addHistoryMessage(content, speaker, timestamp, messageData = {}) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.display = 'flex';
    messageDiv.style.marginBottom = '12px';
    messageDiv.style.justifyContent = speaker === 'user' ? 'flex-end' : 'flex-start';
    
    let bgColor = speaker === 'user' ? '#667eea' : 'white';
    let textColor = speaker === 'user' ? 'white' : '#2d3748';
    let speakerIcon = speaker === 'user' ? '👤' : '🤖';
    let speakerName = speaker === 'user' ? 'You' : 'Lovable';

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      background: ${bgColor}; color: ${textColor}; padding: 12px 16px; border-radius: 18px;
      max-width: 85%; border: ${speaker === 'lovable' ? '1px solid #c9cfd7' : 'none'};
      line-height: 1.4; word-wrap: break-word; font-size: 14px; position: relative;
    `;

    // Add timestamp and speaker info
    const timeString = this.formatMessageTime(timestamp);
    const headerHtml = `
      <div style="
        font-size: 11px; opacity: 0.7; margin-bottom: 4px;
        ${speaker === 'user' ? 'text-align: right;' : ''}
      ">
        ${speakerIcon} ${speakerName} • ${timeString}
      </div>
    `;

    // Check if this is HTML content from newer captures
    const isHTMLContent = messageData.contentFormat === 'html' || 
                         messageData.projectContext?.contentFormat === 'html' ||
                         this.isHTMLContent(content);

    const formattedContent = this.formatMessage(content, isHTMLContent);
    const highlightedContent = this.highlightSearchTerms(formattedContent);

    messageBubble.innerHTML = headerHtml + highlightedContent;
    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
  },

  formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  highlightSearchTerms(content) {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput?.value.trim().toLowerCase();
    
    if (!searchTerm) {
      this.searchMatches = [];
      this.updateSearchNavigation();
      return content;
    }
    
    // Create a regex to find the search term (case insensitive)
    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
    
    const highlightedContent = content.replace(regex, '<mark class="search-highlight" style="background: #fef08a; color: #92400e; padding: 1px 2px; border-radius: 2px;">$1</mark>');
    
    return highlightedContent;
  },

  updateSearchMatches() {
    // Get all search highlights in the current view
    this.searchMatches = Array.from(document.querySelectorAll('.search-highlight'));
    this.currentSearchIndex = 0;
    
    console.log(`🔍 Found ${this.searchMatches.length} search matches`);
    
    this.updateSearchNavigation();
    if (this.searchMatches.length > 0) {
      this.highlightCurrentMatch();
    }
  },

  highlightCurrentMatch() {
    // Remove previous current highlight
    document.querySelectorAll('.search-highlight').forEach(el => {
      el.style.background = '#fef08a';
      el.style.border = 'none';
    });
    
    // Highlight current match
    if (this.searchMatches[this.currentSearchIndex]) {
      const currentMatch = this.searchMatches[this.currentSearchIndex];
      currentMatch.style.background = '#f59e0b';
      currentMatch.style.border = '2px solid #d97706';
      currentMatch.style.boxShadow = '0 0 0 2px rgba(217, 119, 6, 0.2)';
      
      console.log(`📍 Highlighting match ${this.currentSearchIndex + 1} of ${this.searchMatches.length}`);
    }
  }
};