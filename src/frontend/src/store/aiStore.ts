import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// AI Provider Types
export type AIProvider = 'openrouter' | 'ollama' | 'lmstudio'

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  size?: string
  description?: string
  contextWindow?: number
  capabilities: string[]
}

export interface AIProviderConfig {
  provider: AIProvider
  enabled: boolean
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'checking'
  lastError?: string
}

// OpenRouter Configuration
export interface OpenRouterConfig extends AIProviderConfig {
  provider: 'openrouter'
  apiKey: string
  baseUrl: string
  selectedModel: string
  availableModels: AIModel[]
  temperature: number
  maxTokens: number
  topP: number
}

// Ollama Configuration
export interface OllamaConfig extends AIProviderConfig {
  provider: 'ollama'
  baseUrl: string
  installedModels: AIModel[]
  selectedModel: string
  systemAIModel: string
  useGPU: boolean
  cpuThreads: number
  contextWindow: number
  keepInMemory: boolean
}

// LM Studio Configuration
export interface LMStudioConfig extends AIProviderConfig {
  provider: 'lmstudio'
  baseUrl: string
  loadedModel?: AIModel
  serverStatus: 'running' | 'stopped'
}

// System AI Configuration
export interface SystemAIConfig {
  enabled: boolean
  model: string
  status: 'active' | 'paused' | 'error' | 'loading'
  resourceUsage: {
    cpu: number
    memory: number
  }
  responsibilities: {
    errorDetection: boolean
    promptEnhancement: boolean
    responseValidation: boolean
    healthMonitoring: boolean
    autoRecovery: boolean
    userGuidance: boolean
  }
  resourceLimits: {
    maxCpuPercent: number
    maxMemoryMB: number
    autoPauseWhenIdle: boolean
  }
  lastActivity?: Date
  averageResponseTime: number
}

// Task Routing
export interface TaskRoutingRule {
  id: string
  name: string
  condition: 'simple' | 'complex' | 'critical' | 'code' | 'custom'
  provider: AIProvider
  model?: string
  priority: number
}

// Usage Statistics
export interface AIUsageStats {
  totalTokens: number
  totalCalls: number
  totalCost: number
  callsByProvider: Record<AIProvider, number>
  tokensByModel: Record<string, number>
  last24Hours: {
    calls: number
    tokens: number
    cost: number
  }
}

export interface AIState {
  // Provider Configurations
  openRouter: OpenRouterConfig
  ollama: OllamaConfig
  lmStudio: LMStudioConfig
  
  // Primary AI Selection
  primaryProvider: AIProvider
  fallbackOrder: AIProvider[]
  
  // System AI
  systemAI: SystemAIConfig
  
  // Task Routing
  routingRules: TaskRoutingRule[]
  
  // Usage Statistics
  usageStats: AIUsageStats
  
  // Activity Log
  activityLog: AIActivityLogEntry[]

  // Pull progress
  pullProgress: Record<string, number>
  
  // Actions
  setPrimaryProvider: (provider: AIProvider) => void
  setFallbackOrder: (order: AIProvider[]) => void
  
  // OpenRouter Actions
  setOpenRouterApiKey: (key: string) => void
  setOpenRouterModel: (model: string) => void
  testOpenRouterConnection: () => Promise<boolean>
  fetchOpenRouterModels: () => Promise<void>
  
  // Ollama Actions
  setOllamaUrl: (url: string) => void
  setOllamaModel: (model: string) => void
  setSystemAIModel: (model: string) => void
  detectOllama: () => Promise<boolean>
  fetchOllamaModels: () => Promise<void>
  downloadOllamaModel: (model: string) => Promise<void>
  deleteOllamaModel: (model: string) => Promise<void>
  
  // LM Studio Actions
  setLMStudioUrl: (url: string) => void
  detectLMStudio: () => Promise<boolean>
  fetchLMStudioModel: () => Promise<void>
  
  // System AI Actions
  toggleSystemAI: (enabled: boolean) => void
  updateSystemAIResponsibility: (key: keyof SystemAIConfig['responsibilities'], value: boolean) => void
  updateSystemAIResourceLimit: (key: keyof SystemAIConfig['resourceLimits'], value: number | boolean) => void
  pauseSystemAI: () => void
  resumeSystemAI: () => void
  
  // Task Routing Actions
  addRoutingRule: (rule: Omit<TaskRoutingRule, 'id'>) => void
  removeRoutingRule: (id: string) => void
  updateRoutingRule: (id: string, updates: Partial<TaskRoutingRule>) => void
  
  // Usage & Logs
  recordUsage: (provider: AIProvider, model: string, tokens: number, cost: number) => void
  addActivityLog: (entry: Omit<AIActivityLogEntry, 'id' | 'timestamp'>) => void
  clearActivityLog: () => void
  
  // General
  resetToDefaults: () => void
}

export interface AIActivityLogEntry {
  id: string
  timestamp: Date
  type: 'request' | 'response' | 'error' | 'system' | 'prompt_enhancement'
  provider: AIProvider
  model: string
  message: string
  details?: any
  duration?: number
}

// Default recommended models
export const RECOMMENDED_MODELS: Record<string, AIModel[]> = {
  systemAI: [
    {
      id: 'mistral:7b',
      name: 'Mistral 7B',
      provider: 'ollama',
      size: '4.1GB',
      description: 'Excellent instruction following and reasoning',
      contextWindow: 32768,
      capabilities: ['general', 'reasoning']
    },
    {
      id: 'qwen2.5-coder:1.5b',
      name: 'Qwen 2.5 Coder 1.5B',
      provider: 'ollama',
      size: '975MB',
      description: 'Purpose-built for coding and debugging tasks',
      contextWindow: 32768,
      capabilities: ['code', 'debugging', 'error_detection']
    },
  ],
  primaryAI: [
    {
      id: 'mistral:7b',
      name: 'Mistral 7B',
      provider: 'ollama',
      size: '4.1GB',
      description: 'Excellent instruction following and reasoning',
      contextWindow: 32768,
      capabilities: ['general', 'reasoning']
    },
    {
      id: 'llama3.1:8b',
      name: 'Llama 3.1 8B',
      provider: 'ollama',
      size: '4.7GB',
      description: 'Best all-around performance',
      contextWindow: 131072,
      capabilities: ['general', 'reasoning', 'analysis']
    },
    {
      id: 'qwen2.5:7b',
      name: 'Qwen 2.5 7B',
      provider: 'ollama',
      size: '4.4GB',
      description: 'Great for data extraction',
      contextWindow: 131072,
      capabilities: ['data', 'multilingual', 'analysis']
    },
    {
      id: 'codellama:7b',
      name: 'CodeLlama 7B',
      provider: 'ollama',
      size: '3.8GB',
      description: 'Specialized for code and macros',
      contextWindow: 16384,
      capabilities: ['code', 'macros']
    }
  ]
}

// OpenRouter models
export const OPENROUTER_MODELS: AIModel[] = [
  {
    id: 'google/gemini-2.0-flash-thinking-exp:free',
    name: 'Gemini 2.0 Flash Thinking',
    provider: 'openrouter',
    description: 'Advanced reasoning model - Free tier',
    contextWindow: 32000,
    capabilities: ['reasoning', 'analysis', 'free']
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B Instruct',
    provider: 'openrouter',
    description: 'Fast and capable - Free tier',
    contextWindow: 128000,
    capabilities: ['general', 'fast', 'free']
  },
  {
    id: 'deepseek/deepseek-coder-33b-instruct',
    name: 'DeepSeek Coder 33B',
    provider: 'openrouter',
    description: 'Advanced code generation',
    contextWindow: 16000,
    capabilities: ['code', 'advanced']
  }
]

const defaultState: Omit<AIState, 
  'setPrimaryProvider' | 'setFallbackOrder' | 'setOpenRouterApiKey' | 
  'setOpenRouterModel' | 'testOpenRouterConnection' | 'fetchOpenRouterModels' |
  'setOllamaUrl' | 'setOllamaModel' | 'setSystemAIModel' | 'detectOllama' |
  'fetchOllamaModels' | 'downloadOllamaModel' | 'deleteOllamaModel' |
  'setLMStudioUrl' | 'detectLMStudio' | 'fetchLMStudioModel' |
  'toggleSystemAI' | 'updateSystemAIResponsibility' | 'updateSystemAIResourceLimit' |
  'pauseSystemAI' | 'resumeSystemAI' | 'addRoutingRule' | 'removeRoutingRule' |
  'updateRoutingRule' | 'recordUsage' | 'addActivityLog' | 'clearActivityLog' | 'resetToDefaults'
> = {
  openRouter: {
    provider: 'openrouter',
    enabled: true,
    connectionStatus: 'connected',
    apiKey: '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',
    baseUrl: 'https://openrouter.ai/api/v1',
    selectedModel: 'google/gemini-2.0-flash-thinking-exp:free',
    availableModels: OPENROUTER_MODELS,
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1.0
  },
  ollama: {
    provider: 'ollama',
    enabled: false,
    connectionStatus: 'disconnected',
    baseUrl: 'http://localhost:11434',
    installedModels: [],
    selectedModel: 'mistral:7b',
    systemAIModel: 'mistral:7b',
    useGPU: true,
    cpuThreads: 8,
    contextWindow: 4096,
    keepInMemory: true
  },
  lmStudio: {
    provider: 'lmstudio',
    enabled: true,
    connectionStatus: 'disconnected',
    baseUrl: 'http://127.0.0.1:1234',
    serverStatus: 'stopped'
  },
  primaryProvider: 'openrouter',
  fallbackOrder: ['openrouter', 'ollama', 'lmstudio'],
  systemAI: {
    enabled: true,
    model: 'google/gemini-2.0-flash-thinking-exp:free',
    status: 'active',
    resourceUsage: {
      cpu: 0,
      memory: 0
    },
    responsibilities: {
      errorDetection: true,
      promptEnhancement: true,
      responseValidation: true,
      healthMonitoring: false,
      autoRecovery: true,
      userGuidance: false
    },
    resourceLimits: {
      maxCpuPercent: 10,
      maxMemoryMB: 500,
      autoPauseWhenIdle: true
    },
    averageResponseTime: 0
  },
  routingRules: [
    {
      id: 'simple-tasks',
      name: 'Simple Tasks',
      condition: 'simple',
      provider: 'ollama',
      model: 'mistral:7b',
      priority: 1
    },
    {
      id: 'complex-tasks',
      name: 'Complex Tasks',
      condition: 'complex',
      provider: 'ollama',
      model: 'llama3.1:8b',
      priority: 2
    },
    {
      id: 'critical-tasks',
      name: 'Critical Tasks',
      condition: 'critical',
      provider: 'openrouter',
      model: 'google/gemini-2.0-flash-thinking-exp:free',
      priority: 3
    }
  ],
  usageStats: {
    totalTokens: 0,
    totalCalls: 0,
    totalCost: 0,
    callsByProvider: {
      openrouter: 0,
      ollama: 0,
      lmstudio: 0
    },
    tokensByModel: {},
    last24Hours: {
      calls: 0,
      tokens: 0,
      cost: 0
    }
  },
  activityLog: [],
  pullProgress: {}
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // Primary Provider
      setPrimaryProvider: (provider) => set({ primaryProvider: provider }),
      setFallbackOrder: (order) => set({ fallbackOrder: order }),

      // OpenRouter
      setOpenRouterApiKey: (key) => set((state) => ({
        openRouter: { ...state.openRouter, apiKey: key }
      })),
      setOpenRouterModel: (model) => set((state) => ({
        openRouter: { ...state.openRouter, selectedModel: model }
      })),
      testOpenRouterConnection: async () => {
        const { openRouter } = get()
        set((state) => ({
          openRouter: { ...state.openRouter, connectionStatus: 'checking' }
        }))
        
        try {
          const response = await fetch(`${openRouter.baseUrl}/models`, {
            headers: {
              'Authorization': `Bearer ${openRouter.apiKey}`,
              'Content-Type': 'application/json'
            }
          })
          
          const connected = response.ok
          set((state) => ({
            openRouter: { 
              ...state.openRouter, 
              connectionStatus: connected ? 'connected' : 'error',
              lastError: connected ? undefined : 'Invalid API key or connection failed'
            }
          }))
          return connected
        } catch (error) {
          set((state) => ({
            openRouter: { 
              ...state.openRouter, 
              connectionStatus: 'error',
              lastError: (error as Error).message
            }
          }))
          return false
        }
      },
      fetchOpenRouterModels: async () => {
        // In production, this would fetch from OpenRouter API
        // For now, use the predefined list
        console.log('[AI] OpenRouter models loaded from cache')
      },

      // Ollama
      setOllamaUrl: (url) => set((state) => ({
        ollama: { ...state.ollama, baseUrl: url }
      })),
      setOllamaModel: (model) => set((state) => ({
        ollama: { ...state.ollama, selectedModel: model }
      })),
      setSystemAIModel: (model) => set((state) => ({
        systemAI: { ...state.systemAI, model }
      })),
      detectOllama: async () => {
        const { ollama } = get()
        set((state) => ({
          ollama: { ...state.ollama, connectionStatus: 'checking' }
        }))
        
        try {
          const response = await fetch(`${ollama.baseUrl}/api/tags`)
          const detected = response.ok
          
          set((state) => ({
            ollama: { 
              ...state.ollama, 
              enabled: detected,
              connectionStatus: detected ? 'connected' : 'disconnected'
            }
          }))
          
          if (detected) {
            get().fetchOllamaModels()
          }
          
          return detected
        } catch {
          set((state) => ({
            ollama: { 
              ...state.ollama, 
              enabled: false,
              connectionStatus: 'disconnected'
            }
          }))
          return false
        }
      },
      fetchOllamaModels: async () => {
        const { ollama } = get()
        try {
          const response = await fetch(`${ollama.baseUrl}/api/tags`)
          if (response.ok) {
            const data = await response.json()
            const models: AIModel[] = data.models.map((m: any) => ({
              id: m.name,
              name: m.name,
              provider: 'ollama',
              size: m.size ? `${(m.size / 1e9).toFixed(1)}GB` : undefined,
              description: `${m.name} - ${m.parameter_size || 'Unknown size'}`,
              capabilities: ['general']
            }))
            
            set((state) => ({
              ollama: { ...state.ollama, installedModels: models }
            }))
          }
        } catch (error) {
          console.error('[AI] Failed to fetch Ollama models:', error)
        }
      },
      downloadOllamaModel: async (model) => {
        const { ollama } = get()
        console.log(`[AI] Downloading Ollama model: ${model}`)
        
        try {
          const response = await fetch(`${ollama.baseUrl}/api/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: model })
          })
          
          if (!response.ok) throw new Error(`Pull failed: ${response.status}`)

          const reader = response.body?.getReader()
          if (!reader) throw new Error('No response body')
          
          const decoder = new TextDecoder()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter(l => l.trim())
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line)
                if (data.total && data.completed !== undefined) {
                  const percent = Math.round((data.completed / data.total) * 100)
                  set(state => ({
                    pullProgress: { ...state.pullProgress, [model]: percent }
                  }))
                }
              } catch { /* Ignore */ }
            }
          }

          console.log(`[AI] Successfully downloaded ${model}`)
          set(state => {
            const newProgress = { ...state.pullProgress }
            delete newProgress[model]
            return { pullProgress: newProgress }
          })
          get().fetchOllamaModels()
        } catch (error) {
          console.error(`[AI] Failed to download ${model}:`, error)
          set(state => {
            const newProgress = { ...state.pullProgress }
            delete newProgress[model]
            return { pullProgress: newProgress }
          })
          throw error
        }
      },
      deleteOllamaModel: async (model) => {
        const { ollama } = get()
        console.log(`[AI] Deleting Ollama model: ${model}`)
        
        try {
          await fetch(`${ollama.baseUrl}/api/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: model })
          })
          
          get().fetchOllamaModels()
        } catch (error) {
          console.error(`[AI] Failed to delete ${model}:`, error)
        }
      },

      // LM Studio
      setLMStudioUrl: (url) => set((state) => ({
        lmStudio: { ...state.lmStudio, baseUrl: url }
      })),
      detectLMStudio: async () => {
        const { lmStudio } = get()
        set((state) => ({
          lmStudio: { ...state.lmStudio, connectionStatus: 'checking' }
        }))
        
        try {
          const response = await fetch(`${lmStudio.baseUrl}/v1/models`)
          const detected = response.ok
          
          set((state) => ({
            lmStudio: { 
              ...state.lmStudio, 
              enabled: detected,
              connectionStatus: detected ? 'connected' : 'disconnected',
              serverStatus: detected ? 'running' : 'stopped'
            }
          }))
          
          if (detected) {
            get().fetchLMStudioModel()
          }
          
          return detected
        } catch {
          set((state) => ({
            lmStudio: { 
              ...state.lmStudio, 
              enabled: false,
              connectionStatus: 'disconnected',
              serverStatus: 'stopped'
            }
          }))
          return false
        }
      },
      fetchLMStudioModel: async () => {
        const { lmStudio } = get()
        try {
          const response = await fetch(`${lmStudio.baseUrl}/v1/models`)
          if (response.ok) {
            const data = await response.json()
            if (data.data && data.data.length > 0) {
              const model = data.data[0]
              set((state) => ({
                lmStudio: { 
                  ...state.lmStudio, 
                  loadedModel: {
                    id: model.id,
                    name: model.id,
                    provider: 'lmstudio',
                    description: `Loaded in LM Studio`,
                    capabilities: ['general']
                  }
                }
              }))
            }
          }
        } catch (error) {
          console.error('[AI] Failed to fetch LM Studio model:', error)
        }
      },

      // System AI
      toggleSystemAI: (enabled) => set((state) => ({
        systemAI: { ...state.systemAI, enabled }
      })),
      updateSystemAIResponsibility: (key, value) => set((state) => ({
        systemAI: {
          ...state.systemAI,
          responsibilities: { ...state.systemAI.responsibilities, [key]: value }
        }
      })),
      updateSystemAIResourceLimit: (key, value) => set((state) => ({
        systemAI: {
          ...state.systemAI,
          resourceLimits: { ...state.systemAI.resourceLimits, [key]: value }
        }
      })),
      pauseSystemAI: () => set((state) => ({
        systemAI: { ...state.systemAI, status: 'paused' }
      })),
      resumeSystemAI: () => set((state) => ({
        systemAI: { ...state.systemAI, status: 'active' }
      })),

      // Task Routing
      addRoutingRule: (rule) => set((state) => ({
        routingRules: [...state.routingRules, { ...rule, id: Date.now().toString() }]
      })),
      removeRoutingRule: (id) => set((state) => ({
        routingRules: state.routingRules.filter(r => r.id !== id)
      })),
      updateRoutingRule: (id, updates) => set((state) => ({
        routingRules: state.routingRules.map(r => 
          r.id === id ? { ...r, ...updates } : r
        )
      })),

      // Usage & Logs
      recordUsage: (provider, model, tokens, cost) => set((state) => ({
        usageStats: {
          ...state.usageStats,
          totalTokens: state.usageStats.totalTokens + tokens,
          totalCalls: state.usageStats.totalCalls + 1,
          totalCost: state.usageStats.totalCost + cost,
          callsByProvider: {
            ...state.usageStats.callsByProvider,
            [provider]: (state.usageStats.callsByProvider[provider] || 0) + 1
          },
          tokensByModel: {
            ...state.usageStats.tokensByModel,
            [model]: (state.usageStats.tokensByModel[model] || 0) + tokens
          }
        }
      })),
      addActivityLog: (entry) => set((state) => ({
        activityLog: [...state.activityLog, {
          ...entry,
          id: Date.now().toString(),
          timestamp: new Date()
        }].slice(-100) // Keep last 100 entries
      })),
      clearActivityLog: () => set({ activityLog: [] }),

      // Reset
      resetToDefaults: () => set(defaultState)
    }),
    {
      name: 'ai-settings',
      partialize: (state) => ({
        openRouter: {
          ...state.openRouter,
          apiKey: state.openRouter.apiKey // Encrypted in production
        },
        ollama: state.ollama,
        lmStudio: state.lmStudio,
        primaryProvider: state.primaryProvider,
        fallbackOrder: state.fallbackOrder,
        systemAI: state.systemAI,
        routingRules: state.routingRules,
        usageStats: state.usageStats
      })
    }
  )
)

export default useAIStore
