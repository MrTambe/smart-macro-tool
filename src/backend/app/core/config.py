from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Smart Macro Tool"
    VERSION: str = "1.0.0"

    # CORS
    BACKEND_CORS_ORIGINS: list = ["*"]

    # AI Settings
    AI_PROVIDER: str = "ollama"  # "ollama", "openai", "anthropic"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama2"

    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-3.5-turbo"

    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-instant-1"

    # File Processing
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    UPLOAD_DIR: str = "./uploads"
    TEMP_DIR: str = "./temp"

    # Macro Settings
    MACRO_RECORDING_ENABLED: bool = True
    MAX_MACRO_STEPS: int = 1000

    # WebSocket
    WS_PING_INTERVAL: int = 20
    WS_PING_TIMEOUT: int = 20

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
