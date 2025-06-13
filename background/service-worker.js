// Service Worker for Chrome Extension Background Tasks
import { SupabaseClient } from './database-sync.js';
import { AIAPI } from './ai-api.js';


// Initialize database client
const supabase = new SupabaseClient();

// Initialize AI API client
const aiAPI = new AIAPI();

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
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'chatMessage':
      handleChatMessage(request.message, request.context).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'saveConversation':
      handleSaveConversation(request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'saveMessageGroup':
      handleSaveMessageGroup(request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'bulkSaveConversations':
      handleBulkSaveConversations(request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'getConversations':
      handleGetConversations(request.filters || {}).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'deleteConversations':
      handleDeleteConversations(request.filters || {}).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'showNotification':
      handleShowNotification(request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'updateNotificationSettings':
      handleUpdateNotificationSettings(request.settings).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'getNotificationSettings':
      handleGetNotificationSettings().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'startWorkingStatusMonitor':
      handleStartWorkingStatusMonitor(sender.tab.id).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'checkWorkingStatus':
      // Content script will send current status
      handleWorkingStatusUpdate(sender.tab.id, request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'activateTab':
      handleActivateTab(sender.tab.id).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'aiRequest':
      handleAIRequest(request.prompt).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'openTab':
      handleOpenTab(request.url).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'saveProjectManager':
      handleSaveProjectManager(request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'getProjectManager':
      handleGetProjectManager(request.projectId).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'getProjectInfo':
      handleGetProjectInfo(request.projectId).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'saveAssistantConversation':
      handleSaveAssistantConversation(request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'getAssistantConversations':
      handleGetAssistantConversations(request.projectId, request.limit).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'getAllProjectManagers':
      handleGetAllProjectManagers().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'updateProjectManager':
      handleUpdateProjectManager(request.projectId, request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'deleteProjectManager':
      handleDeleteProjectManager(request.projectId).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true;
});

async function testConnection() {
  try {
    // Test AI API connection
    const aiConnected = await aiAPI.testConnection();
    
    // Test Supabase connection
    const settings = await chrome.storage.sync.get(['supabaseUrl', 'supabaseKey']);
    const supabaseConnected = !!(settings.supabaseUrl && settings.supabaseKey);
    
    return aiConnected && supabaseConnected;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

async function handleChatMessage(message, context) {
  try {
    // Build context information
    const projectName = context?.projectName || 'Unknown Project';
    const projectId = context?.projectId || 'unknown';
    
    // Get project information
    let projectInfo = '';
    if (context?.projectId) {
      try {
        const projectResult = await supabase.getProjectManager(context.projectId);
        if (projectResult.success && projectResult.data) {
          const project = projectResult.data;
          projectInfo = '\n\nProject Information:\n';
          if (project.description) {
            projectInfo += `Description: ${project.description}\n`;
          }
          if (project.notes) {
            projectInfo += `Notes: ${project.notes}\n`;
          }
          if (project.tech_stack) {
            projectInfo += `Tech Stack: ${project.tech_stack}\n`;
          }
        }
      } catch (error) {
        console.warn('Could not fetch project info:', error);
      }
    }
    
    // Get recent Lovable conversations for context
    let lovableHistory = '';
    if (context?.projectId) {
      try {
        const conversations = await supabase.getConversations(context.projectId, 10);
        if (conversations && conversations.length > 0) {
          lovableHistory = '\n\nRecent Lovable conversations:\n' + 
            conversations.slice(0, 5).map(conv => 
              `User: ${conv.user_message?.substring(0, 100)}...\nLovable: ${conv.lovable_response?.substring(0, 100)}...`
            ).join('\n\n');
        }
      } catch (error) {
        console.warn('Could not fetch Lovable history:', error);
      }
    }
    
    // Build conversation history context
    let conversationContext = '';
    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      conversationContext = '\n\nPrevious assistant conversations:\n' +
        context.conversationHistory.map(conv => 
          `User: ${conv.user}\nAssistant: ${conv.assistant}`
        ).join('\n\n');
    }
    
    const systemPrompt = `You are a helpful development assistant for Lovable.dev projects. 
    You are assisting with the project "${projectName}".
    
    Help with coding, debugging, and best practices. Be concise but helpful.
    You have access to the project's information and conversation history to provide context-aware assistance.
    ${projectInfo}
    ${lovableHistory}
    ${conversationContext}
    
    Current context:
    - Project: ${projectName}
    - Project ID: ${projectId}
    - URL: ${context?.url || 'Unknown'}
    
    Provide helpful, specific advice based on the project context and history.
    When greeting the user, always use the project name "${projectName}" not the project ID.`;

    const response = await aiAPI.generateResponse(message, systemPrompt);
    return { success: true, data: response };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleAIRequest(prompt) {
  try {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt provided');
    }
    
    console.log('🤖 AI Request received:', prompt.substring(0, 100) + '...');
    
    const response = await aiAPI.generateResponse(prompt);
    
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid response from AI API');
    }
    
    console.log('✅ AI Response generated:', response.substring(0, 100) + '...');
    return { success: true, content: response };
    
  } catch (error) {
    console.error('❌ AI Request failed:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred',
      details: error.toString()
    };
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
    // Initialize monitoring for this tab
    if (!tabWorkingStatus.has(tabId)) {
      tabWorkingStatus.set(tabId, {
        isWorking: false,
        startTime: null,
        hasNotified: false,
        checkInterval: null
      });
    }
    
    // Start periodic status checks
    startStatusChecking(tabId);
    
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
  
  status.checkInterval = setInterval(async () => {
    try {
      // Request status from content script
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'getWorkingStatus'
      });
      
      if (response && response.success) {
        await handleWorkingStatusUpdate(tabId, { isWorking: response.isWorking });
      }
    } catch (error) {
      // Tab might be closed or content script not ready
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
      }
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

async function handleActivateTab(tabId) {
  try {
    // Get the tab info
    const tab = await chrome.tabs.get(tabId);
    
    // Focus the window containing the tab
    await chrome.windows.update(tab.windowId, { focused: true });
    
    // Activate the tab
    await chrome.tabs.update(tabId, { active: true });
    
    console.log(`✅ [Tab ${tabId}] Tab activated and window focused`);
    return { success: true };
  } catch (error) {
    console.error(`❌ [Tab ${tabId}] Failed to activate tab:`, error);
    return { success: false, error: error.message };
  }
}

async function handleOpenTab(url) {
  try {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }
    
    // Create new tab
    const tab = await chrome.tabs.create({ url: url });
    
    console.log(`✅ Opened new tab: ${url}`);
    return { success: true, tabId: tab.id };
  } catch (error) {
    console.error('❌ Failed to open tab:', error);
    return { success: false, error: error.message };
  }
}

// Project Manager handler functions
async function handleSaveProjectManager(projectManagerData) {
  try {
    console.log(`🔍 Service Worker: Saving project manager for project ${projectManagerData.project_id}`);
    
    const result = await supabase.saveProjectManager(projectManagerData);
    
    if (result.success) {
      console.log('✅ Service Worker: Project manager saved successfully');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to save project manager:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error saving project manager:', error);
    return { success: false, error: error.message };
  }
}

async function handleGetProjectManager(projectId) {
  try {
    console.log(`🔍 Service Worker: Getting project manager for project ${projectId}`);
    
    const result = await supabase.getProjectManager(projectId);
    
    if (result.success) {
      console.log('✅ Service Worker: Project manager retrieved successfully');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to get project manager:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error getting project manager:', error);
    return { success: false, error: error.message };
  }
}

async function handleGetAllProjectManagers() {
  try {
    console.log('🔍 Service Worker: Getting all project managers');
    
    const result = await supabase.getAllProjectManagers();
    
    if (result.success) {
      console.log(`✅ Service Worker: Retrieved ${result.data?.length || 0} project managers`);
      return result;
    } else {
      console.error('❌ Service Worker: Failed to get all project managers:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error getting all project managers:', error);
    return { success: false, error: error.message };
  }
}

async function handleGetProjectInfo(projectId) {
  try {
    console.log(`🔍 Service Worker: Getting project info for ${projectId}`);
    
    // First try to get from project_managers table
    const result = await supabase.getProjectManager(projectId);
    
    if (result.success && result.data) {
      console.log('✅ Service Worker: Project info retrieved successfully');
      return { 
        success: true, 
        data: {
          id: result.data.project_id,
          name: result.data.project_name || result.data.name || 'Unnamed Project',
          url: result.data.project_url || result.data.url,
          description: result.data.description,
          notes: result.data.notes
        }
      };
    }
    
    // If not found in project_managers, return basic info
    return {
      success: true,
      data: {
        id: projectId,
        name: null // Will trigger UI to use fallback
      }
    };
    
  } catch (error) {
    console.error('❌ Service Worker: Error getting project info:', error);
    return { success: false, error: error.message };
  }
}

async function handleSaveAssistantConversation(conversationData) {
  try {
    console.log('💾 Service Worker: Saving assistant conversation');
    
    const result = await supabase.saveAssistantConversation(conversationData);
    
    if (result.success) {
      console.log('✅ Service Worker: Assistant conversation saved successfully');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to save assistant conversation:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error saving assistant conversation:', error);
    return { success: false, error: error.message };
  }
}

async function handleGetAssistantConversations(projectId, limit = 10) {
  try {
    console.log(`🔍 Service Worker: Getting assistant conversations for project ${projectId}`);
    
    const result = await supabase.getAssistantConversations(projectId, limit);
    
    if (result.success) {
      console.log(`✅ Service Worker: Retrieved ${result.data?.length || 0} assistant conversations`);
      return result;
    } else {
      console.error('❌ Service Worker: Failed to get assistant conversations:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error getting assistant conversations:', error);
    return { success: false, error: error.message };
  }
}

async function handleUpdateProjectManager(projectId, updateData) {
  try {
    console.log(`🔍 Service Worker: Updating project manager for project ${projectId}`);
    
    const result = await supabase.updateProjectManager(projectId, updateData);
    
    if (result.success) {
      console.log('✅ Service Worker: Project manager updated successfully');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to update project manager:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error updating project manager:', error);
    return { success: false, error: error.message };
  }
}

async function handleDeleteProjectManager(projectId) {
  try {
    console.log(`🔍 Service Worker: Deleting project manager for project ${projectId}`);
    
    const result = await supabase.deleteProjectManager(projectId);
    
    if (result.success) {
      console.log('✅ Service Worker: Project manager deleted successfully');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to delete project manager:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error deleting project manager:', error);
    return { success: false, error: error.message };
  }
}

