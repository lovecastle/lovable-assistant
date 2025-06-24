// Supabase Database Integration
export class SupabaseClient {
  constructor() {
    this.baseURL = null;
    this.apiKey = null;
    this.initialized = false;
    this.sessionToken = null;
  }

  async init() {
    if (this.initialized) return;
    
    // Use master database configuration
    this.baseURL = 'https://dwbrjztmskvzpyufwxnt.supabase.co';
    this.apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3YnJqenRtc2t2enB5dWZ3eG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTkyNTAsImV4cCI6MjA2MzU5NTI1MH0.t5qo1CEePXCxfdFRaVABMqR0TOX9DHIbHXb7Z8zFq1Q';
    this.initialized = true;
  }

  // Set session token for authenticated requests
  setSessionToken(token) {
    this.sessionToken = token;
  }

  async request(endpoint, options = {}) {
    await this.init();
    
    const url = `${this.baseURL}/rest/v1/${endpoint}`;
    console.log(`🔍 Database request: ${options.method || 'GET'} ${url}`);
    
    // Use session token if available for authenticated requests, otherwise use API key
    const authToken = this.sessionToken || this.apiKey;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'apikey': this.apiKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers
      }
    });

    console.log(`🔍 Database response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle unique constraint violations (409 with 23505 code) specially
      if (response.status === 409 && errorText.includes('"code":"23505"')) {
        console.log(`🔄 Database-sync: Unique constraint violation detected (expected behavior)`);
        return { 
          constraintViolation: true, 
          status: 409, 
          error: errorText,
          message: 'Duplicate key value violates unique constraint'
        };
      }
      
      // For other errors, log and throw as before
      console.error(`❌ Database request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Supabase request failed: ${errorText}`);
    }

    // Handle JSON parsing with better error handling
    let responseText;
    try {
      responseText = await response.text();
      
      // Handle empty response
      if (!responseText || responseText.trim() === '') {
        console.log(`ℹ️ Database returned empty response for ${options.method || 'GET'} ${endpoint}`);
        return null;
      }
      
      // Handle non-JSON responses (like HTML error pages)
      if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
        console.error(`❌ Response is not JSON. Response text:`, responseText.substring(0, 500));
        throw new Error(`API returned non-JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      const result = JSON.parse(responseText);
      console.log(`✅ Database response data:`, result);
      return result;
    } catch (jsonError) {
      console.error(`❌ Failed to parse JSON response:`, jsonError);
      console.error(`❌ Response text (first 500 chars):`, responseText?.substring(0, 500));
      console.error(`❌ Response length:`, responseText?.length);
      console.error(`❌ Request details:`, { 
        method: options.method || 'GET', 
        endpoint,
        status: response.status,
        statusText: response.statusText
      });
      
      throw new Error(`Failed to parse JSON response: ${jsonError.message}. Response length: ${responseText?.length || 0}`);
    }
  }
  // Original method for backward compatibility
  async saveConversation(data) {
    // Default to 'default' user for backward compatibility
    return this.saveConversationWithUser(data, 'default');
  }

  // New method with user ID
  async saveConversationWithUser(data, userId) {
    console.log('🔍 Database-sync: Saving conversation:', data.id, 'for user:', userId);
    
    // Enhanced duplicate checking based on lovable_message_id
    const lovableMessageId = data.projectContext?.lovableId || data.lovable_message_id;
    if (lovableMessageId) {
      try {
        console.log('🔍 Database-sync: Checking for duplicate lovable_message_id:', lovableMessageId);
        
        // Check both new column and old JSON method for comprehensive duplicate detection
        let existingCheck = [];
        
        try {
          // Try new column method first
          const newColumnCheck = await this.request(`conversations?project_id=eq.${data.projectId}&lovable_message_id=eq.${lovableMessageId}&select=id,auto_capture,timestamp`);
          existingCheck = [...(newColumnCheck || [])];
          console.log('🔍 Database-sync: New column check result:', newColumnCheck?.length || 0, 'matches');
        } catch (error) {
          if (error.message.includes('lovable_message_id') && error.message.includes('does not exist')) {
            console.log('🔄 Database-sync: New column not found, skipping new column check');
          } else {
            console.warn('⚠️ Database-sync: Error in new column check:', error.message);
          }
        }
        
        try {
          // Also check old JSON method to catch any existing duplicates
          const jsonCheck = await this.request(`conversations?project_id=eq.${data.projectId}&project_context->>lovableId=eq.${lovableMessageId}&select=id,auto_capture,timestamp`);
          if (jsonCheck && jsonCheck.length > 0) {
            console.log('🔍 Database-sync: JSON method check result:', jsonCheck.length, 'matches');
            // Merge results and deduplicate by ID
            const existingIds = new Set(existingCheck.map(item => item.id));
            jsonCheck.forEach(item => {
              if (!existingIds.has(item.id)) {
                existingCheck.push(item);
              }
            });
          }
        } catch (error) {
          console.warn('⚠️ Database-sync: Error in JSON method check:', error.message);
        }
        
        // If any duplicates found, log details and skip save
        if (existingCheck && existingCheck.length > 0) {
          console.log(`⚠️ Database-sync: Found ${existingCheck.length} duplicate(s) for lovable_message_id ${lovableMessageId}:`);
          existingCheck.forEach((dup, index) => {
            console.log(`   Duplicate ${index + 1}: ID=${dup.id}, auto_capture=${dup.auto_capture}, timestamp=${dup.timestamp}`);
          });
          
          return { 
            success: true, 
            skipped: true, 
            reason: `Duplicate lovable_message_id (${existingCheck.length} existing)`,
            existingIds: existingCheck.map(item => item.id),
            duplicateDetails: existingCheck
          };
        }
        
        console.log('✅ Database-sync: No duplicates found, proceeding with save');
      } catch (error) {
        console.error('❌ Database-sync: Error checking for duplicates:', error);
        // For safety, proceed with save even if duplicate check fails
        console.log('🔄 Database-sync: Continuing with save despite duplicate check error');
      }
    } else {
      console.log('🔍 Database-sync: No lovable_message_id found, proceeding with save');
    }
    
    // Prepare conversation object - try new schema first, fallback to old schema
    const conversation = {
      id: data.id || this.generateUUID(),
      project_id: data.projectId,
      user_message: data.userMessage,
      lovable_response: data.lovableResponse,
      timestamp: data.timestamp || new Date().toISOString(),
      tags: data.categories || [], // Map categories to tags field in database
      effectiveness_score: null, // Always null as requested
      user_id: userId // Add user ID
    };

    // Try to add new columns if they exist, otherwise use old project_context method
    try {
      // Test if new columns exist by making a small query
      await this.request('conversations?limit=1&select=auto_capture');
      
      // New schema exists - use dedicated columns
      conversation.user_message_id = data.projectContext?.userId || data.user_message_id || null;
      conversation.lovable_message_id = data.projectContext?.lovableId || data.lovable_message_id || null;
      conversation.message_group_id = data.projectContext?.messageGroupId || data.message_group_id || null;
      conversation.auto_capture = data.projectContext?.autoCapture || data.auto_capture || false;
      
      // Keep minimal project_context for additional metadata only
      conversation.project_context = {
        url: data.projectContext?.url || null,
        scrapedAt: data.projectContext?.scrapedAt || null,
        // Remove the fields we've moved to dedicated columns
        ...Object.fromEntries(
          Object.entries(data.projectContext || {}).filter(
            ([key]) => !['userId', 'lovableId', 'messageGroupId', 'autoCapture'].includes(key)
          )
        )
      };
      
      console.log('✅ Database-sync: Using new schema with dedicated columns');
      
    } catch (error) {
      if (error.message.includes('auto_capture') || error.message.includes('PGRST204')) {
        // New columns don't exist - use old schema with full project_context
        conversation.project_context = data.projectContext || {};
        console.log('🔄 Database-sync: New columns not found, using legacy project_context method');
      } else {
        // Other error - still try old method as fallback
        conversation.project_context = data.projectContext || {};
        console.warn('⚠️ Database-sync: Error checking schema, using legacy method:', error.message);
      }
    }

    console.log('🔍 Database-sync: Prepared conversation data:', {
      id: conversation.id,
      project_id: conversation.project_id,
      user_message_length: conversation.user_message?.length || 0,
      lovable_response_length: conversation.lovable_response?.length || 0,
      timestamp: conversation.timestamp,
      schema_type: conversation.user_message_id ? 'new' : 'legacy',
      categories_count: conversation.tags?.length || 0
    });

    try {
      const result = await this.request('conversations', {
        method: 'POST',
        body: JSON.stringify(conversation)
      });
      
      // Check if result indicates a constraint violation
      if (result.constraintViolation) {
        console.log(`🔄 Database-sync: Conversation already exists (constraint violation), skipping: ${conversation.id}`);
        return { 
          success: true, 
          skipped: true, 
          reason: 'Unique constraint violation - conversation already exists',
          lovableMessageId: conversation.lovable_message_id || conversation.project_context?.lovableId
        };
      }
      
      console.log('✅ Database-sync: Conversation saved successfully:', result);
      return { success: true, data: result };
    } catch (error) {
      // Handle any unexpected errors that weren't caught by the constraint violation check
      console.error('❌ Database-sync: Failed to save conversation:', error);
      return { 
        success: false, 
        error: error.message,
        conversationId: conversation.id
      };
    }
  }

  async saveProject(projectData) {
    const project = {
      id: projectData.id,
      name: projectData.name,
      tech_stack: projectData.techStack || {},
      current_state: projectData.currentState || {},
      last_updated: new Date().toISOString()
    };

    return await this.request('projects', {
      method: 'POST',
      body: JSON.stringify(project),
      headers: {
        'Prefer': 'resolution=merge-duplicates'
      }
    });
  }

  // Project Manager CRUD operations
  async saveProjectManager(projectManagerData) {
    // Default to 'default' user for backward compatibility
    return this.saveProjectManagerWithUser(projectManagerData, 'default');
  }

  async saveProjectManagerWithUser(projectManagerData, userId) {
    console.log('🔍 Database-sync: Saving project manager:', projectManagerData.project_id, 'for user:', userId);
    
    const projectManager = {
      project_id: projectManagerData.project_id,
      project_name: projectManagerData.project_name,
      project_url: projectManagerData.project_url,
      description: projectManagerData.description || '',
      knowledge: projectManagerData.knowledge || '',
      updated_at: new Date().toISOString(),
      user_id: userId
    };

    try {
      const result = await this.request('project_manager', {
        method: 'POST',
        body: JSON.stringify(projectManager),
        headers: {
          'Prefer': 'resolution=merge-duplicates'
        }
      });

      console.log('✅ Database-sync: Project manager saved successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to save project manager:', error);
      return { success: false, error: error.message };
    }
  }

  async getProjectManager(projectId) {
    // Default to 'default' user for backward compatibility
    return this.getProjectManagerWithUser(projectId, 'default');
  }

  async getProjectManagerWithUser(projectId, userId) {
    console.log('🔍 Database-sync: Getting project manager for project:', projectId, 'for user:', userId);
    
    try {
      const result = await this.request(`project_manager?project_id=eq.${projectId}&user_id=eq.${userId}&limit=1`);
      
      if (result && result.length > 0) {
        console.log('✅ Database-sync: Project manager found');
        return { success: true, data: result[0] };
      } else {
        console.log('📭 Database-sync: No project manager found for project');
        return { success: true, data: null };
      }
    } catch (error) {
      console.error('❌ Database-sync: Failed to get project manager:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllProjectManagers() {
    // Default to 'default' user for backward compatibility
    return this.getAllProjectManagersWithUser('default');
  }

  async getAllProjectManagersWithUser(userId) {
    console.log('🔍 Database-sync: Getting all project managers for user:', userId);
    
    try {
      const result = await this.request(`project_manager?user_id=eq.${userId}&order=updated_at.desc`);
      
      console.log(`✅ Database-sync: Found ${result?.length || 0} project managers`);
      return { success: true, data: result || [] };
    } catch (error) {
      console.error('❌ Database-sync: Failed to get project managers:', error);
      return { success: false, error: error.message };
    }
  }

  async updateProjectManager(projectId, updateData) {
    // Default to 'default' user for backward compatibility
    return this.updateProjectManagerWithUser(projectId, updateData, 'default');
  }

  async updateProjectManagerWithUser(projectId, updateData, userId) {
    console.log('🔍 Database-sync: Updating project manager:', projectId, 'for user:', userId);
    
    const updateFields = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    try {
      const result = await this.request(`project_manager?project_id=eq.${projectId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateFields)
      });

      console.log('✅ Database-sync: Project manager updated successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to update project manager:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteProjectManager(projectId) {
    // Default to 'default' user for backward compatibility
    return this.deleteProjectManagerWithUser(projectId, 'default');
  }

  async deleteProjectManagerWithUser(projectId, userId) {
    console.log('🔍 Database-sync: Deleting project manager:', projectId, 'for user:', userId);
    
    try {
      const result = await this.request(`project_manager?project_id=eq.${projectId}&user_id=eq.${userId}`, {
        method: 'DELETE'
      });

      console.log('✅ Database-sync: Project manager deleted successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to delete project manager:', error);
      return { success: false, error: error.message };
    }
  }

  async saveEmbedding(conversationId, embedding, content) {
    const embeddingData = {
      conversation_id: conversationId,
      embedding: embedding,
      content: content,
      created_at: new Date().toISOString()
    };

    return await this.request('conversation_embeddings', {
      method: 'POST',
      body: JSON.stringify(embeddingData)
    });
  }

  async deleteConversations(filters = {}) {
    // Default to 'default' user for backward compatibility
    return this.deleteConversationsWithUser(filters, 'default');
  }

  async deleteConversationsWithUser(filters = {}, userId) {
    console.log('🔍 Database-sync: Deleting conversations with filters:', filters, 'for user:', userId);
    
    let endpoint = 'conversations';
    const conditions = [];
    
    // Always filter by user ID
    conditions.push(`user_id=eq.${userId}`);

    // Apply filters for targeted deletion
    if (filters.id) {
      // Delete specific conversation by ID
      conditions.push(`id=eq.${filters.id}`);
    } else if (filters.ids && Array.isArray(filters.ids)) {
      // Bulk delete by multiple IDs - much more efficient!
      if (filters.ids.length === 0) {
        console.log('🔍 Database-sync: No conversation IDs provided for bulk delete');
        return { success: true, deletedCount: 0 };
      }
      
      // Use PostgreSQL's "in" operator for bulk delete
      const idsString = filters.ids.map(id => `"${id}"`).join(',');
      conditions.push(`id=in.(${idsString})`);
      
      console.log(`🔍 Database-sync: Bulk deleting ${filters.ids.length} conversations`);
    } else {
      // Delete by other filters
      if (filters.projectId) {
        conditions.push(`project_id=eq.${filters.projectId}`);
      }

      if (filters.dateFrom) {
        conditions.push(`timestamp=gte.${filters.dateFrom}`);
      }

      if (filters.dateTo) {
        conditions.push(`timestamp=lte.${filters.dateTo}`);
      }
    }

    if (conditions.length > 0) {
      endpoint += '?' + conditions.join('&');
    }

    try {
      const result = await this.request(endpoint, {
        method: 'DELETE'
      });
      
      // Calculate deleted count for bulk operations
      let deletedCount = 0;
      if (filters.ids && Array.isArray(filters.ids)) {
        deletedCount = Array.isArray(result) ? result.length : filters.ids.length;
      } else {
        deletedCount = Array.isArray(result) ? result.length : 1;
      }
      
      console.log(`✅ Database-sync: Successfully deleted ${deletedCount} conversations`);
      return { success: true, deletedCount, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to delete conversations:', error);
      throw error;
    }
  }

  async getConversations(projectId = null, limit = 50) {
    // Default to 'default' user for backward compatibility
    return this.getConversationsWithUser(projectId, 'default', limit);
  }

  async getConversationsWithUser(projectId = null, userId, limit = 50) {
    let endpoint = `conversations?user_id=eq.${userId}&order=timestamp.desc&limit=${limit}`;
    if (projectId) {
      endpoint += `&project_id=eq.${projectId}`;
    }

    return await this.request(endpoint);
  }
  async textSearch(query, filters = {}) {
    let endpoint = 'conversations?';
    const conditions = [];

    // SECURITY: Always filter by user ID first
    if (filters.userId) {
      conditions.push(`user_id=eq.${filters.userId}`);
    } else {
      throw new Error('User ID is required for text search');
    }

    // Text search in user_message and lovable_response
    if (query) {
      conditions.push(`or=(user_message.ilike.*${query}*,lovable_response.ilike.*${query}*)`);
    }

    // Apply filters
    if (filters.projectId) {
      conditions.push(`project_id=eq.${filters.projectId}`);
    }

    if (filters.dateFrom) {
      conditions.push(`timestamp=gte.${filters.dateFrom}`);
    }

    if (filters.dateTo) {
      conditions.push(`timestamp=lte.${filters.dateTo}`);
    }

    if (filters.minEffectiveness) {
      conditions.push(`effectiveness_score=gte.${filters.minEffectiveness}`);
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(`tags=cs.{${filters.tags.join(',')}}`);
    }

    endpoint += conditions.join('&') + '&order=timestamp.desc&limit=20';

    return await this.request(endpoint);
  }

  async semanticSearch(query, threshold = 0.8) {
    try {
      // This would typically use a vector similarity function
      // For now, we'll implement a basic version
      const embeddings = await this.request('conversation_embeddings?select=*,conversations(*)');
      
      // Generate query embedding (this would typically be done via Claude API)
      const queryEmbedding = await this.generateSimpleEmbedding(query);
      
      // Calculate similarities
      const results = embeddings
        .map(item => ({
          ...item,
          similarity: this.cosineSimilarity(queryEmbedding, item.embedding)
        }))
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10)
        .map(item => item.conversations);

      return results;
    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
  }
  // Utility functions
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async generateSimpleEmbedding(text) {
    // Simple word frequency based embedding
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(10).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[index % 10] += (hash % 200 - 100) / 100;
    });
    
    return embedding;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Assistant Conversation Methods
  async saveAssistantConversation(conversationData) {
    // Default to 'default' user for backward compatibility
    return this.saveAssistantConversationWithUser(conversationData, 'default');
  }

  async saveAssistantConversationWithUser(conversationData, userId) {
    console.log('💾 Database-sync: Saving assistant conversation for user:', userId);
    
    try {
      // Generate UUID if not provided
      if (!conversationData.id) {
        conversationData.id = this.generateUUID();
      }
      
      // Add user ID to conversation data
      const conversationWithUser = {
        ...conversationData,
        user_id: userId
      };
      
      const result = await this.request('assistant_conversations', {
        method: 'POST',
        body: JSON.stringify(conversationWithUser)
      });

      console.log('✅ Database-sync: Assistant conversation saved successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to save assistant conversation:', error);
      return { success: false, error: error.message };
    }
  }

  async getAssistantConversations(projectId, limit = 10) {
    // Default to 'default' user for backward compatibility
    return this.getAssistantConversationsWithUser(projectId, 'default', limit);
  }

  async getAssistantConversationsWithUser(projectId, userId, limit = 10) {
    console.log(`🔍 Database-sync: Getting assistant conversations for project ${projectId} and user ${userId}`);
    
    try {
      const endpoint = `assistant_conversations?project_id=eq.${projectId}&user_id=eq.${userId}&order=created_at.desc&limit=${limit}`;
      const result = await this.request(endpoint);
      
      console.log(`✅ Database-sync: Retrieved ${result.length} assistant conversations`);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to get assistant conversations:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteAssistantConversation(conversationId) {
    console.log('🔍 Database-sync: Deleting assistant conversation:', conversationId);
    
    try {
      const result = await this.request(`assistant_conversations?id=eq.${conversationId}`, {
        method: 'DELETE'
      });

      console.log('✅ Database-sync: Assistant conversation deleted successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to delete assistant conversation:', error);
      return { success: false, error: error.message };
    }
  }

  async searchAssistantConversations(query, projectId = null, limit = 20) {
    console.log('🔍 Database-sync: Searching assistant conversations');
    
    try {
      let endpoint = 'assistant_conversations?';
      const conditions = [];
      
      // Text search in messages
      if (query) {
        conditions.push(`or=(user_message.ilike.*${query}*,assistant_response.ilike.*${query}*)`);
      }
      
      // Filter by project
      if (projectId) {
        conditions.push(`project_id=eq.${projectId}`);
      }
      
      endpoint += conditions.join('&') + `&order=created_at.desc&limit=${limit}`;
      
      const result = await this.request(endpoint);
      console.log(`✅ Database-sync: Found ${result.length} assistant conversations`);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to search assistant conversations:', error);
      return { success: false, error: error.message };
    }
  }

  // User Preferences Methods (Consolidated)
  async getUserPreferences(userId = 'default') {
    console.log('🔍 Database-sync: Getting user preferences for:', userId);
    
    try {
      const result = await this.request(`user_preferences?user_id=eq.${userId}&limit=1`);
      
      if (result && result.length > 0) {
        console.log('✅ Database-sync: User preferences found');
        return { success: true, data: result[0] };
      } else {
        console.log('📭 Database-sync: No user preferences found, creating defaults');
        // Create default preferences
        const defaultPrefs = await this.createDefaultUserPreferences(userId);
        return { success: true, data: defaultPrefs };
      }
    } catch (error) {
      console.error('❌ Database-sync: Failed to get user preferences:', error);
      return { success: false, error: error.message };
    }
  }

  async createDefaultUserPreferences(userId = 'default') {
    const defaultPreferences = {
      user_id: userId,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const result = await this.request('user_preferences', {
        method: 'POST',
        body: JSON.stringify(defaultPreferences)
      });
      
      return result[0] || defaultPreferences;
    } catch (error) {
      console.error('❌ Failed to create default preferences:', error);
      return defaultPreferences;
    }
  }

  async saveUserPreferences(userId = 'default', updates = {}) {
    console.log('🔍 Database-sync: Saving user preferences for:', userId);
    
    try {
      // First get existing preferences
      const existing = await this.getUserPreferences(userId);
      
      // Merge updates with existing data
      const mergedPreferences = {
        user_id: userId,
        settings: { ...(existing.data?.settings || {}), ...(updates.settings || {}) },
        updated_at: new Date().toISOString()
      };

      const result = await this.request('user_preferences', {
        method: 'POST',
        body: JSON.stringify(mergedPreferences),
        headers: {
          'Prefer': 'resolution=merge-duplicates'
        }
      });

      console.log('✅ Database-sync: User preferences saved successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to save user preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // UI Preferences Methods (using consolidated user_preferences)
  async getUIPreference(userId = 'default', preferenceKey) {
    console.log('🔍 Database-sync: Getting UI preference:', preferenceKey);
    
    try {
      const userPrefs = await this.getUserPreferences(userId);
      if (userPrefs.success && userPrefs.data) {
        // Store UI preferences in the settings column
        const value = userPrefs.data.settings?.[preferenceKey];
        console.log('✅ Database-sync: UI preference found');
        return { success: true, data: value };
      } else {
        console.log('📭 Database-sync: UI preference not found');
        return { success: true, data: null };
      }
    } catch (error) {
      console.error('❌ Database-sync: Failed to get UI preference:', error);
      return { success: false, error: error.message };
    }
  }

  async saveUIPreference(userId = 'default', preferenceKey, preferenceValue) {
    console.log('🔍 Database-sync: Saving UI preference:', preferenceKey);
    
    try {
      const updates = {
        settings: {
          [preferenceKey]: preferenceValue
        }
      };
      
      const result = await this.saveUserPreferences(userId, updates);
      console.log('✅ Database-sync: UI preference saved successfully');
      return result;
    } catch (error) {
      console.error('❌ Database-sync: Failed to save UI preference:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllUIPreferences(userId = 'default') {
    console.log('🔍 Database-sync: Getting all UI preferences for user:', userId);
    
    try {
      const userPrefs = await this.getUserPreferences(userId);
      if (userPrefs.success && userPrefs.data) {
        // Get UI preferences from settings column
        const preferences = userPrefs.data.settings || {};
        console.log(`✅ Database-sync: Found ${Object.keys(preferences).length} UI preferences`);
        return { success: true, data: preferences };
      } else {
        console.log('📭 Database-sync: No UI preferences found');
        return { success: true, data: {} };
      }
    } catch (error) {
      console.error('❌ Database-sync: Failed to get UI preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // AI Preferences Methods - REMOVED (AI functionality disabled)

  // Prompt Templates Methods
  async getPromptTemplates(userId = 'default') {
    console.log('🔍 Database-sync: Getting prompt templates for:', userId);
    
    try {
      const result = await this.request(
        `prompt_templates?user_id=eq.${userId}&is_active=eq.true&order=category,name`
      );
      
      console.log(`✅ Database-sync: Found ${result?.length || 0} prompt templates`);
      return { success: true, data: result || [] };
    } catch (error) {
      console.error('❌ Database-sync: Failed to get prompt templates:', error);
      return { success: false, error: error.message };
    }
  }

  async savePromptTemplate(userId = 'default', templateData) {
    console.log('🔍 Database-sync: Saving prompt template');
    
    const template = {
      user_id: userId,
      ...templateData,
      is_custom: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const result = await this.request('prompt_templates', {
        method: 'POST',
        body: JSON.stringify(template)
      });

      console.log('✅ Database-sync: Prompt template saved successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to save prompt template:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePromptTemplate(templateId, updateData) {
    console.log('🔍 Database-sync: Updating prompt template:', templateId);
    
    const updates = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    try {
      const result = await this.request(`prompt_templates?id=eq.${templateId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      console.log('✅ Database-sync: Prompt template updated successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to update prompt template:', error);
      return { success: false, error: error.message };
    }
  }

  async deletePromptTemplate(templateId) {
    console.log('🔍 Database-sync: Deleting prompt template:', templateId);
    
    try {
      // Soft delete by setting is_active to false
      const result = await this.request(`prompt_templates?id=eq.${templateId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_active: false,
          updated_at: new Date().toISOString()
        })
      });

      console.log('✅ Database-sync: Prompt template deleted successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to delete prompt template:', error);
      return { success: false, error: error.message };
    }
  }

  async saveAllPromptTemplates(userId = 'default', templates) {
    console.log('🔍 Database-sync: Saving all prompt templates');
    
    try {
      // First, soft delete all existing templates for this user
      await this.request(`prompt_templates?user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_active: false,
          updated_at: new Date().toISOString()
        })
      });

      // Then save all new templates - map to correct column names
      const templatesWithUser = templates.map((template, index) => ({
        category: template.category,
        name: template.name,
        template: template.template, // Use 'template' not 'template_content'
        shortcut: template.shortcut,
        user_id: userId,
        is_custom: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const result = await this.request('prompt_templates', {
        method: 'POST',
        body: JSON.stringify(templatesWithUser)
      });

      console.log('✅ Database-sync: All prompt templates saved successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to save all prompt templates:', error);
      return { success: false, error: error.message };
    }
  }

  // These methods are now properly defined above with user ID support

  // Individual Preference Column Methods - REMOVED (columns don't exist in schema)

  async getAllIndividualPreferences(userId = 'default') {
    console.log('🔍 Database-sync: Getting all individual preferences for user:', userId);
    
    try {
      // Use standard getUserPreferences which only uses existing columns
      const result = await this.getUserPreferences(userId);
      
      if (result.success && result.data) {
        console.log('✅ Database-sync: Individual preferences found');
        return result;
      } else {
        console.log('📭 Database-sync: No individual preferences found, creating defaults');
        // Create default preferences
        const defaultPrefs = await this.createDefaultUserPreferences(userId);
        return { success: true, data: defaultPrefs };
      }
    } catch (error) {
      console.error('❌ Database-sync: Failed to get individual preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // AI Preferences Individual Methods - REMOVED (AI functionality disabled)

  // Individual UI preference methods (for service worker compatibility)
  async saveUIPreferenceIndividual(userId = 'default', preferenceKey, preferenceValue) {
    console.log('🔍 Database-sync: Saving UI preference individually:', preferenceKey);
    
    try {
      // Get existing preferences and update settings
      const existing = await this.getUserPreferences(userId);
      const updates = {
        settings: { 
          ...(existing.data?.settings || {}), 
          [preferenceKey]: preferenceValue 
        },
        updated_at: new Date().toISOString()
      };
      
      // Ensure user exists first
      await this.getUserPreferences(userId);
      
      const result = await this.request(`user_preferences?user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      console.log('✅ Database-sync: UI preference saved individually');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to save UI preference individually:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllUIPreferencesIndividual(userId = 'default') {
    console.log('🔍 Database-sync: Getting all UI preferences individually');
    
    try {
      const result = await this.getUserPreferences(userId);
      if (result.success && result.data) {
        // Return all preferences from settings column
        const uiPrefs = result.data.settings || {};
        console.log(`✅ Database-sync: Found ${Object.keys(uiPrefs).length} UI preferences`);
        return { success: true, data: uiPrefs };
      }
      return { success: true, data: {} };
    } catch (error) {
      console.error('❌ Database-sync: Failed to get UI preferences individually:', error);
      return { success: false, error: error.message };
    }
  }

  async saveSupabaseSettings(userId = 'default', supabaseId, supabaseKey) {
    console.log('🔍 Database-sync: Saving Supabase settings');
    
    try {
      // Get existing preferences and update settings
      const existing = await this.getUserPreferences(userId);
      const updates = {
        settings: { 
          ...(existing.data?.settings || {}), 
          supabaseId: supabaseId,
          supabaseKey: supabaseKey
        },
        updated_at: new Date().toISOString()
      };
      
      // Ensure user exists first  
      await this.getUserPreferences(userId);
      
      const result = await this.request(`user_preferences?user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      console.log('✅ Database-sync: Supabase settings saved successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to save Supabase settings:', error);
      return { success: false, error: error.message };
    }
  }

  async getSupabaseSettings(userId = 'default') {
    const result = await this.getUserPreferences(userId);
    if (result.success && result.data) {
      return { 
        success: true, 
        data: {
          supabaseId: result.data.settings?.supabaseId || '',
          supabaseKey: result.data.settings?.supabaseKey || ''
        }
      };
    }
    return result;
  }
}