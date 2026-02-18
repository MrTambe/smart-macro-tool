"""
Domain entities and exceptions.
"""

from typing import List, Optional
from . import FileMetadata, DataFrameWrapper, ValidationResult


class ProcessingJob:
    """Represents a data processing job."""
    
    def __init__(
        self,
        job_id: str,
        file_metadata: FileMetadata,
        target_sheet: Optional[str] = None,
        transformations: Optional[List[str]] = None
    ):
        self.job_id = job_id
        self.file_metadata = file_metadata
        self.target_sheet = target_sheet
        self.transformations = transformations or []
        self.results: List[DataFrameWrapper] = []
        self.validation_results: List[ValidationResult] = []
        self.is_complete = False
    
    def add_result(self, result: DataFrameWrapper):
        """Add processing result."""
        self.results.append(result)
    
    def add_validation(self, validation: ValidationResult):
        """Add validation result."""
        self.validation_results.append(validation)
    
    def complete(self):
        """Mark job as complete."""
        self.is_complete = True
    
    def get_validation_summary(self) -> dict:
        """Get validation summary."""
        return {
            'total_validations': len(self.validation_results),
            'passed': sum(1 for v in self.validation_results if v.is_valid),
            'failed': sum(1 for v in self.validation_results if not v.is_valid)
        }


class ProcessingPipeline:
    """Pipeline for chaining multiple operations."""
    
    def __init__(self, name: str):
        self.name = name
        self.steps: List[dict] = []
        self.results: List[DataFrameWrapper] = []
    
    def add_step(self, name: str, operation: str, params: Optional[dict] = None):
        """Add a processing step."""
        self.steps.append({
            'name': name,
            'operation': operation,
            'params': params or {}
        })
        return self
    
    def get_step_count(self) -> int:
        """Get number of steps."""
        return len(self.steps)
