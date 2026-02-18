"""
Domain exceptions.
"""


class DomainError(Exception):
    """Base domain exception."""
    pass


class FileValidationError(DomainError):
    """Raised when file validation fails."""
    
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.details = details or {}


class SchemaValidationError(DomainError):
    """Raised when schema validation fails."""
    
    def __init__(self, message: str, missing_columns: list = None, invalid_types: dict = None):
        super().__init__(message)
        self.missing_columns = missing_columns or []
        self.invalid_types = invalid_types or {}


class ParsingError(DomainError):
    """Raised when file parsing fails."""
    
    def __init__(self, message: str, file_path: str = None, original_error: Exception = None):
        super().__init__(message)
        self.file_path = file_path
        self.original_error = original_error


class TransformationError(DomainError):
    """Raised when data transformation fails."""
    
    def __init__(self, message: str, transformer_name: str = None):
        super().__init__(message)
        self.transformer_name = transformer_name


class StorageError(DomainError):
    """Raised when storage operation fails."""
    pass


class JobNotFoundError(DomainError):
    """Raised when job is not found."""
    
    def __init__(self, job_id: str):
        super().__init__(f"Job not found: {job_id}")
        self.job_id = job_id
