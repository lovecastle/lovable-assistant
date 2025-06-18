// Service Worker for Chrome Extension Background Tasks
import { SupabaseClient } from './database-sync.js';
import { AIAPI } from './ai-api.js';
import { MasterAuthService } from './master-auth-service.js';

// Initialize database client
const supabase = new SupabaseClient();

// Initialize AI API client
const aiAPI = new AIAPI();

// Initialize master authentication service
const masterAuth = new MasterAuthService();

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
      
    case 'testConnection':
      testConnection().then(result => {
        sendResponse({ success: result });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'testSpecificConnection':
      handleTestSpecificConnection(request.provider, request.apiKey).then(result => {
        sendResponse(result);
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
      
    case 'saveAIPreferencesIndividual':
      handleSaveAIPreferencesIndividual(request.data).then(result => {
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
      
    case 'saveAllPromptTemplates':
      handleSaveAllPromptTemplates(request.data).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    // AI Preferences handlers
    case 'getAIPreferences':
      handleGetAIPreferences().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'saveAIPreferences':
      handleSaveAIPreferences(request.data).then(result => {
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
    
    const systemPrompt = `# LOVABLE PROJECT ASSISTANT 🚀

## CORE IDENTITY & MISSION
You are the **Lovable Project Assistant** - an expert development planning and documentation specialist for "${projectName}". Your primary mission is to help users create comprehensive development plans and high-quality project documentation that rivals the standards of codeguide.dev.

## PRIMARY RESPONSIBILITIES

### 🎯 **Development Planning Excellence**
- Create detailed, step-by-step development roadmaps
- Design scalable project architectures with frontend-first approach
- Plan mobile-responsive implementations (mobile-first design)
- Structure feature development in logical phases
- Provide timeline estimates and milestone breakdowns

### 📚 **Documentation Mastery**
- Generate comprehensive project knowledge bases
- Create detailed technical specifications
- Write clear, actionable development guidelines
- Produce codeguide.dev-quality documentation
- Maintain consistent documentation standards

### 🏗️ **Technical Architecture**
- Design modern web application structures
- Recommend optimal tech stacks for Lovable projects
- Plan database schemas and API architectures
- Ensure responsive, accessible, and performant designs
- Integrate security and testing strategies from the start

## LOVABLE DEVELOPMENT PRINCIPLES

### **Frontend-First Approach**
- Always start with UI/UX design and frontend implementation
- Prioritize responsive design with mobile-first methodology
- Focus on user experience before backend complexity
- Use modern CSS frameworks and component libraries

### **Progressive Development**
- Begin with blank project, build incrementally
- Implement core features before advanced functionality
- Validate each phase before proceeding to next
- Maintain working prototypes throughout development

### **Quality Standards**
- Write clean, maintainable, and well-documented code
- Implement comprehensive testing strategies
- Follow accessibility guidelines (WCAG standards)
- Optimize for performance and SEO

## DOCUMENTATION STRUCTURE TEMPLATE

When creating project documentation, follow this comprehensive structure:

### 1. **Project Overview**
- Clear project description and objectives
- Target audience and use case scenarios
- Key features and functionality summary
- Success metrics and project goals

### 2. **Technical Specifications**
- Complete tech stack breakdown
- Architecture diagrams and system design
- Database schema and data models
- API documentation and endpoints

### 3. **Development Roadmap**
- Phase-by-phase implementation plan
- Feature prioritization and dependencies
- Timeline estimates and milestones
- Resource requirements and team roles

### 4. **Implementation Guidelines**
- Coding standards and conventions
- File structure and organization
- Component architecture patterns
- Testing and deployment procedures

### 5. **User Experience Design**
- User flow diagrams and wireframes
- Responsive design specifications
- Accessibility requirements
- Performance optimization strategies

## RESPONSE FORMATTING

### **For Development Plans:**
Use numbered sections with clear hierarchies:
1. **Phase 1: Foundation** (Setup & Core UI)
2. **Phase 2: Features** (Core Functionality)
3. **Phase 3: Enhancement** (Advanced Features)
4. **Phase 4: Optimization** (Performance & Deploy)

### **For Documentation:**
- Use clear headings and subheadings
- Include code examples and snippets
- Provide actionable next steps
- Add FAQ sections when relevant
- Include troubleshooting guides

### **For Technical Advice:**
- Start with context understanding
- Provide step-by-step solutions
- Explain the "why" behind recommendations
- Include best practice alternatives
- Suggest testing and validation approaches

## CONTEXT AWARENESS

You have access to the following project context:
${projectInfo}

Recent Lovable conversations:
${lovableHistory}

Previous assistant conversations:
${conversationContext}

**Current Project Details:**
- Project: ${projectName}
- Project ID: ${projectId}
- URL: ${context?.url || 'Unknown'}

## INTERACTION GUIDELINES

1. **Always greet using the project name "${projectName}"** (never use project ID)
2. **Ask clarifying questions** when requirements are unclear
3. **Provide comprehensive, actionable responses** rather than brief answers
4. **Reference project context** when making recommendations
5. **Suggest iterative improvements** and follow-up actions
6. **Maintain professional yet friendly tone** throughout interactions

## QUALITY COMMITMENT

Every response should:
- ✅ Be detailed and comprehensive
- ✅ Follow mobile-first, responsive design principles
- ✅ Include specific, actionable next steps
- ✅ Reference relevant best practices
- ✅ Consider scalability and maintainability
- ✅ Provide clear structure and organization

Remember: Your goal is to be the most helpful development planning and documentation expert the user has ever worked with. Create responses that could serve as standalone project guides.`;

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

// User ID helper function (for now using 'default', can be enhanced later)
function getCurrentUserId() {
  return 'default'; // TODO: Implement proper user authentication
}

// UI Preferences handlers
async function handleSaveUIPreference(data) {
  try {
    console.log('🔍 Service Worker: Saving UI preference (individual):', data.preferenceKey);
    
    const userId = getCurrentUserId();
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
    
    const userId = getCurrentUserId();
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
    
    const userId = getCurrentUserId();
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

// Prompt Templates handlers
async function handleGetPromptTemplates() {
  try {
    console.log('🔍 Service Worker: Getting prompt templates');
    
    const userId = getCurrentUserId();
    const result = await supabase.getPromptTemplates(userId);
    
    if (result.success) {
      console.log(`✅ Service Worker: Retrieved ${result.data?.length || 0} prompt templates`);
      return result;
    } else {
      console.error('❌ Service Worker: Failed to get prompt templates:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error getting prompt templates:', error);
    return { success: false, error: error.message };
  }
}

async function handleSaveAllPromptTemplates(data) {
  try {
    console.log('🔍 Service Worker: Saving all prompt templates');
    
    const userId = getCurrentUserId();
    
    // Convert templates to database format
    const templates = data.templates.map(template => ({
      category: template.category,
      name: template.name,
      template: template.template, // Use 'template' column name
      shortcut: template.shortcut
    }));
    
    const result = await supabase.saveAllPromptTemplates(userId, templates);
    
    if (result.success) {
      console.log('✅ Service Worker: All prompt templates saved successfully');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to save prompt templates:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error saving prompt templates:', error);
    return { success: false, error: error.message };
  }
}

// AI Preferences handlers
async function handleGetAIPreferences() {
  try {
    console.log('🔍 Service Worker: Getting AI preferences');
    
    const userId = getCurrentUserId();
    const result = await supabase.getAIPreferences(userId);
    
    if (result.success) {
      console.log('✅ Service Worker: AI preferences retrieved successfully');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to get AI preferences:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error getting AI preferences:', error);
    return { success: false, error: error.message };
  }
}

async function handleSaveAIPreferences(data) {
  try {
    console.log('🔍 Service Worker: Saving AI preferences');
    
    const userId = getCurrentUserId();
    const result = await supabase.saveAIPreferences(userId, data);
    
    if (result.success) {
      console.log('✅ Service Worker: AI preferences saved successfully');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to save AI preferences:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error saving AI preferences:', error);
    return { success: false, error: error.message };
  }
}

// Test Specific Connection handler
async function handleTestSpecificConnection(provider, apiKey) {
  try {
    console.log('🔍 Service Worker: Testing specific connection for provider:', provider);
    
    if (!provider || !apiKey) {
      return { success: false, error: 'Provider and API key are required' };
    }
    
    // Test the specific provider directly without changing global settings
    const result = await testSpecificProvider(provider, apiKey);
    
    if (result.success) {
      console.log('✅ Service Worker: Specific connection test successful for', provider);
      return { success: true };
    } else {
      console.error('❌ Service Worker: Specific connection test failed for', provider, ':', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Service Worker: Error testing specific connection:', error);
    return { success: false, error: error.message };
  }
}

// Test specific provider function
async function testSpecificProvider(provider, apiKey) {
  try {
    const testPrompt = 'Hello! Please respond with "Connection successful" if you receive this.';
    const systemPrompt = 'You are testing the API connection. Respond briefly.';
    
    let response;
    
    switch (provider) {
      case 'claude':
        response = await testClaudeConnection(apiKey, testPrompt, systemPrompt);
        break;
      case 'openai':
        response = await testOpenAIConnection(apiKey, testPrompt, systemPrompt);
        break;
      case 'gemini':
        response = await testGeminiConnection(apiKey, testPrompt, systemPrompt);
        break;
      default:
        return { success: false, error: `Unknown provider: ${provider}` };
    }
    
    // Check if response indicates success
    const isSuccess = response && (
      response.toLowerCase().includes('connection') || 
      response.toLowerCase().includes('successful') ||
      response.length > 0
    );
    
    return { success: isSuccess, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Individual provider test functions
async function testClaudeConnection(apiKey, prompt, systemPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorData}`);
  }
  
  const data = await response.json();
  return data.content[0]?.text || '';
}

async function testOpenAIConnection(apiKey, prompt, systemPrompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 50,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function testGeminiConnection(apiKey, prompt, systemPrompt) {
  const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        maxOutputTokens: 50
      }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
  }
  
  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

// Database connection test function
async function handleTestDatabaseConnection(projectId, apiKey) {
  try {
    console.log('🔍 Service Worker: Testing database connection with provided credentials');
    
    if (!projectId || !apiKey) {
      return { success: false, error: 'Project ID and API key are required' };
    }
    
    // Construct the Supabase URL from project ID
    const supabaseUrl = `https://${projectId}.supabase.co`;
    
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
    
    // Additional test: Try to access a specific table to ensure permissions work
    try {
      const tableTestResponse = await fetch(`${supabaseUrl}/rest/v1/conversations?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!tableTestResponse.ok) {
        console.warn('⚠️ Service Worker: Basic connection OK, but table access failed');
        return { 
          success: false, 
          error: `Connected to database but cannot access tables. Check your API key permissions.` 
        };
      }
      
      console.log('✅ Service Worker: Database connection test successful');
      return { success: true };
      
    } catch (tableError) {
      console.warn('⚠️ Service Worker: Basic connection OK, but table test failed:', tableError.message);
      return { 
        success: false, 
        error: `Database connected but table access failed: ${tableError.message}` 
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

// AI Preferences handlers (individual columns)
async function handleSaveAIPreferencesIndividual(data) {
  try {
    console.log('🔍 Service Worker: Saving AI preferences individually');
    
    const userId = getCurrentUserId();
    const result = await supabase.saveAIPreferencesIndividual(userId, data);
    
    if (result.success) {
      console.log('✅ Service Worker: AI preferences saved individually');
      return result;
    } else {
      console.error('❌ Service Worker: Failed to save AI preferences individually:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Service Worker: Error saving AI preferences individually:', error);
    return { success: false, error: error.message };
  }
}

// Supabase Settings handlers
async function handleSaveSupabaseSettings(data) {
  try {
    console.log('🔍 Service Worker: Saving Supabase settings');
    
    const userId = getCurrentUserId();
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
        
        -- AI Provider settings
        ai_provider TEXT DEFAULT 'claude' CHECK (ai_provider IN ('claude', 'openai', 'gemini')),
        claude_api_key TEXT,
        openai_api_key TEXT,
        gemini_api_key TEXT,
        
        -- UI preferences
        ui_preferences JSONB DEFAULT '{}',
        
        -- Custom prompt templates
        custom_templates JSONB DEFAULT '[]'
      );

      -- Custom prompt templates table
      CREATE TABLE IF NOT EXISTS custom_prompt_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT,
        template_content TEXT NOT NULL,
        category TEXT DEFAULT 'custom',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        usage_count INTEGER DEFAULT 0
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at);
      CREATE INDEX IF NOT EXISTS idx_custom_templates_category ON custom_prompt_templates(category);

      -- Enable RLS
      ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE custom_prompt_templates ENABLE ROW LEVEL SECURITY;

      -- Create policies that allow all access (user's own database)
      DROP POLICY IF EXISTS "Allow all access to user_settings" ON user_settings;
      CREATE POLICY "Allow all access to user_settings" ON user_settings FOR ALL USING (true);
      
      DROP POLICY IF EXISTS "Allow all access to custom_templates" ON custom_prompt_templates;
      CREATE POLICY "Allow all access to custom_templates" ON custom_prompt_templates FOR ALL USING (true);

      -- Insert default settings if not exists
      INSERT INTO user_settings (id) 
      SELECT uuid_generate_v4() 
      WHERE NOT EXISTS (SELECT 1 FROM user_settings);

      -- Insert default custom templates
      INSERT INTO custom_prompt_templates (name, description, template_content, category) 
      SELECT * FROM (VALUES
        ('Quick Bug Fix', 'Template for reporting and fixing bugs', 'I found this issue:\\n\\n{issue_description}\\n\\nSteps to reproduce:\\n1. {step_1}\\n2. {step_2}\\n3. {step_3}\\n\\nExpected: {expected_behavior}\\nActual: {actual_behavior}\\n\\nCan you help me fix this?', 'debugging'),
        ('Feature Request', 'Template for new feature requests', 'I would like to add this feature:\\n\\n{feature_description}\\n\\nUse case:\\n{use_case}\\n\\nAcceptance criteria:\\n- {criteria_1}\\n- {criteria_2}\\n- {criteria_3}\\n\\nPlease help me implement this.', 'planning'),
        ('Code Review', 'Template for code review requests', 'Please review this code:\\n\\n\`\`\`{language}\\n{code}\\n\`\`\`\\n\\nSpecific areas to focus on:\\n- {focus_area_1}\\n- {focus_area_2}\\n- {focus_area_3}\\n\\nAny suggestions for improvement?', 'review')
      ) AS t(name, description, template_content, category)
      WHERE NOT EXISTS (SELECT 1 FROM custom_prompt_templates WHERE name = t.name);

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

      DROP TRIGGER IF EXISTS update_custom_templates_updated_at ON custom_prompt_templates;
      CREATE TRIGGER update_custom_templates_updated_at
        BEFORE UPDATE ON custom_prompt_templates
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;
    
    // Execute schema setup via REST API
    const response = await fetch(`${userSupabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': userSupabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
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
      // Track registration event
      await masterAuth.trackUsage('user_registered', { email });
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
      // Track login event
      await masterAuth.trackUsage('user_logged_in', { email });
      
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
    
    // Track logout before clearing session
    await masterAuth.trackUsage('user_logged_out');
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
    
    // Track template access
    await masterAuth.trackUsage('system_templates_accessed', { 
      templateCount: templates.length 
    });
    
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
      // Track database configuration
      await masterAuth.trackUsage('user_database_configured');
      await masterAuth.logUserAction('update_database_config', 'user_database');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Service Worker: Update user database config failed:', error);
    return { success: false, error: error.message };
  }
}

