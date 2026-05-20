"""Gemini 2.5 Flash client wrapper.

TODO(Phase 4.2): structured JSON output, cost tracking, retry with backoff.
"""

from app.config import settings


class GeminiService:
    def __init__(self) -> None:
        self.model = settings.gemini_model
        self.api_key = settings.gemini_api_key

    async def generate_json(self, prompt: str) -> dict:
        raise NotImplementedError("Phase 4.2")
