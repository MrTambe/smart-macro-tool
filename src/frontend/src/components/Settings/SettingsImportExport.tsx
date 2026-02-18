import React, { useState } from 'react'
import { 
  Download, 
  Upload, 
  FileJson, 
  Check, 
  AlertCircle,
  RotateCcw,
  Save,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { useToast } from '../../contexts/ToastContext'

const SettingsImportExport: React.FC = () => {
  const settings = useSettingsStore()
  const { showSuccess, showError, showInfo } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<any>(null)
  const [showImportModal, setShowImportModal] = useState(false)

  // Export settings to JSON file
  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      // Get all settings except actions and UI state
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        settings: {
          // General
          autoSave: settings.autoSave,
          autoSaveInterval: settings.autoSaveInterval,
          defaultFont: settings.defaultFont,
          defaultFontSize: settings.defaultFontSize,
          language: settings.language,
          showWelcomeScreen: settings.showWelcomeScreen,
          
          // Appearance
          theme: settings.theme,
          accentColor: settings.accentColor,
          toolbarFontColor: settings.toolbarFontColor,
          toolbarBgColor: settings.toolbarBgColor,
          enableAnimations: settings.enableAnimations,
          compactMode: settings.compactMode,
          showGridLines: settings.showGridLines,
          gridSnapSensitivity: settings.gridSnapSensitivity,
          
          // Accessibility
          enableTTS: settings.enableTTS,
          enableSTT: settings.enableSTT,
          ttsRate: settings.ttsRate,
          ttsPitch: settings.ttsPitch,
          enableDynamicContrast: settings.enableDynamicContrast,
          highContrastMode: settings.highContrastMode,
          largeTextMode: settings.largeTextMode,
          keyboardShortcuts: settings.keyboardShortcuts,
          screenReaderOptimized: settings.screenReaderOptimized,
          
          // System
          backendPort: settings.backendPort,
          backendHost: settings.backendHost,
          enableWebSocket: settings.enableWebSocket,
          dataSync: settings.dataSync,
          debugMode: settings.debugMode,
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `smart-macro-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showSuccess('Settings exported successfully')
    } catch (error) {
      showError('Failed to export settings')
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Copy settings to clipboard
  const handleCopyToClipboard = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: {
        autoSave: settings.autoSave,
        autoSaveInterval: settings.autoSaveInterval,
        theme: settings.theme,
        accentColor: settings.accentColor,
        language: settings.language,
        backendPort: settings.backendPort,
        backendHost: settings.backendHost,
      }
    }

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
      .then(() => showSuccess('Settings copied to clipboard'))
      .catch(() => showError('Failed to copy settings'))
  }

  // Handle file import
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content)
        
        // Validate structure
        if (!parsed.settings || typeof parsed.settings !== 'object') {
          throw new Error('Invalid settings file format')
        }

        setImportPreview(parsed)
        setShowImportModal(true)
        showInfo(`Found ${Object.keys(parsed.settings).length} settings to import`)
      } catch (error) {
        showError('Invalid settings file. Please check the file format.')
        console.error('Import error:', error)
      } finally {
        setIsImporting(false)
        // Reset input
        event.target.value = ''
      }
    }

    reader.onerror = () => {
      showError('Failed to read file')
      setIsImporting(false)
    }

    reader.readAsText(file)
  }

  // Apply imported settings
  const applyImport = () => {
    if (!importPreview?.settings) return

    try {
      const imported = importPreview.settings
      
      // Apply each setting if it exists in the import
      if (imported.autoSave !== undefined) settings.updateSetting('autoSave', imported.autoSave)
      if (imported.autoSaveInterval !== undefined) settings.updateSetting('autoSaveInterval', imported.autoSaveInterval)
      if (imported.defaultFont !== undefined) settings.updateSetting('defaultFont', imported.defaultFont)
      if (imported.defaultFontSize !== undefined) settings.updateSetting('defaultFontSize', imported.defaultFontSize)
      if (imported.language !== undefined) settings.updateSetting('language', imported.language)
      if (imported.showWelcomeScreen !== undefined) settings.updateSetting('showWelcomeScreen', imported.showWelcomeScreen)
      
      if (imported.theme !== undefined) settings.updateSetting('theme', imported.theme)
      if (imported.accentColor !== undefined) settings.updateSetting('accentColor', imported.accentColor)
      if (imported.toolbarFontColor !== undefined) settings.updateSetting('toolbarFontColor', imported.toolbarFontColor)
      if (imported.toolbarBgColor !== undefined) settings.updateSetting('toolbarBgColor', imported.toolbarBgColor)
      if (imported.enableAnimations !== undefined) settings.updateSetting('enableAnimations', imported.enableAnimations)
      if (imported.compactMode !== undefined) settings.updateSetting('compactMode', imported.compactMode)
      if (imported.showGridLines !== undefined) settings.updateSetting('showGridLines', imported.showGridLines)
      if (imported.gridSnapSensitivity !== undefined) settings.updateSetting('gridSnapSensitivity', imported.gridSnapSensitivity)
      
      if (imported.enableTTS !== undefined) settings.updateSetting('enableTTS', imported.enableTTS)
      if (imported.enableSTT !== undefined) settings.updateSetting('enableSTT', imported.enableSTT)
      if (imported.ttsRate !== undefined) settings.updateSetting('ttsRate', imported.ttsRate)
      if (imported.ttsPitch !== undefined) settings.updateSetting('ttsPitch', imported.ttsPitch)
      if (imported.enableDynamicContrast !== undefined) settings.updateSetting('enableDynamicContrast', imported.enableDynamicContrast)
      if (imported.highContrastMode !== undefined) settings.updateSetting('highContrastMode', imported.highContrastMode)
      if (imported.largeTextMode !== undefined) settings.updateSetting('largeTextMode', imported.largeTextMode)
      if (imported.keyboardShortcuts !== undefined) settings.updateSetting('keyboardShortcuts', imported.keyboardShortcuts)
      if (imported.screenReaderOptimized !== undefined) settings.updateSetting('screenReaderOptimized', imported.screenReaderOptimized)
      
      if (imported.backendPort !== undefined) settings.updateSetting('backendPort', imported.backendPort)
      if (imported.backendHost !== undefined) settings.updateSetting('backendHost', imported.backendHost)
      if (imported.enableWebSocket !== undefined) settings.updateSetting('enableWebSocket', imported.enableWebSocket)
      if (imported.dataSync !== undefined) settings.updateSetting('dataSync', imported.dataSync)
      if (imported.debugMode !== undefined) settings.updateSetting('debugMode', imported.debugMode)

      showSuccess('Settings imported successfully!')
      setShowImportModal(false)
      setImportPreview(null)
    } catch (error) {
      showError('Failed to apply settings')
      console.error('Apply import error:', error)
    }
  }

  // Cancel import
  const cancelImport = () => {
    setShowImportModal(false)
    setImportPreview(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Import & Export Settings</h3>
        <p className="text-sm text-gray-500">
          Backup your settings or transfer them to another device
        </p>
      </div>

      {/* Export Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Export Settings</h4>
            <p className="text-sm text-gray-500 mt-1">
              Save your current settings to a JSON file for backup or transfer
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {isExporting ? (
                  <RotateCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export to File'}
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Upload className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Import Settings</h4>
            <p className="text-sm text-gray-500 mt-1">
              Restore settings from a previously exported file
            </p>
            <div className="mt-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer text-sm font-medium inline-flex">
                <Upload className="w-4 h-4" />
                {isImporting ? 'Reading...' : 'Select File'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Supported format: JSON files exported from Smart Macro Tool
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileJson className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900">What's Included</h4>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• General preferences (auto-save, fonts, language)</li>
              <li>• Appearance settings (theme, colors, layout)</li>
              <li>• Accessibility options (TTS, STT, contrast)</li>
              <li>• System configuration (backend, sync)</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              Note: AI provider API keys and cloud credentials are not included for security reasons.
            </p>
          </div>
        </div>
      </div>

      {/* Import Preview Modal */}
      {showImportModal && importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Import Settings</h4>
              <p className="text-sm text-gray-500 mt-1">
                Review the settings before applying
              </p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {Object.entries(importPreview.settings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className="text-sm text-gray-500 font-mono">
                      {typeof value === 'boolean' 
                        ? (value ? 'Enabled' : 'Disabled')
                        : String(value)
                      }
                    </span>
                  </div>
                ))}
              </div>
              
              {importPreview.exportedAt && (
                <p className="text-xs text-gray-400 mt-4">
                  Exported on: {new Date(importPreview.exportedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={cancelImport}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={applyImport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsImportExport
