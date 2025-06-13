// Supabase Database Integration
export class SupabaseClient {
  constructor() {
    this.baseURL = null;
    this.apiKey = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    const config = await chrome.storage.sync.get(['supabaseUrl', 'supabaseKey']);
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Supabase configuration not found. Please configure in extension popup.');
    }
    
    this.baseURL = config.supabaseUrl;
    this.apiKey = config.supabaseKey;
    this.initialized = true;
  }

  async request(endpoint, options = {}) {
    await this.init();
    
    const url = `${this.baseURL}/rest/v1/${endpoint}`;
    console.log(`🔍 Database request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'apikey': this.apiKey,
        'Authorization': `Bearer ${this.apiKey}`,
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

    const result = await response.json();
    console.log(`✅ Database response data:`, result);
    return result;
  }
  async saveConversation(data) {
    console.log('🔍 Database-sync: Saving conversation:', data.id);
    
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
      effectiveness_score: null // Always null as requested
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
    console.log('🔍 Database-sync: Saving project manager:', projectManagerData.project_id);
    
    const projectManager = {
      project_id: projectManagerData.project_id,
      project_name: projectManagerData.project_name,
      project_url: projectManagerData.project_url,
      description: projectManagerData.description || '',
      knowledge: projectManagerData.knowledge || '',
      updated_at: new Date().toISOString()
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
    console.log('🔍 Database-sync: Getting project manager for project:', projectId);
    
    try {
      const result = await this.request(`project_manager?project_id=eq.${projectId}&limit=1`);
      
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
    console.log('🔍 Database-sync: Getting all project managers');
    
    try {
      const result = await this.request('project_manager?order=updated_at.desc');
      
      console.log(`✅ Database-sync: Found ${result?.length || 0} project managers`);
      return { success: true, data: result || [] };
    } catch (error) {
      console.error('❌ Database-sync: Failed to get project managers:', error);
      return { success: false, error: error.message };
    }
  }

  async updateProjectManager(projectId, updateData) {
    console.log('🔍 Database-sync: Updating project manager:', projectId);
    
    const updateFields = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    try {
      const result = await this.request(`project_manager?project_id=eq.${projectId}`, {
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
    console.log('🔍 Database-sync: Deleting project manager:', projectId);
    
    try {
      const result = await this.request(`project_manager?project_id=eq.${projectId}`, {
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
    console.log('🔍 Database-sync: Deleting conversations with filters:', filters);
    
    let endpoint = 'conversations';
    const conditions = [];

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
    let endpoint = `conversations?order=timestamp.desc&limit=${limit}`;
    if (projectId) {
      endpoint += `&project_id=eq.${projectId}`;
    }

    return await this.request(endpoint);
  }
  async textSearch(query, filters = {}) {
    let endpoint = 'conversations?';
    const conditions = [];

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
    console.log('💾 Database-sync: Saving assistant conversation');
    
    try {
      // Generate UUID if not provided
      if (!conversationData.id) {
        conversationData.id = this.generateUUID();
      }
      
      const result = await this.request('assistant_conversations', {
        method: 'POST',
        body: JSON.stringify(conversationData)
      });

      console.log('✅ Database-sync: Assistant conversation saved successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Database-sync: Failed to save assistant conversation:', error);
      return { success: false, error: error.message };
    }
  }

  async getAssistantConversations(projectId, limit = 10) {
    console.log(`🔍 Database-sync: Getting assistant conversations for project ${projectId}`);
    
    try {
      const endpoint = `assistant_conversations?project_id=eq.${projectId}&order=created_at.desc&limit=${limit}`;
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
}