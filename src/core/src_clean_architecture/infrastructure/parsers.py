"""
Infrastructure Layer: External implementations.
This layer provides concrete implementations for domain interfaces.
"""

from typing import List, Optional
import pandas as pd
import openpyxl
from pathlib import Path

from ..domain import (
    DataFrameWrapper,
    FileMetadata,
    FileType,
    ValidationResult,
    ValidationStatus,
    ColumnSchema
)
from ..domain.exceptions import ParsingError, FileValidationError


class PandasExcelParser:
    """Excel parser using pandas and openpyxl."""
    
    SUPPORTED_EXTENSIONS = {'.xlsx', '.xls', '.csv'}
    
    def can_parse(self, file_path: str) -> bool:
        """Check if file can be parsed."""
        path = Path(file_path)
        return path.suffix.lower() in self.SUPPORTED_EXTENSIONS
    
    def parse(
        self, 
        file_path: str, 
        sheet_name: Optional[str] = None
    ) -> DataFrameWrapper:
        """
        Parse Excel/CSV file into DataFrame.
        
        Args:
            file_path: Path to file
            sheet_name: Sheet name (for Excel files)
            
        Returns:
            DataFrameWrapper with data and metadata
        """
        try:
            path = Path(file_path)
            
            if path.suffix.lower() == '.csv':
                df = pd.read_csv(file_path)
                sheet_names = ['Sheet1']
            else:
                # Excel file
                if sheet_name:
                    df = pd.read_excel(file_path, sheet_name=sheet_name, engine='openpyxl')
                else:
                    df = pd.read_excel(file_path, engine='openpyxl')
                
                # Get sheet names
                xl = pd.ExcelFile(file_path)
                sheet_names = xl.sheet_names
            
            # Create metadata
            metadata = FileMetadata(
                filename=path.name,
                file_type=FileType(path.suffix.lower().replace('.', '')),
                size_bytes=path.stat().st_size,
                sheet_names=sheet_names,
                row_count=len(df),
                column_count=len(df.columns)
            )
            
            return DataFrameWrapper(
                data=df,
                metadata=metadata
            )
            
        except Exception as e:
            raise ParsingError(
                message=f"Failed to parse file: {str(e)}",
                file_path=file_path,
                original_error=e
            )
    
    def get_sheet_names(self, file_path: str) -> List[str]:
        """Get available sheet names."""
        try:
            path = Path(file_path)
            
            if path.suffix.lower() == '.csv':
                return ['Sheet1']
            
            xl = pd.ExcelFile(file_path)
            return xl.sheet_names
            
        except Exception:
            return []


class FileValidator:
    """File validation implementation."""
    
    MAX_FILE_SIZE_MB = 100
    ALLOWED_EXTENSIONS = {'.xlsx', '.xls', '.csv'}
    
    def validate_file(self, file_path: str, filename: str) -> ValidationResult:
        """
        Validate file before processing.
        
        Args:
            file_path: Path to file
            filename: Original filename
            
        Returns:
            ValidationResult
        """
        path = Path(file_path)
        errors = []
        warnings = []
        
        # Check if file exists
        if not path.exists():
            return ValidationResult(
                status=ValidationStatus.INVALID,
                message="File does not exist",
                details={'file_path': file_path}
            )
        
        # Check extension
        ext = path.suffix.lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            errors.append(f"Invalid file extension: {ext}")
        
        # Check file size
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > self.MAX_FILE_SIZE_MB:
            errors.append(f"File too large: {size_mb:.2f}MB (max {self.MAX_FILE_SIZE_MB}MB)")
        
        # Check if file is corrupted (basic check)
        try:
            if ext == '.csv':
                pd.read_csv(file_path, nrows=1)
            else:
                pd.read_excel(file_path, nrows=1)
        except Exception as e:
            errors.append(f"File appears to be corrupted: {str(e)}")
        
        # Return result
        if errors:
            return ValidationResult(
                status=ValidationStatus.INVALID,
                message="File validation failed",
                details={'errors': errors}
            )
        
        if warnings:
            return ValidationResult(
                status=ValidationStatus.WARNING,
                message="File validation passed with warnings",
                details={'warnings': warnings}
            )
        
        return ValidationResult(
            status=ValidationStatus.VALID,
            message="File validation passed",
            details={'size_mb': round(size_mb, 2)}
        )


class NullValueCleaner:
    """Transformer: Clean null values from data."""
    
    def __init__(self, strategy: str = 'drop', fill_value=None):
        """
        Initialize cleaner.
        
        Args:
            strategy: 'drop', 'fill', or 'interpolate'
            fill_value: Value to use for filling (if strategy='fill')
        """
        self.strategy = strategy
        self.fill_value = fill_value
    
    def get_name(self) -> str:
        return "null_cleaner"
    
    def get_description(self) -> str:
        return f"Clean null values using {self.strategy} strategy"
    
    def transform(self, data: DataFrameWrapper) -> DataFrameWrapper:
        """Apply transformation."""
        df = data.data.copy()
        
        if self.strategy == 'drop':
            df = df.dropna()
        elif self.strategy == 'fill':
            df = df.fillna(self.fill_value)
        elif self.strategy == 'interpolate':
            df = df.interpolate()
        
        # Update metadata
        data.data = df
        data.metadata.row_count = len(df)
        
        return data


class ColumnRenamer:
    """Transformer: Rename columns."""
    
    def __init__(self, column_map: dict):
        """
        Initialize renamer.
        
        Args:
            column_map: Dictionary mapping old names to new names
        """
        self.column_map = column_map
    
    def get_name(self) -> str:
        return "column_rename"
    
    def get_description(self) -> str:
        return f"Rename {len(self.column_map)} columns"
    
    def transform(self, data: DataFrameWrapper) -> DataFrameWrapper:
        """Apply transformation."""
        df = data.data.rename(columns=self.column_map)
        data.data = df
        return data


class TypeConverter:
    """Transformer: Convert column types."""
    
    def __init__(self, type_map: dict):
        """
        Initialize converter.
        
        Args:
            type_map: Dictionary mapping column names to types
        """
        self.type_map = type_map
    
    def get_name(self) -> str:
        return "type_converter"
    
    def get_description(self) -> str:
        return f"Convert types for {len(self.type_map)} columns"
    
    def transform(self, data: DataFrameWrapper) -> DataFrameWrapper:
        """Apply transformation."""
        df = data.data.copy()
        
        for column, dtype in self.type_map.items():
            if column in df.columns:
                try:
                    if dtype == 'datetime':
                        df[column] = pd.to_datetime(df[column])
                    elif dtype == 'category':
                        df[column] = df[column].astype('category')
                    else:
                        df[column] = df[column].astype(dtype)
                except Exception as e:
                    print(f"Warning: Could not convert {column} to {dtype}: {e}")
        
        data.data = df
        return data


class InMemoryRepository:
    """In-memory storage repository."""
    
    def __init__(self):
        self._storage: dict = {}
    
    def save(self, data: DataFrameWrapper, key: str) -> bool:
        """Save data to repository."""
        self._storage[key] = data
        return True
    
    def load(self, key: str) -> Optional[DataFrameWrapper]:
        """Load data from repository."""
        return self._storage.get(key)
    
    def delete(self, key: str) -> bool:
        """Delete data from repository."""
        if key in self._storage:
            del self._storage[key]
            return True
        return False
    
    def list_keys(self) -> List[str]:
        """List all stored keys."""
        return list(self._storage.keys())
    
    def clear(self):
        """Clear all data."""
        self._storage.clear()


class ExcelExporter:
    """Export data to Excel format."""
    
    def export(
        self, 
        data: DataFrameWrapper, 
        output_path: str,
        sheet_name: Optional[str] = None
    ):
        """Export to Excel."""
        df = data.data
        sheet = sheet_name or 'Sheet1'
        
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet, index=False)


class CSVExporter:
    """Export data to CSV format."""
    
    def export(
        self, 
        data: DataFrameWrapper, 
        output_path: str,
        sheet_name: Optional[str] = None
    ):
        """Export to CSV."""
        df = data.data
        df.to_csv(output_path, index=False)


class JSONExporter:
    """Export data to JSON format."""
    
    def export(
        self, 
        data: DataFrameWrapper, 
        output_path: str,
        sheet_name: Optional[str] = None
    ):
        """Export to JSON."""
        df = data.data
        df.to_json(output_path, orient='records', indent=2)
