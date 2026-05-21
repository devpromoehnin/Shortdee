"""Pydantic request/response schemas for the AI service."""

from typing import Literal

from pydantic import BaseModel, Field

MomentType = Literal[
    "CF",
    "PRODUCT_SHOWCASE",
    "CUSTOMER_QA",
    "PRICE_PROMO",
    "STORYTELLING",
    "URGENCY",
    "REACTION_PEAK",
    "NONE",
]


# ── Transcription ──


class Word(BaseModel):
    word: str
    start: float
    end: float
    prob: float


class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str
    words: list[Word] = Field(default_factory=list)


class TranscribeRequest(BaseModel):
    audio_path: str
    language: str = "th"


class TranscriptionResult(BaseModel):
    segments: list[TranscriptSegment]
    language: str
    duration: float


# ── Moment analysis ──


class WindowFeatures(BaseModel):
    start: float
    end: float
    transcript: str
    audio_energy: float = 0.0
    comment_density: float = 0.0
    visual_change: float = 0.0
    speaker_clarity: float = 1.0


class AnalyzeRequest(BaseModel):
    windows: list[WindowFeatures]


class MomentResult(BaseModel):
    start: float
    end: float
    moment_type: MomentType
    confidence: float
    score: float = Field(ge=0, le=100)
    hook_suggestion: str = ""
    reasoning: str = ""


class AnalyzeResult(BaseModel):
    moments: list[MomentResult]


class MomentClassification(BaseModel):
    """Structured Gemini output for a single transcript window."""

    moment_type: MomentType
    confidence: float = Field(ge=0, le=1)
    score: float = Field(ge=0, le=100)
    hook_suggestion: str = ""
    reasoning: str = ""


# ── Hook generation ──


class HookRequest(BaseModel):
    transcript: str
    moment_type: MomentType


class HookResult(BaseModel):
    hook: str
    alternatives: list[str] = Field(default_factory=list)
