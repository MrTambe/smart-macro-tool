import React, { useState } from 'react'
import { 
  Keyboard, 
  Search, 
  Command,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Undo,
  Redo,
  Save,
  ZoomIn,
  ZoomOut,
  X,
  Plus,
  FileText,
  Grid3X3
} from 'lucide-react'

interface ShortcutCategory {
  name: string
  icon: React.ReactNode
  shortcuts: Shortcut[]
}

interface Shortcut {
  name: string
  description: string
  keys: string[]
}

const KeyboardShortcuts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories: ShortcutCategory[] = [
    {
      name: 'Navigation',
      icon: <Grid3X3 className="w-5 h-5" />,
      shortcuts: [
        { name: 'Move Up', description: 'Navigate to the cell above', keys: ['↑'] },
        { name: 'Move Down', description: 'Navigate to the cell below', keys: ['↓'] },
        { name: 'Move Left', description: 'Navigate to the left cell', keys: ['←'] },
        { name: 'Move Right', description: 'Navigate to the right cell', keys: ['→'] },
        { name: 'Next Sheet', description: 'Switch to next worksheet', keys: ['Ctrl', 'PageDown'] },
        { name: 'Previous Sheet', description: 'Switch to previous worksheet', keys: ['Ctrl', 'PageUp'] },
        { name: 'Jump to Start', description: 'Go to cell A1', keys: ['Ctrl', 'Home'] },
        { name: 'Jump to End', description: 'Go to last used cell', keys: ['Ctrl', 'End'] },
        { name: 'Go to Cell', description: 'Open go to dialog', keys: ['Ctrl', 'G'] },
      ]
    },
    {
      name: 'Selection',
      icon: <Command className="w-5 h-5" />,
      shortcuts: [
        { name: 'Select All', description: 'Select all cells', keys: ['Ctrl', 'A'] },
        { name: 'Select Row', description: 'Select entire row', keys: ['Shift', 'Space'] },
        { name: 'Select Column', description: 'Select entire column', keys: ['Ctrl', 'Space'] },
        { name: 'Extend Selection Up', description: 'Extend selection upward', keys: ['Shift', '↑'] },
        { name: 'Extend Selection Down', description: 'Extend selection downward', keys: ['Shift', '↓'] },
        { name: 'Extend Selection Left', description: 'Extend selection left', keys: ['Shift', '←'] },
        { name: 'Extend Selection Right', description: 'Extend selection right', keys: ['Shift', '→'] },
      ]
    },
    {
      name: 'Editing',
      icon: <FileText className="w-5 h-5" />,
      shortcuts: [
        { name: 'Edit Cell', description: 'Start editing selected cell', keys: ['F2'] },
        { name: 'Confirm Edit', description: 'Confirm cell edit', keys: ['Enter'] },
        { name: 'Cancel Edit', description: 'Cancel cell edit', keys: ['Escape'] },
        { name: 'Delete Contents', description: 'Clear cell contents', keys: ['Delete'] },
        { name: 'Insert Row', description: 'Insert new row', keys: ['Ctrl', 'Shift', '+'] },
        { name: 'Delete Row', description: 'Delete selected row', keys: ['Ctrl', '-'] },
      ]
    },
    {
      name: 'Clipboard',
      icon: <Clipboard className="w-5 h-5" />,
      shortcuts: [
        { name: 'Copy', description: 'Copy selected cells', keys: ['Ctrl', 'C'] },
        { name: 'Cut', description: 'Cut selected cells', keys: ['Ctrl', 'X'] },
        { name: 'Paste', description: 'Paste copied cells', keys: ['Ctrl', 'V'] },
        { name: 'Paste Special', description: 'Paste with options', keys: ['Ctrl', 'Shift', 'V'] },
      ]
    },
    {
      name: 'Actions',
      icon: <CornerDownLeft className="w-5 h-5" />,
      shortcuts: [
        { name: 'Undo', description: 'Undo last action', keys: ['Ctrl', 'Z'] },
        { name: 'Redo', description: 'Redo last action', keys: ['Ctrl', 'Y'] },
        { name: 'Save', description: 'Save file', keys: ['Ctrl', 'S'] },
        { name: 'Save As', description: 'Save file as', keys: ['Ctrl', 'Shift', 'S'] },
        { name: 'Print', description: 'Print document', keys: ['Ctrl', 'P'] },
        { name: 'Find', description: 'Find in document', keys: ['Ctrl', 'F'] },
        { name: 'Replace', description: 'Find and replace', keys: ['Ctrl', 'H'] },
      ]
    },
    {
      name: 'View',
      icon: <ZoomIn className="w-5 h-5" />,
      shortcuts: [
        { name: 'Zoom In', description: 'Increase zoom level', keys: ['Ctrl', '+'] },
        { name: 'Zoom Out', description: 'Decrease zoom level', keys: ['Ctrl', '-'] },
        { name: 'Reset Zoom', description: 'Reset to 100%', keys: ['Ctrl', '0'] },
        { name: 'Full Screen', description: 'Toggle full screen', keys: ['F11'] },
        { name: 'Show/Hide Grid', description: 'Toggle grid lines', keys: ['Ctrl', 'Shift', 'G'] },
      ]
    },
    {
      name: 'Formulas',
      icon: <Command className="w-5 h-5" />,
      shortcuts: [
        { name: 'Insert Function', description: 'Open function wizard', keys: ['Shift', 'F3'] },
        { name: 'AutoSum', description: 'Insert SUM formula', keys: ['Alt', '='] },
        { name: 'Calculate Now', description: 'Recalculate all formulas', keys: ['F9'] },
        { name: 'Toggle Formula Bar', description: 'Show/hide formula bar', keys: ['Ctrl', 'Shift', 'U'] },
      ]
    },
  ]

  const filteredCategories = categories.map(category => ({
    ...category,
    shortcuts: category.shortcuts.filter(shortcut =>
      shortcut.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.shortcuts.length > 0)

  const KeyBadge: React.FC<{ keyName: string }> = ({ keyName }) => (
    <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded shadow-sm min-w-[24px]">
      {keyName}
    </kbd>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
          <p className="text-sm text-gray-500">
            Master these shortcuts to work faster
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Keyboard className="w-5 h-5" />
          <span>Quick Reference</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search shortcuts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.name
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.icon}
            {category.name}
          </button>
        ))}
      </div>

      {/* Shortcuts List */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {filteredCategories
          .filter(cat => !selectedCategory || cat.name === selectedCategory)
          .map(category => (
            <div key={category.name} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                {category.icon}
                <h4 className="font-medium text-gray-900">{category.name}</h4>
                <span className="text-xs text-gray-500 ml-auto">
                  {category.shortcuts.length} shortcuts
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {category.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{shortcut.name}</p>
                      <p className="text-sm text-gray-500">{shortcut.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <KeyBadge keyName={key} />
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-gray-400 mx-0.5">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Keyboard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No shortcuts found</p>
            <p className="text-sm text-gray-400">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Pro Tips
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Press <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs">?</kbd> anywhere to open this shortcut reference</li>
          <li>Hold <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs">Shift</kbd> while clicking to select ranges</li>
          <li>Double-click cell borders to auto-fit column width</li>
          <li>Use <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs">D</kbd> to fill down from the cell above</li>
        </ul>
      </div>
    </div>
  )
}

export default KeyboardShortcuts
