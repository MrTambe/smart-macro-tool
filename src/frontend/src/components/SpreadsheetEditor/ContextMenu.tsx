import React, { useEffect, useRef } from 'react'
import { Copy, Scissors, ClipboardPaste, Trash2, Combine, Grid3x3, RowsIcon, Columns, Eraser } from 'lucide-react'
import { useSpreadsheetStore } from '../../store/spreadsheetStore'
import { useSelectionStore } from '../../store/selectionStore'

const ContextMenu: React.FC = () => {
  const {
    contextMenu,
    setContextMenu,
    activeFileId,
    getActiveSheet,
    copyCells,
    pasteCells,
    clearCells,
    mergeCells,
    unmergeCells,
    deleteRow,
    deleteColumn,
    clipboard,
  } = useSpreadsheetStore()

  const {
    getSelectedCells,
    activeCell,
    copy: selectionCopy,
    cut: selectionCut,
    paste: selectionPaste,
  } = useSelectionStore()

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu, setContextMenu])

  if (!contextMenu?.visible) return null

  const file = useSpreadsheetStore.getState().getActiveFile()
  const sheet = getActiveSheet()
  
  if (!file || !sheet) return null

  const selectedCells = getSelectedCells().map(c => `${String.fromCharCode(65 + c.col)}${c.row + 1}`)
  const hasSelection = selectedCells.length > 0
  const canMerge = selectedCells.length > 1
  const canPaste = clipboard !== null && activeCell !== null

  const handleCopy = () => {
    selectionCopy()
    setContextMenu(null)
  }

  const handleCut = () => {
    selectionCut()
    setContextMenu(null)
  }

  const handlePaste = () => {
    selectionPaste()
    setContextMenu(null)
  }

  const handleClear = () => {
    if (hasSelection) {
      clearCells(activeFileId, sheet.id, selectedCells)
    }
    setContextMenu(null)
  }

  const handleMerge = () => {
    if (canMerge) {
      mergeCells(activeFileId, sheet.id, selectedCells)
    }
    setContextMenu(null)
  }

  const handleUnmerge = () => {
    if (hasSelection) {
      unmergeCells(activeFileId, sheet.id, selectedCells)
    }
    setContextMenu(null)
  }

  const handleDeleteRow = () => {
    if (selectedCells.length > 0) {
      const firstCell = selectedCells[0]
      const match = firstCell.match(/\d+/)
      if (match) {
        const rowIndex = parseInt(match[0])
        deleteRow(activeFileId, sheet.id, rowIndex)
      }
    }
    setContextMenu(null)
  }

  const handleDeleteColumn = () => {
    if (selectedCells.length > 0) {
      const firstCell = selectedCells[0]
      const match = firstCell.match(/[A-Z]+/)
      if (match) {
        deleteColumn(activeFileId, sheet.id, match[0])
      }
    }
    setContextMenu(null)
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {/* Clipboard Operations */}
      <div className="px-1 pb-1 border-b border-gray-100">
        <button
          onClick={handleCopy}
          disabled={!hasSelection}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
        <button
          onClick={handleCut}
          disabled={!hasSelection}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          <Scissors className="w-4 h-4" />
          Cut
        </button>
        <button
          onClick={handlePaste}
          disabled={!canPaste}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          <ClipboardPaste className="w-4 h-4" />
          Paste
        </button>
      </div>

      {/* Cell Operations */}
      <div className="px-1 py-1 border-b border-gray-100">
        <button
          onClick={handleClear}
          disabled={!hasSelection}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          <Eraser className="w-4 h-4" />
          Clear Contents
        </button>
        <button
          onClick={handleMerge}
          disabled={!canMerge}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          <Combine className="w-4 h-4" />
          Merge Cells
        </button>
        <button
          onClick={handleUnmerge}
          disabled={!hasSelection}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          <Grid3x3 className="w-4 h-4" />
          Unmerge Cells
        </button>
      </div>

      {/* Row/Column Operations */}
      <div className="px-1 pt-1">
        <button
          onClick={handleDeleteRow}
          disabled={!hasSelection}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
          Delete Row
        </button>
        <button
          onClick={handleDeleteColumn}
          disabled={!hasSelection}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
          Delete Column
        </button>
      </div>
    </div>
  )
}

export default ContextMenu
