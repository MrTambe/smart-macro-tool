"""
AI System Prompt and Skills Configuration
Used by backend AI services
"""

from enum import Enum
from typing import Dict, List, Any


class AISkill(Enum):
    """AI Skill definitions"""
    DATA_ANALYSIS = "DATA_ANALYSIS"
    FORMULA_CREATION = "FORMULA_CREATION"
    DATA_CLEANING = "DATA_CLEANING"
    CHART_CREATION = "CHART_CREATION"
    FORMATTING = "FORMATTING"
    DATA_TRANSFORMATION = "DATA_TRANSFORMATION"
    VALIDATION = "VALIDATION"
    MACRO_AUTOMATION = "MACRO_AUTOMATION"


class ChangeType(Enum):
    """Change type definitions"""
    FORMULA_EDIT = "formula_edit"
    DATA_CLEANUP = "data_cleanup"
    FORMATTING = "formatting"
    CALCULATION = "calculation"
    CUSTOM = "custom"


class ImpactLevel(Enum):
    """Impact level definitions"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# Complete system prompt
SYSTEM_PROMPT = """You are Smart Macro AI, an expert spreadsheet assistant specializing
in Excel, Google Sheets, and data analysis.

## Your Core Mission
Help users analyze, transform, and optimize their spreadsheet data
through intelligent suggestions.

## Response Format Rules

ALWAYS respond in this JSON format:

```json
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
```

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

- ALWAYS:
  - Validate cell references exist
  - Check for circular references
  - Provide confidence scores (0.0-1.0)
  - Explain your reasoning
  - Suggest backups for destructive operations
  - Use IFERROR in formulas

- NEVER:
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

## Analysis Approach

When analyzing data:
1. Identify column data types (numeric, text, date, currency)
2. Check for existing formulas and patterns
3. Look for headers and data structure
4. Consider relationships between columns
5. Detect anomalies or inconsistencies

## Formula Guidelines

- Use absolute references ($A$1) when appropriate
- Prefer modern functions (XLOOKUP over VLOOKUP)
- Include error handling: =IFERROR(FORMULA(), "Error message")
- Optimize for readability
- Validate all cell references exist

## Example Interaction

User: "Calculate totals in column F"

Your Response:
```json
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
```

Remember: Always wrap your JSON response in markdown code blocks for proper parsing."""


# Skill metadata for UI/organization
SKILL_METADATA: Dict[AISkill, Dict[str, Any]] = {
    AISkill.DATA_ANALYSIS: {
        "name": "Data Analysis",
        "description": "Analyze data patterns, statistics, and insights",
        "icon": "📊",
        "color": "#3B82F6",
        "capabilities": [
            "Calculate summary statistics",
            "Identify patterns and trends",
            "Detect anomalies and outliers",
            "Generate data quality reports"
        ],
        "examples": [
            "Calculate average sales per month",
            "Find duplicate entries",
            "Identify highest/lowest values",
            "Generate summary statistics"
        ]
    },
    AISkill.FORMULA_CREATION: {
        "name": "Formula Creation",
        "description": "Create and optimize formulas",
        "icon": "🔢",
        "color": "#10B981",
        "capabilities": [
            "Mathematical formulas",
            "Lookup functions",
            "Logical conditions",
            "Text manipulation"
        ],
        "examples": [
            "Create SUM formula for totals",
            "Add VLOOKUP for data matching",
            "Calculate percentage change",
            "Create nested IF statements"
        ]
    },
    AISkill.DATA_CLEANING: {
        "name": "Data Cleaning",
        "description": "Clean and standardize data",
        "icon": "🧹",
        "color": "#F59E0B",
        "capabilities": [
            "Remove duplicates",
            "Handle missing values",
            "Standardize formats",
            "Validate data"
        ],
        "examples": [
            "Remove empty rows",
            "Fill missing values",
            "Standardize date formats",
            "Remove special characters"
        ]
    },
    AISkill.CHART_CREATION: {
        "name": "Chart Creation",
        "description": "Create visualizations",
        "icon": "📈",
        "color": "#8B5CF6",
        "capabilities": [
            "Bar charts",
            "Line charts",
            "Pie charts",
            "Scatter plots"
        ],
        "examples": [
            "Create sales trend chart",
            "Build pie chart of categories",
            "Generate bar chart comparison",
            "Add line chart for trends"
        ]
    },
    AISkill.FORMATTING: {
        "name": "Formatting",
        "description": "Apply visual formatting",
        "icon": "🎨",
        "color": "#EC4899",
        "capabilities": [
            "Cell formatting",
            "Conditional formatting",
            "Table styling",
            "Color schemes"
        ],
        "examples": [
            "Apply conditional formatting",
            "Format numbers as currency",
            "Style header row",
            "Add color coding"
        ]
    },
    AISkill.DATA_TRANSFORMATION: {
        "name": "Data Transformation",
        "description": "Transform data structure",
        "icon": "🔄",
        "color": "#6366F1",
        "capabilities": [
            "Pivot tables",
            "Sort and filter",
            "Transpose data",
            "Merge columns"
        ],
        "examples": [
            "Create pivot table summary",
            "Sort by multiple columns",
            "Transpose rows to columns",
            "Filter specific data"
        ]
    },
    AISkill.VALIDATION: {
        "name": "Validation",
        "description": "Validate data integrity",
        "icon": "✅",
        "color": "#14B8A6",
        "capabilities": [
            "Check consistency",
            "Validate formulas",
            "Detect errors",
            "Quality scoring"
        ],
        "examples": [
            "Check for formula errors",
            "Validate data types",
            "Find circular references",
            "Assess data quality"
        ]
    },
    AISkill.MACRO_AUTOMATION: {
        "name": "Macro Automation",
        "description": "Create automated workflows",
        "icon": "⚡",
        "color": "#F97316",
        "capabilities": [
            "Record macros",
            "Button triggers",
            "Scheduled tasks",
            "Report generation"
        ],
        "examples": [
            "Create data entry macro",
            "Add button for common task",
            "Automate report generation",
            "Set up scheduled refresh"
        ]
    }
}


def get_skill_metadata(skill: AISkill) -> Dict[str, Any]:
    """Get metadata for a specific skill"""
    return SKILL_METADATA.get(skill, {})


def get_all_skills() -> List[AISkill]:
    """Get list of all available skills"""
    return list(AISkill)


def get_system_prompt_with_context(
    file_name: str = None,
    sheet_name: str = None,
    row_count: int = None,
    column_count: int = None,
    columns: List[str] = None
) -> str:
    """Get system prompt with file context"""
    prompt = SYSTEM_PROMPT
    
    if file_name:
        context = f"""

## Current File Context
- File: {file_name}
- Sheet: {sheet_name or 'Sheet1'}
- Size: {row_count or '?'} rows × {column_count or '?'} columns
"""
        if columns:
            context += f"- Columns: {', '.join(columns[:10])}"
            if len(columns) > 10:
                context += f" (and {len(columns) - 10} more)"
        
        prompt += context
    
    return prompt


def validate_suggestion(suggestion: Dict[str, Any]) -> tuple[bool, List[str]]:
    """
    Validate AI suggestion structure
    Returns: (is_valid, list_of_errors)
    """
    errors = []
    
    required_fields = ["type", "skill", "title", "description", "confidence", "changes"]
    for field in required_fields:
        if field not in suggestion:
            errors.append(f"Missing required field: {field}")
    
    if "confidence" in suggestion:
        conf = suggestion["confidence"]
        if not (0.0 <= conf <= 1.0):
            errors.append(f"Confidence must be between 0.0 and 1.0, got {conf}")
    
    if "changes" in suggestion:
        if not isinstance(suggestion["changes"], list):
            errors.append("'changes' must be a list")
        else:
            for i, change in enumerate(suggestion["changes"]):
                change_fields = ["cell_id", "change_type", "description"]
                for field in change_fields:
                    if field not in change:
                        errors.append(f"Change {i}: Missing field '{field}'")
    
    return len(errors) == 0, errors


def calculate_impact_level(changes_count: int, has_formulas: bool) -> ImpactLevel:
    """Calculate impact level based on changes"""
    if changes_count > 10 or has_formulas:
        return ImpactLevel.HIGH
    elif changes_count > 3:
        return ImpactLevel.MEDIUM
    else:
        return ImpactLevel.LOW


# Example prompts for different scenarios
EXAMPLE_PROMPTS = {
    "calculation": {
        "user": "Calculate totals for columns C and D",
        "expected_skill": AISkill.FORMULA_CREATION,
        "context": "Columns C and D contain numeric data"
    },
    "cleanup": {
        "user": "Remove duplicate rows",
        "expected_skill": AISkill.DATA_CLEANING,
        "context": "Dataset has duplicate entries"
    },
    "formatting": {
        "user": "Make the header row bold with blue background",
        "expected_skill": AISkill.FORMATTING,
        "context": "Header row in row 1"
    },
    "analysis": {
        "user": "What's the average sales per month?",
        "expected_skill": AISkill.DATA_ANALYSIS,
        "context": "Sales data in column B with dates in column A"
    },
    "chart": {
        "user": "Create a bar chart of sales by category",
        "expected_skill": AISkill.CHART_CREATION,
        "context": "Categories in A, values in B"
    }
}


__all__ = [
    'SYSTEM_PROMPT',
    'AISkill',
    'ChangeType',
    'ImpactLevel',
    'SKILL_METADATA',
    'get_skill_metadata',
    'get_all_skills',
    'get_system_prompt_with_context',
    'validate_suggestion',
    'calculate_impact_level',
    'EXAMPLE_PROMPTS'
]
