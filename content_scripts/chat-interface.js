// ===========================
// CHAT INTERFACE - EXTRACTED MODULE
// ===========================
// This section handles AI-powered prompt enhancement functionality including:
// - Prompt enhancement menu with keyboard shortcuts (Ctrl+Enter / Cmd+Enter)
// - AI-powered translation, rewriting, and enhancement features
// - Lovable input field detection and smart positioning
// - Input field value updating with proper event handling
// - Auto-expansion functionality for textarea elements
//
// Key Features:
// - AI Integration: Integrates with AI services for prompt enhancement
// - User Experience: Provides Ctrl+Enter shortcut for accessing enhancement features
// - Smart Detection: Automatically detects Lovable input fields
// - Multiple Enhancement Types: Translation, rewriting, and handbook-based enhancement

// Create ChatInterface class that will be mixed into LovableDetector
window.ChatInterface = {
  setupPromptEnhancement() {
    // Monitor for Ctrl+Enter / Cmd+Enter in Lovable input fields
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const target = e.target;
        
        // Check if we're in a Lovable input field
        if (this.isLovableInputField(target)) {
          // Prevent all default behaviors to stop message sending
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          this.showPromptEnhancementMenu(target);
          return false;
        }
      }
    }, true); // Use capture phase to intercept early
  },

  isLovableInputField(element) {
    // Check if the element is likely a Lovable input field
    if (!element || element.tagName !== 'TEXTAREA') return false;
    
    // Look for common Lovable input characteristics
    const commonSelectors = [
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="ask"]',
      'textarea[data-testid*="input"]',
      'textarea[class*="input"]'
    ];
    
    return commonSelectors.some(selector => element.matches(selector)) ||
           element.closest('[class*="chat"]') ||
           element.closest('[class*="input"]') ||
           element.closest('[data-testid*="chat"]');
  },

  showPromptEnhancementMenu(inputElement) {
    // Remove existing menu
    const existingMenu = document.getElementById('prompt-helper-menu');
    if (existingMenu) existingMenu.remove();
    
    const menu = document.createElement('div');
    menu.id = 'prompt-helper-menu';
    menu.innerHTML = `
      <div style="
        position: absolute; z-index: 999999; background: white; 
        border: 1px solid #c9cfd7; border-radius: 8px; box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        padding: 16px; min-width: 300px; max-width: 400px; font-family: system-ui, sans-serif;
      ">
        <h4 style="margin: 0 0 12px 0; color: #1a202c; font-size: 14px; font-weight: 600;">
          ✨ Prompt Helper Menu
        </h4>
        <div id="prompt-templates-menu" style="display: grid; gap: 8px; max-height: 400px; overflow-y: auto;">
          <!-- Templates will be loaded here -->
        </div>
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; gap: 6px; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 6px;">
            <button id="translate-prompt-btn" style="
              background: #3182ce; color: white; border: none;
              padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;
            ">Translate</button>
            <button id="rewrite-prompt-btn" style="
              background: #38a169; color: white; border: none;
              padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;
            ">Rewrite</button>
            <button id="enhance-prompt-btn" style="
              background: #805ad5; color: white; border: none;
              padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;
            ">Enhance</button>
          </div>
          <button id="close-prompt-menu" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
          ">Close</button>
        </div>
      </div>
    `;
    
    // Position menu near the input with smart positioning
    document.body.appendChild(menu);
    
    const rect = inputElement.getBoundingClientRect();
    
    menu.style.position = 'fixed';
    menu.style.visibility = 'hidden'; // Hide while calculating position
    
    // Force a layout to get accurate dimensions
    menu.offsetHeight;
    
    const menuRect = menu.getBoundingClientRect();
    
    // Calculate position based on the specific Lovable chat container element
    let top, left = rect.left;
    
    try {
      // Find the specific element: /html/body/div[1]/div/div[2]/main/div/div/div[1]/div/div[1]
      const chatContainerElement = document.evaluate(
        '/html/body/div[1]/div/div[2]/main/div/div/div[1]/div/div[1]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      
      if (chatContainerElement) {
        const containerRect = chatContainerElement.getBoundingClientRect();
        // Position at the height of the container minus 514px
        top = containerRect.height - 465;
        
        // Ensure minimum distance from top of viewport
        top = Math.max(top, 10);
        
        console.log('📍 Positioned menu using chat container height minus 514px:', {
          containerHeight: containerRect.height,
          calculatedTop: top,
          formula: 'containerHeight - 514px'
        });
      } else {
        throw new Error('Chat container element not found');
      }
    } catch (error) {
      console.warn('Could not find specific chat container element, using fallback positioning:', error);
      
      // Fallback to original positioning above input
      top = rect.top - menuRect.height - 15;
      
      // Ensure menu stays within viewport
      if (top < 10) {
        // Calculate available space above input
        const availableSpace = rect.top - 20;
        
        if (availableSpace < menuRect.height) {
          // Reduce menu height to fit available space
          const maxMenuHeight = Math.max(200, availableSpace - 10);
          const templatesContainer = menu.querySelector('#prompt-templates-menu');
          if (templatesContainer) {
            templatesContainer.style.maxHeight = (maxMenuHeight - 100) + 'px';
          }
          
          // Recalculate menu height after adjustment
          menu.offsetHeight;
          const newMenuRect = menu.getBoundingClientRect();
          top = rect.top - newMenuRect.height - 10;
        } else {
          top = 10;
        }
        
        // Ensure minimum gap from input
        top = Math.min(top, rect.top - 50);
      }
    }
    
    // Ensure menu doesn't go off the right edge
    if (left + menuRect.width > window.innerWidth - 20) {
      left = window.innerWidth - menuRect.width - 20;
    }
    
    // Ensure menu doesn't go off the left edge
    if (left < 20) {
      left = 20;
    }
    
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
    menu.style.visibility = 'visible'; // Show after positioning
    
    // Load prompt templates into menu
    this.loadTemplatesIntoMenu();
    
    // Add menu styles
    if (!document.getElementById('prompt-menu-styles')) {
      const style = document.createElement('style');
      style.id = 'prompt-menu-styles';
      style.textContent = `
        .prompt-option {
          display: block; width: 100%; text-align: left; 
          background: #f8fafc; border: 1px solid #e2e8f0; 
          padding: 6px 10px; margin: 2px 0; border-radius: 4px; 
          cursor: pointer; font-size: 13px; color: #4a5568;
        }
        .prompt-option:hover {
          background: #667eea; color: white;
        }
        .prompt-category {
          margin-bottom: 12px;
        }
        #translate-prompt-btn:hover {
          background: #2c5aa0 !important;
        }
        #rewrite-prompt-btn:hover {
          background: #2f855a !important;
        }
        #enhance-prompt-btn:hover {
          background: #6b46c1 !important;
        }
        #translate-prompt-btn:disabled,
        #rewrite-prompt-btn:disabled,
        #enhance-prompt-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add event listeners
    menu.querySelectorAll('.prompt-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const templateContent = btn.getAttribute('data-template');
        const currentValue = inputElement.value.trim();
        
        // Add template content with proper formatting
        if (currentValue) {
          inputElement.value = templateContent + '\n\n' + currentValue;
        } else {
          inputElement.value = templateContent;
        }
        
        inputElement.focus();
        menu.remove();
      });
    });
    
    // Add event listeners for new buttons
    document.getElementById('translate-prompt-btn')?.addEventListener('click', () => {
      this.translatePrompt(inputElement, menu);
    });
    
    document.getElementById('rewrite-prompt-btn')?.addEventListener('click', () => {
      this.rewritePrompt(inputElement, menu);
    });
    
    document.getElementById('enhance-prompt-btn')?.addEventListener('click', () => {
      this.enhancePromptWithHandbook(inputElement, menu);
    });
    
    document.getElementById('close-prompt-menu')?.addEventListener('click', () => {
      menu.remove();
    });
    
    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
  },

  updateInputFieldValue(inputElement, newValue) {
    // Safety checks
    if (!inputElement || !newValue || typeof newValue !== 'string') {
      console.error('❌ Invalid input element or value for updateInputFieldValue');
      return;
    }
    
    try {
      // Multiple approaches to ensure the value is set properly
      
      // 1. Set the value directly
      inputElement.value = newValue;
      
      // 2. Clear the field first, then set the new value
      if (inputElement.select && inputElement.setRangeText) {
        inputElement.select();
        inputElement.setRangeText(newValue, 0, inputElement.value.length, 'end');
      }
      
      // 3. Trigger multiple events to ensure any listeners are notified
      const events = ['input', 'change', 'keyup', 'paste'];
      events.forEach(eventType => {
        try {
          inputElement.dispatchEvent(new Event(eventType, { 
            bubbles: true, 
            cancelable: true 
          }));
        } catch (e) {
          console.warn('Failed to dispatch event:', eventType, e);
        }
      });
      
      // 4. Force the cursor to the end
      if (inputElement.setSelectionRange) {
        try {
          inputElement.setSelectionRange(newValue.length, newValue.length);
        } catch (e) {
          console.warn('Failed to set selection range:', e);
        }
      }
      
      // 5. Ensure the field is focused
      if (inputElement.focus) {
        inputElement.focus();
      }
      
      console.log('✅ Input field updated with:', newValue.substring(0, 50) + '...');
      
    } catch (error) {
      console.error('❌ Error updating input field:', error);
      // Fallback: just set the value
      inputElement.value = newValue;
    }
  },

  async translatePrompt(inputElement, menu) {
    if (!inputElement || !menu) {
      console.error('❌ Missing required elements for translatePrompt');
      return;
    }
    
    const currentPrompt = inputElement.value ? inputElement.value.trim() : '';
    if (!currentPrompt) {
      alert('Please enter a prompt to translate.');
      return;
    }

    const button = document.getElementById('translate-prompt-btn');
    if (!button) {
      console.error('❌ Translate button not found');
      return;
    }
    
    const originalText = button.textContent;
    button.textContent = 'Translating...';
    button.disabled = true;

    try {
      const response = await this.safeSendMessage({
        action: 'aiRequest',
        prompt: `You must translate the following text to English. Your response should contain ONLY the translated text with no introductions, explanations, greetings, quotation marks, or any other text before or after. Do not add "Here is the translation:" or similar phrases. Just output the direct translation:

${currentPrompt}`
      });

      if (response && response.success && response.content) {
        // Clean the response to remove any potential wrapper text
        let cleanedContent = response.content.trim();
        
        // Remove common AI response prefixes/suffixes
        cleanedContent = cleanedContent.replace(/^(Here is the translation:|The translation is:|Translated text:|Translation:)\s*/i, '');
        cleanedContent = cleanedContent.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
        
        this.updateInputFieldValue(inputElement, cleanedContent);
        
        // Small delay to ensure the value is properly set before closing menu
        setTimeout(() => {
          menu.remove();
        }, 100);
      } else {
        alert('Translation failed: ' + (response?.error || 'No response received'));
      }
    } catch (error) {
      alert('Translation failed: ' + error.message);
    } finally {
      if (button) {
        button.textContent = originalText;
        button.disabled = false;
      }
    }
  },

  async rewritePrompt(inputElement, menu) {
    if (!inputElement || !menu) {
      console.error('❌ Missing required elements for rewritePrompt');
      return;
    }
    
    const currentPrompt = inputElement.value ? inputElement.value.trim() : '';
    if (!currentPrompt) {
      alert('Please enter a prompt to rewrite.');
      return;
    }

    const button = document.getElementById('rewrite-prompt-btn');
    if (!button) {
      console.error('❌ Rewrite button not found');
      return;
    }
    
    const originalText = button.textContent;
    button.textContent = 'Rewriting...';
    button.disabled = true;

    try {
      const response = await this.safeSendMessage({
        action: 'aiRequest',
        prompt: `You must fix grammar, spelling errors, and sentence structure to make the following text more fluent and professional. Your response should contain ONLY the corrected text with no introductions, explanations, greetings, quotation marks, or any other text before or after. Do not add "Here is the corrected text:" or similar phrases. Just output the direct rewritten text:

${currentPrompt}`
      });

      if (response && response.success && response.content) {
        // Clean the response to remove any potential wrapper text
        let cleanedContent = response.content.trim();
        
        // Remove common AI response prefixes/suffixes
        cleanedContent = cleanedContent.replace(/^(Here is the corrected text:|The corrected text is:|Rewritten text:|Corrected:)\s*/i, '');
        cleanedContent = cleanedContent.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
        
        this.updateInputFieldValue(inputElement, cleanedContent);
        
        // Small delay to ensure the value is properly set before closing menu
        setTimeout(() => {
          menu.remove();
        }, 100);
      } else {
        alert('Rewrite failed: ' + (response?.error || 'No response received'));
      }
    } catch (error) {
      alert('Rewrite failed: ' + error.message);
    } finally {
      if (button) {
        button.textContent = originalText;
        button.disabled = false;
      }
    }
  },

  async enhancePromptWithHandbook(inputElement, menu) {
    if (!inputElement || !menu) {
      console.error('❌ Missing required elements for enhancePromptWithHandbook');
      return;
    }
    
    const currentPrompt = inputElement.value ? inputElement.value.trim() : '';
    if (!currentPrompt) {
      alert('Please enter a prompt to enhance.');
      return;
    }

    const button = document.getElementById('enhance-prompt-btn');
    if (!button) {
      console.error('❌ Enhance button not found');
      return;
    }
    
    const originalText = button.textContent;
    button.textContent = 'Enhancing...';
    button.disabled = true;

    try {
      const enhancementInstructions = this.getLovablePromptingHandbookInstructions();
      
      const response = await this.safeSendMessage({
        action: 'aiRequest',
        prompt: `${enhancementInstructions}

Now enhance the following prompt according to these Lovable best practices. Your response should contain ONLY the enhanced prompt with no introductions, explanations, greetings, quotation marks, or any other text before or after. Do not add "Here is the enhanced prompt:" or similar phrases. Just output the direct enhanced prompt:

${currentPrompt}`
      });

      if (response && response.success && response.content) {
        // Clean the response to remove any potential wrapper text
        let cleanedContent = response.content.trim();
        
        // Remove common AI response prefixes/suffixes
        cleanedContent = cleanedContent.replace(/^(Here is the enhanced prompt:|The enhanced prompt is:|Enhanced prompt:|Enhanced:)\s*/i, '');
        cleanedContent = cleanedContent.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
        
        this.updateInputFieldValue(inputElement, cleanedContent);
        
        // Small delay to ensure the value is properly set before closing menu
        setTimeout(() => {
          menu.remove();
        }, 100);
      } else {
        alert('Enhancement failed: ' + (response?.error || 'No response received'));
      }
    } catch (error) {
      alert('Enhancement failed: ' + error.message);
    } finally {
      if (button) {
        button.textContent = originalText;
        button.disabled = false;
      }
    }
  },

  getLovablePromptingHandbookInstructions() {
    return `You are an expert at enhancing prompts for Lovable, an AI-powered full-stack development platform. Enhance user prompts according to these Lovable best practices:

**KEY PRINCIPLES:**
1. **Be Clear and Specific**: Clear, verbose prompts = better output. Be specific about the exact page, component, or behavior.
2. **Step-by-Step Approach**: Avoid assigning multiple tasks simultaneously. Focus on one task at a time.
3. **Use Structured Format**: Break prompts into sections: Context, Task, Guidelines, Constraints.
4. **Role-Based Clarity**: If the app has multiple roles (Admin, User, etc.), always specify which role applies.
5. **Mobile-First Responsive Design**: Ensure all designs are completely responsive using modern UI/UX practices.

**SPECIFIC ENHANCEMENTS TO APPLY:**
- Add clear context about what the user is building
- Break down complex requests into specific, actionable steps
- Include technical preferences (React, Tailwind, ShadCN, Supabase, etc.)
- Specify responsive design requirements
- Add accessibility considerations
- Include guardrails about what NOT to touch
- Mention specific files or components if relevant
- Add testing or validation requirements
- Include error handling considerations

**STRUCTURE FORMAT:**
If the prompt is complex, organize it as:
- **Context**: Background or role setup
- **Task**: Specific goal to achieve
- **Guidelines**: Preferred approach or style
- **Constraints**: Hard limits or must-not-dos

**RESPONSIVE DESIGN GUIDELINES:**
- Ensure mobile-first approach
- Use Tailwind's standard breakpoints
- Avoid custom breakpoints unless specified
- Plan responsive implementation from largest to smallest components

**ACCESSIBILITY & BEST PRACTICES:**
- Include ARIA labels and keyboard navigation
- Follow modern accessibility standards
- Use semantic HTML elements
- Ensure proper color contrast

**CAUTIOUS APPROACH FOR CRITICAL CHANGES:**
If the change affects critical parts, add warnings about:
- Examining related code and dependencies before changes
- Avoiding modifications to unrelated components
- Ensuring thorough testing after changes
- Pausing if uncertain

Transform the user's prompt to follow these guidelines while preserving their original intent.`;
  },

  setupInputAutoExpansion() {
    // Monitor for input changes and auto-expand
    document.addEventListener('input', (e) => {
      if (localStorage.getItem('lovable-auto-expand') !== 'true') return;
      
      const target = e.target;
      if (this.isLovableInputField(target)) {
        this.autoExpandTextarea(target);
      }
    });
  },

  autoExpandTextarea(textarea) {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set new height based on content
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px
    textarea.style.height = newHeight + 'px';
  },

  showChatInterface() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '💬 Project Manager';
    }
    
    if (!content) return;
    
    const projectName = this.extractProjectName();
    
    content.innerHTML = `
      <div id="chat-messages" style="
        flex: 1; overflow-y: auto; padding: 10px; background: #f8fafc;
        display: flex; flex-direction: column;
      ">
        <div style="
          background: #e6fffa; border: 1px solid #81e6d9; border-radius: 18px;
          padding: 12px 16px; margin-bottom: 12px; font-size: 14px; color: #234e52;
          align-self: flex-start; max-width: 85%;
        ">
          👋 Hello! I'm your AI assistant for project <strong>${projectName}</strong>.
        </div>
      </div>
      
      <div style="
        border-top: 1px solid #c9cfd7; padding: 10px; background: white;
        border-radius: 0 0 12px 12px;
      ">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;
          ">← Back</button>
        </div>
        <div style="display: flex; gap: 8px;">
          <textarea id="chat-input" placeholder="Ask me anything about your project..." style="
            flex: 1; padding: 12px; border: 1px solid #c9cfd7; border-radius: 8px;
            font-family: inherit; font-size: 14px; resize: none; min-height: 40px;
            max-height: 120px; outline: none; background: white; color: #2d3748;
          "></textarea>
          <button id="send-btn" style="
            background: #667eea; color: white; border: none; padding: 12px 16px;
            border-radius: 8px; cursor: pointer; font-size: 14px; min-width: 60px;
          ">Send</button>
        </div>
      </div>
    `;
    
    this.setupBackButton();
    this.setupChatFunctionality();
  },

  showSettingsPage() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '⚙️ Settings';
    }
    
    if (!content) return;
    
    // Scroll to top of the dialog content
    content.scrollTop = 0;
    
    content.innerHTML = `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;
          ">← Back to Welcome</button>
        </div>
        
        <!-- AI Provider Configuration -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            🤖 AI Model Configuration
          </h3>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: #4a5568; font-size: 14px; font-weight: 500;">
              Select AI Provider
            </label>
            <div style="display: flex; gap: 12px; margin-bottom: 16px;">
              <label style="
                display: flex; align-items: center; gap: 8px; padding: 12px 16px;
                border: 2px solid #c9cfd7; border-radius: 8px; cursor: pointer;
                transition: all 0.2s; flex: 1;
              " class="ai-provider-option">
                <input type="radio" name="ai-provider" value="claude" id="provider-claude" style="width: 16px; height: 16px;">
                <div>
                  <div style="font-weight: 600; color: #1a202c;">Claude</div>
                  <div style="font-size: 12px; color: #718096;">Anthropic</div>
                </div>
              </label>
              
              <label style="
                display: flex; align-items: center; gap: 8px; padding: 12px 16px;
                border: 2px solid #c9cfd7; border-radius: 8px; cursor: pointer;
                transition: all 0.2s; flex: 1;
              " class="ai-provider-option">
                <input type="radio" name="ai-provider" value="openai" id="provider-openai" style="width: 16px; height: 16px;">
                <div>
                  <div style="font-weight: 600; color: #1a202c;">GPT</div>
                  <div style="font-size: 12px; color: #718096;">OpenAI</div>
                </div>
              </label>
              
              <label style="
                display: flex; align-items: center; gap: 8px; padding: 12px 16px;
                border: 2px solid #c9cfd7; border-radius: 8px; cursor: pointer;
                transition: all 0.2s; flex: 1;
              " class="ai-provider-option">
                <input type="radio" name="ai-provider" value="gemini" id="provider-gemini" style="width: 16px; height: 16px;">
                <div>
                  <div style="font-weight: 600; color: #1a202c;">Gemini</div>
                  <div style="font-size: 12px; color: #718096;">Google</div>
                </div>
              </label>
            </div>
            
            <!-- Claude API Key -->
            <div id="claude-config" style="display: none;">
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Claude API Key</label>
              <input type="password" id="claude-api-key" placeholder="sk-ant-..." style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 12px;
                background: white; color: #1a202c;
              ">
              
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Model</label>
              <select id="claude-model" style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 8px; background: white;
                color: #1a202c; appearance: auto; -webkit-appearance: menulist;
              ">
                <option value="claude-opus-4-20250514">Claude Opus 4</option>
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                <option value="claude-3-7-sonnet-latest">Claude 3.7 Sonnet</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku</option>
              </select>
              
              <div style="font-size: 12px; color: #718096;">
                Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color: #667eea;">console.anthropic.com</a>
              </div>
              
              <button id="test-claude-connection" style="
                background: #48bb78; color: white; border: none; padding: 8px 16px;
                border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
                margin-top: 12px;
              ">Test Claude Connection</button>
              
              <div id="claude-status" style="
                margin-top: 8px; padding: 8px; border-radius: 6px; font-size: 12px;
                display: none;
              "></div>
            </div>
            
            <!-- OpenAI API Key -->
            <div id="openai-config" style="display: none;">
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">OpenAI API Key</label>
              <input type="password" id="openai-api-key" placeholder="sk-..." style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 12px;
                background: white; color: #1a202c;
              ">
              
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Model</label>
              <select id="openai-model" style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 8px; background: white;
                color: #1a202c; appearance: auto; -webkit-appearance: menulist;
              ">
                <option value="o4-mini-2025-04-16">O4 Mini</option>
                <option value="gpt-4.1-2025-04-14">GPT-4.1</option>
                <option value="gpt-4.1-mini-2025-04-14">GPT-4.1 Mini</option>
                <option value="gpt-4o-2024-08-06">GPT-4o</option>
                <option value="gpt-4o-mini-2024-07-18">GPT-4o Mini</option>
              </select>
              
              <div style="font-size: 12px; color: #718096;">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #667eea;">platform.openai.com</a>
              </div>
              
              <button id="test-openai-connection" style="
                background: #48bb78; color: white; border: none; padding: 8px 16px;
                border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
                margin-top: 12px;
              ">Test OpenAI Connection</button>
              
              <div id="openai-status" style="
                margin-top: 8px; padding: 8px; border-radius: 6px; font-size: 12px;
                display: none;
              "></div>
            </div>
            
            <!-- Gemini API Key -->
            <div id="gemini-config" style="display: none;">
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Gemini API Key</label>
              <input type="password" id="gemini-api-key" placeholder="AIza..." style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 12px;
                background: white; color: #1a202c;
              ">
              
              <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Model</label>
              <select id="gemini-model" style="
                width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
                font-size: 14px; font-family: inherit; margin-bottom: 8px; background: white;
                color: #1a202c; appearance: auto; -webkit-appearance: menulist;
              ">
                <option value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro-preview-05-06">Gemini 2.5 Pro</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
              
              <div style="font-size: 12px; color: #718096;">
                Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: #667eea;">Google AI Studio</a>
              </div>
              
              <button id="test-gemini-connection" style="
                background: #48bb78; color: white; border: none; padding: 8px 16px;
                border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
                margin-top: 12px;
              ">Test Gemini Connection</button>
              
              <div id="gemini-status" style="
                margin-top: 8px; padding: 8px; border-radius: 6px; font-size: 12px;
                display: none;
              "></div>
            </div>
          </div>
        </div>
        
        <!-- Database Configuration -->
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            💾 Database Configuration (Supabase)
          </h3>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Project ID</label>
            <input type="text" id="supabase-project-id" placeholder="your-project-id" style="
              width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; font-family: inherit;
              background: white; color: #1a202c;
            ">
            <div style="margin-top: 4px; font-size: 12px; color: #718096;">
              Find this in your Supabase dashboard URL: https://[project-id].supabase.co
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 4px; color: #4a5568; font-size: 13px;">Anon/Public Key</label>
            <input type="password" id="supabase-key" placeholder="eyJ..." style="
              width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; font-family: inherit;
              background: white; color: #1a202c;
            ">
          </div>
          
          <button id="test-database-connection" style="
            background: #48bb78; color: white; border: none; padding: 10px 16px;
            border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
          ">Test Database Connection</button>
          
          <div id="database-status" style="
            margin-top: 12px; padding: 10px; border-radius: 6px; font-size: 13px;
            display: none;
          "></div>
        </div>
        
        
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            🎨 Appearance
          </h3>
          <p style="margin: 0; color: #4a5568; font-size: 14px;">
            Coming soon: Customize fonts, colors, and dialog size.
          </p>
        </div>
      </div>
    `;
    
    this.setupBackButton();
    this.setupAPIProviderSelection();
    this.setupAPIConfiguration();
    this.loadAPISettings();
    
    // Ensure dialog content is scrolled to top
    const dialogContent = document.getElementById('dialog-content');
    if (dialogContent) {
      dialogContent.scrollTop = 0;
    }
  },

  extractProjectName() {
    // Try to get project name from page title first
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.textContent) {
      const title = titleElement.textContent.trim();
      
      // Extract from Lovable title format "Project Name - Lovable"
      if (title.includes(' - Lovable')) {
        return title.replace(' - Lovable', '').trim();
      }
      
      // Extract from other possible formats
      if (title.includes('Lovable')) {
        return title.replace(/Lovable/g, '').replace(/[-|]/g, '').trim();
      }
      
      // If title doesn't contain Lovable, return as is (up to first 50 chars)
      return title.length > 50 ? title.substring(0, 50) + '...' : title;
    }
    
    // Fallback: try to extract from URL
    const url = window.location.href;
    const projectIdMatch = url.match(/\/projects\/([^\/\?]+)/);
    if (projectIdMatch && projectIdMatch[1]) {
      // Convert URL-safe project ID to readable format
      return projectIdMatch[1]
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // Final fallback
    return 'Current Project';
  }
};