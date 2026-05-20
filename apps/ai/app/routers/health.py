"""Health check."""

from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "service": "clipdee-ai",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
