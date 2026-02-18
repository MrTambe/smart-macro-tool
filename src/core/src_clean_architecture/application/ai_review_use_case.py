"""
Application layer use cases for AI Review & Approve workflow.
"""

import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime

from ..domain.change_request import (
    ChangeRequest,
    ChangeSuggestion,
    CellChange,
    ChangeStatus,
    ChangeType
)
from ..domain.exceptions import DomainError


class AIReviewUseCase:
    """Use case for AI review and approve workflow."""
    
    def __init__(
        self,
        ai_reviewer,
        change_applier,
        file_repository,
        change_repository
    ):
        self.ai_reviewer = ai_reviewer
        self.change_applier = change_applier
        self.file_repository = file_repository
        self.change_repository = change_repository
    
    async def request_changes(
        self,
        file_id: str,
        sheet_id: str,
        user_prompt: str
    ) -> ChangeRequest:
        """
        Request AI to analyze file and suggest changes.
        
        Args:
            file_id: ID of the file to modify
            sheet_id: ID of the sheet to modify
            user_prompt: User's natural language request
            
        Returns:
            ChangeRequest with AI suggestions
        """
        # Create change request
        request_id = str(uuid.uuid4())
        request = ChangeRequest(
            request_id=request_id,
            file_id=file_id,
            sheet_id=sheet_id,
            user_prompt=user_prompt,
            status=ChangeStatus.PENDING
        )
        
        # Save request
        self.change_repository.save(request)
        
        # Get file content for analysis
        file_content = self.file_repository.get_file_content(file_id, sheet_id)
        
        # Have AI analyze and generate suggestions
        try:
            suggestions = await self.ai_reviewer.generate_suggestions(
                request=request,
                context={
                    'file_content': file_content,
                    'user_prompt': user_prompt,
                    'sheet_id': sheet_id
                }
            )
            
            # Add suggestions to request
            for suggestion in suggestions:
                request.add_suggestion(suggestion)
            
            # Update request
            self.change_repository.update(request)
            
        except Exception as e:
            request.mark_failed(str(e))
            self.change_repository.update(request)
            raise DomainError(f"Failed to generate suggestions: {str(e)}")
        
        return request
    
    def approve_suggestion(
        self,
        request_id: str,
        suggestion_id: str
    ) -> ChangeRequest:
        """
        Approve a specific suggestion.
        
        Args:
            request_id: Change request ID
            suggestion_id: Suggestion ID to approve
            
        Returns:
            Updated ChangeRequest
        """
        request = self.change_repository.get(request_id)
        if not request:
            raise DomainError(f"Change request not found: {request_id}")
        
        if request.status != ChangeStatus.SUGGESTED:
            raise DomainError(f"Cannot approve request with status: {request.status.value}")
        
        # Verify suggestion exists
        suggestion = None
        for s in request.suggestions:
            if s.suggestion_id == suggestion_id:
                suggestion = s
                break
        
        if not suggestion:
            raise DomainError(f"Suggestion not found: {suggestion_id}")
        
        # Approve
        request.approve(suggestion_id)
        self.change_repository.update(request)
        
        return request
    
    def reject_request(self, request_id: str) -> ChangeRequest:
        """
        Reject all suggestions in a request.
        
        Args:
            request_id: Change request ID
            
        Returns:
            Updated ChangeRequest
        """
        request = self.change_repository.get(request_id)
        if not request:
            raise DomainError(f"Change request not found: {request_id}")
        
        request.reject()
        self.change_repository.update(request)
        
        return request
    
    async def apply_approved_changes(
        self,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Apply approved changes to file.
        
        Args:
            request_id: Change request ID
            
        Returns:
            Result with file_id and applied changes
        """
        request = self.change_repository.get(request_id)
        if not request:
            raise DomainError(f"Change request not found: {request_id}")
        
        if request.status != ChangeStatus.APPROVED:
            raise DomainError(f"Cannot apply changes. Status: {request.status.value}")
        
        suggestion = request.get_selected_suggestion()
        if not suggestion:
            raise DomainError("No suggestion selected for application")
        
        try:
            # Check if changes can be applied
            if not self.change_applier.can_apply(suggestion.changes):
                raise DomainError("Changes cannot be applied to file")
            
            # Get preview of changes
            preview = self.change_applier.preview_changes(
                request.file_id,
                request.sheet_id,
                suggestion.changes
            )
            
            # Apply changes
            success = self.change_applier.apply_changes(
                request.file_id,
                request.sheet_id,
                suggestion.changes
            )
            
            if not success:
                raise DomainError("Failed to apply changes")
            
            # Mark as applied
            request.mark_applied(suggestion.changes)
            self.change_repository.update(request)
            
            # Mark file as modified
            self.file_repository.mark_modified(request.file_id)
            
            return {
                'success': True,
                'request_id': request_id,
                'file_id': request.file_id,
                'sheet_id': request.sheet_id,
                'changes_applied': len(suggestion.changes),
                'preview': preview,
                'message': 'Changes applied successfully'
            }
            
        except Exception as e:
            request.mark_failed(str(e))
            self.change_repository.update(request)
            raise DomainError(f"Failed to apply changes: {str(e)}")
    
    def preview_changes(
        self,
        request_id: str,
        suggestion_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Preview changes without applying.
        
        Args:
            request_id: Change request ID
            suggestion_id: Optional specific suggestion (uses selected if None)
            
        Returns:
            Preview of changes
        """
        request = self.change_repository.get(request_id)
        if not request:
            raise DomainError(f"Change request not found: {request_id}")
        
        # Get suggestion to preview
        if suggestion_id:
            suggestion = None
            for s in request.suggestions:
                if s.suggestion_id == suggestion_id:
                    suggestion = s
                    break
        else:
            suggestion = request.get_selected_suggestion()
        
        if not suggestion:
            raise DomainError("No suggestion found to preview")
        
        # Generate preview
        preview = self.change_applier.preview_changes(
            request.file_id,
            request.sheet_id,
            suggestion.changes
        )
        
        return {
            'request_id': request_id,
            'suggestion_id': suggestion.suggestion_id,
            'changes': [
                {
                    'cell_id': c.cell_id,
                    'old_value': str(c.old_value)[:50] if c.old_value else None,
                    'new_value': str(c.new_value)[:50] if c.new_value else None,
                    'change_type': c.change_type.value,
                    'description': c.description,
                    'is_formula': c.is_formula_change
                }
                for c in suggestion.changes
            ],
            'summary': suggestion.get_summary(),
            'preview_data': preview
        }
    
    def get_request_status(self, request_id: str) -> Dict[str, Any]:
        """Get status of a change request."""
        request = self.change_repository.get(request_id)
        if not request:
            raise DomainError(f"Change request not found: {request_id}")
        
        return {
            'request_id': request.request_id,
            'status': request.status.value,
            'user_prompt': request.user_prompt,
            'suggestions_count': len(request.suggestions),
            'selected_suggestion': request.selected_suggestion_id,
            'created_at': request.created_at.isoformat(),
            'updated_at': request.updated_at.isoformat(),
            'approved_at': request.approved_at.isoformat() if request.approved_at else None,
            'applied_at': request.applied_at.isoformat() if request.applied_at else None,
            'error': request.error_message
        }
    
    def list_pending_requests(self, file_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List pending change requests."""
        requests = self.change_repository.list_all()
        
        # Filter by status and file
        filtered = []
        for req in requests:
            if req.status in [ChangeStatus.PENDING, ChangeStatus.SUGGESTED]:
                if file_id is None or req.file_id == file_id:
                    filtered.append(self.get_request_status(req.request_id))
        
        return filtered


class ChangeRepository:
    """Repository for storing change requests."""
    
    def __init__(self):
        self._storage: Dict[str, ChangeRequest] = {}
    
    def save(self, request: ChangeRequest):
        """Save a change request."""
        self._storage[request.request_id] = request
    
    def get(self, request_id: str) -> Optional[ChangeRequest]:
        """Get a change request by ID."""
        return self._storage.get(request_id)
    
    def update(self, request: ChangeRequest):
        """Update a change request."""
        self._storage[request.request_id] = request
    
    def delete(self, request_id: str) -> bool:
        """Delete a change request."""
        if request_id in self._storage:
            del self._storage[request_id]
            return True
        return False
    
    def list_all(self) -> List[ChangeRequest]:
        """List all change requests."""
        return list(self._storage.values())
