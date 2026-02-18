import { useState, useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import FileExplorer from './components/FileExplorer/FileExplorer'
import SpreadsheetEditor from './components/SpreadsheetEditor/SpreadsheetEditor'
import ChatPanel from './components/ChatPanel/ChatPanel'
import MacroPanel from './components/MacroPanel/MacroPanel'
import TopBar from './components/TopBar/TopBar'
import StatusBar from './components/StatusBar/StatusBar'
import SettingsMenu from './components/Settings/SettingsMenu'
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen'
import OnboardingOverlay from './components/Onboarding/OnboardingOverlay'
import { useAppStore } from './hooks/useAppStore'
import { useSettingsStore } from './store/settingsStore'
import { useAIInitialization } from './hooks/useAIInitialization'
import { Loader2, PanelLeft } from 'lucide-react'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [showFileExplorer, setShowFileExplorer] = useState(true)
  const [showWelcome, setShowWelcome] = useState(true)
  const { 
    currentFile, 
    fileType, 
    isMacroRecording, 
    backendStatus,
    checkBackendStatus,
    setCurrentFile,
    setFileType,
    addRecentFile,
    recentFiles
  } = useAppStore()
  
  const { isSettingsOpen, backendPort, backendHost } = useSettingsStore()

  // Initialize AI providers
  const { isDetecting: isAIDetecting, detectionResults } = useAIInitialization()

  // Check backend on mount and when settings change
  useEffect(() => {
    const init = async () => {
      try {
        await checkBackendStatus()
        // Auto-create a new spreadsheet on startup if no file is open
        if (!currentFile) {
          handleCreateNew()
        }
      } catch (err) {
        setInitError('Failed to connect to backend. Some features may not work.')
        console.error('Backend connection error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [backendPort, backendHost]) // Re-check when port/host changes

  // Handle creating a new spreadsheet
  const handleCreateNew = () => {
    const newFile = {
      id: Date.now().toString(),
      name: 'Untitled Spreadsheet',
      path: '',
      type: 'file' as const,
      extension: 'xlsx'
    }
    setCurrentFile(newFile)
    setFileType('spreadsheet')
    setShowWelcome(false)
  }

  // Handle opening a file
  const handleOpenFile = () => {
    // This will be handled by the file dialog
    // For now, just hide welcome screen
    setShowWelcome(false)
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Smart Macro Tool</h1>
          <p className="text-gray-400">Initializing...</p>
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Connection Error</h1>
          <p className="text-gray-400 mb-4">{initError}</p>
          <p className="text-sm text-gray-500 mb-4">
            Please ensure the backend server is running on http://{backendHost}:{backendPort}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300 flex flex-col overflow-hidden">
      <OnboardingOverlay />
      <TopBar onToggleSidebar={() => setShowFileExplorer(!showFileExplorer)} isSidebarVisible={showFileExplorer} />
      
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar - File Explorer */}
          {showFileExplorer && (
            <>
              <Panel defaultSize={15} minSize={10} maxSize={25}>
                <div className="h-full glass-dark m-1 mr-0 rounded-lg overflow-hidden">
                  <FileExplorer onClose={() => setShowFileExplorer(false)} />
                </div>
              </Panel>
              
              <PanelResizeHandle className="w-1 hover:bg-blue-500/50 transition-colors" />
            </>
          )}
          
          {/* Main Content Area */}
          <Panel defaultSize={55} minSize={30}>
            <div className="h-full flex flex-col m-1 mx-0">
              {/* Editor Area */}
              <div className="flex-1 glass rounded-lg overflow-hidden bg-white">
                {showWelcome && !currentFile ? (
                  <WelcomeScreen 
                    onCreateNew={handleCreateNew}
                    onOpenFile={handleOpenFile}
                    recentFiles={recentFiles}
                  />
                ) : fileType === 'spreadsheet' ? (
                  <SpreadsheetEditor fileName={currentFile?.name || 'Untitled Spreadsheet'} />
                ) : fileType === 'document' ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Document editor coming soon...
                  </div>
                ) : (
                  <WelcomeScreen 
                    onCreateNew={handleCreateNew}
                    onOpenFile={handleOpenFile}
                    recentFiles={recentFiles}
                  />
                )}
              </div>
              
              {/* Macro Panel */}
              <div className="h-48 glass mt-2 rounded-lg overflow-hidden">
                <MacroPanel />
              </div>
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-1 hover:bg-blue-500/50 transition-colors" />
          
          {/* Right Sidebar - Chat Panel */}
          <Panel defaultSize={30} minSize={20} maxSize={40}>
            <div className="h-full glass-dark m-1 ml-0 rounded-lg overflow-hidden">
              <ChatPanel />
            </div>
          </Panel>
        </PanelGroup>
      </div>
      
      <StatusBar 
        backendStatus={backendStatus}
        isMacroRecording={isMacroRecording}
      />
      
      {/* Settings Menu Modal */}
      {isSettingsOpen && <SettingsMenu />}
    </div>
  )
}

export default App
