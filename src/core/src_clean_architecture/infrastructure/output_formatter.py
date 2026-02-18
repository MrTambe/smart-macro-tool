"""
Enhanced output formatting and visualization for AI suggestions.
"""

import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime

from ..domain.change_request import ChangeSuggestion, CellChange, ChangeType


@dataclass
class FormattedOutput:
    """Structured formatted output for AI suggestions."""
    markdown: str
    html: str
    json_data: Dict[str, Any]
    summary: str
    action_items: List[str]


class AIOutputFormatter:
    """
    Formats AI suggestions into multiple output formats.
    """
    
    def __init__(self):
        self.templates = {
            'header': "## 🤖 AI Analysis Results\n\n",
            'confidence_high': "🟢 **High Confidence** (>80%)\n\n",
            'confidence_medium': "🟡 **Medium Confidence** (50-80%)\n\n",
            'confidence_low': "🔴 **Low Confidence** (<50%)\n\n",
        }
    
    def format_suggestion_set(
        self,
        suggestions: List[ChangeSuggestion],
        reasoning: str,
        include_code_blocks: bool = True
    ) -> FormattedOutput:
        """
        Format a complete set of suggestions.
        
        Returns:
            FormattedOutput with multiple formats
        """
        # Generate markdown
        markdown = self._generate_markdown(suggestions, reasoning)
        
        # Generate HTML
        html = self._generate_html(suggestions, reasoning)
        
        # Generate JSON
        json_data = self._generate_json(suggestions, reasoning)
        
        # Generate summary
        summary = self._generate_summary(suggestions)
        
        # Generate action items
        action_items = self._generate_action_items(suggestions)
        
        return FormattedOutput(
            markdown=markdown,
            html=html,
            json_data=json_data,
            summary=summary,
            action_items=action_items
        )
    
    def _generate_markdown(
        self,
        suggestions: List[ChangeSuggestion],
        reasoning: str
    ) -> str:
        """Generate rich markdown output."""
        lines = [self.templates['header']]
        
        # Overall reasoning
        if reasoning:
            lines.append(f"### 📋 Analysis Approach\n\n{reasoning}\n\n")
            lines.append("---\n\n")
        
        # Group by confidence
        high_conf = [s for s in suggestions if s.confidence_score > 0.8]
        med_conf = [s for s in suggestions if 0.5 < s.confidence_score <= 0.8]
        low_conf = [s for s in suggestions if s.confidence_score <= 0.5]
        
        # High confidence suggestions
        if high_conf:
            lines.append(self.templates['confidence_high'])
            for i, sugg in enumerate(high_conf, 1):
                lines.append(self._format_suggestion_markdown(sugg, i))
        
        # Medium confidence
        if med_conf:
            lines.append("\n" + self.templates['confidence_medium'])
            for i, sugg in enumerate(med_conf, 1):
                lines.append(self._format_suggestion_markdown(sugg, i))
        
        # Low confidence
        if low_conf:
            lines.append("\n" + self.templates['confidence_low'])
            for i, sugg in enumerate(low_conf, 1):
                lines.append(self._format_suggestion_markdown(sugg, i))
        
        # Statistics
        lines.append("\n---\n\n")
        lines.append(self._generate_statistics_markdown(suggestions))
        
        return "\n".join(lines)
    
    def _format_suggestion_markdown(
        self,
        suggestion: ChangeSuggestion,
        index: int
    ) -> str:
        """Format single suggestion as markdown."""
        lines = []
        
        # Header with confidence badge
        confidence_pct = f"{suggestion.confidence_score:.0%}"
        lines.append(f"#### {index}. {suggestion.description} `({confidence_pct})`\n")
        
        # Reasoning
        lines.append(f"**Why:** {suggestion.reasoning}\n")
        
        # Changes table
        if suggestion.changes:
            lines.append("\n**Changes:**\n")
            lines.append("| Cell | Type | Before | After |")
            lines.append("|------|------|--------|-------|")
            
            for change in suggestion.changes[:5]:  # Limit to 5 for preview
                cell = change.cell_id
                type_icon = "🔢" if change.is_formula_change else "📝"
                before = str(change.old_value)[:30] if change.old_value else "(empty)"
                after = str(change.new_value)[:30] if change.new_value else "(empty)"
                
                lines.append(f"| {cell} | {type_icon} | `{before}` | `{after}` |")
            
            if len(suggestion.changes) > 5:
                lines.append(f"| ... | | | *+{len(suggestion.changes) - 5} more* |")
            
            lines.append("")
        
        # Action buttons hint
        lines.append("\n💡 *Click 'Preview' to see full details or 'Approve' to apply*\n")
        
        return "\n".join(lines)
    
    def _generate_html(
        self,
        suggestions: List[ChangeSuggestion],
        reasoning: str
    ) -> str:
        """Generate HTML output for web display."""
        html_parts = []
        
        html_parts.append("<div class='ai-suggestions-container'>")
        
        # Header
        html_parts.append("<h2>🤖 AI Analysis Results</h2>")
        
        # Reasoning
        if reasoning:
            html_parts.append(f"<div class='analysis-reasoning'><p>{reasoning}</p></div>")
        
        # Suggestions
        html_parts.append("<div class='suggestions-list'>")
        
        for i, sugg in enumerate(suggestions, 1):
            confidence_class = (
                'high-confidence' if sugg.confidence_score > 0.8
                else 'medium-confidence' if sugg.confidence_score > 0.5
                else 'low-confidence'
            )
            
            html_parts.append(f"""
            <div class='suggestion-card {confidence_class}' data-id='{sugg.suggestion_id}'>
                <div class='suggestion-header'>
                    <span class='suggestion-number'>{i}</span>
                    <h3 class='suggestion-title'>{suggestion.description}</h3>
                    <span class='confidence-badge'>{suggestion.confidence_score:.0%}</span>
                </div>
                <div class='suggestion-body'>
                    <p class='suggestion-reasoning'>{suggestion.reasoning}</p>
                    <div class='changes-preview'>
                        <h4>Changes ({len(suggestion.changes)} cells):</h4>
                        <table class='changes-table'>
                            <thead>
                                <tr>
                                    <th>Cell</th>
                                    <th>Type</th>
                                    <th>Before</th>
                                    <th>After</th>
                                </tr>
                            </thead>
                            <tbody>
            """)
            
            for change in suggestion.changes[:5]:
                change_type_icon = "🔢" if change.is_formula_change else "📝"
                html_parts.append(f"""
                                <tr>
                                    <td class='cell-id'>{change.cell_id}</td>
                                    <td class='change-type'>{change_type_icon}</td>
                                    <td class='old-value'><code>{change.old_value or '(empty)'}</code></td>
                                    <td class='new-value'><code>{change.new_value or '(empty)'}</code></td>
                                </tr>
                """)
            
            html_parts.append("""
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            """)
        
        html_parts.append("</div></div>")
        
        return "\n".join(html_parts)
    
    def _generate_json(
        self,
        suggestions: List[ChangeSuggestion],
        reasoning: str
    ) -> Dict[str, Any]:
        """Generate structured JSON output."""
        return {
            'analysis': {
                'timestamp': datetime.now().isoformat(),
                'total_suggestions': len(suggestions),
                'reasoning': reasoning,
                'statistics': {
                    'high_confidence': len([s for s in suggestions if s.confidence_score > 0.8]),
                    'medium_confidence': len([s for s in suggestions if 0.5 < s.confidence_score <= 0.8]),
                    'low_confidence': len([s for s in suggestions if s.confidence_score <= 0.5]),
                    'total_changes': sum(len(s.changes) for s in suggestions),
                    'formula_changes': sum(
                        1 for s in suggestions 
                        for c in s.changes if c.is_formula_change
                    )
                }
            },
            'suggestions': [
                {
                    'id': s.suggestion_id,
                    'title': s.description,
                    'description': s.reasoning,
                    'confidence': s.confidence_score,
                    'confidence_label': (
                        'high' if s.confidence_score > 0.8
                        else 'medium' if s.confidence_score > 0.5
                        else 'low'
                    ),
                    'impact': self._calculate_impact_level(s),
                    'changes_count': len(s.changes),
                    'changes': [
                        {
                            'cell_id': c.cell_id,
                            'type': c.change_type.value,
                            'is_formula': c.is_formula_change,
                            'old_value': c.old_value,
                            'new_value': c.new_value,
                            'description': c.description
                        }
                        for c in s.changes
                    ]
                }
                for s in suggestions
            ]
        }
    
    def _generate_summary(self, suggestions: List[ChangeSuggestion]) -> str:
        """Generate brief text summary."""
        if not suggestions:
            return "No suggestions generated."
        
        total_changes = sum(len(s.changes) for s in suggestions)
        high_conf = len([s for s in suggestions if s.confidence_score > 0.8])
        
        summary = f"AI generated {len(suggestions)} suggestions affecting {total_changes} cells. "
        summary += f"{high_conf} high-confidence suggestion{'s' if high_conf != 1 else ''}. "
        
        if high_conf > 0:
            summary += "Ready for review and approval."
        else:
            summary += "Please review carefully before applying."
        
        return summary
    
    def _generate_action_items(self, suggestions: List[ChangeSuggestion]) -> List[str]:
        """Generate actionable items."""
        items = []
        
        high_conf = [s for s in suggestions if s.confidence_score > 0.8]
        med_conf = [s for s in suggestions if 0.5 < s.confidence_score <= 0.8]
        low_conf = [s for s in suggestions if s.confidence_score <= 0.5]
        
        if high_conf:
            items.append(f"✅ Review and approve {len(high_conf)} high-confidence suggestion(s)")
        
        if med_conf:
            items.append(f"🟡 Carefully review {len(med_conf)} medium-confidence suggestion(s)")
        
        if low_conf:
            items.append(f"🔴 Consider rejecting {len(low_conf)} low-confidence suggestion(s)")
        
        items.append("💡 Preview changes before applying")
        
        return items
    
    def _generate_statistics_markdown(
        self,
        suggestions: List[ChangeSuggestion]
    ) -> str:
        """Generate statistics section."""
        lines = ["### 📊 Statistics\n"]
        
        total = len(suggestions)
        total_changes = sum(len(s.changes) for s in suggestions)
        formula_count = sum(
            1 for s in suggestions 
            for c in s.changes if c.is_formula_change
        )
        
        lines.append(f"- **Total Suggestions:** {total}")
        lines.append(f"- **Total Cells Affected:** {total_changes}")
        lines.append(f"- **Formula Changes:** {formula_count}")
        
        # Confidence breakdown
        high = len([s for s in suggestions if s.confidence_score > 0.8])
        med = len([s for s in suggestions if 0.5 < s.confidence_score <= 0.8])
        low = len([s for s in suggestions if s.confidence_score <= 0.5])
        
        lines.append(f"\n**Confidence Breakdown:**")
        lines.append(f"- 🟢 High (>80%): {high}")
        lines.append(f"- 🟡 Medium (50-80%): {med}")
        lines.append(f"- 🔴 Low (<50%): {low}")
        
        return "\n".join(lines)
    
    def _calculate_impact_level(self, suggestion: ChangeSuggestion) -> str:
        """Calculate impact level."""
        num_changes = len(suggestion.changes)
        has_formulas = any(c.is_formula_change for c in suggestion.changes)
        
        if num_changes > 10 or has_formulas:
            return "high"
        elif num_changes > 3:
            return "medium"
        else:
            return "low"
    
    def format_comparison_table(
        self,
        changes: List[CellChange],
        max_rows: int = 20
    ) -> str:
        """Format changes as a comparison table."""
        lines = ["| Cell | Current | Proposed | Type |", "|------|---------|----------|------|"]
        
        for change in changes[:max_rows]:
            cell = change.cell_id
            current = str(change.old_value)[:25] if change.old_value else "∅"
            proposed = str(change.new_value)[:25] if change.new_value else "∅"
            type_icon = "🔢" if change.is_formula_change else "✏️"
            
            lines.append(f"| {cell} | `{current}` | `{proposed}` | {type_icon} |")
        
        if len(changes) > max_rows:
            lines.append(f"| ... | | | *{len(changes) - max_rows} more* |")
        
        return "\n".join(lines)


class StreamingOutputHandler:
    """
    Handles streaming output for real-time AI responses.
    """
    
    def __init__(self):
        self.buffer = []
        self.current_suggestion = None
    
    def on_token(self, token: str):
        """Process streaming token."""
        self.buffer.append(token)
        
        # Check if we have a complete JSON object
        content = "".join(self.buffer)
        if self._is_complete_json(content):
            return self._parse_partial(content)
        
        return None
    
    def _is_complete_json(self, content: str) -> bool:
        """Check if buffer contains complete JSON."""
        try:
            json.loads(content)
            return True
        except json.JSONDecodeError:
            return False
    
    def _parse_partial(self, content: str) -> Optional[Dict]:
        """Parse partial content."""
        try:
            return json.loads(content)
        except:
            return None
    
    def format_stream_chunk(self, chunk: str) -> str:
        """Format a streaming chunk for display."""
        # Could add markdown formatting, progress indicators, etc.
        return chunk


class OutputExporter:
    """
    Export AI suggestions to various formats.
    """
    
    def to_pdf(self, formatted_output: FormattedOutput, filename: str):
        """Export to PDF (would require additional library)."""
        pass  # Placeholder
    
    def to_excel(
        self,
        suggestions: List[ChangeSuggestion],
        filename: str
    ):
        """Export suggestions to Excel for tracking."""
        import pandas as pd
        
        data = []
        for sugg in suggestions:
            for change in sugg.changes:
                data.append({
                    'Suggestion ID': sugg.suggestion_id,
                    'Suggestion Title': sugg.description,
                    'Confidence': f"{sugg.confidence_score:.0%}",
                    'Cell': change.cell_id,
                    'Change Type': change.change_type.value,
                    'Old Value': change.old_value,
                    'New Value': change.new_value,
                    'Description': change.description
                })
        
        df = pd.DataFrame(data)
        df.to_excel(filename, index=False, sheet_name='AI Suggestions')
    
    def to_json_file(
        self,
        formatted_output: FormattedOutput,
        filename: str
    ):
        """Export to JSON file."""
        with open(filename, 'w') as f:
            json.dump(formatted_output.json_data, f, indent=2, default=str)
