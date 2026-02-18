import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { 
  ColDef, 
  GridReadyEvent, 
  CellClickedEvent, 
  CellValueChangedEvent,
  GridApi,
  ICellRendererParams,
} from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import Toolbar from './Toolbar'
import FormulaBar from './FormulaBar'
import SheetTabs from './SheetTabs'
import FileTabs from './FileTabs'
import ContextMenu from './ContextMenu'
import CloudSyncPanel from '../CloudSync/CloudSyncPanel'
import AIReviewPanel from '../AIReview/AIReviewPanel'
import { useFormulaEngine } from '../../hooks/useFormulaEngine'
import { useSpreadsheetStore } from '../../store/spreadsheetStore'
import { useSelectionStore, CellAddress, colLetterToIndex, colIndexToLetter } from '../../store/selectionStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getContrastColor } from '../../utils/contrast'

// Custom cell renderer with selection support
const CellRenderer: React.FC<ICellRendererParams> = (params) => {
  const value = params.value || ''
  const colId = params.column?.getColId() || ''
  const rowIndex = params.rowIndex !== undefined ? params.rowIndex : 0
  
  // Use hooks for reactivity
  const { getCellValue, getActiveFile, getActiveSheet } = useSpreadsheetStore()
  const { isSelected, isActiveCell, isInPrimaryRange } = useSelectionStore()
  
  const file = getActiveFile()
  const sheet = getActiveSheet()
  
  // Build cell address - use proper column letter conversion
  const colIndex = colId.length > 0 ? colLetterToIndex(colId) : 0
  const cellAddress: CellAddress = {
    row: rowIndex,
    col: colIndex,
    sheet: sheet?.id || '',
    fileId: file?.id || ''
  }
  
  // Check selection state
  const selected = isSelected(cellAddress)
  const active = isActiveCell(cellAddress)
  const inRange = isInPrimaryRange(cellAddress)
  
    // Get cell data
    const cellId = `${colId}${rowIndex + 1}`
    let cellData = undefined
    let displayValue = value
    if (file && sheet) {
      cellData = getCellValue(file.id, sheet.id, cellId)
      // For now, just show the raw value
      // Formula evaluation will be added in the data layer
      displayValue = cellData?.value || value
    }
  
  // Check dynamic contrast
  const { enableDynamicContrast } = useSettingsStore()
  
  // Build cell style
  const cellStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    position: 'relative',
    ...(cellData?.style as React.CSSProperties),
  }
  
  // Apply dynamic contrast
  if (enableDynamicContrast && cellStyle.backgroundColor && !cellData?.style?.color) {
    cellStyle.color = getContrastColor(cellStyle.backgroundColor as string)
  }
  
  // Apply text align
  if (cellData?.style?.textAlign) {
    cellStyle.justifyContent = cellData.style.textAlign === 'center' 
      ? 'center' 
      : cellData.style.textAlign === 'right' 
        ? 'flex-end' 
        : 'flex-start'
  }
  
  // Build class names
  const classNames = ['cell-content']
  if (active) classNames.push('cell-active')
  else if (inRange) classNames.push('cell-in-range')
  else if (selected) classNames.push('cell-selected')

  return (
    <div 
      className={classNames.join(' ')} 
      style={cellStyle}
      data-row={rowIndex}
      data-col={colId}
    >
      {displayValue}
      
      {/* Fill handle for active cell */}
      {active && (
        <div
          className="fill-handle"
          style={{
            position: 'absolute',
            bottom: -3,
            right: -3,
            width: 6,
            height: 6,
            backgroundColor: '#4285f4',
            cursor: 'crosshair',
            border: '1px solid white',
            borderRadius: '50%',
            zIndex: 10
          }}
        />
      )}
    </div>
  )
}

// Generate column definitions
const generateColumns = (count: number = 26): ColDef[] => {
  const cols: ColDef[] = []
  
  // Row number column (frozen)
  cols.push({
    field: 'rowNum',
    headerName: '',
    width: 50,
    pinned: 'left',
    editable: false,
    sortable: false,
    filter: false,
    resizable: false,
    cellClass: 'row-number-cell',
    cellRenderer: (params: ICellRendererParams) => {
      const rowIndex = params.node?.rowIndex
      return rowIndex !== undefined && rowIndex !== null ? rowIndex + 1 : ''
    },
    cellStyle: {
      backgroundColor: '#f5f5f5',
      textAlign: 'center',
      fontWeight: 600,
      color: '#666',
      borderRight: '2px solid #ccc',
      cursor: 'pointer'
    },
    headerClass: 'spreadsheet-header',
  })
  
  // Letter columns (A-Z)
  for (let i = 0; i < count; i++) {
    const colLetter = String.fromCharCode(65 + i)
    cols.push({
      field: colLetter,
      headerName: colLetter,
      width: 100,
      editable: true,
      sortable: false,
      filter: false,
      resizable: true,
      cellRenderer: CellRenderer,
      headerClass: 'spreadsheet-header',
    })
  }
  
  return cols
}

// Generate empty row data
const generateRowData = (count: number = 1000): any[] => {
  return Array.from({ length: count }, (_, index) => ({
    rowNum: index + 1,
    ...Object.fromEntries(
      Array.from({ length: 26 }, (_, colIndex) => [
        String.fromCharCode(65 + colIndex),
        '',
      ])
    ),
  }))
}

interface SpreadsheetEditorProps {
  fileName?: string
}

const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({ fileName }) => {
  const gridRef = useRef<AgGridReact>(null)
  const [localGridApi, setLocalGridApi] = useState<GridApi | null>(null)
  const [localRowData, setLocalRowData] = useState<any[]>([])
  const [isGridReady, setIsGridReady] = useState(false)
  const [showCloudSync, setShowCloudSync] = useState(false)
  const [showAIReview, setShowAIReview] = useState(false)
  
  // Formula engine integration
  const { getComputedValue, recalculateFormulas } = useFormulaEngine()
  
  // Use selection store for proper selection management
  const {
    activeCell,
    primaryRange,
    isDragging,
    setActiveCell,
    setPrimaryRange,
    startDrag,
    updateDrag,
    endDrag,
    isSelected,
    moveActiveCell,
    jumpToEdge,
    copy,
    cut,
    paste,
    selectRow,
    selectColumn,
    selectAll,
  } = useSelectionStore()
  
  const {
    setCellValue,
    setFormulaBarValue,
    getCellValue,
    selectCells,
    setIsEditing,
    setContextMenu,
    getActiveFile,
    getActiveSheet,
    markFileModified,
    setGridApi,
  } = useSpreadsheetStore()

  const activeFile = getActiveFile()
  const activeSheet = getActiveSheet()

  // Initialize
  useEffect(() => {
    setLocalRowData(generateRowData(1000))
  }, [])

  // Sync data when file/sheet changes
  useEffect(() => {
    if (!localGridApi || !isGridReady || !activeFile || !activeSheet) return

    const newRowData = generateRowData(1000)
    
    const cells = activeSheet.cells
    if (cells instanceof Map) {
      cells.forEach((cellData, cellId) => {
        if (typeof cellId !== 'string') return
        const match = cellId.match(/([A-Z]+)(\d+)/)
        if (match) {
          const col = match[1]
          const row = parseInt(match[2]) - 1
          if (newRowData[row]) {
            newRowData[row][col] = cellData?.value || ''
          }
        }
      })
    } else if (cells && typeof cells === 'object' && !(cells instanceof Map)) {
      // Handle plain object format from localStorage rehydration
      Object.entries(cells).forEach(([cellId, cellData]: [string, any]) => {
        if (typeof cellId !== 'string') return
        const match = cellId.match(/([A-Z]+)(\d+)/)
        if (match) {
          const col = match[1]
          const row = parseInt(match[2]) - 1
          if (newRowData[row]) {
            newRowData[row][col] = cellData?.value || ''
          }
        }
      })
    }
    
    setLocalRowData(newRowData)
    localGridApi.refreshCells({ force: true })
  }, [activeFile?.id, activeSheet?.id, localGridApi, isGridReady])

  const columns = useMemo(() => generateColumns(26), [])

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api)
    setLocalGridApi(params.api)
    setIsGridReady(true)
  }, [setGridApi])

  const getCellAddressFromEvent = useCallback((event: any): CellAddress | null => {
    if (!event.column || event.column.getColId() === 'rowNum') return null
    if (!activeFile || !activeSheet) return null
    
    const colId = event.column?.getColId() || ''
    const rowIndex = event.rowIndex != null ? event.rowIndex : 0
    
    return {
      row: rowIndex,
      col: colLetterToIndex(colId),
      sheet: activeSheet.id,
      fileId: activeFile.id
    }
  }, [activeFile, activeSheet])

  const onCellClicked = useCallback((event: CellClickedEvent) => {
    const colId = event.column?.getColId()
    
    // If clicking row number column, select the row
    if (colId === 'rowNum') {
      if (!activeFile || !activeSheet) return
      const rowIndex = event.node?.rowIndex
      if (rowIndex !== undefined && rowIndex !== null) {
        selectRow(rowIndex, activeFile.id, activeSheet.id)
      }
      return
    }

    const cellAddress = getCellAddressFromEvent(event)
    if (!cellAddress) return
    
    // Check if this is part of an existing selection
    const selectionStore = useSelectionStore.getState()
    const isAlreadySelected = selectionStore.isSelected(cellAddress)
    
    // Only clear selection if clicking on a non-selected cell without modifiers
    const hasModifier = event.event?.ctrlKey || event.event?.metaKey || event.event?.shiftKey
    
    if (!isAlreadySelected || hasModifier) {
      setActiveCell(cellAddress)
      
      const cellId = `${colId}${cellAddress.row + 1}`
      
      // Sync selection for toolbar
      selectCells([cellId])
    } else {
      // Clicking on already selected cell - just update active cell, keep selection
      setActiveCell(cellAddress)
    }
    
    const cellId = `${colId}${cellAddress.row + 1}`
    const cellData = getCellValue(activeFile?.id || '', activeSheet?.id || '', cellId)
    setFormulaBarValue(cellData?.formula || cellData?.value || '')
    setIsEditing(false)
  }, [getCellAddressFromEvent, setActiveCell, selectCells, getCellValue, setFormulaBarValue, setIsEditing, activeFile, activeSheet, selectRow])

  const onCellMouseDown = useCallback((event: any) => {
    const colId = event.column?.getColId()
    if (colId === 'rowNum') return

    const cellAddress = getCellAddressFromEvent(event)
    if (!cellAddress) return
    
    startDrag(cellAddress)
    setActiveCell(cellAddress)
    
    const cellId = `${colId}${cellAddress.row + 1}`
    selectCells([cellId])
    
    // Refresh cells to show initial selection
    if (localGridApi) localGridApi.refreshCells({ force: true })
  }, [getCellAddressFromEvent, startDrag, setActiveCell, selectCells, localGridApi])

  const onCellMouseOver = useCallback((event: any) => {
    if (!isDragging) return
    const cellAddress = getCellAddressFromEvent(event)
    if (!cellAddress) return
    
    updateDrag(cellAddress)
    
    // Sync range selection with spreadsheetStore
    const selectionState = useSelectionStore.getState()
    const cells = selectionState.getSelectedCells()
    const active = selectionState.activeCell
    const activeId = active ? `${colIndexToLetter(active.col)}${active.row + 1}` : null
    
    let cellIds = cells.map(c => `${colIndexToLetter(c.col)}${c.row + 1}`)
    if (activeId) {
      cellIds = [activeId, ...cellIds.filter(id => id !== activeId)]
    }
    
    selectCells(cellIds)
    
    // Refresh cells during drag to update visual selection
    if (localGridApi) localGridApi.refreshCells({ force: true })
  }, [isDragging, getCellAddressFromEvent, updateDrag, selectCells, localGridApi])

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    if (!event.column || event.column.getColId() === 'rowNum') return
    if (!activeFile || !activeSheet) return
    
    const colId = event.column?.getColId() || ''
    const rowIndex = event.rowIndex != null ? event.rowIndex : 0
    const cellId = `${colId}${rowIndex + 1}`
    const value = event.newValue || ''
    
    setCellValue(activeFile.id, activeSheet.id, cellId, value)
    markFileModified(activeFile.id, true)
  }, [activeFile, activeSheet, setCellValue, markFileModified])

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      endDrag()
    }
    
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [endDrag])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      const { key, shiftKey, ctrlKey, metaKey } = e
      const cmd = ctrlKey || metaKey
      
      // Arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault()
        const direction = key.replace('Arrow', '').toLowerCase() as any
        
        if (cmd && !shiftKey) {
          jumpToEdge(direction)
        } else {
          moveActiveCell(direction, shiftKey)
        }
        return
      }
      
      // Enter
      if (key === 'Enter') {
        e.preventDefault()
        if (shiftKey) {
          moveActiveCell('up')
        } else {
          moveActiveCell('down')
        }
        return
      }
      
      // Tab
      if (key === 'Tab') {
        e.preventDefault()
        if (shiftKey) {
          moveActiveCell('left')
        } else {
          moveActiveCell('right')
        }
        return
      }
      
      // Copy/Cut/Paste
      if (cmd && key === 'c') {
        e.preventDefault()
        copy()
        return
      }
      
      if (cmd && key === 'x') {
        e.preventDefault()
        cut(useSpreadsheetStore.getState())
        return
      }
      
      if (cmd && key === 'v') {
        e.preventDefault()
        paste(useSpreadsheetStore.getState())
        return
      }
      
      // Select All
      if (cmd && key === 'a') {
        e.preventDefault()
        if (activeFile && activeSheet) {
          selectAll(activeFile.id, activeSheet.id)
        }
        return
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeFile, activeSheet, moveActiveCell, jumpToEdge, copy, cut, paste, selectAll])

  // Helper to convert column letter to index (A=0, B=1, ..., Z=25, AA=26, ...)
  const colLetterToIndex = (letter: string): number => {
    let index = 0
    for (let i = 0; i < letter.length; i++) {
      index = index * 26 + (letter.charCodeAt(i) - 64)
    }
    return index - 1
  }

  const onHeaderClicked = useCallback((event: any) => {
    if (!activeFile || !activeSheet) return
    const colId = event.column?.getColId()
    if (!colId || colId === 'rowNum') return

    const colIndex = colLetterToIndex(colId)
    selectColumn(colIndex, activeFile.id, activeSheet.id)
    
    // Sync with spreadsheetStore
    const selectionState = useSelectionStore.getState()
    const cells = selectionState.getSelectedCells()
    const cellIds = cells.map(c => `${colIndexToLetter(c.col)}${c.row + 1}`)
    selectCells(cellIds)
    
    // Refresh to show selection
    if (localGridApi) localGridApi.refreshCells({ force: true })
  }, [activeFile, activeSheet, selectColumn, selectCells, localGridApi])

  const onCellContextMenu = useCallback((event: any) => {
    event.event.preventDefault()
    
    const cellAddress = getCellAddressFromEvent(event)
    if (!cellAddress) return
    
    // Check latest selection state from store to avoid closure issues
    const selectionStore = useSelectionStore.getState()
    const isAlreadySelected = selectionStore.isSelected(cellAddress)
    const isInPrimaryRange = selectionStore.isInPrimaryRange(cellAddress)
    
    // CRITICAL FIX: If cell is part of current selection (including drag selection),
    // preserve the entire selection for context menu operations
    // Only select single cell if clicking outside current selection
    if (!isAlreadySelected && !isInPrimaryRange) {
      setActiveCell(cellAddress)
      const colId = colIndexToLetter(cellAddress.col)
      const cellId = `${colId}${cellAddress.row + 1}`
      selectCells([cellId])
    } else {
      // Cell is already selected - just update active cell but keep selection
      setActiveCell(cellAddress)
    }
    
    setContextMenu({
      x: event.event.clientX,
      y: event.event.clientY,
      visible: true,
    })
    
    // Ensure grid reflects selection state
    if (localGridApi) localGridApi.refreshCells({ force: true })
  }, [getCellAddressFromEvent, setActiveCell, selectCells, setContextMenu, localGridApi])

  const onRowClicked = useCallback((event: any) => {
    if (!activeFile || !activeSheet) return
    const rowIndex = event.node?.rowIndex
    if (rowIndex === undefined || rowIndex === null) return
    selectRow(rowIndex, activeFile.id, activeSheet.id)
  }, [activeFile, activeSheet, selectRow])

  const defaultColDef = useMemo(() => ({
    sortable: false,
    filter: false,
    resizable: true,
    editable: true,
    cellClass: 'spreadsheet-cell',
  }), [])

  const handleMergeCells = useCallback(() => {
    if (!activeFile || !activeSheet) return
    const cells = useSelectionStore.getState().getSelectedCells()
    if (cells.length < 2) return
    
    const cellIds = cells.map(c => `${colIndexToLetter(c.col)}${c.row + 1}`)
    useSpreadsheetStore.getState().mergeCells(activeFile.id, activeSheet.id, cellIds)
    markFileModified(activeFile.id, true)
  }, [activeFile, activeSheet, markFileModified])

  const handleUnmergeCells = useCallback(() => {
    if (!activeFile || !activeSheet) return
    const cells = useSelectionStore.getState().getSelectedCells()
    if (cells.length === 0) return
    
    const cellIds = cells.map(c => `${colIndexToLetter(c.col)}${c.row + 1}`)
    useSpreadsheetStore.getState().unmergeCells(activeFile.id, activeSheet.id, cellIds)
    markFileModified(activeFile.id, true)
  }, [activeFile, activeSheet, markFileModified])

  const handleCloudSync = useCallback(() => {
    setShowCloudSync(true)
  }, [])

  const handleAIReview = useCallback(() => {
    setShowAIReview(true)
  }, [])

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <FileTabs />
      <Toolbar 
        onMergeCells={handleMergeCells} 
        onUnmergeCells={handleUnmergeCells} 
        onCloudSync={handleCloudSync}
        onAIReview={handleAIReview}
      />
      <FormulaBar />
      <div className="flex-1 ag-theme-alpine relative">
        <AgGridReact
          ref={gridRef}
          columnDefs={columns}
          rowData={localRowData}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onCellClicked={onCellClicked}
          onCellMouseDown={onCellMouseDown}
          onCellMouseOver={onCellMouseOver}
          onCellValueChanged={onCellValueChanged}
          onCellContextMenu={onCellContextMenu}
          onColumnHeaderClicked={onHeaderClicked}
          rowHeight={24}
          headerHeight={28}
          suppressMovableColumns={false}
          suppressDragLeaveHidesColumns={true}
          animateRows={false}
          getRowId={(params: any) => String(params.data.rowNum)}
          stopEditingWhenCellsLoseFocus={true}
          suppressCellFocus={true}
          enableCellTextSelection={false}
        />
      </div>
      <SheetTabs />
      <ContextMenu />
      
      {/* Cloud Sync Panel */}
      {showCloudSync && (
        <CloudSyncPanel onClose={() => setShowCloudSync(false)} />
      )}
      
      {/* AI Review Panel */}
      {showAIReview && (
        <AIReviewPanel onClose={() => setShowAIReview(false)} />
      )}
    </div>
  )
}

export default SpreadsheetEditor
