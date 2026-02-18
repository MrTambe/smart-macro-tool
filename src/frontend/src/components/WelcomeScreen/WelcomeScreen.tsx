import React, { useState, useEffect } from 'react'
import { 
  FileSpreadsheet, 
  FolderOpen, 
  Plus, 
  Clock,
  ChevronRight,
  FileText,
  Table,
  Upload
} from 'lucide-react'
import { useAppStore, FileItem } from '../../hooks/useAppStore'
import { useSpreadsheetStore } from '../../store/spreadsheetStore'

interface WelcomeScreenProps {
  onCreateNew: () => void
  onOpenFile: () => void
  recentFiles: FileItem[]
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onCreateNew, 
  onOpenFile,
  recentFiles 
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Logo and Title */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Table className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Smart Macro Tool</h1>
        <p className="text-gray-500">Intelligent automation for spreadsheets</p>
      </div>

      {/* Main Actions */}
      <div className="flex gap-4 mb-12">
        <button
          onClick={onCreateNew}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-6 h-6" />
          <div className="text-left">
            <div className="text-lg">Create New</div>
            <div className="text-sm text-blue-200">Start with a blank spreadsheet</div>
          </div>
        </button>

        <button
          onClick={onOpenFile}
          className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <FolderOpen className="w-6 h-6" />
          <div className="text-left">
            <div className="text-lg">Open File</div>
            <div className="text-sm text-gray-500">Browse your computer</div>
          </div>
        </button>
      </div>

      {/* Recent Files */}
      {recentFiles.length > 0 && (
        <div className="w-full max-w-2xl">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Files
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {recentFiles.slice(0, 5).map((file, index) => (
              <button
                key={file.id}
                onClick={() => {}}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors text-left"
              >
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{file.name}</div>
                  <div className="text-sm text-gray-400">{file.path}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-400">
          <span className="font-medium">Tip:</span> Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+N</kbd> to create a new spreadsheet
        </p>
      </div>
    </div>
  )
}

export default WelcomeScreen
