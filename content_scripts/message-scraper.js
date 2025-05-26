// Comprehensive Message Scraper for Lovable Assistant
// Handles intelligent scrolling and batch message processing

class ComprehensiveMessageScraper {
  constructor(statusDiv, btn) {
    this.statusDiv = statusDiv;
    this.btn = btn;
    this.chatContainer = null;
    this.lastMessageGroupCount = 0;
    this.scrollAttempts = 0;
    this.noNewDataCounter = 0;
    this.maxNoNewDataAttempts = 10; // Stop after 10 scrolls with no new data
    this.scrollDelay = 1500; // Reduced from 5000ms for faster scraping
    this.isRunning = false;
    this.hasReachedTop = false;
    
    // Add tracking for batch save completion
    this.pendingSaves = new Set(); // Track IDs of conversations being saved
    this.batchSavePromises = []; // Track active save promises
    this.saveCompletionCallbacks = new Map(); // Track completion callbacks for saves
  }

  async startScraping() {
    this.isRunning = true;
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