import React from 'react'
import { 
  Wifi, 
  WifiOff, 
  AlertCircle,
  Circle,
  Save,
  Zap,
  Settings
} from 'lucide-react'

interface StatusBarProps {
  backendStatus: 'connected' | 'disconnected' | 'error'
  isMacroRecording: boolean
}

const StatusBar: React.FC<StatusBarProps> = ({ backendStatus, isMacroRecording }) => {
  const getStatusIcon = () => {
    switch (backendStatus) {
      case 'connected':
        return <Wifi className="w-3 h-3 text-green-400" />
      case 'disconnected':
        return <WifiOff className="w-3 h-3 text-yellow-400" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-400" />
    }
  }

  const getStatusText = () => {
    switch (backendStatus) {
      case 'connected':
        return 'Connected'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Error'
    }
  }

  return (
    <div className="flex items-center justify-between h-7 bg-black/40 border-t border-white/10 px-3 text-xs">
      {/* Left - Backend Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" title="Backend Connection">
          {getStatusIcon()}
          <span className={`${
            backendStatus === 'connected' ? 'text-green-400' : 
            backendStatus === 'disconnected' ? 'text-yellow-400' : 
            'text-red-400'
          }`}>
            {getStatusText()}
          </span>
        </div>

        {/* Macro Recording Indicator */}
        {isMacroRecording && (
          <div className="flex items-center gap-1.5 animate-pulse">
            <Circle className="w-2 h-2 fill-red-500 text-red-500" />
            <span className="text-red-400">Recording Macro</span>
          </div>
        )}

        {/* Auto-save indicator */}
        <div className="flex items-center gap-1.5 text-white/40">
          <Save className="w-3 h-3" />
          <span>Auto-save enabled</span>
        </div>
      </div>

      {/* Center - Quick Actions */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
          <Zap className="w-3 h-3" />
          <span>Shortcuts</span>
        </button>
        <span className="text-white/20">|</span>
        <button className="text-white/50 hover:text-white/80 transition-colors">
          Help
        </button>
        <span className="text-white/20">|</span>
        <span className="text-white/40">
          Press Ctrl+K for command palette
        </span>
      </div>

      {/* Right - Info */}
      <div className="flex items-center gap-3">
        <span className="text-white/40">Smart Macro Tool v1.0.0</span>
        <button className="p-1 hover:bg-white/10 rounded" title="Settings">
          <Settings className="w-3 h-3 text-white/50" />
        </button>
      </div>
    </div>
  )
}

export default StatusBar
