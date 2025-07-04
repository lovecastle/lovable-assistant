// ===========================
// UI DIALOG MANAGER - EXTRACTED MODULE
// ===========================
// Handles dialog creation, styling, navigation, and user interactions
// This section manages the main assistant dialog and all its views
// 
// Key responsibilities:
// - Creating and styling the main dialog window
// - Managing dialog state (open/close)
// - Handling drag functionality
// - Welcome page and navigation setup
// - Cross-section UI coordination

// Create UIDialogManager class that will be mixed into LovableDetector
window.UIDialogManager = {
  // UI Dialog Management Methods
  async toggleAssistant() {
    const now = Date.now();
    
    // Debounce rapid toggles (prevent toggles within 300ms)
    if (now - this.lastToggleTime < 300) {
      return;
    }
    
    this.lastToggleTime = now;
    
    // Prevent actions if currently in the middle of closing
    if (this.isClosing) {
      return;
    }
    
    if (this.assistantDialog && document.body.contains(this.assistantDialog)) {
      this.closeAssistant();
    } else {
      // Check if project is owned before showing the assistant
      if (!this.projectChecked) {
        console.log('⚠️ Project ownership not yet verified. Checking now...');
        // Check project ownership first
        if (typeof this.autoSaveProjectInfo === 'function') {
          this.autoSaveProjectInfo().then(async project => {
            if (project) {
              // Project is owned, show the assistant
              await this.showAssistant();
            } else {
              console.log('🚫 Cannot open assistant - project is not owned by user');
              this.showNotOwnedNotification();
            }
          }).catch(error => {
            console.error('❌ Error checking project ownership:', error);
          });
        }
      } else {
        // Already checked - show assistant for owned projects, show not-owned notification for public projects
        if (this.isProjectOwned) {
          await this.showAssistant();
        } else {
          console.log('🚫 Cannot open assistant - project is not owned by user');
          this.showNotOwnedNotification();
        }
      }
    }
  },

  closeAssistant() {
    if (this.assistantDialog && !this.isClosing) {
      this.isClosing = true;
      
      try {
        // Remove any existing event listeners to prevent conflicts
        this.removeDialogEventListeners();
        
        // Remove the dialog from DOM
        this.assistantDialog.remove();
        this.assistantDialog = null;
      } catch (error) {
        console.error('Error during close:', error);
      } finally {
        // Reset closing flag after a short delay
        setTimeout(() => {
          this.isClosing = false;
        }, 100);
      }
    }
  },

  removeDialogEventListeners() {
    // Remove any close button listeners that might be attached
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
      // Clone the button to remove all event listeners
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    }
  },

  showReadyNotification() {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: system-ui, sans-serif;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        🤖 AI Chat Ready
        <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
          Press Cmd+K to start chatting
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    notification.addEventListener('click', () => {
      this.showAssistant();
      notification.remove();
    });
  },

  showNotOwnedNotification() {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f56565;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: system-ui, sans-serif;
        font-size: 14px;
      ">
        🚫 Cannot Open Assistant
        <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
          This feature is only available for your own projects
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  },


  async showAssistant() {
    // Always create and show the dialog for owned projects
    if (this.assistantDialog) {
      this.assistantDialog.remove();
    }
    
    this.assistantDialog = this.createAssistantDialog();
    document.body.appendChild(this.assistantDialog);
    
    // Set up the close button handler immediately after creating the dialog
    this.setupCloseButton();
    
    setTimeout(async () => {
      this.makeDraggable();
      
      // Check authentication and show appropriate content
      let isAuthenticated = false;
      try {
        const authResponse = await this.safeSendMessage({ action: 'checkAuth' });
        isAuthenticated = authResponse?.success && authResponse.data?.isAuthenticated;
      } catch (error) {
        console.log('⚠️ Could not verify authentication');
        isAuthenticated = false;
      }
      
      if (isAuthenticated) {
        this.showWelcomePage(); // Show normal welcome page if authenticated
      } else {
        this.showAuthSection(); // Show login/register page if not authenticated
      }
      
      // Ensure close button is working with a retry mechanism
      this.ensureCloseButtonWorks();
    }, 50);
  },

  setupCloseButton() {
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
      // Remove any existing listeners first
      closeBtn.onclick = null;
      closeBtn.removeEventListener('click', this.handleCloseClick);
      
      // Create bound handler for proper context
      this.handleCloseClick = (e) => {
        console.log('Close button clicked'); // Debug log
        const now = Date.now();
        if (this.lastCloseClickTime && now - this.lastCloseClickTime < 300) {
          return;
        }
        this.lastCloseClickTime = now;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Close immediately without delay
        this.closeAssistant();
      };
      
      // Add multiple event listeners for reliability
      closeBtn.addEventListener('click', this.handleCloseClick, true);
      closeBtn.addEventListener('mousedown', this.handleCloseClick, true);
      
      // Add visual feedback
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255,255,255,0.4)';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(255,255,255,0.2)';
      });
      
      console.log('Close button event handlers attached'); // Debug log
    } else {
      console.warn('Close button not found!'); // Debug log
    }
  },

  ensureCloseButtonWorks() {
    // Retry mechanism to ensure close button is always clickable
    let retryCount = 0;
    const maxRetries = 3;
    
    const checkAndSetup = () => {
      const closeBtn = document.getElementById('close-btn');
      if (closeBtn && retryCount < maxRetries) {
        // Test if the button is actually clickable
        const rect = closeBtn.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        
        if (isVisible) {
          // Force setup the close button again
          this.setupCloseButton();
          console.log('Close button setup verified');
        } else {
          retryCount++;
          setTimeout(checkAndSetup, 100);
        }
      }
    };
    
    setTimeout(checkAndSetup, 100);
  },

  // Loading state management for dialog content
  showDialogLoading(title = 'Loading...') {
    const content = document.getElementById('dialog-content');
    const dialogTitle = document.getElementById('dialog-title');
    
    if (dialogTitle) {
      dialogTitle.textContent = `🤖 ${title}`;
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #4a5568;
        font-size: 14px;
        gap: 16px;
      ">
        <div style="
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <div>Loading...</div>
      </div>
    `;
    
    // Add spinner animation if not exists
    if (!document.getElementById('spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  },

  extractProjectId(url = window.location.href) {
    if (!url) return null;
    const match = url.match(/\/projects\/([^\/\?]+)/);
    return match ? match[1] : null;
  },

  // Project name extraction functionality
  extractProjectName() {
    try {
      // Method 1: Try to get from page title first
      const titleElement = document.querySelector('title');
      if (titleElement) {
        const title = titleElement.textContent.trim();
        console.log('🔍 Trying to extract project name from title:', title);
        
        // Look for various patterns
        const patterns = [
          /^(.+?)\s*[-–|]\s*Lovable/i,  // "ProjectName - Lovable" or "ProjectName | Lovable"
          /^(.+?)\s*[-–|]\s*lovable\.dev/i, // "ProjectName - lovable.dev"
          /^(.+?)\s*\|\s*(.+)/i,       // "ProjectName | anything"
          /^(.+?)\s*[-–]\s*(.+)/i      // "ProjectName - anything"
        ];
        
        for (const pattern of patterns) {
          const titleMatch = title.match(pattern);
          if (titleMatch && titleMatch[1].trim() && titleMatch[1].trim().length > 0) {
            const extractedName = titleMatch[1].trim();
            console.log('✅ Extracted project name from title:', extractedName);
            return extractedName;
          }
        }
      }

      // Method 2: Try to get from breadcrumb or navigation elements
      const navElements = [
        'nav [data-testid*="project"]',
        'nav h1',
        'nav .project-name',
        '[data-testid="project-name"]',
        '.project-title',
        'header h1'
      ];
      
      for (const selector of navElements) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 0) {
          const navName = element.textContent.trim();
          console.log('✅ Extracted project name from navigation:', navName);
          return navName;
        }
      }

      // Method 3: Try to get from URL path as last resort
      const urlProjectId = this.extractProjectIdFromUrl();
      if (urlProjectId) {
        console.log('⚠️ Using project ID as fallback name:', urlProjectId);
        return urlProjectId;
      }

      // Final fallback
      console.log('⚠️ No project name found, using fallback');
      return 'Unknown Project';
    } catch (error) {
      console.warn('⚠️ Could not extract project name:', error);
      return 'Unknown Project';
    }
  },

  extractProjectIdFromUrl() {
    try {
      const url = window.location.href;
      const match = url.match(/\/projects\/([^\/\?]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.warn('⚠️ Could not extract project ID from URL:', error);
      return null;
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  createAssistantDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'lovable-assistant-dialog';
    
    // Add CSS styles for scrollbar and markdown
    if (!document.getElementById('chat-styles')) {
      const style = document.createElement('style');
      style.id = 'chat-styles';
      style.textContent = `
        /* Global minimalist scrollbar styles for the extension */
        #lovable-assistant-dialog *::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        #lovable-assistant-dialog *::-webkit-scrollbar-track {
          background: transparent;
        }
        #lovable-assistant-dialog *::-webkit-scrollbar-thumb {
          background: rgba(203, 213, 224, 0.6);
          border-radius: 2px;
        }
        #lovable-assistant-dialog *::-webkit-scrollbar-thumb:hover {
          background: rgba(160, 174, 192, 0.8);
        }
        #lovable-assistant-dialog *::-webkit-scrollbar-corner {
          background: transparent;
        }
        
        /* Specific styles for dialog content areas */
        #dialog-content::-webkit-scrollbar,
        #chat-messages::-webkit-scrollbar { 
          width: 4px; 
          height: 4px;
        }
        #dialog-content::-webkit-scrollbar-track,
        #chat-messages::-webkit-scrollbar-track { 
          background: transparent; 
        }
        #dialog-content::-webkit-scrollbar-thumb,
        #chat-messages::-webkit-scrollbar-thumb { 
          background: rgba(203, 213, 224, 0.6); 
          border-radius: 2px; 
        }
        #dialog-content::-webkit-scrollbar-thumb:hover,
        #chat-messages::-webkit-scrollbar-thumb:hover { 
          background: rgba(160, 174, 192, 0.8); 
        }
        
        /* Enhanced list styling for HTML content */
        #lovable-assistant-dialog ul {
          list-style-type: disc !important;
          padding-left: 20px !important;
          margin: 8px 0 !important;
        }
        
        #lovable-assistant-dialog ol {
          list-style-type: decimal !important;
          padding-left: 20px !important;
          margin: 8px 0 !important;
        }
        
        #lovable-assistant-dialog li {
          display: list-item !important;
          margin-bottom: 4px !important;
        }
        
        #lovable-assistant-dialog ul ul,
        #lovable-assistant-dialog ol ol,
        #lovable-assistant-dialog ul ol,
        #lovable-assistant-dialog ol ul {
          margin: 4px 0 !important;
        }
        
        /* Ensure nested lists have different styles */
        #lovable-assistant-dialog ul ul {
          list-style-type: circle !important;
        }
        
        #lovable-assistant-dialog ul ul ul {
          list-style-type: square !important;
        }
        
        @keyframes pulse { 0%, 60%, 100% { opacity: 0.4; transform: scale(1); } 30% { opacity: 1; transform: scale(1.2); } }
        @keyframes slideIn { 0% { transform: translateX(100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
      `;
      document.head.appendChild(style);
    }
    
    dialog.innerHTML = `
      <div id="assistant-window" style="
        position: fixed; top: 100px; left: 100px; width: 450px; height: 600px;
        background: white; border: 1px solid #c9cfd7; border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15); z-index: 10001;
        font-family: system-ui, sans-serif; display: flex; flex-direction: column;
      ">
        <div id="drag-handle" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 10px; border-radius: 12px 12px 0 0;
          display: flex; justify-content: space-between; align-items: center;
          cursor: move; user-select: none;
        ">
          <h3 id="dialog-title" style="margin: 0; font-size: 16px;">🤖 Lovable Assistant</h3>
          <button id="close-btn" style="
            background: rgba(255,255,255,0.2); border: none; color: white;
            padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 16px;
            position: relative; z-index: 10002; min-width: 24px; min-height: 24px;
            display: flex; align-items: center; justify-content: center;
            transition: background-color 0.2s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
             onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
        </div>
        
        <div id="dialog-content" style="
          flex: 1; overflow-y: auto; background: #f8fafc;
          display: flex; flex-direction: column;
        ">
          <!-- Content will be dynamically loaded here -->
        </div>
      </div>
    `;
    
    return dialog;
  },

  showAuthSection() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '🔐 Sign In Required';
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <div style="margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px 0; color: #1a202c; font-size: 24px; font-weight: 600;">
            Welcome! 👋
          </h2>
          <p style="margin: 0; color: #4a5568; font-size: 16px;">
            Please sign in to access your development assistant
          </p>
        </div>
        
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
          <div id="auth-forms">
            <!-- Login Form -->
            <div id="login-form">
              <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 18px; font-weight: 600;">Sign In</h3>
              
              <input type="email" id="login-email" placeholder="Email" style="
                width: 100%; padding: 12px; margin-bottom: 12px; border: 1px solid #c9cfd7; 
                border-radius: 6px; font-size: 14px; box-sizing: border-box;
              ">
              <input type="password" id="login-password" placeholder="Password" style="
                width: 100%; padding: 12px; margin-bottom: 16px; border: 1px solid #c9cfd7; 
                border-radius: 6px; font-size: 14px; box-sizing: border-box;
              ">
              
              <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <button id="login-btn" style="
                  flex: 1; background: #667eea; color: white; border: none; padding: 12px 16px;
                  border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
                ">Sign In</button>
                <button id="show-register-btn" style="
                  flex: 1; background: white; color: #4a5568; border: 1px solid #c9cfd7; 
                  padding: 12px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;
                ">Register</button>
              </div>
            </div>
            
            <!-- Register Form -->
            <div id="register-form" style="display: none;">
              <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 18px; font-weight: 600;">Create Account</h3>
              
              <input type="text" id="register-name" placeholder="Display Name" style="
                width: 100%; padding: 12px; margin-bottom: 12px; border: 1px solid #c9cfd7; 
                border-radius: 6px; font-size: 14px; box-sizing: border-box;
              ">
              <input type="email" id="register-email" placeholder="Email" style="
                width: 100%; padding: 12px; margin-bottom: 12px; border: 1px solid #c9cfd7; 
                border-radius: 6px; font-size: 14px; box-sizing: border-box;
              ">
              <input type="password" id="register-password" placeholder="Password" style="
                width: 100%; padding: 12px; margin-bottom: 16px; border: 1px solid #c9cfd7; 
                border-radius: 6px; font-size: 14px; box-sizing: border-box;
              ">
              
              <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <button id="register-btn" style="
                  flex: 1; background: #48bb78; color: white; border: none; padding: 12px 16px;
                  border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
                ">Create Account</button>
                <button id="show-login-btn" style="
                  flex: 1; background: white; color: #4a5568; border: 1px solid #c9cfd7; 
                  padding: 12px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;
                ">Back to Sign In</button>
              </div>
            </div>
          </div>
          
          <!-- Messages -->
          <div id="auth-error" style="
            background: #fed7d7; color: #c53030; padding: 12px; border-radius: 6px;
            margin-top: 16px; display: none; font-size: 14px;
          "></div>
          <div id="auth-success" style="
            background: #c6f6d5; color: #276749; padding: 12px; border-radius: 6px;
            margin-top: 16px; display: none; font-size: 14px;
          "></div>
        </div>
        
        <div style="
          background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;
          padding: 16px; font-size: 13px; color: #0369a1;
        ">
          <strong>💡 Note:</strong> Your account syncs across all your projects and provides access to conversation history, project management, and advanced features.
        </div>
      </div>
    `;
    
    this.setupAuthEventListeners();
  },

  setupAuthEventListeners() {
    // Toggle between login and register forms
    const showRegisterBtn = document.getElementById('show-register-btn');
    const showLoginBtn = document.getElementById('show-login-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (showRegisterBtn && showLoginBtn && loginForm && registerForm) {
      showRegisterBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
      });
      
      showLoginBtn.addEventListener('click', () => {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
      });
    }
    
    // Login form
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.handleLogin());
    }
    
    // Register form
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
      registerBtn.addEventListener('click', () => this.handleRegister());
    }
    
    // Enter key support
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const registerName = document.getElementById('register-name');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    
    [loginEmail, loginPassword].forEach(element => {
      if (element) {
        element.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.handleLogin();
        });
      }
    });
    
    [registerName, registerEmail, registerPassword].forEach(element => {
      if (element) {
        element.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.handleRegister();
        });
      }
    });
  },

  async handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
      this.showAuthError('Please enter both email and password');
      return;
    }
    
    this.showAuthLoading('Signing in...');
    
    try {
      const response = await this.safeSendMessage({
        action: 'masterAuth_login',
        email: email,
        password: password
      });
      
      if (response.success) {
        this.showAuthSuccess('Signed in successfully!');
        setTimeout(() => {
          // Start conversation capture after successful login for owned projects
          if (window.simpleConversationCapture && typeof window.simpleConversationCapture.startMonitoringAfterOwnershipConfirmed === 'function') {
            const projectId = this.projectId || this.extractProjectId();
            if (projectId) {
              window.simpleConversationCapture.startMonitoringAfterOwnershipConfirmed(projectId);
            }
          }
          // Show welcome page
          this.showWelcomePage();
        }, 1000);
      } else {
        this.showAuthError(response.error || 'Sign in failed');
      }
    } catch (error) {
      this.showAuthError('Network error. Please try again.');
    }
  },

  async handleRegister() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    
    if (!name || !email || !password) {
      this.showAuthError('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      this.showAuthError('Password must be at least 6 characters');
      return;
    }
    
    this.showAuthLoading('Creating account...');
    
    try {
      const response = await this.safeSendMessage({
        action: 'masterAuth_register',
        email: email,
        password: password,
        displayName: name
      });
      
      if (response.success) {
        this.showAuthSuccess('Account created successfully! Please sign in.');
        setTimeout(() => {
          // Switch to login form
          document.getElementById('register-form').style.display = 'none';
          document.getElementById('login-form').style.display = 'block';
          // Pre-fill email
          document.getElementById('login-email').value = email;
        }, 1500);
      } else {
        this.showAuthError(response.error || 'Registration failed');
      }
    } catch (error) {
      this.showAuthError('Network error. Please try again.');
    }
  },

  showAuthError(message) {
    const errorElement = document.getElementById('auth-error');
    const successElement = document.getElementById('auth-success');
    
    if (successElement) successElement.style.display = 'none';
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    }
  },

  showAuthSuccess(message) {
    const errorElement = document.getElementById('auth-error');
    const successElement = document.getElementById('auth-success');
    
    if (errorElement) errorElement.style.display = 'none';
    
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = 'block';
      setTimeout(() => {
        successElement.style.display = 'none';
      }, 3000);
    }
  },

  showAuthLoading(message) {
    const errorElement = document.getElementById('auth-error');
    const successElement = document.getElementById('auth-success');
    
    if (successElement) successElement.style.display = 'none';
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.background = '#bee3f8';
      errorElement.style.color = '#2a69ac';
      errorElement.style.display = 'block';
      
      // Reset styles after loading
      setTimeout(() => {
        errorElement.style.background = '#fed7d7';
        errorElement.style.color = '#c53030';
      }, 100);
    }
  },

  async showSettingsPage() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '⚙️ Settings';
    }
    
    if (!content) return;
    
    // Get current user information
    let userInfo = null;
    try {
      const authResponse = await this.safeSendMessage({ action: 'masterAuth_getCurrentUser' });
      if (authResponse.success && authResponse.isAuthenticated) {
        userInfo = authResponse.user;
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
    }
    
    content.innerHTML = `
      <div style="padding: 24px;">
        <div style="margin-bottom: 20px;">
          <button id="back-to-welcome-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;
            display: inline-flex; align-items: center; justify-content: center;
            min-height: 40px; min-width: 120px; transition: all 0.2s ease;
          " onmouseover="this.style.background='#e2e8f0'; this.style.borderColor='#9ca3af'" 
             onmouseout="this.style.background='#f7fafc'; this.style.borderColor='#c9cfd7'">← Back to Welcome</button>
        </div>
        
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            🔐 Account Settings
          </h3>
          
          ${userInfo ? `
            <div style="margin-bottom: 20px;">
              <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <label style="color: #4a5568; font-size: 14px; font-weight: 500; display: block; margin-bottom: 4px;">Email:</label>
                    <span style="color: #1a202c; font-size: 14px;">${userInfo.email}</span>
                  </div>
                  <a id="change-email-btn" style="
                    color: #667eea; font-size: 13px; text-decoration: none; cursor: pointer;
                    border-bottom: 1px solid transparent; transition: border-color 0.2s;
                  " onmouseover="this.style.borderColor='#667eea'" onmouseout="this.style.borderColor='transparent'">Change Email</a>
                </div>
              </div>
              
              <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="color: #4a5568; font-size: 14px; font-weight: 500;">Password:</label>
                  <a id="change-password-btn" style="
                    color: #667eea; font-size: 13px; text-decoration: none; cursor: pointer;
                    border-bottom: 1px solid transparent; transition: border-color 0.2s;
                  " onmouseover="this.style.borderColor='#667eea'" onmouseout="this.style.borderColor='transparent'">Change Password</a>
                </div>
              </div>
              
              <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <label style="color: #4a5568; font-size: 14px; font-weight: 500;">Subscription:</label>
                  <span style="
                    color: ${userInfo.subscriptionStatus === 'active' ? '#48bb78' : '#f56565'}; 
                    font-size: 14px; 
                    font-weight: 600;
                    text-transform: capitalize;
                  ">${userInfo.subscriptionStatus || 'Free'}</span>
                </div>
                ${userInfo.subscriptionExpiresAt ? `
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label style="color: #4a5568; font-size: 14px; font-weight: 500;">Expires:</label>
                    <span style="color: #1a202c; font-size: 14px;">
                      ${new Date(userInfo.subscriptionExpiresAt).toLocaleDateString()}
                    </span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : `
            <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px;">
              Loading account information...
            </p>
          `}
          
          <div style="display: flex; gap: 8px;">
            <button id="logout-btn" style="
              background: #f56565; color: white; border: none; padding: 8px 14px;
              border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
            ">Sign Out</button>
          </div>
        </div>
        
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            📱 Extension Info
          </h3>
          <div style="color: #4a5568; font-size: 14px; line-height: 1.5;">
            <p><strong>Version:</strong> 2.0.0</p>
            <p><strong>Master Database:</strong> Enabled</p>
            <p><strong>Authentication:</strong> Enabled</p>
            <p><strong>Contact:</strong> support@wowz.cloud</p>
          </div>
        </div>
      </div>
    `;
    
    this.setupSettingsEventListeners();
  },

  setupSettingsEventListeners() {
    // Back button
    if (typeof this.setupBackButton === 'function') {
      this.setupBackButton();
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
    
    // Change email button
    const changeEmailBtn = document.getElementById('change-email-btn');
    if (changeEmailBtn) {
      changeEmailBtn.addEventListener('click', () => this.showChangeEmailDialog());
    }
    
    // Change password button
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', () => this.showChangePasswordDialog());
    }
  },
  
  showChangeEmailDialog() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '📧 Change Email';
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="padding: 24px;">
        <div style="margin-bottom: 20px;">
          <button id="back-to-settings-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;
          ">← Back to Settings</button>
        </div>
        
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            Change Email Address
          </h3>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; color: #4a5568; font-size: 14px; margin-bottom: 8px;">New Email</label>
            <input type="email" id="new-email" placeholder="Enter new email address" style="
              width: 100%; padding: 10px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; color: #1a202c;
            ">
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; color: #4a5568; font-size: 14px; margin-bottom: 8px;">Current Password</label>
            <input type="password" id="confirm-password" placeholder="Enter your password" style="
              width: 100%; padding: 10px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; color: #1a202c;
            ">
          </div>
          
          <div id="email-change-error" style="
            display: none; background: #fed7d7; color: #c53030; padding: 12px;
            border-radius: 6px; font-size: 14px; margin-bottom: 16px;
          "></div>
          
          <div id="email-change-success" style="
            display: none; background: #c6f6d5; color: #22543d; padding: 12px;
            border-radius: 6px; font-size: 14px; margin-bottom: 16px;
          "></div>
          
          <button id="update-email-btn" style="
            background: #667eea; color: white; border: none; padding: 10px 20px;
            border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
          ">Update Email</button>
        </div>
      </div>
    `;
    
    document.getElementById('back-to-settings-btn')?.addEventListener('click', () => this.showSettingsPage());
    document.getElementById('update-email-btn')?.addEventListener('click', () => this.handleChangeEmail());
  },
  
  showChangePasswordDialog() {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '🔑 Change Password';
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="padding: 24px;">
        <div style="margin-bottom: 20px;">
          <button id="back-to-settings-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;
          ">← Back to Settings</button>
        </div>
        
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
            Change Password
          </h3>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; color: #4a5568; font-size: 14px; margin-bottom: 8px;">Current Password</label>
            <input type="password" id="current-password" placeholder="Enter current password" style="
              width: 100%; padding: 10px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; color: #1a202c;
            ">
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; color: #4a5568; font-size: 14px; margin-bottom: 8px;">New Password</label>
            <input type="password" id="new-password" placeholder="Enter new password (min 6 characters)" style="
              width: 100%; padding: 10px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; color: #1a202c;
            ">
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; color: #4a5568; font-size: 14px; margin-bottom: 8px;">Confirm New Password</label>
            <input type="password" id="confirm-new-password" placeholder="Confirm new password" style="
              width: 100%; padding: 10px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; color: #1a202c;
            ">
          </div>
          
          <div id="password-change-error" style="
            display: none; background: #fed7d7; color: #c53030; padding: 12px;
            border-radius: 6px; font-size: 14px; margin-bottom: 16px;
          "></div>
          
          <div id="password-change-success" style="
            display: none; background: #c6f6d5; color: #22543d; padding: 12px;
            border-radius: 6px; font-size: 14px; margin-bottom: 16px;
          "></div>
          
          <button id="update-password-btn" style="
            background: #667eea; color: white; border: none; padding: 10px 20px;
            border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
          ">Update Password</button>
        </div>
      </div>
    `;
    
    document.getElementById('back-to-settings-btn')?.addEventListener('click', () => this.showSettingsPage());
    document.getElementById('update-password-btn')?.addEventListener('click', () => this.handleChangePassword());
  },
  
  async handleChangeEmail() {
    const newEmail = document.getElementById('new-email')?.value.trim();
    const password = document.getElementById('confirm-password')?.value;
    
    if (!newEmail || !password) {
      this.showChangeError('email-change-error', 'Please fill in all fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      this.showChangeError('email-change-error', 'Please enter a valid email address');
      return;
    }
    
    // TODO: Implement email change API call
    this.showChangeError('email-change-error', 'Email change feature coming soon');
  },
  
  async handleChangePassword() {
    const currentPassword = document.getElementById('current-password')?.value;
    const newPassword = document.getElementById('new-password')?.value;
    const confirmPassword = document.getElementById('confirm-new-password')?.value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showChangeError('password-change-error', 'Please fill in all fields');
      return;
    }
    
    if (newPassword.length < 6) {
      this.showChangeError('password-change-error', 'New password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.showChangeError('password-change-error', 'New passwords do not match');
      return;
    }
    
    // TODO: Implement password change API call
    this.showChangeError('password-change-error', 'Password change feature coming soon');
  },
  
  showChangeError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    }
  },

  async handleLogout() {
    try {
      const response = await this.safeSendMessage({
        action: 'masterAuth_logout'
      });
      
      if (response.success) {
        // Show auth section after logout
        this.showAuthSection();
        
        // Stop conversation capture
        if (window.conversationCapture && typeof window.conversationCapture.debugInfo === 'function') {
          window.conversationCapture.debugInfo(); // This will show the user is no longer authenticated
        }
      } else {
        console.error('Logout failed:', response.error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  async showWelcomePage() {
    // Check authentication status first
    try {
      const authResponse = await this.safeSendMessage({ action: 'checkAuth' });
      if (!authResponse?.success || !authResponse.data?.isAuthenticated) {
        console.log('🔒 User not authenticated - showing login/register page');
        this.showAuthSection();
        return;
      }
    } catch (error) {
      console.log('⚠️ Could not verify authentication - showing login/register page');
      this.showAuthSection();
      return;
    }
    
    // Get project name from database first, then fallback to other methods
    let projectName = 'Current Project';
    
    // Try to get project name from database first
    try {
      if (typeof this.getCurrentProject === 'function') {
        const currentProject = await this.getCurrentProject();
        console.log('📋 Project data from database:', currentProject);
        
        if (currentProject && currentProject.name && currentProject.name !== currentProject.id) {
          // Use database project name only if it's not just the project ID
          projectName = currentProject.name;
          console.log('✅ Using project name from database:', projectName);
        } else {
          throw new Error('No valid project name available in database (got: ' + (currentProject?.name || 'null') + ')');
        }
      } else {
        throw new Error('getCurrentProject function not available');
      }
    } catch (error) {
      console.log('ℹ️ Could not get project name from database, trying page title extraction:', error.message);
      
      // Fallback 1: Extract from page title
      if (typeof this.extractProjectName === 'function') {
        projectName = this.extractProjectName();
      } else {
        // Fallback 2: Extract project ID from URL as last resort
        const url = window.location.href;
        const match = url.match(/\/projects\/([^\/\?]+)/);
        projectName = match ? match[1] : 'Current Project';
      }
    }
    
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '🤖 Lovable Assistant';
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <div style="margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px 0; color: #1a202c; font-size: 24px; font-weight: 600;">
            Welcome! 👋
          </h2>
          <p style="margin: 0; color: #4a5568; font-size: 16px;">
            Development assistant for project <strong style="color: #667eea;" data-project-name>${projectName}</strong>
          </p>
        </div>
        
        <div style="display: grid; gap: 12px; margin-bottom: 24px;">
          <!-- PROJECT SETTING -->
          <div class="feature-card" data-feature="knowledge" style="
            background: white; border: 2px solid #c9cfd7; border-radius: 12px;
            padding: 20px; cursor: pointer; transition: all 0.2s ease;
            text-align: left; position: relative; overflow: hidden;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
                color: white; width: 40px; height: 40px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; font-weight: bold;
              ">🧠</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 4px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
                  Project Manager
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Manage your own projects, settings, and knowledge base
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
          </div>
          
          <!-- REMOVED PROJECT AI ASSISTANT - AI functionality removed -->
          
          <!-- Lovable Chat History -->
          <div class="feature-card" data-feature="history" style="
            background: white; border: 2px solid #c9cfd7; border-radius: 12px;
            padding: 20px; cursor: pointer; transition: all 0.2s ease;
            text-align: left; position: relative; overflow: hidden;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white; width: 40px; height: 40px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; font-weight: bold;
              ">📚</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 4px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
                  Lovable Chat History
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Browse and search your past conversations and development activities
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
          </div>
          
          <!-- Utilities -->
          <div class="feature-card" data-feature="utilities" style="
            background: white; border: 2px solid #c9cfd7; border-radius: 12px;
            padding: 20px; cursor: pointer; transition: all 0.2s ease;
            text-align: left; position: relative; overflow: hidden;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white; width: 40px; height: 40px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; font-weight: bold;
              ">🛠️</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 4px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
                  Utilities
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Advanced tools for message scraping, notifications, and prompt enhancement
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
          </div>
          
          <!-- Settings -->
          <div class="feature-card" data-feature="settings" style="
            background: white; border: 2px solid #c9cfd7; border-radius: 12px;
            padding: 20px; cursor: pointer; transition: all 0.2s ease;
            text-align: left; position: relative; overflow: hidden;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                background: linear-gradient(135deg, #805ad5 0%, #6b46c1 100%);
                color: white; width: 40px; height: 40px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; font-weight: bold;
              ">⚙️</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 4px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
                  Settings
                </h3>
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Configure API settings, usage limits, fonts, and styles
                </p>
              </div>
              <div style="color: #cbd5e0; font-size: 18px;">→</div>
            </div>
          </div>
        </div>
        
        <div style="
          background: #f7fafc; border: 1px solid #c9cfd7; border-radius: 8px;
          padding: 12px; font-size: 13px; color: #4a5568; text-align: center;
        ">
          💡 <strong>Tip:</strong> Press <kbd style="
            background: white; border: 1px solid #cbd5e0; border-radius: 3px;
            padding: 2px 4px; font-size: 11px; font-family: monospace;
          ">Cmd+K</kbd> anywhere on this page to toggle this assistant
        </div>
      </div>
    `;
    
    this.setupWelcomePageEvents();
  },

  setupChatFunctionality() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (!chatInput || !sendBtn) return;

    // Load conversation history when chat opens
    this.loadConversationHistory();

    // Note: Close button is handled centrally in setupCloseButton()

    const sendMessage = async () => {
      const message = chatInput.value.trim();
      if (!message) return;

      this.addMessage(message, 'user');
      chatInput.value = '';
      this.showTypingIndicator();

      try {
        // Get conversation history for context
        const conversationHistory = await this.getRecentConversations();
        
        const response = await chrome.runtime.sendMessage({
          action: 'chatMessage',
          message: message,
          context: { 
            projectId: this.projectId, 
            url: window.location.href,
            projectName: this.extractProjectName(),
            conversationHistory: conversationHistory
          }
        });

        this.hideTypingIndicator();

        if (response.success) {
          this.addMessage(response.data, 'assistant');
          
          // Save the conversation to database
          this.saveConversation(message, response.data);
        } else {
          this.addMessage('Sorry, I encountered an error: ' + response.error, 'error');
        }
      } catch (error) {
        this.hideTypingIndicator();
        this.addMessage('Connection error. Please check your API configuration.', 'error');
      }
    };

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.toggleAssistant(); // Close dialog on Escape
      }
    });
    chatInput.focus();
  },

  async loadConversationHistory() {
    try {
      const response = await this.safeSendMessage({
        action: 'getAssistantConversations',
        projectId: this.projectId,
        limit: 10
      });
      
      if (response.success && response.data && response.data.length > 0) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        // Clear the initial greeting
        messagesContainer.innerHTML = '';
        
        // Add conversation history
        response.data.reverse().forEach(conv => {
          this.addMessage(conv.user_message, 'user', false);
          this.addMessage(conv.assistant_response, 'assistant', false);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  },

  async getRecentConversations() {
    try {
      const response = await this.safeSendMessage({
        action: 'getAssistantConversations',
        projectId: this.projectId,
        limit: 5
      });
      
      if (response.success && response.data) {
        return response.data.map(conv => ({
          user: conv.user_message,
          assistant: conv.assistant_response
        }));
      }
    } catch (error) {
      console.error('Failed to get recent conversations:', error);
    }
    return [];
  },

  async saveConversation(userMessage, assistantResponse) {
    try {
      const response = await this.safeSendMessage({
        action: 'saveAssistantConversation',
        data: {
          project_id: this.projectId,
          user_message: userMessage,
          assistant_response: assistantResponse,
          metadata: {
            project_name: this.extractProjectName(),
            url: window.location.href,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      if (!response.success) {
        console.error('Failed to save conversation:', response.error);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  },

  addMessage(content, type, addTimestamp = true) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.display = 'flex';
    messageDiv.style.marginBottom = '12px';
    messageDiv.style.justifyContent = type === 'user' ? 'flex-end' : 'flex-start';
    
    let bgColor = type === 'user' ? '#667eea' : type === 'error' ? '#fed7d7' : 'white';
    let textColor = type === 'user' ? 'white' : type === 'error' ? '#742a2a' : '#2d3748';
    let lineHeight = type === 'user' ? '1.5' : '1.4'; // User messages need more spacing due to blue background

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      background: ${bgColor}; color: ${textColor}; padding: 12px 16px; border-radius: 18px;
      max-width: 85%; border: ${type === 'assistant' ? '1px solid #c9cfd7' : 'none'};
      line-height: ${lineHeight}; word-wrap: break-word; font-size: 14px;
      white-space: pre-wrap; text-align: left; font-family: inherit;
    `;
    
    // Ensure markdown elements inherit proper styling
    if (type === 'user') {
      messageBubble.setAttribute('style', messageBubble.getAttribute('style') + `
        --user-message: true;
      `);
    }

    // For chat messages, detect if content is HTML and format accordingly
    const isHTMLContent = this.isHTMLContent(content);
    const formattedContent = this.formatMessage(content, isHTMLContent, type);
    
    messageBubble.innerHTML = formattedContent;
    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  // --- UI Helper Methods ---
  // Message formatting, styling, and UI manipulation functions

  formatMessage(content, isHTML = false) {
    // Check if content is HTML formatted (from newer captures)
    if (isHTML || this.isHTMLContent(content)) {
      // For HTML content, return as-is but sanitize dangerous elements
      return this.sanitizeHTML(content);
    } else {
      // For plain text content, use the advanced MarkdownFormatter
      return MarkdownFormatter.format(content);
    }
  },

  isHTMLContent(content) {
    // Detect if content contains HTML tags (simple heuristic)
    return /<\/?(p|br|h[1-6]|ol|ul|li|blockquote|pre|code|strong|em|span|div)[^>]*>/i.test(content);
  },

  sanitizeHTML(htmlContent) {
    // Create a temporary element to sanitize HTML
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    
    // Remove potentially dangerous elements and attributes
    const dangerousElements = temp.querySelectorAll('script, iframe, object, embed, form, input, button');
    dangerousElements.forEach(el => el.remove());
    
    // Remove dangerous attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
      const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'];
      dangerousAttrs.forEach(attr => el.removeAttribute(attr));
    });
    
    // Enhance list styling for proper display
    this.enhanceListStyling(temp);
    
    return temp.innerHTML;
  },

  enhanceListStyling(container) {
    // Add proper styling to unordered lists (bullet points)
    const ulLists = container.querySelectorAll('ul');
    ulLists.forEach(ul => {
      ul.style.listStyleType = 'disc';
      ul.style.paddingLeft = '20px';
      ul.style.marginLeft = '0';
      
      // Ensure list items display properly
      const listItems = ul.querySelectorAll('li');
      listItems.forEach(li => {
        li.style.display = 'list-item';
        li.style.marginBottom = '4px';
      });
    });
    
    // Add proper styling to ordered lists (numbers)
    const olLists = container.querySelectorAll('ol');
    olLists.forEach(ol => {
      ol.style.listStyleType = 'decimal';
      ol.style.paddingLeft = '20px';
      ol.style.marginLeft = '0';
      
      // Ensure list items display properly with numbers
      const listItems = ol.querySelectorAll('li');
      listItems.forEach(li => {
        li.style.display = 'list-item';
        li.style.marginBottom = '4px';
      });
    });
    
    // Handle nested lists
    const nestedLists = container.querySelectorAll('ul ul, ol ol, ul ol, ol ul');
    nestedLists.forEach(nestedList => {
      nestedList.style.marginTop = '4px';
      nestedList.style.marginBottom = '4px';
    });
  },

  escapeRegex(string) {
    // Escape special regex characters to treat them as literal characters
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  setVerboseLogging(enabled) {
    this.verboseLogging = enabled;
    console.log(`🔧 LovableDetector verbose logging ${enabled ? 'enabled' : 'disabled'}`);
  },

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.style.cssText = 'display: flex; justify-content: flex-start; margin-bottom: 12px;';
    typingDiv.innerHTML = `
      <div style="background: white; border: 1px solid #c9cfd7; padding: 12px 16px; border-radius: 18px; max-width: 85%;">
        <div style="display: flex; gap: 4px; align-items: center;">
          <div style="width: 8px; height: 8px; background: #cbd5e0; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
          <div style="width: 8px; height: 8px; background: #cbd5e0; border-radius: 50%; animation: pulse 1.5s infinite 0.2s;"></div>
          <div style="width: 8px; height: 8px; background: #cbd5e0; border-radius: 50%; animation: pulse 1.5s infinite 0.4s;"></div>
          <span style="margin-left: 8px; color: #718096; font-size: 13px;">AI is thinking...</span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) typingIndicator.remove();
  },

  makeDraggable() {
    const dialogEl = document.getElementById('assistant-window');
    const dragHandle = document.getElementById('drag-handle');
    
    if (!dialogEl || !dragHandle) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    dragHandle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      if (e.target.id === 'close-btn') return;
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      let newTop = dialogEl.offsetTop - pos2;
      let newLeft = dialogEl.offsetLeft - pos1;
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - dialogEl.offsetHeight));
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - dialogEl.offsetWidth));
      dialogEl.style.top = newTop + "px";
      dialogEl.style.left = newLeft + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  },

  // Cleanup method
  destroy() {
    // Reset flags
    this.isClosing = false;
    this.lastToggleTime = 0;
    
    // Remove keyboard listeners
    if (this.handleKeydown) {
      document.removeEventListener('keydown', this.handleKeydown, true);
      window.removeEventListener('keydown', this.handleKeydown, true);
      this.handleKeydown = null;
    }
    
    // Close dialog and clean up
    if (this.assistantDialog) {
      this.removeDialogEventListeners();
      this.assistantDialog.remove();
      this.assistantDialog = null;
    }
    
    // The notification monitoring system has been removed
  },

  setupWelcomePageEvents() {
    // Add hover effects and click handlers for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
      const feature = card.getAttribute('data-feature');
      
      // Hover effects
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = '#667eea';
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = '#c9cfd7';
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      });
      
      // Click handlers
      card.addEventListener('click', async () => {
        await this.handleFeatureSelection(feature);
      });
    });
    
    // Note: Close button is handled centrally in setupCloseButton()
  },

  async handleFeatureSelection(feature) {
    switch (feature) {
      case 'chat':
        // Removed AI chat interface - AI functionality removed
        console.log('AI chat functionality has been removed');
        break;
      case 'history':
        if (typeof this.showConversationHistory === 'function') {
          await this.showConversationHistory();
        } else {
          console.error('showConversationHistory method not available');
        }
        break;
      case 'utilities':
        if (typeof this.showUtilitiesPage === 'function') {
          await this.showUtilitiesPage();
        } else {
          console.error('showUtilitiesPage method not available');
        }
        break;
      case 'knowledge':
        if (typeof this.showProjectManager === 'function') {
          await this.showProjectManager();
        } else {
          console.error('showProjectManager method not available');
        }
        break;
      case 'settings':
        if (typeof this.showSettingsPage === 'function') {
          this.showSettingsPage();
        } else {
          console.error('showSettingsPage method not available');
        }
        break;
      default:
        console.log('Unknown feature:', feature);
    }
  },

  showComingSoon(featureName) {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = `🚧 ${featureName}`;
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 16px;">🚧</div>
        <h2 style="margin: 0 0 8px 0; color: #1a202c; font-size: 24px; font-weight: 600;">
          ${featureName}
        </h2>
        <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.5;">
          This feature is coming soon! We're working hard to bring you the best experience.
        </p>
        <button id="back-to-welcome-btn" style="
          background: #667eea; color: white; border: none; padding: 12px 24px;
          border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 44px; min-width: 140px; transition: all 0.2s ease;
        " onmouseover="this.style.background='#5a67d8'" 
           onmouseout="this.style.background='#667eea'">← Back to Welcome</button>
      </div>
    `;
    
    if (typeof this.setupBackButton === 'function') {
      this.setupBackButton();
    }
  }
};