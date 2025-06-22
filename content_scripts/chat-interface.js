// ===========================
// CHAT INTERFACE - PROMPT HELPER
// ===========================
// Handles CMD/CTRL + Enter keyboard shortcuts and prompt enhancement dialog
// This section manages the prompt helper functionality including:
// - Keyboard shortcut detection in Lovable input fields
// - Prompt helper dialog with Translate/Rewrite/Enhance/Cancel options
// - AI integration for prompt enhancement using user's private API key
// - Smart positioning and React input value handling

window.ChatInterface = {
  // Initialize chat interface enhancements
  init() {
    this.setupPromptEnhancement();
    console.log('✨ Chat interface initialized with prompt helper');
  },

  setupPromptEnhancement() {
    // Listen for CMD/CTRL + Enter in input fields
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const target = e.target;
        
        if (this.isLovableInputField(target)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          const currentText = target.value.trim();
          if (currentText) {
            this.showPromptEnhancementMenu(target, currentText);
          }
          return false;
        }
      }
    }, true); // Use capture phase for early interception
  },

  isLovableInputField(element) {
    if (!element || element.tagName !== 'TEXTAREA') return false;
    
    // Common selectors for Lovable input fields
    const commonSelectors = [
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Tell"]',
      'textarea[data-testid*="input"]',
      'textarea[class*="input"]',
      'textarea[class*="chat"]'
    ];
    
    // Check if element matches common selectors
    const matchesSelectors = commonSelectors.some(selector => {
      try {
        return element.matches(selector);
      } catch (e) {
        return false;
      }
    });
    
    if (matchesSelectors) return true;
    
    // Check parent elements for chat-related classes
    const hasChartParent = element.closest('[class*="chat"]') || 
                          element.closest('[data-testid*="chat"]') ||
                          element.closest('[class*="input"]') ||
                          element.closest('[class*="message"]');
    
    return !!hasChartParent;
  },

  showPromptEnhancementMenu(inputElement, originalText) {
    // Remove existing menu if present
    this.removePromptMenu();
    
    // Create the prompt helper dialog
    const menu = document.createElement('div');
    menu.id = 'prompt-enhancement-menu';
    menu.style.cssText = `
      position: fixed;
      background: white;
      border: 2px solid #667eea;
      border-radius: 12px;
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
      z-index: 10000;
      width: 400px;
      max-height: 500px;
      overflow-y: auto;
      font-family: system-ui, sans-serif;
    `;
    
    // Position the menu near the input field
    this.positionPromptMenu(menu, inputElement);
    
    menu.innerHTML = `
      <div style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; color: #1a202c; font-size: 18px; font-weight: 600;">
            ✨ Prompt Helper Menu
          </h3>
          <button id="close-prompt-menu" style="
            background: none; border: none; font-size: 20px; cursor: pointer;
            color: #9ca3af; padding: 4px; line-height: 1;
          ">×</button>
        </div>
        
        <!-- Original Text Display -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 500;">Original Text:</div>
          <div style="font-size: 14px; color: #374151; line-height: 1.4;">${this.escapeHtml(originalText)}</div>
        </div>
        
        <!-- Template Selection -->
        <div id="template-selection-area" style="margin-bottom: 16px;">
          <!-- Will be populated by loadTemplatesIntoMenu -->
        </div>
        
        <!-- Action Buttons -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
          <button id="translate-btn" data-action="translate" style="
            background: #10b981; color: white; border: none; padding: 12px 16px;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          ">🌐 Translate</button>
          
          <button id="rewrite-btn" data-action="rewrite" style="
            background: #f59e0b; color: white; border: none; padding: 12px 16px;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          ">✏️ Rewrite</button>
          
          <button id="enhance-btn" data-action="enhance" style="
            background: #8b5cf6; color: white; border: none; padding: 12px 16px;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          ">⚡ Enhance</button>
          
          <button id="cancel-btn" style="
            background: #6b7280; color: white; border: none; padding: 12px 16px;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          ">❌ Cancel</button>
        </div>
        
        <!-- Results Area -->
        <div id="enhancement-results" style="display: none;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 500;">Enhanced Text:</div>
          <div style="
            background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;
            padding: 12px; margin-bottom: 12px; font-size: 14px; line-height: 1.4;
            white-space: pre-wrap; word-break: break-word;
          " id="enhanced-text"></div>
          
          <div style="display: flex; gap: 8px;">
            <button id="use-enhanced-btn" style="
              background: #059669; color: white; border: none; padding: 10px 16px;
              border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
              flex: 1;
            ">✅ Use This Text</button>
            
            <button id="try-again-btn" style="
              background: #667eea; color: white; border: none; padding: 10px 16px;
              border-radius: 6px; cursor: pointer; font-size: 14px;
              flex: 1;
            ">🔄 Try Again</button>
          </div>
        </div>
        
        <!-- Loading State -->
        <div id="enhancement-loading" style="display: none; text-align: center; padding: 20px;">
          <div style="
            width: 32px; height: 32px; border: 3px solid #e2e8f0;
            border-top: 3px solid #667eea; border-radius: 50%;
            animation: spin 1s linear infinite; margin: 0 auto 16px;
          "></div>
          <div style="color: #6b7280; font-size: 14px;">Enhancing your prompt...</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(menu);
    
    // Setup event handlers
    this.setupPromptMenuEvents(menu, inputElement, originalText);
    
    // Load templates into the menu
    this.loadTemplatesIntoMenu();
    
    // Add spinner animation styles
    if (!document.getElementById('prompt-helper-styles')) {
      const style = document.createElement('style');
      style.id = 'prompt-helper-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  },

  positionPromptMenu(menu, inputElement) {
    const inputRect = inputElement.getBoundingClientRect();
    const menuWidth = 400;
    const menuHeight = 500;
    
    let left = inputRect.left;
    let top = inputRect.bottom + 10;
    
    // Adjust horizontal position if menu would overflow
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }
    
    // Adjust vertical position if menu would overflow
    if (top + menuHeight > window.innerHeight) {
      top = inputRect.top - menuHeight - 10;
      if (top < 20) {
        top = 20;
      }
    }
    
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  },

  setupPromptMenuEvents(menu, inputElement, originalText) {
    // Close button
    const closeBtn = menu.querySelector('#close-prompt-menu');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.removePromptMenu());
    }
    
    // Cancel button
    const cancelBtn = menu.querySelector('#cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.removePromptMenu());
    }
    
    // Action buttons
    const actionButtons = menu.querySelectorAll('[data-action]');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        await this.handlePromptEnhancement(action, originalText, inputElement);
      });
    });
    
    // Use enhanced text button
    const useBtn = menu.querySelector('#use-enhanced-btn');
    if (useBtn) {
      useBtn.addEventListener('click', () => {
        const enhancedText = menu.querySelector('#enhanced-text').textContent;
        this.updateInputFieldValue(inputElement, enhancedText);
        this.removePromptMenu();
      });
    }
    
    // Try again button
    const tryAgainBtn = menu.querySelector('#try-again-btn');
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener('click', () => {
        menu.querySelector('#enhancement-results').style.display = 'none';
      });
    }
    
    // Close on outside click
    const outsideClickHandler = (e) => {
      if (!menu.contains(e.target)) {
        this.removePromptMenu();
        document.removeEventListener('click', outsideClickHandler);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', outsideClickHandler);
    }, 100);
    
    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.removePromptMenu();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  },

  async loadTemplatesIntoMenu() {
    try {
      // Get prompt templates from utilities manager
      if (window.lovableDetector && typeof window.lovableDetector.safeSendMessage === 'function') {
        const response = await window.lovableDetector.safeSendMessage({ action: 'getPromptTemplates' });
        
        if (response.success && response.data) {
          this.renderTemplatesInMenu(response.data);
        }
      }
    } catch (error) {
      console.error('❌ Error loading templates into menu:', error);
    }
  },

  renderTemplatesInMenu(templates) {
    const container = document.getElementById('template-selection-area');
    if (!container || !templates) return;
    
    let html = '<div style="margin-bottom: 12px;">';
    html += '<div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: 500;">Quick Templates:</div>';
    
    Object.entries(templates).forEach(([categoryName, categoryTemplates]) => {
      const categoryColor = this.getCategoryColor(categoryName);
      
      html += `<div style="margin-bottom: 8px;">`;
      html += `<div style="font-size: 11px; color: ${categoryColor}; font-weight: 600; margin-bottom: 4px;">${categoryName}</div>`;
      
      Object.entries(categoryTemplates).forEach(([templateName, templateContent]) => {
        html += `
          <button class="template-quick-btn" data-template-content="${this.escapeHtml(templateContent)}" style="
            background: #f8fafc; border: 1px solid #e2e8f0; color: #374151;
            padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;
            margin: 2px 4px 2px 0; display: inline-block;
          " title="${this.escapeHtml(templateContent)}">${templateName}</button>
        `;
      });
      
      html += `</div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add event listeners for template buttons
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('template-quick-btn')) {
        const templateContent = e.target.dataset.templateContent;
        const menu = document.getElementById('prompt-enhancement-menu');
        const inputElement = menu.inputElement; // We'll store this reference
        
        if (inputElement) {
          this.updateInputFieldValue(inputElement, templateContent);
          this.removePromptMenu();
        }
      }
    });
  },

  async handlePromptEnhancement(action, originalText, inputElement) {
    const menu = document.getElementById('prompt-enhancement-menu');
    if (!menu) return;
    
    // Store input element reference for template buttons
    menu.inputElement = inputElement;
    
    // Show loading state
    menu.querySelector('#enhancement-loading').style.display = 'block';
    menu.querySelector('#enhancement-results').style.display = 'none';
    
    try {
      let enhancedText = '';
      
      switch (action) {
        case 'translate':
          enhancedText = await this.translatePrompt(originalText);
          break;
        case 'rewrite':
          enhancedText = await this.rewritePrompt(originalText);
          break;
        case 'enhance':
          enhancedText = await this.enhancePrompt(originalText);
          break;
      }
      
      if (enhancedText && enhancedText.trim()) {
        // Show results
        menu.querySelector('#enhanced-text').textContent = enhancedText;
        menu.querySelector('#enhancement-results').style.display = 'block';
        menu.querySelector('#enhancement-loading').style.display = 'none';
      } else {
        throw new Error('No enhanced text received');
      }
      
    } catch (error) {
      console.error('❌ Enhancement failed:', error);
      menu.querySelector('#enhancement-loading').style.display = 'none';
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        background: #fed7d7; border: 1px solid #f56565; border-radius: 6px;
        padding: 12px; margin-top: 12px; color: #c53030; font-size: 14px;
      `;
      errorDiv.textContent = `❌ Enhancement failed: ${error.message}`;
      menu.querySelector('div[style*="padding: 20px"]').appendChild(errorDiv);
      
      setTimeout(() => errorDiv.remove(), 5000);
    }
  },

  async translatePrompt(text) {
    // Call AI API to translate the prompt
    const response = await this.callAI(
      `Translate this prompt to make it clearer and more effective for AI development assistance. Maintain the original intent but improve clarity and specificity:

"${text}"

Return only the improved prompt, no explanations.`
    );
    return response;
  },

  async rewritePrompt(text) {
    // Call AI API to rewrite the prompt
    const response = await this.callAI(
      `Rewrite this prompt to be more clear, specific, and effective for development assistance. Improve the structure and add helpful context:

"${text}"

Return only the rewritten prompt, no explanations.`
    );
    return response;
  },

  async enhancePrompt(text) {
    // Call AI API to enhance the prompt with Lovable best practices
    const response = await this.callAI(
      `${this.getLovablePromptingHandbookInstructions()}

Original prompt: "${text}"

Enhance this prompt using the Lovable best practices above. Make it more specific, structured, and effective. Return only the enhanced prompt, no explanations.`
    );
    return response;
  },

  getLovablePromptingHandbookInstructions() {
    return `You are an expert at enhancing prompts for Lovable.dev, a platform for building full-stack applications with AI assistance.

**KEY PRINCIPLES:**
1. Be Clear and Specific - Avoid vague requests
2. Step-by-Step Approach - Break complex tasks into steps
3. Use Structured Format - Organize information clearly
4. Role-Based Clarity - Specify what type of help is needed
5. Mobile-First Responsive Design - Always consider mobile users

**STRUCTURE FORMAT:**
- Context: Background or role setup
- Task: Specific goal to achieve  
- Guidelines: Preferred approach or style
- Constraints: Hard limits or must-not-dos

**LOVABLE SPECIFICS:**
- Mention specific technologies when relevant (React, TypeScript, Tailwind CSS, Supabase, etc.)
- Include responsive design requirements
- Specify component structure preferences
- Request error handling and accessibility considerations
- Ask for modern best practices

**EXAMPLES OF GOOD PROMPTS:**
"Create a responsive user profile component that displays user information with an edit mode. Use React with TypeScript, Tailwind CSS for styling, and ensure it works well on mobile devices. Include proper form validation and error handling."

vs. bad: "Make a profile page"`;
  },

  async callAI(prompt) {
    // This will be implemented to use the user's private API key
    try {
      const response = await window.lovableDetector.safeSendMessage({
        action: 'callAI',
        data: {
          prompt: prompt,
          provider: 'gemini' // Will be configurable
        }
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'AI API call failed');
      }
    } catch (error) {
      console.error('❌ AI API call failed:', error);
      throw error;
    }
  },

  updateInputFieldValue(inputElement, newValue) {
    // React-compatible value setting for textarea elements
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    ).set;
    
    nativeInputValueSetter.call(inputElement, newValue);
    
    // Trigger React events to update the component state
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });
    
    inputElement.dispatchEvent(inputEvent);
    inputElement.dispatchEvent(changeEvent);
    
    // Focus back to the input element
    inputElement.focus();
    
    // Set cursor to end
    inputElement.setSelectionRange(newValue.length, newValue.length);
  },

  removePromptMenu() {
    const existingMenu = document.getElementById('prompt-enhancement-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ChatInterface.init();
  });
} else {
  window.ChatInterface.init();
}