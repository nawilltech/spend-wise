from __future__ import annotations
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, env_file_encoding="utf-8")

    database_url: str = "postgresql+asyncpg://spendwise:password@localhost:5432/spendwise"
    redis_url: str = "redis://localhost:6379/0"

    secret_key: str = "dev-secret-key-change-in-production"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    gemini_api_key: str = ""
    groq_api_key: str = ""
    open_exchange_rates_app_id: str = ""

    # Stored as comma-separated string to avoid pydantic-settings JSON-decode issue
    allowed_origins: str = "http://localhost:8081"
    environment: str = "development"
    debug: bool = True

    def get_cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
