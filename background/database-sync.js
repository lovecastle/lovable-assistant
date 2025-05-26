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
      const error = await response.text();
      console.error(`❌ Database request failed: ${response.status} ${response.statusText}`, error);
      throw new Error(`Supabase request failed: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Database response data:`, result);
    return result;
  }
  async saveConversation(data) {
    console.log('🔍 Database-sync: Saving conversation:', data.id);
    
    const conversation = {
      id: data.id || this.generateUUID(),
      project_id: data.projectId,
      user_message: data.userMessage,
      lovable_response: data.lovableResponse,
      timestamp: data.timestamp || new Date().toISOString(), // Use provided timestamp
      project_context: data.projectContext || {},
      tags: data.categories || [], // Map categories to tags field in database
      effectiveness_score: null // Always null as requested
    };

    console.log('🔍 Database-sync: Prepared conversation data:', {
      id: conversation.id,
      project_id: conversation.project_id,
      user_message_length: conversation.user_message?.length || 0,
      lovable_response_length: conversation.lovable_response?.length || 0,
      timestamp: conversation.timestamp,
      categories_count: conversation.tags?.length || 0,
      priority_category: conversation.tags?.[0] || 'none'
    });

    try {
      const result = await this.request('conversations', {
        method: 'POST',
        body: JSON.stringify(conversation)
      });
      
      console.log('✅ Database-sync: Conversation saved successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Database-sync: Failed to save conversation:', error);
      throw error;
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
      
      console.log('✅ Database-sync: Conversations deleted successfully:', result);
      return result;
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
}