// Service Worker for Chrome Extension Background Tasks
console.log('Service worker starting...');

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);
  chrome.storage.sync.set({
    autoCapture: true,
    enhancePrompts: true,
    showSuggestions: true
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'testConnection':
      testConnection().then(result => {
        sendResponse({ success: result });
      });
      break;
      
    case 'chatMessage':
      handleChatMessage(request.message, request.context).then(result => {
        sendResponse(result);
      });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true;
});

async function testConnection() {
  try {
    const settings = await chrome.storage.sync.get(['claudeApiKey', 'supabaseUrl']);
    return !!(settings.claudeApiKey && settings.supabaseUrl);
  } catch (error) {
    return false;
  }
}

async function handleChatMessage(message, context) {
  try {
    const settings = await chrome.storage.sync.get(['claudeApiKey']);
    
    if (!settings.claudeApiKey) {
      return { success: false, error: 'Claude API key not configured' };
    }

    const systemPrompt = `You are a helpful development assistant for Lovable.dev projects. 
    Help with coding, debugging, and best practices. Be concise but helpful.
    
    Project: ${context?.projectId || 'Unknown'}`;

    const response = await callClaudeAPI(settings.claudeApiKey, message, systemPrompt);
    return { success: true, data: response };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}
async function callClaudeAPI(apiKey, message, systemPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      system: systemPrompt
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

console.log('Service worker initialized');