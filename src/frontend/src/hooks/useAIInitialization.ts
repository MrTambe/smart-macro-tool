import { useEffect, useState } from 'react'
import { useAIStore } from '../store/aiStore'
import { getSystemAI } from '../services/systemAIService'
import { getAIService } from '../services/aiService'

export const useAIInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isDetecting, setIsDetecting] = useState(true)
  const [detectionResults, setDetectionResults] = useState<{
    ollama: boolean
    lmStudio: boolean
    openRouter: boolean
  }>({
    ollama: false,
    lmStudio: false,
    openRouter: false
  })

  const {
    detectOllama,
    detectLMStudio,
    testOpenRouterConnection,
    ollama,
    lmStudio,
    openRouter,
    systemAI,
    setPrimaryProvider
  } = useAIStore()

  useEffect(() => {
    const initializeAI = async () => {
      console.log('[AI Init] Starting AI provider detection...')
      setIsDetecting(true)

      const results = {
        ollama: false,
        lmStudio: false,
        openRouter: false
      }

      // Detect Ollama
      try {
        console.log('[AI Init] Detecting Ollama...')
        results.ollama = await detectOllama()
        if (results.ollama) {
          console.log('[AI Init] ✓ Ollama detected')
        } else {
          console.log('[AI Init] ✗ Ollama not detected')
        }
      } catch (error) {
        console.error('[AI Init] Error detecting Ollama:', error)
      }

      // Detect LM Studio
      try {
        console.log('[AI Init] Detecting LM Studio...')
        results.lmStudio = await detectLMStudio()
        if (results.lmStudio) {
          console.log('[AI Init] ✓ LM Studio detected')
          // Fetch loaded model details
          await useAIStore.getState().fetchLMStudioModel()
        } else {
          console.log('[AI Init] ✗ LM Studio not detected')
        }
      } catch (error) {
        console.error('[AI Init] Error detecting LM Studio:', error)
      }

      // Test OpenRouter if API key exists
      if (openRouter.apiKey) {
        try {
          console.log('[AI Init] Testing OpenRouter connection...')
          results.openRouter = await testOpenRouterConnection()
          if (results.openRouter) {
            console.log('[AI Init] ✓ OpenRouter connected')
          } else {
            console.log('[AI Init] ✗ OpenRouter connection failed')
          }
        } catch (error) {
          console.error('[AI Init] Error testing OpenRouter:', error)
        }
      }

      setDetectionResults(results)

      // Auto-select primary provider - User specifically wants Mistral
      if (results.ollama) {
        setPrimaryProvider('ollama')
        const isMistralInstalled = ollama.installedModels.some(m => m.id === 'mistral:7b' || m.id.startsWith('mistral:'))
        
        if (isMistralInstalled) {
          useAIStore.getState().setOllamaModel('mistral:7b')
        } else {
          console.log('[AI Init] Mistral not found. Triggering pull...')
          useAIStore.getState().downloadOllamaModel('mistral:7b').catch(err => {
            console.error('[AI Init] Failed to pull Mistral:', err)
          })
          useAIStore.getState().setOllamaModel('mistral:7b')
        }
      } else if (results.lmStudio) {
        setPrimaryProvider('lmstudio')
      } else if (results.openRouter) {
        setPrimaryProvider('openrouter')
      }

      // Start System AI if enabled
      if (systemAI.enabled) {
        if (results.ollama) {
          // Check if system AI model is installed
          const isInstalled = ollama.installedModels.some(m => m.id === systemAI.model || m.id.startsWith(systemAI.model + ':'))
          
          if (!isInstalled) {
            console.log(`[AI Init] System AI model ${systemAI.model} not found. Triggering auto-pull...`)
            // Start background pull
            useAIStore.getState().downloadOllamaModel(systemAI.model).then(() => {
              console.log(`[AI Init] System AI model ${systemAI.model} pull complete`)
              getSystemAI().start()
            }).catch(err => {
              console.error(`[AI Init] Failed to pull system AI model:`, err)
            })
          } else {
            console.log('[AI Init] Starting System AI...')
            getSystemAI().start()
          }
        } else {
          console.log('[AI Init] System AI enabled but Ollama not available')
        }
      }

      // Refresh AI service providers
      getAIService().refreshProviders()

      setIsDetecting(false)
      setIsInitialized(true)
      console.log('[AI Init] Initialization complete')
    }

    initializeAI()

    // Cleanup on unmount
    return () => {
      getSystemAI().stop()
    }
  }, [])

  return {
    isInitialized,
    isDetecting,
    detectionResults
  }
}

export default useAIInitialization
