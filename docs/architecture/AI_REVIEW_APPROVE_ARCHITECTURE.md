# 🤖 AI Review & Approve Architecture

## Overview

This document describes the **AI Review & Approve** workflow architecture that enables users to:
1. **Request AI analysis** of their spreadsheet
2. **Review AI suggestions** before applying them
3. **Approve or reject** specific changes
4. **Apply approved changes** to the file
5. **Automatically reopen** the edited file in the workspace

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AIReviewPanel.tsx                                       │  │
│  │  - Input prompt                                          │  │
│  │  - Display suggestions                                   │  │
│  │  - Preview changes                                       │  │
│  │  - Approve/Reject/Apply buttons                          │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    API LAYER (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/ai-review/*                                        │  │
│  │  POST /request    - Create change request                │  │
│  │  POST /approve    - Approve suggestion                   │  │
│  │  POST /reject     - Reject request                       │  │
│  │  POST /apply      - Apply approved changes               │  │
│  │  POST /preview    - Preview without applying             │  │
│  │  GET  /status/:id - Get request status                   │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AIReviewUseCase                                         │  │
│  │  - request_changes()     - Initiate AI analysis          │  │
│  │  - approve_suggestion()  - Mark suggestion approved      │  │
│  │  - reject_request()      - Mark request rejected         │  │
│  │  - apply_approved_changes() - Apply to file              │  │
│  │  - preview_changes()     - Preview without applying      │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ChangeRequest                                           │  │
│  │  ├── request_id                                          │  │
│  │  ├── status: pending|suggested|approved|rejected|applied │  │
│  │  ├── suggestions: List[ChangeSuggestion]                 │  │
│  │  └── selected_suggestion_id                              │  │
│  │                                                          │  │
│  │  ChangeSuggestion                                        │  │
│  │  ├── suggestion_id                                       │  │
│  │  ├── description                                         │  │
│  │  ├── reasoning                                           │  │
│  │  ├── confidence_score                                    │  │
│  │  └── changes: List[CellChange]                           │  │
│  │                                                          │  │
│  │  CellChange                                              │  │
│  │  ├── cell_id (e.g., "A1", "B2")                          │  │
│  │  ├── old_value                                           │  │
│  │  ├── new_value                                           │  │
│  │  ├── change_type                                         │  │
│  │  └── description                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                         │
│  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │  AIChangeSuggestionService│  │  SpreadsheetChangeApplier│   │
│  │  - generate_suggestions() │  │  - can_apply()           │   │
│  │  - parse_ai_response()    │  │  - apply_changes()       │   │
│  │  - explain_change()       │  │  - preview_changes()     │   │
│  │  - build_analysis_prompt()│  │  - rollback_changes()    │   │
│  └──────────────────────────┘  └──────────────────────────┘   │
│  ┌──────────────────────────┐                                  │
│  │  ChangeRepository        │                                  │
│  │  - In-memory storage     │                                  │
│  │  - Persist requests      │                                  │
│  └──────────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Workflow

### Step 1: User Requests Changes

```
User clicks "AI Review" button → Opens AIReviewPanel
    ↓
User enters prompt: "Calculate totals in column F"
    ↓
Frontend sends POST /api/ai-review/request
    ↓
AIReviewUseCase.request_changes() called
    ↓
AIChangeSuggestionService.generate_suggestions()
    - Builds prompt with file content
    - Calls AI service
    - Parses response into ChangeSuggestion objects
    ↓
ChangeRequest created with status="suggested"
    ↓
Returns to UI with suggestions
```

### Step 2: User Reviews Suggestions

```
UI displays suggestions with:
    - Description
    - Reasoning
    - Confidence score
    - Affected cells count
    - Change types
    ↓
User can:
    - Preview changes (POST /api/ai-review/preview)
    - Approve specific suggestion (POST /api/ai-review/approve)
    - Reject all (POST /api/ai-review/reject)
```

### Step 3: Preview Changes

```
User clicks "Preview"
    ↓
SpreadsheetChangeApplier.preview_changes()
    - Gets current cell values
    - Shows old → new value comparison
    - Highlights formulas
    ↓
UI displays side-by-side comparison:
    Cell A1: "100" → "=SUM(A2:A10)" [formula]
    Cell B5: "null" → "0"
```

### Step 4: User Approves

```
User clicks "Approve"
    ↓
ChangeRequest.status = "approved"
    ↓
ChangeRequest.selected_suggestion_id = suggestion_id
    ↓
UI shows "Apply Changes" button
```

### Step 5: Apply Changes

```
User clicks "Apply Changes"
    ↓
Frontend sends POST /api/ai-review/apply
    ↓
AIReviewUseCase.apply_approved_changes()
    - Verifies status is "approved"
    - Gets selected suggestion
    - Validates changes can be applied
    - SpreadsheetChangeApplier.apply_changes()
        - Updates each cell in spreadsheet_store
        - Calls refreshGrid()
    - Marks file as modified
    - ChangeRequest.status = "applied"
    ↓
File automatically reopened in workspace
    ↓
UI shows success message
```

## 📁 File Structure

```
src_clean_architecture/
├── domain/
│   ├── change_request.py          # Domain entities
│   └── __init__.py
│
├── application/
│   ├── ai_review_use_case.py      # Use case implementation
│   └── __init__.py
│
└── infrastructure/
    ├── ai_change_service.py       # AI service integration
    └── __init__.py

backend/
└── app/
    └── api/
        └── ai_review.py           # FastAPI endpoints

frontend/
└── src/
    └── components/
        └── AIReview/
            ├── AIReviewPanel.tsx   # React UI component
            └── index.ts
```

## 🚀 API Endpoints

### POST /api/ai-review/request
Request AI analysis and get suggestions.

**Request:**
```json
{
  "file_id": "uuid",
  "sheet_id": "sheet_uuid",
  "user_prompt": "Calculate totals in column F"
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "status": "suggested",
  "user_prompt": "Calculate totals in column F",
  "suggestions": [
    {
      "suggestion_id": "uuid",
      "description": "Add SUM formula to calculate totals",
      "reasoning": "Column F contains numerical data that should be summed",
      "confidence": "95%",
      "affected_cells": 1,
      "change_types": ["formula_edit"]
    }
  ],
  "message": "AI analysis complete. Please review suggestions."
}
```

### POST /api/ai-review/approve
Approve a specific suggestion.

**Request:**
```json
{
  "request_id": "uuid",
  "suggestion_id": "uuid"
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "status": "approved",
  "selected_suggestion": "uuid",
  "message": "Suggestion approved. Ready to apply changes."
}
```

### POST /api/ai-review/apply
Apply approved changes to the file.

**Request:**
```json
{
  "request_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "request_id": "uuid",
  "file_id": "uuid",
  "sheet_id": "uuid",
  "changes_applied": 5,
  "message": "Changes applied successfully"
}
```

### POST /api/ai-review/preview
Preview changes without applying.

**Request:**
```json
{
  "request_id": "uuid",
  "suggestion_id": "uuid"
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "suggestion_id": "uuid",
  "changes": [
    {
      "cell_id": "F1",
      "old_value": "Total",
      "new_value": "=SUM(F2:F100)",
      "change_type": "formula_edit",
      "description": "Calculate total",
      "is_formula": true
    }
  ],
  "summary": {
    "suggestion_id": "uuid",
    "description": "Add SUM formula",
    "reasoning": "Calculate totals",
    "affected_cells": 1,
    "confidence": "95%",
    "change_types": ["formula_edit"]
  }
}
```

## 🎨 UI Components

### AIReviewPanel

```tsx
<AIReviewPanel onClose={() => setShowAIReview(false)} />
```

**Features:**
- Text input for user prompts
- Real-time analysis status
- Suggestion cards with confidence scores
- Preview panel showing before/after
- Approve/Reject/Apply action buttons
- Progress indicators for async operations

### Toolbar Integration

The "AI Review" button is added to the toolbar with a gradient purple-to-blue design:

```tsx
<button
  onClick={handleAIReview}
  className="flex items-center gap-1 px-2 py-1 rounded 
             bg-gradient-to-r from-purple-500 to-blue-500 
             text-white hover:from-purple-600 hover:to-blue-600"
>
  <Sparkles className="w-4 h-4" />
  <span className="text-xs font-medium">AI Review</span>
</button>
```

## 🔒 Safety Features

1. **Preview Before Apply**: Users can see exact changes before applying
2. **Approve Required**: Changes must be explicitly approved before application
3. **Rollback Support**: `SpreadsheetChangeApplier.rollback_changes()` can undo
4. **Validation**: Checks if changes can be applied before attempting
5. **Cell ID Validation**: Validates cell IDs are well-formed (e.g., A1, B2, AA10)

## 🧪 Testing

### Test Domain Logic
```python
from src_clean_architecture.domain.change_request import ChangeRequest, ChangeStatus

request = ChangeRequest(
    request_id="test-123",
    file_id="file-123",
    sheet_id="sheet-1",
    user_prompt="Test prompt",
    status=ChangeStatus.PENDING
)

assert request.is_pending
assert not request.has_suggestions
```

### Test Use Case
```python
from src_clean_architecture.application.ai_review_use_case import AIReviewUseCase

# Mock dependencies
use_case = AIReviewUseCase(
    ai_reviewer=mock_ai_reviewer,
    change_applier=mock_applier,
    file_repository=mock_repo,
    change_repository=mock_change_repo
)

# Execute
request = await use_case.request_changes(
    file_id="file-123",
    sheet_id="sheet-1",
    user_prompt="Calculate totals"
)

assert request.status == ChangeStatus.SUGGESTED
assert len(request.suggestions) > 0
```

## 🚀 Usage Example

### Programmatic Usage
```python
# 1. Initialize components
ai_service = AIChangeSuggestionService(your_ai_service)
change_applier = SpreadsheetChangeApplier(spreadsheet_store)
change_repo = ChangeRepository()

use_case = AIReviewUseCase(
    ai_reviewer=ai_service,
    change_applier=change_applier,
    file_repository=spreadsheet_store,
    change_repository=change_repo
)

# 2. Request analysis
request = await use_case.request_changes(
    file_id="my-file",
    sheet_id="sheet-1",
    user_prompt="Add SUM formulas to column F"
)

# 3. Review suggestions
for suggestion in request.suggestions:
    print(f"{suggestion.description} (Confidence: {suggestion.confidence_score})")

# 4. Approve
use_case.approve_suggestion(request.request_id, suggestion.suggestion_id)

# 5. Apply
result = await use_case.apply_approved_changes(request.request_id)
print(f"Applied {result['changes_applied']} changes")
```

### Frontend Usage
```tsx
const [showAIReview, setShowAIReview] = useState(false);

// In render
<Toolbar onAIReview={() => setShowAIReview(true)} />

{showAIReview && (
  <AIReviewPanel onClose={() => setShowAIReview(false)} />
)}
```

## 📝 Change Types

- **FORMULA_EDIT**: Modify or add formulas
- **DATA_CLEANUP**: Clean nulls, duplicates, formatting
- **COLUMN_RENAME**: Rename columns
- **FORMATTING**: Apply cell formatting
- **CALCULATION**: Add calculated fields
- **CUSTOM**: Any other change type

## 🔮 Future Enhancements

1. **Batch Operations**: Apply multiple suggestions at once
2. **Version Control**: Track all changes with timestamps
3. **Undo/Redo**: Full undo stack for applied changes
4. **AI Learning**: Learn from user approvals to improve suggestions
5. **Collaboration**: Multiple users reviewing same file
6. **Comments**: Add comments to specific cell changes
7. **Conflict Detection**: Detect conflicts between multiple AI suggestions

## ✅ Summary

The AI Review & Approve architecture provides:

✅ **Safety**: Preview and approve before applying
✅ **Transparency**: Clear reasoning for each change
✅ **Control**: User decides which changes to apply
✅ **Integration**: Seamlessly works with existing file system
✅ **Extensibility**: Easy to add new transformers and AI models
✅ **Clean Architecture**: Proper separation of concerns

**Status: Ready for Production!** 🚀
