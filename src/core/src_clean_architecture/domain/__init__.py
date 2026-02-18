"""
Domain Layer: Core business entities and rules.
This layer has NO external dependencies.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Protocol
from datetime import datetime
from enum import Enum


class FileType(Enum):
    """Supported file types."""
    XLSX = "xlsx"
    XLS = "xls"
    CSV = "csv"


class ValidationStatus(Enum):
    """Validation result status."""
    VALID = "valid"
    INVALID = "invalid"
    WARNING = "warning"


@dataclass(frozen=True)
class ColumnSchema:
    """Schema definition for a column."""
    name: str
    dtype: str  # 'int', 'float', 'str', 'datetime', 'bool'
    required: bool = True
    nullable: bool = False
    min_value: Optional[Any] = None
    max_value: Optional[Any] = None
    allowed_values: Optional[List[Any]] = None
    regex_pattern: Optional[str] = None
    
    def __post_init__(self):
        """Validate schema definition."""
        valid_dtypes = {'int', 'float', 'str', 'datetime', 'bool', 'category'}
        if self.dtype not in valid_dtypes:
            raise ValueError(f"Invalid dtype: {self.dtype}. Must be one of {valid_dtypes}")


@dataclass
class FileMetadata:
    """Metadata about an uploaded file."""
    filename: str
    file_type: FileType
    size_bytes: int
    upload_timestamp: datetime = field(default_factory=datetime.now)
    sheet_names: List[str] = field(default_factory=list)
    row_count: int = 0
    column_count: int = 0
    checksum: Optional[str] = None
    
    @property
    def size_mb(self) -> float:
        """Return file size in MB."""
        return self.size_bytes / (1024 * 1024)


@dataclass
class ValidationResult:
    """Result of data validation."""
    status: ValidationStatus
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    
    @property
    def is_valid(self) -> bool:
        return self.status == ValidationStatus.VALID


@dataclass
class DataFrameWrapper:
    """Wrapper for pandas DataFrame with metadata."""
    data: Any  # pd.DataFrame - use Any to avoid pandas dependency in domain
    metadata: FileMetadata
    schema: Optional[List[ColumnSchema]] = None
    validation_results: List[ValidationResult] = field(default_factory=list)
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary statistics."""
        return {
            'filename': self.metadata.filename,
            'rows': self.metadata.row_count,
            'columns': self.metadata.column_count,
            'sheets': len(self.metadata.sheet_names),
            'memory_mb': round(self.data.memory_usage(deep=True).sum() / (1024**2), 2)
        }


class FileParserProtocol(Protocol):
    """Protocol for file parsers."""
    
    def can_parse(self, file_path: str) -> bool:
        """Check if parser can handle this file."""
        ...
    
    def parse(self, file_path: str, sheet_name: Optional[str] = None) -> DataFrameWrapper:
        """Parse file into DataFrameWrapper."""
        ...
    
    def get_sheet_names(self, file_path: str) -> List[str]:
        """Get available sheet names."""
        ...


class DataTransformerProtocol(Protocol):
    """Protocol for data transformers."""
    
    def transform(self, data: DataFrameWrapper) -> DataFrameWrapper:
        """Transform data according to business rules."""
        ...
    
    def get_name(self) -> str:
        """Get transformer name."""
        ...
    
    def get_description(self) -> str:
        """Get transformer description."""
        ...


class ValidatorProtocol(Protocol):
    """Protocol for validators."""
    
    def validate(self, data: DataFrameWrapper) -> ValidationResult:
        """Validate data against rules."""
        ...
    
    def get_schema(self) -> List[ColumnSchema]:
        """Get expected schema."""
        ...


class RepositoryProtocol(Protocol):
    """Protocol for data repositories."""
    
    def save(self, data: DataFrameWrapper, key: str) -> bool:
        """Save data to repository."""
        ...
    
    def load(self, key: str) -> Optional[DataFrameWrapper]:
        """Load data from repository."""
        ...
    
    def delete(self, key: str) -> bool:
        """Delete data from repository."""
        ...
    
    def list_keys(self) -> List[str]:
        """List all stored keys."""
        ...
