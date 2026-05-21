"""Moment detection endpoint — Commerce Moment Classifier."""

from fastapi import APIRouter

from app.models.schemas import AnalyzeRequest, AnalyzeResult
from app.services.moment_classifier import MomentClassifier

router = APIRouter()

_classifier = MomentClassifier()


@router.post("/analyze", response_model=AnalyzeResult)
async def analyze(req: AnalyzeRequest) -> AnalyzeResult:
    return await _classifier.classify(req)
