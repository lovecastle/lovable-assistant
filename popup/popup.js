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
  
  // General listeners
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


function showAuthSection() {
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('user-dashboard').style.display = 'none';
  clearMessages();
}

function showUserDashboard(user) {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('user-dashboard').style.display = 'block';
  
  // Update user info
  document.getElementById('user-email').textContent = user.email;
  document.getElementById('user-role').textContent = user.role;
  document.getElementById('user-plan').textContent = user.subscriptionStatus;
  
  clearMessages();
}


async function checkConnectionStatus() {
  try {
    updateStatus('Checking connection...', false);
    
    // Check if user is authenticated
    const authResult = await sendToBackground('masterAuth_getCurrentUser');
    
    if (authResult.success && authResult.isAuthenticated) {
      updateStatus('✅ Connected and authenticated', false);
    } else {
      updateStatus('🔐 Please sign in to continue', true);
    }
  } catch (error) {
    console.error('❌ Connection check failed:', error);
    updateStatus('❌ Connection check failed', true);
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
  
  if (authError) {
    authError.style.background = '#fed7d7';
    authError.style.color = '#c53030';
  }
}

function clearMessages() {
  document.getElementById('auth-error').style.display = 'none';
  document.getElementById('auth-success').style.display = 'none';
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