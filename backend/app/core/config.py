from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "NetSecure AI"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = True
    database_url: str = f"sqlite:///{BASE_DIR / 'data' / 'netsecure.db'}"
    allowed_origins: str = (
        "http://localhost:5173,"
        "http://localhost:5174,"
        "http://127.0.0.1:5173,"
        "http://127.0.0.1:5174"
    )
    gemini_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
