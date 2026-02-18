# Excel & Google Sheets Features Integration Guide

## Overview

This guide explains how to integrate Excel and Google Sheets features into the Smart Macro Tool application. The integration provides:

- **Formula Engine**: Full Excel-compatible formula parser and calculator
- **Data Operations**: Sorting, filtering, deduplication, and transformations
- **Cell Management**: Dependency tracking, automatic recalculation
- **API Integration**: Support for Excel Online and Google Sheets APIs

## Architecture

### Current vs. New Integration

```
Current State:
┌─────────────────────────────────────┐
│  Smart Macro Tool                   │
│  ├─ Frontend (React/Electron)       │
│  ├─ Backend (Python/FastAPI)        │
│  └─ Basic Excel Reading (openpyxl)  │
└─────────────────────────────────────┘

With New Features:
┌─────────────────────────────────────┐
│  Smart Macro Tool                   │
│  ├─ Frontend (React/Electron)       │
│  │   ├─ Formula Bar Component       │
│  │   ├─ Cell Grid Component         │
│  │   ├─ Data Operations Panel       │
│  │   └─ Chart Components            │
│  ├─ Backend (Python/FastAPI)        │
│  │   ├─ Excel Processor (Enhanced)  │
│  │   ├─ Pivot Engine                │
│  │   └─ API Integration Layer        │
│  └─ Spreadsheet Engine (Node.js)    │
│      ├─ Formula Parser              │
│      ├─ Formula Engine              │
│      ├─ Data Operations             │
│      └─ Spreadsheet Manager         │
└─────────────────────────────────────┘
```

## Installation

### 1. Backend Dependencies

The backend already has the required Python packages:
- `openpyxl==3.1.2` - Excel file handling
- `pandas==2.1.3` - Data manipulation
- `numpy==1.26.2` - Numerical operations

### 2. Frontend Integration

The spreadsheet modules are located in `src/core/spreadsheet/` and can be used in both Node.js backend and Electron frontend contexts.

## Quick Start

### Basic Usage

```javascript
const { SpreadsheetManager } = require('./src/core/spreadsheet');

// Create a new spreadsheet
const sheet = new SpreadsheetManager({
  rows: 100,
  cols: 26
});

// Set values
sheet.setCell('A1', 100);
sheet.setCell('A2', 200);

// Set formula
sheet.setCell('A3', '=SUM(A1:A2)');

// Get calculated value
console.log(sheet.getCell('A3')); // 300

// Set with formula
sheet.setCell('B1', '=A1*2');
sheet.setCell('B2', '=A2*2');
sheet.setCell('B3', '=SUM(B1:B2)');

// Change A1 and watch B1 and B3 auto-update
sheet.setCell('A1', 150);
console.log(sheet.getCell('B1')); // 300
console.log(sheet.getCell('B3')); // 900
```

### Data Operations

```javascript
const { DataOperations } = require('./src/core/spreadsheet');

const dataOps = new DataOperations();

// Sample data
const data = [
  { name: 'Alice', age: 30, salary: 50000 },
  { name: 'Bob', age: 25, salary: 45000 },
  { name: 'Charlie', age: 35, salary: 60000 },
  { name: 'Alice', age: 30, salary: 50000 } // duplicate
];

// Sort by salary descending
const sorted = dataOps.sort(data, [
  { column: 'salary', direction: 'desc' }
]);

// Filter by age > 25
const filtered = dataOps.filter(data, {
  column: 'age',
  condition: '>',
  value: 25
});

// Remove duplicates
const unique = dataOps.removeDuplicates(data, ['name', 'age']);

// Find and replace
const replaced = dataOps.findAndReplace(data, 'Alice', 'Alicia', {
  column: 'name'
});
```

## Integration with Existing Components

### 1. Spreadsheet Editor Component

Update `smart-macro-tool/frontend/src/components/SpreadsheetEditor/SpreadsheetEditor.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { SpreadsheetManager } from '../../../../src/core/spreadsheet';

const SpreadsheetEditor = ({ fileName }) => {
  const [sheet, setSheet] = useState(null);
  const [selectedCell, setSelectedCell] = useState('A1');
  const [formulaBarValue, setFormulaBarValue] = useState('');
  
  useEffect(() => {
    // Initialize spreadsheet
    const manager = new SpreadsheetManager();
    setSheet(manager);
    
    // Listen for cell changes
    manager.on('cellChanged', (data) => {
      // Trigger React re-render
      forceUpdate();
    });
  }, []);
  
  const handleCellClick = (ref) => {
    setSelectedCell(ref);
    const value = sheet.getCell(ref);
    const formula = sheet.formulas.get(ref);
    setFormulaBarValue(formula || value || '');
  };
  
  const handleFormulaBarChange = (value) => {
    setFormulaBarValue(value);
    sheet.setCell(selectedCell, value);
  };
  
  return (
    <div className="spreadsheet-editor">
      <FormulaBar 
        value={formulaBarValue}
        onChange={handleFormulaBarChange}
        cellRef={selectedCell}
      />
      <CellGrid 
        sheet={sheet}
        onCellClick={handleCellClick}
        selectedCell={selectedCell}
      />
    </div>
  );
};
```

### 2. Formula Bar Component

Create `smart-macro-tool/frontend/src/components/FormulaBar/FormulaBar.tsx`:

```typescript
interface FormulaBarProps {
  value: string;
  onChange: (value: string) => void;
  cellRef: string;
}

export const FormulaBar: React.FC<FormulaBarProps> = ({
  value, onChange, cellRef
}) => {
  return (
    <div className="formula-bar flex items-center bg-gray-800 p-2 border-b border-gray-700">
      <span className="cell-ref bg-gray-700 px-2 py-1 rounded text-sm mr-2 min-w-[60px] text-center">
        {cellRef}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-gray-900 text-white px-3 py-1 rounded"
        placeholder="Enter value or formula (e.g., =SUM(A1:A10))"
      />
      <button 
        className="ml-2 px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
        onClick={() => onChange(value)}
      >
        ✓
      </button>
    </div>
  );
};
```

### 3. Data Operations Panel

Create `smart-macro-tool/frontend/src/components/DataOperations/DataOperationsPanel.tsx`:

```typescript
import { DataOperations } from '../../../../src/core/spreadsheet';

export const DataOperationsPanel = ({ sheet, selectedRange }) => {
  const handleSort = (column, direction) => {
    sheet.sort(selectedRange, [{ column, direction }]);
  };
  
  const handleFilter = (criteria) => {
    const filtered = sheet.filter(selectedRange, criteria);
    // Update view with filtered data
  };
  
  const handleRemoveDuplicates = () => {
    sheet.removeDuplicates(selectedRange);
  };
  
  return (
    <div className="data-operations-panel p-4">
      <h3 className="text-lg font-bold mb-4">Data Operations</h3>
      
      <div className="space-y-4">
        <div className="sort-section">
          <h4 className="font-semibold mb-2">Sort</h4>
          <select onChange={(e) => handleSort(e.target.value, 'asc')}>
            <option value="">Select column...</option>
            <option value="A">Column A</option>
            <option value="B">Column B</option>
            {/* Dynamic columns */}
          </select>
        </div>
        
        <div className="filter-section">
          <h4 className="font-semibold mb-2">Filter</h4>
          <input 
            type="text" 
            placeholder="Filter value..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFilter({
                  column: 'A',
                  condition: 'contains',
                  value: e.target.value
                });
              }
            }}
          />
        </div>
        
        <div className="dedup-section">
          <h4 className="font-semibold mb-2">Remove Duplicates</h4>
          <button 
            onClick={handleRemoveDuplicates}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Remove Duplicates
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Supported Formulas

### Math Functions
- `SUM(range)` - Sum of values
- `AVERAGE(range)` - Arithmetic mean
- `COUNT(range)` - Count numeric values
- `COUNTA(range)` - Count non-empty cells
- `MAX(range)` / `MIN(range)` - Maximum/minimum
- `ABS(number)` - Absolute value
- `ROUND(number, digits)` - Round to decimal places
- `POWER(base, exponent)` - Exponentiation
- `SQRT(number)` - Square root
- `MOD(dividend, divisor)` - Modulo
- `PRODUCT(range)` - Product of values

### Logical Functions
- `IF(condition, true_value, false_value)` - Conditional
- `AND(condition1, condition2, ...)` - Boolean AND
- `OR(condition1, condition2, ...)` - Boolean OR
- `NOT(condition)` - Boolean NOT
- `IFS(condition1, value1, condition2, value2, ...)` - Multiple conditions

### Lookup Functions
- `VLOOKUP(lookup_value, table_array, col_index, range_lookup)`
- `HLOOKUP(lookup_value, table_array, row_index, range_lookup)`
- `INDEX(array, row_num, col_num)`
- `MATCH(lookup_value, lookup_array, match_type)`

### Text Functions
- `CONCAT(text1, text2, ...)` - Concatenate strings
- `LEFT(text, num_chars)` - Left substring
- `RIGHT(text, num_chars)` - Right substring
- `MID(text, start_num, num_chars)` - Middle substring
- `LEN(text)` - String length
- `TRIM(text)` - Remove extra spaces
- `UPPER(text)` / `LOWER(text)` / `PROPER(text)` - Case conversion
- `SUBSTITUTE(text, old_text, new_text, instance_num)`

### Date Functions
- `TODAY()` - Current date
- `NOW()` - Current date and time
- `DATE(year, month, day)` - Create date
- `YEAR(date)` / `MONTH(date)` / `DAY(date)` - Extract components
- `DATEDIF(start_date, end_date, unit)` - Date difference

### Conditional Aggregation
- `SUMIF(range, criteria, sum_range)`
- `COUNTIF(range, criteria)`
- `AVERAGEIF(range, criteria, average_range)`

### Information Functions
- `ISBLANK(value)` - Check if empty
- `ISNUMBER(value)` - Check if numeric
- `ISTEXT(value)` - Check if text
- `ISERROR(value)` - Check if error

## Backend API Endpoints

Add to `smart-macro-tool/backend/app/api/spreadsheet.py`:

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import openpyxl
import pandas as pd
from io import BytesIO

router = APIRouter()

class FormulaRequest(BaseModel):
    formula: str
    data: Dict[str, Any]
    cell_ref: Optional[str] = None

class SortRequest(BaseModel):
    data: List[Dict[str, Any]]
    sort_keys: List[Dict[str, str]]

class FilterRequest(BaseModel):
    data: List[Dict[str, Any]]
    criteria: Dict[str, Any]

@router.post("/formula/evaluate")
async def evaluate_formula(request: FormulaRequest):
    """Evaluate a formula with given data"""
    try:
        # Use JavaScript engine via Node.js or implement in Python
        result = await evaluate_formula_js(request.formula, request.data)
        return {"result": result, "success": True}
    except Exception as e:
        return {"error": str(e), "success": False}

@router.post("/data/sort")
async def sort_data(request: SortRequest):
    """Sort data by multiple columns"""
    try:
        df = pd.DataFrame(request.data)
        
        sort_cols = []
        ascending = []
        
        for key in request.sort_keys:
            sort_cols.append(key['column'])
            ascending.append(key['direction'].lower() != 'desc')
        
        sorted_df = df.sort_values(by=sort_cols, ascending=ascending)
        
        return {"data": sorted_df.to_dict('records'), "success": True}
    except Exception as e:
        return {"error": str(e), "success": False}

@router.post("/data/filter")
async def filter_data(request: FilterRequest):
    """Filter data based on criteria"""
    try:
        df = pd.DataFrame(request.data)
        
        # Apply filters
        condition = pd.Series([True] * len(df))
        
        if request.criteria.get('column'):
            col = request.criteria['column']
            op = request.criteria['condition']
            val = request.criteria['value']
            
            if op == 'equals':
                condition &= (df[col] == val)
            elif op == 'greaterThan':
                condition &= (df[col] > val)
            # ... more conditions
        
        filtered_df = df[condition]
        
        return {"data": filtered_df.to_dict('records'), "success": True}
    except Exception as e:
        return {"error": str(e), "success": False}

@router.post("/excel/import")
async def import_excel(file: UploadFile):
    """Import Excel file and convert to JSON"""
    try:
        contents = await file.read()
        workbook = openpyxl.load_workbook(BytesIO(contents))
        
        result = {}
        for sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]
            data = []
            
            for row in sheet.iter_rows(values_only=True):
                data.append(row)
            
            result[sheet_name] = data
        
        return {"sheets": result, "success": True}
    except Exception as e:
        return {"error": str(e), "success": False}

@router.post("/excel/export")
async def export_excel(data: Dict[str, List[List[Any]]]):
    """Export data to Excel format"""
    try:
        workbook = openpyxl.Workbook()
        
        for sheet_name, sheet_data in data.items():
            if sheet_name == list(data.keys())[0]:
                sheet = workbook.active
                sheet.title = sheet_name
            else:
                sheet = workbook.create_sheet(title=sheet_name)
            
            for row_idx, row in enumerate(sheet_data, 1):
                for col_idx, value in enumerate(row, 1):
                    sheet.cell(row=row_idx, column=col_idx, value=value)
        
        # Save to bytes
        output = BytesIO()
        workbook.save(output)
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=export.xlsx"}
        )
    except Exception as e:
        return {"error": str(e), "success": False}
```

## Excel/Google Sheets API Integration

### Microsoft Graph API

```javascript
// smart-macro-tool/frontend/src/services/excel-api.js

class ExcelAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://graph.microsoft.com/v1.0';
  }

  async getWorkbooks() {
    const response = await fetch(`${this.baseUrl}/me/drive/root/search(q='.xlsx')`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
    return await response.json();
  }

  async getWorkbookData(workbookId) {
    const response = await fetch(
      `${this.baseUrl}/me/drive/items/${workbookId}/workbook/worksheets`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );
    return await response.json();
  }

  async updateCell(workbookId, worksheetId, cellRef, value) {
    const response = await fetch(
      `${this.baseUrl}/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${cellRef}')`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [[value]]
        })
      }
    );
    return await response.json();
  }
}
```

### Google Sheets API

```javascript
// smart-macro-tool/frontend/src/services/sheets-api.js

class GoogleSheetsAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://sheets.googleapis.com/v4';
  }

  async getSpreadsheet(spreadsheetId) {
    const response = await fetch(
      `${this.baseUrl}/spreadsheets/${spreadsheetId}?key=${this.apiKey}`
    );
    return await response.json();
  }

  async getValues(spreadsheetId, range) {
    const response = await fetch(
      `${this.baseUrl}/spreadsheets/${spreadsheetId}/values/${range}?key=${this.apiKey}`
    );
    return await response.json();
  }

  async updateValues(spreadsheetId, range, values) {
    const response = await fetch(
      `${this.baseUrl}/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED&key=${this.apiKey}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );
    return await response.json();
  }
}
```

## Performance Optimization

### 1. Virtual Scrolling

For large spreadsheets, only render visible cells:

```typescript
const VirtualizedGrid = ({ sheet, visibleRange }) => {
  const { startRow, endRow, startCol, endCol } = visibleRange;
  
  return (
    <div className="grid-container">
      {Array.from({ length: endRow - startRow }, (_, r) => (
        <div key={r} className="grid-row">
          {Array.from({ length: endCol - startCol }, (_, c) => {
            const cellRef = sheet.cellRefToString(startCol + c, startRow + r);
            return (
              <Cell 
                key={cellRef}
                ref={cellRef}
                value={sheet.getCell(cellRef)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
```

### 2. Web Workers

Offload heavy calculations:

```javascript
// formula-worker.js
self.onmessage = (e) => {
  const { formula, data, cellRef } = e.data;
  
  const engine = new FormulaEngine(data);
  const result = engine.evaluate(formula, cellRef);
  
  self.postMessage({ result, cellRef });
};

// main thread
const worker = new Worker('formula-worker.js');

worker.onmessage = (e) => {
  const { result, cellRef } = e.data;
  updateCell(cellRef, result);
};

worker.postMessage({ formula: '=SUM(A1:A10000)', data, cellRef: 'B1' });
```

### 3. Caching

Cache calculated values to avoid redundant calculations:

```javascript
class SpreadsheetManager {
  constructor() {
    this.calculationCache = new Map();
    this.cacheMaxSize = 10000;
  }
  
  getCell(ref) {
    const cacheKey = `${ref}:${this.cells.get(ref)}`;
    
    if (this.calculationCache.has(cacheKey)) {
      return this.calculationCache.get(cacheKey);
    }
    
    const result = this.calculateCell(ref);
    
    if (this.calculationCache.size >= this.cacheMaxSize) {
      const firstKey = this.calculationCache.keys().next().value;
      this.calculationCache.delete(firstKey);
    }
    
    this.calculationCache.set(cacheKey, result);
    return result;
  }
}
```

## Testing

### Unit Tests

```javascript
// test/formula-engine.test.js
const { FormulaEngine } = require('../src/core/spreadsheet');

describe('FormulaEngine', () => {
  let engine;
  
  beforeEach(() => {
    engine = new FormulaEngine({
      A1: 10,
      A2: 20,
      A3: 30
    });
  });
  
  test('SUM function', () => {
    expect(engine.evaluate('=SUM(A1:A3)')).toBe(60);
  });
  
  test('IF function', () => {
    expect(engine.evaluate('=IF(A1>5, "Yes", "No")')).toBe('Yes');
  });
  
  test('VLOOKUP function', () => {
    // Add test implementation
  });
});
```

### Integration Tests

```javascript
// test/spreadsheet-manager.test.js
const { SpreadsheetManager } = require('../src/core/spreadsheet');

describe('SpreadsheetManager', () => {
  let sheet;
  
  beforeEach(() => {
    sheet = new SpreadsheetManager();
  });
  
  test('dependency tracking', () => {
    sheet.setCell('A1', 10);
    sheet.setCell('B1', '=A1*2');
    sheet.setCell('C1', '=B1+A1');
    
    expect(sheet.getCell('C1')).toBe(30);
    
    sheet.setCell('A1', 20);
    expect(sheet.getCell('B1')).toBe(40);
    expect(sheet.getCell('C1')).toBe(60);
  });
  
  test('circular reference detection', () => {
    sheet.setCell('A1', '=B1');
    sheet.setCell('B1', '=A1');
    
    expect(sheet.getCell('A1').error).toContain('recursion');
  });
});
```

## Migration Guide

### From Basic Excel Reading

**Before:**
```javascript
const openpyxl = require('openpyxl');

// Just read data
const wb = openpyxl.load_workbook('file.xlsx');
const data = wb.active.values;
```

**After:**
```javascript
const { SpreadsheetManager } = require('./src/core/spreadsheet');

// Full editing capabilities
const sheet = new SpreadsheetManager();
sheet.importData(data);

// Add formulas
sheet.setCell('E1', '=SUM(A1:D1)');

// Data operations
sheet.sort('A1:D100', [{ column: 'A', direction: 'asc' }]);

// Export back
const updatedData = sheet.getAllData();
```

## Best Practices

1. **Always validate formulas** before setting them
2. **Use batch operations** for multiple cell updates
3. **Implement undo/redo** for user safety
4. **Save periodically** to prevent data loss
5. **Use virtual scrolling** for large datasets (>1000 rows)
6. **Implement copy-paste** for better UX
7. **Add keyboard shortcuts** (Ctrl+C, Ctrl+V, F2 for edit)
8. **Support multiple sheets** per workbook
9. **Implement cell formatting** (numbers, dates, currencies)
10. **Add data validation** to prevent errors

## Roadmap

### Phase 1 (Complete) ✅
- Formula parser and engine
- Basic math and logical functions
- Cell dependency tracking
- Data operations (sort, filter, dedup)

### Phase 2 (Next)
- Pivot tables
- Charts and visualization
- Conditional formatting
- Cell formatting (numbers, dates)

### Phase 3 (Future)
- Excel Online integration
- Google Sheets integration
- Collaborative editing
- Version history

## Resources

- [Excel Formula Reference](https://support.microsoft.com/en-us/office/excel-functions-alphabetical-b3944572-255d-4efb-bb96-c6d90033e188)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/api/resources/excel)
- [OpenPyXL Documentation](https://openpyxl.readthedocs.io/)
