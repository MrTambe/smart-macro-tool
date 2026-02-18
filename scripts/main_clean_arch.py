"""
Main entry point for Clean Architecture Excel Processor.

This demonstrates how to wire up all the layers and use the application.
"""

import sys
import os

# Add src_clean_architecture to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src_clean_architecture.domain import ColumnSchema, FileType, ValidationStatus
from src_clean_architecture.application import (
    FileUploadUseCase,
    DataTransformationUseCase,
    DataExportUseCase
)
from src_clean_architecture.infrastructure import (
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


def create_sample_excel(filepath: str):
    """Create a sample Excel file for testing."""
    import pandas as pd
    import numpy as np
    
    # Create sample data
    data = {
        'id': range(1, 101),
        'name': [f'Item_{i}' for i in range(1, 101)],
        'category': np.random.choice(['A', 'B', 'C'], 100),
        'amount': np.random.uniform(10, 1000, 100).round(2),
        'date': pd.date_range('2024-01-01', periods=100, freq='D'),
        'status': np.random.choice(['active', 'inactive', None], 100)
    }
    
    df = pd.DataFrame(data)
    
    # Introduce some nulls for testing
    df.loc[np.random.choice(df.index, 10), 'amount'] = None
    df.loc[np.random.choice(df.index, 5), 'category'] = None
    
    df.to_excel(filepath, index=False)
    print(f"✅ Created sample file: {filepath}")
    print(f"   Rows: {len(df)}, Columns: {len(df.columns)}")
    print(f"   Null values: {df.isnull().sum().sum()}")
    return filepath


def demo_clean_architecture():
    """Demonstrate Clean Architecture workflow."""
    print("\n" + "="*60)
    print("🚀 Clean Architecture Excel Processor Demo")
    print("="*60 + "\n")
    
    # Step 1: Initialize Infrastructure (Outer Layer)
    print("📦 Step 1: Initializing Infrastructure Layer")
    print("-" * 60)
    
    repository = InMemoryRepository()
    parser = PandasExcelParser()
    validator = FileValidator()
    
    print("✅ Repository: InMemoryRepository")
    print("✅ Parser: PandasExcelParser")
    print("✅ Validator: FileValidator")
    
    # Step 2: Initialize Transformers
    print("\n🔧 Step 2: Initializing Transformers")
    print("-" * 60)
    
    transformers = [
        NullValueCleaner(strategy='fill', fill_value=0),
        ColumnRenamer({'name': 'product_name', 'amount': 'price'}),
        TypeConverter({'id': 'int', 'price': 'float', 'date': 'datetime'})
    ]
    
    for t in transformers:
        print(f"✅ {t.get_name()}: {t.get_description()}")
    
    # Step 3: Initialize Use Cases (Application Layer)
    print("\n📋 Step 3: Initializing Use Cases")
    print("-" * 60)
    
    upload_use_case = FileUploadUseCase(validator, parser, repository)
    transform_use_case = DataTransformationUseCase(repository, transformers)
    
    exporters = {
        'excel': ExcelExporter(),
        'csv': CSVExporter(),
        'json': JSONExporter()
    }
    export_use_case = DataExportUseCase(repository, exporters)
    
    print("✅ FileUploadUseCase")
    print("✅ DataTransformationUseCase")
    print("✅ DataExportUseCase")
    
    # Step 4: Create Sample Data
    print("\n📊 Step 4: Creating Sample Data")
    print("-" * 60)
    
    sample_file = "demo_data.xlsx"
    create_sample_excel(sample_file)
    
    # Step 5: Execute File Upload Use Case
    print("\n📤 Step 5: Executing File Upload")
    print("-" * 60)
    
    expected_schema = [
        ColumnSchema(name="id", dtype="int", required=True),
        ColumnSchema(name="name", dtype="str", required=True),
        ColumnSchema(name="category", dtype="str", required=False),
        ColumnSchema(name="amount", dtype="float", required=True),
        ColumnSchema(name="date", dtype="datetime", required=True),
        ColumnSchema(name="status", dtype="str", required=False),
    ]
    
    job = upload_use_case.execute(
        file_path=sample_file,
        filename=sample_file,
        expected_schema=expected_schema
    )
    
    print(f"✅ Job ID: {job.job_id}")
    print(f"✅ Filename: {job.file_metadata.filename}")
    print(f"✅ File Type: {job.file_metadata.file_type.value}")
    print(f"✅ Size: {job.file_metadata.size_mb:.2f} MB")
    print(f"✅ Rows: {job.file_metadata.row_count}")
    print(f"✅ Columns: {job.file_metadata.column_count}")
    
    # Show validation results
    print(f"\n📋 Validation Results:")
    for validation in job.validation_results:
        status_icon = "✅" if validation.is_valid else "❌"
        print(f"   {status_icon} {validation.message}")
    
    # Step 6: Execute Transformation Use Case
    print("\n🔄 Step 6: Executing Transformations")
    print("-" * 60)
    
    result = transform_use_case.execute(
        job_id=job.job_id,
        transformations=[
            'null_cleaner',
            'column_rename',
            'type_converter'
        ]
    )
    
    print(f"✅ Transformations applied successfully!")
    print(f"   Rows: {result.metadata.row_count}")
    print(f"   Columns: {result.metadata.column_count}")
    
    # Step 7: Preview Transformed Data
    print("\n👁️  Step 7: Previewing Transformed Data")
    print("-" * 60)
    
    df = result.data
    print("\nFirst 5 rows:")
    print(df.head())
    
    print("\nData Info:")
    print(df.info())
    
    print("\nNull Values After Cleaning:")
    print(df.isnull().sum())
    
    # Step 8: Export Data
    print("\n📥 Step 8: Exporting Data")
    print("-" * 60)
    
    # Export to Excel
    excel_path = "demo_output.xlsx"
    export_use_case.execute(job.job_id, 'excel', excel_path)
    print(f"✅ Exported to Excel: {excel_path}")
    
    # Export to CSV
    csv_path = "demo_output.csv"
    export_use_case.execute(job.job_id, 'csv', csv_path)
    print(f"✅ Exported to CSV: {csv_path}")
    
    # Export to JSON
    json_path = "demo_output.json"
    export_use_case.execute(job.job_id, 'json', json_path)
    print(f"✅ Exported to JSON: {json_path}")
    
    # Summary
    print("\n" + "="*60)
    print("✨ Demo Complete!")
    print("="*60)
    print("\nArchitecture Layers Demonstrated:")
    print("  ✅ Domain Layer: Entities and business rules")
    print("  ✅ Application Layer: Use case orchestration")
    print("  ✅ Infrastructure Layer: Parsers, transformers, storage")
    print("  ✅ Interface Layer: This CLI demo")
    print("\nKey Benefits:")
    print("  • Business logic independent of frameworks")
    print("  • Easy to test without external dependencies")
    print("  • Easy to swap implementations")
    print("  • Clear separation of concerns")
    
    # Cleanup
    print("\n🧹 Cleaning up temporary files...")
    for f in [sample_file, excel_path, csv_path, json_path]:
        if os.path.exists(f):
            os.remove(f)
    print("✅ Cleanup complete!")


def run_api_server():
    """Run FastAPI server."""
    print("\n🚀 Starting FastAPI Server...")
    print("API will be available at: http://localhost:8000")
    print("\nAvailable endpoints:")
    print("  POST /api/upload - Upload files")
    print("  POST /api/transform - Apply transformations")
    print("  POST /api/export - Export data")
    print("  GET  /api/health - Health check")
    print("\nDocumentation: http://localhost:8000/docs")
    print("-" * 60)
    
    from src_clean_architecture.interface.api import app
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


def run_streamlit():
    """Run Streamlit app."""
    print("\n🚀 Starting Streamlit App...")
    print("App will be available at: http://localhost:8501")
    print("-" * 60)
    
    import subprocess
    subprocess.run([
        "streamlit", "run",
        "src_clean_architecture/interface/streamlit_app.py"
    ])


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Clean Architecture Excel Processor"
    )
    parser.add_argument(
        "mode",
        choices=['demo', 'api', 'streamlit'],
        default='demo',
        help="Run mode: demo (default), api, or streamlit"
    )
    
    args = parser.parse_args()
    
    if args.mode == 'demo':
        demo_clean_architecture()
    elif args.mode == 'api':
        run_api_server()
    elif args.mode == 'streamlit':
        run_streamlit()


if __name__ == "__main__":
    main()
