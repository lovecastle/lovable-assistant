// Multi-Provider AI API Integration
export class AIAPI {
  constructor() {
    this.providers = {
      claude: {
        baseURL: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 4000
      },
      openai: {
        baseURL: 'https://api.openai.com/v1',
        model: 'gpt-4-turbo-preview',
        maxTokens: 4000
      },
      gemini: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-pro',
        maxTokens: 4000
      }
    };
  }

  async getConfig() {
    const config = await chrome.storage.sync.get([
      'aiProvider', 'claudeApiKey', 'openaiApiKey', 'geminiApiKey'
    ]);
    
    const provider = config.aiProvider || 'claude';
    let apiKey;
    
    switch (provider) {
      case 'claude':
        apiKey = config.claudeApiKey;
        break;
      case 'openai':
        apiKey = config.openaiApiKey;
        break;
      case 'gemini':
        apiKey = config.geminiApiKey;
        break;
    }
    
    if (!apiKey) {
      throw new Error(`${provider} API key not configured. Please set it in the extension settings.`);
    }
    
    return { provider, apiKey };
  }

  async generateResponse(prompt, systemPrompt = '') {
    const { provider, apiKey } = await this.getConfig();
    
    switch (provider) {
      case 'claude':
        return this.generateClaudeResponse(prompt, systemPrompt, apiKey);
      case 'openai':
        return this.generateOpenAIResponse(prompt, systemPrompt, apiKey);
      case 'gemini':
        return this.generateGeminiResponse(prompt, systemPrompt, apiKey);
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }

  async generateClaudeResponse(prompt, systemPrompt, apiKey) {
    try {
      const response = await fetch(`${this.providers.claude.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: this.providers.claude.model,
          max_tokens: this.providers.claude.maxTokens,
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
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API request failed:', error);
      throw error;
    }
  }

  async generateOpenAIResponse(prompt, systemPrompt, apiKey) {
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt || 'You are a helpful development assistant for web development projects.'
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt
      });
      
      const response = await fetch(`${this.providers.openai.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.providers.openai.model,
          messages: messages,
          max_tokens: this.providers.openai.maxTokens,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  }

  async generateGeminiResponse(prompt, systemPrompt, apiKey) {
    try {
      // Combine system prompt and user prompt for Gemini
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      
      const response = await fetch(
        `${this.providers.gemini.baseURL}/models/${this.providers.gemini.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: fullPrompt
              }]
            }],
            generationConfig: {
              maxOutputTokens: this.providers.gemini.maxTokens,
              temperature: 0.7
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API request failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const { provider } = await this.getConfig();
      
      // Simple test prompt
      const response = await this.generateResponse(
        'Hello! Please respond with "Connection successful" if you receive this.',
        'You are testing the API connection. Respond briefly.'
      );
      
      return response.toLowerCase().includes('connection') || response.toLowerCase().includes('successful');
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}