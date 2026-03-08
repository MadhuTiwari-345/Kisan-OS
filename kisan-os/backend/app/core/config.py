from __future__ import annotations

from functools import cached_property
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "KISAN-OS"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Voice-powered intelligence for every farmer."
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite+aiosqlite:///./kisan_os.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    SQLALCHEMY_ECHO: bool = False

    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    BHASHINI_API_KEY: str = ""
    AGMARKNET_API_URL: str = "https://agmarknet.gov.in"
    ONDC_ENVIRONMENT: str = "sandbox"

    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str):
            return value.strip().lower() in {"1", "true", "yes", "on", "debug"}
        return bool(value)

    @cached_property
    def supported_farmer_languages(self) -> list[str]:
        return [
            "as-IN",
            "bn-IN",
            "bodo-IN",
            "dog-IN",
            "gu-IN",
            "hi-IN",
            "kn-IN",
            "ks-IN",
            "kok-IN",
            "mai-IN",
            "ml-IN",
            "mni-IN",
            "mr-IN",
            "ne-IN",
            "or-IN",
            "pa-IN",
            "sa-IN",
            "sat-IN",
            "sd-IN",
            "ta-IN",
            "te-IN",
            "ur-IN",
        ]


settings = Settings()
