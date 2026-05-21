"""Whisper transcription via faster-whisper (CTranslate2 backend).

Faster + lighter than openai-whisper on CPU; same models. The model is loaded
lazily on first use and reused across requests.
"""

import asyncio

import structlog
from faster_whisper import WhisperModel

from app.config import settings
from app.models.schemas import TranscriptionResult, TranscriptSegment, Word

log = structlog.get_logger()

# Live Commerce jargon — biases Whisper toward domain terms it often mishears.
THAI_COMMERCE_PROMPT = (
    "ไลฟ์ขายของออนไลน์ CF กดเลข 1 ตะกร้า แอดมิน เก็บเงินปลายทาง "
    "ลดราคา โปรโมชั่น สั่งเลย แม่ค้า พี่ๆ น้องๆ"
)


class WhisperService:
    def __init__(self, model_size: str | None = None) -> None:
        self.model_size = model_size or settings.whisper_model
        self._model: WhisperModel | None = None

    def _get_model(self) -> WhisperModel:
        if self._model is None:
            log.info("whisper.loading", model=self.model_size, device=settings.whisper_device)
            self._model = WhisperModel(
                self.model_size,
                device=settings.whisper_device,
                compute_type=settings.whisper_compute_type,
            )
        return self._model

    def _transcribe_sync(self, audio_path: str, language: str) -> TranscriptionResult:
        model = self._get_model()
        # vad_filter skips silence; iterating `segments` runs the transcription.
        segments, info = model.transcribe(
            audio_path,
            language=language,
            word_timestamps=True,
            initial_prompt=THAI_COMMERCE_PROMPT,
            vad_filter=True,
        )
        result: list[TranscriptSegment] = []
        for seg in segments:
            words = [
                Word(word=w.word, start=w.start, end=w.end, prob=w.probability)
                for w in (seg.words or [])
            ]
            result.append(
                TranscriptSegment(
                    start=seg.start, end=seg.end, text=seg.text.strip(), words=words
                )
            )
        log.info("whisper.done", segments=len(result), duration=info.duration)
        return TranscriptionResult(
            segments=result, language=info.language, duration=info.duration
        )

    async def transcribe(self, audio_path: str, language: str = "th") -> TranscriptionResult:
        # faster-whisper is blocking + CPU-bound — run off the event loop.
        return await asyncio.to_thread(self._transcribe_sync, audio_path, language)


whisper_service = WhisperService()
