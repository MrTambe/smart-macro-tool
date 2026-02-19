/**
 * SpreadsheetEngine Service
 * Bridges the SpreadsheetManager with the React frontend
 * Provides formula evaluation and data operations
 */

// Formula evaluation engine (ported from Node.js to browser)
class FormulaEvaluator {
  data: Record<string, any> = {};
  functions: Record<string, (...args: any[]) => any> = {};

  constructor() {
    this.functions = this.initializeFunctions();
  }

  initializeFunctions() {
    return {
      // Math functions
      SUM: (...args: any[]): number => {
        const flat = args.flat(Infinity);
        return flat.reduce((acc: number, v: any) => acc + this.toNumber(v), 0);
      },
      AVERAGE: (...args: any[]): number => {
        const flat = args.flat(Infinity).filter((v: any) => v != null);
        if (flat.length === 0) return NaN;
        return flat.reduce((acc: number, v: any) => acc + this.toNumber(v), 0) / flat.length;
      },
      COUNT: (...args: any[]): number => {
        const flat = args.flat(Infinity);
        return flat.filter((v: any) => typeof v === 'number' || !isNaN(parseFloat(v))).length;
      },
      COUNTA: (...args: any[]): number => {
        const flat = args.flat(Infinity);
        return flat.filter((v: any) => v != null && v !== '').length;
      },
      MAX: (...args: any[]): number => {
        const flat = args.flat(Infinity).map((v: any) => this.toNumber(v));
        return flat.length ? Math.max(...flat) : 0;
      },
      MIN: (...args: any[]): number => {
        const flat = args.flat(Infinity).map((v: any) => this.toNumber(v));
        return flat.length ? Math.min(...flat) : 0;
      },
      ABS: (v: any): number => Math.abs(this.toNumber(v)),
      ROUND: (v: any, d: number = 0): number => {
        const factor = Math.pow(10, d);
        return Math.round(this.toNumber(v) * factor) / factor;
      },
      POWER: (b: any, e: any): number => Math.pow(this.toNumber(b), this.toNumber(e)),
      SQRT: (v: any): number => Math.sqrt(this.toNumber(v)),
      MOD: (a: any, b: any): number => this.toNumber(a) % this.toNumber(b),
      PRODUCT: (...args: any[]): number => args.flat(Infinity).reduce((acc: number, v: any) => acc * this.toNumber(v), 1),

      // Logical functions
      IF: (cond, t, f) => cond ? t : f,
      AND: (...args) => args.every(Boolean),
      OR: (...args) => args.some(Boolean),
      NOT: (v) => !v,
      IFS: (...args) => {
        for (let i = 0; i < args.length; i += 2) {
          if (args[i]) return args[i + 1];
        }
        return '#N/A';
      },

      // Lookup functions
      INDEX: (arr, row, col = 1) => {
        const r = this.toNumber(row) - 1;
        const c = this.toNumber(col) - 1;
        if (Array.isArray(arr) && arr[0] && Array.isArray(arr[0])) {
          return arr[r]?.[c] ?? '#REF!';
        }
        return arr[r] ?? '#REF!';
      },
      MATCH: (val, arr, type = 1) => {
        const flat = Array.isArray(arr) ? arr.flat(Infinity) : [arr];
        const idx = flat.findIndex(v => v === val);
        return idx !== -1 ? idx + 1 : '#N/A';
      },
      VLOOKUP: (val, table, col, approx = true) => {
        if (!Array.isArray(table)) return '#N/A';
        for (let i = 0; i < table.length; i++) {
          if (table[i][0] === val || (approx && table[i][0] <= val)) {
            return table[i][col - 1] ?? '#N/A';
          }
        }
        return '#N/A';
      },

      // Text functions
      CONCAT: (...args) => args.map(String).join(''),
      CONCATENATE: (...args) => args.map(String).join(''),
      LEFT: (str, n = 1) => String(str).substring(0, n),
      RIGHT: (str, n = 1) => String(str).slice(-n),
      MID: (str, s, n) => String(str).substring(s - 1, s - 1 + n),
      LEN: (str) => String(str).length,
      TRIM: (str) => String(str).trim().replace(/\s+/g, ' '),
      UPPER: (str) => String(str).toUpperCase(),
      LOWER: (str) => String(str).toLowerCase(),
      PROPER: (str) => String(str).toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
      SUBSTITUTE: (str, old, newStr, n) => {
        if (n != null) {
          let count = 0;
          return String(str).replace(new RegExp(old, 'g'), (match) => {
            count++;
            return count === n ? newStr : match;
          });
        }
        return String(str).split(old).join(newStr);
      },

      // Date functions
      TODAY: () => new Date(),
      NOW: () => new Date(),
      DATE: (y, m, d) => new Date(y, m - 1, d),
      YEAR: (d) => new Date(d).getFullYear(),
      MONTH: (d) => new Date(d).getMonth() + 1,
      DAY: (d) => new Date(d).getDate(),
      DATEDIF: (s, e, u) => {
        const start = new Date(s);
        const end = new Date(e);
        switch(u.toUpperCase()) {
          case 'D': return Math.floor((end - start) / (1000 * 60 * 60 * 24));
          case 'M': return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
          case 'Y': return end.getFullYear() - start.getFullYear();
          default: return '#VALUE!';
        }
      },

      // Info functions
      ISBLANK: (v) => v == null || v === '',
      ISNUMBER: (v) => typeof v === 'number' && !isNaN(v),
      ISTEXT: (v) => typeof v === 'string',
      ISERROR: (v) => v && typeof v === 'object' && v.error,

      // Conditional aggregation
      SUMIF: (range, criteria, sumRange) => {
        const r = Array.isArray(range) ? range.flat(Infinity) : [range];
        const s = sumRange ? (Array.isArray(sumRange) ? sumRange.flat(Infinity) : [sumRange]) : r;
        let sum = 0;
        for (let i = 0; i < r.length; i++) {
          if (this.matchesCriteria(r[i], criteria)) {
            sum += this.toNumber(s[i] || 0);
          }
        }
        return sum;
      },
      COUNTIF: (range, criteria) => {
        const r = Array.isArray(range) ? range.flat(Infinity) : [range];
        return r.filter(v => this.matchesCriteria(v, criteria)).length;
      },
      AVERAGEIF: (range, criteria, avgRange) => {
        const r = Array.isArray(range) ? range.flat(Infinity) : [range];
        const a = avgRange ? (Array.isArray(avgRange) ? avgRange.flat(Infinity) : [avgRange]) : r;
        let sum = 0, count = 0;
        for (let i = 0; i < r.length; i++) {
          if (this.matchesCriteria(r[i], criteria)) {
            sum += this.toNumber(a[i] || 0);
            count++;
          }
        }
        return count === 0 ? '#DIV/0!' : sum / count;
      }
    };
  }

  toNumber(v) {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(/[$,]/g, ''));
      return isNaN(n) ? 0 : n;
    }
    return 0;
  }

  matchesCriteria(value, criteria) {
    const strVal = String(value);
    const strCrit = String(criteria);
    
    if (strCrit.startsWith('>=')) return this.toNumber(value) >= this.toNumber(strCrit.slice(2));
    if (strCrit.startsWith('<=')) return this.toNumber(value) <= this.toNumber(strCrit.slice(2));
    if (strCrit.startsWith('>')) return this.toNumber(value) > this.toNumber(strCrit.slice(1));
    if (strCrit.startsWith('<')) return this.toNumber(value) < this.toNumber(strCrit.slice(1));
    if (strCrit.includes('*') || strCrit.includes('?')) {
      const pattern = strCrit.replace(/\*/g, '.*').replace(/\?/g, '.');
      return new RegExp(`^${pattern}$`, 'i').test(strVal);
    }
    return strVal.toLowerCase() === strCrit.toLowerCase();
  }

  tokenize(formula) {
    const tokens = [];
    let i = 0;
    
    while (i < formula.length) {
      const char = formula[i];
      
      if (/\s/.test(char)) { i++; continue; }
      
      if (/\d/.test(char) || (char === '.' && /\d/.test(formula[i + 1]))) {
        let num = '';
        while (i < formula.length && (/\d/.test(formula[i]) || formula[i] === '.')) {
          num += formula[i++];
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(num) });
        continue;
      }
      
      if (char === '"') {
        let str = '';
        i++;
        while (i < formula.length && formula[i] !== '"') str += formula[i++];
        i++;
        tokens.push({ type: 'STRING', value: str });
        continue;
      }
      
      if (/[A-Za-z]/.test(char)) {
        let id = '';
        while (i < formula.length && /[A-Za-z0-9_.$!]/.test(formula[i])) id += formula[i++];
        
        if (/^[A-Z]+\d+$/i.test(id)) {
          if (formula[i] === ':' && /^[A-Z]+\d+$/i.test(formula.substring(i + 1).split(/[),]/)[0])) {
            let endRef = '';
            i++;
            while (i < formula.length && /[A-Za-z0-9_.$]/.test(formula[i])) endRef += formula[i++];
            tokens.push({ type: 'RANGE', value: `${id}:${endRef}` });
          } else {
            tokens.push({ type: 'CELL', value: id });
          }
        } else if (formula[i] === '(') {
          tokens.push({ type: 'FUNC', value: id.toUpperCase() });
        } else {
          const upper = id.toUpperCase();
          if (upper === 'TRUE' || upper === 'FALSE') {
            tokens.push({ type: 'BOOL', value: upper === 'TRUE' });
          } else {
            tokens.push({ type: 'CELL', value: id });
          }
        }
        continue;
      }
      
      if (['+', '-', '*', '/', '^', '&', '=', '<', '>'].includes(char)) {
        let op = char;
        if ((char === '<' || char === '>') && formula[i + 1] === '=') op += formula[++i];
        if (char === '<' && formula[i + 1] === '>') op += formula[++i];
        tokens.push({ type: 'OP', value: op });
        i++;
        continue;
      }
      
      if (char === '(') { tokens.push({ type: 'LPAREN', value: char }); i++; continue; }
      if (char === ')') { tokens.push({ type: 'RPAREN', value: char }); i++; continue; }
      if (char === ',') { tokens.push({ type: 'COMMA', value: char }); i++; continue; }
      
      throw new Error(`Unexpected: ${char}`);
    }
    
    tokens.push({ type: 'EOF', value: null });
    return tokens;
  }

  parse(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];
    
    const parseExpr = (prec = 0) => {
      let left = parsePrimary();
      
      while (pos < tokens.length) {
        const tok = peek();
        if (tok.type !== 'OP') break;
        
        const opPrec = { '^': 4, '*': 3, '/': 3, '+': 2, '-': 2, '&': 1, '=': 0, '<>': 0, '<': 0, '>': 0, '<=': 0, '>=': 0 }[tok.value];
        if (opPrec < prec) break;
        
        consume();
        const right = parseExpr(opPrec + 1);
        left = { type: 'Binary', op: tok.value, left, right };
      }
      
      return left;
    };
    
    const parsePrimary = () => {
      const tok = peek();
      
      switch (tok.type) {
        case 'NUMBER': consume(); return { type: 'Number', value: tok.value };
        case 'STRING': consume(); return { type: 'String', value: tok.value };
        case 'BOOL': consume(); return { type: 'Bool', value: tok.value };
        case 'CELL': consume(); return { type: 'Cell', ref: tok.value };
        case 'RANGE': consume(); return { type: 'Range', ref: tok.value };
        case 'FUNC':
          consume();
          consume(); // LPAREN
          const args = [];
          if (peek().type !== 'RPAREN') {
            args.push(parseExpr());
            while (peek().type === 'COMMA') {
              consume();
              args.push(parseExpr());
            }
          }
          consume(); // RPAREN
          return { type: 'Call', name: tok.value, args };
        case 'LPAREN':
          consume();
          const expr = parseExpr();
          consume(); // RPAREN
          return expr;
        case 'OP':
          if (tok.value === '+' || tok.value === '-') {
            consume();
            return { type: 'Unary', op: tok.value, arg: parsePrimary() };
          }
          break;
      }
      
      throw new Error(`Unexpected: ${tok.value}`);
    };
    
    return parseExpr();
  }

  evaluateNode(node) {
    switch (node.type) {
      case 'Number': return node.value;
      case 'String': return node.value;
      case 'Bool': return node.value;
      case 'Cell': return this.getCellValue(node.ref);
      case 'Range': return this.getRangeValues(node.ref);
      case 'Call':
        const args = node.args.map(a => this.evaluateNode(a));
        const func = this.functions[node.name];
        if (!func) throw new Error(`#NAME? - ${node.name}`);
        return func(...args);
      case 'Binary':
        const left = this.evaluateNode(node.left);
        const right = this.evaluateNode(node.right);
        switch (node.op) {
          case '+': return this.toNumber(left) + this.toNumber(right);
          case '-': return this.toNumber(left) - this.toNumber(right);
          case '*': return this.toNumber(left) * this.toNumber(right);
          case '/':
            if (this.toNumber(right) === 0) throw new Error('#DIV/0!');
            return this.toNumber(left) / this.toNumber(right);
          case '^': return Math.pow(this.toNumber(left), this.toNumber(right));
          case '&': return String(left) + String(right);
          case '=': return left === right;
          case '<>': return left !== right;
          case '<': return this.toNumber(left) < this.toNumber(right);
          case '>': return this.toNumber(left) > this.toNumber(right);
          case '<=': return this.toNumber(left) <= this.toNumber(right);
          case '>=': return this.toNumber(left) >= this.toNumber(right);
        }
        break;
      case 'Unary':
        const arg = this.evaluateNode(node.arg);
        return node.op === '-' ? -this.toNumber(arg) : this.toNumber(arg);
    }
    return null;
  }

  getCellValue(ref) {
    const cleanRef = ref.replace(/^[^!]*!/, '');
    const val = this.data[cleanRef];
    if (val == null) return 0;
    if (typeof val === 'string' && val.startsWith('=')) {
      return this.evaluate(val, cleanRef);
    }
    return val;
  }

  getRangeValues(rangeRef) {
    const [start, end] = rangeRef.split(':');
    const parseRef = (ref) => {
      const match = ref.match(/\$?([A-Z]+)\$?(\d+)/i);
      if (!match) throw new Error(`Invalid: ${ref}`);
      return {
        col: match[1].split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 65), 0),
        row: parseInt(match[2]) - 1
      };
    };
    
    const s = parseRef(start);
    const e = parseRef(end);
    const values = [];
    
    for (let r = s.row; r <= e.row; r++) {
      const row = [];
      for (let c = s.col; c <= e.col; c++) {
        const col = String.fromCharCode(65 + c % 26).repeat(Math.floor(c / 26) + 1);
        row.push(this.getCellValue(`${col}${r + 1}`));
      }
      values.push(row);
    }
    
    return values;
  }

  updateData(data) {
    this.data = { ...this.data, ...data };
  }

  evaluate(formula, cellRef = null) {
    try {
      const clean = formula.startsWith('=') ? formula.slice(1) : formula;
      const tokens = this.tokenize(clean);
      const ast = this.parse(tokens);
      return this.evaluateNode(ast);
    } catch (err) {
      return { error: err.message };
    }
  }
}

// Singleton instance
let evaluatorInstance = null;

export const getFormulaEvaluator = () => {
  if (!evaluatorInstance) {
    evaluatorInstance = new FormulaEvaluator();
  }
  return evaluatorInstance;
};

export const evaluateFormula = (formula, data) => {
  const evaluator = getFormulaEvaluator();
  evaluator.updateData(data);
  return evaluator.evaluate(formula);
};

export default { getFormulaEvaluator, evaluateFormula };
