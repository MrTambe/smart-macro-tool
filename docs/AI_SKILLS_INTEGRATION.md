# 🤖 AI Skills & System Prompt Integration Guide

## Overview

This guide explains how to integrate the AI system prompt and skills into the Smart Macro Tool.

## 📁 Files Created

```
smart-macro-tool/
├── AI_SYSTEM_PROMPT.md                          # Complete documentation
├── frontend/src/services/
│   └── aiSystemPrompt.ts                        # TypeScript implementation
├── backend/app/core/
│   └── ai_system_prompt.py                      # Python implementation
└── docs/
    └── AI_SKILLS_INTEGRATION.md                 # This guide
```

## 🎯 Available Skills

| Skill | Icon | Description | Example |
|-------|------|-------------|---------|
| **DATA_ANALYSIS** | 📊 | Analyze patterns, statistics | "Calculate average sales" |
| **FORMULA_CREATION** | 🔢 | Create formulas | "Add SUM formula" |
| **DATA_CLEANING** | 🧹 | Clean and standardize | "Remove duplicates" |
| **CHART_CREATION** | 📈 | Create visualizations | "Create bar chart" |
| **FORMATTING** | 🎨 | Apply formatting | "Make headers bold" |
| **DATA_TRANSFORMATION** | 🔄 | Transform structure | "Create pivot table" |
| **VALIDATION** | ✅ | Validate integrity | "Check for errors" |
| **MACRO_AUTOMATION** | ⚡ | Automate workflows | "Record macro" |

## 🚀 Quick Integration

### Frontend Integration (TypeScript/React)

```typescript
import { 
  SYSTEM_PROMPT, 
  getSystemPromptWithContext,
  AISkill,
  getSkillMetadata 
} from '../services/aiSystemPrompt';

// 1. Use system prompt when calling AI
const callAI = async (userPrompt: string, fileContext: any) => {
  const systemPrompt = getSystemPromptWithContext({
    fileName: fileContext.name,
    sheetName: fileContext.sheet,
    rowCount: fileContext.rows,
    columnCount: fileContext.cols
  });
  
  const response = await aiService.processRequest(userPrompt, systemPrompt);
  return response;
};

// 2. Display skill information
const SkillBadge = ({ skill }: { skill: AISkill }) => {
  const metadata = getSkillMetadata(skill);
  return (
    <span style={{ color: metadata.color }}>
      {metadata.icon} {metadata.name}
    </span>
  );
};

// 3. Get all skills for dropdown
const skillOptions = getSkillOptions();
// Returns: [{ value: 'DATA_ANALYSIS', label: 'Data Analysis', ... }]
```

### Backend Integration (Python)

```python
from app.core.ai_system_prompt import (
    SYSTEM_PROMPT,
    get_system_prompt_with_context,
    AISkill,
    get_skill_metadata,
    validate_suggestion
)

# 1. Use system prompt when calling AI
async def analyze_with_ai(user_prompt: str, file_context: dict):
    system_prompt = get_system_prompt_with_context(
        file_name=file_context.get('name'),
        sheet_name=file_context.get('sheet'),
        row_count=file_context.get('rows'),
        column_count=file_context.get('cols'),
        columns=file_context.get('columns')
    )
    
    response = await ai_service.process_request(
        user_prompt=user_prompt,
        system_prompt=system_prompt
    )
    return response

# 2. Validate AI response
is_valid, errors = validate_suggestion(ai_response)
if not is_valid:
    print(f"Invalid suggestion: {errors}")

# 3. Get skill info
skill_info = get_skill_metadata(AISkill.FORMULA_CREATION)
print(skill_info['capabilities'])  # List of capabilities
```

## 📝 System Prompt Structure

The system prompt tells the AI:

1. **Who it is**: Smart Macro AI, spreadsheet expert
2. **Response format**: JSON with specific structure
3. **Available skills**: 8 core skills it can use
4. **Safety rules**: What to do and what not to do
5. **Confidence scoring**: How to rate suggestions
6. **Examples**: How to format responses

### Key Sections

```
## Response Format Rules
- Always use JSON format
- Wrap in markdown code blocks
- Include confidence scores

## Available Skills
1. DATA_ANALYSIS
2. FORMULA_CREATION
...

## Safety Rules
✅ DO: Validate references, check for errors
❌ DON'T: Delete data, create circular refs

## Confidence Scoring
0.90-1.00: High confidence
0.70-0.89: Medium confidence
...
```

## 🎨 Skill Metadata

Each skill has:

```typescript
{
  name: "Formula Creation",
  description: "Create and optimize formulas",
  icon: "🔢",
  color: "#10B981",
  capabilities: [
    "Mathematical formulas",
    "Lookup functions",
    "Logical conditions"
  ],
  examples: [
    "Create SUM formula",
    "Add VLOOKUP"
  ]
}
```

Use this for:
- UI badges and icons
- Skill selection dropdowns
- Capability descriptions
- Documentation

## 📊 AI Response Format

The AI should respond with:

```json
{
  "type": "suggestion",
  "skill": "FORMULA_CREATION",
  "title": "Add SUM Formula",
  "description": "Calculate total in column F",
  "reasoning": "Column F contains numeric data",
  "confidence": 0.95,
  "impact": "low",
  "changes": [
    {
      "cell_id": "F101",
      "current_value": "",
      "new_value": "=SUM(F2:F100)",
      "change_type": "formula_edit",
      "description": "Sum all values",
      "formula": "=SUM(F2:F100)"
    }
  ],
  "warnings": [],
  "alternatives": []
}
```

## 🔧 Integration Steps

### Step 1: Update AI Services

**Frontend:** Update `aiService.ts`

```typescript
// Before
const response = await fetch('/api/ai', {
  body: JSON.stringify({ prompt: userInput })
});

// After
import { getSystemPromptWithContext } from './aiSystemPrompt';

const systemPrompt = getSystemPromptWithContext(fileContext);
const response = await fetch('/api/ai', {
  body: JSON.stringify({ 
    prompt: userInput,
    systemPrompt: systemPrompt 
  })
});
```

**Backend:** Update API endpoint

```python
# Before
@app.post("/api/ai")
async def ai_endpoint(request: Request):
    response = await ai_service.process(request.prompt)
    return response

# After
from app.core.ai_system_prompt import get_system_prompt_with_context

@app.post("/api/ai")
async def ai_endpoint(request: Request):
    system_prompt = get_system_prompt_with_context(
        file_name=request.file_name,
        # ... other context
    )
    response = await ai_service.process(
        prompt=request.prompt,
        system_prompt=system_prompt
    )
    return response
```

### Step 2: Parse AI Response

```typescript
// In ChatPanel or AIReviewPanel
const { cleanedContent, actions } = extractAIActions(aiResponse.content);
// cleanedContent: Formatted text for display
// actions: Array of actionable suggestions
```

### Step 3: Display Skills

```tsx
// Show skill badges
{message.skill && (
  <SkillBadge skill={message.skill} />
)}

// Or show in suggestion card
<div className="skill-header">
  <span style={{ color: skillMetadata.color }}>
    {skillMetadata.icon}
  </span>
  <span>{skillMetadata.name}</span>
</div>
```

## 🧪 Testing

### Test Skill Detection

```typescript
// Test that skills are properly typed
const skill: AISkill = AISkill.FORMULA_CREATION;
console.log(getSkillMetadata(skill));
// Should output: { name: 'Formula Creation', ... }
```

### Test System Prompt

```python
# Test system prompt generation
prompt = get_system_prompt_with_context(
    file_name="test.xlsx",
    row_count=100,
    column_count=5
)
assert "test.xlsx" in prompt
assert "100 rows" in prompt
```

### Test Response Validation

```python
# Test suggestion validation
suggestion = {
    "type": "suggestion",
    "skill": "FORMULA_CREATION",
    # ... incomplete
}
is_valid, errors = validate_suggestion(suggestion)
assert not is_valid
assert len(errors) > 0
```

## 📚 Example Usage

### Complete Workflow

```typescript
// 1. User opens file
const file = await openFile('data.xlsx');

// 2. User asks AI
const userPrompt = "Calculate totals";

// 3. Build context
const context = {
  fileName: file.name,
  sheetName: file.sheet,
  rowCount: file.rowCount,
  columnCount: file.columnCount
};

// 4. Get system prompt
const systemPrompt = getSystemPromptWithContext(context);

// 5. Call AI
const aiResponse = await aiService.processRequest(
  userPrompt,
  systemPrompt
);

// 6. Parse response
const { cleanedContent, actions } = extractAIActions(
  aiResponse.content
);

// 7. Display with formatting
<FormattedAIResponse content={cleanedContent} />

// 8. Show action buttons
{actions.map(action => (
  <ActionButton 
    key={action.id}
    action={action}
    onApprove={() => applyAction(action)}
    onReject={() => rejectAction(action)}
  />
))}
```

## 🎓 Best Practices

### 1. Always Include Context
```typescript
// Good
const systemPrompt = getSystemPromptWithContext({
  fileName: 'sales.xlsx',
  rowCount: 1000,
  columnCount: 10
});

// Bad - no context
const systemPrompt = SYSTEM_PROMPT; // Missing file context
```

### 2. Validate Responses
```python
# Always validate AI responses
is_valid, errors = validate_suggestion(ai_response)
if not is_valid:
    log_errors(errors)
    return fallback_response()
```

### 3. Handle Low Confidence
```typescript
// Show warnings for low confidence
if (suggestion.confidence < 0.7) {
  showWarning("Low confidence - please review carefully");
}
```

### 4. Display Skills Properly
```tsx
// Use metadata for consistent UI
const meta = getSkillMetadata(suggestion.skill);
<Badge color={meta.color} icon={meta.icon}>
  {meta.name}
</Badge>
```

## 🔮 Future Enhancements

1. **Custom Skills**: Allow users to define custom skill templates
2. **Skill Chaining**: Chain multiple skills together (analyze → clean → format)
3. **Skill Learning**: AI learns which skills user prefers
4. **Multi-language**: System prompts in different languages
5. **Skill Templates**: Pre-built templates for common workflows

## 📞 Support

For issues or questions:
1. Check `AI_SYSTEM_PROMPT.md` for detailed documentation
2. Review example usage in `aiSystemPrompt.ts`
3. See backend implementation in `ai_system_prompt.py`

## ✅ Integration Checklist

- [x] System prompt created
- [x] Skills defined with metadata
- [x] Frontend TypeScript implementation
- [x] Backend Python implementation
- [x] Response validation functions
- [x] Context builder functions
- [ ] Integrate into aiService.ts
- [ ] Integrate into backend API
- [ ] Add skill badges to UI
- [ ] Test with real AI calls
- [ ] Document custom skills process

**Status: Ready for integration! 🚀**
