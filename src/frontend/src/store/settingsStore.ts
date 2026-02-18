import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SettingsState {
  // General Settings
  autoSave: boolean
  autoSaveInterval: number
  defaultFont: string
  defaultFontSize: number
  language: string
  showWelcomeScreen: boolean
  
  // Appearance Settings
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  toolbarFontColor: string
  toolbarBgColor: string
  enableAnimations: boolean
  compactMode: boolean
  showGridLines: boolean
  gridSnapSensitivity: number
  
  // Accessibility Settings
  enableTTS: boolean
  enableSTT: boolean
  ttsRate: number
  ttsPitch: number
  enableDynamicContrast: boolean
  highContrastMode: boolean
  largeTextMode: boolean
  keyboardShortcuts: boolean
  screenReaderOptimized: boolean
  
  // System Settings
  backendPort: number
  backendHost: string
  enableWebSocket: boolean
  dataSync: boolean
  debugMode: boolean
  clearCache: () => void
  
  // UI State
  isSettingsOpen: boolean
  activeSettingsTab: string
  
  // Actions
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  updateMultipleSettings: (settings: Partial<SettingsState>) => void
  resetToDefaults: () => void
  openSettings: () => void
  closeSettings: () => void
  setActiveTab: (tab: string) => void
  testBackendConnection: () => Promise<boolean>
  
  // Dummy feature handlers
  triggerDummyFeature: (featureName: string) => void
}

const defaultSettings: Omit<SettingsState, 
  'updateSetting' | 'updateMultipleSettings' | 'resetToDefaults' | 
  'openSettings' | 'closeSettings' | 'setActiveTab' | 'testBackendConnection' | 
  'triggerDummyFeature' | 'clearCache'
> = {
  // General
  autoSave: true,
  autoSaveInterval: 30,
  defaultFont: 'Arial',
  defaultFontSize: 11,
  language: 'en',
  showWelcomeScreen: true,
  
  // Appearance
  theme: 'light',
  accentColor: '#0066cc',
  toolbarFontColor: '#374151',
  toolbarBgColor: '#f9fafb',
  enableAnimations: true,
  compactMode: false,
  showGridLines: true,
  gridSnapSensitivity: 10,
  
  // Accessibility
  enableTTS: true,
  enableSTT: true,
  ttsRate: 1,
  ttsPitch: 1,
  enableDynamicContrast: true,
  highContrastMode: false,
  largeTextMode: false,
  keyboardShortcuts: true,
  screenReaderOptimized: false,
  
  // System
  backendPort: 8000,
  backendHost: 'localhost',
  enableWebSocket: true,
  dataSync: true,
  debugMode: false,
  
  // UI State
  isSettingsOpen: false,
  activeSettingsTab: 'general',
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      
      updateSetting: (key, value) => {
        set({ [key]: value } as Partial<SettingsState>)
        console.log(`[Settings] ${String(key)} changed to:`, value)
      },
      
      updateMultipleSettings: (settings) => {
        set(settings)
        console.log('[Settings] Multiple settings updated:', settings)
      },
      
      resetToDefaults: () => {
        set({
          ...defaultSettings,
          isSettingsOpen: true, // Keep settings open
          activeSettingsTab: get().activeSettingsTab, // Keep current tab
        })
        console.log('[Settings] Reset to defaults')
      },
      
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      setActiveTab: (tab) => set({ activeSettingsTab: tab }),
      
      testBackendConnection: async () => {
        const { backendHost, backendPort } = get()
        try {
          const response = await fetch(`http://${backendHost}:${backendPort}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          })
          return response.ok
        } catch (error) {
          console.error('[Settings] Backend connection test failed:', error)
          return false
        }
      },
      
      triggerDummyFeature: (featureName) => {
        console.log(`[Settings] Dummy feature triggered: ${featureName}`)
        // This will be connected to toast notifications
      },
      
      clearCache: () => {
        console.log('[Settings] Clearing cache...')
        // Clear localStorage except settings
        const settings = localStorage.getItem('app-settings')
        localStorage.clear()
        if (settings) {
          localStorage.setItem('app-settings', settings)
        }
      },
    }),
    {
      name: 'app-settings',
      partialize: (state) => ({
        autoSave: state.autoSave,
        autoSaveInterval: state.autoSaveInterval,
        defaultFont: state.defaultFont,
        defaultFontSize: state.defaultFontSize,
        language: state.language,
        showWelcomeScreen: state.showWelcomeScreen,
        theme: state.theme,
        accentColor: state.accentColor,
        toolbarFontColor: state.toolbarFontColor,
        toolbarBgColor: state.toolbarBgColor,
        enableAnimations: state.enableAnimations,
        compactMode: state.compactMode,
        showGridLines: state.showGridLines,
        gridSnapSensitivity: state.gridSnapSensitivity,
        enableTTS: state.enableTTS,
        enableSTT: state.enableSTT,
        ttsRate: state.ttsRate,
        ttsPitch: state.ttsPitch,
        enableDynamicContrast: state.enableDynamicContrast,
        highContrastMode: state.highContrastMode,
        largeTextMode: state.largeTextMode,
        keyboardShortcuts: state.keyboardShortcuts,
        screenReaderOptimized: state.screenReaderOptimized,
        backendPort: state.backendPort,
        backendHost: state.backendHost,
        enableWebSocket: state.enableWebSocket,
        dataSync: state.dataSync,
        debugMode: state.debugMode,
      }),
    }
  )
)

export default useSettingsStore
