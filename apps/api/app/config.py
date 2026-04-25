from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    database_url: str
    redis_url: str = "redis://localhost:6379/0"

    secret_key: str
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    gemini_api_key: str = ""
    groq_api_key: str = ""
    open_exchange_rates_app_id: str = ""

    allowed_origins: list[str] = ["http://localhost:8081"]
    environment: str = "development"
    debug: bool = True

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
