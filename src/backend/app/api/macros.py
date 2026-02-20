from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.services.macro_engine import MacroEngine


router = APIRouter()
macro_engine = MacroEngine()


class MacroStep(BaseModel):
    id: str
    type: str
    action: str
    payload: Optional[Dict[str, Any]] = None
    delay: Optional[int] = 0


class MacroCreate(BaseModel):
    name: str
    description: str
    steps: List[MacroStep]


class MacroUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[MacroStep]] = None


@router.get("/list")
async def list_macros():
    """List all saved macros"""
    try:
        macros = await macro_engine.list_macros()
        return {"macros": macros}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_macro(macro: MacroCreate):
    """Create a new macro"""
    try:
        result = await macro_engine.create_macro(macro.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{macro_id}")
async def get_macro(macro_id: str):
    """Get a specific macro"""
    try:
        macro = await macro_engine.get_macro(macro_id)
        if not macro:
            raise HTTPException(status_code=404, detail="Macro not found")
        return macro
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{macro_id}")
async def update_macro(macro_id: str, updates: MacroUpdate):
    """Update a macro"""
    try:
        result = await macro_engine.update_macro(macro_id, updates.dict(exclude_unset=True))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{macro_id}")
async def delete_macro(macro_id: str):
    """Delete a macro"""
    try:
        result = await macro_engine.delete_macro(macro_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{macro_id}/run")
async def run_macro(macro_id: str):
    """Run a macro"""
    try:
        result = await macro_engine.run_macro(macro_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/record/start")
async def start_recording():
    """Start recording a macro"""
    try:
        result = await macro_engine.start_recording()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/record/stop")
async def stop_recording():
    """Stop recording a macro"""
    try:
        result = await macro_engine.stop_recording()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/record/step")
async def add_step(step: MacroStep):
    """Add a step to the current recording"""
    try:
        result = await macro_engine.add_step(step.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/record/status")
async def get_recording_status():
    """Get current recording status"""
    try:
        status = await macro_engine.get_recording_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
