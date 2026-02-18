import React, { useState } from 'react'
import { 
  Cloud, 
  CloudCog,
  Check, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  FolderSync,
  Settings,
  X,
  Plus,
  Trash2,
  Save
} from 'lucide-react'
import { useCloudSyncStore } from '../../store/cloudSyncStore'
import { useToast } from '../../contexts/ToastContext'

interface CloudProvider {
  id: string
  name: string
  icon: string
  description: string
  connected: boolean
  lastSync?: string
  folders?: string[]
}

const CloudProvidersSettings: React.FC = () => {
  const { showSuccess, showError, showInfo } = useToast()
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const [syncInterval, setSyncInterval] = useState(15)

  // Mock cloud providers data - in real app, this would come from a store
  const [providers, setProviders] = useState<CloudProvider[]>([
    {
      id: 'onedrive',
      name: 'Microsoft OneDrive',
      icon: '📁',
      description: 'Sync with your Microsoft OneDrive account',
      connected: false,
      folders: []
    },
    {
      id: 'googledrive',
      name: 'Google Drive',
      icon: '📂',
      description: 'Sync with your Google Drive account',
      connected: false,
      folders: []
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      icon: '📦',
      description: 'Sync with your Dropbox account',
      connected: false,
      folders: []
    }
  ])

  const handleConnect = async (providerId: string) => {
    setIsTesting(providerId)
    
    // Simulate connection process
    setTimeout(() => {
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, connected: true, lastSync: new Date().toISOString() }
          : p
      ))
      showSuccess(`Connected to ${providers.find(p => p.id === providerId)?.name}`)
      setIsTesting(null)
    }, 1500)
  }

  const handleDisconnect = (providerId: string) => {
    if (confirm('Are you sure you want to disconnect this cloud provider?')) {
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, connected: false, lastSync: undefined, folders: [] }
          : p
      ))
      showInfo(`${providers.find(p => p.id === providerId)?.name} disconnected`)
    }
  }

  const handleSyncNow = (providerId: string) => {
    setIsTesting(providerId)
    
    setTimeout(() => {
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, lastSync: new Date().toISOString() }
          : p
      ))
      showSuccess('Sync completed successfully')
      setIsTesting(null)
    }, 2000)
  }

  const handleAddFolder = (providerId: string) => {
    setSelectedProvider(providerId)
    setShowAddModal(true)
  }

  const handleRemoveFolder = (providerId: string, folderIndex: number) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, folders: p.folders?.filter((_, i) => i !== folderIndex) }
        : p
    ))
    showInfo('Folder removed from sync')
  }

  const connectedProviders = providers.filter(p => p.connected)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Cloud Providers</h3>
        <p className="text-sm text-gray-500">
          Connect and manage cloud storage for file synchronization
        </p>
      </div>

      {/* Sync Settings */}
      {connectedProviders.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 bg-blue-50/50">
          <div className="flex items-center gap-2 mb-4">
            <FolderSync className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">Synchronization Settings</h4>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Cloud Sync</label>
                <p className="text-xs text-gray-500">Automatically sync files to cloud</p>
              </div>
              <button
                onClick={() => setSyncEnabled(!syncEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  syncEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  syncEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto Sync</label>
                <p className="text-xs text-gray-500">Sync files automatically on changes</p>
              </div>
              <button
                onClick={() => setAutoSync(!autoSync)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSync ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSync ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {autoSync && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Interval: {syncInterval} minutes
                </label>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 min</span>
                  <span>60 min</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connected Providers */}
      {connectedProviders.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            Connected Accounts ({connectedProviders.length})
          </h4>
          
          {connectedProviders.map(provider => (
            <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-gray-900">{provider.name}</h5>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Connected
                      </span>
                    </div>
                    {provider.lastSync && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last sync: {new Date(provider.lastSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSyncNow(provider.id)}
                    disabled={isTesting === provider.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting === provider.id ? 'animate-spin' : ''}`} />
                    {isTesting === provider.id ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(provider.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Disconnect"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sync Folders */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Synced Folders</span>
                  <button
                    onClick={() => handleAddFolder(provider.id)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Folder
                  </button>
                </div>
                
                {provider.folders && provider.folders.length > 0 ? (
                  <div className="space-y-1">
                    {provider.folders.map((folder, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{folder}</span>
                        <button
                          onClick={() => handleRemoveFolder(provider.id, idx)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No folders configured</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available Providers */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Available Providers</h4>
        
        {providers.filter(p => !p.connected).map(provider => (
          <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <h5 className="font-medium text-gray-900">{provider.name}</h5>
                  <p className="text-sm text-gray-500">{provider.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleConnect(provider.id)}
                disabled={isTesting === provider.id}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {isTesting === provider.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                {isTesting === provider.id ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">About Cloud Sync</h4>
            <p className="text-sm text-blue-700 mt-1">
              Cloud sync allows you to access your spreadsheets from any device. 
              Files are encrypted during transfer and storage.
            </p>
            <div className="mt-3 flex gap-4">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); showInfo('Security documentation coming soon!') }}
                className="text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                Security Info
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); showInfo('Help documentation coming soon!') }}
                className="text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                Learn More
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Add Folder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Add Sync Folder</h4>
              <p className="text-sm text-gray-500 mt-1">
                Select a folder to synchronize with {providers.find(p => p.id === selectedProvider)?.name}
              </p>
            </div>
            
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <CloudCog className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Browse Cloud Folders</p>
                <p className="text-xs text-gray-500 mt-1">
                  Click to browse your cloud storage
                </p>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or enter folder path
                </label>
                <input
                  type="text"
                  placeholder="/My Spreadsheets"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showInfo('Folder browser coming in next update!')
                  setShowAddModal(false)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Add Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CloudProvidersSettings
