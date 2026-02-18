import { AIProvider, AIModel, useAIStore } from '../store/aiStore'

// Types for AI requests and responses
export interface AIRequest {
  prompt: string
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface AIResponse {
  content: string
  model: string
  provider: AIProvider
  tokensUsed: number
  duration: number
  error?: string
}

export interface StreamingAIResponse {
  content: string
  done: boolean
  error?: string
}

// Base AI Provider Interface
export interface AIProviderService {
  provider: AIProvider
  isAvailable(): Promise<boolean>
  generate(request: AIRequest): Promise<AIResponse>
  generateStream(request: AIRequest, onChunk: (chunk: StreamingAIResponse) => void): Promise<void>
  getModels(): Promise<AIModel[]>
}

// OpenRouter Provider
export class OpenRouterService implements AIProviderService {
  provider: AIProvider = 'openrouter'
  private baseUrl = 'https://openrouter.ai/api/v1'
  private apiKey = ''

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return response.ok
    } catch {
      return false
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Smart Macro Tool'
        },
        body: JSON.stringify({
          model: request.model || 'google/gemini-2.0-flash-thinking-exp:free',
          messages: [
            ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
            { role: 'user', content: request.prompt }
          ],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 4096,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`)
      }

      const data = await response.json()
      const duration = Date.now() - startTime

      // Record usage
      useAIStore.getState().recordUsage(
        'openrouter',
        request.model || 'unknown',
        data.usage?.total_tokens || 0,
        0 // Cost calculation would be done here
      )

      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        provider: 'openrouter',
        tokensUsed: data.usage?.total_tokens || 0,
        duration
      }
    } catch (error) {
      return {
        content: '',
        model: request.model || 'unknown',
        provider: 'openrouter',
        tokensUsed: 0,
        duration: Date.now() - startTime,
        error: (error as Error).message
      }
    }
  }

  async generateStream(
    request: AIRequest, 
    onChunk: (chunk: StreamingAIResponse) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Smart Macro Tool'
        },
        body: JSON.stringify({
          model: request.model || 'google/gemini-2.0-flash-thinking-exp:free',
          messages: [
            ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
            { role: 'user', content: request.prompt }
          ],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 4096,
          stream: true
        })
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onChunk({ content: '', done: true })
              return
            }
            try {
              const json = JSON.parse(data)
              const content = json.choices[0]?.delta?.content || ''
              onChunk({ content, done: false })
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      onChunk({ content: '', done: true, error: (error as Error).message })
    }
  }

  async getModels(): Promise<AIModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.data.map((m: any) => ({
        id: m.id,
        name: m.name,
        provider: 'openrouter' as AIProvider,
        description: m.description,
        contextWindow: m.context_length,
        capabilities: []
      }))
    } catch {
      return []
    }
  }
}

// Ollama Provider
export class OllamaService implements AIProviderService {
  provider: AIProvider = 'ollama'
  private baseUrl = 'http://localhost:11434'

  constructor(baseUrl?: string) {
    if (baseUrl) this.baseUrl = baseUrl
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    const state = useAIStore.getState()
    
    // Determine the model to use
    let modelToUse = request.model
    
    // If no model specified or provider is ollama, try to find a valid installed model
    if (this.provider === 'ollama') {
      const installedModels = state.ollama.installedModels
      
      if (installedModels.length === 0) {
        return {
          content: '',
          model: 'none',
          provider: 'ollama',
          tokensUsed: 0,
          duration: 0,
          error: 'No Ollama models installed. Please download a model in Settings.'
        }
      }

      // If requested model not installed, use the first available one
      const isInstalled = installedModels.some(m => m.id === modelToUse || m.id.startsWith(modelToUse + ':'))
      if (!isInstalled) {
        modelToUse = state.ollama.selectedModel || installedModels[0].id
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          prompt: request.systemPrompt 
            ? `${request.systemPrompt}\n\n${request.prompt}`
            : request.prompt,
          stream: false,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.maxTokens ?? 4096
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Ollama API error: ${response.status}`)
      }

      const data = await response.json()
      const duration = Date.now() - startTime

      // Record usage
      useAIStore.getState().recordUsage(
        'ollama',
        modelToUse || 'unknown',
        data.eval_count || 0,
        0 // Local models are free
      )

      return {
        content: data.response || '',
        model: modelToUse || 'unknown',
        provider: 'ollama',
        tokensUsed: data.eval_count || 0,
        duration
      }
    } catch (error) {
      return {
        content: '',
        model: modelToUse || 'unknown',
        provider: 'ollama',
        tokensUsed: 0,
        duration: Date.now() - startTime,
        error: (error as Error).message
      }
    }
  }

  async generateStream(
    request: AIRequest,
    onChunk: (chunk: StreamingAIResponse) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: request.model || 'llama3.1:8b',
          prompt: request.systemPrompt 
            ? `${request.systemPrompt}\n\n${request.prompt}`
            : request.prompt,
          stream: true,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.maxTokens ?? 4096
          }
        })
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            onChunk({
              content: data.response || '',
              done: data.done || false
            })
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      onChunk({ content: '', done: true, error: (error as Error).message })
    }
  }

  async getModels(): Promise<AIModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) return []
      
      const data = await response.json()
      return data.models.map((m: any) => ({
        id: m.name,
        name: m.name,
        provider: 'ollama' as AIProvider,
        size: m.size ? `${(m.size / 1e9).toFixed(1)}GB` : undefined,
        description: `${m.name} - ${m.parameter_size || 'Unknown size'}`,
        capabilities: ['general']
      }))
    } catch {
      return []
    }
  }

  async downloadModel(model: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model })
    })

    if (!response.ok) {
      throw new Error(`Failed to download model: ${model}`)
    }
  }

  async deleteModel(model: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model })
    })
  }
}

// LM Studio Provider
export class LMStudioService implements AIProviderService {
  provider: AIProvider = 'lmstudio'
  private baseUrl = 'http://localhost:1234'

  constructor(baseUrl?: string) {
    if (baseUrl) this.baseUrl = baseUrl
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`)
      return response.ok
    } catch {
      return false
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    const state = useAIStore.getState()
    
    // In LM Studio, the model name often doesn't matter or is "local-model"
    // but we'll try to use the one loaded in the store if available
    const modelToUse = state.lmStudio.loadedModel?.id || request.model || 'local-model'
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
            { role: 'user', content: request.prompt }
          ],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 4096,
          stream: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `LM Studio API error: ${response.status}`)
      }

      const data = await response.json()
      const duration = Date.now() - startTime

      useAIStore.getState().recordUsage(
        'lmstudio',
        modelToUse,
        data.usage?.total_tokens || 0,
        0
      )

      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model || modelToUse,
        provider: 'lmstudio',
        tokensUsed: data.usage?.total_tokens || 0,
        duration
      }
    } catch (error) {
      return {
        content: '',
        model: modelToUse,
        provider: 'lmstudio',
        tokensUsed: 0,
        duration: Date.now() - startTime,
        error: (error as Error).message
      }
    }
  }

  async generateStream(
    request: AIRequest,
    onChunk: (chunk: StreamingAIResponse) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: request.model || 'local-model',
          messages: [
            ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
            { role: 'user', content: request.prompt }
          ],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 4096,
          stream: true
        })
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onChunk({ content: '', done: true })
              return
            }
            try {
              const json = JSON.parse(data)
              const content = json.choices[0]?.delta?.content || ''
              onChunk({ content, done: false })
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      onChunk({ content: '', done: true, error: (error as Error).message })
    }
  }

  async getModels(): Promise<AIModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`)
      if (!response.ok) return []
      
      const data = await response.json()
      return data.data.map((m: any) => ({
        id: m.id,
        name: m.id,
        provider: 'lmstudio' as AIProvider,
        description: 'Loaded in LM Studio',
        capabilities: ['general']
      }))
    } catch {
      return []
    }
  }
}

// AI Service Factory
export class AIService {
  private providers: Map<AIProvider, AIProviderService> = new Map()

  constructor() {
    const state = useAIStore.getState()
    
    // Initialize providers based on configuration
    if (state.openRouter.apiKey) {
      this.providers.set('openrouter', new OpenRouterService(state.openRouter.apiKey))
    }
    
    this.providers.set('ollama', new OllamaService(state.ollama.baseUrl))
    this.providers.set('lmstudio', new LMStudioService(state.lmStudio.baseUrl))
  }

  getProvider(provider: AIProvider): AIProviderService | undefined {
    return this.providers.get(provider)
  }

  async generateWithPrimary(request: AIRequest): Promise<AIResponse> {
    const state = useAIStore.getState()
    const primaryProvider = state.primaryProvider
    const provider = this.providers.get(primaryProvider)
    
    if (!provider) {
      return {
        content: '',
        model: 'unknown',
        provider: primaryProvider,
        tokensUsed: 0,
        duration: 0,
        error: `Primary provider ${primaryProvider} not available`
      }
    }

    const response = await provider.generate(request)
    
    // If primary fails, try fallback
    if (response.error && state.fallbackOrder.length > 0) {
      for (const fallbackProvider of state.fallbackOrder) {
        if (fallbackProvider === primaryProvider) continue
        
        const fallback = this.providers.get(fallbackProvider)
        if (fallback) {
          console.log(`[AI] Primary failed, trying fallback: ${fallbackProvider}`)
          const fallbackResponse = await fallback.generate(request)
          if (!fallbackResponse.error) {
            return fallbackResponse
          }
        }
      }
    }
    
    return response
  }

  async generateWithSystemAI(prompt: string): Promise<AIResponse> {
    const state = useAIStore.getState()
    
    if (!state.systemAI.enabled || state.systemAI.status !== 'active') {
      return {
        content: '',
        model: state.systemAI.model,
        provider: 'ollama',
        tokensUsed: 0,
        duration: 0,
        error: 'System AI not available'
      }
    }

    const ollama = this.providers.get('ollama') as OllamaService
    if (!ollama) {
      return {
        content: '',
        model: state.systemAI.model,
        provider: 'ollama',
        tokensUsed: 0,
        duration: 0,
        error: 'Ollama not available for System AI'
      }
    }

    return ollama.generate({
      prompt,
      model: state.systemAI.model,
      temperature: 0.3, // Lower temperature for more consistent responses
      maxTokens: 1024   // System AI doesn't need long responses
    })
  }

  refreshProviders() {
    const state = useAIStore.getState()
    
    this.providers.clear()
    
    if (state.openRouter.apiKey) {
      this.providers.set('openrouter', new OpenRouterService(state.openRouter.apiKey))
    }
    
    this.providers.set('ollama', new OllamaService(state.ollama.baseUrl))
    this.providers.set('lmstudio', new LMStudioService(state.lmStudio.baseUrl))
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null

export const getAIService = (): AIService => {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService()
  }
  return aiServiceInstance
}

export default AIService
