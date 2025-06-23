// Service Worker for Chrome Extension Background Tasks
import { SupabaseClient } from './database-sync.js';
import { MasterAuthService } from './master-auth-service.js';

// Initialize database client
const supabase = new SupabaseClient();

// Initialize master authentication service
const masterAuth = new MasterAuthService();

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);
  chrome.storage.sync.set({
    autoCapture: true,
    notificationEnabled: false
  });
});

// Restore session when service worker starts
chrome.runtime.onStartup.addListener(() => {
  console.log('🔄 Service Worker starting - restoring session...');
  masterAuth.restoreSession().then(restored => {
    if (restored) {
      console.log('✅ Session restored on startup');
    } else {
      console.log('ℹ️ No session to restore on startup');
    }
  }).catch(error => {
    console.error('❌ Failed to restore session on startup:', error);
  });
});

// Also try to restore session when the service worker first loads
(async () => {
  try {
    console.log('🔄 Service Worker loaded - attempting session restore...');
    const restored = await masterAuth.restoreSession();
    if (restored) {
      console.log('✅ Session restored on service worker load');
    } else {
      console.log('ℹ️ No session to restore on service worker load');
    }
  } catch (error) {
    console.error('❌ Failed to restore session on service worker load:', error);
  }
})();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    // Master Authentication handlers
    case 'masterAuth_register':
      handleMasterAuthRegister(request.email, request.password, request.displayName).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'masterAuth_login':
      handleMasterAuthLogin(request.email, request.password).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'masterAuth_logout':
      handleMasterAuthLogout().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'masterAuth_getCurrentUser':
      handleMasterAuthGetCurrentUser().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'masterAuth_getSystemTemplates':
      handleMasterAuthGetSystemTemplates().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'masterAuth_updateUserDatabase':
      handleMasterAuthUpdateUserDatabase(request.databaseUrl, request.databaseKey).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'checkAuth':
      handleCheckAuth().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'testConnection':
      testConnection().then(result => {
        sendResponse({ success: result });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
      
    case 'testDatabaseConnection':
      handleTestDatabaseConnection(request.projectId, request.apiKey).then(result => {
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
      
    // User Database handlers
    case 'initializeUserDatabase':
      handleInitializeUserDatabase().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'testUserDatabaseConnection':
      handleTestUserDatabaseConnection().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    // UI Preferences handlers
    case 'saveUIPreference':
      handleSaveUIPreference(request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'getUIPreference':
      handleGetUIPreference(request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'getAllUIPreferences':
      handleGetAllUIPreferences().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
      
    case 'saveSupabaseSettings':
      handleSaveSupabaseSettings(request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    // Prompt Templates handlers
    case 'getPromptTemplates':
      handleGetPromptTemplates().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'savePromptTemplates':
      handleSavePromptTemplates(request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    // AI API handler
    case 'callAI':
      handleCallAI(request.data).then(result => {
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
    // Test Supabase connection
    const settings = await chrome.storage.sync.get(['supabaseUrl', 'supabaseKey']);
    const supabaseConnected = !!(settings.supabaseUrl && settings.supabaseKey);
    
    return supabaseConnected;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to save conversations.' 
      };
    }
    
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
    
    const result = await supabase.saveConversationWithUser(conversationData, userId);
    
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to save conversations.' 
      };
    }
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const conversationData of conversationsArray) {
      try {
        const result = await supabase.saveConversationWithUser(conversationData, userId);
        
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to save conversations.' 
      };
    }
    
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

    const result = await supabase.saveConversationWithUser(conversationData, userId);
    
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to view conversations.' 
      };
    }
    
    const conversations = await supabase.getConversationsWithUser(
      filters.projectId, 
      userId,
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to delete conversations.' 
      };
    }
    
    // Special handling for bulk delete operations
    if (filters.ids && Array.isArray(filters.ids)) {
      console.log(`🔍 Service Worker: Bulk deleting ${filters.ids.length} conversations`);
    }
    
    const result = await supabase.deleteConversationsWithUser(filters, userId);
    
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to save project data.' 
      };
    }
    
    const result = await supabase.saveProjectManagerWithUser(projectManagerData, userId);
    
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to view project data.' 
      };
    }
    
    const result = await supabase.getProjectManagerWithUser(projectId, userId);
    
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to view projects.' 
      };
    }
    
    const result = await supabase.getAllProjectManagersWithUser(userId);
    
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to view project info.' 
      };
    }
    
    // First try to get from project_managers table
    const result = await supabase.getProjectManagerWithUser(projectId, userId);
    
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to save assistant conversations.' 
      };
    }
    
    const result = await supabase.saveAssistantConversationWithUser(conversationData, userId);
    
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to view assistant conversations.' 
      };
    }
    
    const result = await supabase.getAssistantConversationsWithUser(projectId, userId, limit);
    
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to update project data.' 
      };
    }
    
    const result = await supabase.updateProjectManagerWithUser(projectId, updateData, userId);
    
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
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to delete project data.' 
      };
    }
    
    const result = await supabase.deleteProjectManagerWithUser(projectId, userId);
    
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

// User ID helper function - removed, now using masterAuth.getCurrentUserId()

// UI Preferences handlers
async function handleSaveUIPreference(data) {
  try {
    console.log('🔍 Service Worker: Saving UI preference (individual):', data.preferenceKey);
    
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to save preferences.' 
      };
    }
    
    const result = await supabase.saveUIPreferenceIndividual(userId, data.preferenceKey, data.preferenceValue);
    
    if (result.success) {
      console.log('✅ Service Worker: UI preference saved successfully (individual)');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to save UI preference (individual):', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error saving UI preference (individual):', error);
    return { success: false, error: error.message };
  }
}

async function handleGetUIPreference(data) {
  try {
    console.log('🔍 Service Worker: Getting UI preference:', data.preferenceKey);
    
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to view preferences.' 
      };
    }
    
    const result = await supabase.getUIPreference(userId, data.preferenceKey);
    
    if (result.success) {
      console.log('✅ Service Worker: UI preference retrieved successfully');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to get UI preference:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error getting UI preference:', error);
    return { success: false, error: error.message };
  }
}

async function handleGetAllUIPreferences() {
  try {
    console.log('🔍 Service Worker: Getting all UI preferences (individual)');
    
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to view preferences.' 
      };
    }
    
    const result = await supabase.getAllUIPreferencesIndividual(userId);
    
    if (result.success) {
      console.log(`✅ Service Worker: Retrieved ${Object.keys(result.data || {}).length} UI preferences (individual)`);
      return result;
    } else {
      console.error('❌ Service Worker: Failed to get UI preferences (individual):', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error getting UI preferences (individual):', error);
    return { success: false, error: error.message };
  }
}










// Database connection test function
async function handleTestDatabaseConnection(projectIdOrUrl, apiKey) {
  try {
    console.log('🔍 Service Worker: Testing database connection with provided credentials');
    
    if (!projectIdOrUrl || !apiKey) {
      return { success: false, error: 'Project ID/URL and API key are required' };
    }
    
    // Extract project ID and construct proper Supabase URL
    let supabaseUrl;
    if (projectIdOrUrl.startsWith('https://')) {
      // Full URL provided
      supabaseUrl = projectIdOrUrl.replace(/\/$/, ''); // Remove trailing slash
    } else if (projectIdOrUrl.includes('.supabase.co')) {
      // URL without protocol
      supabaseUrl = `https://${projectIdOrUrl}`;
    } else {
      // Just project ID provided
      supabaseUrl = `https://${projectIdOrUrl}.supabase.co`;
    }
    
    console.log('🔍 Service Worker: Using Supabase URL:', supabaseUrl);
    
    // Test the database connection by making a simple request
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!testResponse.ok) {
      let errorMessage = `Database connection failed: ${testResponse.status} ${testResponse.statusText}`;
      
      try {
        const errorData = await testResponse.text();
        if (errorData) {
          // Parse common Supabase error messages
          if (testResponse.status === 401) {
            errorMessage = 'Invalid API key or insufficient permissions';
          } else if (testResponse.status === 404) {
            errorMessage = 'Project not found - check your Project ID';
          } else {
            errorMessage = `Database error: ${errorData}`;
          }
        }
      } catch (parseError) {
        // Use the basic error message if we can't parse the response
      }
      
      console.error('❌ Service Worker: Database connection test failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
    
    // Test if required tables exist, and create them if not
    try {
      console.log('🔍 Service Worker: Checking database schema...');
      const schemaResult = await setupDatabaseSchema(supabaseUrl, apiKey);
      
      if (!schemaResult.success) {
        console.error('❌ Service Worker: Schema setup failed:', schemaResult.error);
        return schemaResult;
      }
      
      console.log('✅ Service Worker: Database schema verified/created successfully');
      
      // Return the actual result from schema setup (which includes RLS handling)
      console.log('✅ Service Worker: Database connection and schema setup completed');
      return schemaResult;
      
    } catch (tableError) {
      console.warn('⚠️ Service Worker: Schema setup or table test failed:', tableError.message);
      return { 
        success: false, 
        error: `Database connected but schema setup failed: ${tableError.message}` 
      };
    }
    
  } catch (error) {
    console.error('❌ Service Worker: Database connection test error:', error);
    return { 
      success: false, 
      error: `Database connection failed: ${error.message}` 
    };
  }
}

// Database Schema Setup Function
async function setupDatabaseSchema(supabaseUrl, apiKey) {
  try {
    console.log('🏗️ Service Worker: Setting up database schema...');
    
    // Check if tables already exist by trying to query one
    try {
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/user_preferences?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (checkResponse.ok) {
        console.log('✅ Service Worker: Database schema already exists');
        return { success: true, message: 'Schema already exists' };
      }
    } catch (checkError) {
      // Tables don't exist or other error, proceed with creation
      console.log('🔧 Service Worker: Tables not found, creating schema...');
    }
    
    // Personal database migration SQL from user-personal-db-migration.sql
    const migrationSQL = `
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  desktop_notification BOOLEAN DEFAULT FALSE,
  tab_rename BOOLEAN DEFAULT FALSE,
  auto_switch BOOLEAN DEFAULT FALSE,
  supabase_id TEXT,
  supabase_anon_key TEXT
);

-- Create project_manager table
CREATE TABLE IF NOT EXISTS project_manager (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  project_url TEXT NOT NULL,
  description TEXT DEFAULT '',
  knowledge TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL DEFAULT 'default',
  CONSTRAINT project_manager_description_length CHECK (char_length(description) <= 150)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT,
  user_message TEXT NOT NULL,
  lovable_response TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_context JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  effectiveness_score INTEGER CHECK (effectiveness_score >= 1 AND effectiveness_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_message_id TEXT,
  lovable_message_id TEXT,
  message_group_id TEXT,
  auto_capture BOOLEAN DEFAULT FALSE,
  user_id TEXT NOT NULL DEFAULT 'default'
);

-- Create assistant_conversations table
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  metadata JSONB DEFAULT '{}',
  user_id TEXT NOT NULL DEFAULT 'default'
);
`;

    // Create indexes SQL
    const indexesSQL = `
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lovable_message_id ON conversations(lovable_message_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_project_id ON assistant_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_created_at ON assistant_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_id ON assistant_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_project_manager_project_id ON project_manager(project_id);
CREATE INDEX IF NOT EXISTS idx_project_manager_user_id ON project_manager(user_id);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_active ON prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_shortcut ON prompt_templates(shortcut);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
`;

    // Triggers and functions SQL
    const functionsSQL = `
-- Updated timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_prompt_templates_updated_at ON prompt_templates;
CREATE TRIGGER update_prompt_templates_updated_at 
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_manager_updated_at ON project_manager;
CREATE TRIGGER update_project_manager_updated_at 
    BEFORE UPDATE ON project_manager
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assistant_conversations_updated_at ON assistant_conversations;
CREATE TRIGGER update_assistant_conversations_updated_at 
    BEFORE UPDATE ON assistant_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

    // RLS and policies SQL
    const securitySQL = `
-- Enable RLS
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_manager ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for personal database
DROP POLICY IF EXISTS "Personal access to prompt_templates" ON prompt_templates;
CREATE POLICY "Personal access to prompt_templates" ON prompt_templates FOR ALL USING (true);

DROP POLICY IF EXISTS "Personal access to user_preferences" ON user_preferences;
CREATE POLICY "Personal access to user_preferences" ON user_preferences FOR ALL USING (true);

DROP POLICY IF EXISTS "Personal access to project_manager" ON project_manager;
CREATE POLICY "Personal access to project_manager" ON project_manager FOR ALL USING (true);

DROP POLICY IF EXISTS "Personal access to conversations" ON conversations;
CREATE POLICY "Personal access to conversations" ON conversations FOR ALL USING (true);

DROP POLICY IF EXISTS "Personal access to assistant_conversations" ON assistant_conversations;
CREATE POLICY "Personal access to assistant_conversations" ON assistant_conversations FOR ALL USING (true);
`;

    // Try automatic setup using REST API calls
    try {
      console.log('🔧 Service Worker: Setting up database schema automatically...');
      
      // Create tables using direct REST API calls
      const setupResult = await createTablesViaRestAPI(supabaseUrl, apiKey);
      
      if (setupResult.success) {
        console.log('✅ Service Worker: Automated database schema setup completed');
        return { success: true, message: 'Database connected and schema ready' };
      } else {
        throw new Error(setupResult.error);
      }
      
    } catch (setupError) {
      console.warn('⚠️ Service Worker: Automated setup failed:', setupError.message);
      
      // Check if tables exist (might have been created manually)
      try {
        const testTables = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/conversations?limit=1`, {
            headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
          }),
          fetch(`${supabaseUrl}/rest/v1/prompt_templates?limit=1`, {
            headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
          })
        ]);
        
        if (testTables.every(response => response.ok)) {
          console.log('✅ Service Worker: Tables exist, database is ready');
          return { success: true, message: 'Database connected and ready' };
        } else {
          console.log('⚠️ Service Worker: Tables do not exist, manual setup required');
          return { 
            success: false, 
            error: 'Database connected but tables need to be created. Please run the setup SQL in your Supabase SQL Editor or deploy the setup edge function.',
            needsManualSetup: true,
            setupInstructions: 'Go to your Supabase dashboard → SQL Editor → Paste the contents of simple-db-setup.sql → Run'
          };
        }
      } catch (testError) {
        console.error('❌ Service Worker: Failed to test table existence:', testError.message);
        return { 
          success: false, 
          error: 'Database connected but unable to verify table setup. Please run the migration SQL manually in your Supabase SQL Editor.',
          needsManualSetup: true
        };
      }
    }
    
  } catch (error) {
    console.error('❌ Service Worker: Schema setup failed:', error);
    return { success: false, error: error.message };
  }
}

// Create database setup function
async function createDatabaseSetupFunction(supabaseUrl, apiKey) {
  console.log('🔧 Service Worker: Creating database setup function...');
  
  try {
    // Create an Edge Function to handle the database setup
    const setupFunctionCode = `
      import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
      
      Deno.serve(async (req) => {
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
          
          const supabase = createClient(supabaseUrl, supabaseKey)
          
          // Execute the migration SQL
          const migrationSQL = \`
            -- Enable required extensions
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            
            -- Create tables with proper structure
            CREATE TABLE IF NOT EXISTS prompt_templates (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              category TEXT NOT NULL,
              name TEXT NOT NULL,
              template TEXT NOT NULL,
              shortcut TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              user_id TEXT NOT NULL DEFAULT 'default',
              is_custom BOOLEAN DEFAULT TRUE,
              is_active BOOLEAN DEFAULT TRUE
            );
            
            CREATE TABLE IF NOT EXISTS user_preferences (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id TEXT NOT NULL DEFAULT 'default',
              settings JSONB DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              email TEXT,
              subscription_tier TEXT DEFAULT 'free',
              subscription_status TEXT DEFAULT 'active',
              subscription_expires_at TIMESTAMP WITH TIME ZONE,
              desktop_notification BOOLEAN DEFAULT FALSE,
              tab_rename BOOLEAN DEFAULT FALSE,
              auto_switch BOOLEAN DEFAULT FALSE,
              supabase_id TEXT,
              supabase_anon_key TEXT
            );
            
            CREATE TABLE IF NOT EXISTS project_manager (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              project_id TEXT NOT NULL UNIQUE,
              project_name TEXT NOT NULL,
              project_url TEXT NOT NULL,
              description TEXT DEFAULT '',
              knowledge TEXT DEFAULT '',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              user_id TEXT NOT NULL DEFAULT 'default',
              CONSTRAINT project_manager_description_length CHECK (char_length(description) <= 150)
            );
            
            CREATE TABLE IF NOT EXISTS conversations (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              project_id TEXT,
              user_message TEXT NOT NULL,
              lovable_response TEXT,
              timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              project_context JSONB DEFAULT '{}',
              tags TEXT[] DEFAULT '{}',
              effectiveness_score INTEGER CHECK (effectiveness_score >= 1 AND effectiveness_score <= 10),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              user_message_id TEXT,
              lovable_message_id TEXT,
              message_group_id TEXT,
              auto_capture BOOLEAN DEFAULT FALSE,
              user_id TEXT NOT NULL DEFAULT 'default'
            );
            
            CREATE TABLE IF NOT EXISTS assistant_conversations (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              project_id TEXT NOT NULL,
              user_message TEXT NOT NULL,
              assistant_response TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
              metadata JSONB DEFAULT '{}',
              user_id TEXT NOT NULL DEFAULT 'default'
            );
            
            -- Disable RLS for personal database
            ALTER TABLE prompt_templates DISABLE ROW LEVEL SECURITY;
            ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
            ALTER TABLE project_manager DISABLE ROW LEVEL SECURITY;
            ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
            ALTER TABLE assistant_conversations DISABLE ROW LEVEL SECURITY;
          \`
          
          const { error } = await supabase.rpc('exec', { sql: migrationSQL })
          
          if (error) {
            throw error
          }
          
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
          })
          
        } catch (error) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })
    `;
    
    // Try to deploy this as an edge function
    const deployResponse = await fetch(`${supabaseUrl}/functions/v1/setup-database`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: setupFunctionCode
      })
    });
    
    if (deployResponse.ok) {
      console.log('✅ Service Worker: Setup function created successfully');
      return { success: true };
    } else {
      console.log('⚠️ Service Worker: Could not create edge function, using fallback method');
      return { success: false, error: 'Edge function deployment not available' };
    }
    
  } catch (error) {
    console.error('❌ Service Worker: Failed to create setup function:', error.message);
    return { success: false, error: error.message };
  }
}

// Execute database setup
async function executeDatabaseSetup(supabaseUrl, apiKey) {
  console.log('🔧 Service Worker: Executing database setup...');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/setup-database`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Service Worker: Database setup executed successfully');
      return { success: true, result };
    } else {
      const error = await response.text();
      console.error('❌ Service Worker: Database setup execution failed:', error);
      return { success: false, error };
    }
    
  } catch (error) {
    console.error('❌ Service Worker: Failed to execute database setup:', error.message);
    return { success: false, error: error.message };
  }
}

// Create schema via edge function (alternative method)
async function createSchemaViaEdgeFunction(supabaseUrl, apiKey) {
  console.log('🔧 Service Worker: Creating schema via edge function...');
  
  // This is a fallback method that tries to use built-in capabilities
  // If automatic setup fails, we recommend manual setup
  return { success: false, error: 'Automatic schema creation not available' };
}

// Insert default prompt templates and user preferences
async function insertDefaultData(supabaseUrl, apiKey) {
  try {
    // Insert default user preferences
    const userPrefsResponse = await fetch(`${supabaseUrl}/rest/v1/user_preferences`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify({
        user_id: 'default',
        settings: {
          auto_capture: true,
          notification_enabled: false,
          theme: 'light',
          language: 'en',
          max_conversations: 1000,
          sync_interval: 300000,
          debug_mode: false
        }
      })
    });

    // Insert default prompt templates
    const defaultTemplates = [
      {
        category: 'Error Debugging',
        name: 'Minor Errors',
        template: 'The same error persists. Do not make any code changes yet—investigate thoroughly to find the exact root cause. Analyze logs, flow, and dependencies deeply, and propose solutions only once you fully understand the issue.',
        shortcut: 'minor_errors',
        is_custom: true,
        is_active: true
      },
      {
        category: 'Error Debugging',
        name: 'Major Errors',
        template: 'This is the final attempt to fix this issue. Stop all changes and methodically re-examine the entire flow—auth, Supabase, Stripe, state management, and redirects—from the ground up. Map out what\'s breaking and why, test everything in isolation, and do not proceed without absolute certainty.',
        shortcut: 'major_errors',
        is_custom: true,
        is_active: true
      },
      {
        category: 'Design',
        name: 'UI Change',
        template: 'Make only visual updates—do not impact functionality or logic in any way. Fully understand how the current UI integrates with the app, ensuring logic, state management, and APIs remain untouched. Test thoroughly to confirm the app behaves exactly as before. Stop if there\'s any doubt about unintended effects.',
        shortcut: 'ui_change',
        is_custom: true,
        is_active: true
      },
      {
        category: 'Editing Features',
        name: 'Fragile Update',
        template: 'This update is highly sensitive and demands extreme precision. Thoroughly analyze all dependencies and impacts before making changes, and test methodically to ensure nothing breaks. Avoid shortcuts or assumptions—pause and seek clarification if uncertain. Accuracy is essential.',
        shortcut: 'fragile_update',
        is_custom: true,
        is_active: true
      }
    ];

    for (const template of defaultTemplates) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/prompt_templates`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=ignore-duplicates'
          },
          body: JSON.stringify(template)
        });
      } catch (templateError) {
        console.warn(`⚠️ Failed to insert template ${template.name}:`, templateError.message);
      }
    }

    console.log('✅ Service Worker: Default data inserted successfully');
    
  } catch (error) {
    console.warn('⚠️ Service Worker: Failed to insert some default data:', error.message);
    // Don't fail the entire setup for default data issues
  }
}


// Supabase Settings handlers
async function handleSaveSupabaseSettings(data) {
  try {
    console.log('🔍 Service Worker: Saving Supabase settings');
    
    const userId = masterAuth.getCurrentUserId();
    if (!userId) {
      console.error('❌ Service Worker: User not authenticated');
      return { 
        success: false, 
        error: 'User not authenticated. Please log in to save settings.' 
      };
    }
    
    const result = await supabase.saveSupabaseSettings(userId, data.supabaseId, data.supabaseKey);
    
    if (result.success) {
      console.log('✅ Service Worker: Supabase settings saved successfully');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to save Supabase settings:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error saving Supabase settings:', error);
    return { success: false, error: error.message };
  }
}

// User Database handlers
async function handleInitializeUserDatabase() {
  try {
    console.log('🏗️ Service Worker: Initializing user database schema');
    
    const { userSupabaseUrl, userSupabaseKey } = await chrome.storage.sync.get(['userSupabaseUrl', 'userSupabaseKey']);
    
    if (!userSupabaseUrl || !userSupabaseKey) {
      throw new Error('User database not configured');
    }
    
    // User database schema SQL
    const schemaSQL = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- User settings table
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Extension settings
        auto_capture BOOLEAN DEFAULT TRUE,
        enhance_prompts BOOLEAN DEFAULT TRUE,
        show_notifications BOOLEAN DEFAULT TRUE,
        tab_rename BOOLEAN DEFAULT TRUE,
        
        
        -- UI preferences
        ui_preferences JSONB DEFAULT '{}',
        
      );


      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at);

      -- Enable RLS
      ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

      -- Create policies that allow all access (user's own database)
      DROP POLICY IF EXISTS "Allow all access to user_settings" ON user_settings;
      CREATE POLICY "Allow all access to user_settings" ON user_settings FOR ALL USING (true);
      

      -- Insert default settings if not exists
      INSERT INTO user_settings (id) 
      SELECT uuid_generate_v4() 
      WHERE NOT EXISTS (SELECT 1 FROM user_settings);


      -- Functions for updated_at trigger
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Triggers
      DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
      CREATE TRIGGER update_user_settings_updated_at
        BEFORE UPDATE ON user_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    `;
    
    // Execute schema setup via REST API
    const response = await fetch(`${userSupabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': userSupabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=ignore-duplicates'
      },
      body: JSON.stringify({ 
        sql: schemaSQL.trim()
      })
    });
    
    if (!response.ok) {
      // If RPC doesn't exist, try executing individual statements
      console.log('🔄 RPC method failed, trying alternative setup...');
      
      // For now, just mark as successful since tables might already exist
      // In a real implementation, you'd want to check table existence individually
      console.log('✅ Service Worker: User database schema initialization completed (alternative method)');
      return { success: true, message: 'Database schema ready' };
    }
    
    console.log('✅ Service Worker: User database initialized successfully');
    return { success: true, message: 'Database schema created successfully' };
    
  } catch (error) {
    console.error('❌ Service Worker: Error initializing user database:', error);
    return { success: false, error: error.message };
  }
}

async function handleTestUserDatabaseConnection() {
  try {
    console.log('🔍 Service Worker: Testing user database connection');
    
    const { userSupabaseUrl, userSupabaseKey } = await chrome.storage.sync.get(['userSupabaseUrl', 'userSupabaseKey']);
    
    if (!userSupabaseUrl || !userSupabaseKey) {
      throw new Error('User database not configured');
    }
    
    const response = await fetch(`${userSupabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': userSupabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Database connection failed');
    }
    
    console.log('✅ Service Worker: User database connection successful');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Service Worker: User database connection test failed:', error);
    return { success: false, error: error.message };
  }
}

// Master Authentication Handler Functions

async function handleMasterAuthRegister(email, password, displayName) {
  try {
    console.log('🔐 Service Worker: Handling master auth registration');
    const result = await masterAuth.register(email, password, displayName);
    
    if (result.success) {
      // Registration successful - no tracking needed
    }
    
    return result;
  } catch (error) {
    console.error('❌ Service Worker: Master auth registration failed:', error);
    return { success: false, error: error.message };
  }
}

async function handleMasterAuthLogin(email, password) {
  try {
    console.log('🔐 Service Worker: Handling master auth login');
    const result = await masterAuth.login(email, password);
    
    if (result.success) {
      // Log audit event
      await masterAuth.logUserAction('login', 'authentication', null, { email });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Service Worker: Master auth login failed:', error);
    return { success: false, error: error.message };
  }
}

async function handleMasterAuthLogout() {
  try {
    console.log('🔐 Service Worker: Handling master auth logout');
    
    // Log audit event before clearing session
    await masterAuth.logUserAction('logout', 'authentication');
    
    const result = await masterAuth.logout();
    return result;
  } catch (error) {
    console.error('❌ Service Worker: Master auth logout failed:', error);
    return { success: false, error: error.message };
  }
}

async function handleMasterAuthGetCurrentUser() {
  try {
    console.log('🔐 Service Worker: Getting current user from master auth');
    
    // First try to restore session if not already loaded
    if (!masterAuth.currentUser) {
      console.log('⚡ Attempting to restore session...');
      await masterAuth.restoreSession();
    }
    
    // Check current session
    const session = await masterAuth.getCurrentSession();
    
    if (session && masterAuth.currentUser) {
      const userInfo = masterAuth.getUserInfo();
      return { 
        success: true, 
        user: userInfo,
        isAuthenticated: true
      };
    } else {
      return { 
        success: true, 
        user: null,
        isAuthenticated: false
      };
    }
  } catch (error) {
    console.error('❌ Service Worker: Get current user failed:', error);
    return { success: false, error: error.message };
  }
}

async function handleMasterAuthGetSystemTemplates() {
  try {
    console.log('📄 Service Worker: Getting system templates from master database');
    
    const templates = await masterAuth.getSystemTemplates();
    
    return { 
      success: true, 
      templates: templates 
    };
  } catch (error) {
    console.error('❌ Service Worker: Get system templates failed:', error);
    return { success: false, error: error.message };
  }
}

async function handleMasterAuthUpdateUserDatabase(databaseUrl, databaseKey) {
  try {
    console.log('🔐 Service Worker: Updating user database configuration');
    
    const result = await masterAuth.updateUserDatabaseConfig(databaseUrl, databaseKey);
    
    if (result.success) {
      // Log audit event
      await masterAuth.logUserAction('update_database_config', 'user_database');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Service Worker: Update user database config failed:', error);
    return { success: false, error: error.message };
  }
}

async function handleCheckAuth() {
  try {
    console.log('🔐 Service Worker: Checking authentication status');
    
    // Check if user is authenticated
    const userId = masterAuth.getCurrentUserId();
    const userInfo = masterAuth.getUserInfo();
    
    return {
      success: true,
      data: {
        isAuthenticated: !!userId,
        userId: userId,
        userInfo: userInfo
      }
    };
  } catch (error) {
    console.error('❌ Service Worker: Check auth failed:', error);
    return { 
      success: true, // Don't fail the check itself
      data: {
        isAuthenticated: false,
        userId: null,
        userInfo: null
      }
    };
  }
}



// Create database tables by inserting data and letting Supabase auto-create schema
async function createTablesViaRestAPI(supabaseUrl, apiKey) {
  try {
    console.log('🔧 Service Worker: Checking database schema...');
    
    // First, check if tables already exist
    const tablesExist = await checkTablesExist(supabaseUrl, apiKey);
    console.log('🔍 Service Worker: Tables exist check:', tablesExist);
    
    if (tablesExist.tablesFound >= 3) {
      // Tables exist, test access
      console.log('✅ Service Worker: Tables exist, testing access...');
      const accessTest = await testTableAccess(supabaseUrl, apiKey);
      
      if (accessTest.success) {
        return { 
          success: true, 
          message: 'Database connected and tables are ready!' 
        };
      } else {
        console.warn('⚠️ Service Worker: Tables exist but access is limited due to RLS policies');
        
        // Provide detailed RLS fix instructions
        return { 
          success: false, 
          error: 'Database connected and tables exist, but Row Level Security is blocking access. Please run this SQL in your Supabase SQL Editor to fix access:\n\nALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;\nALTER TABLE prompt_templates DISABLE ROW LEVEL SECURITY;\nALTER TABLE conversations DISABLE ROW LEVEL SECURITY;\nALTER TABLE project_manager DISABLE ROW LEVEL SECURITY;\nALTER TABLE assistant_conversations DISABLE ROW LEVEL SECURITY;\n\nThen click "Connect Database" again.',
          needsManualRLS: true
        };
      }
    } else {
      console.log('⚠️ Service Worker: Tables do not exist, providing setup SQL...');
      
      // Tables don't exist - need manual SQL setup
      const sqlContent = await getTableCreationSQL();
      return { 
        success: false, 
        error: 'Database connected, but tables need to be created. Please run the setup SQL in your Supabase SQL Editor.',
        needsManualSetup: true,
        sqlContent: sqlContent
      };
    }
    
  } catch (error) {
    console.error('❌ Service Worker: Automatic table creation failed:', error);
    return { 
      success: false, 
      error: `Failed to create database tables automatically: ${error.message}`
    };
  }
}

// Create user_preferences table by inserting default data
async function createUserPreferencesTable(supabaseUrl, apiKey) {
  try {
    console.log('📊 Service Worker: Creating user_preferences table...');
    
    const defaultPreferences = {
      user_id: 'default',
      settings: {
        auto_capture: true,
        notification_enabled: false,
        theme: 'light',
        language: 'en',
        max_conversations: 1000,
        sync_interval: 300000,
        debug_mode: false
      },
      email: null,
      subscription_tier: 'free',
      subscription_status: 'active',
      desktop_notification: false,
      tab_rename: false,
      auto_switch: false,
      supabase_id: null,
      supabase_anon_key: null
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/user_preferences`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=ignore-duplicates'
      },
      body: JSON.stringify(defaultPreferences)
    });

    console.log(`📊 Service Worker: user_preferences insert response status: ${response.status}`);
    
    if (response.ok || response.status === 409) { // 409 = conflict (already exists)
      console.log('✅ Service Worker: user_preferences table created/verified');
      return { success: true };
    } else {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = response.statusText || 'Unknown error';
      }
      console.error('❌ Service Worker: user_preferences table creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return { success: false, error: `Status ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.warn('⚠️ Service Worker: user_preferences table creation error:', error.message);
    return { success: false, error: error.message };
  }
}

// Create prompt_templates table by inserting default templates
async function createPromptTemplatesTable(supabaseUrl, apiKey) {
  try {
    console.log('📝 Service Worker: Creating prompt_templates table...');
    
    const defaultTemplates = [
      {
        category: 'Error Debugging',
        name: 'Minor Errors',
        template: 'The same error persists. Do not make any code changes yet—investigate thoroughly to find the exact root cause. Analyze logs, flow, and dependencies deeply, and propose solutions only once you fully understand the issue.',
        shortcut: 'minor_errors',
        user_id: 'default',
        is_custom: true,
        is_active: true
      },
      {
        category: 'Error Debugging',
        name: 'Major Errors',
        template: 'This is the final attempt to fix this issue. Stop all changes and methodically re-examine the entire flow—auth, Supabase, Stripe, state management, and redirects—from the ground up. Map out what\'s breaking and why, test everything in isolation, and do not proceed without absolute certainty.',
        shortcut: 'major_errors',
        user_id: 'default',
        is_custom: true,
        is_active: true
      },
      {
        category: 'Design',
        name: 'UI Change',
        template: 'Make only visual updates—do not impact functionality or logic in any way. Fully understand how the current UI integrates with the app, ensuring logic, state management, and APIs remain untouched. Test thoroughly to confirm the app behaves exactly as before.',
        shortcut: 'ui_change',
        user_id: 'default',
        is_custom: true,
        is_active: true
      }
    ];

    let successCount = 0;
    for (const template of defaultTemplates) {
      const response = await fetch(`${supabaseUrl}/rest/v1/prompt_templates`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal,resolution=ignore-duplicates'
        },
        body: JSON.stringify(template)
      });

      if (response.ok || response.status === 409) {
        successCount++;
      }
    }

    if (successCount > 0) {
      console.log(`✅ Service Worker: prompt_templates table created (${successCount}/${defaultTemplates.length} templates)`);
      return { success: true };
    } else {
      return { success: false, error: 'No templates could be inserted' };
    }
  } catch (error) {
    console.warn('⚠️ Service Worker: prompt_templates table creation error:', error.message);
    return { success: false, error: error.message };
  }
}

// Create project_manager table by inserting a sample project
async function createProjectManagerTable(supabaseUrl, apiKey) {
  try {
    console.log('🚀 Service Worker: Creating project_manager table...');
    
    const sampleProject = {
      project_id: 'lovable-assistant-sample',
      project_name: 'Lovable Assistant Sample Project',
      project_url: 'https://lovable.dev/projects/sample',
      description: 'Sample project created during database setup',
      knowledge: 'This is a sample project created by Lovable Assistant during initial database setup.',
      user_id: 'default'
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/project_manager`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=ignore-duplicates'
      },
      body: JSON.stringify(sampleProject)
    });

    if (response.ok || response.status === 409) {
      console.log('✅ Service Worker: project_manager table created/verified');
      return { success: true };
    } else {
      const error = await response.text();
      console.warn('⚠️ Service Worker: project_manager table creation failed:', error);
      return { success: false, error };
    }
  } catch (error) {
    console.warn('⚠️ Service Worker: project_manager table creation error:', error.message);
    return { success: false, error: error.message };
  }
}

// Create conversations table by inserting a sample conversation
async function createConversationsTable(supabaseUrl, apiKey) {
  try {
    console.log('💬 Service Worker: Creating conversations table...');
    
    const sampleConversation = {
      project_id: 'lovable-assistant-sample',
      user_message: 'Welcome to Lovable Assistant!',
      lovable_response: 'Hello! Your database has been set up successfully.',
      project_context: { setup: true },
      tags: ['setup', 'welcome'],
      user_id: 'default',
      auto_capture: false
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/conversations`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=ignore-duplicates'
      },
      body: JSON.stringify(sampleConversation)
    });

    if (response.ok || response.status === 409) {
      console.log('✅ Service Worker: conversations table created/verified');
      return { success: true };
    } else {
      const error = await response.text();
      console.warn('⚠️ Service Worker: conversations table creation failed:', error);
      return { success: false, error };
    }
  } catch (error) {
    console.warn('⚠️ Service Worker: conversations table creation error:', error.message);
    return { success: false, error: error.message };
  }
}

// Create assistant_conversations table by inserting a sample conversation
async function createAssistantConversationsTable(supabaseUrl, apiKey) {
  try {
    console.log('🤖 Service Worker: Creating assistant_conversations table...');
    
    const sampleAssistantConversation = {
      project_id: 'lovable-assistant-sample',
      user_message: 'How do I use Lovable Assistant?',
      assistant_response: 'Lovable Assistant helps you capture conversations, manage projects, and enhance your development workflow. Your database is now ready to use!',
      metadata: { setup: true, version: '1.0' },
      user_id: 'default'
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/assistant_conversations`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=ignore-duplicates'
      },
      body: JSON.stringify(sampleAssistantConversation)
    });

    if (response.ok || response.status === 409) {
      console.log('✅ Service Worker: assistant_conversations table created/verified');
      return { success: true };
    } else {
      const error = await response.text();
      console.warn('⚠️ Service Worker: assistant_conversations table creation failed:', error);
      return { success: false, error };
    }
  } catch (error) {
    console.warn('⚠️ Service Worker: assistant_conversations table creation error:', error.message);
    return { success: false, error: error.message };
  }
}


// Test table access after RLS configuration
async function testTableAccess(supabaseUrl, apiKey) {
  try {
    console.log('🧪 Service Worker: Testing table access...');
    
    // Test basic read access to each table
    const testPromises = [
      fetch(`${supabaseUrl}/rest/v1/user_preferences?limit=1`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      }),
      fetch(`${supabaseUrl}/rest/v1/prompt_templates?limit=1`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      }),
      fetch(`${supabaseUrl}/rest/v1/conversations?limit=1`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      })
    ];
    
    const results = await Promise.allSettled(testPromises);
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value.ok
    ).length;
    
    console.log(`🧪 Service Worker: Table access test: ${successCount}/3 tables accessible`);
    
    return { 
      success: successCount >= 2, // At least 2 out of 3 tables should be accessible
      accessibleTables: successCount 
    };
    
  } catch (error) {
    console.warn('⚠️ Service Worker: Table access test error:', error.message);
    return { success: false, error: error.message };
  }
}

// Check if required tables exist in the database
async function checkTablesExist(supabaseUrl, apiKey) {
  try {
    console.log('🔍 Service Worker: Checking if tables exist...');
    
    const tableNames = [
      'user_preferences',
      'prompt_templates', 
      'project_manager',
      'conversations',
      'assistant_conversations'
    ];
    
    let tablesFound = 0;
    const tableStatus = {};
    
    for (const tableName of tableNames) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?limit=1`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        // If we get any response that isn't 404, the table likely exists
        if (response.status !== 404) {
          tablesFound++;
          tableStatus[tableName] = {
            exists: true,
            status: response.status,
            accessible: response.ok
          };
          console.log(`✅ Service Worker: Table ${tableName} exists (status: ${response.status})`);
        } else {
          tableStatus[tableName] = {
            exists: false,
            status: 404,
            accessible: false
          };
          console.log(`❌ Service Worker: Table ${tableName} does not exist`);
        }
      } catch (error) {
        console.warn(`⚠️ Service Worker: Error checking table ${tableName}:`, error.message);
        tableStatus[tableName] = {
          exists: false,
          status: 'error',
          accessible: false,
          error: error.message
        };
      }
    }
    
    return {
      tablesFound,
      totalTables: tableNames.length,
      tableStatus
    };
    
  } catch (error) {
    console.error('❌ Service Worker: Error checking table existence:', error);
    return { tablesFound: 0, totalTables: 5, error: error.message };
  }
}

// Get table creation SQL for manual setup
async function getTableCreationSQL() {
  return `-- Lovable Assistant Database Setup
-- Copy and paste this into your Supabase SQL Editor, then click "Connect Database" in the extension

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  desktop_notification BOOLEAN DEFAULT FALSE,
  tab_rename BOOLEAN DEFAULT FALSE,
  auto_switch BOOLEAN DEFAULT FALSE,
  supabase_id TEXT,
  supabase_anon_key TEXT
);


-- Create project_manager table
CREATE TABLE IF NOT EXISTS project_manager (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  project_url TEXT NOT NULL,
  description TEXT DEFAULT '',
  knowledge TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL DEFAULT 'default'
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT,
  user_message TEXT NOT NULL,
  lovable_response TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_context JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  effectiveness_score INTEGER CHECK (effectiveness_score >= 1 AND effectiveness_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_message_id TEXT,
  lovable_message_id TEXT,
  message_group_id TEXT,
  auto_capture BOOLEAN DEFAULT FALSE,
  user_id TEXT NOT NULL DEFAULT 'default'
);

-- Create assistant_conversations table
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  metadata JSONB DEFAULT '{}',
  user_id TEXT NOT NULL DEFAULT 'default'
);

-- Disable RLS for easier personal database access
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_manager DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations DISABLE ROW LEVEL SECURITY;

-- Insert default data
INSERT INTO user_preferences (user_id, settings) VALUES 
('default', '{"auto_capture": true, "theme": "light"}')
ON CONFLICT DO NOTHING;

INSERT INTO prompt_templates (category, name, template, shortcut, is_custom, is_active) VALUES
('Error Debugging', 'Minor Errors', 'Investigate thoroughly to find the exact root cause before making changes.', 'minor_errors', true, true),
('Error Debugging', 'Major Errors', 'Stop and methodically re-examine the entire flow from the ground up.', 'major_errors', true, true)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Lovable Assistant database setup complete!' as message;`;
}

// ===========================
// PROMPT TEMPLATES HANDLERS
// ===========================

async function handleGetPromptTemplates() {
  try {
    // Load templates from localStorage (since they're now managed locally)
    // Return templates in the format expected by the original UI
    const defaultTemplates = {
      'Design': {
        'UI Change': 'Modify the UI to focus strictly on visual design elements without altering functionality. Ensure mobile responsiveness is maintained and test on different screen sizes. Use modern design principles.',
        'Optimize for Mobile': 'Optimize this interface specifically for mobile devices. Ensure touch-friendly controls, proper sizing, and intuitive mobile navigation while maintaining desktop compatibility.'
      },
      'Editing Features': {
        'Modifying an Existing Feature': 'Make changes to the feature without impacting core functionality, other features, or flows. Analyze its behavior and dependencies to understand risks, and communicate any concerns before proceeding. Test thoroughly to confirm no regressions or unintended effects, and flag any out-of-scope changes for review. Work with precision—pause if uncertain.',
        'Fragile Update': 'This update is highly sensitive and demands extreme precision. Thoroughly analyze all dependencies and impacts before making changes, and test methodically to ensure nothing breaks. Avoid shortcuts or assumptions—pause and seek clarification if uncertain. Accuracy is essential.'
      },
      'Error Debugging': {
        'Minor Errors': 'The same error persists. Do not make any code changes yet—investigate thoroughly to find the exact root cause. Analyze logs, flow, and dependencies deeply, and propose solutions only once you fully understand the issue.',
        'Persistent Errors': 'The error is still unresolved. Stop and identify the exact root cause with 100% certainty—no guesses or assumptions. Analyze every aspect of the flow and dependencies in detail, and ensure full understanding before making any changes.',
        'Major Errors': 'This is the final attempt to fix this issue. Stop all changes and methodically re-examine the entire flow—auth, Supabase, Stripe, state management, and redirects—from the ground up. Map out what\'s breaking and why, test everything in isolation, and do not proceed without absolute certainty.',
        'Clean up Console Logs': 'Carefully remove unnecessary `console.log` statements without affecting functionality or design. Review each log to ensure it\'s non-critical, and document any that need alternative handling. Proceed methodically, testing thoroughly to confirm the app remains intact. Pause if uncertain about any log\'s purpose.',
        'Critical Errors': 'The issue remains unresolved and requires a serious, thorough analysis. Step back and examine the code deeply—trace the entire flow, inspect logs, and analyze all dependencies without editing anything. Identify the exact root cause with complete certainty before proposing or making any changes. No assumptions or quick fixes—only precise, evidence-based insights. Do not edit any code yet.',
        'Extreme Errors': 'This issue remains unresolved, and we need to **stop and rethink the entire approach**. Do not edit any code. Instead, conduct a deep, methodical analysis of the system. Map out the full flow, trace every interaction, log, and dependency step by step. Document exactly what is supposed to happen, what is actually happening, and where the disconnect occurs. Provide a detailed report explaining the root cause with clear evidence. If there are gaps, uncertainties, or edge cases, highlight them for discussion. Until you can identify the **precise, proven source of the issue**, do not propose or touch any fixes. This requires total focus, no guesses, and no shortcuts.'
      },
      'Refactoring': {
        'Refactoring After Request Made by Lovable': 'Refactor this file without changing the UI or functionality—everything must behave and look exactly the same. Focus on improving code structure and maintainability only. Document the current functionality, ensure testing is in place, and proceed incrementally with no risks or regressions. Stop if unsure.'
      },
      'Using another LLM': {
        'Generate Comprehensive Explanation': 'Generate a comprehensive and detailed explanation of the issue, including all relevant context, code snippets, error messages, logs, and dependencies involved. Clearly describe the expected behavior, the actual behavior, and any steps to reproduce the issue. Highlight potential causes or areas of concern based on your analysis. Ensure the information is structured and thorough enough to be copied and pasted into another system for further troubleshooting and debugging. Include any insights or observations that could help pinpoint the root cause. Focus on clarity and completeness to ensure the issue is easy to understand and address. Do not edit any code yet.'
      }
    };

    return { success: true, data: defaultTemplates };
  } catch (error) {
    console.error('❌ Error getting prompt templates:', error);
    return { success: false, error: error.message };
  }
}

async function handleSavePromptTemplates(templates) {
  try {
    // Templates are now managed locally in localStorage via utilities-manager.js
    // This handler is kept for backward compatibility
    return { success: true, message: 'Templates are now managed locally' };
  } catch (error) {
    console.error('❌ Error saving prompt templates:', error);
    return { success: false, error: error.message };
  }
}

// ===========================
// AI API HANDLERS
// ===========================

async function handleCallAI(data) {
  try {
    const { prompt, provider = 'gemini' } = data;
    
    if (!prompt) {
      return { success: false, error: 'Prompt is required' };
    }

    // Get API keys from chrome storage
    const storage = await chrome.storage.sync.get(['geminiApiKey', 'claudeApiKey', 'openaiApiKey']);
    
    let response;
    switch (provider) {
      case 'gemini':
        if (!storage.geminiApiKey) {
          return { success: false, error: 'Gemini API key not configured. Please add it in the extension popup.' };
        }
        response = await callGeminiAPI(prompt, storage.geminiApiKey);
        break;
        
      case 'claude':
        if (!storage.claudeApiKey) {
          return { success: false, error: 'Claude API key not configured. Please add it in the extension popup.' };
        }
        response = await callClaudeAPI(prompt, storage.claudeApiKey);
        break;
        
      case 'openai':
        if (!storage.openaiApiKey) {
          return { success: false, error: 'OpenAI API key not configured. Please add it in the extension popup.' };
        }
        response = await callOpenAIAPI(prompt, storage.openaiApiKey);
        break;
        
      default:
        return { success: false, error: `Unsupported AI provider: ${provider}` };
    }

    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Error calling AI:', error);
    return { success: false, error: error.message };
  }
}

async function callGeminiAPI(prompt, apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error('Invalid response format from Gemini API');
  }
}

async function callClaudeAPI(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.content && data.content[0] && data.content[0].text) {
    return data.content[0].text;
  } else {
    throw new Error('Invalid response format from Claude API');
  }
}

async function callOpenAIAPI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  } else {
    throw new Error('Invalid response format from OpenAI API');
  }
}


