import React, { useState, useEffect } from 'react'
import { 
  Cpu, 
  Cloud, 
  Server, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Download,
  Trash2,
  Settings,
  Activity,
  Shield,
  Zap,
  Brain,
  Terminal
} from 'lucide-react'
import { useAIStore, RECOMMENDED_MODELS, OPENROUTER_MODELS, AIProvider } from '../../store/aiStore'
import { getSystemAI } from '../../services/systemAIService'

const AISettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'providers' | 'system' | 'routing'>('providers')
  const [isDetecting, setIsDetecting] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})

  const {
    openRouter,
    ollama,
    lmStudio,
    primaryProvider,
    systemAI,
    setPrimaryProvider,
    setOpenRouterApiKey,
    setOpenRouterModel,
    testOpenRouterConnection,
    detectOllama,
    fetchOllamaModels,
    downloadOllamaModel,
    deleteOllamaModel,
    detectLMStudio,
    toggleSystemAI,
    updateSystemAIResponsibility,
    updateSystemAIResourceLimit,
  } = useAIStore()

  // Auto-detect providers on mount
  useEffect(() => {
    handleAutoDetect()
  }, [])

  const handleAutoDetect = async () => {
    setIsDetecting(true)
    
    // Detect Ollama
    await detectOllama()
    
    // Detect LM Studio
    await detectLMStudio()
    
    setIsDetecting(false)
  }

  const handleDownloadModel = async (model: string) => {
    setDownloadProgress(prev => ({ ...prev, [model]: 0 }))
    
    try {
      // Start download with streaming progress
      const ollamaUrl = ollama.baseUrl
      const response = await fetch(`${ollamaUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model })
      })

      if (!response.ok) {
        throw new Error(`Failed to start download: ${response.status}`)
      }

      // Read the stream
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.completed) {
              setDownloadProgress(prev => ({ ...prev, [model]: 100 }))
            } else if (data.total && data.completed !== undefined) {
              const percent = Math.round((data.completed / data.total) * 100)
              setDownloadProgress(prev => ({ ...prev, [model]: percent }))
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Refresh model list after download
      await fetchOllamaModels()
      
      // Clear progress after a moment
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[model]
          return newProgress
        })
      }, 2000)
      
    } catch (error) {
      console.error('Download error:', error)
      setDownloadProgress(prev => ({ ...prev, [model]: -1 })) // -1 indicates error
      
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[model]
          return newProgress
        })
      }, 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveTab('providers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'providers' 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <Cloud className="w-4 h-4" />
          AI Providers
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'system' 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <Shield className="w-4 h-4" />
          System AI
        </button>
        <button
          onClick={() => setActiveTab('routing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'routing' 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <Zap className="w-4 h-4" />
          Task Routing
        </button>
      </div>

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          {/* Auto-detect Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">AI Providers</h3>
            <button
              onClick={handleAutoDetect}
              disabled={isDetecting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              {isDetecting ? 'Detecting...' : 'Auto-detect Providers'}
            </button>
          </div>

          {/* OpenRouter Section */}
          <section className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Cloud className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">OpenRouter (Cloud)</h4>
              <StatusBadge status={openRouter.connectionStatus} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={openRouter.apiKey}
                    onChange={(e) => setOpenRouterApiKey(e.target.value)}
                    placeholder="Enter your OpenRouter API key"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={testOpenRouterConnection}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Test
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from{' '}
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    openrouter.ai/keys
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <select
                  value={openRouter.selectedModel}
                  onChange={(e) => setOpenRouterModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {OPENROUTER_MODELS.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.description?.includes('free') ? '(Free)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={openRouter.temperature}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={openRouter.maxTokens}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Top P
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={openRouter.topP}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Ollama Section */}
          <section className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Ollama (Local)</h4>
              <StatusBadge status={ollama.connectionStatus} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Server URL
                </label>
                <input
                  type="text"
                  value={ollama.baseUrl}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              {ollama.connectionStatus === 'connected' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Installed Models
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {ollama.installedModels.map(model => (
                        <div key={model.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">{model.name}</span>
                            <span className="text-sm text-gray-500 ml-2">{model.size}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setOllamaModel(model.id)
                                setPrimaryProvider('ollama')
                              }}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                ollama.selectedModel === model.id 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {ollama.selectedModel === model.id ? 'Primary' : 'Set Primary'}
                            </button>
                            <button
                              onClick={() => {
                                useAIStore.getState().setSystemAIModel(model.id)
                              }}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                systemAI.model === model.id 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              }`}
                            >
                              {systemAI.model === model.id ? 'System' : 'Set System'}
                            </button>
                            <button
                              onClick={() => deleteOllamaModel(model.id)}
                              className="text-xs p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recommended Models
                    </label>
                    <div className="space-y-2">
                      {RECOMMENDED_MODELS.primaryAI.map(model => {
                        const isInstalled = ollama.installedModels.some(m => m.id === model.id)
                        const isDownloading = downloadProgress[model.id] !== undefined && downloadProgress[model.id] >= 0
                        const hasError = downloadProgress[model.id] === -1
                        
                        return (
                          <div key={model.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">{model.name}</span>
                              <span className="text-sm text-gray-500 ml-2">{model.size}</span>
                              <p className="text-xs text-gray-500">{model.description}</p>
                            </div>
                            {isInstalled ? (
                              <span className="flex items-center gap-1 text-sm text-green-600">
                                <Check className="w-4 h-4" />
                                Installed
                              </span>
                            ) : hasError ? (
                              <span className="flex items-center gap-1 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                Failed
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDownloadModel(model.id)}
                                disabled={isDownloading}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                              >
                                {isDownloading ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    {downloadProgress[model.id]}%
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3 h-3" />
                                    Download
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ollama.useGPU}
                        readOnly
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Use GPU Acceleration</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ollama.keepInMemory}
                        readOnly
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Keep Model in Memory</span>
                    </label>
                  </div>
                </>
              )}

              {ollama.connectionStatus === 'disconnected' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Ollama Not Detected</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Install Ollama to use local AI models for free, offline operation.
                      </p>
                      <a
                        href="https://ollama.com/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-yellow-800 hover:underline"
                      >
                        Download Ollama
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* LM Studio Section */}
          <section className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">LM Studio (Local)</h4>
              <StatusBadge status={lmStudio.connectionStatus} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Server URL
                </label>
                <input
                  type="text"
                  value={lmStudio.baseUrl}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              {lmStudio.loadedModel && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    Loaded Model: {lmStudio.loadedModel.name}
                  </p>
                </div>
              )}

              {lmStudio.connectionStatus === 'disconnected' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">LM Studio Not Detected</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Install LM Studio for an easy-to-use GUI for managing local models.
                      </p>
                      <a
                        href="https://lmstudio.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-yellow-800 hover:underline"
                      >
                        Download LM Studio
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* System AI Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">System AI</h3>
              <p className="text-sm text-gray-500">
                Background assistant that monitors the application and enhances AI interactions
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className={`text-sm font-medium ${systemAI.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                {systemAI.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => {
                  toggleSystemAI(!systemAI.enabled)
                  if (!systemAI.enabled) {
                    getSystemAI().start()
                  } else {
                    getSystemAI().stop()
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  systemAI.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    systemAI.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          {systemAI.enabled && (
            <>
              {/* Status Card */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">Status</span>
                  </div>
                  <p className={`text-lg font-semibold ${
                    systemAI.status === 'active' ? 'text-green-600' : 
                    systemAI.status === 'paused' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {systemAI.status.charAt(0).toUpperCase() + systemAI.status.slice(1)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Cpu className="w-4 h-4" />
                    <span className="text-sm">CPU Usage</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {systemAI.resourceUsage.cpu.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Brain className="w-4 h-4" />
                    <span className="text-sm">Memory</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {systemAI.resourceUsage.memory.toFixed(0)} MB
                  </p>
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System AI Model
                </label>
                <select
                  value={systemAI.model}
                  onChange={(e) => useAIStore.getState().setSystemAIModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {RECOMMENDED_MODELS.systemAI.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.size}) - {model.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: Qwen 2.5 Coder 1.5B - optimized for debugging and prompt enhancement
                </p>
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Responsibilities
                </label>
                <div className="space-y-3">
                  {Object.entries(systemAI.responsibilities).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateSystemAIResponsibility(key as any, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Resource Limits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Resource Limits
                </label>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Max CPU Usage</span>
                      <span className="text-gray-900">{systemAI.resourceLimits.maxCpuPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={systemAI.resourceLimits.maxCpuPercent}
                      onChange={(e) => updateSystemAIResourceLimit('maxCpuPercent', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Max Memory</span>
                      <span className="text-gray-900">{systemAI.resourceLimits.maxMemoryMB} MB</span>
                    </div>
                    <input
                      type="range"
                      min="256"
                      max="2048"
                      step="128"
                      value={systemAI.resourceLimits.maxMemoryMB}
                      onChange={(e) => updateSystemAIResourceLimit('maxMemoryMB', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemAI.resourceLimits.autoPauseWhenIdle}
                      onChange={(e) => updateSystemAIResourceLimit('autoPauseWhenIdle', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Auto-pause when idle for 5 minutes</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Task Routing Tab */}
      {activeTab === 'routing' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Task Routing</h3>
            <p className="text-sm text-gray-500">
              Configure which AI provider to use for different types of tasks
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Primary Provider</p>
                  <p className="text-sm text-blue-700">
                    Used for most tasks unless specified otherwise
                  </p>
                </div>
                <select
                  value={primaryProvider}
                  onChange={(e) => setPrimaryProvider(e.target.value as AIProvider)}
                  className="px-3 py-2 border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ollama">Ollama (Local)</option>
                  <option value="openrouter">OpenRouter (Cloud)</option>
                  <option value="lmstudio">LM Studio (Local)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="font-medium text-gray-900 mb-3">Routing Rules</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">Simple Tasks</p>
                      <p className="text-sm text-gray-500">Quick formatting, basic queries</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">Use Lightweight Model</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Complex Tasks</p>
                      <p className="text-sm text-gray-500">Data analysis, complex formulas</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">Use Advanced Model</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="font-medium text-gray-900">Critical Tasks</p>
                      <p className="text-sm text-gray-500">Data integrity, important operations</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">Use Most Reliable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles = {
    connected: 'bg-green-100 text-green-800',
    disconnected: 'bg-gray-100 text-gray-600',
    checking: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }

  const labels = {
    connected: 'Connected',
    disconnected: 'Not Connected',
    checking: 'Checking...',
    error: 'Error'
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.disconnected}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  )
}

export default AISettings
