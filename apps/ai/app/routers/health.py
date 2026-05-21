"""Health check."""

from datetime import UTC, datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "service": "clipdee-ai",
        "timestamp": datetime.now(UTC).isoformat(),
    }
