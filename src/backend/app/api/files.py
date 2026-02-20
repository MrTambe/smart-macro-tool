from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
import os
import shutil
from pathlib import Path

from app.core.config import settings
from app.services.file_processor import FileProcessor


router = APIRouter()
file_processor = FileProcessor()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file for processing"""
    try:
        # Validate file size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")

        # Create upload directory if it doesn't exist
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Save file
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "success": True,
            "filename": file.filename,
            "path": str(file_path),
            "size": file_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-document")
async def process_document(file: UploadFile = File(...)):
    """Process a document file (DOCX, PDF)"""
    try:
        content = await file.read()
        result = await file_processor.process_document(content, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-spreadsheet")
async def process_spreadsheet(file: UploadFile = File(...)):
    """Process a spreadsheet file (XLSX, CSV)"""
    try:
        content = await file.read()
        result = await file_processor.process_spreadsheet(content, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export")
async def export_file(data: dict):
    """Export data to a file"""
    try:
        file_type = data.get("type")
        filename = data.get("filename", "export")
        content = data.get("content")

        if file_type == "xlsx":
            result = await file_processor.export_to_excel(content, filename)
        elif file_type == "csv":
            result = await file_processor.export_to_csv(content, filename)
        elif file_type == "docx":
            result = await file_processor.export_to_docx(content, filename)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_files(directory: Optional[str] = None):
    """List files in a directory"""
    try:
        if directory is None:
            directory = os.path.expanduser("~")

        files = []
        for item in os.listdir(directory):
            item_path = os.path.join(directory, item)
            files.append({
                "name": item,
                "path": item_path,
                "is_directory": os.path.isdir(item_path),
                "is_file": os.path.isfile(item_path),
                "size": os.path.getsize(item_path) if os.path.isfile(item_path) else None,
                "modified": os.path.getmtime(item_path)
            })

        return {"files": files, "directory": directory}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{filename}")
async def delete_file(filename: str):
    """Delete a file"""
    try:
        file_path = Path(settings.UPLOAD_DIR) / filename
        if file_path.exists():
            file_path.unlink()
            return {"success": True, "message": f"File {filename} deleted"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
