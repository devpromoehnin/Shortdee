"""Commerce Moment Classifier — ClipDee's core IP.

Sliding-window classification over the transcript, ClipDee Score computation,
and post-processing (merge / diversity filter / boundary snapping).

TODO(Phase 4.2): full implementation.
"""

from app.models.schemas import AnalyzeRequest, AnalyzeResult

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


def compute_clipdee_score(
    moment_type_weight: float,
    comment_density_score: float,
    audio_energy_score: float,
    visual_change_score: float,
    speaker_clarity_score: float,
) -> float:
    """Weighted ClipDee Score (0-100)."""
    return (
        0.30 * moment_type_weight * 100
        + 0.25 * comment_density_score
        + 0.20 * audio_energy_score
        + 0.15 * visual_change_score
        + 0.10 * speaker_clarity_score
    )


class MomentClassifier:
    async def classify(self, _req: AnalyzeRequest) -> AnalyzeResult:
        raise NotImplementedError("Phase 4.2")
