import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

// Check if running in development mode
// NODE_ENV should be set when running npm run electron:dev
const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: 'Smart Macro Tool',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
      sandbox: false,
    },
    show: false,
    titleBarStyle: 'default',
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
    if (mainWindow) {
      mainWindow.loadURL(`data:text/html,<h1>Failed to load application</h1><p>Error: ${errorDescription}</p><p>Please ensure the backend server is running on port 8000 and try again.</p>`)
    }
  })

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    try {
      console.log(`[Renderer ${level}]: ${message}`)
    } catch (e) {
      // Ignore EPIPE errors which happen when console is closed
    }
  })

  // Prevent EPIPE errors from crashing the main process
  process.stdout.on('error', (err: any) => {
    if (err.code === 'EPIPE') return
    console.error('stdout error:', err)
  })

  process.stderr.on('error', (err: any) => {
    if (err.code === 'EPIPE') return
    console.error('stderr error:', err)
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC Handlers
ipcMain.handle('app:get-version', () => {
  return app.getVersion()
})

ipcMain.handle('dialog:open-file', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, options)
  return result
})

ipcMain.handle('dialog:save-file', async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow!, options)
  return result
})

ipcMain.handle('fs:read-file', async (_, filePath: string) => {
  try {
    const buffer = fs.readFileSync(filePath)
    return { success: true, data: buffer.toString('base64'), error: null }
  } catch (error) {
    return { success: false, data: null, error: (error as Error).message }
  }
})

ipcMain.handle('fs:write-file', async (_, filePath: string, data: string) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'))
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('fs:read-dir', async (_, dirPath: string) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return {
      success: true,
      data: entries.map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
      })),
      error: null,
    }
  } catch (error) {
    return { success: false, data: null, error: (error as Error).message }
  }
})

ipcMain.handle('shell:open-path', async (_, filePath: string) => {
  await shell.openPath(filePath)
})

ipcMain.handle('shell:show-item', async (_, filePath: string) => {
  await shell.showItemInFolder(filePath)
})
