import { useState, useCallback } from 'react'

export interface SpreadsheetData {
  headers: string[]
  rows: any[][]
  sheetName: string
}

export const useFileProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dynamic import of XLSX to avoid bundling issues
  const loadXLSX = async () => {
    const XLSX = await import('xlsx')
    return XLSX
  }

  const processSpreadsheet = useCallback(async (file: File): Promise<SpreadsheetData[]> => {
    setIsProcessing(true)
    setError(null)

    try {
      const XLSX = await loadXLSX()
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      
      const sheets: SpreadsheetData[] = workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        
        const headers = jsonData[0] || []
        const rows = jsonData.slice(1)
        
        return {
          sheetName,
          headers,
          rows,
        }
      })

      return sheets
    } catch (err) {
      setError(`Error processing spreadsheet: ${(err as Error).message}`)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const exportToExcel = useCallback(async (data: SpreadsheetData[], filename: string) => {
    try {
      const XLSX = await loadXLSX()
      const workbook = XLSX.utils.book_new()
      
      data.forEach(sheet => {
        const worksheetData = [sheet.headers, ...sheet.rows]
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName)
      })
      
      XLSX.writeFile(workbook, filename)
      return true
    } catch (err) {
      setError(`Error exporting to Excel: ${(err as Error).message}`)
      return false
    }
  }, [])

  const processDocument = useCallback(async (file: File): Promise<{ content: string, html: string }> => {
    setIsProcessing(true)
    setError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      
      // Use backend API for DOCX processing
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/files/process-document', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to process document')
      }
      
      return await response.json()
    } catch (err) {
      setError(`Error processing document: ${(err as Error).message}`)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const processCSV = useCallback(async (file: File): Promise<SpreadsheetData> => {
    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      const rows = text.split('\n').map(row => row.split(','))
      
      return {
        sheetName: file.name.replace('.csv', ''),
        headers: rows[0] || [],
        rows: rows.slice(1),
      }
    } catch (err) {
      setError(`Error processing CSV: ${(err as Error).message}`)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    isProcessing,
    error,
    processSpreadsheet,
    processDocument,
    processCSV,
    exportToExcel,
  }
}
