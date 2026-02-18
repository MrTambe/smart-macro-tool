/**
 * Frontend AI Service
 * React-compatible service for AI integration
 * Can be used directly in React components or via IPC in Electron
 */

class FrontendAIService {
  constructor() {
    this.initialized = false;
    this.currentProvider = null;
    this.settings = {
      providers: {},
      defaults: {
        provider: 'openai',
        temperature: 0.7,
        maxTokens: 4096,
        streamingEnabled: true
      }
    };
  }

  async initialize(config = {}) {
    this.settings.providers = {
      openai: {
        apiKey: config.openaiApiKey || '',
        model: config.openaiModel || 'gpt-3.5-turbo',
        configured: !!config.openaiApiKey
      },
      anthropic: {
        apiKey: config.anthropicApiKey || '',
        model: config.anthropicModel || 'claude-sonnet-4-20250514',
        configured: !!config.anthropicApiKey
      },
      gemini: {
        apiKey: config.geminiApiKey || '',
        model: config.geminiModel || 'gemini-1.5-flash',
        configured: !!config.geminiApiKey
      }
    };

    if (config.defaultProvider) {
      this.settings.defaults.provider = config.defaultProvider;
    }

    this.currentProvider = this.settings.defaults.provider;
    this.initialized = true;

    return true;
  }

  isConfigured(provider = null) {
    const p = provider || this.currentProvider;
    return this.settings.providers[p]?.configured || false;
  }

  getProviders() {
    return Object.entries(this.settings.providers).map(([id, config]) => ({
      id,
      name: this.getProviderDisplayName(id),
      model: config.model,
      configured: config.configured,
      available: true
    }));
  }

  getProviderDisplayName(id) {
    const names = {
      openai: 'OpenAI ChatGPT',
      anthropic: 'Anthropic Claude',
      gemini: 'Google Gemini'
    };
    return names[id] || id;
  }

  async chat(message, options = {}) {
    const provider = options.provider || this.currentProvider;
    const config = this.settings.providers[provider];

    if (!config?.configured) {
      throw new Error(`Provider '${provider}' not configured`);
    }

    const requestBody = {
      messages: [
        { role: 'system', content: options.systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: message }
      ],
      temperature: options.temperature ?? this.settings.defaults.temperature,
      max_tokens: options.maxTokens ?? this.settings.defaults.maxTokens,
      stream: options.stream ?? this.settings.defaults.streamingEnabled
    };

    const endpoint = this.getEndpoint(provider);

    return this.makeRequest(endpoint, config.apiKey, requestBody, provider);
  }

  async enhanceText(text, enhancementType, options = {}) {
    const provider = options.provider || this.currentProvider;
    const config = this.settings.providers[provider];

    if (!config?.configured) {
      throw new Error(`Provider '${provider}' not configured`);
    }

    const prompts = {
      rewrite: `Rewrite the following text to improve clarity and structure:\n\n${text}`,
      summarize: `Summarize the following text concisely:\n\n${text}`,
      grammarCorrection: `Correct all grammar errors in the following text:\n\n${text}`,
      expand: `Expand on the following text with more detail:\n\n${text}`,
      professional: `Rewrite in a more professional tone:\n\n${text}`,
      simplify: `Simplify the following text:\n\n${text}`
    };

    const prompt = prompts[enhancementType] || prompts.rewrite;

    const response = await this.chat(prompt, { ...options, stream: options.stream || false });

    return {
      original: text,
      enhanced: response.content || response.choices?.[0]?.message?.content,
      enhancementType,
      provider,
      metadata: response.usage || {}
    };
  }

  getEndpoint(provider) {
    const endpoints = {
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
      gemini: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'
    };
    return endpoints[provider];
  }

  makeRequest(endpoint, apiKey, body, provider) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? require('https') : require('http');

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      if (provider === 'anthropic') {
        headers['anthropic-version'] = '2023-06-01';
      }

      if (provider === 'gemini') {
        url.searchParams.set('key', apiKey);
      }

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers,
        timeout: 60000
      };

      const req = httpModule.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}`));
            } else {
              resolve(this.parseResponse(provider, parsed));
            }
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(JSON.stringify(provider === 'gemini' ? { contents: body.messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })) } : body));
      req.end();
    });
  }

  parseResponse(provider, response) {
    if (provider === 'openai') {
      return {
        content: response.choices?.[0]?.message?.content,
        usage: response.usage,
        model: response.model
      };
    } else if (provider === 'anthropic') {
      return {
        content: response.content?.[0]?.text,
        usage: response.usage,
        model: response.model
      };
    } else if (provider === 'gemini') {
      return {
        content: response.candidates?.[0]?.content?.parts?.[0]?.text,
        usage: response.usageMetadata,
        model: response.modelVersion
      };
    }
    return response;
  }

  setApiKey(provider, apiKey) {
    if (this.settings.providers[provider]) {
      this.settings.providers[provider].apiKey = apiKey;
      this.settings.providers[provider].configured = !!apiKey;
    }
  }

  setDefaultProvider(provider) {
    this.settings.defaults.provider = provider;
    this.currentProvider = provider;
  }

  clearSession() {
    return true;
  }

  getStats() {
    return {
      providersConfigured: Object.values(this.settings.providers).filter(p => p.configured).length,
      currentProvider: this.currentProvider
    };
  }
}

const aiService = new FrontendAIService();
module.exports = aiService;
