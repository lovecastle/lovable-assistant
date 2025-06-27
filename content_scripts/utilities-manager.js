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
          <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px;">
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
    `;
    
    this.setupBackButton();
    this.setupUtilitiesEventListeners();
    // Load settings first, then prompt templates
    this.loadUtilitiesSettings().then(() => {
      this.loadPromptTemplates();
    });
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

  async loadPromptTemplates() {
    const container = document.getElementById('prompt-templates-container');
    if (!container) return;
    
    try {
      // Try to load from database first if user is authenticated
      const response = await this.safeSendMessage({ action: 'getPromptTemplatesFromDB' });
      
      if (response && response.success) {
        // Convert database format to UI format
        const templates = this.convertDBTemplatesToUIFormat(response.data);
        this.renderPromptTemplates(templates);
        return;
      }
    } catch (error) {
      console.warn('Failed to load templates from database, falling back to localStorage:', error);
    }
    
    // Fallback to localStorage and defaults
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

  convertDBTemplatesToUIFormat(dbTemplates) {
    // Convert database format to the format expected by the UI
    return dbTemplates.map(template => {
      const isSystemTemplate = template.is_system_template === true || template.is_system_template === 'true' || 
                               template.is_system === true || template.is_system === 'true' ||
                               template.user_id === 'default' || template.user_id === 'system';
      
      
      
      return {
        category: template.section || template.category, // Support both for backwards compatibility
        name: template.name || template.template_name,
        template: template.template_content || template.content || '', // Ensure never undefined
        shortcut: template.shortcut,
        template_id: template.template_id,
        is_system_template: isSystemTemplate
      };
    });
  },

  convertUITemplatesToDBFormat(uiTemplates) {
    // Convert UI format to database format
    return uiTemplates.map(template => {
      const dbTemplate = {
        template_id: template.template_id,
        section: template.category, // Map category to section for database
        name: template.name,
        template_content: template.template,
        shortcut: template.shortcut,
        is_system_template: template.is_system_template || false
      };
      
      // Only include optional fields if they exist and are meaningful
      if (template.is_hidden === true) {
        dbTemplate.is_hidden = true;
      }
      
      return dbTemplate;
    });
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
    Object.keys(categories).forEach((category) => {
      const icon = this.getCategoryIcon(category);
      const categoryId = `category-${category.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Check if all templates in this category are system templates
      const allSystemTemplates = categories[category].every(template => 
        template.is_system_template === true || template.is_system_template === 'true'
      );
      
      html += `
        <div style="margin-bottom: 20px;" data-category-container="${category}">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h5 id="${categoryId}" class="${allSystemTemplates ? '' : 'editable-category'}"
               style="margin: 0; color: #1a202c; font-size: 13px; font-weight: 600; 
                      border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; ${allSystemTemplates ? '' : 'cursor: pointer;'}
                      flex: 1; margin-right: 8px;"
               data-original-value="${category}" data-edit-type="category" data-is-system="${allSystemTemplates}">
              ${icon} ${category}
            </h5>
            ${allSystemTemplates ? '' : `
            <button class="delete-section-btn" data-category="${category}" style="
              background: #f56565; color: white; border: none; padding: 2px 6px;
              border-radius: 3px; cursor: pointer; font-size: 10px; margin-left: 8px;
            ">Delete Section</button>
            `}
          </div>
      `;
      
      categories[category].forEach((template, index) => {
        const templateId = `template-${template.category.replace(/\s+/g, '-').toLowerCase()}-${index}`;
        const templateNameId = `name-${templateId}`;
        
        // Ensure robust boolean checking
        const isSystemTemplate = template.is_system_template === true || template.is_system_template === 'true';
        
        html += `
          <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: white;"
               data-template-container="${templateId}">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span id="${templateNameId}" class="${isSystemTemplate ? '' : 'editable-template-name'}"
                    style="font-weight: 500; color: #1a202c; font-size: 12px; ${isSystemTemplate ? '' : 'cursor: pointer;'} 
                           border: 1px solid transparent; padding: 2px 4px; border-radius: 3px;"
                    data-original-value="${template.name}" data-template-id="${templateId}" data-edit-type="template-name" data-is-system="${isSystemTemplate}">
                ${template.name}
              </span>
              <div style="display: flex; gap: 4px;">
                ${!isSystemTemplate ? `
                <button class="delete-template-btn" data-template-id="${templateId}" style="
                  background: #f56565; color: white; border: none; padding: 4px 8px;
                  border-radius: 4px; cursor: pointer; font-size: 10px;
                ">Delete</button>
                ` : ''}
              </div>
            </div>
            <textarea id="${templateId}" class="template-content"
                      data-category="${template.category}" 
                      data-name="${template.name}" 
                      data-shortcut="${template.shortcut}"
                      data-template-id="${template.template_id || ''}"
                      data-is-system-template="${isSystemTemplate}"
                      ${isSystemTemplate ? `data-original-content="${(template.template || '').replace(/"/g, '&quot;')}"` : ''}
                      ${isSystemTemplate ? 'readonly' : ''}
                      style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #c9cfd7; 
                             border-radius: 4px; font-size: 11px; line-height: 1.4; resize: vertical;
                             background: ${isSystemTemplate ? '#f8f9fa' : 'white'}; color: #1a202c;">${template.template}</textarea>
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
    
    // Editable category names (only for non-system categories)
    container.querySelectorAll('.editable-category').forEach(element => {
      element.addEventListener('click', () => {
        const isSystem = element.dataset.isSystem === 'true';
        if (!isSystem) {
          this.makeEditable(element.id, 'category');
        }
      });
    });
    
    // Editable template names (only for non-system templates)
    container.querySelectorAll('.editable-template-name').forEach(element => {
      element.addEventListener('click', () => {
        const isSystem = element.dataset.isSystem === 'true';
        if (!isSystem) {
          this.makeEditable(element.id, 'template-name');
        }
      });
    });
    
    // Copy template buttons removed - no longer needed
    
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
    
    // Auto-save for template content (only for non-system templates)
    container.querySelectorAll('.template-content').forEach(textarea => {
      const isSystemTemplate = textarea.dataset.isSystemTemplate === 'true';
      if (!isSystemTemplate) {
        textarea.addEventListener('input', () => {
          this.autoSaveTemplate(textarea.id);
        });
      }
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


  resetPromptTemplates() {
    if (confirm('Are you sure you want to reset all prompt templates to their default values? This will overwrite any custom changes.')) {
      localStorage.removeItem('lovable-prompt-templates');
      this.loadPromptTemplates();
      console.log('🔄 Prompt templates reset to defaults');
    }
  },

  createNewSection() {
    // Create a custom dialog for section input
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: white; border: 1px solid #c9cfd7; border-radius: 8px;
      padding: 24px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); z-index: 999999;
      min-width: 400px; max-width: 500px;
    `;
    
    dialog.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 18px;">Create New Section</h3>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 14px;">Section Name:</label>
        <input type="text" id="new-section-name" style="
          width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 4px;
          font-size: 14px; color: #c9cfd7;
        " placeholder="e.g., API Integration" autofocus>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 14px;">First Template Name:</label>
        <input type="text" id="first-template-name" style="
          width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 4px;
          font-size: 14px; color: #c9cfd7;
        " placeholder="e.g., REST API Call">
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 14px;">First Template Content:</label>
        <textarea id="first-template-content" style="
          width: 100%; min-height: 120px; padding: 8px 12px; border: 1px solid #c9cfd7;
          border-radius: 4px; font-size: 14px; color: #c9cfd7; resize: vertical;
        " placeholder="Enter the template content here..."></textarea>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="cancel-section-btn" style="
          background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
          padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;
        ">Cancel</button>
        <button id="save-section-btn" style="
          background: #667eea; color: white; border: none;
          padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;
        ">Create Section</button>
      </div>
    `;
    
    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); z-index: 999998;
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);
    
    // Focus on section name input
    document.getElementById('new-section-name').focus();
    
    // Handle save
    const saveSection = async () => {
      const sectionName = document.getElementById('new-section-name').value.trim();
      const templateName = document.getElementById('first-template-name').value.trim();
      const templateContent = document.getElementById('first-template-content').value.trim();
      
      if (!sectionName) {
        alert('Please enter a section name.');
        document.getElementById('new-section-name').focus();
        return;
      }
      
      if (!templateName) {
        alert('Please enter a template name.');
        document.getElementById('first-template-name').focus();
        return;
      }
      
      if (!templateContent) {
        alert('Please enter template content.');
        document.getElementById('first-template-content').focus();
        return;
      }
      
      // Load current templates from database first to ensure we have the latest data
      await this.loadPromptTemplates();
      const templates = this.getCurrentTemplatesFromDOM();
      console.log('📋 Current templates before adding new one:', templates);
      
      // Check if section already exists
      const exists = templates.some(t => t.category === sectionName);
      if (exists) {
        alert('Section already exists!');
        document.getElementById('new-section-name').focus();
        return;
      }
      
      // Generate a unique template ID
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // Add the new template to a separate array to avoid including all existing templates
      const newTemplate = {
        template_id: templateId,
        category: sectionName,
        name: templateName,
        template: templateContent,
        shortcut: templateName.toLowerCase().replace(/\s+/g, '_'),
        is_system_template: false
      };
      
      // Add to the templates array for the save
      templates.push(newTemplate);
      
      console.log('📝 Saving templates with new section:', {
        totalTemplates: templates.length,
        newTemplate: newTemplate
      });
      
      // Close dialog
      backdrop.remove();
      dialog.remove();
      
      // Save all templates (including the new one)
      await this.saveTemplatesAndReload(templates);
    };
    
    // Handle cancel
    const cancelSection = () => {
      backdrop.remove();
      dialog.remove();
    };
    
    // Event listeners
    document.getElementById('save-section-btn').addEventListener('click', saveSection);
    document.getElementById('cancel-section-btn').addEventListener('click', cancelSection);
    
    // Enter key navigation
    document.getElementById('new-section-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('first-template-name').focus();
      }
    });
    
    document.getElementById('first-template-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('first-template-content').focus();
      }
    });
    
    // Ctrl/Cmd+Enter saves
    dialog.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveSection();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelSection();
      }
    });
  },

  addNewTemplate(category) {
    // Create a custom dialog for template input
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: white; border: 1px solid #c9cfd7; border-radius: 8px;
      padding: 24px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); z-index: 999999;
      min-width: 400px; max-width: 500px;
    `;
    
    dialog.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 18px;">Add New Template</h3>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 14px;">Template Name:</label>
        <input type="text" id="new-template-name" style="
          width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 4px;
          font-size: 14px; color: #c9cfd7;
        " placeholder="e.g., Fix Bug" autofocus>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 14px;">Template Content:</label>
        <textarea id="new-template-content" style="
          width: 100%; min-height: 120px; padding: 8px 12px; border: 1px solid #c9cfd7;
          border-radius: 4px; font-size: 14px; color: #c9cfd7; resize: vertical;
        " placeholder="Enter the template content here..."></textarea>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="cancel-template-btn" style="
          background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
          padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;
        ">Cancel</button>
        <button id="save-template-btn" style="
          background: #667eea; color: white; border: none;
          padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;
        ">Save Template</button>
      </div>
    `;
    
    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); z-index: 999998;
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);
    
    // Focus on name input
    document.getElementById('new-template-name').focus();
    
    // Handle save
    const saveTemplate = async () => {
      const templateName = document.getElementById('new-template-name').value.trim();
      const templateContent = document.getElementById('new-template-content').value.trim();
      
      if (!templateName) {
        alert('Please enter a template name.');
        document.getElementById('new-template-name').focus();
        return;
      }
      
      if (!templateContent) {
        alert('Please enter template content.');
        document.getElementById('new-template-content').focus();
        return;
      }
      
      // Generate a unique template ID
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // Get current templates from DOM to ensure we have the latest
      const templates = this.getCurrentTemplatesFromDOM();
      
      templates.push({
        template_id: templateId,
        category: category,
        name: templateName,
        template: templateContent,
        shortcut: templateName.toLowerCase().replace(/\s+/g, '_'),
        is_system_template: false
      });
      
      // Close dialog
      backdrop.remove();
      dialog.remove();
      
      // Save templates
      await this.saveTemplatesAndReload(templates);
    };
    
    // Handle cancel
    const cancelTemplate = () => {
      backdrop.remove();
      dialog.remove();
    };
    
    // Event listeners
    document.getElementById('save-template-btn').addEventListener('click', saveTemplate);
    document.getElementById('cancel-template-btn').addEventListener('click', cancelTemplate);
    
    // Enter key on name field moves to content
    document.getElementById('new-template-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('new-template-content').focus();
      }
    });
    
    // Ctrl/Cmd+Enter saves
    dialog.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveTemplate();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelTemplate();
      }
    });
  },

  async deleteSection(category) {
    if (!confirm(`Are you sure you want to delete the entire "${category}" section and all its templates?`)) return;
    
    try {
      console.log(`🗑️ Deleting section: ${category}`);
      
      // Delete all templates in this section from the database
      const response = await this.safeSendMessage({
        action: 'deleteSectionTemplates',
        category: category
      });
      
      if (response && response.success) {
        console.log(`✅ Section "${category}" deleted successfully`);
        // Reload templates to reflect the changes
        await this.loadPromptTemplates();
      } else {
        console.error('❌ Failed to delete section:', response?.error);
        alert('Failed to delete section:\n\n' + (response?.error || 'Delete failed'));
      }
    } catch (error) {
      console.error('❌ Error deleting section:', error);
      alert('Error deleting section: ' + error.message);
    }
  },

  async deleteTemplate(templateId) {
    const textarea = document.getElementById(templateId);
    if (!textarea) return;
    
    const category = textarea.dataset.category;
    const name = textarea.dataset.name;
    const isSystemTemplate = textarea.dataset.isSystemTemplate === 'true';
    const templateDbId = textarea.dataset.templateId;
    
    let confirmMessage;
    if (isSystemTemplate) {
      confirmMessage = `Are you sure you want to hide the system template "${name}"? You can restore it later by resetting templates to defaults.`;
    } else {
      confirmMessage = `Are you sure you want to delete the template "${name}"? This action cannot be undone.`;
    }
    
    if (!confirm(confirmMessage)) return;
    
    // Handle system templates by hiding them
    if (isSystemTemplate && templateDbId) {
      try {
        const response = await this.safeSendMessage({ 
          action: 'hideSystemTemplate', 
          templateId: templateDbId 
        });
        
        if (response && response.success) {
          console.log('✅ System template hidden successfully');
          await this.loadPromptTemplates(); // Reload from database
          return;
        } else {
          console.warn('⚠️ Failed to hide system template:', response?.error);
        }
      } catch (error) {
        console.warn('⚠️ Failed to hide system template:', error);
      }
    }
    
    // Handle user templates or fallback for system templates
    if (!isSystemTemplate && templateDbId) {
      try {
        const response = await this.safeSendMessage({ 
          action: 'deletePromptTemplateFromDB', 
          templateId: templateDbId 
        });
        
        if (response && response.success) {
          console.log('✅ Template deleted from database successfully');
        } else {
          console.warn('⚠️ Failed to delete from database:', response?.error);
        }
      } catch (error) {
        console.warn('⚠️ Failed to delete from database:', error);
      }
    }
    
    // Update local templates as well
    const templates = this.getCurrentTemplates();
    const filteredTemplates = templates.filter(t => !(t.category === category && t.name === name));
    await this.saveTemplatesAndReload(filteredTemplates);
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
    const templates = this.getCurrentTemplates();
    templates.forEach(template => {
      if (template.category === oldName) {
        template.category = newName;
      }
    });
    await this.saveTemplatesAndReload(templates);
  },

  async updateTemplateName(templateId, newName) {
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
      await this.saveTemplatesAndReload(templates);
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
      // Get the template content - if it's empty and it's a system template, 
      // use the original content from data attribute
      let templateContent = textarea.value;
      if (!templateContent && textarea.dataset.isSystemTemplate === 'true' && textarea.dataset.originalContent) {
        templateContent = textarea.dataset.originalContent;
      }
      
      templates.push({
        template_id: textarea.dataset.templateId,
        category: textarea.dataset.category,
        name: textarea.dataset.name,
        template: templateContent,
        shortcut: textarea.dataset.shortcut,
        is_system_template: textarea.dataset.isSystemTemplate === 'true'
      });
    });
    
    return templates;
  },

  async saveTemplatesAndReload(templates) {
    try {
      // Save ONLY to database - no localStorage
      const dbTemplates = this.convertUITemplatesToDBFormat(templates);
      console.log('📤 Attempting to save templates to database:', dbTemplates);
      
      const response = await this.safeSendMessage({ 
        action: 'savePromptTemplatesToDB', 
        templates: dbTemplates 
      });
      
      if (response && response.success) {
        console.log('✅ Templates saved to database successfully');
        await this.loadPromptTemplates();
      } else {
        console.error('❌ Failed to save to database:', response?.error);
        alert('Failed to save template to database:\n\n' + (response?.error || 'Database save failed') + '\n\nPlease check the console for more details.');
        throw new Error(response?.error || 'Database save failed');
      }
      console.log('✅ Templates saved and reloaded');
    } catch (error) {
      console.error('Failed to save templates:', error);
      // Error already shown to user via alert above
    }
  },

  async loadTemplatesIntoMenu() {
    const menuContainer = document.getElementById('prompt-templates-menu');
    if (!menuContainer) return;
    
    // Load templates from database instead of localStorage
    let templates;
    try {
      const response = await this.safeSendMessage({ action: 'getPromptTemplatesFromDB' });
      if (response && response.success && response.templates) {
        templates = this.convertDBTemplatesToUIFormat(response.templates);
      } else {
        console.warn('Failed to load templates from database, using defaults');
        templates = this.getDefaultPromptTemplates();
      }
    } catch (error) {
      console.warn('Error loading templates from database:', error);
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

    // Note: Toggle switches setup moved to after loadUtilitiesSettings
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
  },

  setupToggle(toggleId, storageKey) {
    const toggle = document.getElementById(toggleId);
    if (!toggle) return;

    // Don't set the initial state here - it's already set in loadUtilitiesSettings
    // Just add the change listener
    
    // Add change listener with database sync
    toggle.addEventListener('change', async () => {
      // Update localStorage immediately
      localStorage.setItem(storageKey, toggle.checked.toString());
      console.log(`🔧 ${storageKey} ${toggle.checked ? 'enabled' : 'disabled'}`);
      
      // Try to save to database
      try {
        await this.saveUserPreferencesToDatabase();
        console.log('💾 Saving preference change to database...');
      } catch (error) {
        console.warn('⚠️ Failed to save preferences to database:', error);
      }
    });
  },

  async saveUserPreferencesToDatabase() {
    try {
      const preferences = {
        notifications: localStorage.getItem('lovable-notifications') === 'true',
        tabRename: localStorage.getItem('lovable-tab-rename') === 'true',
        autoSwitch: localStorage.getItem('lovable-auto-switch') === 'true'
      };
      
      const response = await this.safeSendMessage({ 
        action: 'saveUserPreferences', 
        preferences: preferences 
      });
      
      if (response && response.success) {
        console.log('✅ User preferences saved to database successfully');
      } else {
        console.warn('⚠️ Failed to save preferences to database:', response?.error);
      }
    } catch (error) {
      console.warn('⚠️ Failed to save preferences to database:', error);
    }
  },

  async loadUtilitiesSettings() {
    try {
      // Try to load from database first if user is authenticated
      const response = await this.safeSendMessage({ action: 'getUserPreferences' });
      
      if (response && response.success) {
        const prefs = response.data;
        
        // Set toggle states from database
        const toggle1 = document.getElementById('notifications-toggle');
        const toggle2 = document.getElementById('tab-rename-toggle');
        const toggle3 = document.getElementById('auto-switch-toggle');
        
        if (toggle1) toggle1.checked = prefs.notifications !== false; // Default true
        if (toggle2) toggle2.checked = prefs.tabRename === true; // Default false
        if (toggle3) toggle3.checked = prefs.autoSwitch === true; // Default false
        
        // Also update localStorage for backward compatibility
        localStorage.setItem('lovable-notifications', (prefs.notifications !== false).toString());
        localStorage.setItem('lovable-tab-rename', (prefs.tabRename === true).toString());
        localStorage.setItem('lovable-auto-switch', (prefs.autoSwitch === true).toString());
        
        console.log('✅ User preferences loaded from database');
      }
    } catch (error) {
      console.warn('Failed to load preferences from database, falling back to localStorage:', error);
      
      // Fallback to localStorage
      const settings = [
        { id: 'notifications-toggle', key: 'lovable-notifications', defaultValue: true },
        { id: 'tab-rename-toggle', key: 'lovable-tab-rename', defaultValue: false },
        { id: 'auto-switch-toggle', key: 'lovable-auto-switch', defaultValue: false }
      ];

      settings.forEach(setting => {
        const toggle = document.getElementById(setting.id);
        if (toggle) {
          const storedValue = localStorage.getItem(setting.key);
          toggle.checked = storedValue !== null ? storedValue === 'true' : setting.defaultValue;
        }
      });
    }
    
    // Setup toggle switches AFTER loading values
    this.setupToggleSwitches();
    
    // Clean up old auto-expand setting since Lovable now handles this natively
    localStorage.removeItem('lovable-auto-expand');
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