"""FastAPI entrypoint for the ClipDee AI service."""

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import analyze, classify, health, transcribe

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    log.info("clipdee-ai.starting", model=settings.gemini_model)
    yield
    log.info("clipdee-ai.stopping")


app = FastAPI(title="ClipDee AI Service", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Return the standard error envelope on unhandled failures."""
    log.error("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "เกิดข้อผิดพลาดในระบบ"}},
    )


app.include_router(health.router)
app.include_router(transcribe.router, prefix="/ai", tags=["ai"])
app.include_router(analyze.router, prefix="/ai", tags=["ai"])
app.include_router(classify.router, prefix="/ai", tags=["ai"])
