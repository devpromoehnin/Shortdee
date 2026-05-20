"""Moment detection endpoint — Commerce Moment Classifier.

TODO(Phase 4.2): implement via MomentClassifier + GeminiService.
"""

from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalyzeRequest, AnalyzeResult

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResult)
async def analyze(_req: AnalyzeRequest) -> AnalyzeResult:
    raise HTTPException(status_code=501, detail="Not implemented — see Phase 4.2")
