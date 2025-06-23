// ===========================
// UTILITIES MANAGER - EXTRACTED MODULE
// ===========================
// This section handles utilities page, settings, prompt enhancement, and advanced features
// This section manages all utility functions and user preferences

// Create UtilitiesManager class that will be mixed into LovableDetector
window.UtilitiesManager = {
  showUtilitiesPage() {
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
            padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;
          ">← Back to Welcome</button>
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
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <label style="color: #4a5568; font-size: 14px;">Auto-expand input area on new lines</label>
            <label class="toggle-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
              <input type="checkbox" id="auto-expand-toggle" style="opacity: 0; width: 0; height: 0;">
              <span class="toggle-slider" style="
                position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                background-color: #ccc; transition: .4s; border-radius: 24px;
              "></span>
            </label>
          </div>
          <div style="background: #f8fafc; border: 1px solid #c9cfd7; border-radius: 6px; padding: 12px;">
            <h4 style="margin: 0 0 8px 0; color: #1a202c; font-size: 14px; font-weight: 600;">
              Prompt Helper Templates (Ctrl+Enter / Cmd+Enter)
            </h4>
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
              ">Reset to Defaults</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.setupBackButton();
    this.setupUtilitiesEventListeners();
    this.loadUtilitiesSettings();
    this.loadPromptTemplates();
  },

  // Original prompt templates methods from git history
  getDefaultPromptTemplates() {
    return [
      {
        category: 'Design',
        name: 'UI Change',
        template: 'Modify the UI to focus strictly on visual design elements without altering functionality. Ensure mobile responsiveness is maintained and test on different screen sizes. Use modern design principles.',
        shortcut: 'ui_change'
      },
      {
        category: 'Design',
        name: 'Optimize for Mobile',
        template: 'Optimize this interface specifically for mobile devices. Ensure touch-friendly controls, proper sizing, and intuitive mobile navigation while maintaining desktop compatibility.',
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

  loadPromptTemplates() {
    const container = document.getElementById('prompt-templates-container');
    if (!container) return;
    
    // Try to load from localStorage first, then fall back to defaults
    let templates;
    try {
      const stored = localStorage.getItem('lovable-prompt-templates');
      templates = stored ? JSON.parse(stored) : this.getDefaultPromptTemplates();
    } catch (error) {
      console.warn('Failed to load stored templates, using defaults:', error);
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
      button.addEventListener('click', () => {
        const templateId = button.dataset.templateId;
        this.deleteTemplate(templateId);
      });
    });
    
    // Delete section buttons
    container.querySelectorAll('.delete-section-btn').forEach(button => {
      button.addEventListener('click', () => {
        const category = button.dataset.category;
        this.deleteSection(category);
      });
    });
    
    // Add template buttons
    container.querySelectorAll('.add-template-btn').forEach(button => {
      button.addEventListener('click', () => {
        const category = button.dataset.category;
        this.addNewTemplate(category);
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
        const button = textarea.parentElement.querySelector('.copy-template-btn');
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

  resetPromptTemplates() {
    if (confirm('Are you sure you want to reset all prompt templates to their default values? This will overwrite any custom changes.')) {
      localStorage.removeItem('lovable-prompt-templates');
      this.loadPromptTemplates();
      console.log('🔄 Prompt templates reset to defaults');
    }
  },

  createNewSection() {
    const sectionName = prompt('Enter section name:');
    if (!sectionName || !sectionName.trim()) return;
    
    const templates = this.getCurrentTemplates();
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

  addNewTemplate(category) {
    const templateName = prompt('Enter template name:');
    if (!templateName || !templateName.trim()) return;
    
    const templates = this.getCurrentTemplates();
    templates.push({
      category: category,
      name: templateName.trim(),
      template: 'Enter your template content here...',
      shortcut: templateName.toLowerCase().replace(/\s+/g, '_')
    });
    
    this.saveTemplatesAndReload(templates);
  },

  deleteSection(category) {
    if (!confirm(`Are you sure you want to delete the entire "${category}" section and all its templates?`)) return;
    
    const templates = this.getCurrentTemplates();
    const filteredTemplates = templates.filter(t => t.category !== category);
    this.saveTemplatesAndReload(filteredTemplates);
  },

  deleteTemplate(templateId) {
    const textarea = document.getElementById(templateId);
    if (!textarea) return;
    
    const category = textarea.dataset.category;
    const name = textarea.dataset.name;
    
    if (!confirm(`Are you sure you want to delete the template "${name}"?`)) return;
    
    const templates = this.getCurrentTemplates();
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

  updateCategoryName(oldName, newName) {
    const templates = this.getCurrentTemplates();
    templates.forEach(template => {
      if (template.category === oldName) {
        template.category = newName;
      }
    });
    this.saveTemplatesAndReload(templates);
  },

  updateTemplateName(templateId, newName) {
    const textarea = document.getElementById(templateId);
    if (!textarea) return;
    
    const templates = this.getCurrentTemplates();
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

  saveCurrentTemplates() {
    const templates = this.getCurrentTemplatesFromDOM();
    try {
      localStorage.setItem('lovable-prompt-templates', JSON.stringify(templates));
      console.log('✅ Templates auto-saved');
    } catch (error) {
      console.error('Failed to auto-save templates:', error);
    }
  },

  getCurrentTemplates() {
    try {
      const stored = localStorage.getItem('lovable-prompt-templates');
      return stored ? JSON.parse(stored) : this.getDefaultPromptTemplates();
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

  saveTemplatesAndReload(templates) {
    try {
      localStorage.setItem('lovable-prompt-templates', JSON.stringify(templates));
      this.loadPromptTemplates();
      console.log('✅ Templates saved and reloaded');
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  },

  loadTemplatesIntoMenu() {
    const menuContainer = document.getElementById('prompt-templates-menu');
    if (!menuContainer) return;
    
    // Load templates from localStorage or defaults
    let templates;
    try {
      const stored = localStorage.getItem('lovable-prompt-templates');
      templates = stored ? JSON.parse(stored) : this.getDefaultPromptTemplates();
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

  setupUtilitiesEventListeners() {
    // Message scraping
    const scrapeBtn = document.getElementById('scrape-messages-btn');
    const stopBtn = document.getElementById('stop-scraping-btn');
    
    if (scrapeBtn) {
      scrapeBtn.addEventListener('click', () => {
        this.scrapeAllMessages();
      });
    }
    
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        if (window.currentMessageScraper) {
          window.currentMessageScraper.stopScraping();
        }
      });
    }

    // Prompt template management
    const createSectionBtn = document.getElementById('create-section-btn');
    const resetTemplatesBtn = document.getElementById('reset-prompt-templates-btn');
    
    if (createSectionBtn) {
      createSectionBtn.addEventListener('click', () => {
        this.createNewSection();
      });
    }
    
    if (resetTemplatesBtn) {
      resetTemplatesBtn.addEventListener('click', () => {
        this.resetPromptTemplates();
      });
    }

    // Toggle switches
    this.setupToggleSwitches();
  },

  setupToggleSwitches() {
    // Add CSS for toggle switches
    if (!document.getElementById('toggle-switch-styles')) {
      const style = document.createElement('style');
      style.id = 'toggle-switch-styles';
      style.textContent = `
        .toggle-switch input:checked + .toggle-slider {
          background-color: #667eea;
        }
        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(26px);
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
      `;
      document.head.appendChild(style);
    }

    // Setup individual toggles
    this.setupToggle('notifications-toggle', 'lovable-notifications');
    this.setupToggle('tab-rename-toggle', 'lovable-tab-rename');
    this.setupToggle('auto-switch-toggle', 'lovable-auto-switch');
    this.setupToggle('auto-expand-toggle', 'lovable-auto-expand');
  },

  setupToggle(toggleId, storageKey) {
    const toggle = document.getElementById(toggleId);
    if (!toggle) return;

    // Load current state
    const currentState = localStorage.getItem(storageKey) === 'true';
    toggle.checked = currentState;

    // Add change listener
    toggle.addEventListener('change', () => {
      localStorage.setItem(storageKey, toggle.checked.toString());
      console.log(`🔧 ${storageKey} ${toggle.checked ? 'enabled' : 'disabled'}`);
    });
  },

  loadUtilitiesSettings() {
    // Load toggle states
    const settings = [
      { id: 'notifications-toggle', key: 'lovable-notifications' },
      { id: 'tab-rename-toggle', key: 'lovable-tab-rename' },
      { id: 'auto-switch-toggle', key: 'lovable-auto-switch' },
      { id: 'auto-expand-toggle', key: 'lovable-auto-expand' }
    ];

    settings.forEach(setting => {
      const toggle = document.getElementById(setting.id);
      if (toggle) {
        toggle.checked = localStorage.getItem(setting.key) === 'true';
      }
    });
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

  setupBackButton() {
    const backBtn = document.getElementById('back-to-welcome-btn');
    if (backBtn && this.showWelcomePage) {
      backBtn.addEventListener('click', () => {
        this.showWelcomePage();
      });
    }
  }
};