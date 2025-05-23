// Conversation Capture and Processing
class ConversationCapture {
  constructor() {
    this.conversations = new Map();
    this.currentConversation = null;
    this.messageQueue = [];
    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    window.addEventListener('lovable-assistant-show', this.handleAssistantShow.bind(this));
    setInterval(() => this.processMessageQueue(), 2000);
  }

  handleMessage(request, sender, sendResponse) {
    if (request.action === 'newMessage') {
      this.captureMessage(request.data);
      sendResponse({ success: true });
    }
    return true;
  }

  captureMessage(messageData) {
    try {
      this.messageQueue.push({
        ...messageData,
        id: this.generateMessageId(),
        captured_at: new Date().toISOString()
      });
      this.processConversationPairing(messageData);
    } catch (error) {
      console.error('Failed to capture message:', error);
    }
  }

  processConversationPairing(messageData) {
    const { projectId, isUser, content } = messageData;
    
    if (isUser) {
      this.currentConversation = {
        id: this.generateConversationId(),
        projectId: projectId,
        userMessage: content,
        startTime: new Date().toISOString(),
        tags: this.extractTags(content),
        status: 'pending_response'
      };
    } else if (this.currentConversation) {
      this.currentConversation.lovableResponse = content;
      this.currentConversation.status = 'completed';
      this.saveConversation(this.currentConversation);
      this.currentConversation = null;
    }
  }
  async saveConversation(conversation) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveConversation',
        data: {
          id: conversation.id,
          projectId: conversation.projectId,
          userMessage: conversation.userMessage,
          lovableResponse: conversation.lovableResponse,
          projectContext: conversation.projectContext || {},
          tags: conversation.tags,
          timestamp: conversation.startTime
        }
      });

      if (response.success) {
        console.log('Conversation saved successfully:', conversation.id);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  extractTags(content) {
    const tags = [];
    const techTerms = this.extractTechnicalTerms(content);
    const intents = this.determineIntent(content);
    
    tags.push(...intents);
    tags.push(...techTerms.slice(0, 5));
    
    return [...new Set(tags)].slice(0, 10);
  }

  extractTechnicalTerms(content) {
    const techTerms = [];
    const patterns = [
      /\b(React|Vue|Angular|Express|Node\.js|Django|Flask)\b/gi,
      /\b(JavaScript|TypeScript|Python|Java|PHP|Ruby|Go)\b/gi,
      /\b(MongoDB|PostgreSQL|MySQL|Redis|Firebase)\b/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        techTerms.push(...matches.map(match => match.toLowerCase()));
      }
    });
    
    return [...new Set(techTerms)];
  }

  determineIntent(content) {
    const intents = [];
    const patterns = {
      'create': /\b(create|build|make|generate|add)\b/i,
      'debug': /\b(error|bug|fix|debug|issue)\b/i,
      'explain': /\b(explain|what|how|why)\b/i,
      'optimize': /\b(optimize|improve|performance)\b/i
    };
    
    Object.entries(patterns).forEach(([intent, pattern]) => {
      if (pattern.test(content)) {
        intents.push(intent);
      }
    });
    
    return intents.length > 0 ? intents : ['general'];
  }
  async processMessageQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      const batch = this.messageQueue.splice(0, 5);
      for (const message of batch) {
        await this.enrichMessageContext(message);
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
      message.intent = this.determineIntent(message.content);
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

  getProjectContext() {
    return {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    };
  }

  getPageContext() {
    return {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      scrollPosition: window.scrollY
    };
  }

  handleAssistantShow(event) {
    console.log('Assistant dialog requested:', event.detail);
  }

  handleInputChange(event) {
    console.log('Input change detected:', event.detail);
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize conversation capture
const conversationCapture = new ConversationCapture();