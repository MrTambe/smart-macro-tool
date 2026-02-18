import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface FileItem {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  extension?: string
  size?: number
  modifiedAt?: Date
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'error'
  content: string
  timestamp: Date
  actions?: AIAction[]
  status?: 'pending' | 'completed' | 'error'
}

export interface AIAction {
  id: string
  type: 'edit' | 'format' | 'create' | 'delete' | 'macro' | 'suggestion'
  description: string
  payload?: any
  approved?: boolean
}

export interface Macro {
  id: string
  name: string
  description: string
  steps: MacroStep[]
  createdAt: Date
  updatedAt: Date
  timesRun: number
}

export interface MacroStep {
  id: string
  type: 'keyboard' | 'mouse' | 'delay' | 'edit' | 'format'
  action: string
  payload?: any
  delay?: number
}

export interface AppState {
  // File State
  currentFile: FileItem | null
  fileType: 'spreadsheet' | 'document' | 'csv' | null
  recentFiles: FileItem[]
  workspacePath: string
  
  // Chat State
  chatMessages: ChatMessage[]
  isChatLoading: boolean
  chatHistory: { id: string; name: string; date: Date }[]
  
  // Macro State
  macros: Macro[]
  isMacroRecording: boolean
  currentRecording: MacroStep[]
  activeMacro: Macro | null
  
  // UI State
  backendStatus: 'connected' | 'disconnected' | 'error'
  isProcessing: boolean
  
  // Actions
  setCurrentFile: (file: FileItem | null) => void
  setFileType: (type: 'spreadsheet' | 'document' | 'csv' | null) => void
  addRecentFile: (file: FileItem) => void
  setWorkspacePath: (path: string) => void
  
  addChatMessage: (message: ChatMessage) => void
  updateChatMessage: (id: string, updates: Partial<ChatMessage>) => void
  clearChat: () => void
  saveChatHistory: (name: string) => void
  loadChatHistory: (id: string) => void
  
  addMacro: (macro: Macro) => void
  updateMacro: (id: string, updates: Partial<Macro>) => void
  deleteMacro: (id: string) => void
  startRecording: () => void
  stopRecording: () => void
  addRecordingStep: (step: MacroStep) => void
  clearRecording: () => void
  runMacro: (macro: Macro) => Promise<void>
  
  checkBackendStatus: () => Promise<void>
  setBackendStatus: (status: 'connected' | 'disconnected' | 'error') => void
  setIsProcessing: (isProcessing: boolean) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        currentFile: null,
        fileType: null,
        recentFiles: [],
        workspacePath: '',
        
        chatMessages: [],
        isChatLoading: false,
        chatHistory: [],
        
        macros: [],
        isMacroRecording: false,
        currentRecording: [],
        activeMacro: null,
        
        backendStatus: 'disconnected',
        isProcessing: false,
        
        // Actions
        setCurrentFile: (file) => set({ currentFile: file }),
        
        setFileType: (type) => set({ fileType: type }),
        
        addRecentFile: (file) => set((state) => ({
          recentFiles: [file, ...state.recentFiles.filter(f => f.path !== file.path)].slice(0, 10)
        })),
        
        setWorkspacePath: (path) => set({ workspacePath: path }),
        
        addChatMessage: (message) => set((state) => ({
          chatMessages: [...state.chatMessages, message]
        })),
        
        updateChatMessage: (id, updates) => set((state) => ({
          chatMessages: state.chatMessages.map(msg => 
            msg.id === id ? { ...msg, ...updates } : msg
          )
        })),
        
        clearChat: () => set({ chatMessages: [] }),
        
        saveChatHistory: (name) => {
          const state = get()
          const historyItem = {
            id: Date.now().toString(),
            name,
            date: new Date(),
            messages: state.chatMessages
          }
          // Save to local storage or backend
          set((state) => ({
            chatHistory: [...state.chatHistory, historyItem]
          }))
        },
        
        loadChatHistory: (id) => {
          // Load from storage
        },
        
        addMacro: (macro) => set((state) => ({
          macros: [...state.macros, macro]
        })),
        
        updateMacro: (id, updates) => set((state) => ({
          macros: state.macros.map(m => m.id === id ? { ...m, ...updates } : m)
        })),
        
        deleteMacro: (id) => set((state) => ({
          macros: state.macros.filter(m => m.id !== id)
        })),
        
        startRecording: () => set({ 
          isMacroRecording: true, 
          currentRecording: [] 
        }),
        
        stopRecording: () => set({ isMacroRecording: false }),
        
        addRecordingStep: (step) => set((state) => ({
          currentRecording: [...state.currentRecording, step]
        })),
        
        clearRecording: () => set({ currentRecording: [] }),
        
        runMacro: async (macro) => {
          set({ activeMacro: macro, isProcessing: true })
          try {
            // Execute macro steps
            for (const step of macro.steps) {
              // Execute each step
              await new Promise(resolve => setTimeout(resolve, step.delay || 100))
            }
            // Update run count
            get().updateMacro(macro.id, { 
              timesRun: macro.timesRun + 1,
              updatedAt: new Date()
            })
          } finally {
            set({ activeMacro: null, isProcessing: false })
          }
        },
        
        checkBackendStatus: async () => {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)
            const API_BASE = import.meta.env.DEV ? '/api' : 'http://localhost:8000/api'
            const response = await fetch(`${API_BASE}/health`, { signal: controller.signal })
            clearTimeout(timeoutId)
            if (response.ok) {
              set({ backendStatus: 'connected' })
            } else {
              set({ backendStatus: 'disconnected' })
            }
          } catch {
            set({ backendStatus: 'disconnected' })
          }
        },
        
        setBackendStatus: (status) => set({ backendStatus: status }),
        
        setIsProcessing: (isProcessing) => set({ isProcessing }),
      }),
      {
        name: 'smart-macro-storage',
        partialize: (state) => ({
          recentFiles: state.recentFiles,
          workspacePath: state.workspacePath,
          macros: state.macros,
          chatHistory: state.chatHistory,
        }),
      }
    )
  )
)
