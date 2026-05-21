"""Gemini 2.5 Flash client — structured JSON moment classification."""

import structlog
from google import genai
from google.genai import types

from app.config import settings
from app.models.schemas import MomentClassification

log = structlog.get_logger()


class GeminiService:
    def __init__(self) -> None:
        self._client: genai.Client | None = None

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            if not settings.gemini_api_key:
                raise RuntimeError("GEMINI_API_KEY is not set — check .env.local")
            self._client = genai.Client(api_key=settings.gemini_api_key)
        return self._client

    async def classify(self, prompt: str) -> MomentClassification:
        """Classifies one window, returning structured JSON."""
        response = await self.client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MomentClassification,
                temperature=0.2,
            ),
        )
        parsed = response.parsed
        if isinstance(parsed, MomentClassification):
            return parsed
        # Fallback if the SDK did not auto-parse the response.
        return MomentClassification.model_validate_json(response.text or "{}")


gemini_service = GeminiService()
