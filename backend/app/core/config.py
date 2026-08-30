import os
import tempfile
from functools import lru_cache
from pathlib import Path

from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


BASE_DIR = Path(__file__).resolve().parents[2]


def get_data_dir() -> Path:
    """Return the writable data directory (uses temp directory on Vercel/serverless environments)."""
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        tmp_dir = Path(tempfile.gettempdir()) / "netsecure_data"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        return tmp_dir
    local_dir = BASE_DIR / "data"
    local_dir.mkdir(parents=True, exist_ok=True)
    return local_dir


def _get_default_database_url() -> str:
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        db_path = (Path(tempfile.gettempdir()) / "netsecure.db").resolve().as_posix()
        return f"sqlite:///{db_path}"
    return f"sqlite:///{BASE_DIR / 'data' / 'netsecure.db'}"


class Settings(BaseSettings):
    app_name: str = "NetSecure AI"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = True
    database_url: str = _get_default_database_url()
    allowed_origins: str = (
        "http://localhost:5173,"
        "http://localhost:5174,"
        "http://127.0.0.1:5173,"
        "http://127.0.0.1:5174"
    )
    gemini_api_key: str | None = None

    @field_validator("database_url", mode="before")
    @classmethod
    def validate_and_normalize_database_url(cls, v: Any) -> str:
        if v is None:
            return _get_default_database_url()
        if isinstance(v, str):
            val = v.strip()
            if not val:
                return _get_default_database_url()
            # Normalize legacy postgres:// to postgresql://
            if val.startswith("postgres://"):
                val = "postgresql://" + val[len("postgres://"):]
            try:
                make_url(val)
            except Exception as exc:
                raise ValueError(
                    f"Could not parse SQLAlchemy DATABASE_URL from '{v}'. "
                    "Expected a valid database URL, e.g.: "
                    "'sqlite:////tmp/netsecure.db' or 'postgresql://user:password@host:5432/dbname'."
                ) from exc
            return val
        return str(v)

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


