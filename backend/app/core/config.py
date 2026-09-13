import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Life RPG Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Database: Defaults to local SQLite if DATABASE_URL is not set or points to localhost postgres that is unavailable
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./liferpg.db")
    
    # Supabase & Auth
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", None)
    SUPABASE_ANON_KEY: Optional[str] = os.getenv("SUPABASE_ANON_KEY", None)
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY", None)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-life-rpg-jwt-key-for-local-dev-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # AI - Google Gemini
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
