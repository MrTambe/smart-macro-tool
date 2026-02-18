"""
Interface Layer: FastAPI REST API.
This layer handles HTTP requests and responses.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import tempfile
import os
import shutil

# Import from clean architecture
from ..domain import ColumnSchema, ValidationStatus
from ..application import (
    FileUploadUseCase,
    DataTransformationUseCase,
    DataExportUseCase,
    JobManagementUseCase
)
from ..infrastructure import (
    PandasExcelParser,
    FileValidator,
    InMemoryRepository,
    NullValueCleaner,
    ColumnRenamer,
    TypeConverter,
    ExcelExporter,
    CSVExporter,
    JSONExporter
)


# Pydantic models for API
class UploadResponse(BaseModel):
    job_id: str
    filename: str
    status: str
    message: str
    rows: int
    columns: int


class TransformRequest(BaseModel):
    job_id: str
    transformations: List[str]
    params: Optional[Dict[str, Any]] = None


class TransformResponse(BaseModel):
    job_id: str
    status: str
    transformations_applied: List[str]
    rows: int
    columns: int


class ExportRequest(BaseModel):
    job_id: str
    format: str  # 'excel', 'csv', 'json'
    filename: Optional[str] = None


class JobSummary(BaseModel):
    job_id: str
    filename: str
    status: str
    validations: dict
    results_count: int


# Create FastAPI app
app = FastAPI(
    title="Smart Macro Tool API",
    description="Clean Architecture Excel Processing API",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize dependencies (in production, use dependency injection)
repository = InMemoryRepository()
file_parser = PandasExcelParser()
file_validator = FileValidator()

# Transformers registry
transformers = [
    NullValueCleaner(strategy='drop'),
    NullValueCleaner(strategy='fill', fill_value=0),
    ColumnRenamer({}),
    TypeConverter({})
]

# Exporters registry
exporters = {
    'excel': ExcelExporter(),
    'csv': CSVExporter(),
    'json': JSONExporter()
}

# Initialize use cases
upload_use_case = FileUploadUseCase(file_validator, file_parser, repository)
transform_use_case = DataTransformationUseCase(repository, transformers)
export_use_case = DataExportUseCase(repository, exporters)


@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload and validate an Excel/CSV file.
    
    - **file**: Excel (.xlsx, .xls) or CSV file
    
    Returns job ID and validation results.
    """
    try:
        # Save uploaded file temporarily
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, file.filename)
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Execute use case
        job = upload_use_case.execute(temp_path, file.filename)
        
        # Cleanup temp file
        shutil.rmtree(temp_dir)
        
        # Get result
        first_validation = job.validation_results[0] if job.validation_results else None
        
        return UploadResponse(
            job_id=job.job_id,
            filename=job.file_metadata.filename,
            status="valid" if first_validation and first_validation.is_valid else "invalid",
            message=first_validation.message if first_validation else "No validation performed",
            rows=job.file_metadata.row_count,
            columns=job.file_metadata.column_count
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/transform", response_model=TransformResponse)
async def transform_data(request: TransformRequest):
    """
    Apply transformations to uploaded data.
    
    - **job_id**: Job ID from upload
    - **transformations**: List of transformation names
    - **params**: Optional parameters
    
    Available transformations:
    - `null_cleaner`: Remove null values
    - `column_rename`: Rename columns
    - `type_converter`: Convert column types
    """
    try:
        result = transform_use_case.execute(
            request.job_id,
            request.transformations,
            request.params
        )
        
        return TransformResponse(
            job_id=request.job_id,
            status="success",
            transformations_applied=request.transformations,
            rows=result.metadata.row_count,
            columns=result.metadata.column_count
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export")
async def export_data(request: ExportRequest):
    """
    Export processed data to file.
    
    - **job_id**: Job ID
    - **format**: 'excel', 'csv', or 'json'
    - **filename**: Optional custom filename
    """
    try:
        # Create temp output path
        temp_dir = tempfile.mkdtemp()
        filename = request.filename or f"export_{request.job_id}"
        
        # Set extension
        ext_map = {'excel': '.xlsx', 'csv': '.csv', 'json': '.json'}
        ext = ext_map.get(request.format, '.xlsx')
        output_path = os.path.join(temp_dir, f"{filename}{ext}")
        
        # Execute export
        export_use_case.execute(request.job_id, request.format, output_path)
        
        # Return file
        return FileResponse(
            output_path,
            media_type='application/octet-stream',
            filename=f"{filename}{ext}"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/jobs/{job_id}", response_model=JobSummary)
async def get_job_status(job_id: str):
    """Get job status and summary."""
    try:
        summary = JobManagementUseCase(repository).get_job_summary(job_id)
        return JobSummary(**summary)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/api/transformers")
async def list_transformers():
    """List available transformers."""
    return [
        {
            "name": t.get_name(),
            "description": t.get_description()
        }
        for t in transformers
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
