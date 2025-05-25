// Service Worker for Chrome Extension Background Tasks
import { SupabaseClient } from './database-sync.js';

console.log('Service worker starting...');

// Initialize database client
const supabase = new SupabaseClient();

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
      
    case 'saveConversation':
      handleSaveConversation(request.data).then(result => {
        sendResponse(result);
      });
      break;
      
    case 'bulkSaveConversations':
      handleBulkSaveConversations(request.data).then(result => {
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

async function handleSaveConversation(conversationData) {
  try {
    console.log('🔍 Service Worker: Received saveConversation request:', {
      id: conversationData.id,
      projectId: conversationData.projectId,
      userMessageLength: conversationData.userMessage?.length || 0,
      lovableResponseLength: conversationData.lovableResponse?.length || 0,
      timestamp: conversationData.timestamp
    });
    
    // Check if Supabase is properly configured
    const config = await chrome.storage.sync.get(['supabaseUrl', 'supabaseKey']);
    if (!config.supabaseUrl || !config.supabaseKey) {
      console.error('❌ Service Worker: Supabase not configured!');
      return { 
        success: false, 
        error: 'Supabase not configured. Please set up Supabase URL and API key in extension settings.' 
      };
    }
    
    console.log('✅ Service Worker: Supabase configuration found');
    
    const result = await supabase.saveConversation(conversationData);
    console.log('✅ Service Worker: Conversation saved successfully:', result);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Service Worker: Failed to save conversation:', error);
    return { success: false, error: error.message };
  }
}

async function handleBulkSaveConversations(conversationsArray) {
  try {
    console.log(`💾 Bulk saving ${conversationsArray.length} conversations...`);
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const conversationData of conversationsArray) {
      try {
        const result = await supabase.saveConversation(conversationData);
        results.push({ success: true, data: result });
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to save conversation ${conversationData.id}:`, error);
        results.push({ success: false, error: error.message });
        errorCount++;
      }
    }
    
    console.log(`✅ Bulk save complete: ${successCount} saved, ${errorCount} errors`);
    return { 
      success: errorCount === 0, 
      data: { 
        results, 
        summary: { successCount, errorCount, total: conversationsArray.length }
      }
    };
  } catch (error) {
    console.error('❌ Bulk save operation failed:', error);
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