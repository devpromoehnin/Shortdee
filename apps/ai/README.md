# ClipDee AI Service

FastAPI service for transcription (Whisper) and Commerce Moment detection (Gemini).
Runs separately from the pnpm/Turborepo apps.

## Setup

```bash
cd apps/ai
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Core deps (enough to run the service skeleton):
pip install -e ".[dev]"

# Heavy ML deps (Phase 4 — pulls in torch, whisper, librosa):
pip install -e ".[ml]"
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- Health: http://localhost:8000/health
- OpenAPI docs: http://localhost:8000/docs

## Test

```bash
pytest
```
