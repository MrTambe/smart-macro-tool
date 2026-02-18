# Clean Architecture Excel Processor

A scalable, modular application for uploading, parsing, and processing Excel/CSV files using Clean Architecture principles.

## 🏗️ Architecture Overview

This application follows **Clean Architecture** (also known as Ports & Adapters, Hexagonal Architecture), which separates concerns into distinct layers:

```
┌─────────────────────────────────────────────────────────┐
│                    Interface Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Streamlit   │  │   FastAPI    │  │     CLI      │  │
│  │     UI       │  │     API      │  │  Interface   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                  Application Layer                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Use Cases:                                       │  │
│  │  • FileUploadUseCase                              │  │
│  │  • DataTransformationUseCase                      │  │
│  │  • DataExportUseCase                              │  │
│  │  • JobManagementUseCase                           │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    Domain Layer                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Entities:                                        │  │
│  │  • FileMetadata                                   │  │
│  │  • DataFrameWrapper                               │  │
│  │  • ValidationResult                               │  │
│  │  • ColumnSchema                                   │  │
│  │                                                   │  │
│  │  Interfaces (Protocols):                          │  │
│  │  • FileParserProtocol                             │  │
│  │  • DataTransformerProtocol                        │  │
│  │  • ValidatorProtocol                              │  │
│  │  • RepositoryProtocol                             │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                     │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Pandas    │  │  In-Memory   │  │  File-based  │   │
│  │  Parser    │  │  Repository  │  │  Repository  │   │
│  └────────────┘  └──────────────┘  └──────────────┘   │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Null      │  │  Column      │  │   Type       │   │
│  │  Cleaner   │  │  Renamer     │  │  Converter   │   │
│  └────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 📦 Layer Responsibilities

### 1. Domain Layer (Innermost)
- **Contains**: Business entities, value objects, domain logic
- **Dependencies**: None (pure Python)
- **Key Components**:
  - `FileMetadata`: File information (name, type, size, sheets)
  - `DataFrameWrapper`: Data container with metadata
  - `ValidationResult`: Validation outcome
  - `ColumnSchema`: Column definition and constraints
  - Protocols: Define interfaces for outer layers

### 2. Application Layer
- **Contains**: Use cases, business logic orchestration
- **Dependencies**: Only Domain layer
- **Key Components**:
  - `FileUploadUseCase`: Upload and validate files
  - `DataTransformationUseCase`: Apply transformations
  - `DataExportUseCase`: Export to various formats
  - `JobManagementUseCase`: Manage processing jobs

### 3. Infrastructure Layer
- **Contains**: External implementations (parsers, storage)
- **Dependencies**: Domain layer (implements protocols)
- **Key Components**:
  - `PandasExcelParser`: Parse Excel/CSV using pandas
  - `FileValidator`: Validate file format and integrity
  - `InMemoryRepository`: Temporary storage
  - Transformers: `NullValueCleaner`, `ColumnRenamer`, `TypeConverter`
  - Exporters: `ExcelExporter`, `CSVExporter`, `JSONExporter`

### 4. Interface Layer (Outermost)
- **Contains**: UI, API, CLI implementations
- **Dependencies**: Application layer
- **Key Components**:
  - `api.py`: FastAPI REST API
  - `streamlit_app.py`: Streamlit web interface

## 🔄 Data Flow

### File Upload Flow

```
1. User uploads file (UI/API)
   ↓
2. Interface Layer receives file
   ↓
3. Application Layer (FileUploadUseCase)
   ├─ Validates file (FileValidator)
   ├─ Parses file (PandasExcelParser)
   ├─ Validates schema (if provided)
   └─ Saves to repository
   ↓
4. Returns job ID and validation results
```

### Transformation Flow

```
1. User requests transformation with job ID
   ↓
2. Application Layer (DataTransformationUseCase)
   ├─ Loads data from repository
   ├─ Applies transformations in sequence
   │   ├─ NullValueCleaner
   │   ├─ ColumnRenamer
   │   └─ TypeConverter
   └─ Saves transformed data
   ↓
3. Returns transformation summary
```

### Export Flow

```
1. User requests export (format: excel/csv/json)
   ↓
2. Application Layer (DataExportUseCase)
   ├─ Loads data from repository
   ├─ Selects appropriate exporter
   └─ Generates file
   ↓
3. Interface Layer sends file to user
```

## 🚀 Quick Start

### Option 1: FastAPI + Streamlit (Full Stack)

```bash
# Terminal 1: Start Backend
cd src_clean_architecture
python -m interface.api

# Terminal 2: Start Streamlit UI
streamlit run src_clean_architecture/interface/streamlit_app.py
```

### Option 2: Programmatic Usage

```python
from src_clean_architecture.domain import ColumnSchema
from src_clean_architecture.application import FileUploadUseCase
from src_clean_architecture.infrastructure import (
    PandasExcelParser,
    FileValidator,
    InMemoryRepository,
    NullValueCleaner
)

# Initialize dependencies
repository = InMemoryRepository()
parser = PandasExcelParser()
validator = FileValidator()

# Create use case
upload_use_case = FileUploadUseCase(validator, parser, repository)

# Execute
job = upload_use_case.execute(
    file_path="data.xlsx",
    filename="data.xlsx",
    expected_schema=[
        ColumnSchema(name="id", dtype="int", required=True),
        ColumnSchema(name="name", dtype="str", required=True),
        ColumnSchema(name="amount", dtype="float", required=True)
    ]
)

print(f"Job ID: {job.job_id}")
print(f"Validation: {job.validation_results[0].message}")
```

## 📋 Features

### File Validation
- ✅ Extension checking (.xlsx, .xls, .csv)
- ✅ File size limits
- ✅ Corruption detection
- ✅ Schema validation
- ✅ Type checking

### Data Transformations
- 🧹 **NullValueCleaner**: Remove or fill null values
- 📝 **ColumnRenamer**: Rename columns
- 🔄 **TypeConverter**: Convert data types
- 📊 **CustomTransformers**: Easy to add new ones

### Export Formats
- 📗 Excel (.xlsx)
- 📄 CSV
- 📋 JSON

## 🧪 Testing

```python
# Test domain logic without external dependencies
from src_clean_architecture.domain import FileMetadata, FileType

metadata = FileMetadata(
    filename="test.xlsx",
    file_type=FileType.XLSX,
    size_bytes=1024,
    row_count=100,
    column_count=5
)

assert metadata.size_mb == 0.001
```

## 🏛️ Architecture Benefits

### 1. **Testability**
- Domain logic tested without databases, UI, or external services
- Mock implementations for testing

### 2. **Framework Independence**
- Domain doesn't know about pandas, FastAPI, or Streamlit
- Easy to swap implementations

### 3. **Maintainability**
- Changes in outer layers don't affect inner layers
- Clear separation of concerns

### 4. **Scalability**
- Easy to add new transformers
- Easy to add new export formats
- Easy to add new UI implementations

## 📝 Example: Adding a Custom Transformer

```python
# 1. Implement the protocol in Infrastructure layer
from src_clean_architecture.domain import DataFrameWrapper

class CustomTransformer:
    def get_name(self) -> str:
        return "custom_transform"
    
    def get_description(self) -> str:
        return "Apply custom business logic"
    
    def transform(self, data: DataFrameWrapper) -> DataFrameWrapper:
        df = data.data
        # Your transformation logic here
        df['new_column'] = df['existing'] * 2
        data.data = df
        return data

# 2. Register in application
from src_clean_architecture.application import DataTransformationUseCase

transformers = [
    NullValueCleaner(),
    CustomTransformer()  # Add here
]

transform_use_case = DataTransformationUseCase(repository, transformers)
```

## 📊 Project Structure

```
src_clean_architecture/
├── domain/                    # Business logic (no dependencies)
│   ├── __init__.py           # Entities, protocols, enums
│   ├── entities.py           # Additional entities
│   └── exceptions.py         # Domain exceptions
│
├── application/              # Use cases
│   ├── __init__.py
│   └── use_cases.py          # Business logic orchestration
│
├── infrastructure/           # External implementations
│   ├── __init__.py
│   └── parsers.py            # Pandas, validators, transformers
│
└── interface/                # UI/API layer
    ├── __init__.py
    ├── api.py                # FastAPI REST API
    └── streamlit_app.py      # Streamlit web interface
```

## 🔧 Configuration

Create a `.env` file:

```
# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# File Upload
MAX_FILE_SIZE_MB=100
UPLOAD_DIR=./uploads

# Storage
STORAGE_TYPE=memory  # memory, file, database
```

## 🎯 Next Steps

1. **Add Database Storage**: Implement `DatabaseRepository`
2. **Add Authentication**: JWT tokens in Interface layer
3. **Add More Transformers**: Aggregations, filters, joins
4. **Add Async Processing**: Celery for background jobs
5. **Add Caching**: Redis for frequently accessed data

## 📚 References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Streamlit Documentation](https://docs.streamlit.io/)

---

**Version**: 2.0.0 | **License**: MIT
