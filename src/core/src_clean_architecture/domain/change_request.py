"""
Domain entities for AI Review & Approve workflow.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum


class ChangeStatus(Enum):
    """Status of a change request."""
    PENDING = "pending"           # AI is analyzing
    SUGGESTED = "suggested"       # AI has suggested changes
    APPROVED = "approved"         # User approved
    REJECTED = "rejected"         # User rejected
    APPLIED = "applied"           # Changes applied to file
    FAILED = "failed"             # Application failed


class ChangeType(Enum):
    """Type of change."""
    FORMULA_EDIT = "formula_edit"
    DATA_CLEANUP = "data_cleanup"
    COLUMN_RENAME = "column_rename"
    FORMATTING = "formatting"
    CALCULATION = "calculation"
    CUSTOM = "custom"


@dataclass
class CellChange:
    """Represents a single cell change."""
    sheet_id: str
    cell_id: str
    old_value: Any
    new_value: Any
    change_type: ChangeType
    description: str
    formula: Optional[str] = None
    
    @property
    def is_formula_change(self) -> bool:
        """Check if this is a formula change."""
        return self.formula is not None or str(self.new_value).startswith('=')


@dataclass
class ChangeSuggestion:
    """AI-generated change suggestion."""
    suggestion_id: str
    description: str
    reasoning: str
    changes: List[CellChange]
    confidence_score: float  # 0.0 to 1.0
    created_at: datetime = field(default_factory=datetime.now)
    
    @property
    def affected_cells_count(self) -> int:
        """Get number of affected cells."""
        return len(self.changes)
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary of suggestion."""
        return {
            'suggestion_id': self.suggestion_id,
            'description': self.description,
            'reasoning': self.reasoning,
            'affected_cells': self.affected_cells_count,
            'confidence': f"{self.confidence_score:.0%}",
            'change_types': list(set(c.change_type.value for c in self.changes))
        }


@dataclass
class ChangeRequest:
    """Complete change request with approval workflow."""
    request_id: str
    file_id: str
    sheet_id: str
    user_prompt: str
    status: ChangeStatus
    suggestions: List[ChangeSuggestion] = field(default_factory=list)
    selected_suggestion_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    approved_at: Optional[datetime] = None
    applied_at: Optional[datetime] = None
    error_message: Optional[str] = None
    applied_changes: List[CellChange] = field(default_factory=list)
    
    def add_suggestion(self, suggestion: ChangeSuggestion):
        """Add a suggestion to the request."""
        self.suggestions.append(suggestion)
        self.updated_at = datetime.now()
        if self.status == ChangeStatus.PENDING:
            self.status = ChangeStatus.SUGGESTED
    
    def approve(self, suggestion_id: str):
        """Approve a specific suggestion."""
        self.selected_suggestion_id = suggestion_id
        self.status = ChangeStatus.APPROVED
        self.approved_at = datetime.now()
        self.updated_at = datetime.now()
    
    def reject(self):
        """Reject all suggestions."""
        self.status = ChangeStatus.REJECTED
        self.updated_at = datetime.now()
    
    def mark_applied(self, changes: List[CellChange]):
        """Mark changes as applied."""
        self.status = ChangeStatus.APPLIED
        self.applied_changes = changes
        self.applied_at = datetime.now()
        self.updated_at = datetime.now()
    
    def mark_failed(self, error: str):
        """Mark request as failed."""
        self.status = ChangeStatus.FAILED
        self.error_message = error
        self.updated_at = datetime.now()
    
    def get_selected_suggestion(self) -> Optional[ChangeSuggestion]:
        """Get the approved/selected suggestion."""
        if not self.selected_suggestion_id:
            return None
        for suggestion in self.suggestions:
            if suggestion.suggestion_id == self.selected_suggestion_id:
                return suggestion
        return None
    
    @property
    def is_pending(self) -> bool:
        return self.status == ChangeStatus.PENDING
    
    @property
    def has_suggestions(self) -> bool:
        return len(self.suggestions) > 0
    
    @property
    def is_approved(self) -> bool:
        return self.status == ChangeStatus.APPROVED
    
    @property
    def is_applied(self) -> bool:
        return self.status == ChangeStatus.APPLIED


class AIChangeReviewerProtocol:
    """Protocol for AI change reviewer."""
    
    async def analyze_file(
        self,
        file_id: str,
        sheet_id: str,
        user_prompt: str,
        file_content: Dict[str, Any]
    ) -> ChangeRequest:
        """Analyze file and create change request with suggestions."""
        ...
    
    async def generate_suggestions(
        self,
        request: ChangeRequest,
        context: Dict[str, Any]
    ) -> List[ChangeSuggestion]:
        """Generate change suggestions for a request."""
        ...
    
    def explain_change(self, change: CellChange) -> str:
        """Generate human-readable explanation of a change."""
        ...


class ChangeApplierProtocol:
    """Protocol for applying changes to files."""
    
    def apply_changes(
        self,
        file_id: str,
        sheet_id: str,
        changes: List[CellChange]
    ) -> bool:
        """Apply changes to file."""
        ...
    
    def preview_changes(
        self,
        file_id: str,
        sheet_id: str,
        changes: List[CellChange]
    ) -> Dict[str, Any]:
        """Preview changes without applying."""
        ...
    
    def can_apply(self, changes: List[CellChange]) -> bool:
        """Check if changes can be applied."""
        ...
