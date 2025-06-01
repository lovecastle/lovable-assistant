// Popup Script for Lovable Assistant Chrome Extension
document.addEventListener('DOMContentLoaded', async () => {
  // Check connection status on load
  checkConnectionStatus();
  
  // Open settings button
  document.getElementById('open-settings').addEventListener('click', async () => {
    // Get the active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on a Lovable.dev project page
    if (activeTab.url && activeTab.url.includes('lovable.dev/projects/')) {
      // Send message to content script to open settings
      chrome.tabs.sendMessage(activeTab.id, { 
        action: 'openAssistantSettings' 
      });
      window.close();
    } else {
      // Show message that user needs to be on Lovable.dev
      updateStatus('Please navigate to a Lovable.dev project page first', true);
    }
  });
  
  // Check connection button
  document.getElementById('check-connection').addEventListener('click', async () => {
    updateStatus('Checking connection...', false);
    await checkConnectionStatus();
  });
});

async function checkConnectionStatus() {
  try {
    // Check if API keys are configured
    const config = await chrome.storage.sync.get([
      'aiProvider', 'claudeApiKey', 'openaiApiKey', 'geminiApiKey', 
      'supabaseProjectId', 'supabaseKey'
    ]);
    
    const provider = config.aiProvider || 'claude';
    let hasApiKey = false;
    
    switch (provider) {
      case 'claude':
        hasApiKey = !!config.claudeApiKey;
        break;
      case 'openai':
        hasApiKey = !!config.openaiApiKey;
        break;
      case 'gemini':
        hasApiKey = !!config.geminiApiKey;
        break;
    }
    
    if (!hasApiKey || !config.supabaseProjectId || !config.supabaseKey) {
      updateStatus('API keys not configured', true);
      return;
    }
    
    // Test the connection
    const response = await chrome.runtime.sendMessage({ action: 'testConnection' });
    
    if (response && response.success) {
      const providerName = provider === 'claude' ? 'Claude' : provider === 'openai' ? 'OpenAI' : 'Gemini';
      updateStatus(`Connected with ${providerName}`, false);
    } else {
      updateStatus('Connection failed', true);
    }
  } catch (error) {
    updateStatus('Error checking connection', true);
  }
}

function updateStatus(text, isError) {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  
  statusDot.className = 'status-dot' + (isError ? ' error' : '');
  statusText.textContent = text;
}