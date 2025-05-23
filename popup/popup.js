// Popup Script for Lovable Assistant Chrome Extension
class PopupManager {
  constructor() {
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadSettings();
  }

  setupEventListeners() {
    const saveBtn = document.getElementById('save-config');
    const testBtn = document.getElementById('test-connection');
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveConfiguration();
      });
    }
    
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        this.testConnection();
      });
    }
  }

  async saveConfiguration() {
    const claudeKey = document.getElementById('claude-api-key')?.value.trim();
    const supabaseUrl = document.getElementById('supabase-url')?.value.trim();
    const supabaseKey = document.getElementById('supabase-key')?.value.trim();

    if (!claudeKey || !supabaseUrl || !supabaseKey) {
      this.showStatus('All fields are required', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({
        claudeApiKey: claudeKey,
        supabaseUrl: supabaseUrl,
        supabaseKey: supabaseKey
      });

      this.showStatus('Configuration saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      this.showStatus('Failed to save configuration', 'error');
    }
  }

  async testConnection() {
    this.showStatus('Testing connection...', 'success');
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'testConnection'
      });

      if (response?.success) {
        this.showStatus('✅ Connection successful!', 'success');
      } else {
        this.showStatus('❌ Connection failed - check your credentials', 'error');
      }
    } catch (error) {
      console.error('Test connection failed:', error);
      this.showStatus('❌ Test failed - extension error', 'error');
    }
  }
  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(['claudeApiKey', 'supabaseUrl', 'supabaseKey']);
      
      if (settings.claudeApiKey) {
        document.getElementById('claude-api-key').value = settings.claudeApiKey;
      }
      if (settings.supabaseUrl) {
        document.getElementById('supabase-url').value = settings.supabaseUrl;
      }
      if (settings.supabaseKey) {
        document.getElementById('supabase-key').value = settings.supabaseKey;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  showStatus(message, type) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status ${type}`;
      statusEl.style.display = 'block';
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 3000);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});