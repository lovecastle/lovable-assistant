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
      
    case 'saveMessageGroup':
      handleSaveMessageGroup(request.data).then(result => {
        sendResponse(result);
      });
      break;
      
    case 'bulkSaveConversations':
      handleBulkSaveConversations(request.data).then(result => {
        sendResponse(result);
      });
      break;
      
    case 'getConversations':
      handleGetConversations(request.filters || {}).then(result => {
        sendResponse(result);
      });
      break;
      
    case 'deleteConversations':
      handleDeleteConversations(request.filters || {}).then(result => {
        sendResponse(result);
      });
      break;
      
    case 'showNotification':
      handleShowNotification(request.data).then(result => {
        sendResponse(result);
      });
      break;
      
    case 'updateNotificationSettings':
      handleUpdateNotificationSettings(request.settings).then(result => {
        sendResponse(result);
      });
      break;
      
    case 'getNotificationSettings':
      handleGetNotificationSettings().then(result => {
        sendResponse(result);
      });
      break;
      
    case 'startWorkingStatusMonitor':
      handleStartWorkingStatusMonitor(sender.tab.id).then(result => {
        sendResponse(result);
      });
      break;
      
    case 'checkWorkingStatus':
      // Content script will send current status
      handleWorkingStatusUpdate(sender.tab.id, request.data).then(result => {
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
    
    // Handle constraint violations and skipped duplicates
    if (result.skipped) {
      console.log('🔄 Service Worker: Conversation skipped (duplicate):', result.reason);
      return { 
        success: true, 
        skipped: true, 
        reason: result.reason,
        lovableMessageId: result.lovableMessageId
      };
    }
    
    // Handle save errors
    if (!result.success) {
      console.error('❌ Service Worker: Save failed:', result.error);
      return { 
        success: false, 
        error: result.error || 'Unknown database error'
      };
    }
    
    console.log('✅ Service Worker: Conversation saved successfully:', result);
    return { success: true, data: result.data };
    
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
    let skippedCount = 0;
    
    for (const conversationData of conversationsArray) {
      try {
        const result = await supabase.saveConversation(conversationData);
        
        if (result.skipped) {
          results.push({ success: true, skipped: true, reason: result.reason });
          skippedCount++;
        } else if (result.success) {
          results.push({ success: true, data: result.data });
          successCount++;
        } else {
          results.push({ success: false, error: result.error });
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to save conversation ${conversationData.id}:`, error);
        results.push({ success: false, error: error.message });
        errorCount++;
      }
    }
    
    console.log(`✅ Bulk save complete: ${successCount} saved, ${skippedCount} skipped, ${errorCount} errors`);
    return { 
      success: errorCount === 0, 
      data: { 
        results, 
        summary: { successCount, skippedCount, errorCount, total: conversationsArray.length }
      }
    };
  } catch (error) {
    console.error('❌ Bulk save operation failed:', error);
    return { success: false, error: error.message };
  }
}

async function handleSaveMessageGroup(messageGroup) {
  try {
    console.log('🔍 Service Worker: Auto-capture saving message group:', messageGroup.id);
    
    // Convert message group format to conversation format
    const conversationData = {
      id: generateUUID(),
      projectId: messageGroup.projectId,
      userMessage: messageGroup.userContent || '',
      lovableResponse: messageGroup.lovableContent || '',
      timestamp: messageGroup.timestamp || new Date().toISOString(),
      projectContext: {
        messageGroupId: messageGroup.id,
        userId: messageGroup.userId,
        lovableId: messageGroup.lovableId,
        autoCapture: true
      },
      categories: messageGroup.categories ? [
        ...(messageGroup.categories.primary || []),
        ...(messageGroup.categories.secondary || [])
      ] : []
    };

    console.log('🔍 Service Worker: Auto-capture conversation data:', {
      id: conversationData.id,
      userMessageLength: conversationData.userMessage?.length || 0,
      lovableResponseLength: conversationData.lovableResponse?.length || 0
    });

    const result = await supabase.saveConversation(conversationData);
    
    // Handle constraint violations and skipped duplicates
    if (result.skipped) {
      console.log('🔄 Service Worker: Auto-capture conversation skipped (duplicate):', result.reason);
      return { 
        success: true, 
        skipped: true, 
        reason: result.reason,
        lovableMessageId: result.lovableMessageId
      };
    }
    
    // Handle save errors
    if (!result.success) {
      console.error('❌ Service Worker: Auto-capture save failed:', result.error);
      return { 
        success: false, 
        error: result.error || 'Unknown database error'
      };
    }
    
    console.log('✅ Service Worker: Auto-captured conversation saved:', result);
    return { success: true, data: result.data };
    
  } catch (error) {
    console.error('❌ Service Worker: Failed to save auto-captured conversation:', error);
    return { success: false, error: error.message };
  }
}

async function handleGetConversations(filters = {}) {
  try {
    console.log('🔍 Service Worker: Getting conversations with filters:', filters);
    
    const conversations = await supabase.getConversations(
      filters.projectId, 
      filters.limit || 50
    );
    
    console.log(`✅ Service Worker: Retrieved ${conversations.length} conversations`);
    return { success: true, data: conversations };
  } catch (error) {
    console.error('❌ Service Worker: Failed to get conversations:', error);
    return { success: false, error: error.message };
  }
}

async function handleDeleteConversations(filters = {}) {
  try {
    console.log('🔍 Service Worker: Deleting conversations with filters:', filters);
    
    // Special handling for bulk delete operations
    if (filters.ids && Array.isArray(filters.ids)) {
      console.log(`🔍 Service Worker: Bulk deleting ${filters.ids.length} conversations`);
    }
    
    const result = await supabase.deleteConversations(filters);
    
    console.log('✅ Service Worker: Conversations deleted:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Service Worker: Failed to delete conversations:', error);
    return { success: false, error: error.message };
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
async function callClaudeAPI(apiKey, message, systemPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
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

// Notification system functions
async function handleShowNotification(data) {
  try {
    const settings = await chrome.storage.sync.get(['notificationsEnabled']);
    
    // Check if notifications are enabled
    if (settings.notificationsEnabled === false) {
      return { success: false, reason: 'Notifications disabled' };
    }
    
    // Create notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
      title: 'Lovable.dev Assistant',
      message: data.message || 'Lovable has done the task. Return to the tab!',
      priority: 2,
      requireInteraction: false
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('Notification error:', chrome.runtime.lastError);
      } else {
        console.log('Notification shown:', notificationId);
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to show notification:', error);
    return { success: false, error: error.message };
  }
}

async function handleUpdateNotificationSettings(settings) {
  try {
    await chrome.storage.sync.set({
      notificationsEnabled: settings.enabled !== false,
      notificationThreshold: settings.threshold || 3000
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    return { success: false, error: error.message };
  }
}

async function handleGetNotificationSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'notificationsEnabled',
      'notificationThreshold'
    ]);
    return {
      success: true,
      settings: {
        enabled: settings.notificationsEnabled !== false,
        threshold: settings.notificationThreshold || 3000
      }
    };
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    return { success: false, error: error.message };
  }
}

// Working status monitoring system
const tabWorkingStatus = new Map(); // Track working status per tab

async function handleStartWorkingStatusMonitor(tabId) {
  try {
    console.log(`🎬 [Tab ${tabId}] Initializing working status monitor...`);
    
    // Initialize monitoring for this tab
    if (!tabWorkingStatus.has(tabId)) {
      tabWorkingStatus.set(tabId, {
        isWorking: false,
        startTime: null,
        hasNotified: false,
        checkInterval: null
      });
      console.log(`📝 [Tab ${tabId}] Created new monitoring state`);
    } else {
      console.log(`♻️ [Tab ${tabId}] Reusing existing monitoring state`);
    }
    
    // Start periodic status checks
    startStatusChecking(tabId);
    
    console.log(`✅ [Tab ${tabId}] Working status monitor started successfully!`);
    return { success: true };
  } catch (error) {
    console.error(`❌ [Tab ${tabId}] Failed to start working status monitor:`, error);
    return { success: false, error: error.message };
  }
}

function startStatusChecking(tabId) {
  const status = tabWorkingStatus.get(tabId);
  if (!status) return;
  
  // Clear any existing interval
  if (status.checkInterval) {
    clearInterval(status.checkInterval);
  }
  
  // Set polling rate based on working status
  const pollRate = status.isWorking ? 1000 : 3000;
  
  console.log(`📊 [Tab ${tabId}] Starting status checks every ${pollRate}ms (${status.isWorking ? 'WORKING' : 'IDLE'} mode)`);
  
  status.checkInterval = setInterval(async () => {
    try {
      console.log(`🔍 [Tab ${tabId}] Checking working status...`);
      
      // Request status from content script
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'getWorkingStatus'
      });
      
      if (response && response.success) {
        console.log(`📡 [Tab ${tabId}] Status response: ${response.isWorking ? '✅ WORKING' : '⏸️ IDLE'}`);
        await handleWorkingStatusUpdate(tabId, { isWorking: response.isWorking });
      }
    } catch (error) {
      // Tab might be closed or content script not ready
      console.log(`❌ [Tab ${tabId}] Status check failed:`, error.message);
      // Clean up if tab is gone
      if (error.message.includes('No tab with id') || error.message.includes('Receiving end does not exist')) {
        cleanupTab(tabId);
      }
    }
  }, pollRate);
}

async function handleWorkingStatusUpdate(tabId, data) {
  try {
    const status = tabWorkingStatus.get(tabId);
    if (!status) {
      // Initialize if not exists
      tabWorkingStatus.set(tabId, {
        isWorking: false,
        startTime: null,
        hasNotified: false,
        checkInterval: null
      });
      startStatusChecking(tabId);
      return { success: true };
    }
    
    const wasWorking = status.isWorking;
    const isWorking = data.isWorking;
    
    if (isWorking && !wasWorking) {
      // Just started working
      status.isWorking = true;
      status.startTime = Date.now();
      status.hasNotified = false;
      
      console.log(`🚀 [Tab ${tabId}] STATE CHANGE: IDLE → WORKING`);
      console.log(`⏱️ [Tab ${tabId}] Started at: ${new Date(status.startTime).toLocaleTimeString()}`);
      
      // Switch to faster polling
      startStatusChecking(tabId);
      
    } else if (!isWorking && wasWorking) {
      // Just finished working
      const duration = Date.now() - status.startTime;
      status.isWorking = false;
      
      console.log(`✅ [Tab ${tabId}] STATE CHANGE: WORKING → IDLE`);
      console.log(`⏱️ [Tab ${tabId}] Duration: ${Math.round(duration / 1000)} seconds`);
      console.log(`🔔 [Tab ${tabId}] Notification eligible: ${duration >= 3000 ? 'YES' : 'NO (too short)'}`);
      
      // Switch back to slower polling
      startStatusChecking(tabId);
      
      // Check if we should notify
      if (duration >= 3000 && !status.hasNotified) {
        const settings = await chrome.storage.sync.get(['notificationsEnabled']);
        console.log(`⚙️ [Tab ${tabId}] Notifications enabled: ${settings.notificationsEnabled !== false}`);
        
        if (settings.notificationsEnabled !== false) {
          console.log(`📬 [Tab ${tabId}] Sending notification...`);
          await handleShowNotification({
            message: `Lovable has done the task. Return to the tab! (Completed in ${Math.round(duration / 1000)}s)`
          });
          status.hasNotified = true;
          console.log(`✅ [Tab ${tabId}] Notification sent!`);
        } else {
          console.log(`🔕 [Tab ${tabId}] Notifications disabled - skipping`);
        }
      } else if (status.hasNotified) {
        console.log(`ℹ️ [Tab ${tabId}] Already notified for this task`);
      }
    } else {
      console.log(`🔄 [Tab ${tabId}] No state change (still ${isWorking ? 'WORKING' : 'IDLE'})`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update working status:', error);
    return { success: false, error: error.message };
  }
}

function cleanupTab(tabId) {
  const status = tabWorkingStatus.get(tabId);
  if (status && status.checkInterval) {
    clearInterval(status.checkInterval);
  }
  tabWorkingStatus.delete(tabId);
  console.log(`Cleaned up monitoring for tab ${tabId}`);
}

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  cleanupTab(tabId);
});

console.log('Service worker initialized');