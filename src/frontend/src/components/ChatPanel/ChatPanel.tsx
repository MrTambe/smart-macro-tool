import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  RotateCcw, 
  CheckCircle, 
  XCircle,
  Loader2,
  Volume2,
  VolumeX,
  Bot,
  User,
  MoreHorizontal,
  Download,
  Trash2,
  Shield,
  Zap,
  Brain
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { FormattedAIResponse, extractAIActions, prettifyJSONInResponse } from '../../utils/aiResponseFormatter'
import { useAppStore, ChatMessage, AIAction } from '../../hooks/useAppStore'
import { useAIStore } from '../../store/aiStore'
import useSpreadsheetStore from '../../store/spreadsheetStore'
import { useVoiceToText, useTextToVoice } from '../../hooks/useVoice'
import { getAIService } from '../../services/aiService'
import { getSystemAI } from '../../services/systemAIService'

const ChatPanel: React.FC = () => {
  const [input, setInput] = useState('')
  const [isAITyping, setIsAITyping] = useState(false)
  const [systemAIMessage, setSystemAIMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { 
    chatMessages, 
    addChatMessage, 
    updateChatMessage, 
    clearChat,
    isProcessing,
    setIsProcessing,
    currentFile
  } = useAppStore()

  const { systemAI, primaryProvider, pullProgress } = useAIStore()
  
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript,
    supported: voiceSupported 
  } = useVoiceToText()
  
  const { 
    speak, 
    stop: stopSpeaking, 
    isSpeaking,
    supported: ttsSupported 
  } = useTextToVoice()

  // Track system AI pull progress
  const systemAIPullProgress = pullProgress[systemAI.model]

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isAITyping, systemAIPullProgress])

  // Handle voice transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return

    const userPrompt = input.trim()
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userPrompt,
      timestamp: new Date(),
    }

    addChatMessage(userMessage)
    setInput('')
    resetTranscript()
    setIsProcessing(true)
    setIsAITyping(true)

    try {
      const systemAIService = getSystemAI()
      const aiService = getAIService()
      const spreadsheetStore = useSpreadsheetStore.getState()
      const activeFile = spreadsheetStore.getActiveFile()
      const activeSheet = spreadsheetStore.getActiveSheet()
      
      // Build spreadsheet context for AI
      let sheetContext = ''
      if (activeFile && activeSheet) {
        const selection = spreadsheetStore.selectedCells
        let selectionData = ''
        
        if (selection.length > 0 && selection.length < 100) {
          selectionData = `Selected Data:
          ${selection.map(id => `${id}: ${spreadsheetStore.getCellValue(activeFile.id, activeSheet.id, id)?.value || ''}`).join('\n')}`
        }

        sheetContext = `
        Current Workspace:
        File: ${activeFile.name}
        Sheet: ${activeSheet.name}
        Selection: ${selection.join(', ') || 'None'}
        ${selectionData}
        
        Sheet Content (Sample):
        ${Array.from(activeSheet.cells.entries()).slice(0, 50).map(([id, data]) => `${id}: ${data.value}`).join('\n')}
        `
      }

      // Step 1: System AI Prompt Enhancement
      let finalPrompt = userPrompt
      if (systemAI.enabled && systemAI.responsibilities.promptEnhancement) {
        setSystemAIMessage('🛡️ System AI is enhancing your request...')
        const enhancement = await systemAIService.enhancePrompt(userPrompt, {
            currentFile: activeFile?.name,
            selectedCells: spreadsheetStore.selectedCells,
            recentActions: chatMessages.slice(-3).map(m => m.content)
        })
        finalPrompt = enhancement.enhancedPrompt
        setTimeout(() => setSystemAIMessage(null), 2000)
      }

      // Step 2: Primary AI Request
      const response = await aiService.generateWithPrimary({
        prompt: finalPrompt,
        systemPrompt: `You are Mistral AI, an advanced spreadsheet assistant integrated into the Smart Macro Tool.
        You have direct control over the spreadsheet workspace.
        
        ${sheetContext}
        
        To perform actions, you MUST use the following JSON block format:
        
        \`\`\`json
        {
          "type": "edit",
          "description": "Short explanation",
          "payload": {
            "cellId": "A1",
            "value": "New Value"
          }
        }
        \`\`\`
        
        You can change values, format cells (fontWeight, fontStyle, backgroundColor, color), and merge cells.
        
        Always explain your actions clearly. You can suggest macros or formulas as well.`
      })

      if (response.error) throw new Error(response.error)

      // Step 3: Response Validation
      if (systemAI.enabled && systemAI.responsibilities.responseValidation) {
        const validation = await systemAIService.validateResponse(response.content)
        if (!validation.valid) {
            console.warn('[System AI] Response validation issues:', validation.issues)
        }
      }

      // Extract actions from response using improved formatter
      const { cleanedContent, actions } = extractAIActions(response.content)
      
      // Prettify any JSON in the response for better display
      const formattedContent = prettifyJSONInResponse(cleanedContent)

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formattedContent,
        timestamp: new Date(),
        actions: actions,
        status: actions.length > 0 ? 'pending' : 'completed',
      }

      addChatMessage(aiMessage)

      // Auto-speak if TTS is enabled
      if (ttsSupported) {
        speak(response.content)
      }
    } catch (error: any) {
      const errorReport = await getSystemAI().detectAndReportError(error as Error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'error',
        content: errorReport?.userFriendlyMessage || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      addChatMessage(errorMessage)
    } finally {
      setIsProcessing(false)
      setIsAITyping(false)
      setSystemAIMessage(null)
    }
  }

  const handleActionApproval = async (messageId: string, actionId: string, approved: boolean) => {
    const message = chatMessages.find(m => m.id === messageId)
    if (!message || !message.actions) return

    const updatedActions = message.actions.map(action => 
      action.id === actionId ? { ...action, approved } : action
    )

    updateChatMessage(messageId, { actions: updatedActions })

    if (approved) {
      // Execute the action
      const action = message.actions.find(a => a.id === actionId)
      if (action) {
        await executeAIAction(action)
      }
    }

    // Check if all actions are resolved
    const allResolved = updatedActions.every(a => a.approved !== undefined)
    if (allResolved) {
      updateChatMessage(messageId, { status: 'completed' })
    }
  }

  const executeAIAction = async (action: AIAction) => {
    const spreadsheetStore = useSpreadsheetStore.getState()
    const activeFile = spreadsheetStore.getActiveFile()
    const activeSheet = spreadsheetStore.getActiveSheet()
    
    console.log('[AI Action] Executing:', action)
    console.log('[AI Action] Active file:', activeFile?.name, 'Active sheet:', activeSheet?.name)
    
    if (!activeFile || !activeSheet) {
      console.warn('[AI Action] No active file or sheet!')
      return
    }

    setIsProcessing(true)
    try {
      const payload = action.payload || {}
      
      switch (action.type) {
        case 'edit':
          if (payload.cellId) {
            const value = payload.value ?? ''
            console.log('[AI Action] Setting cell:', payload.cellId, '=', value)
            spreadsheetStore.setCellValue(activeFile.id, activeSheet.id, payload.cellId, value)
          } else if (payload.cellIds && Array.isArray(payload.cellIds)) {
            if (action.description?.toLowerCase().includes('merge')) {
              spreadsheetStore.mergeCells(activeFile.id, activeSheet.id, payload.cellIds)
            } else {
              // Handle multiple cell operations
              for (const cellId of payload.cellIds) {
                spreadsheetStore.setCellValue(activeFile.id, activeSheet.id, cellId, payload.value ?? '')
              }
            }
          }
          break
          
        case 'format':
          if (payload.cellId && payload.style) {
            spreadsheetStore.setCellStyle(activeFile.id, activeSheet.id, payload.cellId, payload.style)
          } else if (payload.style) {
            spreadsheetStore.applyStyleToSelection(payload.style)
          }
          break
          
        default:
          console.warn('[AI Action] Unsupported action type:', action.type)
      }
      spreadsheetStore.markFileModified(activeFile.id, true)
    } catch (error) {
      console.error('[AI Action] Action execution error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleFileAttach = () => {
    fileInputRef.current?.click()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date(date))
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-white/90">AI Assistant</h2>
          {isAITyping && (
            <span className="text-xs text-blue-400 animate-pulse">typing...</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 mr-2 px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${systemAI.enabled && systemAI.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span className="text-[10px] text-white/50 uppercase font-bold">System AI</span>
          </div>
          <button
            onClick={clearChat}
            className="p-1.5 hover:bg-white/10 rounded"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {chatMessages.length === 0 && (
          <div className="text-center py-8 text-white/40">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">How can I help you today?</p>
            <p className="text-xs mt-2 opacity-60">
              Provider: <span className="text-blue-400 capitalize">{primaryProvider}</span>
            </p>
          </div>
        )}

        {chatMessages.map((message) => (
          <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'user' 
                ? 'bg-blue-500/30' 
                : message.role === 'error'
                ? 'bg-red-500/30'
                : 'bg-purple-500/30'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-blue-400" />
              ) : message.role === 'error' ? (
                <XCircle className="w-4 h-4 text-red-400" />
              ) : (
                <Bot className="w-4 h-4 text-purple-400" />
              )}
            </div>
            
            <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`glass-panel p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-500/20 border-blue-500/30' 
                  : message.role === 'error'
                  ? 'bg-red-500/20 border-red-500/30'
                  : ''
              }`}>
                {message.role === 'user' ? (
                  <p className="text-sm text-white/90 whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <FormattedAIResponse content={message.content} />
                )}
                
                {/* AI Actions Approval UI */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-white/10 pt-2">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                      Suggested Actions
                    </p>
                    {message.actions.map((action) => (
                      <div key={action.id} className="flex flex-col gap-2 p-2 bg-white/5 rounded border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/80">{action.description}</span>
                          <div className="flex gap-1">
                            {action.approved === undefined ? (
                              <>
                                <button
                                  onClick={() => handleActionApproval(message.id, action.id, true)}
                                  className="p-1 hover:bg-green-500/20 text-green-400 rounded transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleActionApproval(message.id, action.id, false)}
                                  className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            ) : action.approved ? (
                              <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Approved
                              </span>
                            ) : (
                              <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Rejected
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Action Preview */}
                        <div className="text-[10px] font-mono text-white/40 bg-black/20 p-1 rounded overflow-x-auto">
                          {JSON.stringify(action.payload)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-white/40 mt-1">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        ))}
        
        {systemAIMessage && (
          <div className="flex gap-2 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div className="glass-panel p-2 bg-blue-500/10 border-blue-500/20">
              <p className="text-xs text-blue-300 italic">{systemAIMessage}</p>
            </div>
          </div>
        )}

        {systemAIPullProgress !== undefined && (
          <div className="flex gap-2 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-yellow-500/30 flex items-center justify-center">
              <Download className="w-4 h-4 text-yellow-400 animate-bounce" />
            </div>
            <div className="glass-panel p-3 bg-yellow-500/10 border-yellow-500/20 w-full max-w-[200px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-yellow-300 font-bold">Downloading AI...</span>
                <span className="text-xs text-yellow-300">{systemAIPullProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-300" 
                  style={{ width: `${systemAIPullProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-white/40 mt-2 italic">
                Pulling {systemAI.model} from Ollama...
              </p>
            </div>
          </div>
        )}

        {isAITyping && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="glass-panel p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? 'Listening...' : 'Type a message...'}
              disabled={isProcessing}
              className="w-full glass-input resize-none min-h-[40px] max-h-32 pr-10"
              rows={1}
            />
            {voiceSupported && (
              <button
                onClick={handleVoiceToggle}
                disabled={isProcessing}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                  isListening 
                    ? 'text-red-400 bg-red-400/20 animate-pulse' 
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
            )}
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className="glass-button-primary p-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatPanel
