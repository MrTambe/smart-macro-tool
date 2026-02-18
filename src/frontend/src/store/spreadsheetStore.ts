import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getContrastColor } from '../utils/contrast'
import { GridApi } from 'ag-grid-community'

export interface CellStyle {
  fontWeight?: string
  fontStyle?: string
  textDecoration?: string
  fontFamily?: string
  fontSize?: string
  textAlign?: string
  verticalAlign?: string
  backgroundColor?: string
  color?: string
  border?: string
}

export interface CellData {
  value: string
  formula?: string
  style?: CellStyle
  computed?: any
}

export interface Sheet {
  id: string
  name: string
  cells: Map<string, CellData>
  columnWidths: Map<string, number>
  rowHeights: Map<string, number>
  mergedCells: string[]
}

export interface OpenFile {
  id: string
  name: string
  path?: string
  sheets: Sheet[]
  activeSheetId: string
  isModified: boolean
}

export interface SpreadsheetState {
  // Multi-file support
  openFiles: OpenFile[]
  activeFileId: string
  
  // Current file state
  selectedCells: string[]
  clipboard: { cells: Map<string, CellData>; type: 'copy' | 'cut' } | null
  formulaBarValue: string
  isEditing: boolean
  currentCellStyle: CellStyle
  contextMenu: { x: number; y: number; visible: boolean } | null
  isDragging: boolean
  dragSource: string | null
  gridApi: GridApi | null
  
  // Actions
  setGridApi: (api: GridApi | null) => void
  openFile: (name: string, path?: string) => void
  closeFile: (id: string) => void
  setActiveFile: (id: string) => void
  markFileModified: (id: string, modified: boolean) => void
  
  // Sheet actions
  createSheet: (fileId: string, name?: string) => void
  deleteSheet: (fileId: string, sheetId: string) => void
  renameSheet: (fileId: string, sheetId: string, name: string) => void
  setActiveSheet: (fileId: string, sheetId: string) => void
  
  // Cell actions
  setCellValue: (fileId: string, sheetId: string, cellId: string, value: string, formula?: string) => void
  setCellStyle: (fileId: string, sheetId: string, cellId: string, style: Partial<CellStyle>) => void
  getCellValue: (fileId: string, sheetId: string, cellId: string) => CellData | undefined
  selectCells: (cellIds: string[]) => void
  clearSelection: () => void
  
  // Bulk operations
  applyStyleToSelection: (style: Partial<CellStyle>) => void
  clearCells: (fileId: string, sheetId: string, cellIds: string[]) => void
  copyCells: (fileId: string, sheetId: string, cellIds: string[], type: 'copy' | 'cut') => void
  pasteCells: (fileId: string, sheetId: string, targetCellId: string) => void
  mergeCells: (fileId: string, sheetId: string, cellIds: string[]) => void
  unmergeCells: (fileId: string, sheetId: string, cellIds: string[]) => void
  deleteRow: (fileId: string, sheetId: string, rowIndex: number) => void
  deleteColumn: (fileId: string, sheetId: string, colId: string) => void
  
  // UI actions
  setFormulaBarValue: (value: string) => void
  setIsEditing: (isEditing: boolean) => void
  setContextMenu: (menu: { x: number; y: number; visible: boolean } | null) => void
  setIsDragging: (isDragging: boolean) => void
  setDragSource: (cellId: string | null) => void
  
  // Helpers
  getActiveFile: () => OpenFile | undefined
  getActiveSheet: () => Sheet | undefined
  refreshGrid: () => void
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const createEmptySheet = (name: string = 'Sheet1'): Sheet => ({
  id: generateId(),
  name,
  cells: new Map(),
  columnWidths: new Map(),
  rowHeights: new Map(),
  mergedCells: [],
})

const createNewFile = (name: string, path?: string): OpenFile => {
  const sheet = createEmptySheet('Sheet1')
  return {
    id: generateId(),
    name,
    path,
    sheets: [sheet],
    activeSheetId: sheet.id,
    isModified: false,
  }
}

// Create initial file
const initialFile = createNewFile('Untitled Spreadsheet')

export const useSpreadsheetStore = create<SpreadsheetState>()(
  persist(
    (set, get) => ({
      // Initial state
      openFiles: [initialFile],
      activeFileId: initialFile.id,
      selectedCells: [],
      clipboard: null,
      formulaBarValue: '',
      isEditing: false,
      currentCellStyle: {},
      contextMenu: null,
      isDragging: false,
      dragSource: null,
      gridApi: null,

      // UI actions
      setGridApi: (api) => set({ gridApi: api }),
      refreshGrid: () => {
        const { gridApi } = get()
        if (gridApi) {
          gridApi.refreshCells({ force: true })
        }
      },

      // File operations
      openFile: (name, path) => {
        const newFile = createNewFile(name, path)
        set((state) => ({
          openFiles: [...state.openFiles, newFile],
          activeFileId: newFile.id,
          selectedCells: [],
          formulaBarValue: '',
        }))
      },

      closeFile: (id) => {
        set((state) => {
          const newFiles = state.openFiles.filter((f) => f.id !== id)
          if (newFiles.length === 0) {
            const newFile = createNewFile('Untitled Spreadsheet')
            newFiles.push(newFile)
            return {
              openFiles: newFiles,
              activeFileId: newFile.id,
              selectedCells: [],
            }
          }
          return {
            openFiles: newFiles,
            activeFileId: state.activeFileId === id ? newFiles[0].id : state.activeFileId,
          }
        })
      },

      setActiveFile: (id) => {
        set({
          activeFileId: id,
          selectedCells: [],
          formulaBarValue: '',
          isEditing: false,
        })
      },

      markFileModified: (id, modified) => {
        set((state) => ({
          openFiles: state.openFiles.map((f) =>
            f.id === id ? { ...f, isModified: modified } : f
          ),
        }))
      },

      // Sheet operations
      createSheet: (fileId, name) => {
        set((state) => {
          const file = state.openFiles.find((f) => f.id === fileId)
          if (!file) return state

          const newSheet = createEmptySheet(name || `Sheet${file.sheets.length + 1}`)
          return {
            openFiles: state.openFiles.map((f) =>
              f.id === fileId
                ? { ...f, sheets: [...f.sheets, newSheet], activeSheetId: newSheet.id }
                : f
            ),
          }
        })
        get().markFileModified(fileId, true)
      },

      deleteSheet: (fileId, sheetId) => {
        set((state) => {
          const file = state.openFiles.find((f) => f.id === fileId)
          if (!file || file.sheets.length <= 1) return state

          const newSheets = file.sheets.filter((s) => s.id !== sheetId)
          return {
            openFiles: state.openFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    sheets: newSheets,
                    activeSheetId: f.activeSheetId === sheetId ? newSheets[0].id : f.activeSheetId,
                  }
                : f
            ),
          }
        })
        get().markFileModified(fileId, true)
      },

      renameSheet: (fileId, sheetId, name) => {
        set((state) => ({
          openFiles: state.openFiles.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  sheets: f.sheets.map((s) => (s.id === sheetId ? { ...s, name } : s)),
                }
              : f
          ),
        }))
        get().markFileModified(fileId, true)
      },

      setActiveSheet: (fileId, sheetId) => {
        set((state) => ({
          openFiles: state.openFiles.map((f) =>
            f.id === fileId ? { ...f, activeSheetId: sheetId } : f
          ),
          selectedCells: [],
          formulaBarValue: '',
        }))
      },

      // Cell operations
      setCellValue: (fileId, sheetId, cellId, value, formula) => {
        set((state) => {
          const file = state.openFiles.find((f) => f.id === fileId)
          if (!file) return state

          const sheet = file.sheets.find((s) => s.id === sheetId)
          if (!sheet) return state

          const newCells = new Map(sheet.cells)
          const existing = newCells.get(cellId) || { value: '' }
          
          let style = existing.style || {}
          if (style.backgroundColor && !style.color) {
            style = { ...style, color: getContrastColor(style.backgroundColor) }
          }
          
          newCells.set(cellId, { ...existing, value, formula, style })

          return {
            openFiles: state.openFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    sheets: f.sheets.map((s) =>
                      s.id === sheetId ? { ...s, cells: newCells } : s
                    ),
                    isModified: true,
                  }
                : f
            ),
          }
        })
      },

      setCellStyle: (fileId, sheetId, cellId, style) => {
        set((state) => {
          const file = state.openFiles.find((f) => f.id === fileId)
          if (!file) return state

          const sheet = file.sheets.find((s) => s.id === sheetId)
          if (!sheet) return state

          const newCells = new Map(sheet.cells)
          const existing = newCells.get(cellId) || { value: '' }
          
          const mergedStyle = { ...existing.style, ...style }
          if (mergedStyle.backgroundColor && !mergedStyle.color) {
            mergedStyle.color = getContrastColor(mergedStyle.backgroundColor)
          }
          
          newCells.set(cellId, { ...existing, style: mergedStyle })

          return {
            openFiles: state.openFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    sheets: f.sheets.map((s) =>
                      s.id === sheetId ? { ...s, cells: newCells } : s
                    ),
                    isModified: true,
                  }
                : f
            ),
          }
        })
      },

      getCellValue: (fileId, sheetId, cellId) => {
        const file = get().openFiles.find((f) => f.id === fileId)
        const sheet = file?.sheets.find((s) => s.id === sheetId)
        
        if (!sheet) return undefined
        
        if (sheet.cells instanceof Map) {
          return sheet.cells.get(cellId)
        } else if (Array.isArray(sheet.cells)) {
          const found = (sheet.cells as any[]).find((item: any) => {
            if (Array.isArray(item)) return item[0] === cellId
            if (item && typeof item === 'object') return Object.keys(item)[0] === cellId
            return false
          })
          if (Array.isArray(found)) return found[1]
          if (found && typeof found === 'object') return (found as any)[cellId]
          return undefined
        } else if (sheet.cells && typeof sheet.cells === 'object') {
          return (sheet.cells as any)[cellId]
        }
        
        return undefined
      },

      selectCells: (cellIds) => {
        set({ selectedCells: cellIds })
        
        if (cellIds.length > 0) {
          const state = get()
          const file = state.getActiveFile()
          const sheet = state.getActiveSheet()
          if (file && sheet) {
            const cellData = get().getCellValue(file.id, sheet.id, cellIds[0])
            set({ 
              formulaBarValue: cellData?.formula || cellData?.value || '',
              currentCellStyle: cellData?.style || {}
            })
          }
        }
      },

      clearSelection: () => {
        set({ selectedCells: [], currentCellStyle: {} })
      },

      // Bulk operations
      applyStyleToSelection: (style) => {
        const { activeFileId, selectedCells, getActiveSheet, currentCellStyle } = get()
        const file = get().getActiveFile()
        const sheet = getActiveSheet()
        
        if (!file || !sheet || selectedCells.length === 0) return

        const newStyle = { ...currentCellStyle, ...style }
        set({ currentCellStyle: newStyle })

        selectedCells.forEach((cellId) => {
          get().setCellStyle(activeFileId, sheet.id, cellId, style)
        })
        get().refreshGrid()
      },

      clearCells: (fileId, sheetId, cellIds) => {
        set((state) => {
          const file = state.openFiles.find((f) => f.id === fileId)
          if (!file) return state

          const sheet = file.sheets.find((s) => s.id === sheetId)
          if (!sheet) return state

          const newCells = new Map(sheet.cells)
          cellIds.forEach((id) => {
            newCells.delete(id)
          })

          return {
            openFiles: state.openFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    sheets: f.sheets.map((s) =>
                      s.id === sheetId ? { ...s, cells: newCells } : s
                    ),
                    isModified: true,
                  }
                : f
            ),
          }
        })
        get().refreshGrid()
      },

      copyCells: (fileId, sheetId, cellIds, type) => {
        const file = get().openFiles.find((f) => f.id === fileId)
        const sheet = file?.sheets.find((s) => s.id === sheetId)
        if (!sheet) return

        const cells = new Map<string, CellData>()
        cellIds.forEach((id) => {
          const cellData = get().getCellValue(fileId, sheetId, id)
          if (cellData) {
            cells.set(id, { ...cellData })
          }
        })

        set({ clipboard: { cells, type } })
      },

      pasteCells: (fileId, sheetId, targetCellId) => {
        const { clipboard } = get()
        if (!clipboard) return

        set((state) => {
          const file = state.openFiles.find((f) => f.id === fileId)
          if (!file) return state

          const sheet = file.sheets.find((s) => s.id === sheetId)
          if (!sheet) return state

          const newCells = new Map(sheet.cells)
          
          const match = targetCellId.match(/([A-Z]+)(\d+)/)
          if (!match) return state
          
          const targetCol = match[1]
          const targetRow = parseInt(match[2])

          clipboard.cells.forEach((cellData, sourceCellId) => {
            const sourceMatch = sourceCellId.match(/([A-Z]+)(\d+)/)
            if (!sourceMatch) return

            const sourceCol = sourceMatch[1]
            const sourceRow = parseInt(sourceMatch[2])

            const colOffset = targetCol.charCodeAt(0) - sourceCol.charCodeAt(0)
            const rowOffset = targetRow - sourceRow

            const newCol = String.fromCharCode(sourceCol.charCodeAt(0) + colOffset)
            const newRow = sourceRow + rowOffset
            const newCellId = `${newCol}${newRow}`

            newCells.set(newCellId, { ...cellData })
          })

          return {
            openFiles: state.openFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    sheets: f.sheets.map((s) =>
                      s.id === sheetId ? { ...s, cells: newCells } : s
                    ),
                    isModified: true,
                  }
                : f
            ),
          }
        })

        if (clipboard.type === 'cut') {
          set({ clipboard: null })
        }
        get().refreshGrid()
      },

      mergeCells: (fileId, sheetId, cellIds) => {
        set((state) => {
          const file = state.openFiles.find((f) => f.id === fileId)
          if (!file) return state

          const sheet = file.sheets.find((s) => s.id === sheetId)
          if (!sheet) return state

          const mergedCells = [...sheet.mergedCells, ...cellIds]
          return {
            openFiles: state.openFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    sheets: f.sheets.map((s) =>
                      s.id === sheetId ? { ...s, mergedCells } : s
                    ),
                    isModified: true,
                  }
                : f
            ),
          }
        })
        get().refreshGrid()
      },

      unmergeCells: (fileId, sheetId, cellIds) => {
        set((state) => {
          const file = state.openFiles.find((f) => f.id === fileId)
          if (!file) return state

          const sheet = file.sheets.find((s) => s.id === sheetId)
          if (!sheet) return state

          const mergedCells = sheet.mergedCells.filter((id) => !cellIds.includes(id))
          return {
            openFiles: state.openFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    sheets: f.sheets.map((s) =>
                      s.id === sheetId ? { ...s, mergedCells } : s
                    ),
                    isModified: true,
                  }
                : f
            ),
          }
        })
        get().refreshGrid()
      },

      deleteRow: (fileId, sheetId, rowIndex) => {
        set((state) => {
          const file = state.openFiles.find((f) => f.id === fileId)
          if (!file) return state

          const sheet = file.sheets.find((s) => s.id === sheetId)
          if (!sheet) return state

          const newCells = new Map<string, CellData>()
          
          sheet.cells.forEach((cellData, cellId) => {
            if (typeof cellId !== 'string') return
            const match = cellId.match(/([A-Z]+)(\d+)/)
            if (!match) return
            
            const col = match[1]
            const row = parseInt(match[2])
            
            if (row < rowIndex) {
              newCells.set(cellId, cellData)
            } else if (row > rowIndex) {
              const newCellId = `${col}${row - 1}`
              newCells.set(newCellId, cellData)
            }
          })

          return {
            openFiles: state.openFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    sheets: f.sheets.map((s) =>
                      s.id === sheetId ? { ...s, cells: newCells } : s
                    ),
                    isModified: true,
                  }
                : f
            ),
          }
        })
        get().refreshGrid()
      },

      deleteColumn: (fileId, sheetId, colId) => {
        set((state) => {
          const file = state.openFiles.find((f) => f.id === fileId)
          if (!file) return state

          const sheet = file.sheets.find((s) => s.id === sheetId)
          if (!sheet) return state

          const newCells = new Map<string, CellData>()
          const deletedColCode = colId.charCodeAt(0)
          
          sheet.cells.forEach((cellData, cellId) => {
            if (typeof cellId !== 'string') return
            const match = cellId.match(/([A-Z]+)(\d+)/)
            if (!match) return
            
            const col = match[1]
            const row = parseInt(match[2])
            const colCode = col.charCodeAt(0)
            
            if (colCode < deletedColCode) {
              newCells.set(cellId, cellData)
            } else if (colCode > deletedColCode) {
              const newCol = String.fromCharCode(colCode - 1)
              const newCellId = `${newCol}${row}`
              newCells.set(newCellId, cellData)
            }
          })

          return {
            openFiles: state.openFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    sheets: f.sheets.map((s) =>
                      s.id === sheetId ? { ...s, cells: newCells } : s
                    ),
                    isModified: true,
                  }
                : f
            ),
          }
        })
        get().refreshGrid()
      },

      setFormulaBarValue: (value) => set({ formulaBarValue: value }),
      setIsEditing: (isEditing) => set({ isEditing }),
      setContextMenu: (menu) => set({ contextMenu: menu }),
      setIsDragging: (isDragging) => set({ isDragging }),
      setDragSource: (cellId) => set({ dragSource: cellId }),

      // Helpers
      getActiveFile: () => {
        return get().openFiles.find((f) => f.id === get().activeFileId)
      },
      getActiveSheet: () => {
        const file = get().getActiveFile()
        return file?.sheets.find((s) => s.id === file.activeSheetId)
      },
    }),
    {
      name: 'spreadsheet-storage-v2',
      partialize: (state) => ({
        openFiles: state.openFiles.map((file) => ({
          ...file,
          sheets: file.sheets.map((sheet) => ({
            ...sheet,
            cells: Array.from(sheet.cells.entries()),
            columnWidths: Array.from(sheet.columnWidths.entries()),
            rowHeights: Array.from(sheet.rowHeights.entries()),
          })),
        })),
        activeFileId: state.activeFileId,
      }),
      onRehydrateStorage: () => (state: any) => {
        if (state) {
          try {
            state.openFiles = state.openFiles.map((file: any) => ({
              ...file,
              sheets: file.sheets.map((sheet: any) => ({
                ...sheet,
                cells: new Map(Array.isArray(sheet.cells) ? sheet.cells : Object.entries(sheet.cells || {})),
                columnWidths: new Map(Array.isArray(sheet.columnWidths) ? sheet.columnWidths : Object.entries(sheet.columnWidths || {})),
                rowHeights: new Map(Array.isArray(sheet.rowHeights) ? sheet.rowHeights : Object.entries(sheet.rowHeights || {})),
              })),
            }))
            if (!state.activeFileId && state.openFiles.length > 0) {
              state.activeFileId = state.openFiles[0].id
            }
          } catch (e) {
            console.error('[Spreadsheet Store] Rehydration error:', e)
          }
        }
      },
    }
  )
)

export default useSpreadsheetStore
