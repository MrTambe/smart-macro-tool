import React from 'react'
import { X, FileSpreadsheet, FileText } from 'lucide-react'
import { useSpreadsheetStore } from '../../store/spreadsheetStore'

const FileTabs: React.FC = () => {
  const { openFiles, activeFileId, setActiveFile, closeFile } = useSpreadsheetStore()

  return (
    <div className="flex items-center bg-[#2d2d2d] border-b border-[#1e1e1e] overflow-x-auto">
      {openFiles.map((file) => (
        <div
          key={file.id}
          onClick={() => setActiveFile(file.id)}
          className={`
            group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer
            border-r border-[#1e1e1e] min-w-[120px] max-w-[200px]
            transition-colors duration-150
            ${activeFileId === file.id 
              ? 'bg-[#1e1e1e] text-white' 
              : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#3d3d3d]'
            }
          `}
        >
          {/* File Icon */}
          {file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? (
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
          ) : file.name.endsWith('.docx') || file.name.endsWith('.doc') ? (
            <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          )}
          
          {/* File Name */}
          <span className="truncate flex-1">
            {file.name}
            {file.isModified && <span className="ml-1 text-white">•</span>}
          </span>
          
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              closeFile(file.id)
            }}
            className={`
              p-0.5 rounded opacity-0 group-hover:opacity-100
              hover:bg-white/20 transition-opacity
              ${activeFileId === file.id ? 'opacity-100' : ''}
            `}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      
      {/* New File Button */}
      <button
        onClick={() => useSpreadsheetStore.getState().openFile('Untitled Spreadsheet')}
        className="px-3 py-2 text-[#969696] hover:text-white hover:bg-[#3d3d3d] transition-colors"
      >
        <span className="text-lg leading-none">+</span>
      </button>
    </div>
  )
}

export default FileTabs
