"""Transcription endpoint — Whisper ASR.

TODO(Phase 4.1): implement via WhisperService.
"""

from fastapi import APIRouter, HTTPException

from app.models.schemas import TranscribeRequest, TranscriptionResult

router = APIRouter()


@router.post("/transcribe", response_model=TranscriptionResult)
async def transcribe(_req: TranscribeRequest) -> TranscriptionResult:
    raise HTTPException(status_code=501, detail="Not implemented — see Phase 4.1")
