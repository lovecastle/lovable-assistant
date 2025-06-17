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
        
        <!-- Prompt Helper -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            ✨ Prompt Helper
          </h3>
          <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 13px;">
            Press Ctrl+Enter (Windows) or Cmd+Enter (Mac) in the Lovable input field to access these templates. Edit templates below:
          </p>
          
          <div id="prompt-templates-container">
            <!-- Templates will be loaded here -->
          </div>
          
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            <button id="create-section-btn" style="
              background: #667eea; color: white; border: none; padding: 6px 12px;
              border-radius: 4px; cursor: pointer; font-size: 12px;
            ">Create Section</button>
            <button id="reset-prompt-templates-btn" style="
              background: #f56565; color: white; border: none; padding: 6px 12px;
              border-radius: 4px; cursor: pointer; font-size: 12px;
            ">Reset to Default</button>
          </div>
        </div>
        
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
    
      this.setupBackButton();
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
    // Load both settings and templates in parallel
    await Promise.all([
      this.loadUtilitiesSettings(),
      this.loadPromptTemplates()
    ]);
  },

  renderUtilitiesSettings() {
    // This method will render the UI with pre-loaded data
    // The settings are already applied to the UI elements during loadUtilitiesSettings
    // Templates are already rendered during loadPromptTemplates
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
    
    // Setup prompt enhancement
    this.setupPromptEnhancement();
    
    // Setup input auto-expansion
    this.setupInputAutoExpansion();
    
    // Setup prompt templates
    this.setupPromptTemplates();
    
    // Setup API configuration
    this.setupAPIConfiguration();
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
    
    // Load API settings
    this.loadAPISettings();
  },
  
  
  setupAPIProviderSelection() {
    const providerOptions = document.querySelectorAll('input[name="ai-provider"]');
    const claudeConfig = document.getElementById('claude-config');
    const openaiConfig = document.getElementById('openai-config');
    const geminiConfig = document.getElementById('gemini-config');
    
    // Add CSS for selected state
    const style = document.createElement('style');
    style.textContent = `
      .ai-provider-option:has(input:checked) {
        border-color: #667eea !important;
        background: #f0f4ff !important;
      }
    `;
    document.head.appendChild(style);
    
    providerOptions.forEach(option => {
      option.addEventListener('change', (e) => {
        // Hide all configs
        claudeConfig.style.display = 'none';
        openaiConfig.style.display = 'none';
        geminiConfig.style.display = 'none';
        
        // Show selected config
        switch (e.target.value) {
          case 'claude':
            claudeConfig.style.display = 'block';
            break;
          case 'openai':
            openaiConfig.style.display = 'block';
            break;
          case 'gemini':
            geminiConfig.style.display = 'block';
            break;
        }
        
        // Save selected provider
        try {
          if (chrome?.storage?.sync) {
            chrome.storage.sync.set({ aiProvider: e.target.value });
          }
        } catch (error) {
          console.warn('Could not save AI provider:', error);
        }
      });
    });
  },
  
  setupAPIConfiguration() {
    const testClaudeBtn = document.getElementById('test-claude-connection');
    const testOpenAIBtn = document.getElementById('test-openai-connection');
    const testGeminiBtn = document.getElementById('test-gemini-connection');
    const testDatabaseBtn = document.getElementById('test-database-connection');
    
    // Auto-save function
    const autoSaveConfiguration = async () => {
      try {
        console.log('🔄 Auto-saving configuration to database...');
        
        // Get all form values
        const claudeApiKey = document.getElementById('claude-api-key')?.value || '';
        const claudeModel = document.getElementById('claude-model')?.value || '';
        const openaiApiKey = document.getElementById('openai-api-key')?.value || '';
        const openaiModel = document.getElementById('openai-model')?.value || '';
        const geminiApiKey = document.getElementById('gemini-api-key')?.value || '';
        const geminiModel = document.getElementById('gemini-model')?.value || '';
        const projectId = document.getElementById('supabase-project-id')?.value || '';
        const supabaseKey = document.getElementById('supabase-key')?.value || '';
        
        // Save AI preferences individually to database
        const aiPreferences = {
          claude_api_key: claudeApiKey,
          claude_model: claudeModel,
          openai_api_key: openaiApiKey,
          openai_model: openaiModel,
          gemini_api_key: geminiApiKey,
          gemini_model: geminiModel
        };
        
        const aiResponse = await this.safeSendMessage({
          action: 'saveAIPreferencesIndividual',
          data: aiPreferences
        });
        
        if (aiResponse.success) {
          console.log('✅ AI preferences auto-saved to database');
        } else {
          console.error('❌ Failed to save AI preferences:', aiResponse.error);
        }
        
        // Save Supabase settings individually to database if provided
        if (projectId || supabaseKey) {
          const supabaseResponse = await this.safeSendMessage({
            action: 'saveSupabaseSettings',
            data: { supabaseId: projectId, supabaseKey }
          });
          
          if (supabaseResponse.success) {
            console.log('✅ Supabase settings auto-saved to database');
          } else {
            console.error('❌ Failed to save Supabase settings:', supabaseResponse.error);
          }
        }
        
        // Also save to Chrome storage for backward compatibility
        const provider = document.querySelector('input[name="ai-provider"]:checked')?.value || 'claude';
        const configData = {
          aiProvider: provider,
          supabaseProjectId: projectId,
          supabaseUrl: projectId ? `https://${projectId}.supabase.co` : '',
          supabaseKey: supabaseKey,
          claudeApiKey,
          claudeModel,
          openaiApiKey,
          openaiModel,
          geminiApiKey,
          geminiModel
        };
        
        if (chrome?.storage?.sync) {
          await chrome.storage.sync.set(configData);
        }
        
        console.log('✅ Configuration auto-saved to both database and Chrome storage');
      } catch (error) {
        console.error('❌ Failed to auto-save configuration:', error);
      }
    };
    
    // Setup auto-save on all input fields
    const setupAutoSave = () => {
      // Debounce function for text inputs
      const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      };
      
      const debouncedSave = debounce(autoSaveConfiguration, 1000);
      
      // Text inputs - save after user stops typing
      const textInputs = [
        'claude-api-key', 'openai-api-key', 'gemini-api-key',
        'supabase-project-id', 'supabase-key'
      ];
      
      textInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
          input.addEventListener('input', debouncedSave);
        }
      });
      
      // Dropdowns and radio buttons - save immediately
      const immediateInputs = [
        ...document.querySelectorAll('input[name="ai-provider"]'),
        document.getElementById('claude-model'),
        document.getElementById('openai-model'),
        document.getElementById('gemini-model')
      ].filter(Boolean);
      
      immediateInputs.forEach(input => {
        input.addEventListener('change', autoSaveConfiguration);
      });
    };
    
    // Initialize auto-save
    setupAutoSave();
    
    // Helper function to show status message
    const showStatus = (statusDivId, message, type = 'info') => {
      const statusDiv = document.getElementById(statusDivId);
      if (statusDiv) {
        statusDiv.style.display = 'block';
        
        switch (type) {
          case 'success':
            statusDiv.style.background = '#f0fff4';
            statusDiv.style.color = '#22543d';
            statusDiv.style.border = '1px solid #9ae6b4';
            break;
          case 'error':
            statusDiv.style.background = '#fed7d7';
            statusDiv.style.color = '#742a2a';
            statusDiv.style.border = '1px solid #feb2b2';
            break;
          default:
            statusDiv.style.background = '#e6f7ff';
            statusDiv.style.color = '#0369a1';
            statusDiv.style.border = '1px solid #bae6fd';
        }
        
        statusDiv.textContent = message;
        
        // Auto-hide after 5 seconds for success/error messages
        if (type !== 'info') {
          setTimeout(() => {
            statusDiv.style.display = 'none';
          }, 5000);
        }
      }
    };
    
    // Test Claude Connection
    if (testClaudeBtn) {
      testClaudeBtn.addEventListener('click', async () => {
        showStatus('claude-status', '🔄 Testing Claude connection...', 'info');
        
        try {
          // Get the current Claude API key from the form
          const apiKeyInput = document.getElementById('claude-api-key');
          const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
          
          if (!apiKey) {
            showStatus('claude-status', '❌ Please enter your Claude API key first', 'error');
            return;
          }
          
          // Test connection with specific provider
          const response = await this.safeSendMessage({ 
            action: 'testSpecificConnection',
            provider: 'claude',
            apiKey: apiKey
          });
          
          if (response && response.success) {
            showStatus('claude-status', '✅ Claude API connection successful!', 'success');
          } else {
            showStatus('claude-status', '❌ Claude connection failed: ' + (response.error || 'Invalid API key'), 'error');
          }
        } catch (error) {
          showStatus('claude-status', '❌ Claude test failed: ' + error.message, 'error');
        }
      });
    }
    
    // Test OpenAI Connection
    if (testOpenAIBtn) {
      testOpenAIBtn.addEventListener('click', async () => {
        showStatus('openai-status', '🔄 Testing OpenAI connection...', 'info');
        
        try {
          // Get the current OpenAI API key from the form
          const apiKeyInput = document.getElementById('openai-api-key');
          const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
          
          if (!apiKey) {
            showStatus('openai-status', '❌ Please enter your OpenAI API key first', 'error');
            return;
          }
          
          // Test connection with specific provider
          const response = await this.safeSendMessage({ 
            action: 'testSpecificConnection',
            provider: 'openai',
            apiKey: apiKey
          });
          
          if (response && response.success) {
            showStatus('openai-status', '✅ OpenAI API connection successful!', 'success');
          } else {
            showStatus('openai-status', '❌ OpenAI connection failed: ' + (response.error || 'Invalid API key'), 'error');
          }
        } catch (error) {
          showStatus('openai-status', '❌ OpenAI test failed: ' + error.message, 'error');
        }
      });
    }
    
    // Test Gemini Connection
    if (testGeminiBtn) {
      testGeminiBtn.addEventListener('click', async () => {
        showStatus('gemini-status', '🔄 Testing Gemini connection...', 'info');
        
        try {
          // Get the current Gemini API key from the form
          const apiKeyInput = document.getElementById('gemini-api-key');
          const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
          
          if (!apiKey) {
            showStatus('gemini-status', '❌ Please enter your Gemini API key first', 'error');
            return;
          }
          
          // Test connection with specific provider
          const response = await this.safeSendMessage({ 
            action: 'testSpecificConnection',
            provider: 'gemini',
            apiKey: apiKey
          });
          
          if (response && response.success) {
            showStatus('gemini-status', '✅ Gemini API connection successful!', 'success');
          } else {
            showStatus('gemini-status', '❌ Gemini connection failed: ' + (response.error || 'Invalid API key'), 'error');
          }
        } catch (error) {
          showStatus('gemini-status', '❌ Gemini test failed: ' + error.message, 'error');
        }
      });
    }
    
    // Test Database Connection
    if (testDatabaseBtn) {
      testDatabaseBtn.addEventListener('click', async () => {
        showStatus('database-status', '🔄 Testing database connection...', 'info');
        
        try {
          // Get the current database credentials from the form
          const projectIdInput = document.getElementById('supabase-project-id');
          const apiKeyInput = document.getElementById('supabase-api-key');
          
          const projectId = projectIdInput ? projectIdInput.value.trim() : '';
          const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
          
          if (!projectId || !apiKey) {
            showStatus('database-status', '❌ Please enter both Project ID and API Key first', 'error');
            return;
          }
          
          // Test database connection with specific credentials
          const response = await this.safeSendMessage({ 
            action: 'testDatabaseConnection',
            projectId: projectId,
            apiKey: apiKey
          });
          
          if (response && response.success) {
            showStatus('database-status', '✅ Supabase database connection successful!', 'success');
          } else {
            showStatus('database-status', '❌ Database connection failed: ' + (response.error || 'Invalid credentials'), 'error');
          }
        } catch (error) {
          showStatus('database-status', '❌ Database test failed: ' + error.message, 'error');
        }
      });
    }
  },
  
  async loadAPISettings() {
    try {
      const settings = await chrome.storage.sync.get([
        'aiProvider', 'claudeApiKey', 'openaiApiKey', 'geminiApiKey',
        'claudeModel', 'openaiModel', 'geminiModel',
        'supabaseProjectId', 'supabaseKey'
      ]);
      
      // Debug log to check saved settings
      console.log('Loading API settings:', {
        provider: settings.aiProvider,
        claudeModel: settings.claudeModel,
        openaiModel: settings.openaiModel,
        geminiModel: settings.geminiModel
      });
      
      // Set selected provider
      const provider = settings.aiProvider || 'claude';
      const providerRadio = document.getElementById(`provider-${provider}`);
      if (providerRadio) {
        providerRadio.checked = true;
        // Manually trigger the change event to show the correct config section
        providerRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Load API keys
      const claudeInput = document.getElementById('claude-api-key');
      const openaiInput = document.getElementById('openai-api-key');
      const geminiInput = document.getElementById('gemini-api-key');
      const claudeModelSelect = document.getElementById('claude-model');
      const openaiModelSelect = document.getElementById('openai-model');
      const geminiModelSelect = document.getElementById('gemini-model');
      const projectIdInput = document.getElementById('supabase-project-id');
      const supabaseKeyInput = document.getElementById('supabase-key');
      
      if (claudeInput && settings.claudeApiKey) {
        claudeInput.value = settings.claudeApiKey;
      }
      
      if (openaiInput && settings.openaiApiKey) {
        openaiInput.value = settings.openaiApiKey;
      }
      
      if (geminiInput && settings.geminiApiKey) {
        geminiInput.value = settings.geminiApiKey;
      }
      
      // Load model selections with validation (use setTimeout to ensure dropdowns are rendered)
      setTimeout(() => {
        if (claudeModelSelect) {
          if (settings.claudeModel && this.isValidModelOption(claudeModelSelect, settings.claudeModel)) {
            claudeModelSelect.value = settings.claudeModel;
            // Force update the displayed value
            claudeModelSelect.dispatchEvent(new Event('change'));
          } else {
            // Set to first option as default
            claudeModelSelect.selectedIndex = 0;
            claudeModelSelect.dispatchEvent(new Event('change'));
          }
        }
        
        if (openaiModelSelect) {
          if (settings.openaiModel && this.isValidModelOption(openaiModelSelect, settings.openaiModel)) {
            openaiModelSelect.value = settings.openaiModel;
            // Force update the displayed value
            openaiModelSelect.dispatchEvent(new Event('change'));
          } else {
            // Set to first option as default
            openaiModelSelect.selectedIndex = 0;
            openaiModelSelect.dispatchEvent(new Event('change'));
          }
        }
        
        if (geminiModelSelect) {
          if (settings.geminiModel && this.isValidModelOption(geminiModelSelect, settings.geminiModel)) {
            geminiModelSelect.value = settings.geminiModel;
            // Force update the displayed value
            geminiModelSelect.dispatchEvent(new Event('change'));
          } else {
            // Set to first option as default
            geminiModelSelect.selectedIndex = 0;
            geminiModelSelect.dispatchEvent(new Event('change'));
          }
        }
      }, 100);
      
      if (projectIdInput && settings.supabaseProjectId) {
        projectIdInput.value = settings.supabaseProjectId;
      }
      
      if (supabaseKeyInput && settings.supabaseKey) {
        supabaseKeyInput.value = settings.supabaseKey;
      }
    } catch (error) {
      console.error('Failed to load API settings:', error);
    }
  },

  // Helper function to check if a model value exists in the dropdown options
  isValidModelOption(selectElement, modelValue) {
    if (!selectElement || !modelValue) return false;
    
    for (let option of selectElement.options) {
      if (option.value === modelValue) {
        return true;
      }
    }
    
    console.warn(`Model "${modelValue}" not found in dropdown options`);
    return false;
  },

  setupPromptTemplates() {
    const createSectionBtn = document.getElementById('create-section-btn');
    const resetBtn = document.getElementById('reset-prompt-templates-btn');
    
    if (createSectionBtn) {
      createSectionBtn.addEventListener('click', async () => await this.createNewSection());
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetPromptTemplates());
    }
    
    // Auto-load templates when section is displayed
    this.loadPromptTemplates();
  },

  getDefaultPromptTemplates() {
    return [
      {
        category: 'Design',
        name: 'UI Change',
        template: 'Make only visual updates—do not impact functionality or logic in any way. Fully understand how the current UI integrates with the app, ensuring logic, state management, and APIs remain untouched. Test thoroughly to confirm the app behaves exactly as before. Stop if there\'s any doubt about unintended effects.',
        shortcut: 'ui_change'
      },
      {
        category: 'Design',
        name: 'Optimize for Mobile',
        template: 'Optimize the app for mobile without changing its design or functionality. Analyze the layout and responsiveness to identify necessary adjustments for smaller screens and touch interactions. Outline a detailed plan before editing any code, and test thoroughly across devices to ensure the app behaves exactly as it does now. Pause and propose solutions if unsure.',
        shortcut: 'mobile_optimize'
      },
      {
        category: 'Editing Features',
        name: 'Modifying an Existing Feature',
        template: 'Make changes to the feature without impacting core functionality, other features, or flows. Analyze its behavior and dependencies to understand risks, and communicate any concerns before proceeding. Test thoroughly to confirm no regressions or unintended effects, and flag any out-of-scope changes for review. Work with precision—pause if uncertain.',
        shortcut: 'modify_feature'
      },
      {
        category: 'Editing Features',
        name: 'Fragile Update',
        template: 'This update is highly sensitive and demands extreme precision. Thoroughly analyze all dependencies and impacts before making changes, and test methodically to ensure nothing breaks. Avoid shortcuts or assumptions—pause and seek clarification if uncertain. Accuracy is essential.',
        shortcut: 'fragile_update'
      },
      {
        category: 'Error Debugging',
        name: 'Minor Errors',
        template: 'The same error persists. Do not make any code changes yet—investigate thoroughly to find the exact root cause. Analyze logs, flow, and dependencies deeply, and propose solutions only once you fully understand the issue.',
        shortcut: 'minor_errors'
      },
      {
        category: 'Error Debugging',
        name: 'Persistent Errors',
        template: 'The error is still unresolved. Stop and identify the exact root cause with 100% certainty—no guesses or assumptions. Analyze every aspect of the flow and dependencies in detail, and ensure full understanding before making any changes.',
        shortcut: 'persistent_errors'
      },
      {
        category: 'Error Debugging',
        name: 'Major Errors',
        template: 'This is the final attempt to fix this issue. Stop all changes and methodically re-examine the entire flow—auth, Supabase, Stripe, state management, and redirects—from the ground up. Map out what\'s breaking and why, test everything in isolation, and do not proceed without absolute certainty.',
        shortcut: 'major_errors'
      },
      {
        category: 'Error Debugging',
        name: 'Clean up Console Logs',
        template: 'Carefully remove unnecessary `console.log` statements without affecting functionality or design. Review each log to ensure it\'s non-critical, and document any that need alternative handling. Proceed methodically, testing thoroughly to confirm the app remains intact. Pause if uncertain about any log\'s purpose.',
        shortcut: 'clean_logs'
      },
      {
        category: 'Error Debugging',
        name: 'Critical Errors',
        template: 'The issue remains unresolved and requires a serious, thorough analysis. Step back and examine the code deeply—trace the entire flow, inspect logs, and analyze all dependencies without editing anything. Identify the exact root cause with complete certainty before proposing or making any changes. No assumptions or quick fixes—only precise, evidence-based insights. Do not edit any code yet.',
        shortcut: 'critical_errors'
      },
      {
        category: 'Error Debugging',
        name: 'Extreme Errors',
        template: 'This issue remains unresolved, and we need to **stop and rethink the entire approach**. Do not edit any code. Instead, conduct a deep, methodical analysis of the system. Map out the full flow, trace every interaction, log, and dependency step by step. Document exactly what is supposed to happen, what is actually happening, and where the disconnect occurs. Provide a detailed report explaining the root cause with clear evidence. If there are gaps, uncertainties, or edge cases, highlight them for discussion. Until you can identify the **precise, proven source of the issue**, do not propose or touch any fixes. This requires total focus, no guesses, and no shortcuts.',
        shortcut: 'extreme_errors'
      },
      {
        category: 'Refactoring',
        name: 'Refactoring After Request Made by Lovable',
        template: 'Refactor this file without changing the UI or functionality—everything must behave and look exactly the same. Focus on improving code structure and maintainability only. Document the current functionality, ensure testing is in place, and proceed incrementally with no risks or regressions. Stop if unsure.',
        shortcut: 'refactor_lovable'
      },
      {
        category: 'Using another LLM',
        name: 'Generate Comprehensive Explanation',
        template: 'Generate a comprehensive and detailed explanation of the issue, including all relevant context, code snippets, error messages, logs, and dependencies involved. Clearly describe the expected behavior, the actual behavior, and any steps to reproduce the issue. Highlight potential causes or areas of concern based on your analysis. Ensure the information is structured and thorough enough to be copied and pasted into another system for further troubleshooting and debugging. Include any insights or observations that could help pinpoint the root cause. Focus on clarity and completeness to ensure the issue is easy to understand and address. Do not edit any code yet.',
        shortcut: 'explain_for_llm'
      }
    ];
  },

  async loadPromptTemplates() {
    const container = document.getElementById('prompt-templates-container');
    if (!container) return;
    
    // Try to load from database first, then fall back to defaults
    let templates;
    try {
      const message = { action: 'getPromptTemplates' };
      const response = await this.safeSendMessage(message);
      
      if (response.success && response.data && response.data.length > 0) {
        // Convert database format to expected format
        templates = response.data.map(template => ({
          category: template.category,
          name: template.name,
          template: template.template, // Use 'template' column directly
          shortcut: template.shortcut
        }));
      } else {
        // No templates in database, use defaults
        templates = this.getDefaultPromptTemplates();
        // Save defaults to database for future use
        await this.saveAllTemplatesToDatabase(templates);
      }
    } catch (error) {
      console.warn('Failed to load templates from database, using defaults:', error);
      templates = this.getDefaultPromptTemplates();
    }
    
    this.renderPromptTemplates(templates);
  },

  renderPromptTemplates(templates) {
    const container = document.getElementById('prompt-templates-container');
    if (!container) return;
    
    // Group templates by category
    const categories = {};
    templates.forEach(template => {
      if (!categories[template.category]) {
        categories[template.category] = [];
      }
      categories[template.category].push(template);
    });
    
    let html = '';
    Object.keys(categories).forEach((category, categoryIndex) => {
      const icon = this.getCategoryIcon(category);
      const categoryId = `category-${category.replace(/\s+/g, '-').toLowerCase()}`;
      
      html += `
        <div style="margin-bottom: 20px;" data-category-container="${category}">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h5 id="${categoryId}" class="editable-category"
               style="margin: 0; color: #1a202c; font-size: 13px; font-weight: 600; 
                      border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; cursor: pointer;
                      flex: 1; margin-right: 8px;"
               data-original-value="${category}" data-edit-type="category">
              ${icon} ${category}
            </h5>
            <button class="delete-section-btn" data-category="${category}" style="
              background: #f56565; color: white; border: none; padding: 2px 6px;
              border-radius: 3px; cursor: pointer; font-size: 10px; margin-left: 8px;
            ">Delete Section</button>
          </div>
      `;
      
      categories[category].forEach((template, index) => {
        const templateId = `template-${template.category.replace(/\s+/g, '-').toLowerCase()}-${index}`;
        const templateNameId = `name-${templateId}`;
        
        html += `
          <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: white;"
               data-template-container="${templateId}">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span id="${templateNameId}" class="editable-template-name"
                    style="font-weight: 500; color: #1a202c; font-size: 12px; cursor: pointer; 
                           border: 1px solid transparent; padding: 2px 4px; border-radius: 3px;"
                    data-original-value="${template.name}" data-template-id="${templateId}" data-edit-type="template-name">
                ${template.name}
              </span>
              <div style="display: flex; gap: 4px;">
                <button class="copy-template-btn" data-template-id="${templateId}" style="
                  background: #667eea; color: white; border: none; padding: 4px 8px;
                  border-radius: 4px; cursor: pointer; font-size: 10px;
                ">Copy</button>
                <button class="delete-template-btn" data-template-id="${templateId}" style="
                  background: #f56565; color: white; border: none; padding: 4px 8px;
                  border-radius: 4px; cursor: pointer; font-size: 10px;
                ">Delete</button>
              </div>
            </div>
            <textarea id="${templateId}" class="template-content"
                      data-category="${template.category}" 
                      data-name="${template.name}" 
                      data-shortcut="${template.shortcut}"
                      style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #c9cfd7; 
                             border-radius: 4px; font-size: 11px; line-height: 1.4; resize: vertical;
                             background: white; color: #1a202c;">${template.template}</textarea>
          </div>
        `;
      });
      
      // Add "Add Template" button at the bottom of each section
      html += `
        <div style="margin-bottom: 8px;">
          <button class="add-template-btn" data-category="${category}" style="
            background: #e2e8f0; color: #4a5568; border: 1px dashed #9ca3af; padding: 8px 12px;
            border-radius: 4px; cursor: pointer; font-size: 11px; width: 100%;
            transition: all 0.2s ease;
          ">
            + Add Template
          </button>
        </div>
      `;
      
      html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Add event listeners after HTML is rendered
    this.setupTemplateEventListeners();
  },

  setupTemplateEventListeners() {
    const container = document.getElementById('prompt-templates-container');
    if (!container) return;
    
    // Editable category names
    container.querySelectorAll('.editable-category').forEach(element => {
      element.addEventListener('click', () => {
        this.makeEditable(element.id, 'category');
      });
    });
    
    // Editable template names
    container.querySelectorAll('.editable-template-name').forEach(element => {
      element.addEventListener('click', () => {
        this.makeEditable(element.id, 'template-name');
      });
    });
    
    // Copy template buttons
    container.querySelectorAll('.copy-template-btn').forEach(button => {
      button.addEventListener('click', () => {
        const templateId = button.dataset.templateId;
        this.copyTemplate(templateId);
      });
    });
    
    // Delete template buttons
    container.querySelectorAll('.delete-template-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const templateId = button.dataset.templateId;
        await this.deleteTemplate(templateId);
      });
    });
    
    // Delete section buttons
    container.querySelectorAll('.delete-section-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const category = button.dataset.category;
        await this.deleteSection(category);
      });
    });
    
    // Add template buttons
    container.querySelectorAll('.add-template-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const category = button.dataset.category;
        await this.addNewTemplate(category);
      });
      
      // Add hover effects
      button.addEventListener('mouseover', () => {
        button.style.background = '#d1d5db';
      });
      button.addEventListener('mouseout', () => {
        button.style.background = '#e2e8f0';
      });
    });
    
    // Auto-save for template content
    container.querySelectorAll('.template-content').forEach(textarea => {
      textarea.addEventListener('input', () => {
        this.autoSaveTemplate(textarea.id);
      });
    });
  },

  getCategoryIcon(category) {
    const icons = {
      'Design': '🎨',
      'Editing Features': '✏️',
      'Error Debugging': '🐛',
      'Refactoring': '🔄',
      'Using another LLM': '🤖'
    };
    return icons[category] || '📝';
  },

  copyTemplate(templateId) {
    const textarea = document.getElementById(templateId);
    if (textarea) {
      textarea.select();
      textarea.setSelectionRange(0, 99999); // For mobile devices
      navigator.clipboard.writeText(textarea.value).then(() => {
        console.log('Template copied to clipboard');
        // Show brief success message
        const button = textarea.parentElement.querySelector('button');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#48bb78';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '#667eea';
        }, 1500);
      }).catch(err => {
        console.error('Failed to copy template:', err);
      });
    }
  },

  async resetPromptTemplates() {
    if (confirm('Are you sure you want to reset all prompt templates to their default values? This will overwrite any custom changes.')) {
      try {
        const defaultTemplates = this.getDefaultPromptTemplates();
        await this.saveAllTemplatesToDatabase(defaultTemplates);
        await this.loadPromptTemplates();
        console.log('🔄 Prompt templates reset to defaults');
      } catch (error) {
        console.error('❌ Failed to reset templates:', error);
        alert('Failed to reset templates. Please try again.');
      }
    }
  },

  async createNewSection() {
    const sectionName = prompt('Enter section name:');
    if (!sectionName || !sectionName.trim()) return;
    
    const templates = await this.getCurrentTemplates();
    // Check if section already exists
    const exists = templates.some(t => t.category === sectionName.trim());
    if (exists) {
      alert('Section already exists!');
      return;
    }
    
    // Add a placeholder template to create the section
    templates.push({
      category: sectionName.trim(),
      name: 'New Template',
      template: 'Enter your template content here...',
      shortcut: sectionName.toLowerCase().replace(/\s+/g, '_')
    });
    
    this.saveTemplatesAndReload(templates);
  },

  async addNewTemplate(category) {
    const templateName = prompt('Enter template name:');
    if (!templateName || !templateName.trim()) return;
    
    const templates = await this.getCurrentTemplates();
    templates.push({
      category: category,
      name: templateName.trim(),
      template: 'Enter your template content here...',
      shortcut: templateName.toLowerCase().replace(/\s+/g, '_')
    });
    
    this.saveTemplatesAndReload(templates);
  },

  async deleteSection(category) {
    if (!confirm(`Are you sure you want to delete the entire "${category}" section and all its templates?`)) return;
    
    const templates = await this.getCurrentTemplates();
    const filteredTemplates = templates.filter(t => t.category !== category);
    this.saveTemplatesAndReload(filteredTemplates);
  },

  async deleteTemplate(templateId) {
    const textarea = document.getElementById(templateId);
    if (!textarea) return;
    
    const category = textarea.dataset.category;
    const name = textarea.dataset.name;
    
    if (!confirm(`Are you sure you want to delete the template "${name}"?`)) return;
    
    const templates = await this.getCurrentTemplates();
    const filteredTemplates = templates.filter(t => !(t.category === category && t.name === name));
    this.saveTemplatesAndReload(filteredTemplates);
  },

  makeEditable(elementId, type) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const originalValue = element.dataset.originalValue || element.textContent.replace(/^[🎨✏️🐛🔄🤖📝]\s*/, '');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalValue;
    input.style.cssText = `
      width: 100%; border: 1px solid #667eea; border-radius: 3px; padding: 2px 4px;
      font-size: ${type === 'category' ? '13px' : '12px'}; font-weight: ${type === 'category' ? '600' : '500'};
      background: white; color: #1a202c;
    `;
    
    const saveEdit = () => {
      const newValue = input.value.trim();
      if (!newValue) {
        input.focus();
        return;
      }
      
      if (type === 'category') {
        this.updateCategoryName(originalValue, newValue);
      } else if (type === 'template-name') {
        const templateId = element.dataset.templateId;
        this.updateTemplateName(templateId, newValue);
      }
      
      element.style.display = '';
      input.remove();
    };
    
    const cancelEdit = () => {
      element.style.display = '';
      input.remove();
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    });
    
    element.style.display = 'none';
    element.parentNode.insertBefore(input, element);
    input.focus();
    input.select();
  },

  async updateCategoryName(oldName, newName) {
    const templates = await this.getCurrentTemplates();
    templates.forEach(template => {
      if (template.category === oldName) {
        template.category = newName;
      }
    });
    this.saveTemplatesAndReload(templates);
  },

  async updateTemplateName(templateId, newName) {
    const textarea = document.getElementById(templateId);
    if (!textarea) return;
    
    const templates = await this.getCurrentTemplates();
    const template = templates.find(t => 
      t.category === textarea.dataset.category && 
      t.name === textarea.dataset.name
    );
    
    if (template) {
      template.name = newName;
      textarea.dataset.name = newName;
      this.saveTemplatesAndReload(templates);
    }
  },

  autoSaveTemplate(templateId) {
    // Debounce auto-save to prevent excessive saves
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
      this.saveCurrentTemplates();
    }, 1000);
  },

  async saveCurrentTemplates() {
    const templates = this.getCurrentTemplatesFromDOM();
    try {
      await this.saveAllTemplatesToDatabase(templates);
      console.log('✅ Templates auto-saved');
    } catch (error) {
      console.error('Failed to auto-save templates:', error);
    }
  },

  async getCurrentTemplates() {
    try {
      const message = { action: 'getPromptTemplates' };
      const response = await this.safeSendMessage(message);
      
      if (response.success && response.data && response.data.length > 0) {
        return response.data.map(template => ({
          category: template.category,
          name: template.name,
          template: template.template, // Use 'template' column directly
          shortcut: template.shortcut
        }));
      } else {
        return this.getDefaultPromptTemplates();
      }
    } catch (error) {
      return this.getDefaultPromptTemplates();
    }
  },

  getCurrentTemplatesFromDOM() {
    const container = document.getElementById('prompt-templates-container');
    if (!container) return [];
    
    const templates = [];
    const textareas = container.querySelectorAll('textarea');
    
    textareas.forEach(textarea => {
      templates.push({
        category: textarea.dataset.category,
        name: textarea.dataset.name,
        template: textarea.value,
        shortcut: textarea.dataset.shortcut
      });
    });
    
    return templates;
  },

  async saveAllTemplatesToDatabase(templates) {
    try {
      const message = {
        action: 'saveAllPromptTemplates',
        data: { templates }
      };
      const response = await this.safeSendMessage(message);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to save templates');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Failed to save templates to database:', error);
      throw error;
    }
  },

  async saveTemplatesAndReload(templates) {
    try {
      await this.saveAllTemplatesToDatabase(templates);
      await this.loadPromptTemplates();
      console.log('✅ Templates saved and reloaded');
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  },

  async loadTemplatesIntoMenu() {
    const menuContainer = document.getElementById('prompt-templates-menu');
    if (!menuContainer) return;
    
    // Load templates from database or defaults
    let templates;
    try {
      const message = { action: 'getPromptTemplates' };
      const response = await this.safeSendMessage(message);
      
      if (response.success && response.data && response.data.length > 0) {
        templates = response.data.map(template => ({
          category: template.category,
          name: template.name,
          template: template.template, // Use 'template' column directly
          shortcut: template.shortcut
        }));
      } else {
        templates = this.getDefaultPromptTemplates();
      }
    } catch (error) {
      templates = this.getDefaultPromptTemplates();
    }
    
    // Group templates by category
    const categories = {};
    templates.forEach(template => {
      if (!categories[template.category]) {
        categories[template.category] = [];
      }
      categories[template.category].push(template);
    });
    
    let html = '';
    Object.keys(categories).forEach(category => {
      const icon = this.getCategoryIcon(category);
      const color = this.getCategoryColor(category);
      
      html += `
        <div class="prompt-category" data-category="${category.toLowerCase().replace(/\s+/g, '-')}">
          <div style="font-weight: 600; color: ${color}; margin-bottom: 4px;">${icon} ${category}</div>
      `;
      
      categories[category].forEach(template => {
        html += `
          <button class="prompt-option" data-template="${template.template}" title="${template.name}">
            ${template.name}
          </button>
        `;
      });
      
      html += '</div>';
    });
    
    menuContainer.innerHTML = html;
  },

  getCategoryColor(category) {
    const colors = {
      'Design': '#667eea',
      'Editing Features': '#48bb78',
      'Error Debugging': '#f56565',
      'Refactoring': '#805ad5',
      'Using another LLM': '#ed8936'
    };
    return colors[category] || '#4a5568';
  },

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