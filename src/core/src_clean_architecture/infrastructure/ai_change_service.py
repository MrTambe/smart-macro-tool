"""
Infrastructure layer for AI Review & Approve workflow.
Implements AI change reviewer and change applier.
"""

import uuid
from typing import Dict, Any, List, Optional
import json

from ..domain.change_request import (
    ChangeRequest,
    ChangeSuggestion,
    CellChange,
    ChangeType
)
from ..application.ai_review_use_case import ChangeRepository


class AIChangeSuggestionService:
    """
    AI service for analyzing files and suggesting changes.
    This integrates with the existing AI system.
    """
    
    def __init__(self, ai_service):
        """
        Initialize with AI service.
        
        Args:
            ai_service: Existing AI service from the application
        """
        self.ai_service = ai_service
    
    async def generate_suggestions(
        self,
        request: ChangeRequest,
        context: Dict[str, Any]
    ) -> List[ChangeSuggestion]:
        """
        Generate change suggestions using AI.
        
        Args:
            request: The change request
            context: Context including file content and user prompt
            
        Returns:
            List of change suggestions
        """
        file_content = context.get('file_content', {})
        user_prompt = context.get('user_prompt', '')
        sheet_id = context.get('sheet_id', '')
        
        # Build prompt for AI
        ai_prompt = self._build_analysis_prompt(
            file_content=file_content,
            user_prompt=user_prompt,
            sheet_id=sheet_id
        )
        
        # Call AI service
        try:
            ai_response = await self.ai_service.process_request(ai_prompt)
            
            # Parse AI response into suggestions
            suggestions = self._parse_ai_response(
                ai_response,
                request.file_id,
                request.sheet_id
            )
            
            return suggestions
            
        except Exception as e:
            # Return empty list or raise based on error
            print(f"AI analysis error: {e}")
            return []
    
    def _build_analysis_prompt(
        self,
        file_content: Dict[str, Any],
        user_prompt: str,
        sheet_id: str
    ) -> str:
        """Build prompt for AI analysis."""
        prompt = f"""You are an Excel expert assistant. Analyze the following spreadsheet data and suggest changes based on the user's request.

User Request: {user_prompt}

Spreadsheet Data:
- Sheet ID: {sheet_id}
- Columns: {file_content.get('columns', [])}
- Sample Data (first 5 rows):
{json.dumps(file_content.get('sample_data', []), indent=2)}

Current Formulas:
{json.dumps(file_content.get('formulas', {}), indent=2)}

Please suggest specific changes to make. For each change, provide:
1. The cell ID (e.g., "A1", "B2")
2. The current value
3. The new value or formula
4. A brief explanation of why this change is needed
5. The type of change (formula_edit, data_cleanup, column_rename, formatting, calculation, or custom)

Format your response as a JSON object with this structure:
{{
  "suggestions": [
    {{
      "description": "Brief description of the change",
      "reasoning": "Why this change is needed",
      "confidence": 0.95,
      "changes": [
        {{
          "cell_id": "B5",
          "old_value": "100",
          "new_value": "=SUM(B1:B4)",
          "description": "Calculate total",
          "change_type": "formula_edit"
        }}
      ]
    }}
  ]
}}

Only suggest changes that are safe and reversible. Do not suggest destructive changes."""
        
        return prompt
    
    def _parse_ai_response(
        self,
        ai_response: str,
        file_id: str,
        sheet_id: str
    ) -> List[ChangeSuggestion]:
        """Parse AI response into ChangeSuggestion objects."""
        suggestions = []
        
        try:
            # Try to parse JSON from AI response
            # Handle both direct JSON and JSON in markdown code blocks
            response_text = ai_response
            
            # Extract JSON from markdown if present
            if "```json" in response_text:
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            elif "```" in response_text:
                start = response_text.find("```") + 3
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            
            data = json.loads(response_text)
            
            for sugg_data in data.get('suggestions', []):
                changes = []
                
                for change_data in sugg_data.get('changes', []):
                    cell_change = CellChange(
                        sheet_id=sheet_id,
                        cell_id=change_data.get('cell_id', ''),
                        old_value=change_data.get('old_value'),
                        new_value=change_data.get('new_value'),
                        change_type=ChangeType(change_data.get('change_type', 'custom')),
                        description=change_data.get('description', ''),
                        formula=change_data.get('formula')
                    )
                    changes.append(cell_change)
                
                suggestion = ChangeSuggestion(
                    suggestion_id=str(uuid.uuid4()),
                    description=sugg_data.get('description', ''),
                    reasoning=sugg_data.get('reasoning', ''),
                    changes=changes,
                    confidence_score=sugg_data.get('confidence', 0.8)
                )
                suggestions.append(suggestion)
                
        except json.JSONDecodeError as e:
            print(f"Failed to parse AI response as JSON: {e}")
            print(f"Response: {ai_response[:500]}")
        except Exception as e:
            print(f"Error parsing AI response: {e}")
        
        return suggestions
    
    def explain_change(self, change: CellChange) -> str:
        """Generate human-readable explanation of a change."""
        explanations = {
            ChangeType.FORMULA_EDIT: f"Update formula in {change.cell_id}",
            ChangeType.DATA_CLEANUP: f"Clean data in {change.cell_id}",
            ChangeType.COLUMN_RENAME: f"Rename column {change.cell_id}",
            ChangeType.FORMATTING: f"Apply formatting to {change.cell_id}",
            ChangeType.CALCULATION: f"Add calculation in {change.cell_id}",
            ChangeType.CUSTOM: f"Modify {change.cell_id}"
        }
        
        base = explanations.get(change.change_type, f"Change {change.cell_id}")
        return f"{base}: {change.description}"


class SpreadsheetChangeApplier:
    """Applies changes to spreadsheet files."""
    
    def __init__(self, spreadsheet_store):
        """
        Initialize with spreadsheet store.
        
        Args:
            spreadsheet_store: Store for accessing and modifying spreadsheets
        """
        self.spreadsheet_store = spreadsheet_store
    
    def can_apply(self, changes: List[CellChange]) -> bool:
        """Check if changes can be applied."""
        # Check for invalid cell IDs, circular references, etc.
        for change in changes:
            if not self._is_valid_cell_id(change.cell_id):
                return False
        return True
    
    def apply_changes(
        self,
        file_id: str,
        sheet_id: str,
        changes: List[CellChange]
    ) -> bool:
        """
        Apply changes to spreadsheet.
        
        Args:
            file_id: File ID
            sheet_id: Sheet ID
            changes: List of changes to apply
            
        Returns:
            True if successful
        """
        try:
            for change in changes:
                # Set the new value
                self.spreadsheet_store.setCellValue(
                    file_id,
                    sheet_id,
                    change.cell_id,
                    str(change.new_value)
                )
            
            # Mark file as modified
            self.spreadsheet_store.markFileModified(file_id, True)
            
            # Refresh grid if available
            if hasattr(self.spreadsheet_store, 'refreshGrid'):
                self.spreadsheet_store.refreshGrid()
            
            return True
            
        except Exception as e:
            print(f"Error applying changes: {e}")
            return False
    
    def preview_changes(
        self,
        file_id: str,
        sheet_id: str,
        changes: List[CellChange]
    ) -> Dict[str, Any]:
        """
        Preview changes without applying.
        
        Args:
            file_id: File ID
            sheet_id: Sheet ID
            changes: List of changes
            
        Returns:
            Preview data
        """
        preview = {
            'file_id': file_id,
            'sheet_id': sheet_id,
            'affected_cells': [],
            'estimated_impact': 'low'
        }
        
        formula_count = sum(1 for c in changes if c.is_formula_change)
        
        if formula_count > 0:
            preview['estimated_impact'] = 'medium' if formula_count < 5 else 'high'
        
        for change in changes:
            current_value = self.spreadsheet_store.getCellValue(
                file_id, sheet_id, change.cell_id
            )
            
            preview['affected_cells'].append({
                'cell_id': change.cell_id,
                'current_value': current_value.get('value', '') if current_value else '',
                'proposed_value': str(change.new_value),
                'change_type': change.change_type.value,
                'description': change.description
            })
        
        return preview
    
    def _is_valid_cell_id(self, cell_id: str) -> bool:
        """Check if cell ID is valid (e.g., A1, B2, AA10)."""
        import re
        pattern = r'^[A-Z]+[0-9]+$'
        return bool(re.match(pattern, cell_id.upper()))
    
    def rollback_changes(
        self,
        file_id: str,
        sheet_id: str,
        changes: List[CellChange]
    ) -> bool:
        """
        Rollback changes by restoring old values.
        
        Args:
            file_id: File ID
            sheet_id: Sheet ID
            changes: List of changes to rollback
            
        Returns:
            True if successful
        """
        try:
            for change in changes:
                self.spreadsheet_store.setCellValue(
                    file_id,
                    sheet_id,
                    change.cell_id,
                    str(change.old_value) if change.old_value is not None else ''
                )
            
            self.spreadsheet_store.refreshGrid()
            return True
            
        except Exception as e:
            print(f"Error rolling back changes: {e}")
            return False
