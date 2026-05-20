"""Hook generation endpoint.

TODO(Phase 5.3): implement via GeminiService.
"""

from fastapi import APIRouter, HTTPException

from app.models.schemas import HookRequest, HookResult

router = APIRouter()


@router.post("/generate-hook", response_model=HookResult)
async def generate_hook(_req: HookRequest) -> HookResult:
    raise HTTPException(status_code=501, detail="Not implemented — see Phase 5.3")
