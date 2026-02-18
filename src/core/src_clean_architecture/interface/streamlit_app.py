"""
Streamlit Frontend for Clean Architecture Excel Processor.
This provides a web UI without needing a separate React build.
"""

import streamlit as st
import pandas as pd
import requests
from typing import Optional
import json

# Configure Streamlit
st.set_page_config(
    page_title="Smart Macro Tool - Clean Architecture",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API Configuration
API_BASE_URL = "http://localhost:8000"

# Session state initialization
if 'current_job_id' not in st.session_state:
    st.session_state.current_job_id = None
if 'uploaded_data' not in st.session_state:
    st.session_state.uploaded_data = None
if 'transformed_data' not in st.session_state:
    st.session_state.transformed_data = None


def upload_file_to_api(file) -> Optional[dict]:
    """Upload file to backend API."""
    try:
        files = {"file": (file.name, file.getvalue(), file.type)}
        response = requests.post(f"{API_BASE_URL}/api/upload", files=files)
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Upload failed: {response.text}")
            return None
    except Exception as e:
        st.error(f"Error uploading file: {str(e)}")
        return None


def transform_data_api(job_id: str, transformations: list) -> Optional[dict]:
    """Apply transformations via API."""
    try:
        payload = {
            "job_id": job_id,
            "transformations": transformations
        }
        response = requests.post(f"{API_BASE_URL}/api/transform", json=payload)
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Transformation failed: {response.text}")
            return None
    except Exception as e:
        st.error(f"Error transforming data: {str(e)}")
        return None


def export_data_api(job_id: str, format: str):
    """Export data via API."""
    try:
        payload = {
            "job_id": job_id,
            "format": format,
            "filename": f"export_{job_id}"
        }
        response = requests.post(f"{API_BASE_URL}/api/export", json=payload)
        
        if response.status_code == 200:
            return response.content
        else:
            st.error(f"Export failed: {response.text}")
            return None
    except Exception as e:
        st.error(f"Error exporting data: {str(e)}")
        return None


# Sidebar Navigation
st.sidebar.title("📊 Smart Macro Tool")
st.sidebar.markdown("---")
st.sidebar.markdown("**Clean Architecture Edition**")

page = st.sidebar.radio(
    "Navigation",
    ["🏠 Home", "📤 Upload & Validate", "🔧 Transform", "📥 Export", "ℹ️ About"]
)

# Home Page
if page == "🏠 Home":
    st.title("Welcome to Smart Macro Tool")
    st.markdown("---")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Files Processed", "0")
    with col2:
        st.metric("Active Jobs", "0")
    with col3:
        st.metric("Transformations", "3+")
    
    st.markdown("---")
    st.markdown("""
    ### Features
    
    This application demonstrates **Clean Architecture** principles:
    
    ✅ **File Upload & Validation**
    - Support for .xlsx, .xls, and .csv files
    - Automatic validation and schema checking
    - Corrupt file detection
    
    ✅ **Data Transformation**
    - Clean null values
    - Rename columns
    - Convert data types
    
    ✅ **Export Options**
    - Excel (.xlsx)
    - CSV
    - JSON
    
    ### Architecture Layers
    
    1. **Domain**: Core business entities and rules
    2. **Application**: Use cases and business logic
    3. **Infrastructure**: External implementations (parsers, storage)
    4. **Interface**: UI/API layer
    
    ### Getting Started
    
    1. Navigate to **📤 Upload & Validate** to upload your file
    2. Go to **🔧 Transform** to apply transformations
    3. Use **📥 Export** to download the processed file
    """)

# Upload Page
elif page == "📤 Upload & Validate":
    st.title("📤 Upload & Validate Files")
    st.markdown("---")
    
    uploaded_file = st.file_uploader(
        "Choose an Excel or CSV file",
        type=['xlsx', 'xls', 'csv'],
        help="Supported formats: Excel (.xlsx, .xls) and CSV"
    )
    
    if uploaded_file is not None:
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.info(f"**File:** {uploaded_file.name}")
            st.info(f"**Size:** {uploaded_file.size / 1024:.2f} KB")
        
        with col2:
            if st.button("🚀 Upload & Validate", type="primary"):
                with st.spinner("Uploading and validating..."):
                    result = upload_file_to_api(uploaded_file)
                    
                    if result:
                        st.session_state.current_job_id = result['job_id']
                        st.session_state.uploaded_data = result
                        
                        st.success(f"✅ Upload successful!")
                        st.json(result)
        
        # Preview
        st.markdown("---")
        st.subheader("📋 File Preview")
        
        try:
            if uploaded_file.name.endswith('.csv'):
                df = pd.read_csv(uploaded_file)
            else:
                df = pd.read_excel(uploaded_file)
            
            st.dataframe(df.head(100), use_container_width=True)
            
            # Statistics
            st.markdown("---")
            st.subheader("📊 Data Statistics")
            
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Rows", len(df))
            col2.metric("Columns", len(df.columns))
            col3.metric("Null Values", df.isnull().sum().sum())
            col4.metric("Memory", f"{df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
            
        except Exception as e:
            st.error(f"Error reading file: {str(e)}")

# Transform Page
elif page == "🔧 Transform":
    st.title("🔧 Data Transformation")
    st.markdown("---")
    
    if not st.session_state.current_job_id:
        st.warning("⚠️ Please upload a file first in the Upload & Validate section.")
    else:
        st.info(f"**Current Job ID:** {st.session_state.current_job_id}")
        
        st.markdown("---")
        st.subheader("Available Transformations")
        
        # Transformation options
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Null Value Cleaning**")
            null_strategy = st.selectbox(
                "Strategy",
                ["drop", "fill", "interpolate"],
                help="Choose how to handle null values"
            )
            
            if null_strategy == "fill":
                fill_value = st.text_input("Fill Value", "0")
        
        with col2:
            st.markdown("**Column Operations**")
            rename_cols = st.checkbox("Rename Columns")
            convert_types = st.checkbox("Convert Data Types")
        
        st.markdown("---")
        
        if st.button("✨ Apply Transformations", type="primary"):
            with st.spinner("Applying transformations..."):
                transformations = ["null_cleaner"]
                
                if rename_cols:
                    transformations.append("column_rename")
                if convert_types:
                    transformations.append("type_converter")
                
                result = transform_data_api(
                    st.session_state.current_job_id,
                    transformations
                )
                
                if result:
                    st.session_state.transformed_data = result
                    st.success("✅ Transformations applied successfully!")
                    st.json(result)

# Export Page
elif page == "📥 Export":
    st.title("📥 Export Processed Data")
    st.markdown("---")
    
    if not st.session_state.current_job_id:
        st.warning("⚠️ Please upload and process a file first.")
    else:
        st.info(f"**Current Job ID:** {st.session_state.current_job_id}")
        
        st.markdown("---")
        st.subheader("Export Options")
        
        export_format = st.selectbox(
            "Select Export Format",
            ["excel", "csv", "json"],
            format_func=lambda x: x.upper()
        )
        
        custom_filename = st.text_input(
            "Custom Filename (optional)",
            placeholder="my_processed_data"
        )
        
        if st.button("📥 Download File", type="primary"):
            with st.spinner("Preparing download..."):
                content = export_data_api(
                    st.session_state.current_job_id,
                    export_format
                )
                
                if content:
                    # Determine file extension
                    ext_map = {"excel": "xlsx", "csv": "csv", "json": "json"}
                    ext = ext_map[export_format]
                    
                    filename = custom_filename or f"export_{st.session_state.current_job_id}"
                    
                    st.download_button(
                        label="⬇️ Click to Download",
                        data=content,
                        file_name=f"{filename}.{ext}",
                        mime="application/octet-stream"
                    )

# About Page
elif page == "ℹ️ About":
    st.title("ℹ️ About Smart Macro Tool")
    st.markdown("---")
    
    st.markdown("""
    ### Clean Architecture Implementation
    
    This application demonstrates proper **Clean Architecture** principles:
    
    #### Architecture Layers
    
    ```
    ┌─────────────────────────────────────┐
    │      Interface Layer (UI/API)       │
    │  - FastAPI REST API                 │
    │  - Streamlit Web Interface          │
    ├─────────────────────────────────────┤
    │     Application Layer (Use Cases)   │
    │  - File Upload Use Case             │
    │  - Transformation Use Case          │
    │  - Export Use Case                  │
    ├─────────────────────────────────────┤
    │       Domain Layer (Entities)       │
    │  - FileMetadata                     │
    │  - DataFrameWrapper                 │
    │  - ValidationResult                 │
    ├─────────────────────────────────────┤
    │   Infrastructure Layer (External)   │
    │  - PandasExcelParser                │
    │  - FileValidator                    │
    │  - InMemoryRepository               │
    └─────────────────────────────────────┘
    ```
    
    #### Key Principles
    
    1. **Dependency Inversion**: Inner layers define interfaces, outer layers implement them
    2. **Separation of Concerns**: Each layer has a single responsibility
    3. **Testability**: Business logic can be tested without external dependencies
    4. **Framework Independence**: Domain logic doesn't depend on frameworks
    
    #### Technologies
    
    - **Backend**: Python, FastAPI, Pandas, OpenPyXL
    - **Frontend**: Streamlit (this UI)
    - **Architecture**: Clean Architecture / Ports & Adapters
    
    #### Version
    
    **v2.0.0** - Clean Architecture Edition
    """)

# Footer
st.sidebar.markdown("---")
st.sidebar.markdown("**v2.0.0** | Clean Architecture")
st.sidebar.markdown("Built with ❤️ using Streamlit")
