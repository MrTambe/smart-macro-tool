from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import asyncio

from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

class ChatRequest(BaseModel):
    message: str
    context: Optional[List[dict]] = None
    current_file: Optional[dict] = None

class ChatResponse(BaseModel):
    message: str
    actions: Optional[List[dict]] = None
    status: str = "completed"

class ActionRequest(BaseModel):
    id: str
    type: str
    description: str
    payload: Optional[Dict[str, Any]] = None

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a chat message with AI"""
    try:
        response = await ai_service.chat(
            message=request.message,
            context=request.context,
            current_file=request.current_file
        )
        return ChatResponse(**response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute")
async def execute_action(request: ActionRequest):
    """Execute an AI action"""
    try:
        result = await ai_service.execute_action(request.dict())
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream")
async def stream_chat(request: ChatRequest):
    """Stream AI responses"""
    async def generate():
        try:
            async for chunk in ai_service.stream_chat(
                message=request.message,
                context=request.context
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )

@router.post("/analyze")
async def analyze_data(data: dict):
    """Analyze data using AI"""
    try:
        result = await ai_service.analyze_data(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def generate_content(request: dict):
    """Generate content using AI"""
    try:
        result = await ai_service.generate_content(
            prompt=request.get("prompt"),
            type=request.get("type", "text"),
            context=request.get("context")
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_models():
    """List available AI models"""
    try:
        models = await ai_service.list_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/format")
async def format_content(request: dict):
    """Format content using AI"""
    try:
        result = await ai_service.format_content(
            content=request.get("content"),
            format_type=request.get("format_type", "improve")
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
