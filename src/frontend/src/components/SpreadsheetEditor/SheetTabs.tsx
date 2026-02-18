import React, { useState } from 'react'
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSpreadsheetStore } from '../../store/spreadsheetStore'

const SheetTabs: React.FC = () => {
  const { 
    openFiles, 
    activeFileId,
    createSheet, 
    deleteSheet, 
    renameSheet, 
    setActiveSheet,
  } = useSpreadsheetStore()
  
  const [editingSheet, setEditingSheet] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const activeFile = openFiles.find(f => f.id === activeFileId)
  const sheets = activeFile?.sheets || []
  const activeSheetId = activeFile?.activeSheetId || ''

  const handleDoubleClick = (sheetId: string, currentName: string) => {
    setEditingSheet(sheetId)
    setEditName(currentName)
  }

  const handleRenameSubmit = (sheetId: string) => {
    if (editName.trim() && activeFile) {
      renameSheet(activeFile.id, sheetId, editName.trim())
    }
    setEditingSheet(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, sheetId: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(sheetId)
    } else if (e.key === 'Escape') {
      setEditingSheet(null)
    }
  }

  if (!activeFile) return null

  return (
    <div className="flex items-center bg-gray-100 border-t border-gray-300 px-1">
      {/* Navigation Arrows */}
      <button className="p-1 hover:bg-gray-200 rounded">
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>

      {/* Sheet Tabs */}
      <div className="flex items-center overflow-x-auto">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            className={`
              group flex items-center gap-1 px-3 py-1.5 text-sm cursor-pointer
              border-t-2 border-r border-gray-300 min-w-[100px]
              ${activeSheetId === sheet.id 
                ? 'bg-white border-t-blue-500 text-gray-900' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-t-transparent'}
            `}
            onClick={() => setActiveSheet(activeFile.id, sheet.id)}
            onDoubleClick={() => handleDoubleClick(sheet.id, sheet.name)}
          >
            {editingSheet === sheet.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleRenameSubmit(sheet.id)}
                onKeyDown={(e) => handleKeyDown(e, sheet.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-20 px-1 py-0.5 text-xs border border-blue-500 rounded"
                autoFocus
              />
            ) : (
              <span className="truncate flex-1">{sheet.name}</span>
            )}
            
            {sheets.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSheet(activeFile.id, sheet.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Sheet Button */}
      <button
        onClick={() => createSheet(activeFile.id)}
        className="p-1.5 hover:bg-gray-200 rounded ml-1"
        title="Add Sheet"
      >
        <Plus className="w-4 h-4 text-gray-600" />
      </button>

      <button className="p-1 hover:bg-gray-200 rounded ml-1">
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  )
}

export default SheetTabs
