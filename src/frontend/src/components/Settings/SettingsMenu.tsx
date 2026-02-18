import React, { useState } from 'react'
import { 
  X, 
  Settings, 
  Palette, 
  Globe, 
  Accessibility, 
  Cpu,
  Check,
  RefreshCw,
  AlertCircle,
  Info,
  Volume2,
  Mic,
  Contrast,
  Languages,
  Type,
  Grid3X3,
  Save,
  Keyboard,
  Monitor,
  Wifi,
  Database,
  Bug,
  Trash2,
  RotateCcw,
  ChevronDown,
  Brain,
  Calculator,
  Cloud,
  Command,
  Download
} from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { useToast } from '../../contexts/ToastContext'
import AISettings from './AISettings'
import KeyboardShortcuts from './KeyboardShortcuts'
import SettingsImportExport from './SettingsImportExport'
import FormulaSettings from './FormulaSettings'
import CloudProvidersSettings from './CloudProvidersSettings'

interface TooltipProps {
  text: string
  children: React.ReactNode
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [show, setShow] = useState(false)
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  )
}

const Toggle: React.FC<{
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}> = ({ checked, onChange, label, description, disabled }) => (
  <div className={`flex items-center justify-between py-3 ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-blue-600' : 'bg-gray-200'}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  </div>
)

const Slider: React.FC<{
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  label: string
  description?: string
  suffix?: string
}> = ({ value, onChange, min, max, step = 1, label, description, suffix }) => (
  <div className="py-3">
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <span className="text-sm text-gray-600 font-mono">
        {value}{suffix}
      </span>
    </div>
    {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />
  </div>
)

const Select: React.FC<{
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  label: string
  description?: string
}> = ({ value, onChange, options, label, description }) => (
  <div className="py-3">
    <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
    {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  </div>
)

const Button: React.FC<{
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  className?: string
}> = ({ onClick, variant = 'secondary', size = 'md', children, icon, disabled, className }) => {
  const baseStyles = 'inline-flex items-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
    >
      {icon}
      {children}
    </button>
  )
}

const SettingsMenu: React.FC = () => {
  const { 
    isSettingsOpen, 
    closeSettings, 
    activeSettingsTab, 
    setActiveTab,
    ...settings
  } = useSettingsStore()
  
  const { showSuccess, showError, showInfo, showWarning } = useToast()
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null)
  
  if (!isSettingsOpen) return null
  
  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    settings.updateSetting(key, value)
    showSuccess(`${key} updated successfully`)
  }
  
  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus(null)
    
    const isConnected = await settings.testBackendConnection()
    setConnectionStatus(isConnected)
    setTestingConnection(false)
    
    if (isConnected) {
      showSuccess(`Successfully connected to backend on port ${settings.backendPort}`)
    } else {
      showError(`Failed to connect to backend on port ${settings.backendPort}. Please check if the server is running.`)
    }
  }
  
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      settings.resetToDefaults()
      showSuccess('All settings reset to default values')
    }
  }
  
  const handleDummyFeature = (featureName: string) => {
    showInfo(`${featureName} - Feature coming soon!`)
    settings.triggerDummyFeature(featureName)
  }
  
  const handleClearCache = () => {
    settings.clearCache()
    showSuccess('Cache cleared successfully')
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'ai', label: 'AI Configuration', icon: Brain },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'shortcuts', label: 'Shortcuts', icon: Command },
    { id: 'formulas', label: 'Formulas', icon: Calculator },
    { id: 'cloud', label: 'Cloud Sync', icon: Cloud },
    { id: 'system', label: 'System', icon: Cpu },
    { id: 'backup', label: 'Backup', icon: Download },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
            <p className="text-xs text-gray-500 mt-1">Customize your workspace</p>
          </div>
          
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${activeSettingsTab === tab.id 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200 space-y-2">
            <Button 
              onClick={handleReset} 
              variant="danger" 
              size="sm" 
              icon={<RotateCcw className="w-4 h-4" />}
              className="w-full justify-center"
            >
              Reset to Default
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {tabs.find(t => t.id === activeSettingsTab)?.label}
              </h3>
              <p className="text-sm text-gray-500">
                {activeSettingsTab === 'general' && 'Manage general application settings'}
                {activeSettingsTab === 'ai' && 'Configure AI providers and System AI assistant'}
                {activeSettingsTab === 'appearance' && 'Customize the look and feel'}
                {activeSettingsTab === 'accessibility' && 'Configure accessibility features'}
                {activeSettingsTab === 'shortcuts' && 'View and learn keyboard shortcuts'}
                {activeSettingsTab === 'formulas' && 'Configure formula calculation and formatting'}
                {activeSettingsTab === 'cloud' && 'Manage cloud storage connections'}
                {activeSettingsTab === 'system' && 'System and backend configuration'}
                {activeSettingsTab === 'backup' && 'Import, export, and backup settings'}
              </p>
            </div>
            <button
              onClick={closeSettings}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* AI Settings */}
            {activeSettingsTab === 'ai' && (
              <AISettings />
            )}

            {/* Keyboard Shortcuts */}
            {activeSettingsTab === 'shortcuts' && (
              <KeyboardShortcuts />
            )}

            {/* Formula Settings */}
            {activeSettingsTab === 'formulas' && (
              <FormulaSettings />
            )}

            {/* Cloud Providers */}
            {activeSettingsTab === 'cloud' && (
              <CloudProvidersSettings />
            )}

            {/* Import/Export Settings */}
            {activeSettingsTab === 'backup' && (
              <SettingsImportExport />
            )}

            {/* General Settings */}
            {activeSettingsTab === 'general' && (
              <div className="space-y-6">
                <section>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Auto-Save
                  </h4>
                  <Toggle
                    checked={settings.autoSave}
                    onChange={(v) => handleSettingChange('autoSave', v)}
                    label="Enable Auto-save"
                    description="Automatically save your work at regular intervals"
                  />
                  <Slider
                    value={settings.autoSaveInterval}
                    onChange={(v) => handleSettingChange('autoSaveInterval', v)}
                    min={10}
                    max={300}
                    step={10}
                    label="Auto-save Interval"
                    description="How often to auto-save (in seconds)"
                    suffix="s"
                  />
                </section>
                
                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Default Typography
                  </h4>
                  <Select
                    value={settings.defaultFont}
                    onChange={(v) => handleSettingChange('defaultFont', v)}
                    label="Default Font"
                    description="Font used for new documents"
                    options={[
                      { value: 'Arial', label: 'Arial' },
                      { value: 'Helvetica', label: 'Helvetica' },
                      { value: 'Times New Roman', label: 'Times New Roman' },
                      { value: 'Courier New', label: 'Courier New' },
                      { value: 'Georgia', label: 'Georgia' },
                    ]}
                  />
                  <Slider
                    value={settings.defaultFontSize}
                    onChange={(v) => handleSettingChange('defaultFontSize', v)}
                    min={8}
                    max={72}
                    step={1}
                    label="Default Font Size"
                    suffix="pt"
                  />
                </section>
                
                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Language & Region
                  </h4>
                  <Select
                    value={settings.language}
                    onChange={(v) => handleSettingChange('language', v)}
                    label="Language"
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Español' },
                      { value: 'fr', label: 'Français' },
                      { value: 'de', label: 'Deutsch' },
                      { value: 'zh', label: '中文' },
                    ]}
                  />
                  <Tooltip text="Feature coming soon!">
                    <div className="mt-4">
                      <Button 
                        onClick={() => handleDummyFeature('Regional Settings')} 
                        variant="secondary" 
                        size="sm"
                        icon={<Globe className="w-4 h-4" />}
                      >
                        Configure Regional Settings
                      </Button>
                    </div>
                  </Tooltip>
                </section>
                
                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                    Onboarding
                  </h4>
                  <Toggle
                    checked={settings.showWelcomeScreen}
                    onChange={(v) => handleSettingChange('showWelcomeScreen', v)}
                    label="Show Welcome Screen"
                    description="Display welcome screen on startup"
                  />
                </section>
              </div>
            )}
            
            {/* Appearance Settings */}
            {activeSettingsTab === 'appearance' && (
              <div className="space-y-6">
                <section>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Theme
                  </h4>
                  <Select
                    value={settings.theme}
                    onChange={(v) => handleSettingChange('theme', v)}
                    label="Color Theme"
                    options={[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'system', label: 'System Default' },
                    ]}
                  />
                  
                  <div className="py-3">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Accent Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {['#0066cc', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                        <button
                          key={color}
                          onClick={() => handleSettingChange('accentColor', color)}
                          className={`
                            w-8 h-8 rounded-lg border-2 transition-all
                            ${settings.accentColor === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}
                          `}
                          style={{ backgroundColor: color }}
                        >
                          {settings.accentColor === color && <Check className="w-4 h-4 text-white mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
                
                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4" />
                    Grid & Layout
                  </h4>
                  <Toggle
                    checked={settings.showGridLines}
                    onChange={(v) => handleSettingChange('showGridLines', v)}
                    label="Show Grid Lines"
                    description="Display grid lines in the spreadsheet"
                  />
                  <Slider
                    value={settings.gridSnapSensitivity}
                    onChange={(v) => handleSettingChange('gridSnapSensitivity', v)}
                    min={1}
                    max={50}
                    step={1}
                    label="Grid Snap Sensitivity"
                    description="How close you need to be to snap to grid (in pixels)"
                    suffix="px"
                  />
                  <Tooltip text="Advanced grid settings coming soon!">
                    <div className="mt-4">
                      <Button 
                        onClick={() => handleDummyFeature('Grid Customization')} 
                        variant="secondary" 
                        size="sm"
                      >
                        Advanced Grid Settings
                      </Button>
                    </div>
                  </Tooltip>
                </section>
                
                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                    Interface
                  </h4>
                  <Toggle
                    checked={settings.enableAnimations}
                    onChange={(v) => handleSettingChange('enableAnimations', v)}
                    label="Enable Animations"
                    description="Show smooth transitions and animations"
                  />
                  <Toggle
                    checked={settings.compactMode}
                    onChange={(v) => handleSettingChange('compactMode', v)}
                    label="Compact Mode"
                    description="Reduce padding for more content space"
                  />
                </section>

                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                    Toolbar Colors
                  </h4>
                  <div className="py-3">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Toolbar Font Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={settings.toolbarFontColor}
                        onChange={(e) => handleSettingChange('toolbarFontColor', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">{settings.toolbarFontColor}</span>
                    </div>
                  </div>
                  <div className="py-3">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Toolbar Background Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={settings.toolbarBgColor}
                        onChange={(e) => handleSettingChange('toolbarBgColor', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">{settings.toolbarBgColor}</span>
                    </div>
                  </div>
                </section>
              </div>
            )}
            
            {/* Accessibility Settings */}
            {activeSettingsTab === 'accessibility' && (
              <div className="space-y-6">
                <section>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Text-to-Speech (TTS)
                  </h4>
                  <Toggle
                    checked={settings.enableTTS}
                    onChange={(v) => handleSettingChange('enableTTS', v)}
                    label="Enable Text-to-Speech"
                    description="AI Assistant will read responses aloud"
                  />
                  <Slider
                    value={settings.ttsRate}
                    onChange={(v) => handleSettingChange('ttsRate', v)}
                    min={0.5}
                    max={2}
                    step={0.1}
                    label="Speech Rate"
                    description="How fast the AI speaks"
                    suffix="x"
                  />
                  <Slider
                    value={settings.ttsPitch}
                    onChange={(v) => handleSettingChange('ttsPitch', v)}
                    min={0.5}
                    max={2}
                    step={0.1}
                    label="Speech Pitch"
                    description="Voice pitch adjustment"
                    suffix="x"
                  />
                </section>
                
                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Voice-to-Text (STT)
                  </h4>
                  <Toggle
                    checked={settings.enableSTT}
                    onChange={(v) => handleSettingChange('enableSTT', v)}
                    label="Enable Voice Recognition"
                    description="Use your voice to input text and commands"
                  />
                  <Tooltip text="Voice training feature coming soon!">
                    <div className="mt-4">
                      <Button 
                        onClick={() => handleDummyFeature('Voice Training')} 
                        variant="secondary" 
                        size="sm"
                      >
                        Train Voice Recognition
                      </Button>
                    </div>
                  </Tooltip>
                </section>
                
                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Contrast className="w-4 h-4" />
                    Visual Accessibility
                  </h4>
                  <Toggle
                    checked={settings.enableDynamicContrast}
                    onChange={(v) => handleSettingChange('enableDynamicContrast', v)}
                    label="Smart Visibility (Dynamic Contrast)"
                    description="Automatically adjust text color based on background"
                  />
                  <Toggle
                    checked={settings.highContrastMode}
                    onChange={(v) => handleSettingChange('highContrastMode', v)}
                    label="High Contrast Mode"
                    description="Increase contrast for better visibility"
                  />
                  <Toggle
                    checked={settings.largeTextMode}
                    onChange={(v) => handleSettingChange('largeTextMode', v)}
                    label="Large Text Mode"
                    description="Increase text size throughout the application"
                  />
                </section>
                
                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Keyboard className="w-4 h-4" />
                    Input & Navigation
                  </h4>
                  <Toggle
                    checked={settings.keyboardShortcuts}
                    onChange={(v) => handleSettingChange('keyboardShortcuts', v)}
                    label="Enable Keyboard Shortcuts"
                    description="Use keyboard shortcuts for faster navigation"
                  />
                  <Toggle
                    checked={settings.screenReaderOptimized}
                    onChange={(v) => handleSettingChange('screenReaderOptimized', v)}
                    label="Screen Reader Optimized"
                    description="Optimize interface for screen readers"
                  />
                </section>
              </div>
            )}
            
            {/* System Settings */}
            {activeSettingsTab === 'system' && (
              <div className="space-y-6">
                <section>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    Backend Connection
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Backend Host</label>
                      <input
                        type="text"
                        value={settings.backendHost}
                        onChange={(e) => handleSettingChange('backendHost', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Backend Port</label>
                      <input
                        type="number"
                        value={settings.backendPort}
                        onChange={(e) => handleSettingChange('backendPort', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="8000"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        connectionStatus === null ? 'bg-gray-400' :
                        connectionStatus ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm text-gray-600">
                        {connectionStatus === null ? 'Not tested' :
                         connectionStatus ? `Connected on port ${settings.backendPort}` : 
                         `Connection failed on port ${settings.backendPort}`}
                      </span>
                      <Button
                        onClick={handleTestConnection}
                        variant="secondary"
                        size="sm"
                        icon={testingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                        disabled={testingConnection}
                      >
                        {testingConnection ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>
                    
                    {connectionStatus === false && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div>
                            <h5 className="text-sm font-medium text-red-800">Connection Error</h5>
                            <p className="text-xs text-red-600 mt-1">
                              Unable to connect to the backend server. Please ensure:
                            </p>
                            <ul className="text-xs text-red-600 mt-2 ml-4 list-disc">
                              <li>The backend server is running</li>
                              <li>The port {settings.backendPort} is correct</li>
                              <li>No firewall is blocking the connection</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
                
                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Data & Sync
                  </h4>
                  <Toggle
                    checked={settings.enableWebSocket}
                    onChange={(v) => handleSettingChange('enableWebSocket', v)}
                    label="Enable WebSocket"
                    description="Use WebSocket for real-time updates"
                  />
                  <Toggle
                    checked={settings.dataSync}
                    onChange={(v) => handleSettingChange('dataSync', v)}
                    label="Enable Data Sync"
                    description="Synchronize data with cloud storage"
                  />
                  <Tooltip text="Cloud sync feature coming soon!">
                    <div className="mt-4">
                      <Button 
                        onClick={() => handleDummyFeature('Cloud Storage')} 
                        variant="secondary" 
                        size="sm"
                      >
                        Configure Cloud Storage
                      </Button>
                    </div>
                  </Tooltip>
                </section>
                
                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Debugging
                  </h4>
                  <Toggle
                    checked={settings.debugMode}
                    onChange={(v) => handleSettingChange('debugMode', v)}
                    label="Debug Mode"
                    description="Enable detailed logging and debugging tools"
                  />
                </section>
                
                <section className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Maintenance
                  </h4>
                  <div className="space-y-3">
                    <Button 
                      onClick={handleClearCache} 
                      variant="secondary" 
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      Clear Application Cache
                    </Button>
                    <p className="text-xs text-gray-500">
                      This will clear all cached data except your settings. You may need to reload the app.
                    </p>
                  </div>
                </section>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <Button onClick={closeSettings} variant="secondary">
              Cancel
            </Button>
            <Button onClick={closeSettings} variant="primary" icon={<Check className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsMenu
