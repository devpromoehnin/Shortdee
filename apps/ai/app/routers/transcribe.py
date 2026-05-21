"""Transcription endpoint — Whisper ASR via faster-whisper."""

import os

from fastapi import APIRouter, HTTPException

from app.models.schemas import TranscribeRequest, TranscriptionResult
from app.services.whisper_service import whisper_service

router = APIRouter()


@router.post("/transcribe", response_model=TranscriptionResult)
async def transcribe(req: TranscribeRequest) -> TranscriptionResult:
    if not os.path.exists(req.audio_path):
        raise HTTPException(status_code=404, detail=f"audio file not found: {req.audio_path}")
    return await whisper_service.transcribe(req.audio_path, req.language)
