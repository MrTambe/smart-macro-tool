import { useEffect, useRef, useCallback } from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore';
import { evaluateFormula } from '../services/spreadsheetEngine';

// Hook to integrate formula evaluation with the spreadsheet store
export const useFormulaEngine = () => {
  const { 
    openFiles, 
    getActiveFile, 
    getActiveSheet, 
    setCellValue,
    activeFileId
  } = useSpreadsheetStore();

  // Convert store data to format expected by formula engine
  const getDataForEngine = useCallback(() => {
    const file = getActiveFile();
    const sheet = getActiveSheet();
    
    if (!file || !sheet) return {};
    
    const data: Record<string, any> = {};
    
    // Handle both Map and plain object formats
    if (sheet.cells instanceof Map) {
      sheet.cells.forEach((cellData, cellId) => {
        data[cellId] = cellData.formula || cellData.value;
      });
    } else if (typeof sheet.cells === 'object') {
      Object.entries(sheet.cells).forEach(([cellId, cellData]: [string, any]) => {
        data[cellId] = cellData?.formula || cellData?.value;
      });
    }
    
    return data;
  }, [getActiveFile, getActiveSheet]);

  // Evaluate a formula and return the result
  const evaluateCellFormula = useCallback((formula: string): any => {
    const data = getDataForEngine();
    return evaluateFormula(formula, data);
  }, [getDataForEngine]);

  // Get computed value for a cell (evaluating formulas if needed)
  const getComputedValue = useCallback((cellId: string): any => {
    const file = getActiveFile();
    const sheet = getActiveSheet();
    
    if (!file || !sheet) return '';
    
    let cellData;
    if (sheet.cells instanceof Map) {
      cellData = sheet.cells.get(cellId);
    } else {
      cellData = (sheet.cells as any)?.[cellId];
    }
    
    if (!cellData) return '';
    
    // If it's a formula, evaluate it
    if (cellData.formula && cellData.formula.startsWith('=')) {
      const result = evaluateCellFormula(cellData.formula);
      
      // Return error if evaluation failed
      if (result && typeof result === 'object' && result.error) {
        return `#ERROR: ${result.error}`;
      }
      
      return result;
    }
    
    return cellData.value;
  }, [getActiveFile, getActiveSheet, evaluateCellFormula]);

  // Update all formulas in the current sheet (for dependency updates)
  const recalculateFormulas = useCallback(() => {
    const file = getActiveFile();
    const sheet = getActiveSheet();
    
    if (!file || !sheet) return;
    
    // Find all cells with formulas and update them
    const formulaCells: string[] = [];
    
    if (sheet.cells instanceof Map) {
      sheet.cells.forEach((cellData, cellId) => {
        if (cellData.formula?.startsWith('=')) {
          formulaCells.push(cellId as string);
        }
      });
    } else {
      Object.entries(sheet.cells || {}).forEach(([cellId, cellData]: [string, any]) => {
        if (cellData?.formula?.startsWith('=')) {
          formulaCells.push(cellId);
        }
      });
    }
    
    // Trigger recalculation (the computed values will be calculated on next render)
    // In a real implementation, we'd update the store with computed values
    console.log(`[FormulaEngine] Recalculating ${formulaCells.length} formulas`);
  }, [getActiveFile, getActiveSheet]);

  return {
    evaluateFormula: evaluateCellFormula,
    getComputedValue,
    recalculateFormulas,
    getDataForEngine
  };
};

export default useFormulaEngine;
