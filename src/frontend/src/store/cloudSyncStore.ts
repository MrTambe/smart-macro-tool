import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CloudProvider {
  id: string
  name: string
  type: 'onedrive' | 'googledrive' | 'dropbox'
  connected: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  folders: string[]
  lastSync?: string
}

export interface CloudSyncState {
  // Sync settings
  syncEnabled: boolean
  autoSync: boolean
  syncInterval: number // minutes
  
  // Providers
  providers: CloudProvider[]
  
  // Actions
  setSyncEnabled: (enabled: boolean) => void
  setAutoSync: (enabled: boolean) => void
  setSyncInterval: (interval: number) => void
  addProvider: (provider: CloudProvider) => void
  removeProvider: (providerId: string) => void
  updateProvider: (providerId: string, updates: Partial<CloudProvider>) => void
  addFolderToProvider: (providerId: string, folder: string) => void
  removeFolderFromProvider: (providerId: string, folderIndex: number) => void
  
  // Sync operations
  syncNow: (providerId: string) => Promise<boolean>
  syncAll: () => Promise<void>
}

export const useCloudSyncStore = create<CloudSyncState>()(
  persist(
    (set, get) => ({
      // Default state
      syncEnabled: false,
      autoSync: true,
      syncInterval: 15,
      providers: [],
      
      // Actions
      setSyncEnabled: (enabled) => {
        set({ syncEnabled: enabled })
        console.log('[CloudSync] Sync enabled:', enabled)
      },
      
      setAutoSync: (enabled) => {
        set({ autoSync: enabled })
        console.log('[CloudSync] Auto sync:', enabled)
      },
      
      setSyncInterval: (interval) => {
        set({ syncInterval: interval })
        console.log('[CloudSync] Sync interval:', interval, 'minutes')
      },
      
      addProvider: (provider) => {
        set((state) => ({
          providers: [...state.providers, provider]
        }))
        console.log('[CloudSync] Added provider:', provider.name)
      },
      
      removeProvider: (providerId) => {
        set((state) => ({
          providers: state.providers.filter(p => p.id !== providerId)
        }))
        console.log('[CloudSync] Removed provider:', providerId)
      },
      
      updateProvider: (providerId, updates) => {
        set((state) => ({
          providers: state.providers.map(p =>
            p.id === providerId ? { ...p, ...updates } : p
          )
        }))
        console.log('[CloudSync] Updated provider:', providerId, updates)
      },
      
      addFolderToProvider: (providerId, folder) => {
        set((state) => ({
          providers: state.providers.map(p =>
            p.id === providerId
              ? { ...p, folders: [...p.folders, folder] }
              : p
          )
        }))
        console.log('[CloudSync] Added folder to provider:', providerId, folder)
      },
      
      removeFolderFromProvider: (providerId, folderIndex) => {
        set((state) => ({
          providers: state.providers.map(p =>
            p.id === providerId
              ? { ...p, folders: p.folders.filter((_, i) => i !== folderIndex) }
              : p
          )
        }))
        console.log('[CloudSync] Removed folder from provider:', providerId, folderIndex)
      },
      
      // Sync operations
      syncNow: async (providerId) => {
        console.log('[CloudSync] Starting sync for provider:', providerId)
        
        try {
          // Simulate sync operation
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          set((state) => ({
            providers: state.providers.map(p =>
              p.id === providerId
                ? { ...p, lastSync: new Date().toISOString() }
                : p
            )
          }))
          
          console.log('[CloudSync] Sync completed for provider:', providerId)
          return true
        } catch (error) {
          console.error('[CloudSync] Sync failed:', error)
          return false
        }
      },
      
      syncAll: async () => {
        console.log('[CloudSync] Starting sync for all providers')
        
        const { providers, syncNow } = get()
        
        for (const provider of providers) {
          if (provider.connected) {
            await syncNow(provider.id)
          }
        }
        
        console.log('[CloudSync] All syncs completed')
      }
    }),
    {
      name: 'cloud-sync-storage',
      partialize: (state) => ({
        syncEnabled: state.syncEnabled,
        autoSync: state.autoSync,
        syncInterval: state.syncInterval,
        providers: state.providers.map(p => ({
          ...p,
          accessToken: undefined, // Don't persist tokens
          refreshToken: undefined
        }))
      })
    }
  )
)

export default useCloudSyncStore
