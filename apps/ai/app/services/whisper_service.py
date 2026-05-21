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
THAI_COMMERCE_HOTWORDS = (
    "ไลฟ์ขายของออนไลน์ CF กดสั่ง กดเลข รหัสสินค้า ตะกร้า แอดมิน ออเดอร์ "
    "เก็บเงินปลายทาง ลดราคา โปรโมชั่น พร้อมส่ง สั่งเลย แม่ค้า พี่ๆ น้องๆ"
)


class WhisperService:
    def __init__(self, model_size: str | None = None) -> None:
        self.model_size = model_size or settings.whisper_model
        self._model: WhisperModel | None = None
        # Serializes transcriptions — the model is not safe for concurrent use.
        self._lock = asyncio.Lock()

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
        # condition_on_previous_text=False stops one bad guess from cascading.
        segments, info = model.transcribe(
            audio_path,
            language=language,
            word_timestamps=True,
            hotwords=THAI_COMMERCE_HOTWORDS,
            condition_on_previous_text=False,
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
        # faster-whisper is blocking + CPU-bound — run off the event loop,
        # one at a time (the model is not safe for concurrent use).
        async with self._lock:
            return await asyncio.to_thread(self._transcribe_sync, audio_path, language)


whisper_service = WhisperService()
