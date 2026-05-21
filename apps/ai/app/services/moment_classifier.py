"""Commerce Moment Classifier — ClipDee's core IP.

Classifies each transcript window via Gemini and assembles the result set.
"""

import asyncio

import structlog

from app.models.schemas import AnalyzeRequest, AnalyzeResult, MomentResult, WindowFeatures
from app.prompts.commerce_moments import COMMERCE_MOMENT_PROMPT
from app.services.gemini_service import gemini_service

log = structlog.get_logger()

# ClipDee Score weights — see CLAUDE.md §Commerce Moment Classifier.
MOMENT_TYPE_WEIGHTS: dict[str, float] = {
    "CF": 1.0,
    "PRODUCT_SHOWCASE": 1.0,
    "CUSTOMER_QA": 0.9,
    "PRICE_PROMO": 0.85,
    "URGENCY": 0.85,
    "STORYTELLING": 0.7,
    "REACTION_PEAK": 0.7,
}

SCORE_THRESHOLD = 65
_MAX_CONCURRENCY = 5


def compute_clipdee_score(
    moment_type_weight: float,
    comment_density_score: float,
    audio_energy_score: float,
    visual_change_score: float,
    speaker_clarity_score: float,
) -> float:
    """Weighted ClipDee Score (0-100).

    Used once Phase 4.3 supplies real audio/visual signals; until then the
    classifier uses Gemini's transcript-based score directly.
    """
    return (
        0.30 * moment_type_weight * 100
        + 0.25 * comment_density_score
        + 0.20 * audio_energy_score
        + 0.15 * visual_change_score
        + 0.10 * speaker_clarity_score
    )


class MomentClassifier:
    async def classify(self, req: AnalyzeRequest) -> AnalyzeResult:
        semaphore = asyncio.Semaphore(_MAX_CONCURRENCY)

        async def classify_one(window: WindowFeatures) -> MomentResult | None:
            async with semaphore:
                return await self._classify_window(window)

        results = await asyncio.gather(
            *(classify_one(w) for w in req.windows), return_exceptions=True
        )

        moments: list[MomentResult] = []
        for result in results:
            if isinstance(result, MomentResult):
                moments.append(result)
            elif isinstance(result, BaseException):
                log.warning("classify.window_failed", error=str(result))

        moments.sort(key=lambda m: m.start)
        log.info("classify.done", windows=len(req.windows), moments=len(moments))
        return AnalyzeResult(moments=moments)

    async def _classify_window(self, window: WindowFeatures) -> MomentResult | None:
        if not window.transcript.strip():
            return None

        prompt = COMMERCE_MOMENT_PROMPT.format(
            transcript=window.transcript,
            start=window.start,
            end=window.end,
            audio_energy=window.audio_energy,
            comment_density=window.comment_density,
            visual_change=window.visual_change,
        )
        result = await gemini_service.classify(prompt)
        if result.moment_type == "NONE":
            return None

        return MomentResult(
            start=window.start,
            end=window.end,
            moment_type=result.moment_type,
            confidence=result.confidence,
            # MVP: Gemini's transcript-based score is the ClipDee Score until
            # Phase 4.3 wires real signals into compute_clipdee_score().
            score=result.score,
            hook_suggestion=result.hook_suggestion,
            reasoning=result.reasoning,
        )
