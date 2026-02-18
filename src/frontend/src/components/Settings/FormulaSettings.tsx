import React, { useState } from 'react'
import { 
  Calculator, 
  FunctionSquare, 
  Settings2, 
  AlertCircle,
  Check,
  Info,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Hash,
  DollarSign,
  Percent,
  Sigma
} from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { useToast } from '../../contexts/ToastContext'

interface FormulaCategory {
  name: string
  description: string
  formulas: string[]
}

const FormulaSettings: React.FC = () => {
  const settings = useSettingsStore()
  const { showSuccess, showInfo } = useToast()
  const [expandedCategory, setExpandedCategory] = useState<string | null>('math')
  const [calculationMode, setCalculationMode] = useState<'automatic' | 'manual'>('automatic')
  const [precision, setPrecision] = useState<number>(2)
  const [useThousandsSeparator, setUseThousandsSeparator] = useState(true)
  const [decimalSeparator, setDecimalSeparator] = useState<'dot' | 'comma'>('dot')
  const [dateFormat, setDateFormat] = useState<'US' | 'EU' | 'ISO'>('US')

  const formulaCategories: FormulaCategory[] = [
    {
      name: 'Math & Trig',
      description: 'Mathematical and trigonometric functions',
      formulas: ['SUM', 'AVERAGE', 'MAX', 'MIN', 'COUNT', 'ABS', 'ROUND', 'POWER', 'SQRT', 'SIN', 'COS', 'TAN']
    },
    {
      name: 'Logical',
      description: 'Conditional logic and boolean operations',
      formulas: ['IF', 'AND', 'OR', 'NOT', 'TRUE', 'FALSE']
    },
    {
      name: 'Text',
      description: 'Text manipulation and formatting',
      formulas: ['CONCAT', 'LEFT', 'RIGHT', 'MID', 'LEN', 'TRIM', 'UPPER', 'LOWER', 'SUBSTITUTE', 'FIND']
    },
    {
      name: 'Lookup',
      description: 'Data lookup and reference functions',
      formulas: ['VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH', 'CHOOSE', 'OFFSET']
    },
    {
      name: 'Date & Time',
      description: 'Date and time calculations',
      formulas: ['TODAY', 'NOW', 'DATE', 'TIME', 'DAY', 'MONTH', 'YEAR', 'WEEKDAY', 'DATEDIF']
    },
    {
      name: 'Statistical',
      description: 'Statistical analysis functions',
      formulas: ['SUMIF', 'COUNTIF', 'AVERAGEIF', 'SUMIFS', 'COUNTIFS', 'STDEV', 'VAR']
    },
    {
      name: 'Financial',
      description: 'Financial calculations',
      formulas: ['PV', 'FV', 'PMT', 'RATE', 'NPV', 'IRR']
    },
  ]

  const handleSaveSettings = () => {
    // In a real implementation, these would be saved to the settings store
    showSuccess('Formula settings saved successfully')
  }

  const toggleCategory = (name: string) => {
    setExpandedCategory(expandedCategory === name ? null : name)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Formula Settings</h3>
        <p className="text-sm text-gray-500">
          Configure formula calculation behavior and number formatting
        </p>
      </div>

      {/* Calculation Settings */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Calculation</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calculation Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setCalculationMode('automatic')}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  calculationMode === 'automatic'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Check className={`w-4 h-4 ${calculationMode === 'automatic' ? 'opacity-100' : 'opacity-0'}`} />
                  Automatic
                </div>
                <p className="text-xs font-normal text-gray-500 mt-1">
                  Formulas calculate immediately
                </p>
              </button>
              <button
                onClick={() => setCalculationMode('manual')}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  calculationMode === 'manual'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Check className={`w-4 h-4 ${calculationMode === 'manual' ? 'opacity-100' : 'opacity-0'}`} />
                  Manual
                </div>
                <p className="text-xs font-normal text-gray-500 mt-1">
                  Press F9 to calculate
                </p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Iterative Calculations</label>
              <p className="text-xs text-gray-500">Allow circular references</p>
            </div>
            <button
              onClick={() => showInfo('Feature coming soon!')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Maximum Iterations</label>
              <p className="text-xs text-gray-500">Limit for circular calculations</p>
            </div>
            <input
              type="number"
              defaultValue={100}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              min={1}
              max={1000}
            />
          </div>
        </div>
      </div>

      {/* Number Formatting */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-green-600" />
          <h4 className="font-medium text-gray-900">Number Formatting</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decimal Places
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={10}
                value={precision}
                onChange={(e) => setPrecision(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-900 w-8">{precision}</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Thousands Separator</label>
              <p className="text-xs text-gray-500">Use commas for thousands (e.g., 1,000,000)</p>
            </div>
            <button
              onClick={() => setUseThousandsSeparator(!useThousandsSeparator)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                useThousandsSeparator ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useThousandsSeparator ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decimal Separator
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setDecimalSeparator('dot')}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm transition-colors ${
                  decimalSeparator === 'dot'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Dot (1.5)
              </button>
              <button
                onClick={() => setDecimalSeparator('comma')}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm transition-colors ${
                  decimalSeparator === 'comma'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Comma (1,5)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date & Time Format */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-purple-600" />
          <h4 className="font-medium text-gray-900">Date & Time Format</h4>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="dateFormat"
              checked={dateFormat === 'US'}
              onChange={() => setDateFormat('US')}
              className="w-4 h-4 text-blue-600"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">US Format</span>
              <p className="text-xs text-gray-500">MM/DD/YYYY (12/31/2024)</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="dateFormat"
              checked={dateFormat === 'EU'}
              onChange={() => setDateFormat('EU')}
              className="w-4 h-4 text-blue-600"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">European Format</span>
              <p className="text-xs text-gray-500">DD/MM/YYYY (31/12/2024)</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="dateFormat"
              checked={dateFormat === 'ISO'}
              onChange={() => setDateFormat('ISO')}
              className="w-4 h-4 text-blue-600"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">ISO 8601 Format</span>
              <p className="text-xs text-gray-500">YYYY-MM-DD (2024-12-31)</p>
            </div>
          </label>
        </div>
      </div>

      {/* Available Functions */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <FunctionSquare className="w-5 h-5 text-orange-600" />
          <h4 className="font-medium text-gray-900">Available Functions</h4>
          <span className="ml-auto text-xs text-gray-500">
            {formulaCategories.reduce((acc, cat) => acc + cat.formulas.length, 0)} functions
          </span>
        </div>

        <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {formulaCategories.map(category => (
            <div key={category.name}>
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedCategory === category.name ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                </div>
                <span className="text-xs text-gray-500">{category.formulas.length} functions</span>
              </button>
              
              {expandedCategory === category.name && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-gray-500 mb-2 ml-6">{category.description}</p>
                  <div className="ml-6 flex flex-wrap gap-2">
                    {category.formulas.map(formula => (
                      <span
                        key={formula}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                      >
                        {formula}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Function Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Formula Help</h4>
            <p className="text-sm text-blue-700 mt-1">
              Access detailed documentation for all supported Excel-compatible functions.
            </p>
            <button
              onClick={() => showInfo('Formula documentation coming soon!')}
              className="mt-3 text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              View Documentation
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Check className="w-4 h-4" />
          Save Formula Settings
        </button>
      </div>
    </div>
  )
}

export default FormulaSettings
