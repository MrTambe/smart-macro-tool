import React from 'react'
import { Calculator, Check, X } from 'lucide-react'
import { useSpreadsheetStore } from '../../store/spreadsheetStore'
import { useSelectionStore } from '../../store/selectionStore'
import { useFormulaEngine } from '../../hooks/useFormulaEngine'

const FormulaBar: React.FC = () => {
  const {
    formulaBarValue,
    setFormulaBarValue,
    setCellValue,
    isEditing,
    setIsEditing,
    getCellValue,
    getActiveFile,
    getActiveSheet,
    markFileModified,
  } = useSpreadsheetStore()

  const {
    activeCell,
    primaryRange,
    getSelectedCells,
  } = useSelectionStore()

  const activeFile = getActiveFile()
  const activeSheet = getActiveSheet()

  const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormulaBarValue(e.target.value)
  }

  const { evaluateFormula } = useFormulaEngine()

  const handleFormulaSubmit = () => {
    if (activeCell && activeFile && activeSheet) {
      const colLetter = String.fromCharCode(65 + activeCell.col)
      const cellId = `${colLetter}${activeCell.row + 1}`
      const isFormula = formulaBarValue.startsWith('=')
      
      if (isFormula) {
        // Store the formula
        setCellValue(activeFile.id, activeSheet.id, cellId, formulaBarValue, formulaBarValue)
        // Evaluate it immediately
        evaluateFormula(formulaBarValue)
      } else {
        setCellValue(activeFile.id, activeSheet.id, cellId, formulaBarValue)
      }
      markFileModified(activeFile.id, true)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    if (activeCell && activeFile && activeSheet) {
      const colLetter = String.fromCharCode(65 + activeCell.col)
      const cellId = `${colLetter}${activeCell.row + 1}`
      const cellData = getCellValue(activeFile.id, activeSheet.id, cellId)
      setFormulaBarValue(cellData?.formula || cellData?.value || '')
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFormulaSubmit()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const selectedCellsCount = getSelectedCells().length
  
  const displayCell = activeCell 
    ? `${String.fromCharCode(65 + activeCell.col)}${activeCell.row + 1}`
    : selectedCellsCount > 1 
      ? `${selectedCellsCount} cells`
      : ''

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-b border-gray-300">
      {/* Cell Reference Display */}
      <div className="flex items-center gap-1 min-w-[80px]">
        <Calculator className="w-4 h-4 text-gray-500" />
        <div className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono min-w-[60px] text-center">
          {displayCell}
        </div>
      </div>

      {/* Formula Input */}
      <div className="flex-1 flex items-center gap-1">
        <span className="text-gray-500 text-sm">fx</span>
        <input
          type="text"
          value={formulaBarValue}
          onChange={handleFormulaChange}
          onFocus={() => setIsEditing(true)}
          onKeyDown={handleKeyDown}
          placeholder={activeCell ? "Enter value or formula" : "Select a cell"}
          disabled={!activeCell}
          className="flex-1 px-2 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
        />
        
        {isEditing && (
          <>
            <button
              onClick={handleFormulaSubmit}
              className="p-0.5 hover:bg-green-100 rounded text-green-600"
              title="Accept"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-0.5 hover:bg-red-100 rounded text-red-600"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default FormulaBar
