import os
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DEFAULT_DB_URL = f"sqlite:///{DATA_DIR / 'tasks.db'}"


class Settings(BaseSettings):
    database_url: str = DEFAULT_DB_URL
    ai_provider: str = "openai"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
