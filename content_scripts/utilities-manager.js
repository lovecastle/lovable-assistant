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
        
        <!-- Prompt Templates -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            📝 Prompt Templates
          </h3>
          <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px;">
            Manage your custom prompt templates for different development tasks. Use CMD/CTRL + Enter in any chat input to access the prompt helper.
          </p>
          
          <div id="prompt-templates-container">
            <!-- Templates will be loaded here -->
          </div>
          
          <div style="display: flex; gap: 8px; margin-top: 16px;">
            <button id="add-template-section-btn" style="
              background: #667eea; color: white; border: none; padding: 8px 16px;
              border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
            ">Add Section</button>
            <button id="reset-templates-btn" style="
              background: #f56565; color: white; border: none; padding: 8px 16px;
              border-radius: 6px; cursor: pointer; font-size: 14px;
            ">Reset to Defaults</button>
          </div>
          
          <div style="
            background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;
            padding: 10px; margin-top: 12px; font-size: 13px; color: #0369a1;
          ">
            <strong>⌨️ Keyboard Shortcut:</strong> Press <kbd>CMD/CTRL + Enter</kbd> while typing in any Lovable chat input to open the prompt helper with Translate/Rewrite/Enhance options.
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
    // Load settings and templates
    await this.loadUtilitiesSettings();
    await this.loadPromptTemplates();
  },

  renderUtilitiesSettings() {
    // This method will render the UI with pre-loaded data
    // The settings are already applied to the UI elements during loadUtilitiesSettings
    this.renderPromptTemplates();
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
    
    // Setup prompt templates
    this.setupPromptTemplates();
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

  // ===========================
  // PROMPT TEMPLATES MANAGEMENT
  // ===========================

  async loadPromptTemplates() {
    try {
      // Load templates from database
      const message = { action: 'getPromptTemplates' };
      const response = await this.safeSendMessage(message);
      
      if (response.success) {
        this.promptTemplates = response.data || this.getDefaultPromptTemplates();
      } else {
        console.log('📝 No existing templates, using defaults');
        this.promptTemplates = this.getDefaultPromptTemplates();
      }
    } catch (error) {
      console.error('❌ Error loading prompt templates:', error);
      this.promptTemplates = this.getDefaultPromptTemplates();
    }
  },

  getDefaultPromptTemplates() {
    return {
      "Development": {
        "Bug Fix": "I found a bug where [describe the issue]. The expected behavior is [describe expected]. Please help me fix this issue.",
        "Feature Request": "I need to implement [feature name] that should [describe functionality]. Please help me build this feature.",
        "Code Review": "Please review this code and suggest improvements: [paste code here]",
        "Refactoring": "I want to refactor this code to make it more [maintainable/performant/readable]: [paste code]"
      },
      "UI/UX": {
        "Component Creation": "Create a [component type] component that [describe functionality]. It should be responsive and follow modern design principles.",
        "Styling Help": "Help me style this element to look [describe desired appearance]. Here's the current code: [paste code]",
        "Layout Issue": "I'm having trouble with the layout of [describe element]. It should [describe expected layout].",
        "Mobile Responsive": "Make this component mobile-responsive: [paste code]"
      },
      "API Integration": {
        "API Setup": "Help me integrate with the [API name] API. I need to [describe what you want to achieve].",
        "Error Handling": "Add proper error handling to this API call: [paste code]",
        "Data Transformation": "Help me transform this API response data: [paste data structure]"
      },
      "Database": {
        "Schema Design": "Design a database schema for [describe your data/app]. The main entities are [list entities].",
        "Query Help": "Help me write a query to [describe what you want to query].",
        "Data Migration": "Help me migrate data from [old structure] to [new structure]."
      }
    };
  },

  renderPromptTemplates() {
    const container = document.getElementById('prompt-templates-container');
    if (!container || !this.promptTemplates) return;

    let html = '';
    
    Object.entries(this.promptTemplates).forEach(([categoryName, templates]) => {
      const categoryId = categoryName.replace(/\s+/g, '-').toLowerCase();
      const categoryIcon = this.getCategoryIcon(categoryName);
      const categoryColor = this.getCategoryColor(categoryName);
      
      html += `
        <div class="template-section" data-category="${categoryName}" style="margin-bottom: 16px;">
          <div style="
            display: flex; align-items: center; justify-content: space-between;
            background: ${categoryColor}; color: white; padding: 10px 16px;
            border-radius: 8px 8px 0 0; font-weight: 600; font-size: 14px;
          ">
            <span style="display: flex; align-items: center; gap: 8px;">
              <span>${categoryIcon}</span>
              <span class="category-name" data-editable="true">${categoryName}</span>
            </span>
            <div style="display: flex; gap: 8px;">
              <button class="add-template-btn" data-category="${categoryName}" style="
                background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
                color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;
              ">+ Add</button>
              <button class="delete-section-btn" data-category="${categoryName}" style="
                background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
                color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;
              ">Delete</button>
            </div>
          </div>
          <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      `;
      
      Object.entries(templates).forEach(([templateName, templateContent]) => {
        html += `
          <div class="template-item" data-category="${categoryName}" data-template="${templateName}" style="
            border-bottom: 1px solid #f1f5f9; padding: 12px 16px; background: white;
          ">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 12px;">
              <div style="flex: 1;">
                <div class="template-name" data-editable="true" style="
                  font-weight: 600; color: #1a202c; margin-bottom: 6px; cursor: pointer;
                ">${templateName}</div>
                <div class="template-content" data-editable="true" style="
                  color: #4a5568; font-size: 13px; line-height: 1.4; cursor: pointer;
                  white-space: pre-wrap; word-break: break-word;
                ">${templateContent}</div>
              </div>
              <div style="display: flex; gap: 6px; flex-shrink: 0;">
                <button class="copy-template-btn" data-template-content="${this.escapeHtml(templateContent)}" style="
                  background: #f7fafc; border: 1px solid #e2e8f0; color: #4a5568;
                  padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;
                " title="Copy template">📋</button>
                <button class="delete-template-btn" data-category="${categoryName}" data-template="${templateName}" style="
                  background: #fed7d7; border: 1px solid #f56565; color: #c53030;
                  padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;
                " title="Delete template">🗑️</button>
              </div>
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  setupPromptTemplates() {
    // Add section button
    const addSectionBtn = document.getElementById('add-template-section-btn');
    if (addSectionBtn) {
      addSectionBtn.addEventListener('click', () => this.createNewSection());
    }

    // Reset templates button
    const resetBtn = document.getElementById('reset-templates-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetPromptTemplates());
    }

    // Setup event listeners for template interactions
    this.setupTemplateEventListeners();
  },

  setupTemplateEventListeners() {
    const container = document.getElementById('prompt-templates-container');
    if (!container) return;

    // Event delegation for dynamic content
    container.addEventListener('click', (e) => {
      const target = e.target;
      
      if (target.classList.contains('add-template-btn')) {
        const category = target.dataset.category;
        this.addNewTemplate(category);
      } else if (target.classList.contains('delete-section-btn')) {
        const category = target.dataset.category;
        this.deleteSection(category);
      } else if (target.classList.contains('copy-template-btn')) {
        const content = target.dataset.templateContent;
        this.copyTemplate(content);
      } else if (target.classList.contains('delete-template-btn')) {
        const category = target.dataset.category;
        const template = target.dataset.template;
        this.deleteTemplate(category, template);
      }
    });

    // Double-click editing for category names and template content
    container.addEventListener('dblclick', (e) => {
      const target = e.target;
      
      if (target.dataset.editable === 'true') {
        this.makeEditable(target);
      }
    });
  },

  getCategoryIcon(categoryName) {
    const icons = {
      'Development': '💻',
      'UI/UX': '🎨',
      'API Integration': '🔗',
      'Database': '🗄️',
      'Testing': '🧪',
      'Deployment': '🚀',
      'Documentation': '📚'
    };
    return icons[categoryName] || '📁';
  },

  getCategoryColor(categoryName) {
    const colors = {
      'Development': '#667eea',
      'UI/UX': '#ed8936',
      'API Integration': '#48bb78',
      'Database': '#9f7aea',
      'Testing': '#f093fb',
      'Deployment': '#38b2ac',
      'Documentation': '#fbb6ce'
    };
    return colors[categoryName] || '#718096';
  },

  copyTemplate(content) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        console.log('✅ Template copied to clipboard');
        // Show brief feedback
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed; top: 20px; right: 20px; background: #48bb78; color: white;
          padding: 8px 16px; border-radius: 6px; font-size: 14px; z-index: 10000;
          transition: opacity 0.3s ease;
        `;
        notification.textContent = '✅ Template copied!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => document.body.removeChild(notification), 300);
        }, 2000);
      }).catch(err => {
        console.error('❌ Failed to copy template:', err);
      });
    }
  },

  createNewSection() {
    const sectionName = prompt('Enter section name:');
    if (!sectionName || sectionName.trim() === '') return;
    
    const trimmedName = sectionName.trim();
    if (this.promptTemplates[trimmedName]) {
      alert('A section with this name already exists.');
      return;
    }
    
    this.promptTemplates[trimmedName] = {
      'New Template': 'Enter your template content here...'
    };
    
    this.saveTemplatesAndReload();
  },

  addNewTemplate(categoryName) {
    const templateName = prompt('Enter template name:');
    if (!templateName || templateName.trim() === '') return;
    
    const trimmedName = templateName.trim();
    if (this.promptTemplates[categoryName][trimmedName]) {
      alert('A template with this name already exists in this section.');
      return;
    }
    
    this.promptTemplates[categoryName][trimmedName] = 'Enter your template content here...';
    this.saveTemplatesAndReload();
  },

  deleteSection(categoryName) {
    if (!confirm(`Are you sure you want to delete the "${categoryName}" section and all its templates?`)) return;
    
    delete this.promptTemplates[categoryName];
    this.saveTemplatesAndReload();
  },

  deleteTemplate(categoryName, templateName) {
    if (!confirm(`Are you sure you want to delete the "${templateName}" template?`)) return;
    
    delete this.promptTemplates[categoryName][templateName];
    
    // If section is empty, remove it
    if (Object.keys(this.promptTemplates[categoryName]).length === 0) {
      delete this.promptTemplates[categoryName];
    }
    
    this.saveTemplatesAndReload();
  },

  makeEditable(element) {
    const originalText = element.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.style.cssText = `
      width: 100%; padding: 4px; border: 2px solid #667eea; border-radius: 4px;
      font-size: inherit; font-family: inherit; background: white;
    `;
    
    element.replaceWith(input);
    input.focus();
    input.select();
    
    const saveChanges = () => {
      const newText = input.value.trim();
      if (newText === '') {
        element.textContent = originalText;
        input.replaceWith(element);
        return;
      }
      
      element.textContent = newText;
      input.replaceWith(element);
      
      // Update the data based on what was edited
      if (element.classList.contains('category-name')) {
        this.updateCategoryName(originalText, newText);
      } else if (element.classList.contains('template-name')) {
        const categoryName = element.closest('.template-item').dataset.category;
        this.updateTemplateName(categoryName, originalText, newText);
      } else if (element.classList.contains('template-content')) {
        const item = element.closest('.template-item');
        const categoryName = item.dataset.category;
        const templateName = item.dataset.template;
        this.autoSaveTemplate(categoryName, templateName, newText);
      }
    };
    
    input.addEventListener('blur', saveChanges);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveChanges();
      } else if (e.key === 'Escape') {
        element.textContent = originalText;
        input.replaceWith(element);
      }
    });
  },

  updateCategoryName(oldName, newName) {
    if (oldName === newName) return;
    
    if (this.promptTemplates[newName]) {
      alert('A section with this name already exists.');
      return;
    }
    
    this.promptTemplates[newName] = this.promptTemplates[oldName];
    delete this.promptTemplates[oldName];
    this.saveTemplatesAndReload();
  },

  updateTemplateName(categoryName, oldName, newName) {
    if (oldName === newName) return;
    
    if (this.promptTemplates[categoryName][newName]) {
      alert('A template with this name already exists in this section.');
      return;
    }
    
    const content = this.promptTemplates[categoryName][oldName];
    this.promptTemplates[categoryName][newName] = content;
    delete this.promptTemplates[categoryName][oldName];
    this.saveTemplatesAndReload();
  },

  autoSaveTemplate(categoryName, templateName, content) {
    this.promptTemplates[categoryName][templateName] = content;
    this.saveCurrentTemplates();
  },

  async saveCurrentTemplates() {
    try {
      const message = {
        action: 'savePromptTemplates',
        data: { templates: this.promptTemplates }
      };
      
      const response = await this.safeSendMessage(message);
      if (response.success) {
        console.log('✅ Templates saved successfully');
      } else {
        console.error('❌ Failed to save templates:', response.error);
      }
    } catch (error) {
      console.error('❌ Error saving templates:', error);
    }
  },

  async saveTemplatesAndReload() {
    await this.saveCurrentTemplates();
    this.renderPromptTemplates();
    this.setupTemplateEventListeners();
  },

  resetPromptTemplates() {
    if (!confirm('Are you sure you want to reset all templates to defaults? This will delete all your custom templates.')) return;
    
    this.promptTemplates = this.getDefaultPromptTemplates();
    this.saveTemplatesAndReload();
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