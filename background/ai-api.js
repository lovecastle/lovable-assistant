// Multi-Provider AI API Integration
export class AIAPI {
  constructor() {
    this.providers = {
      claude: {
        baseURL: 'https://api.anthropic.com/v1',
        models: [
          { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', default: true },
          { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
          { id: 'claude-3-7-sonnet-latest', name: 'Claude 3.7 Sonnet' },
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
          { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku' }
        ],
        maxTokens: 4000
      },
      openai: {
        baseURL: 'https://api.openai.com/v1',
        models: [
          { id: 'o4-mini-2025-04-16', name: 'O4 Mini', default: true },
          { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1' },
          { id: 'gpt-4.1-mini-2025-04-14', name: 'GPT-4.1 Mini' },
          { id: 'gpt-4o-2024-08-06', name: 'GPT-4o' },
          { id: 'gpt-4o-mini-2024-07-18', name: 'GPT-4o Mini' }
        ],
        maxTokens: 4000
      },
      gemini: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        models: [
          { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', default: true },
          { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro' },
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
        ],
        maxTokens: 4000
      }
    };
  }

  async getConfig() {
    const config = await chrome.storage.sync.get([
      'aiProvider', 'claudeApiKey', 'openaiApiKey', 'geminiApiKey',
      'claudeModel', 'openaiModel', 'geminiModel'
    ]);
    
    const provider = config.aiProvider || 'claude';
    let apiKey, model;
    
    switch (provider) {
      case 'claude':
        apiKey = config.claudeApiKey;
        model = config.claudeModel || this.providers.claude.models.find(m => m.default).id;
        break;
      case 'openai':
        apiKey = config.openaiApiKey;
        model = config.openaiModel || this.providers.openai.models.find(m => m.default).id;
        break;
      case 'gemini':
        apiKey = config.geminiApiKey;
        model = config.geminiModel || this.providers.gemini.models.find(m => m.default).id;
        break;
    }
    
    if (!apiKey) {
      throw new Error(`${provider} API key not configured. Please set it in the extension settings.`);
    }
    
    return { provider, apiKey, model };
  }
  
  getAvailableModels(provider) {
    return this.providers[provider]?.models || [];
  }

  async generateResponse(prompt, systemPrompt = '') {
    const { provider, apiKey, model } = await this.getConfig();
    
    switch (provider) {
      case 'claude':
        return this.generateClaudeResponse(prompt, systemPrompt, apiKey, model);
      case 'openai':
        return this.generateOpenAIResponse(prompt, systemPrompt, apiKey, model);
      case 'gemini':
        return this.generateGeminiResponse(prompt, systemPrompt, apiKey, model);
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }

  async generateClaudeResponse(prompt, systemPrompt, apiKey, model) {
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
          model: model,
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

  async generateOpenAIResponse(prompt, systemPrompt, apiKey, model) {
    try {
      const messages = [];
      
      // O1 and O4 models don't support system messages, so combine with user prompt
      const isO1O4Model = model.startsWith('o1') || model.startsWith('o4');
      
      // O1 and O4 models also don't support custom temperature (only default 1.0)
      const supportsTemperature = !isO1O4Model;
      
      if (isO1O4Model && systemPrompt) {
        // Combine system prompt with user prompt for O1/O4 models
        messages.push({
          role: 'user',
          content: `${systemPrompt}\n\n${prompt}`
        });
      } else {
        // Standard approach for other models
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
      }
      
      const response = await fetch(`${this.providers.openai.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_completion_tokens: this.providers.openai.maxTokens,
          ...(supportsTemperature && { temperature: 0.7 })
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

  async generateGeminiResponse(prompt, systemPrompt, apiKey, model) {
    try {
      // Combine system prompt and user prompt for Gemini
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      
      const response = await fetch(
        `${this.providers.gemini.baseURL}/models/${model}:generateContent?key=${apiKey}`,
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