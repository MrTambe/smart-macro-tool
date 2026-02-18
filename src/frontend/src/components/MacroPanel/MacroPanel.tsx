import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Square, 
  Circle, 
  Save, 
  FolderOpen,
  Trash2,
  Edit3,
  Clock,
  MousePointerClick,
  Keyboard,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  List,
  Settings
} from 'lucide-react'
import { useAppStore, Macro, MacroStep } from '../../hooks/useAppStore'

const MacroPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'record' | 'library'>('record')
  const [selectedMacro, setSelectedMacro] = useState<Macro | null>(null)
  const [expandedMacros, setExpandedMacros] = useState<Set<string>>(new Set())
  const [macroName, setMacroName] = useState('')
  const [macroDescription, setMacroDescription] = useState('')
  
  const {
    macros,
    isMacroRecording,
    currentRecording,
    startRecording,
    stopRecording,
    addRecordingStep,
    clearRecording,
    addMacro,
    deleteMacro,
    runMacro,
    activeMacro
  } = useAppStore()

  // Handle keyboard/mouse recording
  useEffect(() => {
    if (!isMacroRecording) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't record shortcut keys
      if (e.ctrlKey || e.metaKey) return
      
      const step: MacroStep = {
        id: Date.now().toString(),
        type: 'keyboard',
        action: 'keypress',
        payload: {
          key: e.key,
          code: e.code,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
        },
        delay: 0
      }
      addRecordingStep(step)
    }

    const handleClick = (e: MouseEvent) => {
      const step: MacroStep = {
        id: Date.now().toString(),
        type: 'mouse',
        action: 'click',
        payload: {
          x: e.clientX,
          y: e.clientY,
          button: e.button,
          target: (e.target as HTMLElement)?.tagName,
        },
        delay: 0
      }
      addRecordingStep(step)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleClick)
    }
  }, [isMacroRecording, addRecordingStep])

  const handleStartRecording = () => {
    setMacroName('')
    setMacroDescription('')
    clearRecording()
    startRecording()
  }

  const handleStopRecording = () => {
    stopRecording()
    // Auto-prompt to save
    if (currentRecording.length > 0) {
      setMacroName(`Macro ${macros.length + 1}`)
      setMacroDescription(`Recorded ${currentRecording.length} steps`)
    }
  }

  const handleSaveMacro = () => {
    if (!macroName.trim() || currentRecording.length === 0) return

    const newMacro: Macro = {
      id: Date.now().toString(),
      name: macroName,
      description: macroDescription,
      steps: currentRecording,
      createdAt: new Date(),
      updatedAt: new Date(),
      timesRun: 0,
    }

    addMacro(newMacro)
    setMacroName('')
    setMacroDescription('')
    clearRecording()
    setActiveTab('library')
  }

  const toggleMacroExpansion = (macroId: string) => {
    setExpandedMacros(prev => {
      const newSet = new Set(prev)
      if (newSet.has(macroId)) {
        newSet.delete(macroId)
      } else {
        newSet.add(macroId)
      }
      return newSet
    })
  }

  const getStepIcon = (step: MacroStep) => {
    switch (step.type) {
      case 'keyboard':
        return <Keyboard className="w-3 h-3" />
      case 'mouse':
        return <MousePointerClick className="w-3 h-3" />
      case 'delay':
        return <Clock className="w-3 h-3" />
      default:
        return <List className="w-3 h-3" />
    }
  }

  const getStepDescription = (step: MacroStep) => {
    switch (step.type) {
      case 'keyboard':
        return `Press "${step.payload.key}"`
      case 'mouse':
        return `Click at (${step.payload.x}, ${step.payload.y})`
      case 'delay':
        return `Wait ${step.delay}ms`
      default:
        return step.action
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center border-b border-white/10">
        <button
          onClick={() => setActiveTab('record')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'record' 
              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Circle className={`w-3 h-3 ${isMacroRecording ? 'fill-red-500 text-red-500 animate-pulse' : ''}`} />
            Record
          </div>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'library' 
              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <FolderOpen className="w-3 h-3" />
            Library ({macros.length})
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'record' ? (
          <div className="h-full flex flex-col p-3">
            {/* Recording Controls */}
            <div className="flex items-center gap-2 mb-4">
              {!isMacroRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="flex-1 glass-button-primary py-2 flex items-center justify-center gap-2"
                >
                  <Circle className="w-4 h-4 fill-current" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="flex-1 glass-button-danger py-2 flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Stop Recording
                </button>
              )}
            </div>

            {/* Recording Status */}
            {isMacroRecording && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Recording...</span>
                  <span className="text-xs text-red-400/70 ml-auto">
                    {currentRecording.length} steps captured
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Your actions are being recorded. Click "Stop" when done.
                </p>
              </div>
            )}

            {/* Save Form */}
            {!isMacroRecording && currentRecording.length > 0 && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Macro Name</label>
                  <input
                    type="text"
                    value={macroName}
                    onChange={(e) => setMacroName(e.target.value)}
                    placeholder="Enter macro name..."
                    className="w-full glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Description</label>
                  <input
                    type="text"
                    value={macroDescription}
                    onChange={(e) => setMacroDescription(e.target.value)}
                    placeholder="Enter description..."
                    className="w-full glass-input text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveMacro}
                    disabled={!macroName.trim()}
                    className="flex-1 glass-button-primary py-2 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Macro
                  </button>
                  <button
                    onClick={clearRecording}
                    className="glass-button py-2 px-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Recording Preview */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-xs font-medium text-white/60 mb-2">
                {currentRecording.length > 0 ? 'Recorded Steps' : 'No recording'}
              </h3>
              <div className="space-y-1">
                {currentRecording.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 p-2 bg-white/5 rounded text-xs"
                  >
                    <span className="text-white/40 w-6">{index + 1}.</span>
                    {getStepIcon(step)}
                    <span className="text-white/80">{getStepDescription(step)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-2">
            {macros.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No saved macros</p>
                <p className="text-xs mt-1 opacity-60">Record a macro to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {macros.map((macro) => (
                  <div
                    key={macro.id}
                    className={`border rounded-lg overflow-hidden ${
                      selectedMacro?.id === macro.id 
                        ? 'border-blue-500/50 bg-blue-500/10' 
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {/* Macro Header */}
                    <div
                      onClick={() => setSelectedMacro(selectedMacro?.id === macro.id ? null : macro)}
                      className="flex items-center gap-2 p-2 cursor-pointer hover:bg-white/5"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMacroExpansion(macro.id)
                        }}
                        className="p-0.5 hover:bg-white/10 rounded"
                      >
                        {expandedMacros.has(macro.id) ? (
                          <ChevronDown className="w-3 h-3 text-white/60" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-white/60" />
                        )}
                      </button>
                      
                      <span className="text-sm font-medium text-white/90 flex-1">{macro.name}</span>
                      
                      <span className="text-xs text-white/40">{macro.steps.length} steps</span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          runMacro(macro)
                        }}
                        disabled={activeMacro?.id === macro.id}
                        className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded"
                        title="Run Macro"
                      >
                        {activeMacro?.id === macro.id ? (
                          <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play className="w-3 h-3 text-green-400 fill-current" />
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMacro(macro.id)
                        }}
                        className="p-1.5 hover:bg-red-500/20 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>

                    {/* Expanded Content */}
                    {expandedMacros.has(macro.id) && (
                      <div className="border-t border-white/10 p-2 bg-black/20">
                        <p className="text-xs text-white/60 mb-2">{macro.description}</p>
                        <div className="space-y-1">
                          {macro.steps.slice(0, 5).map((step, idx) => (
                            <div
                              key={step.id}
                              className="flex items-center gap-2 text-xs text-white/50"
                            >
                              <span className="w-4">{idx + 1}.</span>
                              {getStepIcon(step)}
                              <span>{getStepDescription(step)}</span>
                            </div>
                          ))}
                          {macro.steps.length > 5 && (
                            <p className="text-xs text-white/30 pl-6">
                              ... and {macro.steps.length - 5} more steps
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-white/40">
                          <span>Created: {new Date(macro.createdAt).toLocaleDateString()}</span>
                          <span>Run {macro.timesRun} times</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MacroPanel
