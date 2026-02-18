import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  getAppVersion: () => Promise<string>
  openFileDialog: (options: any) => Promise<any>
  saveFileDialog: (options: any) => Promise<any>
  readFile: (filePath: string) => Promise<any>
  writeFile: (filePath: string, data: string) => Promise<any>
  readDir: (dirPath: string) => Promise<any>
  openPath: (filePath: string) => Promise<void>
  showItemInFolder: (filePath: string) => Promise<void>
}

const electronAPI: ElectronAPI = {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  openFileDialog: (options) => ipcRenderer.invoke('dialog:open-file', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:save-file', options),
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:write-file', filePath, data),
  readDir: (dirPath) => ipcRenderer.invoke('fs:read-dir', dirPath),
  openPath: (filePath) => ipcRenderer.invoke('shell:open-path', filePath),
  showItemInFolder: (filePath) => ipcRenderer.invoke('shell:show-item', filePath),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type { ElectronAPI }
