"""Application settings, loaded from the repo-root .env.local."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Monorepo: env vars live in the repo-root .env.local (run uvicorn from apps/ai).
    model_config = SettingsConfigDict(
        env_file="../../.env.local", env_file_encoding="utf-8", extra="ignore"
    )

    ai_port: int = 8000
    web_origin: str = "http://localhost:3000"

    # Gemini — moment detection
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # Whisper (faster-whisper) — transcription
    whisper_model: str = "small"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    openai_api_key: str = ""


settings = Settings()
