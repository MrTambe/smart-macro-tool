"""
Application Layer: Use cases and business logic.
This layer orchestrates domain objects to perform specific tasks.
It depends only on the Domain layer.
"""

from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from ..domain import (
    DataFrameWrapper, 
    FileMetadata, 
    FileType,
    ValidationResult,
    ValidationStatus,
    ColumnSchema
)
from ..domain.entities import ProcessingJob, ProcessingPipeline
from ..domain.exceptions import (
    FileValidationError,
    ParsingError,
    JobNotFoundError
)


class FileUploadUseCase:
    """Use case for uploading and validating files."""
    
    def __init__(
        self,
        file_validator,
        file_parser,
        repository
    ):
        self.file_validator = file_validator
        self.file_parser = file_parser
        self.repository = repository
    
    def execute(
        self, 
        file_path: str, 
        filename: str,
        expected_schema: Optional[List[ColumnSchema]] = None
    ) -> ProcessingJob:
        """
        Execute file upload and validation.
        
        Args:
            file_path: Path to uploaded file
            filename: Original filename
            expected_schema: Optional expected column schema
            
        Returns:
            ProcessingJob with validation results
        """
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Validate file
        validation_result = self.file_validator.validate_file(file_path, filename)
        
        # Create file metadata
        metadata = FileMetadata(
            filename=filename,
            file_type=self._get_file_type(filename),
            size_bytes=self._get_file_size(file_path),
            sheet_names=self.file_parser.get_sheet_names(file_path)
        )
        
        # Create job
        job = ProcessingJob(job_id=job_id, file_metadata=metadata)
        job.add_validation(validation_result)
        
        # If valid, parse file
        if validation_result.is_valid:
            try:
                data = self.file_parser.parse(file_path)
                job.add_result(data)
                
                # Validate schema if provided
                if expected_schema:
                    schema_validation = self._validate_schema(data, expected_schema)
                    job.add_validation(schema_validation)
                
                # Save to repository
                self.repository.save(data, job_id)
                
            except Exception as e:
                job.add_validation(ValidationResult(
                    status=ValidationStatus.INVALID,
                    message=f"Parsing failed: {str(e)}",
                    details={'error': str(e)}
                ))
        
        job.complete()
        return job
    
    def _get_file_type(self, filename: str) -> FileType:
        """Determine file type from extension."""
        ext = filename.lower().split('.')[-1]
        return FileType(ext)
    
    def _get_file_size(self, file_path: str) -> int:
        """Get file size in bytes."""
        import os
        return os.path.getsize(file_path)
    
    def _validate_schema(
        self, 
        data: DataFrameWrapper, 
        expected_schema: List[ColumnSchema]
    ) -> ValidationResult:
        """Validate data against schema."""
        import pandas as pd
        
        df = data.data
        errors = []
        
        for col_schema in expected_schema:
            if col_schema.name not in df.columns:
                if col_schema.required:
                    errors.append(f"Missing required column: {col_schema.name}")
                continue
            
            # Type validation
            actual_type = df[col_schema.name].dtype
            # ... type checking logic
        
        if errors:
            return ValidationResult(
                status=ValidationStatus.INVALID,
                message="Schema validation failed",
                details={'errors': errors}
            )
        
        return ValidationResult(
            status=ValidationStatus.VALID,
            message="Schema validation passed"
        )


class DataTransformationUseCase:
    """Use case for transforming data."""
    
    def __init__(self, repository, transformers: List[Any]):
        self.repository = repository
        self.transformers = {t.get_name(): t for t in transformers}
    
    def execute(
        self, 
        job_id: str, 
        transformations: List[str],
        params: Optional[Dict[str, Any]] = None
    ) -> DataFrameWrapper:
        """
        Apply transformations to data.
        
        Args:
            job_id: Job ID to load data
            transformations: List of transformation names
            params: Optional parameters for transformations
            
        Returns:
            Transformed DataFrameWrapper
        """
        # Load data
        data = self.repository.load(job_id)
        if not data:
            raise JobNotFoundError(job_id)
        
        # Apply transformations in order
        for transform_name in transformations:
            if transform_name not in self.transformers:
                raise ValueError(f"Unknown transformer: {transform_name}")
            
            transformer = self.transformers[transform_name]
            data = transformer.transform(data)
        
        # Save transformed data
        self.repository.save(data, f"{job_id}_transformed")
        
        return data


class DataExportUseCase:
    """Use case for exporting data."""
    
    def __init__(self, repository, exporters: Dict[str, Any]):
        self.repository = repository
        self.exporters = exporters
    
    def execute(
        self, 
        job_id: str, 
        format: str,
        output_path: str,
        sheet_name: Optional[str] = None
    ) -> str:
        """
        Export data to specified format.
        
        Args:
            job_id: Job ID
            format: Export format (excel, csv, json)
            output_path: Output file path
            sheet_name: Optional sheet name for Excel
            
        Returns:
            Path to exported file
        """
        # Load data
        data = self.repository.load(job_id)
        if not data:
            raise JobNotFoundError(job_id)
        
        # Export
        if format not in self.exporters:
            raise ValueError(f"Unknown export format: {format}")
        
        exporter = self.exporters[format]
        exporter.export(data, output_path, sheet_name)
        
        return output_path


class JobManagementUseCase:
    """Use case for managing processing jobs."""
    
    def __init__(self, job_repository):
        self.job_repository = job_repository
    
    def get_job(self, job_id: str) -> Optional[ProcessingJob]:
        """Get job by ID."""
        return self.job_repository.load(job_id)
    
    def list_jobs(self) -> List[ProcessingJob]:
        """List all jobs."""
        return self.job_repository.list_all()
    
    def delete_job(self, job_id: str) -> bool:
        """Delete job."""
        return self.job_repository.delete(job_id)
    
    def get_job_summary(self, job_id: str) -> Dict[str, Any]:
        """Get job summary statistics."""
        job = self.get_job(job_id)
        if not job:
            raise JobNotFoundError(job_id)
        
        return {
            'job_id': job.job_id,
            'filename': job.file_metadata.filename,
            'status': 'complete' if job.is_complete else 'processing',
            'validations': job.get_validation_summary(),
            'results_count': len(job.results),
            'transformations': job.transformations
        }
