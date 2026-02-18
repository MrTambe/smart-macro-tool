import { create } from 'zustand'

export interface CellAddress {
  row: number    // 0-indexed
  col: number    // 0-indexed
  sheet: string  // Sheet ID
  fileId: string // File ID
}

export interface CellRange {
  start: CellAddress
  end: CellAddress
}

// Helper functions for column conversion
export const colIndexToLetter = (index: number): string => {
  let result = ''
  let num = index
  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result
    num = Math.floor(num / 26) - 1
  }
  return result || 'A'
}

export const colLetterToIndex = (letter: string): number => {
  let index = 0
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64)
  }
  return index - 1
}

export interface SelectionState {
  // Active cell (where formula bar shows data)
  activeCell: CellAddress | null
  
  // Primary selection range
  primaryRange: CellRange | null
  
  // Multiple selection ranges (Ctrl+Click)
  secondaryRanges: CellRange[]
  
  // Selection mode
  mode: 'single' | 'range' | 'multi' | 'column' | 'row' | 'all'
  
  // Drag state
  isDragging: boolean
  dragStart: CellAddress | null
  dragCurrent: CellAddress | null
  
  // Clipboard
  clipboard: {
    ranges: CellRange[]
    data: any[][]
    mode: 'cut' | 'copy' | null
  }
  
  // Actions
  setActiveCell: (cell: CellAddress) => void
  setPrimaryRange: (range: CellRange) => void
  addSecondaryRange: (range: CellRange) => void
  clearSelection: () => void
  startDrag: (cell: CellAddress) => void
  updateDrag: (cell: CellAddress) => void
  endDrag: () => void
  
  // Selection helpers
  getSelectedCells: () => CellAddress[]
  getSelectedRanges: () => CellRange[]
  isSelected: (cell: CellAddress) => boolean
  isActiveCell: (cell: CellAddress) => boolean
  isInPrimaryRange: (cell: CellAddress) => boolean
  
  // Range operations
  expandRange: (direction: 'up' | 'down' | 'left' | 'right') => void
  selectRow: (row: number, fileId: string, sheetId: string) => void
  selectColumn: (col: number, fileId: string, sheetId: string) => void
  selectAll: (fileId: string, sheetId: string) => void
  
  // Clipboard operations
  copy: () => void
  cut: (spreadsheetStore: any) => void
  paste: (spreadsheetStore: any) => void
  clearClipboard: () => void
  
  // Keyboard navigation
  moveActiveCell: (direction: 'up' | 'down' | 'left' | 'right', shift?: boolean) => void
  jumpToEdge: (direction: 'up' | 'down' | 'left' | 'right') => void
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  activeCell: null,
  primaryRange: null,
  secondaryRanges: [],
  mode: 'single',
  isDragging: false,
  dragStart: null,
  dragCurrent: null,
  clipboard: { ranges: [], data: [], mode: null },
  
  setActiveCell: (cell) => set({
    activeCell: cell,
    primaryRange: { start: cell, end: cell },
    mode: 'single'
  }),
  
  setPrimaryRange: (range) => set({
    primaryRange: range,
    activeCell: range.start,
    mode: 'range'
  }),
  
  addSecondaryRange: (range) => set((state) => ({
    secondaryRanges: [...state.secondaryRanges, range],
    mode: 'multi'
  })),
  
  clearSelection: () => set({
    activeCell: null,
    primaryRange: null,
    secondaryRanges: [],
    mode: 'single'
  }),
  
  startDrag: (cell) => set({
    isDragging: true,
    dragStart: cell,
    dragCurrent: cell,
    activeCell: cell,
    primaryRange: { start: cell, end: cell }
  }),
  
  updateDrag: (cell) => set((state) => {
    if (!state.dragStart) return {}
    
    return {
      dragCurrent: cell,
      primaryRange: {
        start: state.dragStart,
        end: cell
      }
    }
  }),
  
  endDrag: () => set({
    isDragging: false,
    dragStart: null,
    dragCurrent: null
  }),
  
  getSelectedCells: () => {
    const state = get()
    const cells: CellAddress[] = []
    
    const addRangeCells = (range: CellRange) => {
      const minRow = Math.min(range.start.row, range.end.row)
      const maxRow = Math.max(range.start.row, range.end.row)
      const minCol = Math.min(range.start.col, range.end.col)
      const maxCol = Math.max(range.start.col, range.end.col)
      
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          cells.push({
            row,
            col,
            sheet: range.start.sheet,
            fileId: range.start.fileId
          })
        }
      }
    }
    
    if (state.primaryRange) addRangeCells(state.primaryRange)
    state.secondaryRanges.forEach(addRangeCells)
    
    return cells
  },
  
  getSelectedRanges: () => {
    const state = get()
    return [
      ...(state.primaryRange ? [state.primaryRange] : []),
      ...state.secondaryRanges
    ]
  },
  
  isSelected: (cell) => {
    const active = get().activeCell
    if (active && active.row === cell.row && active.col === cell.col && active.sheet === cell.sheet && active.fileId === cell.fileId) {
        return true
    }

    const range = get().primaryRange
    if (range) {
        const minRow = Math.min(range.start.row, range.end.row)
        const maxRow = Math.max(range.start.row, range.end.row)
        const minCol = Math.min(range.start.col, range.end.col)
        const maxCol = Math.max(range.start.col, range.end.col)
        
        if (cell.row >= minRow && cell.row <= maxRow &&
            cell.col >= minCol && cell.col <= maxCol &&
            cell.sheet === range.start.sheet &&
            cell.fileId === range.start.fileId) {
            return true
        }
    }

    return get().secondaryRanges.some(r => {
        const minRow = Math.min(r.start.row, r.end.row)
        const maxRow = Math.max(r.start.row, r.end.row)
        const minCol = Math.min(r.start.col, r.end.col)
        const maxCol = Math.max(r.start.col, r.end.col)
        
        return cell.row >= minRow && cell.row <= maxRow &&
               cell.col >= minCol && cell.col <= maxCol &&
               cell.sheet === r.start.sheet &&
               cell.fileId === r.start.fileId
    })
  },
  
  isActiveCell: (cell) => {
    const active = get().activeCell
    if (!active) return false
    return active.row === cell.row && 
           active.col === cell.col && 
           active.sheet === cell.sheet &&
           active.fileId === cell.fileId
  },
  
  isInPrimaryRange: (cell) => {
    const range = get().primaryRange
    if (!range) return false
    
    const minRow = Math.min(range.start.row, range.end.row)
    const maxRow = Math.max(range.start.row, range.end.row)
    const minCol = Math.min(range.start.col, range.end.col)
    const maxCol = Math.max(range.start.col, range.end.col)
    
    return cell.row >= minRow && cell.row <= maxRow &&
           cell.col >= minCol && cell.col <= maxCol &&
           cell.sheet === range.start.sheet &&
           cell.fileId === range.start.fileId
  },
  
  expandRange: (direction) => {
    const state = get()
    if (!state.primaryRange) return
    
    const range = state.primaryRange
    let newEnd = { ...range.end }
    
    switch (direction) {
      case 'up':
        newEnd.row = Math.max(0, newEnd.row - 1)
        break
      case 'down':
        newEnd.row += 1
        break
      case 'left':
        newEnd.col = Math.max(0, newEnd.col - 1)
        break
      case 'right':
        newEnd.col += 1
        break
    }
    
    set({
      primaryRange: { ...range, end: newEnd }
    })
  },
  
  selectRow: (row, fileId, sheetId) => {
    const range: CellRange = {
      start: { row, col: 0, sheet: sheetId, fileId },
      end: { row, col: 25, sheet: sheetId, fileId } // Assuming 26 cols A-Z
    }
    
    set({
      primaryRange: range,
      activeCell: { row, col: 0, sheet: sheetId, fileId },
      mode: 'row'
    })
  },
  
  selectColumn: (col, fileId, sheetId) => {
    const range: CellRange = {
      start: { row: 0, col, sheet: sheetId, fileId },
      end: { row: 999, col, sheet: sheetId, fileId } // Assuming 1000 rows
    }
    
    set({
      primaryRange: range,
      activeCell: { row: 0, col, sheet: sheetId, fileId },
      mode: 'column'
    })
  },
  
  selectAll: (fileId, sheetId) => {
    const range: CellRange = {
      start: { row: 0, col: 0, sheet: sheetId, fileId },
      end: { row: 999, col: 25, sheet: sheetId, fileId }
    }
    
    set({
      primaryRange: range,
      activeCell: { row: 0, col: 0, sheet: sheetId, fileId },
      mode: 'all'
    })
  },
  
  copy: () => {
    const state = get()
    const ranges = state.getSelectedRanges()
    
    // Extract data from ranges - will be populated by paste operation
    set({
      clipboard: {
        ranges,
        data: [], // Data will be extracted during paste using the spreadsheet store
        mode: 'copy'
      }
    })
  },
  
  cut: (spreadsheetStore: any) => {
    const state = get()
    const ranges = state.getSelectedRanges()
    
    set({
      clipboard: {
        ranges,
        data: [],
        mode: 'cut'
      }
    })
    
    // Clear the selected ranges in the spreadsheet
    ranges.forEach(range => {
      const file = spreadsheetStore.openFiles.find((f: any) => f.id === range.start.fileId)
      const sheet = file?.sheets.find((s: any) => s.id === range.start.sheet)
      if (!sheet || !file) return
      
      const minRow = Math.min(range.start.row, range.end.row)
      const maxRow = Math.max(range.start.row, range.end.row)
      const minCol = Math.min(range.start.col, range.end.col)
      const maxCol = Math.max(range.start.col, range.end.col)
      
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const colLetter = colIndexToLetter(col)
          const cellId = `${colLetter}${row + 1}`
          spreadsheetStore.setCellValue(file.id, sheet.id, cellId, '')
        }
      }
    })
  },
  
  paste: (spreadsheetStore: any) => {
    const state = get()
    if (!state.activeCell) return
    
    const target = state.activeCell
    const file = spreadsheetStore.openFiles.find((f: any) => f.id === target.fileId)
    const sheet = file?.sheets.find((s: any) => s.id === target.sheet)
    if (!sheet || !file) return
    
    // Get data from clipboard ranges if available
    if (state.clipboard.ranges.length > 0) {
      const range = state.clipboard.ranges[0]
      const sourceFile = spreadsheetStore.openFiles.find((f: any) => f.id === range.start.fileId)
      const sourceSheet = sourceFile?.sheets.find((s: any) => s.id === range.start.sheet)
      
      if (sourceSheet && sourceFile) {
        const minRow = Math.min(range.start.row, range.end.row)
        const maxRow = Math.max(range.start.row, range.end.row)
        const minCol = Math.min(range.start.col, range.end.col)
        const maxCol = Math.max(range.start.col, range.end.col)
        
        let rIdx = 0
        for (let row = minRow; row <= maxRow; row++) {
          let cIdx = 0
          for (let col = minCol; col <= maxCol; col++) {
            const colLetter = colIndexToLetter(col)
            const cellId = `${colLetter}${row + 1}`
            const cellData = spreadsheetStore.getCellValue(sourceFile.id, sourceSheet.id, cellId)
            
            const targetRow = target.row + rIdx
            const targetCol = target.col + cIdx
            if (targetRow < 1000) {
              const targetColLetter = colIndexToLetter(targetCol)
              const targetCellId = `${targetColLetter}${targetRow + 1}`
              spreadsheetStore.setCellValue(file.id, sheet.id, targetCellId, cellData?.value || '')
            }
            cIdx++
          }
          rIdx++
        }
      }
    }
    
    spreadsheetStore.markFileModified(file.id, true)
    
    if (state.clipboard.mode === 'cut') {
      set({
        clipboard: { ranges: [], data: [], mode: null }
      })
    }
  },
  
  clearClipboard: () => {
    set({
      clipboard: { ranges: [], data: [], mode: null }
    })
  },
  
  moveActiveCell: (direction, shift = false) => {
    const state = get()
    if (!state.activeCell) return
    
    const { row, col, sheet, fileId } = state.activeCell
    let newRow = row
    let newCol = col
    
    switch (direction) {
      case 'up':
        newRow = Math.max(0, row - 1)
        break
      case 'down':
        newRow += 1
        break
      case 'left':
        newCol = Math.max(0, col - 1)
        break
      case 'right':
        newCol += 1
        break
    }
    
    const newCell = { row: newRow, col: newCol, sheet, fileId }
    
    if (shift && state.primaryRange) {
      set({
        primaryRange: {
          start: state.primaryRange.start,
          end: newCell
        },
        activeCell: newCell
      })
    } else {
      get().setActiveCell(newCell)
    }
  },
  
  jumpToEdge: (direction) => {
    // Basic jump implementation
    const state = get()
    if (!state.activeCell) return
    
    const { row, col, sheet, fileId } = state.activeCell
    let newRow = row
    let newCol = col
    
    switch (direction) {
      case 'up': newRow = 0; break
      case 'down': newRow = 999; break
      case 'left': newCol = 0; break
      case 'right': newCol = 25; break
    }
    
    get().setActiveCell({ row: newRow, col: newCol, sheet, fileId })
  }
}))

export default useSelectionStore
