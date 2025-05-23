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

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase request failed: ${error}`);
    }

    return response.json();
  }
  async saveConversation(data) {
    const conversation = {
      id: data.id || this.generateUUID(),
      project_id: data.projectId,
      user_message: data.userMessage,
      lovable_response: data.lovableResponse,
      timestamp: new Date().toISOString(),
      project_context: data.projectContext || {},
      tags: data.tags || [],
      effectiveness_score: data.effectivenessScore || null
    };

    return await this.request('conversations', {
      method: 'POST',
      body: JSON.stringify(conversation)
    });
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