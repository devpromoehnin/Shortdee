"""Application settings, loaded from environment / .env."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ai_port: int = 8000
    web_origin: str = "http://localhost:3000"

    # Gemini — Phase 4
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # Whisper / OpenAI fallback — Phase 4
    whisper_model: str = "large-v3"
    openai_api_key: str = ""


settings = Settings()
