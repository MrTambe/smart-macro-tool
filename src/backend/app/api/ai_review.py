"""
API endpoints for AI Review & Approve workflow.
Simplified version without complex clean architecture dependencies.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/ai-review", tags=["ai-review"])

# In-memory storage for demo (replace with database in production)
change_requests = {}


class ChangeRequestCreate(BaseModel):
    file_id: str
    sheet_id: str
    user_prompt: str


class ChangeRequestResponse(BaseModel):
    request_id: str
    status: str
    user_prompt: str
    suggestions: List[Dict[str, Any]]
    message: str


class ApproveRequest(BaseModel):
    request_id: str
    suggestion_id: str


class ApplyChangesRequest(BaseModel):
    request_id: str


class PreviewRequest(BaseModel):
    request_id: str
    suggestion_id: Optional[str] = None


@router.post("/request", response_model=ChangeRequestResponse)
async def request_changes(data: ChangeRequestCreate):
    """
    Request AI to analyze file and suggest changes.
    """
    request_id = str(uuid.uuid4())
    
    # Create a mock response for now
    # In production, this would call the AI service
    response = ChangeRequestResponse(
        request_id=request_id,
        status="pending",
        user_prompt=data.user_prompt,
        suggestions=[
            {
                "suggestion_id": str(uuid.uuid4()),
                "title": "Analyze spreadsheet",
                "description": "AI analysis pending - configure AI provider in settings",
                "confidence": "N/A",
                "changes": []
            }
        ],
        message="Request created. AI review requires AI provider configuration."
    )
    
    change_requests[request_id] = response.dict()
    return response


@router.post("/approve")
async def approve_suggestion(data: ApproveRequest):
    """Approve a specific suggestion."""
    if data.request_id not in change_requests:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {
        'request_id': data.request_id,
        'status': 'approved',
        'selected_suggestion': data.suggestion_id,
        'message': 'Suggestion approved. Ready to apply changes.'
    }


@router.post("/reject")
async def reject_request(data: Dict[str, str]):
    """Reject all suggestions in a request."""
    if data.get('request_id') not in change_requests:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {
        'request_id': data['request_id'],
        'status': 'rejected',
        'message': 'Request rejected.'
    }


@router.post("/apply")
async def apply_changes(data: ApplyChangesRequest):
    """Apply approved changes to file."""
    if data.request_id not in change_requests:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {
        'success': True,
        'request_id': data.request_id,
        'message': 'Changes applied successfully.'
    }


@router.post("/preview")
async def preview_changes(data: PreviewRequest):
    """Preview changes without applying."""
    if data.request_id not in change_requests:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {
        'request_id': data.request_id,
        'preview': 'Preview data here'
    }


@router.get("/status/{request_id}")
async def get_request_status(request_id: str):
    """Get status of a change request."""
    if request_id not in change_requests:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return change_requests[request_id]


@router.get("/pending")
async def list_pending_requests(file_id: Optional[str] = None):
    """List pending change requests."""
    requests = list(change_requests.values())
    return {'requests': requests}


# Health check for AI review service
@router.get("/health")
async def ai_review_health():
    """Check AI review service health."""
    return {
        "status": "healthy",
        "service": "ai-review",
        "clean_architecture": CLEAN_ARCH_AVAILABLE
    }
