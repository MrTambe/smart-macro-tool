import React, { useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PaintBucket,
  Type,
  Grid3x3,
  Plus,
  Trash2,
  Palette,
  ArrowUp,
  ArrowDown,
  Minus,
  Combine,
  Cloud,
  Sparkles,
} from 'lucide-react'
import { useSpreadsheetStore } from '../../store/spreadsheetStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useSelectionStore } from '../../store/selectionStore'

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Georgia',
  'Palatino',
  'Garamond',
  'Bookman',
  'Comic Sans MS',
  'Trebuchet MS',
  'Arial Black',
  'Impact',
]

const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72']

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
]

interface ToolbarProps {
  onMergeCells: () => void
  onUnmergeCells: () => void
  onCloudSync?: () => void
  onAIReview?: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({ onMergeCells, onUnmergeCells, onCloudSync, onAIReview }) => {
  const {
    currentCellStyle,
    applyStyleToSelection,
    clipboard,
    copyCells,
    pasteCells,
    clearCells,
    getActiveFile,
    getActiveSheet,
    selectCells,
  } = useSpreadsheetStore()

  const {
    getSelectedCells,
    activeCell,
    copy: selectionCopy,
    cut: selectionCut,
    paste: selectionPaste,
  } = useSelectionStore()

  const { toolbarFontColor, toolbarBgColor } = useSettingsStore()

  const activeFile = getActiveFile()
  const activeSheet = getActiveSheet()

  const handleStyleChange = (style: Partial<CellStyle>) => {
    const cells = getSelectedCells()
    if (cells.length > 0 && activeFile && activeSheet) {
      const cellIds = cells.map(c => `${String.fromCharCode(65 + c.col)}${c.row + 1}`)
      // Update both stores to keep them in sync
      selectCells(cellIds)
      applyStyleToSelection(style)
    }
  }

  const handleCopy = () => {
    selectionCopy()
  }

  const handleCut = () => {
    selectionCut()
  }

  const handlePaste = () => {
    selectionPaste()
  }

  const handleClear = () => {
    const cells = getSelectedCells()
    const cellIds = cells.map(c => `${String.fromCharCode(65 + c.col)}${c.row + 1}`)
    if (cellIds.length > 0 && activeFile && activeSheet) {
      clearCells(activeFile.id, activeSheet.id, cellIds)
    }
  }

  return (
    <div 
      className="flex flex-col border-b border-gray-300 overflow-hidden"
      style={{ backgroundColor: toolbarBgColor, color: toolbarFontColor }}
    >
      {/* Main Toolbar - Now responsive with scroll */}
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-thin">
        {/* Clipboard */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs hover:bg-gray-200 rounded font-medium"
            style={{ color: toolbarFontColor }}
            title="Copy"
          >
            Copy
          </button>
          <button
            onClick={handleCut}
            className="px-2 py-1 text-xs hover:bg-gray-200 rounded font-medium"
            style={{ color: toolbarFontColor }}
            title="Cut"
          >
            Cut
          </button>
          <button
            onClick={handlePaste}
            className="px-2 py-1 text-xs hover:bg-gray-200 rounded font-medium"
            style={{ color: toolbarFontColor }}
            title="Paste"
          >
            Paste
          </button>
        </div>

        {/* Font */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-300 flex-shrink-0">
          <select
            value={currentCellStyle.fontFamily || 'Arial'}
            onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
            className="w-28 text-xs border border-gray-300 rounded px-1 py-0.5"
            style={{ color: '#000' }}
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>

          <select
            value={currentCellStyle.fontSize || '11'}
            onChange={(e) => handleStyleChange({ fontSize: e.target.value })}
            className="w-14 text-xs border border-gray-300 rounded px-1 py-0.5"
            style={{ color: '#000' }}
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-300 flex-shrink-0">
          <button
            onClick={() => handleStyleChange({ fontWeight: currentCellStyle.fontWeight === 'bold' ? 'normal' : 'bold' })}
            className={`p-1 rounded ${currentCellStyle.fontWeight === 'bold' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            style={{ color: toolbarFontColor }}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStyleChange({ fontStyle: currentCellStyle.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`p-1 rounded ${currentCellStyle.fontStyle === 'italic' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            style={{ color: toolbarFontColor }}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStyleChange({ textDecoration: currentCellStyle.textDecoration === 'underline' ? 'none' : 'underline' })}
            className={`p-1 rounded ${currentCellStyle.textDecoration === 'underline' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            style={{ color: toolbarFontColor }}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-300 flex-shrink-0">
          <button
            onClick={() => handleStyleChange({ textAlign: 'left' })}
            className={`p-1 rounded ${currentCellStyle.textAlign === 'left' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            style={{ color: toolbarFontColor }}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStyleChange({ textAlign: 'center' })}
            className={`p-1 rounded ${currentCellStyle.textAlign === 'center' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            style={{ color: toolbarFontColor }}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStyleChange({ textAlign: 'right' })}
            className={`p-1 rounded ${currentCellStyle.textAlign === 'right' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            style={{ color: toolbarFontColor }}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Vertical Alignment */}
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-300 flex-shrink-0">
          <button
            onClick={() => handleStyleChange({ verticalAlign: 'top' })}
            className={`p-1 rounded ${currentCellStyle.verticalAlign === 'top' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            style={{ color: toolbarFontColor }}
            title="Align Top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStyleChange({ verticalAlign: 'middle' })}
            className={`p-1 rounded ${currentCellStyle.verticalAlign === 'middle' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            style={{ color: toolbarFontColor }}
            title="Align Middle"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStyleChange({ verticalAlign: 'bottom' })}
            className={`p-1 rounded ${currentCellStyle.verticalAlign === 'bottom' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            style={{ color: toolbarFontColor }}
            title="Align Bottom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-300 flex-shrink-0">
          <div className="relative group">
            <button
              className="p-1 rounded hover:bg-gray-200 flex items-center gap-0.5"
              style={{ color: toolbarFontColor }}
              title="Fill Color"
            >
              <PaintBucket className="w-4 h-4" />
              <div
                className="w-3 h-3 rounded-sm border border-gray-400"
                style={{ backgroundColor: currentCellStyle.backgroundColor || 'transparent' }}
              />
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:grid grid-cols-8 gap-1 p-2 bg-white border border-gray-300 rounded shadow-lg z-50">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleStyleChange({ backgroundColor: color })}
                  className="w-5 h-5 rounded-sm border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="relative group">
            <button
              className="p-1 rounded hover:bg-gray-200 flex items-center gap-0.5"
              style={{ color: toolbarFontColor }}
              title="Text Color"
            >
              <Type className="w-4 h-4" />
              <div
                className="w-3 h-3 rounded-sm border border-gray-400"
                style={{ backgroundColor: currentCellStyle.color || '#000000' }}
              />
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:grid grid-cols-8 gap-1 p-2 bg-white border border-gray-300 rounded shadow-lg z-50">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleStyleChange({ color })}
                  className="w-5 h-5 rounded-sm border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Borders & Merge */}
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-300 flex-shrink-0">
          <button
            onClick={() => handleStyleChange({ border: '1px solid #000000' })}
            className="p-1 rounded hover:bg-gray-200"
            style={{ color: toolbarFontColor }}
            title="All Borders"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={onMergeCells}
            className="p-1 rounded hover:bg-gray-200"
            style={{ color: toolbarFontColor }}
            title="Merge Cells"
          >
            <Combine className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-1 rounded hover:bg-gray-200"
            style={{ color: toolbarFontColor }}
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Cloud Sync */}
        {onCloudSync && (
          <div className="flex items-center gap-0.5 px-2 flex-shrink-0">
            <button
              onClick={onCloudSync}
              className="p-1 rounded hover:bg-gray-200"
              style={{ color: toolbarFontColor }}
              title="Cloud Sync"
            >
              <Cloud className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* AI Review */}
        {onAIReview && (
          <div className="flex items-center gap-0.5 px-2 border-l border-gray-300 flex-shrink-0">
            <button
              onClick={onAIReview}
              className="flex items-center gap-1 px-2 py-1 rounded bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all"
              title="AI Review & Approve"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">AI Review</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Toolbar
