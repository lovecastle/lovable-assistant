// ===========================
// UTILITIES MANAGER - EXTRACTED MODULE
// ===========================
// This section handles utilities page, settings, prompt enhancement, and advanced features
// This section manages all utility functions and user preferences including:
// - Settings and configuration management
// - Prompt template management and customization
// - API provider configuration (Claude, OpenAI, Gemini)
// - Notification settings
// - Message scraping functionality
// - Settings import/export capabilities
// - Toggle switch management for various features

// Create UtilitiesManager class that will be mixed into LovableDetector
window.UtilitiesManager = {
  async showUtilitiesPage() {
    // Show loading state immediately
    if (typeof this.showDialogLoading === 'function') {
      this.showDialogLoading('Utilities');
    }
    
    try {
      // Load settings and templates data first
      await this.loadUtilitiesData();
      
      // Then render the UI with the loaded data
      const content = document.getElementById('dialog-content');
      const title = document.getElementById('dialog-title');
      
      if (title) {
        title.textContent = '🛠️ Utilities';
      }
      
      if (!content) return;
    
    content.innerHTML = `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;
            display: inline-flex; align-items: center; justify-content: center;
            min-height: 40px; min-width: 120px; transition: all 0.2s ease;
          " onmouseover="this.style.background='#e2e8f0'; this.style.borderColor='#9ca3af'" 
             onmouseout="this.style.background='#f7fafc'; this.style.borderColor='#c9cfd7'">← Back to Welcome</button>
        </div>
        
        <!-- Message Scraping -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            📥 Comprehensive Message Scraping
          </h3>
          <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px;">
            Intelligently scroll through the entire chat history to capture all messages, including older ones that aren't currently visible.
          </p>
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <button id="scrape-messages-btn" style="
              background: #667eea; color: white; border: none; padding: 10px 16px;
              border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
            ">Scrape All Messages</button>
            <button id="stop-scraping-btn" style="
              background: #f56565; color: white; border: none; padding: 10px 16px;
              border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
              display: none;
            ">Stop Scraping</button>
          </div>
          <div id="scrape-status" style="
            margin-top: 10px; font-size: 13px; color: #4a5568;
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
            padding: 8px 12px; min-height: 20px; display: none;
          "></div>
          <div style="
            background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;
            padding: 10px; margin-top: 12px; font-size: 13px; color: #0369a1;
          ">
            <strong>💡 How it works:</strong> This feature automatically scrolls up through your chat history, 
            capturing messages as they load. It handles Lovable's lazy loading and will continue running 
            even if you switch browser tabs. The process may take a few minutes for long conversations.
          </div>
        </div>
        
        <!-- Notification Settings -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            🔔 Notification Settings
          </h3>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <label style="color: #4a5568; font-size: 14px;">Enable desktop notifications when Lovable completes tasks</label>
            <label class="toggle-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
              <input type="checkbox" id="notifications-toggle" style="opacity: 0; width: 0; height: 0;">
              <span class="toggle-slider" style="
                position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                background-color: #ccc; transition: .4s; border-radius: 24px;
              "></span>
            </label>
          </div>
          
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <label style="color: #4a5568; font-size: 14px;">Rename browser tab to "Working..." when Lovable is working</label>
            <label class="toggle-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
              <input type="checkbox" id="tab-rename-toggle" style="opacity: 0; width: 0; height: 0;">
              <span class="toggle-slider" style="
                position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                background-color: #ccc; transition: .4s; border-radius: 24px;
              "></span>
            </label>
          </div>
          
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <label style="color: #4a5568; font-size: 14px;">Auto-switch back to Lovable tab when task completes</label>
            <label class="toggle-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
              <input type="checkbox" id="auto-switch-toggle" style="opacity: 0; width: 0; height: 0;">
              <span class="toggle-slider" style="
                position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                background-color: #ccc; transition: .4s; border-radius: 24px;
              "></span>
            </label>
          </div>
          
          <div style="
            background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;
            padding: 10px; font-size: 13px; color: #0369a1;
          ">
            <strong>📌 How it works:</strong> 
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
              <li>Desktop notifications alert you when Lovable finishes tasks that took 3+ seconds</li>
              <li>Tab renaming shows "Working..." with animated dots in the browser tab title</li>
              <li>Auto-switch brings you back to the Lovable tab when work is complete</li>
            </ul>
          </div>
          <div id="notification-status" style="
            margin-top: 10px; font-size: 12px; color: #4a5568; display: none;
          "></div>
        </div>
        
        <!-- Removed Prompt Helper section - AI functionality removed -->
        
        <!-- Settings -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            ⚙️ Utility Settings
          </h3>
          <button id="reset-utilities-btn" style="
            background: #f56565; color: white; border: none; padding: 8px 16px;
            border-radius: 6px; cursor: pointer; font-size: 14px; margin-right: 8px;
          ">Reset All Settings</button>
          <button id="export-settings-btn" style="
            background: #48bb78; color: white; border: none; padding: 8px 16px;
            border-radius: 6px; cursor: pointer; font-size: 14px;
          ">Export Settings</button>
        </div>
      </div>
    `;
    
      if (typeof this.setupBackButton === 'function') {
        this.setupBackButton();
      }
      this.setupUtilitiesEvents();
      this.renderUtilitiesSettings(); // Use pre-loaded data
    } catch (error) {
      console.error('❌ Error loading utilities page:', error);
      // Show error state
      const content = document.getElementById('dialog-content');
      if (content) {
        content.innerHTML = `
          <div style="
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            height: 100%; color: #e53e3e; font-size: 14px; gap: 16px; padding: 20px;
          ">
            <div style="font-size: 24px;">❌</div>
            <div>Failed to load utilities page</div>
            <button onclick="window.lovableDetector.showUtilitiesPage()" style="
              background: #667eea; color: white; border: none; padding: 8px 16px;
              border-radius: 6px; cursor: pointer; font-size: 14px;
            ">Retry</button>
          </div>
        `;
      }
    }
  },

  async loadUtilitiesData() {
    // Load settings only
    await this.loadUtilitiesSettings();
  },

  renderUtilitiesSettings() {
    // This method will render the UI with pre-loaded data
    // The settings are already applied to the UI elements during loadUtilitiesSettings
  },

  setupBackButton() {
    const backBtn = document.getElementById('back-to-welcome-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showWelcomePage();
      });
    }
  },

  setupUtilitiesEvents() {
    // Message scraping
    const scrapeBtn = document.getElementById('scrape-messages-btn');
    const stopBtn = document.getElementById('stop-scraping-btn');
    
    if (scrapeBtn) {
      scrapeBtn.addEventListener('click', () => this.scrapeAllMessages());
    }
    
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        if (window.currentMessageScraper) {
          window.currentMessageScraper.stop();
          stopBtn.style.display = 'none';
          scrapeBtn.style.display = 'inline-block';
        }
      });
    }

    // Toggle switches
    this.setupToggleSwitch('tab-rename-toggle', 'lovable-tab-rename');
    this.setupToggleSwitch('auto-switch-toggle', 'lovable-auto-switch');
    this.setupToggleSwitch('notifications-toggle', 'lovable-notifications');

    // Settings buttons
    const resetBtn = document.getElementById('reset-utilities-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetUtilitiesSettings());
    }

    const exportBtn = document.getElementById('export-settings-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportUtilitiesSettings());
    }

    // Initialize toggle CSS
    this.addToggleCSS();
    
    // Removed input auto-expansion - AI functionality removed
  },

  setupToggleSwitch(toggleId, settingKey) {
    const toggle = document.getElementById(toggleId);
    if (!toggle) {
      console.warn(`⚠️ Toggle element not found: ${toggleId}`);
      return;
    }

    toggle.addEventListener('change', async () => {
      const isEnabled = toggle.checked;
      
      // Save to database instead of localStorage
      try {
        const message = {
          action: 'saveUIPreference',
          data: {
            preferenceKey: settingKey,
            preferenceValue: isEnabled
          }
        };
        
        const response = await this.safeSendMessage(message);
        
        if (response.success) {
          console.log(`✅ ${settingKey} ${isEnabled ? 'enabled' : 'disabled'}`);
        } else {
          console.error('❌ Failed to save setting:', response.error);
          // Revert toggle state on error
          toggle.checked = !isEnabled;
        }
      } catch (error) {
        console.error('❌ Error saving setting:', error);
        // Revert toggle state on error
        toggle.checked = !isEnabled;
      }
    });
  },

  addToggleCSS() {
    if (document.getElementById('toggle-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'toggle-styles';
    style.textContent = `
      .toggle-switch input:checked + .toggle-slider {
        background-color: #667eea;
      }
      
      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(26px);
      }
    `;
    document.head.appendChild(style);
  },

  async loadUtilitiesSettings() {
    // Load saved settings from database
    const settings = [
      { id: 'tab-rename-toggle', key: 'lovable-tab-rename' },
      { id: 'auto-switch-toggle', key: 'lovable-auto-switch' },
      { id: 'notifications-toggle', key: 'lovable-notifications' }
    ];

    try {
      // Get all UI preferences from database
      const message = { action: 'getAllUIPreferences' };
      const response = await this.safeSendMessage(message);
      
      if (response.success) {
        const preferences = response.data || {};
        
        settings.forEach(({ id, key }) => {
          const toggle = document.getElementById(id);
          if (toggle) {
            // Use database value or default to false
            toggle.checked = preferences[key] === true;
          }
        });
      } else {
        console.error('❌ Failed to load UI settings:', response.error);
        // Fallback to default values
        settings.forEach(({ id }) => {
          const toggle = document.getElementById(id);
          if (toggle) {
            toggle.checked = false;
          }
        });
      }
    } catch (error) {
      console.error('❌ Error loading UI settings:', error);
      // Fallback to default values
      settings.forEach(({ id }) => {
        const toggle = document.getElementById(id);
        if (toggle) {
          toggle.checked = false;
        }
      });
    }
    
    // Removed API settings loading - AI functionality removed
  },
  
  
  // Removed setupAPIProviderSelection() - AI functionality removed
  
  // Removed setupAPIConfiguration() - AI functionality removed
  
  // Removed loadAPISettings() - AI functionality removed

  // Removed isValidModelOption() - AI functionality removed

  // Removed setupPromptTemplates() - AI prompt templates functionality removed

  // Removed getDefaultPromptTemplates() - AI prompt templates functionality removed

  // Removed loadPromptTemplates() - AI prompt templates functionality removed

  // Removed renderPromptTemplates() - AI prompt templates functionality removed

  // Removed setupTemplateEventListeners() - AI prompt templates functionality removed

  // Removed getCategoryIcon() - AI prompt templates functionality removed

  // Removed copyTemplate() - AI prompt templates functionality removed

  // Removed resetPromptTemplates() - AI prompt templates functionality removed

  // Removed createNewSection() - AI prompt templates functionality removed

  // Removed addNewTemplate() - AI prompt templates functionality removed

  // Removed deleteSection() - AI prompt templates functionality removed

  // Removed deleteTemplate() - AI prompt templates functionality removed

  // Removed makeEditable() - AI prompt templates functionality removed

  // Removed updateCategoryName() - AI prompt templates functionality removed

  // Removed updateTemplateName() - AI prompt templates functionality removed

  // Removed autoSaveTemplate() - AI prompt templates functionality removed

  // Removed saveCurrentTemplates() - AI prompt templates functionality removed

  // Removed getCurrentTemplates() - AI prompt templates functionality removed

  // Removed getCurrentTemplatesFromDOM() - AI prompt templates functionality removed

  // Removed saveAllTemplatesToDatabase() - AI prompt templates functionality removed

  // Removed saveTemplatesAndReload() - AI prompt templates functionality removed

  // Removed loadTemplatesIntoMenu() - AI prompt templates functionality removed

  // Removed getCategoryColor() - AI prompt templates functionality removed

  async scrapeAllMessages() {
    const statusDiv = document.getElementById('scrape-status');
    const btn = document.getElementById('scrape-messages-btn');
    const stopBtn = document.getElementById('stop-scraping-btn');
    
    if (!statusDiv || !btn) return;
    
    // Show status area and stop button
    statusDiv.style.display = 'block';
    btn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-block';
    
    btn.disabled = true;
    btn.textContent = 'Scraping...';
    statusDiv.innerHTML = '<span style="color: #667eea;">🔄 Initializing comprehensive message scraping...</span>';
    
    try {
      // Initialize the comprehensive scraper
      const scraper = new ComprehensiveMessageScraper(statusDiv, btn);
      
      // Store globally so stop button can access it
      window.currentMessageScraper = scraper;
      
      // Expose debugging methods
      window.currentMessageScraper.debugStats = () => scraper.getScrapingStats();
      window.currentMessageScraper.clearTracking = () => scraper.clearPersistentTracking();
      
      await scraper.startScraping();
      
      // Clean up
      window.currentMessageScraper = null;
      
    } catch (error) {
      console.error('Scraping error:', error);
      statusDiv.innerHTML = '<span style="color: #f56565;">❌ Error during scraping: ' + error.message + '</span>';
      
      // Reset UI
      btn.disabled = false;
      btn.textContent = 'Scrape All Messages';
      btn.style.display = 'inline-block';
      if (stopBtn) stopBtn.style.display = 'none';
      
      // Hide status after error
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 5000);
    }
  },

  resetUtilitiesSettings() {
    if (!confirm('Are you sure you want to reset all utility settings? This will disable all features.')) return;
    
    const settings = [
      'lovable-auto-expand'
    ];
    
    settings.forEach(key => localStorage.removeItem(key));
    
    // Reload settings
    this.loadUtilitiesSettings();
    
    console.log('🔧 All utility settings reset');
  },

  exportUtilitiesSettings() {
    const settings = {
      autoExpand: localStorage.getItem('lovable-auto-expand') === 'true',
      exportDate: new Date().toISOString(),
      projectId: this.projectId
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `lovable-utilities-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📥 Settings exported');
  }
};