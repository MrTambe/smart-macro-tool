import React, { useState, useEffect, useCallback } from 'react'
import { 
  Folder, 
  FileText, 
  FileSpreadsheet, 
  File, 
  ChevronRight, 
  ChevronDown,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  MoreVertical,
  Search,
  FolderOpen,
  Mic,
  MicOff
} from 'lucide-react'
import { useAppStore, FileItem } from '../../hooks/useAppStore'
import { useSpreadsheetStore } from '../../store/spreadsheetStore'
import { useFileProcessor } from '../../hooks/useFileProcessor'
import { loadFileIntoWorkspace, createNewSpreadsheet } from '../../services/fileLoader'
import { useVoiceToText } from '../../hooks/useVoice'

interface FileTreeItem extends FileItem {
  children?: FileTreeItem[]
  isExpanded?: boolean
  level: number
}

const FileExplorer: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('')
  const [files, setFiles] = useState<FileTreeItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, item: FileTreeItem} | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
   
  const { 
    setCurrentFile, 
    setFileType, 
    addRecentFile,
    workspacePath,
    setWorkspacePath,
    currentFile
  } = useAppStore()
  
  // Use spreadsheet store for multi-file support - properly use hooks
  const spreadsheetStore = useSpreadsheetStore()
  const { openFile, setActiveFile, createSheet, renameSheet, setCellValue, markFileModified, refreshGrid } = spreadsheetStore
   
  const { processSpreadsheet, processCSV, processDocument } = useFileProcessor()
  
  // Voice search integration
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    supported: voiceSupported
  } = useVoiceToText()

  // Apply voice transcript to search
  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript)
    }
  }, [transcript])

  const handleVoiceSearch = () => {
    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      startListening()
    }
  }

  const ALLOWED_EXTENSIONS = ['xls', 'xlsx', 'doc', 'docx']
  
  const isAllowedFile = (item: any): boolean => {
    if (item.isDirectory) return true
    const ext = item.name.split('.').pop()?.toLowerCase()
    return ALLOWED_EXTENSIONS.includes(ext || '')
  }

  const loadDirectory = useCallback(async (path: string) => {
    if (!window.electronAPI) return
    
    try {
      const result = await window.electronAPI.readDir(path)
      if (result.success) {
        // Filter only directories and allowed file types
        const filteredData = result.data.filter(isAllowedFile)
        
        const fileItems: FileTreeItem[] = filteredData.map((item: any) => ({
          id: `${path}/${item.name}`,
          name: item.name,
          path: `${path}/${item.name}`,
          type: item.isDirectory ? 'directory' : 'file',
          extension: item.isFile ? item.name.split('.').pop()?.toLowerCase() : undefined,
          level: 0,
          isExpanded: false,
        }))
        
        // Sort: directories first, then files
        fileItems.sort((a, b) => {
          if (a.type === 'directory' && b.type === 'file') return -1
          if (a.type === 'file' && b.type === 'directory') return 1
          return a.name.localeCompare(b.name)
        })
        
        setFiles(fileItems)
        setCurrentPath(path)
      }
    } catch (error) {
      console.error('Error loading directory:', error)
    }
  }, [])

  useEffect(() => {
    // Load home or documents directory on mount
    const defaultPath = process.platform === 'win32' 
      ? process.env.USERPROFILE || 'C:\\Users'
      : process.env.HOME || '/'
    
    if (!workspacePath) {
      setWorkspacePath(defaultPath)
    }
    loadDirectory(workspacePath || defaultPath)
  }, [workspacePath, loadDirectory, setWorkspacePath])

  const handleFileClick = async (item: FileTreeItem) => {
    if (item.type === 'directory') {
      loadDirectory(item.path)
    } else {
      handleFileOpen(item)
    }
  }

  const handleFileOpen = async (item: FileTreeItem) => {
    setSelectedItem(item.id)
    
    const fileItem: FileItem = {
      id: item.id,
      name: item.name,
      path: item.path,
      type: 'file',
      extension: item.extension,
    }
    
    // Set the file as active in the main app state
    setCurrentFile(fileItem)
    addRecentFile(fileItem)
    
    // Determine file type
    const ext = item.extension?.toLowerCase()
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setFileType(ext === 'csv' ? 'csv' : 'spreadsheet')
      
      // Load actual file content
      setIsProcessing(true)
      try {
        await loadFileContent(item)
      } catch (error) {
        console.error('Error loading file:', error)
        // Fallback: just open the file without content
        openFile(item.name, item.path)
      } finally {
        setIsProcessing(false)
      }
    } else if (['docx', 'doc'].includes(ext || '')) {
      setFileType('document')
    } else {
      // Default to spreadsheet for unknown file types
      setFileType('spreadsheet')
      openFile(item.name, item.path)
    }
  }
  
  // Function to load file content into workspace
  const loadFileContent = async (item: FileTreeItem) => {
    const ext = item.extension?.toLowerCase()
    
    if (window.electronAPI && ['xlsx', 'xls', 'csv'].includes(ext || '')) {
      try {
        setIsProcessing(true)
        const result = await window.electronAPI.readFile(item.path)
        if (result.success) {
          // Convert base64 to array buffer
          const byteString = atob(result.data)
          const arrayBuffer = new ArrayBuffer(byteString.length)
          const uint8Array = new Uint8Array(arrayBuffer)
          for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i)
          }
          
          const blob = new Blob([arrayBuffer])
          const file = new File([blob], item.name, { type: 'application/octet-stream' })
          
          let sheetsData: any[]
          if (ext === 'csv') {
            const csvData = await processCSV(file)
            sheetsData = [csvData]
          } else {
            sheetsData = await processSpreadsheet(file)
          }

          // Populate spreadsheet store - use hooks properly
          const activeFile = spreadsheetStore.getActiveFile()
          
          if (activeFile && sheetsData.length > 0) {
            // Process each sheet
            for (let i = 0; i < sheetsData.length; i++) {
              const data = sheetsData[i]
              let sheetId = activeFile.sheets[i]?.id
              
              if (!sheetId) {
                // Create new sheet and get its ID
                createSheet(activeFile.id, data.sheetName)
                // Re-get active file to get new sheet
                const updatedFile = spreadsheetStore.getActiveFile()
                const newSheet = updatedFile?.sheets[updatedFile.sheets.length - 1]
                sheetId = newSheet?.id
              } else {
                renameSheet(activeFile.id, sheetId, data.sheetName)
              }

              if (sheetId) {
                // Set headers - batch update would be better but this works
                data.headers.forEach((header: any, colIdx: number) => {
                  const colLetter = String.fromCharCode(65 + colIdx)
                  setCellValue(activeFile.id, sheetId, `${colLetter}1`, String(header || ''))
                })

                // Set data - consider batching for large files
                data.rows.forEach((row: any[], rowIdx: number) => {
                  row.forEach((val, colIdx) => {
                    const colLetter = String.fromCharCode(65 + colIdx)
                    setCellValue(activeFile.id, sheetId, `${colLetter}${rowIdx + 2}`, String(val || ''))
                  })
                })
              }
            }
            markFileModified(activeFile.id, false)
            
            // CRITICAL: Refresh grid to show loaded data - with retry
            setTimeout(() => {
              refreshGrid()
              // Double refresh to ensure UI updates
              setTimeout(() => refreshGrid(), 100)
            }, 50)
            
            console.log(`Successfully loaded ${sheetsData.length} sheet(s) with data`)
          }
        }
      } catch (error) {
        console.error('Error reading file:', error)
        throw error
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleContextMenu = (e: React.MouseEvent, item: FileTreeItem) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, item })
  }

  const getFileIcon = (item: FileTreeItem) => {
    if (item.type === 'directory') {
      return item.isExpanded 
        ? <FolderOpen className="w-4 h-4 text-yellow-400" />
        : <Folder className="w-4 h-4 text-yellow-400" />
    }
    
    const ext = item.extension
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-4 h-4 text-green-400" />
    } else if (['docx', 'doc'].includes(ext || '')) {
      return <FileText className="w-4 h-4 text-blue-400" />
    }
    return <File className="w-4 h-4 text-gray-400" />
  }

  const filteredFiles = files.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Files
          </h2>
          <div className="flex gap-1">
            <button 
              onClick={() => loadDirectory(currentPath)}
              className="p-1 hover:bg-white/10 rounded"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3 text-white/60" />
            </button>
            <button 
              className="p-1 hover:bg-white/10 rounded"
              title="New Folder"
            >
              <Plus className="w-3 h-3 text-white/60" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input text-xs pl-7 pr-8 py-1.5"
          />
          {voiceSupported && (
            <button
              onClick={handleVoiceSearch}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                isListening ? 'bg-red-500/30 text-red-400 animate-pulse' : 'hover:bg-white/10 text-white/40'
              }`}
              title={isListening ? 'Stop Voice Search' : 'Voice Search'}
            >
              {isListening ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
            </button>
          )}
        </div>
        
        {/* Breadcrumb */}
        <div className="mt-2 text-xs text-white/50 truncate">
          {currentPath.split('/').slice(-2).join(' / ')}
        </div>
      </div>

      {/* Active File Info */}
      {currentFile && (
        <div className="px-3 py-2 border-y border-white/10 bg-blue-500/10">
          <div className="text-xs text-white/50 mb-1">Active File</div>
          <div className="flex items-center gap-2">
            {currentFile.type === 'file' && getFileIcon({
              ...currentFile,
              level: 0,
              isExpanded: false,
              extension: currentFile.extension
            } as FileTreeItem)}
            <span className="text-sm text-white font-medium truncate flex-1">
              {currentFile.name}
            </span>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {currentPath !== workspacePath && (
          <button
            onClick={() => {
              const parentPath = currentPath.split('/').slice(0, -1).join('/')
              loadDirectory(parentPath || '/')
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-white/70 hover:bg-white/5 rounded"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            ..
          </button>
        )}
        
        {filteredFiles.map((item) => (
          <div
            key={item.id}
            onClick={() => handleFileClick(item)}
            onContextMenu={(e) => handleContextMenu(e, item)}
            className={`
              flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded
              transition-colors duration-150
              ${selectedItem === item.id ? 'bg-blue-500/30' : 'hover:bg-white/5'}
            `}
          >
            {item.type === 'directory' && (
              <ChevronRight className={`w-3 h-3 text-white/40 ${item.isExpanded ? 'rotate-90' : ''}`} />
            )}
            {getFileIcon(item)}
            <span className="truncate flex-1 text-white/80">{item.name}</span>
          </div>
        ))}
        
        {filteredFiles.length === 0 && (
          <div className="text-center py-8 text-white/40 text-sm">
            {searchQuery ? 'No files found' : 'Empty directory'}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div 
            className="fixed z-50 glass-panel py-1 min-w-32"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button 
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center gap-2"
              onClick={() => {
                handleFileOpen(contextMenu.item)
                setContextMenu(null)
              }}
            >
              <FolderOpen className="w-3 h-3" />
              Set as Active
            </button>

            <button 
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center gap-2"
              onClick={() => setContextMenu(null)}
            >
              <Edit3 className="w-3 h-3" />
              Rename
            </button>
            <div className="border-t border-white/10 my-1" />
            <button 
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 text-red-400 flex items-center gap-2"
              onClick={() => setContextMenu(null)}
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default FileExplorer
