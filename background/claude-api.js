// Claude API Integration
export class ClaudeAPI {
  constructor() {
    this.baseURL = 'https://api.anthropic.com/v1';
    this.model = 'claude-3-5-sonnet-20241022';
    this.maxTokens = 4000;
  }

  async getApiKey() {
    const result = await chrome.storage.sync.get('claudeApiKey');
    if (!result.claudeApiKey) {
      throw new Error('Claude API key not configured. Please set it in the extension popup.');
    }
    return result.claudeApiKey;
  }

  async generateResponse(prompt, systemPrompt = '') {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          system: systemPrompt || 'You are a helpful development assistant for web development projects.'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;    } catch (error) {
      console.error('Claude API request failed:', error);
      throw error;
    }
  }

  async generateEmbedding(text) {
    // For now, we'll create a simple hash-based embedding
    // In production, you might want to use a dedicated embedding service
    try {
      const apiKey = await this.getApiKey();
      
      // Simple approach: use Claude to generate semantic features
      const prompt = `Generate a numerical vector representation (10 numbers between -1 and 1) that captures the semantic meaning of this development-related text. Return only the numbers separated by commas:

      "${text}"`;

      const response = await this.generateResponse(prompt);
      
      // Parse the response to extract numbers
      const numbers = response.match(/-?\d+\.?\d*/g);
      if (numbers && numbers.length >= 10) {
        return numbers.slice(0, 10).map(n => parseFloat(n));
      }
      
      // Fallback: create hash-based embedding
      return this.createHashEmbedding(text);
    } catch (error) {
      console.error('Embedding generation failed, using fallback:', error);
      return this.createHashEmbedding(text);
    }
  }

  createHashEmbedding(text) {
    // Simple hash-based embedding as fallback
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(10).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[index % 10] += (hash % 200 - 100) / 100; // Normalize to [-1, 1]
    });
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  async analyzePromptEffectiveness(prompt, response, userFeedback = null) {
    try {
      const analysisPrompt = `Analyze the effectiveness of this development prompt and response pair. Rate from 1-10 based on:
      1. Clarity of the original prompt
      2. Completeness of the response
      3. Technical accuracy
      4. Actionability of the advice
      
      Prompt: "${prompt}"
      Response: "${response}"
      User feedback: ${userFeedback || 'None provided'}
      
      Provide a numerical score (1-10) and brief explanation.`;

      const analysis = await this.generateResponse(analysisPrompt);
      
      // Extract score from response
      const scoreMatch = analysis.match(/(\d+)\/10|score:?\s*(\d+)|(\d+)\s*out of 10/i);
      const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]) : 5;
      
      return {
        score: Math.min(10, Math.max(1, score)),
        analysis: analysis
      };
    } catch (error) {
      console.error('Effectiveness analysis failed:', error);
      return { score: 5, analysis: 'Analysis unavailable' };
    }
  }
}