// Popup Script for Lovable Assistant Chrome Extension
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎯 Popup loaded - initializing...');
  
  // Initialize the popup based on authentication state
  await initializePopup();
  
  // Setup all event listeners
  setupEventListeners();
});

async function initializePopup() {
  try {
    // Check if user is authenticated with master database
    const authResult = await sendToBackground('masterAuth_getCurrentUser');
    
    if (authResult.success && authResult.isAuthenticated) {
      // User is logged in
      console.log('✅ User authenticated:', authResult.user.email);
      showUserDashboard(authResult.user);
      
      // Check if user has configured their personal database
      if (authResult.user.databaseConfigured) {
        updateDatabaseStatus('✅ Personal database: Connected', true);
      } else {
        updateDatabaseStatus('⚠️ Personal database: Not configured', false);
      }
    } else {
      // User not logged in
      console.log('🔐 User not authenticated - showing auth form');
      showAuthSection();
    }
    
    // Always check overall connection status
    await checkConnectionStatus();
    
  } catch (error) {
    console.error('❌ Error initializing popup:', error);
    showError('Failed to initialize. Please try again.');
  }
}

function setupEventListeners() {
  // Authentication form listeners
  document.getElementById('show-register').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    clearMessages();
  });
  
  document.getElementById('show-login').addEventListener('click', () => {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    clearMessages();
  });
  
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('register-btn').addEventListener('click', handleRegister);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Database setup listeners
  document.getElementById('setup-personal-db').addEventListener('click', () => {
    showDatabaseSetup();
  });
  
  document.getElementById('setup-database').addEventListener('click', handleDatabaseSetup);
  document.getElementById('show-setup-guide').addEventListener('click', toggleSetupGuide);
  
  // User management listeners
  document.getElementById('change-database').addEventListener('click', () => {
    showDatabaseSetup();
  });
  
  document.getElementById('reset-extension').addEventListener('click', handleResetExtension);
  
  // General listeners
  document.getElementById('open-settings').addEventListener('click', handleOpenSettings);
  document.getElementById('check-connection').addEventListener('click', checkConnectionStatus);
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  
  if (!email || !password) {
    showError('Please enter both email and password');
    return;
  }
  
  try {
    clearMessages(); // Clear any existing messages
    showLoading('Signing in...');
    const result = await sendToBackground('masterAuth_login', { email, password });
    
    if (result.success) {
      clearMessages(); // Clear loading message
      showSuccess('Successfully signed in!');
      setTimeout(() => {
        showUserDashboard(result.user);
      }, 1000);
    } else {
      showError(result.error || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    showError('Login failed. Please try again.');
  }
}

async function handleRegister() {
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();
  
  if (!email || !password) {
    showError('Please enter both email and password');
    return;
  }
  
  if (password.length < 6) {
    showError('Password must be at least 6 characters long');
    return;
  }
  
  try {
    clearMessages(); // Clear any existing messages
    showLoading('Creating account...');
    const result = await sendToBackground('masterAuth_register', { 
      email, 
      password, 
      displayName: name || email 
    });
    
    if (result.success) {
      clearMessages(); // Clear loading message
      showSuccess(result.message || 'Account created successfully!');
      // Switch to login form
      setTimeout(() => {
        clearMessages();
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('login-email').value = email;
      }, 2000);
    } else {
      showError(result.error || 'Registration failed');
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    showError('Registration failed. Please try again.');
  }
}

async function handleLogout() {
  try {
    showLoading('Signing out...');
    const result = await sendToBackground('masterAuth_logout');
    
    if (result.success) {
      showSuccess('Successfully signed out!');
      setTimeout(() => {
        showAuthSection();
      }, 1000);
    } else {
      showError(result.error || 'Logout failed');
    }
  } catch (error) {
    console.error('❌ Logout error:', error);
    showError('Logout failed. Please try again.');
  }
}

async function handleDatabaseSetup() {
  const projectIdOrUrl = document.getElementById('supabase-url').value.trim();
  const apiKey = document.getElementById('supabase-key').value.trim();
  
  if (!projectIdOrUrl || !apiKey) {
    showError('Please enter both Supabase URL and API key', 'database-error');
    return;
  }
  
  try {
    showLoading('Connecting and setting up database...', 'database-error');
    
    // Test the connection and automatically set up schema
    const testResult = await sendToBackground('testDatabaseConnection', { 
      projectId: projectIdOrUrl, 
      apiKey 
    });
    
    if (!testResult.success) {
      if (testResult.needsManualRLS) {
        showRLSFixInstructions(testResult.error, 'database-error');
      } else if (testResult.needsManualSetup && testResult.sqlContent) {
        showSetupInstructions(testResult.sqlContent, 'database-error');
      } else {
        showError(testResult.error || 'Database connection failed', 'database-error');
      }
      return;
    }
    
    showLoading('Database connected! Configuring extension...', 'database-error');
    
    // Update user's database configuration in master database
    const updateResult = await sendToBackground('masterAuth_updateUserDatabase', { 
      databaseUrl: projectIdOrUrl, 
      databaseKey: apiKey 
    });
    
    if (updateResult.success) {
      // Store locally as well for direct access
      // Normalize URL for storage
      let normalizedUrl = projectIdOrUrl;
      if (!normalizedUrl.startsWith('https://')) {
        if (!normalizedUrl.includes('.supabase.co')) {
          normalizedUrl = `https://${normalizedUrl}.supabase.co`;
        } else {
          normalizedUrl = `https://${normalizedUrl}`;
        }
      }
      
      await chrome.storage.sync.set({
        userSupabaseUrl: normalizedUrl,
        userSupabaseKey: apiKey
      });
      
      showSuccess('✅ Database connected and configured successfully! Your personal database is ready to use.', 'database-error');
      setTimeout(() => {
        initializePopup(); // Refresh the popup
      }, 2000);
    } else {
      showError(updateResult.error || 'Failed to save database configuration', 'database-error');
    }
  } catch (error) {
    console.error('❌ Database setup error:', error);
    showError('Database setup failed. Please try again.', 'database-error');
  }
}

function showAuthSection() {
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('user-dashboard').style.display = 'none';
  document.getElementById('database-setup').style.display = 'none';
  document.getElementById('user-status').style.display = 'none';
  clearMessages();
}

function showUserDashboard(user) {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('user-dashboard').style.display = 'block';
  document.getElementById('database-setup').style.display = 'none';
  document.getElementById('user-status').style.display = 'none';
  
  // Update user info
  document.getElementById('user-email').textContent = user.email;
  document.getElementById('user-role').textContent = user.role;
  document.getElementById('user-plan').textContent = user.subscriptionStatus;
  
  clearMessages();
}

function showDatabaseSetup() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('user-dashboard').style.display = 'none';
  document.getElementById('database-setup').style.display = 'block';
  document.getElementById('user-status').style.display = 'none';
  clearMessages();
}

function updateDatabaseStatus(message, isConnected) {
  const statusElement = document.getElementById('db-status-text');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.color = isConnected ? '#22543d' : '#c53030';
  }
}

async function checkConnectionStatus() {
  try {
    updateStatus('Checking connection...', false);
    
    // Check if user is authenticated
    const authResult = await sendToBackground('masterAuth_getCurrentUser');
    
    if (authResult.success && authResult.isAuthenticated) {
      // Check personal database if configured
      if (authResult.user.databaseConfigured) {
        const dbResult = await sendToBackground('testUserDatabaseConnection');
        if (dbResult.success) {
          updateStatus('✅ All systems connected', false);
        } else {
          updateStatus('⚠️ Personal database connection failed', true);
        }
      } else {
        updateStatus('✅ Signed in - Setup personal database', false);
      }
    } else {
      updateStatus('🔐 Please sign in to continue', true);
    }
  } catch (error) {
    console.error('❌ Connection check failed:', error);
    updateStatus('❌ Connection check failed', true);
  }
}

async function handleOpenSettings() {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (activeTab.url && activeTab.url.includes('lovable.dev/projects/')) {
      chrome.tabs.sendMessage(activeTab.id, { 
        action: 'openAssistantSettings' 
      });
      window.close();
    } else {
      updateStatus('Please navigate to a Lovable.dev project page first', true);
    }
  } catch (error) {
    console.error('❌ Error opening settings:', error);
    updateStatus('Failed to open settings', true);
  }
}

async function handleResetExtension() {
  if (confirm('This will reset all extension data. Are you sure?')) {
    try {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
      showSuccess('Extension reset successfully!');
      setTimeout(() => {
        initializePopup();
      }, 1000);
    } catch (error) {
      console.error('❌ Reset failed:', error);
      showError('Reset failed. Please try again.');
    }
  }
}

function toggleSetupGuide() {
  const guide = document.getElementById('setup-guide');
  guide.style.display = guide.style.display === 'none' ? 'block' : 'none';
}

function showRLSFixInstructions(message, elementId = 'database-error') {
  const element = document.getElementById(elementId);
  if (element) {
    // Extract the SQL from the message
    const sqlStart = message.indexOf('ALTER TABLE');
    const sqlEnd = message.indexOf('again.');
    const sqlText = sqlStart !== -1 && sqlEnd !== -1 ? message.substring(sqlStart, sqlEnd - 1) : '';
    
    element.innerHTML = `
      <div style="margin-bottom: 12px;">
        <strong style="color: #1a202c;">⚠️ One More Step Required</strong><br>
        <span style="font-size: 12px;">Tables created successfully! Please disable Row Level Security to complete setup:</span>
      </div>
      ${sqlText ? `
      <textarea readonly style="
        width: 100%; 
        height: 80px; 
        font-family: monospace; 
        font-size: 10px; 
        padding: 8px; 
        border: 1px solid #c9cfd7; 
        border-radius: 4px; 
        resize: vertical;
        background: #f7fafc;
        margin-bottom: 8px;
      ">${sqlText}</textarea>
      <div style="display: flex; gap: 8px; margin-bottom: 8px;">
        <button onclick="copyRLSSQL()" style="
          flex: 1; 
          padding: 6px 12px; 
          background: #667eea; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          font-size: 12px; 
          cursor: pointer;
        ">📋 Copy SQL</button>
        <a href="https://supabase.com/dashboard/project/${getProjectIdFromInput()}/sql" target="_blank" style="
          flex: 1; 
          padding: 6px 12px; 
          background: #48bb78; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          font-size: 12px; 
          text-decoration: none; 
          text-align: center;
        ">🔗 SQL Editor</a>
      </div>
      ` : ''}
      <div style="font-size: 11px; color: #4a5568; background: #f0f9ff; padding: 8px; border-radius: 4px;">
        💡 After running the SQL, click "Connect Database" again to complete setup
      </div>
    `;
    element.style.background = '#fef7e0';
    element.style.color = '#b45309';
    element.style.display = 'block';
    element.style.border = '1px solid #f6cc6d';
  }
}

function getProjectIdFromInput() {
  const urlInput = document.getElementById('supabase-url');
  if (urlInput && urlInput.value) {
    const url = urlInput.value.trim();
    if (url.includes('.supabase.co')) {
      return url.split('.')[0].replace('https://', '');
    }
    return url;
  }
  return 'YOUR_PROJECT_ID';
}

function copyRLSSQL() {
  const textarea = document.querySelector('#database-error textarea');
  if (textarea) {
    textarea.select();
    document.execCommand('copy');
    
    // Show feedback
    const button = document.querySelector('#database-error button');
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✅ Copied!';
      button.style.background = '#48bb78';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#667eea';
      }, 2000);
    }
  }
}

function showSetupInstructions(sqlContent, elementId = 'database-error') {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div style="margin-bottom: 12px;">
        <strong style="color: #1a202c;">🚀 Quick Setup Required</strong><br>
        <span style="font-size: 12px;">Automatic table creation failed. Please copy the SQL below, run it in your Supabase SQL Editor, then click "Connect Database"</span>
      </div>
      <textarea readonly style="
        width: 100%; 
        height: 120px; 
        font-family: monospace; 
        font-size: 10px; 
        padding: 8px; 
        border: 1px solid #c9cfd7; 
        border-radius: 4px; 
        resize: vertical;
        background: #f7fafc;
        margin-bottom: 8px;
      ">${sqlContent}</textarea>
      <div style="display: flex; gap: 8px;">
        <button onclick="copySetupSQL()" style="
          flex: 1; 
          padding: 6px 12px; 
          background: #667eea; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          font-size: 12px; 
          cursor: pointer;
        ">📋 Copy SQL</button>
        <a href="https://supabase.com/dashboard/project/${getProjectIdFromInput()}/sql" target="_blank" style="
          flex: 1; 
          padding: 6px 12px; 
          background: #48bb78; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          font-size: 12px; 
          text-decoration: none; 
          text-align: center;
        ">🔗 Open SQL Editor</a>
      </div>
    `;
    element.style.background = '#f0f9ff';
    element.style.color = '#0369a1';
    element.style.display = 'block';
    element.style.border = '1px solid #bae6fd';
  }
}

function copySetupSQL() {
  const textarea = document.querySelector('#database-error textarea');
  if (textarea) {
    textarea.select();
    document.execCommand('copy');
    
    // Show feedback
    const button = document.querySelector('#database-error button');
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✅ Copied!';
      button.style.background = '#48bb78';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#667eea';
      }, 2000);
    }
  }
}


// Utility functions
function showError(message, elementId = 'auth-error') {
  hideLoading();
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  setTimeout(() => {
    if (errorElement) errorElement.style.display = 'none';
  }, 5000);
}

function showSuccess(message, elementId = 'auth-success') {
  hideLoading();
  const successElement = document.getElementById(elementId);
  if (successElement) {
    successElement.textContent = message;
    successElement.style.display = 'block';
  }
  setTimeout(() => {
    if (successElement) successElement.style.display = 'none';
  }, 3000);
}

function showLoading(message, elementId = 'auth-error') {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.background = '#bee3f8';
    element.style.color = '#2a69ac';
    element.style.display = 'block';
  }
}

function hideLoading() {
  const authError = document.getElementById('auth-error');
  const databaseError = document.getElementById('database-error');
  
  if (authError) {
    authError.style.background = '#fed7d7';
    authError.style.color = '#c53030';
  }
  if (databaseError) {
    databaseError.style.background = '#fed7d7';
    databaseError.style.color = '#c53030';
  }
}

function clearMessages() {
  document.getElementById('auth-error').style.display = 'none';
  document.getElementById('auth-success').style.display = 'none';
  const databaseError = document.getElementById('database-error');
  if (databaseError) databaseError.style.display = 'none';
}

function updateStatus(message, isError) {
  const statusText = document.getElementById('status-text');
  const statusDot = document.getElementById('status-dot');
  
  if (statusText) statusText.textContent = message;
  if (statusDot) {
    statusDot.style.backgroundColor = isError ? '#f56565' : '#48bb78';
  }
}

// Helper function to send messages to background script
function sendToBackground(action, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}