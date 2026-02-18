/**
 * AI System Prompt and Skills Definition
 * This is the complete system prompt sent to AI services
 */

export const SYSTEM_PROMPT = `You are Smart Macro AI, an expert spreadsheet assistant specializing in Excel, Google Sheets, and data analysis.

## Your Core Mission
Help users analyze, transform, and optimize their spreadsheet data through intelligent suggestions.

## Response Format Rules

ALWAYS respond in this JSON format:

\`\`\`json
{
  "type": "suggestion",
  "skill": "SKILL_NAME",
  "title": "Brief clear title",
  "description": "What you're suggesting",
  "reasoning": "Why this helps",
  "confidence": 0.95,
  "impact": "low|medium|high",
  "changes": [
    {
      "cell_id": "A1",
      "current_value": "old",
      "new_value": "new",
      "change_type": "formula_edit|data_cleanup|formatting|calculation",
      "description": "What this does",
      "formula": "=FORMULA() if applicable"
    }
  ],
  "warnings": ["Any cautions"]
}
\`\`\`

## Available Skills

1. DATA_ANALYSIS - Calculate statistics, identify patterns, detect anomalies
2. FORMULA_CREATION - Create SUM, VLOOKUP, IF statements, mathematical formulas
3. DATA_CLEANING - Remove duplicates, handle nulls, standardize formats
4. CHART_CREATION - Create bar, line, pie, scatter charts
5. FORMATTING - Apply colors, fonts, conditional formatting, borders
6. DATA_TRANSFORMATION - Pivot tables, sort, filter, transpose
7. VALIDATION - Check data integrity, validate formulas
8. MACRO_AUTOMATION - Create automated workflows

## Safety Rules

✅ DO:
- Always validate cell references exist
- Check for circular references
- Provide confidence scores (0.0-1.0)
- Explain your reasoning
- Suggest backups for destructive operations
- Use IFERROR in formulas

❌ DON'T:
- Delete data without user approval
- Create circular references
- Overwrite formulas blindly
- Make assumptions without stating them
- Suggest invalid cell references

## Confidence Scoring
- 0.90-1.00: High confidence, standard formula, clear data
- 0.70-0.89: Medium confidence, minor assumptions
- 0.50-0.69: Low confidence, significant assumptions
- Below 0.50: Very uncertain, needs user verification

## Impact Levels
- Low: 1-3 cells, no formulas
- Medium: 4-10 cells or simple formulas  
- High: 10+ cells, complex formulas, structural changes

## Example Interaction

User: "Calculate totals in column F"

Your Response:
\`\`\`json
{
  "type": "suggestion",
  "skill": "FORMULA_CREATION",
  "title": "Add SUM Formula to Column F",
  "description": "Calculate total of all values in column F",
  "reasoning": "Column F contains numeric transaction data that should be summed",
  "confidence": 0.95,
  "impact": "low",
  "changes": [
    {
      "cell_id": "F101",
      "current_value": "",
      "new_value": "=SUM(F2:F100)",
      "change_type": "formula_edit",
      "description": "Sum all values in F2:F100",
      "formula": "=SUM(F2:F100)"
    }
  ],
  "warnings": []
}
\`\`\`

Remember: Always wrap your JSON response in markdown code blocks for proper parsing.`;

/**
 * Skill definitions for type safety
 */
export enum AISkill {
  DATA_ANALYSIS = 'DATA_ANALYSIS',
  FORMULA_CREATION = 'FORMULA_CREATION',
  DATA_CLEANING = 'DATA_CLEANING',
  CHART_CREATION = 'CHART_CREATION',
  FORMATTING = 'FORMATTING',
  DATA_TRANSFORMATION = 'DATA_TRANSFORMATION',
  VALIDATION = 'VALIDATION',
  MACRO_AUTOMATION = 'MACRO_AUTOMATION'
}

/**
 * Change type definitions
 */
export enum ChangeType {
  FORMULA_EDIT = 'formula_edit',
  DATA_CLEANUP = 'data_cleanup',
  FORMATTING = 'formatting',
  CALCULATION = 'calculation',
  CUSTOM = 'custom'
}

/**
 * Impact level definitions
 */
export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Skill metadata for UI display
 */
export const SKILL_METADATA: Record<AISkill, {
  name: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
}> = {
  [AISkill.DATA_ANALYSIS]: {
    name: 'Data Analysis',
    description: 'Analyze data patterns, statistics, and insights',
    icon: '📊',
    color: '#3B82F6',
    capabilities: [
      'Calculate summary statistics',
      'Identify patterns and trends',
      'Detect anomalies and outliers',
      'Generate data quality reports'
    ]
  },
  [AISkill.FORMULA_CREATION]: {
    name: 'Formula Creation',
    description: 'Create and optimize formulas',
    icon: '🔢',
    color: '#10B981',
    capabilities: [
      'Mathematical formulas',
      'Lookup functions',
      'Logical conditions',
      'Text manipulation'
    ]
  },
  [AISkill.DATA_CLEANING]: {
    name: 'Data Cleaning',
    description: 'Clean and standardize data',
    icon: '🧹',
    color: '#F59E0B',
    capabilities: [
      'Remove duplicates',
      'Handle missing values',
      'Standardize formats',
      'Validate data'
    ]
  },
  [AISkill.CHART_CREATION]: {
    name: 'Chart Creation',
    description: 'Create visualizations',
    icon: '📈',
    color: '#8B5CF6',
    capabilities: [
      'Bar charts',
      'Line charts',
      'Pie charts',
      'Scatter plots'
    ]
  },
  [AISkill.FORMATTING]: {
    name: 'Formatting',
    description: 'Apply visual formatting',
    icon: '🎨',
    color: '#EC4899',
    capabilities: [
      'Cell formatting',
      'Conditional formatting',
      'Table styling',
      'Color schemes'
    ]
  },
  [AISkill.DATA_TRANSFORMATION]: {
    name: 'Data Transformation',
    description: 'Transform data structure',
    icon: '🔄',
    color: '#6366F1',
    capabilities: [
      'Pivot tables',
      'Sort and filter',
      'Transpose data',
      'Merge columns'
    ]
  },
  [AISkill.VALIDATION]: {
    name: 'Validation',
    description: 'Validate data integrity',
    icon: '✅',
    color: '#14B8A6',
    capabilities: [
      'Check consistency',
      'Validate formulas',
      'Detect errors',
      'Quality scoring'
    ]
  },
  [AISkill.MACRO_AUTOMATION]: {
    name: 'Macro Automation',
    description: 'Create automated workflows',
    icon: '⚡',
    color: '#F97316',
    capabilities: [
      'Record macros',
      'Button triggers',
      'Scheduled tasks',
      'Report generation'
    ]
  }
};

/**
 * Get skill metadata for display
 */
export function getSkillMetadata(skill: AISkill) {
  return SKILL_METADATA[skill];
}

/**
 * Get all available skills
 */
export function getAllSkills(): AISkill[] {
  return Object.values(AISkill);
}

/**
 * Get skills as options for dropdowns
 */
export function getSkillOptions() {
  return Object.values(AISkill).map(skill => ({
    value: skill,
    label: SKILL_METADATA[skill].name,
    description: SKILL_METADATA[skill].description,
    icon: SKILL_METADATA[skill].icon
  }));
}

/**
 * Validate if a string is a valid skill
 */
export function isValidSkill(skill: string): skill is AISkill {
  return Object.values(AISkill).includes(skill as AISkill);
}

/**
 * Get system prompt with context
 */
export function getSystemPromptWithContext(context: {
  fileName?: string;
  sheetName?: string;
  columnCount?: number;
  rowCount?: number;
}): string {
  const basePrompt = SYSTEM_PROMPT;
  
  const contextSection = context.fileName ? `

## Current Context
- File: ${context.fileName}
- Sheet: ${context.sheetName || 'Sheet1'}
- Size: ${context.rowCount || '?'} rows × ${context.columnCount || '?'} columns

Use this context when making suggestions.` : '';
  
  return basePrompt + contextSection;
}

export default SYSTEM_PROMPT;
