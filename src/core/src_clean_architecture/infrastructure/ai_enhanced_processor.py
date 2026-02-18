"""
Enhanced AI Processing Service with better prompt engineering and output formatting.
"""

import uuid
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass

from ..domain.change_request import (
    ChangeRequest,
    ChangeSuggestion,
    CellChange,
    ChangeType
)


@dataclass
class AnalysisContext:
    """Context for AI analysis."""
    file_name: str
    sheet_name: str
    columns: List[str]
    sample_data: List[Dict]
    data_types: Dict[str, str]
    has_formulas: bool
    total_rows: int
    user_intent: str


class EnhancedAIProcessor:
    """
    Enhanced AI processor with sophisticated prompt engineering and output parsing.
    """
    
    def __init__(self, ai_service):
        self.ai_service = ai_service
        self.change_history: List[Dict] = []
    
    async def analyze_with_context(
        self,
        request: ChangeRequest,
        file_content: Dict[str, Any],
        user_prompt: str
    ) -> Tuple[List[ChangeSuggestion], str]:
        """
        Analyze file with rich context and generate intelligent suggestions.
        
        Returns:
            Tuple of (suggestions, reasoning_summary)
        """
        # Build rich context
        context = self._build_analysis_context(file_content, user_prompt)
        
        # Generate sophisticated prompt
        system_prompt = self._create_system_prompt()
        user_message = self._create_analysis_message(context, request)
        
        # Call AI with streaming support
        try:
            response = await self._call_ai_with_retry(
                system_prompt=system_prompt,
                user_message=user_message,
                max_retries=3
            )
            
            # Parse structured response
            suggestions, reasoning = self._parse_structured_response(
                response,
                request.file_id,
                request.sheet_id
            )
            
            # Enhance suggestions with metadata
            enhanced_suggestions = self._enhance_suggestions(
                suggestions,
                context,
                file_content
            )
            
            return enhanced_suggestions, reasoning
            
        except Exception as e:
            print(f"AI analysis error: {e}")
            # Fallback to basic suggestions
            return self._generate_fallback_suggestions(request, user_prompt), ""
    
    def _build_analysis_context(
        self,
        file_content: Dict[str, Any],
        user_prompt: str
    ) -> AnalysisContext:
        """Build rich context for AI analysis."""
        sample_data = file_content.get('sample_data', [])
        columns = file_content.get('columns', [])
        
        # Detect data types
        data_types = {}
        if sample_data and columns:
            for col in columns:
                values = [row.get(col) for row in sample_data if row.get(col) is not None]
                data_types[col] = self._infer_column_type(values)
        
        # Check for formulas
        has_formulas = any(
            str(v).startswith('=') 
            for row in sample_data 
            for v in row.values()
        )
        
        return AnalysisContext(
            file_name=file_content.get('file_name', 'unknown'),
            sheet_name=file_content.get('sheet_name', 'Sheet1'),
            columns=columns,
            sample_data=sample_data[:10],  # Limit sample size
            data_types=data_types,
            has_formulas=has_formulas,
            total_rows=file_content.get('row_count', 0),
            user_intent=self._classify_intent(user_prompt)
        )
    
    def _infer_column_type(self, values: List[Any]) -> str:
        """Infer column data type from sample values."""
        if not values:
            return "unknown"
        
        # Check for numeric
        numeric_count = sum(1 for v in values if isinstance(v, (int, float)))
        if numeric_count / len(values) > 0.8:
            return "numeric"
        
        # Check for dates
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',
            r'\d{2}/\d{2}/\d{4}',
            r'\d{2}-\d{2}-\d{4}'
        ]
        date_count = sum(
            1 for v in values 
            if any(re.match(p, str(v)) for p in date_patterns)
        )
        if date_count / len(values) > 0.8:
            return "date"
        
        # Check for currency
        currency_count = sum(
            1 for v in values 
            if isinstance(v, str) and re.match(r'^[$€£¥]?\s*[\d,]+\.?\d*\s*[$€£¥]?$', str(v))
        )
        if currency_count / len(values) > 0.5:
            return "currency"
        
        return "text"
    
    def _classify_intent(self, prompt: str) -> str:
        """Classify user intent from prompt."""
        prompt_lower = prompt.lower()
        
        intent_keywords = {
            "calculation": ["calculate", "sum", "total", "average", "mean", "count", "formula"],
            "cleanup": ["clean", "remove", "delete", "null", "empty", "duplicate"],
            "formatting": ["format", "style", "color", "bold", "align"],
            "transformation": ["convert", "transform", "change", "rename"],
            "validation": ["check", "validate", "verify", "find"],
            "organization": ["sort", "filter", "group", "organize"]
        }
        
        for intent, keywords in intent_keywords.items():
            if any(kw in prompt_lower for kw in keywords):
                return intent
        
        return "general"
    
    def _create_system_prompt(self) -> str:
        """Create sophisticated system prompt for AI."""
        return """You are an expert Excel/Spreadsheet AI assistant with deep knowledge of:
- Formula creation and optimization (Excel, Google Sheets, OpenFormula)
- Data cleaning and validation techniques
- Spreadsheet best practices and patterns
- Financial, statistical, and business calculations

Your task is to analyze spreadsheet data and suggest intelligent changes.

RULES:
1. Always provide specific, actionable suggestions
2. Include confidence scores (0.0-1.0) based on data certainty
3. Explain the reasoning behind each suggestion
4. Prioritize data safety - suggest non-destructive changes first
5. Consider data types and column relationships
6. Suggest formulas that are compatible with standard spreadsheet applications
7. If suggesting formulas, ensure they reference correct cell ranges

OUTPUT FORMAT:
Respond with a JSON object containing:
{
    "reasoning": "Brief explanation of your analysis approach",
    "suggestions": [
        {
            "id": "unique-id",
            "title": "Short, clear title",
            "description": "Detailed description of what will change",
            "reasoning": "Why this change is beneficial",
            "confidence": 0.95,
            "impact": "low|medium|high",
            "changes": [
                {
                    "cell_id": "A1",
                    "current_value": "current",
                    "new_value": "=FORMULA() or new value",
                    "change_type": "formula_edit|data_cleanup|formatting|calculation",
                    "explanation": "What this specific change does"
                }
            ],
            "metadata": {
                "affected_range": "A1:B10",
                "formula_complexity": "simple|medium|complex",
                "requires_confirmation": true|false
            }
        }
    ],
    "warnings": ["Any warnings about the data or suggestions"],
    "alternatives": ["Alternative approaches considered"]
}"""
    
    def _create_analysis_message(
        self,
        context: AnalysisContext,
        request: ChangeRequest
    ) -> str:
        """Create detailed analysis message with context."""
        
        # Build column analysis
        column_analysis = []
        for col in context.columns:
            col_type = context.data_types.get(col, "unknown")
            sample_values = [
                row.get(col) for row in context.sample_data[:3]
                if row.get(col) is not None
            ]
            column_analysis.append(
                f"  - {col} ({col_type}): {sample_values}"
            )
        
        message = f"""Analyze this spreadsheet and suggest intelligent changes.

FILE CONTEXT:
- Filename: {context.file_name}
- Sheet: {context.sheet_name}
- Total Rows: {context.total_rows}
- Has Existing Formulas: {'Yes' if context.has_formulas else 'No'}

USER REQUEST:
"{request.user_prompt}"
Classified Intent: {context.user_intent}

DATA STRUCTURE:
Columns ({len(context.columns)}):
{chr(10).join(column_analysis)}

SAMPLE DATA (first {len(context.sample_data)} rows):
{json.dumps(context.sample_data, indent=2, default=str)}

ANALYSIS INSTRUCTIONS:
1. Consider the user's intent: {context.user_intent}
2. Analyze column relationships and dependencies
3. Suggest formulas that make sense for the data types
4. If the request is vague, suggest the most likely intended changes
5. Prioritize suggestions by impact and confidence
6. Include at least one "safe" suggestion (low impact, high confidence)

Provide your analysis in the specified JSON format."""
        
        return message
    
    async def _call_ai_with_retry(
        self,
        system_prompt: str,
        user_message: str,
        max_retries: int = 3
    ) -> str:
        """Call AI service with retry logic."""
        for attempt in range(max_retries):
            try:
                # This would integrate with your actual AI service
                # For now, simulating with structured response
                response = await self.ai_service.process_request(
                    user_message,
                    system_prompt=system_prompt,
                    temperature=0.3,  # Lower for more consistent output
                    max_tokens=2000
                )
                return response
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                print(f"AI call failed (attempt {attempt + 1}), retrying...")
    
    def _parse_structured_response(
        self,
        response: str,
        file_id: str,
        sheet_id: str
    ) -> Tuple[List[ChangeSuggestion], str]:
        """Parse AI response into structured suggestions."""
        suggestions = []
        reasoning = ""
        
        try:
            # Extract JSON from response
            json_match = re.search(r'```json\n(.*?)\n```', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find JSON without markdown
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    json_str = response
            
            data = json.loads(json_str)
            
            # Extract reasoning
            reasoning = data.get('reasoning', '')
            
            # Parse suggestions
            for sugg_data in data.get('suggestions', []):
                changes = []
                
                for change_data in sugg_data.get('changes', []):
                    cell_change = CellChange(
                        sheet_id=sheet_id,
                        cell_id=change_data.get('cell_id', 'A1'),
                        old_value=change_data.get('current_value'),
                        new_value=change_data.get('new_value'),
                        change_type=ChangeType(change_data.get('change_type', 'custom')),
                        description=change_data.get('explanation', ''),
                        formula=change_data.get('new_value') if str(change_data.get('new_value', '')).startswith('=') else None
                    )
                    changes.append(cell_change)
                
                # Calculate confidence
                confidence = sugg_data.get('confidence', 0.8)
                if isinstance(confidence, str):
                    confidence = float(confidence.replace('%', '')) / 100
                
                suggestion = ChangeSuggestion(
                    suggestion_id=sugg_data.get('id', str(uuid.uuid4())),
                    description=sugg_data.get('title', sugg_data.get('description', '')),
                    reasoning=sugg_data.get('reasoning', ''),
                    changes=changes,
                    confidence_score=min(max(confidence, 0.0), 1.0)
                )
                suggestions.append(suggestion)
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse AI response as JSON: {e}")
            print(f"Response preview: {response[:500]}")
        except Exception as e:
            print(f"Error parsing response: {e}")
        
        return suggestions, reasoning
    
    def _enhance_suggestions(
        self,
        suggestions: List[ChangeSuggestion],
        context: AnalysisContext,
        file_content: Dict[str, Any]
    ) -> List[ChangeSuggestion]:
        """Enhance suggestions with additional metadata."""
        enhanced = []
        
        for suggestion in suggestions:
            # Add impact assessment
            impact = self._calculate_impact(suggestion, context)
            
            # Validate formulas if present
            validated_changes = self._validate_formulas(suggestion.changes)
            
            # Update suggestion
            suggestion.changes = validated_changes
            
            # Add to enhanced list if it has valid changes
            if suggestion.changes:
                enhanced.append(suggestion)
        
        # Sort by confidence (highest first)
        enhanced.sort(key=lambda x: x.confidence_score, reverse=True)
        
        return enhanced
    
    def _calculate_impact(
        self,
        suggestion: ChangeSuggestion,
        context: AnalysisContext
    ) -> str:
        """Calculate impact level of suggestion."""
        num_changes = len(suggestion.changes)
        has_formulas = any(c.is_formula_change for c in suggestion.changes)
        
        if num_changes > 10 or has_formulas:
            return "high"
        elif num_changes > 3:
            return "medium"
        else:
            return "low"
    
    def _validate_formulas(self, changes: List[CellChange]) -> List[CellChange]:
        """Validate and fix formula suggestions."""
        validated = []
        
        for change in changes:
            if change.is_formula_change:
                # Basic formula validation
                formula = str(change.new_value)
                
                # Check for balanced parentheses
                if formula.count('(') != formula.count(')'):
                    print(f"Warning: Unbalanced parentheses in formula: {formula}")
                    continue
                
                # Check for valid cell references
                cell_refs = re.findall(r'[A-Z]+\d+', formula)
                if not cell_refs and not any(func in formula for func in ['PI()', 'TODAY()', 'NOW()']):
                    print(f"Warning: No cell references in formula: {formula}")
            
            validated.append(change)
        
        return validated
    
    def _generate_fallback_suggestions(
        self,
        request: ChangeRequest,
        user_prompt: str
    ) -> List[ChangeSuggestion]:
        """Generate basic fallback suggestions when AI fails."""
        suggestions = []
        
        # Simple formula detection
        if any(word in user_prompt.lower() for word in ['sum', 'total', 'add']):
            suggestion = ChangeSuggestion(
                suggestion_id=str(uuid.uuid4()),
                description="Add SUM formula",
                reasoning="Detected sum/total keyword in request",
                changes=[
                    CellChange(
                        sheet_id=request.sheet_id,
                        cell_id="A1",
                        old_value="",
                        new_value="=SUM(A2:A10)",
                        change_type=ChangeType.CALCULATION,
                        description="Calculate sum of values"
                    )
                ],
                confidence_score=0.5
            )
            suggestions.append(suggestion)
        
        # Cleanup detection
        if any(word in user_prompt.lower() for word in ['clean', 'remove', 'delete']):
            suggestion = ChangeSuggestion(
                suggestion_id=str(uuid.uuid4()),
                description="Remove empty rows",
                reasoning="Detected cleanup keyword in request",
                changes=[
                    CellChange(
                        sheet_id=request.sheet_id,
                        cell_id="A1",
                        old_value="",
                        new_value="",
                        change_type=ChangeType.DATA_CLEANUP,
                        description="Remove rows with all null values"
                    )
                ],
                confidence_score=0.5
            )
            suggestions.append(suggestion)
        
        return suggestions
    
    def format_suggestion_for_display(
        self,
        suggestion: ChangeSuggestion
    ) -> Dict[str, Any]:
        """Format suggestion for frontend display with rich metadata."""
        return {
            'id': suggestion.suggestion_id,
            'title': suggestion.description,
            'description': suggestion.reasoning,
            'confidence': f"{suggestion.confidence_score:.0%}",
            'confidence_score': suggestion.confidence_score,
            'impact': self._calculate_impact(suggestion, None),
            'affected_cells': suggestion.affected_cells_count,
            'change_types': list(set(c.change_type.value for c in suggestion.changes)),
            'requires_confirmation': suggestion.confidence_score < 0.8,
            'preview_available': True,
            'changes': [
                {
                    'cell_id': c.cell_id,
                    'old_value': str(c.old_value)[:100] if c.old_value else None,
                    'new_value': str(c.new_value)[:100] if c.new_value else None,
                    'is_formula': c.is_formula_change,
                    'change_type': c.change_type.value,
                    'description': c.description
                }
                for c in suggestion.changes[:10]  # Limit preview
            ]
        }


class ChangeExplainer:
    """Generates human-readable explanations of changes."""
    
    def explain_suggestion(self, suggestion: ChangeSuggestion) -> str:
        """Generate comprehensive explanation of a suggestion."""
        parts = []
        
        # Title and description
        parts.append(f"**{suggestion.description}**")
        parts.append(f"\n{suggestion.reasoning}")
        
        # Confidence indicator
        confidence_emoji = "🟢" if suggestion.confidence_score > 0.8 else "🟡" if suggestion.confidence_score > 0.5 else "🔴"
        parts.append(f"\n{confidence_emoji} Confidence: {suggestion.confidence_score:.0%}")
        
        # Changes summary
        if suggestion.changes:
            parts.append(f"\n📊 **Changes ({len(suggestion.changes)} cells):**")
            
            for change in suggestion.changes[:5]:
                change_icon = "🔢" if change.is_formula_change else "📝"
                parts.append(f"\n{change_icon} **{change.cell_id}**: {change.description}")
                
                if change.old_value and change.new_value:
                    parts.append(f"   `{change.old_value}` → `{change.new_value}`")
        
        # Safety warning for low confidence
        if suggestion.confidence_score < 0.5:
            parts.append("\n⚠️ **Note:** This suggestion has low confidence. Please review carefully.")
        
        return "\n".join(parts)
    
    def explain_change_detailed(self, change: CellChange) -> str:
        """Generate detailed explanation of a single change."""
        explanations = {
            ChangeType.FORMULA_EDIT: f"Formula edit in {change.cell_id}: {change.description}",
            ChangeType.DATA_CLEANUP: f"Data cleanup in {change.cell_id}: {change.description}",
            ChangeType.COLUMN_RENAME: f"Column modification: {change.description}",
            ChangeType.FORMATTING: f"Formatting change in {change.cell_id}: {change.description}",
            ChangeType.CALCULATION: f"Calculation in {change.cell_id}: {change.description}",
            ChangeType.CUSTOM: f"Custom change in {change.cell_id}: {change.description}"
        }
        
        base = explanations.get(change.change_type, f"Change in {change.cell_id}")
        
        if change.is_formula_change:
            base += f"\nNew formula: `{change.new_value}`"
        
        return base
