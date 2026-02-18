import React, { useState } from 'react'
import { 
  FileText, 
  Edit3, 
  Eye, 
  Bot, 
  PlayCircle, 
  Search,
  Settings as SettingsIcon,
  Menu,
  Plus,
  FolderOpen,
  Save,
  Download,
  Undo,
  Redo,
  Scissors,
  Copy,
  ClipboardPaste,
} from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'
import { useSettingsStore } from '../../store/settingsStore'

interface TopBarProps {
  onToggleSidebar?: () => void
  isSidebarVisible?: boolean
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, isSidebarVisible }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const { openSettings } = useSettingsStore()
  
  const { 
    currentFile, 
    setCurrentFile,
    recentFiles,
    isProcessing,
    setIsProcessing
  } = useAppStore()

  const handleNewFile = (type: 'spreadsheet' | 'document') => {
    // Create new file
    setCurrentFile({
      id: Date.now().toString(),
      name: type === 'spreadsheet' ? 'Untitled.xlsx' : 'Untitled.docx',
      path: '',
      type: 'file',
      extension: type === 'spreadsheet' ? 'xlsx' : 'docx',
    })
    setActiveMenu(null)
  }

  const handleOpenFile = async () => {
    if (!window.electronAPI) return
    
    const result = await window.electronAPI.openFileDialog({
      properties: ['openFile'],
      filters: [
        { name: 'All Supported', extensions: ['xlsx', 'xls', 'csv', 'docx', 'doc'] },
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'Word Documents', extensions: ['docx', 'doc'] },
      ]
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      const fileName = filePath.split(/[\\/]/).pop() || ''
      const extension = fileName.split('.').pop()?.toLowerCase()
      
      setCurrentFile({
        id: filePath,
        name: fileName,
        path: filePath,
        type: 'file',
        extension,
      })
    }
    
    setActiveMenu(null)
  }

  const menuItems = {
    file: [
      { label: 'New', icon: Plus, action: null, submenu: [
        { label: 'Spreadsheet', action: () => handleNewFile('spreadsheet') },
        { label: 'Document', action: () => handleNewFile('document') },
      ]},
      { label: 'Open', icon: FolderOpen, shortcut: 'Ctrl+O', action: handleOpenFile },
      { type: 'separator' },
      { label: 'Save', icon: Save, shortcut: 'Ctrl+S', action: () => {}, disabled: !currentFile },
      { label: 'Save As', shortcut: 'Ctrl+Shift+S', action: () => {}, disabled: !currentFile },
      { type: 'separator' },
      { label: 'Export', icon: Download, action: null, submenu: [
        { label: 'Excel (.xlsx)', action: () => {} },
        { label: 'CSV (.csv)', action: () => {} },
        { label: 'PDF (.pdf)', action: () => {} },
      ]},
      { type: 'separator' },
      { label: 'Recent Files', action: null, submenu: recentFiles.slice(0, 5).map(f => ({
        label: f.name,
        action: () => setCurrentFile(f)
      }))},
      { type: 'separator' },
      { label: 'Settings...', icon: SettingsIcon, shortcut: 'Ctrl+,', action: () => { openSettings(); setActiveMenu(null); } },
    ],
    edit: [
      { label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', action: () => {} },
      { label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', action: () => {} },
      { type: 'separator' },
      { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', action: () => {} },
      { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', action: () => {} },
      { label: 'Paste', icon: ClipboardPaste, shortcut: 'Ctrl+V', action: () => {} },
      { type: 'separator' },
      { label: 'Preferences', action: () => { openSettings(); setActiveMenu(null); } },
    ],
    view: [
      { label: 'Zoom In', shortcut: 'Ctrl++', action: () => {} },
      { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => {} },
      { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: () => {} },
      { type: 'separator' },
      { label: 'Full Screen', shortcut: 'F11', action: () => {} },
      { label: isSidebarVisible ? 'Hide Sidebar' : 'Show Sidebar', action: () => { onToggleSidebar?.(); setActiveMenu(null); } },
      { type: 'separator' },
      { label: 'Settings', action: () => { openSettings(); setActiveMenu(null); } },
    ],
    ai: [
      { label: 'Ask AI', icon: Bot, action: () => {} },
      { label: 'Generate Content', action: () => {} },
      { label: 'Analyze Data', action: () => {} },
      { type: 'separator' },
      { label: 'Auto Format', action: () => {} },
      { label: 'Smart Fill', action: () => {} },
    ],
    macro: [
      { label: 'Start Recording', icon: PlayCircle, action: () => {} },
      { label: 'Playback', action: () => {} },
      { type: 'separator' },
      { label: 'Macro Library', action: () => {} },
      { label: 'Settings', action: () => { openSettings(); setActiveMenu(null); } },
    ],
  }

  const renderMenuItem = (item: any, index: number) => {
    if (item.type === 'separator') {
      return <div key={index} className="border-t border-white/10 my-1" />
    }

    const Icon = item.icon

    if (item.submenu) {
      return (
        <div key={index} className="relative group">
          <button
            className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={item.disabled}
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4 text-white/60" />}
              <span className="text-white/90">{item.label}</span>
            </div>
            <span className="text-white/40 text-xs">›</span>
          </button>
          <div className="absolute left-full top-0 ml-0.5 w-48 glass-panel py-1 hidden group-hover:block">
            {item.submenu.map((subItem: any, subIndex: number) => (
              <button
                key={subIndex}
                onClick={() => {
                  subItem.action()
                  setActiveMenu(null)
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 text-white/80"
              >
                {subItem.label}
              </button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <button
        key={index}
        onClick={() => {
          item.action?.()
          setActiveMenu(null)
        }}
        disabled={item.disabled}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-white/60" />}
          <span className="text-white/90">{item.label}</span>
        </div>
        {item.shortcut && (
          <span className="text-white/40 text-xs">{item.shortcut}</span>
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center h-10 bg-black/30 border-b border-white/10 px-2">
      {/* App Icon */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white/90">Smart Macro</span>
      </div>

      {/* Menu Items */}
      <div className="flex items-center gap-1">
        {Object.entries(menuItems).map(([key, items]) => (
          <div key={key} className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === key ? null : key)}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                activeMenu === key 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>

            {activeMenu === key && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setActiveMenu(null)}
                />
                <div className="absolute top-full left-0 mt-1 w-56 glass-panel py-1 z-50">
                  {items.map((item, index) => renderMenuItem(item, index))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
          <input
            type="text"
            placeholder="Search files, commands, or ask AI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                // Trigger search or AI query
              }
            }}
            className="w-full glass-input text-xs pl-8 py-1.5"
          />
        </div>
      </div>

      {/* Current File Indicator */}
      {currentFile && (
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded text-xs mr-4">
          <FileText className="w-3 h-3 text-white/60" />
          <span className="text-white/80 max-w-xs truncate">{currentFile.name}</span>
          {isProcessing && (
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* Settings Button - Far Right */}
      <button
        onClick={openSettings}
        className="p-2 hover:bg-white/10 rounded transition-colors ml-auto"
        title="Settings (Ctrl+,)"
      >
        <SettingsIcon className="w-4 h-4 text-white/70" />
      </button>
    </div>
  )
}

export default TopBar
