"""Whisper transcription service.

TODO(Phase 4.1): load Whisper large-v3, transcribe Thai with word timestamps,
apply the Live Commerce jargon dictionary, fall back to the OpenAI API.
"""

from app.models.schemas import TranscriptionResult


class WhisperService:
    def __init__(self, model_size: str = "large-v3") -> None:
        self.model_size = model_size
        self._model = None  # lazily loaded in Phase 4.1

    async def transcribe(self, audio_path: str, language: str = "th") -> TranscriptionResult:
        raise NotImplementedError("Phase 4.1")
