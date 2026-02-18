# Excel & Google Sheets Features Integration Plan

## Research Summary

### Most Used Features (Ranked by Usage)

#### 1. Formula Functions (Used by 95%+ of users)
- **SUM/AVERAGE/COUNT**: Basic aggregation
- **IF/IFS**: Conditional logic  
- **VLOOKUP/XLOOKUP**: Data lookup
- **INDEX/MATCH**: Flexible lookups
- **CONCAT/TEXT**: String manipulation
- **DATE/TODAY**: Date operations
- **SUMIF/COUNTIF**: Conditional aggregation

#### 2. Data Manipulation (Used by 85%+ of users)
- **Sorting**: Single/multi-column sort
- **Filtering**: AutoFilter, custom filters
- **Find/Replace**: Global text replacement
- **Remove Duplicates**: Data deduplication
- **Text to Columns**: Split data
- **Data Validation**: Cell constraints
- **Conditional Formatting**: Visual rules

#### 3. Data Analysis (Used by 60%+ of users)
- **Pivot Tables**: Cross-tabulation
- **Charts**: Bar, line, pie, scatter
- **Subtotals**: Grouped calculations
- **Goal Seek**: What-if analysis
- **Solver**: Optimization

#### 4. Collaboration (Used by 70%+ of users)
- **Comments**: Cell annotations
- **Track Changes**: Version history
- **Sharing**: Permission management
- **Protected Ranges**: Cell locking

## Architecture Comparison

### Microsoft Excel
```
Architecture: COM (Component Object Model)
├── Excel Application (excel.exe)
├── Workbooks (xlsx, xlsm)
│   ├── Worksheets
│   │   ├── Cells (A1 notation)
│   │   ├── Ranges (A1:B10)
│   │   ├── Formulas (parsed to AST)
│   │   └── Formatting
│   ├── Charts (embedded)
│   └── Macros (VBA/Office Scripts)
└── Add-ins (XLL, COM, JS)
```

**APIs Available:**
1. **Excel JavaScript API** (Modern, web-based)
2. **COM Interop** (Legacy, Windows-only)
3. **Open XML SDK** (File manipulation)
4. **Graph API** (Cloud-based)

### Google Sheets
```
Architecture: Web-based, REST API
├── Google Drive (storage)
├── Spreadsheet Object
│   ├── Sheets (tabs)
│   │   ├── GridData (cells)
│   │   ├── ProtectedRanges
│   │   └── DataValidation
│   ├── Charts (separate endpoint)
│   └── NamedRanges
└── Apps Script (JavaScript-based)
```

**APIs Available:**
1. **Sheets API v4** (REST, JSON)
2. **Apps Script API** (JavaScript execution)
3. **Drive API** (File management)

## Integration Strategy

### Phase 1: Core Formula Engine (High Priority)
Implement formula parser and calculator compatible with Excel syntax.

**Files to Create:**
- `src/core/spreadsheet/formula-parser.js` - Parse A1 notation and formulas
- `src/core/spreadsheet/formula-engine.js` - Execute formulas
- `src/core/spreadsheet/functions/` - Individual function implementations

### Phase 2: Data Operations (High Priority)
Add sorting, filtering, and data transformation.

**Files to Create:**
- `src/core/spreadsheet/data-operations.js` - Sort, filter, transform
- `src/core/spreadsheet/validation.js` - Data validation rules

### Phase 3: Analysis Tools (Medium Priority)
Pivot tables, charts, and statistical analysis.

**Files to Create:**
- `src/core/spreadsheet/pivot-table.js` - Pivot table creation
- `src/core/spreadsheet/charting.js` - Chart generation
- `src/core/spreadsheet/statistics.js` - Statistical functions

### Phase 4: External Integration (Medium Priority)
Connect to Excel/Sheets APIs for cloud sync.

**Files to Create:**
- `src/core/spreadsheet/excel-api.js` - Microsoft Graph API
- `src/core/spreadsheet/sheets-api.js` - Google Sheets API
- `src/core/spreadsheet/sync-manager.js` - Bidirectional sync

## Implementation Details

### Formula Engine Design
```javascript
// Formula expression: =SUM(A1:B10) + VLOOKUP(C1, D1:E10, 2, FALSE)
// Parse to AST:
{
  type: 'BinaryExpression',
  operator: '+',
  left: {
    type: 'FunctionCall',
    name: 'SUM',
    args: [{ type: 'Range', start: 'A1', end: 'B10' }]
  },
  right: {
    type: 'FunctionCall', 
    name: 'VLOOKUP',
    args: [
      { type: 'CellReference', cell: 'C1' },
      { type: 'Range', start: 'D1', end: 'E10' },
      { type: 'Number', value: 2 },
      { type: 'Boolean', value: false }
    ]
  }
}
```

### Cell Reference System
```javascript
// A1 notation parser
class CellReference {
  static parse(ref) {
    // A1 -> {col: 0, row: 0}
    // B10 -> {col: 1, row: 9}
    // AA100 -> {col: 26, row: 99}
  }
  
  static toA1(col, row) {
    // 0,0 -> A1
    // 1,9 -> B10
  }
}
```

### Data Flow
```
User Input (Formula)
    ↓
Formula Parser (Tokenize → AST)
    ↓
Dependency Resolution (Build graph)
    ↓
Formula Engine (Execute)
    ↓
Cell Update (Cascade)
    ↓
UI Refresh (React state)
```

## Key Features to Implement

### 1. Formula Functions Library

#### Math Functions
- `SUM(range)` - Sum of values
- `AVERAGE(range)` - Arithmetic mean
- `COUNT(range)` - Count numeric values
- `MAX/MIN(range)` - Extremes
- `ROUND(number, digits)` - Rounding
- `ABS(number)` - Absolute value
- `POWER(base, exponent)` - Exponentiation

#### Logical Functions
- `IF(condition, true_val, false_val)` - Conditional
- `AND/OR/NOT(conditions)` - Boolean logic
- `IFS(condition1, value1, ...)` - Multiple conditions
- `SWITCH(expression, case1, result1, ...)` - Pattern matching

#### Lookup Functions
- `VLOOKUP(lookup_value, table_array, col_index, range_lookup)` - Vertical lookup
- `HLOOKUP(lookup_value, table_array, row_index, range_lookup)` - Horizontal lookup
- `XLOOKUP(lookup_value, lookup_array, return_array)` - Modern lookup
- `INDEX(array, row_num, col_num)` - Array indexing
- `MATCH(lookup_value, lookup_array, match_type)` - Position finder

#### Text Functions
- `CONCAT(text1, text2, ...)` - String concatenation
- `LEFT/RIGHT/MID(text, num_chars)` - Substring extraction
- `LEN(text)` - String length
- `UPPER/LOWER/PROPER(text)` - Case conversion
- `TRIM(text)` - Remove extra spaces
- `SUBSTITUTE(text, old, new)` - Text replacement

#### Date Functions
- `TODAY()` - Current date
- `NOW()` - Current datetime
- `DATE(year, month, day)` - Create date
- `YEAR/MONTH/DAY(date)` - Extract components
- `DATEDIF(start, end, unit)` - Date difference

### 2. Data Operations

#### Sorting
```javascript
// Multi-column sort with custom comparators
sort(data, [
  { column: 'A', direction: 'asc' },
  { column: 'B', direction: 'desc' }
])
```

#### Filtering
```javascript
// AutoFilter with multiple criteria
filter(data, {
  column: 'A',
  condition: 'equals',
  value: 'Active'
})
```

#### Data Validation
```javascript
// Cell constraints
validation = {
  type: 'list',
  source: ['Yes', 'No', 'Maybe'],
  allowBlank: false
}
```

### 3. Pivot Tables

```javascript
// Cross-tabulation
pivotTable(sourceData, {
  rows: ['Category', 'Subcategory'],
  columns: ['Month'],
  values: [
    { field: 'Sales', aggregation: 'SUM' },
    { field: 'Quantity', aggregation: 'COUNT' }
  ]
})
```

### 4. Charts

```javascript
// Chart generation
chart(data, {
  type: 'bar', // bar, line, pie, scatter, area
  xAxis: 'Month',
  yAxis: 'Sales',
  title: 'Monthly Sales'
})
```

## Backend Integration (Python)

### Using openpyxl + pandas
```python
import openpyxl
import pandas as pd
from openpyxl.utils import get_column_letter

class ExcelProcessor:
    def __init__(self, file_path):
        self.wb = openpyxl.load_workbook(file_path)
        self.df = pd.read_excel(file_path)
    
    def apply_formula(self, sheet_name, cell, formula):
        sheet = self.wb[sheet_name]
        sheet[cell] = formula
        # Recalculate
        self.wb.save()
    
    def create_pivot(self, data_range, rows, cols, values):
        pivot = pd.pivot_table(
            self.df,
            values=values,
            index=rows,
            columns=cols,
            aggfunc='sum'
        )
        return pivot
```

### FastAPI Endpoints
```python
@app.post("/api/spreadsheet/formula")
async def apply_formula(request: FormulaRequest):
    result = formula_engine.calculate(request.formula, request.data)
    return {"result": result, "dependencies": result.dependencies}

@app.post("/api/spreadsheet/sort")
async def sort_data(request: SortRequest):
    sorted_data = data_operations.sort(request.data, request.sort_keys)
    return {"data": sorted_data}

@app.post("/api/spreadsheet/pivot")
async def create_pivot(request: PivotRequest):
    pivot = pivot_engine.create(request.data, request.config)
    return {"pivot": pivot}
```

## Frontend Integration (React)

### Spreadsheet Component
```typescript
interface SpreadsheetProps {
  data: CellData[][];
  onCellChange: (row: number, col: number, value: string) => void;
  onFormulaEnter: (cell: string, formula: string) => void;
  selectedRange: Range | null;
}

// Formula bar component
const FormulaBar: React.FC<{
  cellRef: string;
  formula: string;
  onChange: (value: string) => void;
}> = ({ cellRef, formula, onChange }) => {
  return (
    <div className="formula-bar">
      <span className="cell-ref">{cellRef}</span>
      <input 
        value={formula} 
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter formula or value..."
      />
    </div>
  );
};
```

### State Management (Zustand)
```typescript
interface SpreadsheetState {
  cells: Map<string, Cell>;
  formulas: Map<string, string>;
  dependencies: DependencyGraph;
  
  setCell: (ref: string, value: string | number) => void;
  setFormula: (ref: string, formula: string) => void;
  recalculate: () => void;
  sort: (range: Range, keys: SortKey[]) => void;
  filter: (range: Range, criteria: FilterCriteria) => void;
}
```

## Migration Path

### Current State
- Basic spreadsheet display
- File loading via openpyxl
- Simple cell editing

### Target State
1. **Week 1**: Formula parser + basic functions (SUM, AVERAGE, IF)
2. **Week 2**: Cell references + dependency tracking
3. **Week 3**: Sorting, filtering, data validation
4. **Week 4**: Pivot tables + charts
5. **Week 5**: External API integration (Excel Online, Sheets)

## Performance Considerations

### Formula Calculation
- **Dependency Graph**: Track which cells depend on others
- **Lazy Evaluation**: Only calculate when needed
- **Caching**: Store intermediate results
- **Web Workers**: Offload heavy calculations

### Large Datasets
- **Virtual Scrolling**: Only render visible cells
- **Pagination**: Load data in chunks
- **WebAssembly**: Fast number crunching
- **Server-side**: Complex operations on backend

## Security

- **Formula Injection**: Sanitize user input
- **External Data**: Validate URLs in WEBSERVICE functions
- **Macro Security**: Disable dangerous functions by default
- **Sandbox**: Isolate formula execution

## Testing Strategy

### Unit Tests
- Individual function accuracy
- Parser edge cases
- Formula round-trip

### Integration Tests
- End-to-end spreadsheet operations
- API connectivity
- Large file handling

### Benchmark Tests
- Formula calculation speed
- Memory usage with large datasets
- Concurrent user performance
