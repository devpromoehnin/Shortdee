# 🤖 Claude Code Commands for ClipDee

> คู่มือ prompts และคำสั่งสำหรับใช้กับ Claude Code เพื่อ build ClipDee แบบ step-by-step
>
> **วิธีใช้:** copy prompt ที่ต้องการ paste ใส่ Claude Code ใน terminal

---

## 📋 Table of Contents

- [การตั้งค่าเริ่มต้น (Setup)](#-การตั้งค่าเริ่มต้น)
- [Phase 1: Project Foundation](#phase-1-project-foundation)
- [Phase 2: Database & Auth](#phase-2-database--auth)
- [Phase 3: Video Processing Pipeline](#phase-3-video-processing-pipeline)
- [Phase 4: AI Moment Detection](#phase-4-ai-moment-detection)
- [Phase 5: Auto-Edit Pipeline](#phase-5-auto-edit-pipeline)
- [Phase 6: Review Dashboard UI](#phase-6-review-dashboard-ui)
- [Phase 7: Multi-Platform Publishing](#phase-7-multi-platform-publishing)
- [Phase 8: Payment & Billing](#phase-8-payment--billing)
- [Phase 9: Analytics & Monitoring](#phase-9-analytics--monitoring)
- [Daily Workflow Commands](#-daily-workflow-commands)
- [Debugging Prompts](#-debugging-prompts)

---

## 🚀 การตั้งค่าเริ่มต้น

### ติดตั้ง Claude Code

```bash
# ติดตั้ง (ถ้ายังไม่มี)
npm install -g @anthropic-ai/claude-code

# Login
claude login

# Verify
claude --version
```

### เริ่มต้น Project

```bash
# 1. สร้าง project directory
mkdir clipdee && cd clipdee

# 2. Copy CLAUDE.md เข้ามา (จากไฟล์นี้)
# วาง CLAUDE.md ที่ root

# 3. เริ่ม Claude Code
claude

# Claude จะอ่าน CLAUDE.md อัตโนมัติ
```

### ตั้งค่า MCP Servers (Optional แต่แนะนำ)

ใน Claude Code:
```
/mcp
```

แนะนำให้เปิด:
- **filesystem** — เข้าถึงไฟล์
- **github** — push/PR
- **postgres** — query Supabase ตรง
- **playwright** — test UI

---

## Phase 1: Project Foundation

### 🎯 1.1 Initialize Monorepo

```
ช่วย initialize monorepo สำหรับ ClipDee ด้วย structure ต่อไปนี้:

Project: ClipDee — AI Live-to-Shorts SaaS
Stack: pnpm workspace + Turborepo, TypeScript strict mode

Structure ที่ต้องการ:
clipdee/
├── apps/
│   ├── web/        # Next.js 15 (App Router)
│   ├── api/        # Fastify (TypeScript)
│   └── ai/         # FastAPI (Python 3.11)
├── workers/
│   ├── video-processor/
│   └── publisher/
├── packages/
│   ├── database/   # Prisma
│   ├── types/      # Shared TS types
│   ├── ui/         # Shared components
│   └── config/     # ESLint, TS config
├── infra/
└── docs/

Tasks:
1. Setup pnpm workspace ใน root package.json
2. Setup Turborepo (turbo.json) — configure pipeline (dev, build, lint, test)
3. Setup shared TypeScript config ใน packages/config
4. Setup ESLint + Prettier configs (shared)
5. สร้าง .gitignore, .env.example
6. สร้าง README.md ที่บอก quickstart

อ้างอิง CLAUDE.md ใน root สำหรับ context เพิ่มเติม
```

### 🎯 1.2 Setup Next.js Web App

```
ช่วย scaffold Next.js 15 app ใน apps/web/

Requirements:
- Next.js 15 with App Router
- TypeScript strict mode
- Tailwind CSS + shadcn/ui (install init)
- Fonts: Sarabun (Thai) + Inter
- Path alias @/* → src/*

Folder structure ที่ต้องการ:
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/signup/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Dashboard home
│   │   │   ├── lives/page.tsx
│   │   │   ├── clips/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── (marketing)/
│   │   │   ├── page.tsx           # Landing
│   │   │   └── pricing/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   └── shared/
│   ├── lib/
│   │   └── utils.ts
│   └── stores/

Brand colors (apply ใน tailwind.config.ts):
- primary: #FF4D6D
- secondary: #1F3A5F
- accent: #FFB800

Install shadcn/ui components ที่จะใช้บ่อย:
button, card, input, dialog, sheet, dropdown-menu, badge, table, tabs, toast
```

### 🎯 1.3 Setup Fastify API

```
ช่วย scaffold Fastify API ใน apps/api/

Requirements:
- Fastify with TypeScript
- Zod สำหรับ schema validation (@fastify/zod-type-provider)
- Prisma client (อ้าง schema จาก packages/database)
- Supabase JWT verification middleware
- CORS, rate limiting, helmet
- Pino logger
- Health check endpoint

Folder structure:
apps/api/
├── src/
│   ├── app.ts            # Fastify instance setup
│   ├── server.ts         # Entry point
│   ├── routes/
│   │   ├── health.ts
│   │   ├── auth.ts
│   │   ├── lives.ts
│   │   ├── clips.ts
│   │   ├── jobs.ts
│   │   └── webhooks.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── rate-limit.ts
│   ├── services/
│   ├── plugins/
│   └── lib/
└── tsconfig.json

อย่าลืม:
- ใส่ TypeScript types สำหรับทุก route
- ใช้ Zod schema ทุก request/response
- Error handling consistent format: { error: { code, message, details? } }
```

### 🎯 1.4 Setup Python AI Service

```
ช่วย scaffold FastAPI service ใน apps/ai/

Requirements:
- Python 3.11+
- FastAPI + uvicorn
- Pydantic v2 สำหรับ schemas
- ใช้ uv หรือ poetry สำหรับ dependency management

Folder structure:
apps/ai/
├── app/
│   ├── main.py           # FastAPI app
│   ├── config.py         # Settings (Pydantic Settings)
│   ├── routers/
│   │   ├── health.py
│   │   ├── transcribe.py
│   │   ├── analyze.py
│   │   └── classify.py
│   ├── services/
│   │   ├── whisper_service.py
│   │   ├── gemini_service.py
│   │   ├── moment_classifier.py
│   │   ├── audio_analyzer.py
│   │   └── visual_analyzer.py
│   ├── prompts/
│   │   └── commerce_moments.py
│   ├── models/
│   │   └── schemas.py
│   └── utils/
├── tests/
├── pyproject.toml
└── Dockerfile

Initial dependencies:
- fastapi
- uvicorn[standard]
- pydantic
- pydantic-settings
- google-genai (Gemini)
- openai-whisper
- librosa
- numpy
- python-dotenv

Setup logging with structlog, exception handlers, CORS
```

---

## Phase 2: Database & Auth

### 🎯 2.1 Setup Prisma Schema

```
ช่วย setup Prisma schema ใน packages/database/

Reference: ดู schema ที่ design ไว้ใน CLAUDE.md (section Database Schema)

Tasks:
1. Setup Prisma with PostgreSQL provider
2. Enable pgvector extension (preview features)
3. สร้าง schema.prisma ที่ define models:
   - User (with Plan enum)
   - LiveStream (with Platform, ProcessStatus enums)
   - Moment (with MomentType enum, embedding vector)
   - Clip (with ClipStatus enum)
   - UsageLog

4. สร้าง initial migration
5. Setup seed script ใน prisma/seed.ts ที่สร้าง:
   - Demo user (demo@clipdee.ai)
   - Sample live stream
   - Sample moments

6. Export Prisma client เป็น @clipdee/database package

หมายเหตุ:
- ใช้ UUID เป็น primary key (default(uuid()))
- ทุก model มี createdAt, updatedAt
- pgvector: ใช้ Unsupported("vector(768)")
- Index ที่ควรมี: User.email, LiveStream.userId, Moment.liveStreamId, Clip.userId
```

### 🎯 2.2 Setup Supabase Auth

```
ช่วย integrate Supabase Auth ใน Next.js app และ Fastify API

Tasks:

ใน apps/web/:
1. Install @supabase/supabase-js, @supabase/ssr
2. สร้าง lib/supabase/client.ts (browser client)
3. สร้าง lib/supabase/server.ts (server client)
4. สร้าง middleware.ts ที่ protect /dashboard routes
5. สร้าง login page ด้วย:
   - Email/password
   - Google OAuth
   - Magic link
6. สร้าง signup page
7. สร้าง logout handler

ใน apps/api/:
1. สร้าง middleware/auth.ts ที่:
   - Verify Supabase JWT จาก Authorization header
   - Extract user_id และ attach to request
   - Return 401 ถ้า invalid
2. Apply middleware กับ protected routes

ใน database:
1. Sync Supabase auth.users กับ public.User table
   - ใช้ trigger หรือ webhook ที่ create User row เมื่อ signup
2. Setup Row Level Security (RLS) policies:
   - User เข้าถึงได้แค่ data ของตัวเอง
   - LiveStream, Moment, Clip — RLS by userId

User-facing copy เป็นภาษาไทย:
- "เข้าสู่ระบบ" (login)
- "สมัครสมาชิก" (signup)
- "ลืมรหัสผ่าน?" (forgot password)
```

---

## Phase 3: Video Processing Pipeline

### 🎯 3.1 Build Upload + Storage Service

```
ช่วยสร้าง upload service สำหรับ live recordings

Architecture:
1. User upload → Frontend (chunked upload to R2 directly via signed URL)
2. Frontend → API: notify upload complete
3. API → Queue: enqueue processing job
4. Worker → R2: download + process

Tasks:

ใน apps/api/src/routes/lives.ts:
1. POST /api/lives/upload-url
   - Input: { filename, size, contentType, duration?, platform? }
   - Validate: user quota, file size limit (max 4GB)
   - Generate R2 signed upload URL (valid 1hr)
   - Create LiveStream record (status: PENDING_UPLOAD)
   - Return: { uploadUrl, liveStreamId, key }

2. POST /api/lives/:id/complete
   - Verify upload completed (HEAD request to R2)
   - Update status to QUEUED
   - Enqueue processing job in BullMQ
   - Return live stream details

3. GET /api/lives — list user's lives (paginated)
4. GET /api/lives/:id — get details
5. DELETE /api/lives/:id — delete (cascade clips, moments)

ใน apps/web/:
1. สร้าง <UploadDropzone /> component
   - Drag & drop
   - Progress bar
   - Chunked upload to R2 via signed URL
   - Validate file type (.mp4, .mov, .webm)
   - Validate duration (max 6 hours)
2. Show upload progress + processing status

R2 Setup:
- Bucket: clipdee-uploads (raw lives)
- Bucket: clipdee-outputs (processed clips)
- CORS configured for app domain
- Lifecycle: delete raw uploads after 30 days
```

### 🎯 3.2 Build Video Processor Worker

```
ช่วยสร้าง video processor worker ใน workers/video-processor/

Tasks:

1. Setup BullMQ worker
   - Listen to queue: 'video-processing'
   - Concurrency: 2 (configurable)
   - Job timeout: 60 minutes
   - Retry: 3 times with exponential backoff

2. Job stages (อ้างอิง CLAUDE.md - Architecture section):

   Stage 1: Pre-processing
   - Download from R2 to local /tmp
   - Extract audio with FFmpeg (16kHz mono WAV)
   - Get video metadata (duration, fps, resolution)
   - Update DB: status = PROCESSING, stage = "preprocessing"

   Stage 2: Transcription
   - Call AI service POST /ai/transcribe
   - Pass: audio file path
   - Get: segments with timestamps + text
   - Save to DB

   Stage 3: Moment Detection
   - Call AI service POST /ai/analyze
   - Pass: transcript + audio features + visual frames sample
   - Get: array of detected moments with scores
   - Save Moments to DB

   Stage 4: Cut Clips
   - For each moment with score >= 65:
     - FFmpeg cut: input.mp4 -ss start -to end -c copy output.mp4
     - 9:16 reframe with face tracking (use Python service)
     - Burn captions
     - Generate thumbnail
   - Upload all clips to R2
   - Save Clips to DB (status: DRAFT)

   Stage 5: Cleanup
   - Delete local files
   - Update LiveStream status = DONE
   - Send notification (email/Line)

3. Progress reporting
   - Use Redis pub/sub to push progress updates
   - Frontend subscribes via Supabase realtime or polling

4. Error handling
   - Each stage wrapped in try/catch
   - On failure: update DB with error, notify user, allow retry
   - Failed clips don't fail entire job

Use fluent-ffmpeg, dockerized FFmpeg available in worker container
```

---

## Phase 4: AI Moment Detection

### 🎯 4.1 Implement Whisper Transcription Service

```
ช่วย implement Whisper transcription ใน apps/ai/app/services/whisper_service.py

Requirements:
1. Use openai-whisper Large-v3 model (self-hosted)
2. Support Thai language explicitly
3. Return segments with word-level timestamps
4. Pre-process audio for better quality (denoising)

Implementation:

```python
class WhisperService:
    def __init__(self, model_size: str = "large-v3"):
        self.model = whisper.load_model(model_size)

    async def transcribe(
        self,
        audio_path: str,
        language: str = "th",
    ) -> TranscriptionResult:
        # Pre-process: load + denoise
        # Run whisper with word_timestamps=True
        # Return structured result
        pass
```

TranscriptionResult schema:
- segments: list of { start, end, text, words: [{word, start, end, prob}] }
- language: detected language
- duration: total duration

Additional features:
1. Thai jargon dictionary boost
   - Custom prompt with common Live Commerce terms
   - "CF", "ตะกร้า", "กดเลข", "พี่ๆ", etc.

2. Confidence scoring
   - Filter low-confidence segments (< 0.6)
   - Mark for human review

3. Cost optimization
   - Cache results by file hash
   - Batch processing if multiple lives in queue

4. Fallback to OpenAI API
   - If local fails or model not available
   - Use openai.audio.transcriptions.create

Setup tests:
- Test with sample Thai Live recording (10 min)
- Measure: WER (Word Error Rate)
- Target: WER < 15% on commerce content
```

### 🎯 4.2 Build Commerce Moment Classifier

```
ช่วย implement Commerce Moment Classifier ใน apps/ai/app/services/moment_classifier.py

นี่คือ Core IP ของ ClipDee — ต้อง implement ให้ดี

Architecture:

1. Input: transcript segments + audio features + comment data (if available)

2. Pipeline:
   a) Sliding window over transcript (30-second windows, 5s step)
   b) For each window, compute features:
      - Audio energy (RMS, spectral centroid)
      - Comment density (comments/min in that window)
      - Visual change score (scene change detection)
      - Speaker clarity (audio quality)
   c) Call Gemini 2.5 Flash with structured prompt
   d) Parse JSON response
   e) Compute ClipDee Score:
      Score = (0.30 × moment_type_weight)
            + (0.25 × comment_density_score)
            + (0.20 × audio_energy_score)
            + (0.15 × visual_change_score)
            + (0.10 × speaker_clarity_score)
   f) Post-process:
      - Merge adjacent windows of same type
      - Apply diversity filter (don't pick 5 CFs in a row)
      - Snap boundaries to sentence breaks
      - Filter min duration (15s) and max (60s)

3. Prompt (ใน app/prompts/commerce_moments.py):

```python
COMMERCE_MOMENT_PROMPT = """
คุณเป็น AI specialist ที่เข้าใจการขายของแบบ Live Commerce ไทย
งานของคุณคือวิเคราะห์ transcript จาก Live stream และจัดประเภท moment

MOMENT TYPES (เลือก 1 ที่ตรงที่สุด หรือ NONE ถ้าไม่ใช่ moment):

1. CF (Customer Confirmation)
   - ลูกค้ากำลังจะสั่ง หรือแม่ค้ากำลังเชิญให้สั่ง
   - Triggers: "กดเลข 1", "จองค่ะ", "ตะกร้าเปิดแล้ว", "CF", "ขอ 1 ค่ะ"
   - Weight: 1.0 (สำคัญสุด)

2. PRODUCT_SHOWCASE
   - กำลังโชว์/อธิบายสินค้า
   - Triggers: "ตัวนี้นะคะ", "เห็นไหมว่า", "เนื้อผ้า", "ฟีเจอร์"
   - Weight: 1.0

3. CUSTOMER_QA
   - ตอบคำถามลูกค้า
   - Triggers: "ลูกค้าถามว่า", "พี่...ถามมาว่า", "คำถามจาก"
   - Weight: 0.9

4. PRICE_PROMO
   - เปิดเผยราคา/โปรโมชั่น
   - Triggers: "ลดเหลือ", "พิเศษวันนี้", "แถม", "ปกติ X แต่"
   - Weight: 0.85

5. STORYTELLING
   - เล่าเรื่องสินค้า ที่มา ประสบการณ์
   - Triggers: "เรื่องของสินค้านี้", "ตอนแรก", "ที่มา"
   - Weight: 0.7

6. URGENCY
   - สร้างความเร่งด่วน
   - Triggers: "เหลือ X ตัว", "หมดเขต", "30 วินาที", "ใกล้หมด"
   - Weight: 0.85

7. REACTION_PEAK
   - หัวเราะ ดราม่า ตกใจ — moment ที่ personality เด่น
   - Triggers: audio energy peak, comment density spike
   - Weight: 0.7

INPUT:
{transcript}

CONTEXT:
- Window: {start}s - {end}s
- Audio energy: {audio_energy} (0-1)
- Comment density: {comment_density} comments/min
- Visual change: {visual_change} (0-1)

OUTPUT (JSON only, no markdown):
{
  "moment_type": "CF" | "PRODUCT_SHOWCASE" | ... | "NONE",
  "confidence": 0.0-1.0,
  "score": 0-100,
  "hook_suggestion": "ประโยคเปิดที่จะดึงดูดคนดู (ภาษาไทย)",
  "reasoning": "สั้นๆ ว่าทำไมจัดประเภทนี้"
}
"""
```

4. Caching layer
   - Cache classification by hash(transcript_chunk)
   - Save 50%+ API cost on similar content

5. Async batch processing
   - Process windows in parallel (10 concurrent)
   - Aggregate results

6. Tests
   - Sample data: 10 labeled Live recordings
   - Measure accuracy per moment type
   - Target: ≥80% overall accuracy by end of MVP

Setup tracing with OpenTelemetry for prompt cost tracking
```

### 🎯 4.3 Build Audio + Visual Feature Extractors

```
ช่วยสร้าง audio + visual analyzers ใน apps/ai/app/services/

Audio Analyzer (audio_analyzer.py):

```python
class AudioAnalyzer:
    def extract_features(self, audio_path: str) -> AudioFeatures:
        # Use librosa
        # Compute:
        # - RMS energy (rolling 1-second window)
        # - Spectral centroid (brightness)
        # - Zero crossing rate (speech vs music)
        # - Speech rate (words/min from transcript)
        # - Silence detection (for boundary snapping)
        pass

    def detect_excitement_peaks(self, audio_path: str) -> list[Peak]:
        # Find moments of high energy + high pitch
        # = likely excitement / sales push
        pass
```

Visual Analyzer (visual_analyzer.py):

```python
class VisualAnalyzer:
    def extract_frames(self, video_path: str, fps: float = 0.5) -> list[Frame]:
        # Use FFmpeg to extract frames every 2 seconds
        pass

    def detect_scene_changes(self, frames: list[Frame]) -> list[SceneChange]:
        # Compute histogram diff between consecutive frames
        # Threshold for scene change
        pass

    def detect_faces(self, frame: Frame) -> list[Face]:
        # Use MediaPipe Face Detection
        # Return bounding boxes for 9:16 reframing
        pass

    def detect_products(self, frame: Frame) -> list[Product]:
        # Use YOLOv8 (general object detection)
        # Filter for product-like objects
        # Phase 2: fine-tune for fashion/cosmetic categories
        pass
```

Output format ให้ consistent:
- Time-aligned data ที่ moment classifier ใช้ได้
- All timestamps in seconds (float)

Performance:
- Audio analysis: < 1 minute per hour of video
- Visual analysis: < 2 minutes per hour
- Run in parallel where possible
```

---

## Phase 5: Auto-Edit Pipeline

### 🎯 5.1 FFmpeg Cut + 9:16 Reframe

```
ช่วย implement video cutting + reframing ใน workers/video-processor/

Tasks:

1. Cut Service (cut.ts):
```typescript
async function cutClip(
  inputPath: string,
  outputPath: string,
  startSec: number,
  endSec: number
): Promise<void> {
  // ใช้ ffmpeg -ss startSec -to endSec -c copy (stream copy, fastest)
  // ถ้าต้อง re-encode (เช่น เพื่อ accuracy): -c:v libx264 -preset fast
}
```

2. Reframe Service (reframe.ts):

แนวคิด: หา face/subject ในแต่ละ frame, generate crop window 9:16
ที่ตามคน

```typescript
async function reframe9_16(
  inputPath: string,
  outputPath: string,
  faceTrackingData: FaceTrack[]
): Promise<void> {
  // 1. Compute crop window per frame:
  //    - Center on face if detected
  //    - Smooth motion (no jitter) — use moving average
  //    - Aspect 9:16
  // 2. Generate FFmpeg crop+scale filter
  // 3. Encode output
  //
  // Filter example:
  // crop=w=ih*9/16:h=ih:x='if(gte(t,0)*lt(t,5),100,200)':y=0
}
```

3. Edge Cases:
- ถ้าไม่เจอ face: center crop
- ถ้ามี multiple faces: ใช้ที่ใหญ่ที่สุด (closest to camera)
- ถ้า face move เร็ว: smooth ด้วย Kalman filter or simple MA

4. Quality settings:
- Output: 1080x1920 (9:16 HD)
- Codec: H.264, CRF 23 (quality vs size balance)
- Audio: AAC 128kbps

5. Tests:
- Sample inputs: 10 live recordings
- Visual check: face always in center?
- Performance: < 30 seconds per 1-minute clip
```

### 🎯 5.2 Thai Caption Generation + Burn-in

```
ช่วยสร้าง caption service ที่ generate Thai subtitle + burn เข้า video

Tasks:

1. Caption Generator:

```typescript
async function generateCaption(
  segments: WordSegment[], // from Whisper
  style: CaptionStyle = 'default'
): Promise<ASSSubtitle> {
  // 1. Group words into lines (max 2 lines per screen)
  // 2. Max ~6 words per line for readability
  // 3. Highlight keywords (price, product name) with different color
  // 4. Generate .ass format with styling:
  //    - Font: Sarabun Bold
  //    - Size: 48px
  //    - Color: White with black outline
  //    - Position: bottom 20% (avoid TikTok UI)
  //    - Animation: word-by-word highlight (karaoke style)
  pass
}
```

2. Style presets:
- 'default' — clean white text
- 'punchy' — yellow highlight on hook words
- 'minimal' — small white text

3. Keyword highlighting:
- Detect: prices (ตัวเลข + บาท), product names, urgency words
- Color: #FFB800 (accent yellow) for emphasis
- Bold + slight scale animation

4. Burn into video:

```bash
ffmpeg -i clip.mp4 -vf "ass=subtitle.ass" -c:a copy output.mp4
```

5. Mobile-safe area:
- TikTok UI overlay: ~150px from top + bottom
- Keep captions in middle 60% of vertical space

6. Tests:
- Verify readability on small screen (test on phone)
- Check timing alignment with speech
- Verify highlight colors render correctly
```

### 🎯 5.3 Thumbnail + Hook Generation

```
ช่วยสร้าง thumbnail generator + hook generator

Tasks:

1. Thumbnail Generator (thumbnail.ts):
- Extract best frame from clip:
  - High face detection confidence
  - Mouth open (engaging expression)
  - Good lighting
- Add text overlay (hook text)
- Output: 1080x1920 JPG

2. Hook Generator (call AI service):

POST /ai/generate-hook
Input: { transcript: string, momentType: MomentType }
Output: { hook: string, alternatives: string[] }

Prompt:
"คุณคือ TikTok hook expert สำหรับ Live commerce ไทย
สร้าง hook 1 ประโยค (max 12 คำ) ที่:
- ดึงดูดให้คนหยุด scroll
- ใช้ภาษาพูด สำเนียงไทยธรรมชาติ
- ตรงกับ moment type ที่ระบุ
- ห้ามใช้ emoji เกินจำเป็น

Moment type: {momentType}
Content: {transcript}

ให้ 3 ทางเลือก:
1. แบบสร้างความสงสัย (curiosity)
2. แบบเร่งด่วน (urgency)
3. แบบประโยชน์ตรงๆ (benefit)"

3. Tests:
- A/B test hooks (manual eval ใน MVP, automated later)
- Track which hook style gets best engagement
- Use as feedback signal for prompt improvement
```

---

## Phase 6: Review Dashboard UI

### 🎯 6.1 Build Lives List Page

```
ช่วยสร้าง /dashboard/lives page

Requirements:

UI:
- Header: "ไลฟ์ของฉัน" + upload button
- Filters: Status, Platform, Date range
- Grid view ของ live streams (cards)
- Each card:
  - Thumbnail (first frame)
  - Title + duration
  - Status badge (Processing / Done / Failed)
  - Number of clips generated
  - Processing progress (if PROCESSING)
  - Actions: View clips, Re-process, Delete

Functionality:
- Pagination (20 per page)
- Real-time updates via Supabase Realtime
  - Subscribe to: changes ใน LiveStream table for current user
  - Auto-refresh when status changes
- Upload modal:
  - Drag & drop
  - URL paste (TikTok Live archive, FB Live)
  - Show progress

Tech:
- React Query สำหรับ data fetching
- Supabase Realtime for live updates
- Zustand store: useLivesStore (filters, pagination)

Empty state:
"ยังไม่มีไลฟ์ — Upload เลย!" + button

Loading state: skeleton cards
Error state: friendly error + retry button
```

### 🎯 6.2 Build Clip Review Interface

```
ช่วยสร้าง /dashboard/lives/[id]/clips page — หน้าสำคัญที่สุด!

UI Layout:
┌────────────────────────────────────────────────────────┐
│  ← กลับ | Live: "ขายเสื้อ Sale ใหญ่ 5/15" | ✓ approved 5/10 │
├────────────────────────────────────────────────────────┤
│  Filter: All | Pending | Approved | Rejected           │
│  Sort: Score ↓ | Time ↑ | Type                         │
├────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ [video preview]   │  │ [video preview]  │           │
│  │ 9:16 vertical     │  │                  │           │
│  │                   │  │                  │           │
│  │ 🎯 CF Moment      │  │ 🎯 Showcase      │           │
│  │ Score: 87/100     │  │ Score: 82/100    │           │
│  │ 0:23 → 0:38       │  │ 1:12 → 1:35      │           │
│  │                   │  │                  │           │
│  │ "ตะกร้าเปิดแล้ว..." │  │ "ตัวนี้นะคะ..."  │           │
│  │                   │  │                  │           │
│  │ [Approve] [Edit] [Reject]                          │
│  └──────────────────┘  └──────────────────┘           │
└────────────────────────────────────────────────────────┘

Each Clip Card features:
1. Video preview player (Video.js)
   - Auto-play on hover (muted)
   - Click to expand to fullscreen
2. Moment type badge + score
3. Time range (clickable to view in original Live)
4. Hook text (editable inline)
5. Caption preview
6. Actions:
   - Approve → mark as APPROVED, ready to publish
   - Edit → open Timeline Editor (next section)
   - Reject → mark as REJECTED, soft delete
   - Download → direct R2 download

Bulk actions:
- Select multiple → Approve all / Reject all / Download all

Keyboard shortcuts:
- Space: play/pause preview
- A: approve
- R: reject
- ←/→: navigate clips

Build with:
- React Query for data
- shadcn Dialog for edit modal
- Optimistic updates for fast UX
```

### 🎯 6.3 Build Timeline Editor

```
ช่วยสร้าง Timeline Editor — modal สำหรับปรับแต่ง clip ก่อน publish

UI:
┌────────────────────────────────────────────────────────┐
│ Edit Clip: "ตะกร้าเปิดแล้ว..."                  ✕ Close │
├────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐                   │
│  │       Video Preview (9:16)        │                   │
│  │                                   │                   │
│  └─────────────────────────────────┘                   │
│                                                          │
│  Timeline (waveform):                                    │
│  ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰                       │
│  [◀── trim start          trim end ──▶]                  │
│  0:00              0:15                                  │
│                                                          │
│  Hook Text:                                              │
│  [ตะกร้าเปิดแล้ว ใครอยากได้กดเลข 1 เลย!        ]         │
│  (12 / 50 characters)                                    │
│                                                          │
│  Caption:                                                │
│  ☑ แสดง caption                                          │
│  Style: [Default ▼]  Highlight: [Yellow ▼]              │
│                                                          │
│  Moment Type:                                            │
│  ⚪ CF (current) ⚪ Showcase ⚪ Q&A ...                  │
│                                                          │
│  [Cancel]                              [Save Changes]    │
└────────────────────────────────────────────────────────┘

Features:
1. Trim start/end (drag handles)
   - Min duration: 5s
   - Max duration: 90s
   - Visual feedback on timeline

2. Edit hook text (max 60 chars)
   - Character counter
   - AI re-generate button → call /ai/generate-hook

3. Caption settings
   - Toggle on/off
   - Choose style preset
   - Choose highlight color

4. Re-categorize moment type
   - Useful when AI got it wrong
   - Used as feedback signal

5. Save changes:
   - If trim changed → re-process clip (FFmpeg cut)
   - If hook/caption changed → regenerate captions
   - Background job, show toast "กำลังประมวลผล..."

Tech:
- Video.js for player
- WaveSurfer.js for waveform visualization
- React Hook Form for inputs
- Mutation with React Query
```

---

## Phase 7: Multi-Platform Publishing

### 🎯 7.1 TikTok Publishing

```
ช่วย implement TikTok publishing ใน workers/publisher/src/tiktok.ts

Setup:
1. Register TikTok Developer App
2. Get Client Key + Secret
3. Implement OAuth flow ใน apps/web/

OAuth Flow:
- /dashboard/settings/integrations → Connect TikTok button
- Redirect to TikTok auth URL with scopes:
  - user.info.basic
  - video.upload
  - video.publish
- Callback → exchange code for access_token + refresh_token
- Store encrypted in DB

Publishing Service:

```typescript
async function publishToTikTok(
  clip: Clip,
  user: User,
  options: PublishOptions
): Promise<PublishResult> {
  // 1. Get user's TikTok access token (refresh if expired)
  // 2. Initialize upload session:
  //    POST /v2/post/publish/inbox/video/init/
  //    Get upload_url + publish_id
  // 3. Upload video chunks to upload_url
  // 4. Publish with metadata:
  //    POST /v2/post/publish/inbox/video/init/
  //    Body: { title, privacy, allow_comment, allow_duet, allow_stitch }
  // 5. Poll status:
  //    GET /v2/post/publish/status/fetch/?publish_id=...
  //    Until status = PUBLISH_COMPLETE
  // 6. Update Clip in DB:
  //    publishedTo.tiktok = { id, url, postedAt }
}
```

Caption format:
- Hook text + hashtags
- Auto-generate hashtags from moment type + product (if synced)
- Example: "ตะกร้าเปิดแล้ว ใครอยากได้กดเลข 1 เลย! 🔥 #livecommerce #ขายของออนไลน์ #cf"

Error handling:
- Rate limit: retry with backoff
- Token expired: auto-refresh
- Upload failed: retry once
- Publish failed: notify user, save error

Tests:
- Test in TikTok Sandbox first
- Verify caption + hashtags appear correctly
- Verify video plays correctly (no audio sync issues)
```

### 🎯 7.2 Facebook + Instagram Publishing

```
ช่วย implement Facebook + Instagram Reels publishing

Setup:
- Facebook App with Pages + Instagram Business Login
- Permissions: pages_show_list, pages_read_engagement, instagram_basic, instagram_content_publish

Facebook Pages publishing:

```typescript
async function publishToFacebookPage(
  clip: Clip,
  pageId: string,
  pageAccessToken: string
): Promise<PublishResult> {
  // POST /{page-id}/videos
  // Multipart: source=<file>, description=<text>
}
```

Instagram Reels publishing:

```typescript
async function publishToInstagramReels(
  clip: Clip,
  igUserId: string,
  accessToken: string
): Promise<PublishResult> {
  // 1. Create container:
  //    POST /{ig-user-id}/media
  //    Body: { media_type: 'REELS', video_url, caption, cover_url }
  // 2. Wait for container status = FINISHED
  // 3. Publish:
  //    POST /{ig-user-id}/media_publish
  //    Body: { creation_id }
}
```

Cross-posting strategy:
- One clip → multiple platforms in parallel
- Optimize caption per platform:
  - TikTok: hashtags-heavy
  - Instagram: balanced + emoji
  - Facebook: longer description OK

Scheduling:
- Allow user to schedule publish
- Cron job ใน worker check every minute for scheduled clips
- Publish at scheduled time
```

---

## Phase 8: Payment & Billing

### 🎯 8.1 Setup Omise Integration

```
ช่วย integrate Omise สำหรับ Thai payment

Setup:
1. Register Omise account
2. Get Public Key + Secret Key (test mode)
3. Install omise-node SDK

Implementation:

ใน apps/api/src/routes/billing.ts:

1. GET /api/billing/plans
   - Return available plans + pricing

2. POST /api/billing/subscribe
   - Input: { planId, paymentMethod: 'card' | 'promptpay' | 'truemoney' }
   - Create Omise customer if not exists
   - Charge or create source for installment
   - Update user.plan, user.creditsMinutes, user.creditsResetAt

3. POST /api/billing/cancel
   - Cancel subscription
   - Plan continues until period end

4. POST /api/webhooks/omise
   - Handle: charge.complete, charge.failed, source.complete
   - Update billing state

UI ใน apps/web/dashboard/settings/billing:
- Show current plan + usage progress bar
- Upgrade/downgrade buttons
- Payment method selector:
  - Credit/Debit Card (Omise Cards)
  - PromptPay QR code
  - TrueMoney Wallet
- Invoice history

Tax invoice (ภ.พ.20):
- For business customers
- Collect: company name, address, tax ID
- Generate PDF invoice on each payment
- Email to billing email

Tests:
- Use Omise test cards (4242 4242 4242 4242, etc.)
- Test PromptPay QR generation
- Test webhook delivery (use ngrok locally)
```

### 🎯 8.2 Usage Tracking & Quota Enforcement

```
ช่วยสร้าง quota tracking system

Tasks:

1. Track usage per Live processing
   - When job completes: log to UsageLog
   - Deduct from user.creditsMinutes

2. Quota check before processing
   - Middleware ใน /api/lives/upload-url
   - If creditsMinutes < estimated duration → return 402 Payment Required
   - Frontend: show upgrade modal

3. Monthly reset
   - Cron job (1st of month) reset creditsMinutes per plan
   - Track via creditsResetAt

4. Overage billing (for Pro+ plans)
   - When user exceeds quota:
     - Free: hard block
     - Starter: hard block
     - Pro: allow overage at 10฿/hr
     - Business: allow overage at 8฿/hr
   - Charge end of month

5. UI:
- Dashboard widget: "ใช้ไปแล้ว 12/20 ชั่วโมง"
- Email alert at 80% usage
- Email alert at 100% usage

Database:

```prisma
model UsageLog {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  minutesUsed   Float
  liveStreamId  String?
  type          UsageType  // PROCESSING | OVERAGE
  createdAt     DateTime @default(now())
  @@index([userId, createdAt])
}
```
```

---

## Phase 9: Analytics & Monitoring

### 🎯 9.1 Product Analytics Dashboard

```
ช่วยสร้าง analytics dashboard สำหรับ user

/dashboard/analytics:

Metrics ที่ show:
1. Performance Overview (last 30 days)
   - Total clips generated
   - Total clips published
   - Total views (sum across platforms)
   - Total engagement (likes + comments + shares)
   - Time saved (estimated)

2. Best Performing Clips
   - Top 10 clips by views
   - Show: thumbnail, hook, platform, metrics

3. Moment Type Performance
   - Chart: which moment type gets best engagement?
   - Help user prioritize content strategy

4. Platform Comparison
   - TikTok vs Facebook vs Instagram
   - Bar charts of avg views, engagement rate

5. Publishing Trends
   - Calendar heatmap of publishing activity
   - Best day/time for engagement

Implementation:
- Recharts for visualization
- Date range picker
- Export to CSV
- Real-time data from social platforms (refresh every 6 hours)

Background job: workers/analytics-fetcher/
- Cron: every 6 hours
- For each published clip:
  - Call TikTok/FB/IG Analytics API
  - Update Clip.analytics
```

### 🎯 9.2 Founder Dashboard (Internal)

```
ช่วยสร้าง internal admin dashboard

/admin (protected, founder-only):

Key Metrics:
1. Business Health
   - MRR / ARR
   - Active users (DAU, WAU, MAU)
   - New signups (today, week, month)
   - Churn rate
   - LTV / CAC

2. Product Health
   - Average AI moment accuracy
   - Processing success rate
   - Average processing time
   - GPU utilization

3. Cost Tracking
   - AI API costs (Gemini, OpenAI)
   - GPU rental costs (RunPod)
   - Storage costs (R2)
   - Cost per active user

4. User Health
   - Conversion funnel (signup → first clip → first publish → paid)
   - Retention cohorts
   - NPS scores
   - Support tickets

5. Alerts
   - Failed jobs > 5% → alert
   - Processing time > 60min → alert
   - Cost per user > 30฿ → alert
   - Churn spike → alert

Tech:
- PostHog for product analytics
- Custom queries to Supabase
- Sentry for errors
- Better Stack for uptime
```

---

## 🔄 Daily Workflow Commands

### Morning Standup with Claude

```
สรุปสิ่งที่ทำเมื่อวานและ priority วันนี้:
1. ดู git log จาก yesterday
2. ดู open issues / PRs
3. แนะนำ task ที่ควรทำต่อ priority สูงสุด
4. เช็คว่ามี blocker อะไรไหม
```

### Code Review

```
รีวิว PR นี้ให้หน่อย:
- Check code quality vs convention ใน CLAUDE.md
- Find potential bugs
- Suggest improvements
- ตรวจว่า test coverage พอไหม
- ดูว่า impact ต่อ performance / cost ไหม
```

### Refactor

```
ดู [file] แล้วช่วย refactor:
- ลด complexity
- แยก concerns
- เพิ่ม type safety
- คงไว้ behavior เดิม 100%
- เขียน test ก่อน refactor ถ้ายังไม่มี
```

### Add Feature

```
เพิ่ม feature: [description]

ทำตาม checklist:
1. ดู CLAUDE.md เพื่อ understand context
2. Check existing patterns ใน codebase
3. Design API + DB schema (if needed)
4. Implement backend
5. Implement frontend
6. Add tests
7. Update docs
8. Commit ด้วย conventional commits
```

### Write Tests

```
เขียน test สำหรับ [file/function]:
- Use Vitest
- Cover happy path + edge cases
- Mock external dependencies (DB, API calls)
- Test ใน isolation
- Aim 80%+ coverage สำหรับ business logic
```

---

## 🐛 Debugging Prompts

### Bug Investigation

```
มี bug: [description]

Steps to reproduce:
1. [step 1]
2. [step 2]
3. Expected: [...]
4. Actual: [...]

ช่วย:
1. Investigate root cause
2. หาว่า code ส่วนไหนผิด
3. แนะนำ fix
4. เขียน regression test
5. ตรวจสอบว่ามี bug ที่คล้ายกันที่อื่นไหม
```

### Performance Issue

```
[endpoint/page] ช้ามาก (X seconds)

ช่วย profile:
1. ดู query logs
2. Check N+1 queries
3. Check missing indexes
4. Check large payloads
5. Suggest caching strategy
6. Implement fix
```

### AI Cost Spike

```
Cost per Live สูงกว่าที่คาด (จริง X฿ vs ตั้งใจ Y฿)

ช่วย investigate:
1. ดู AI call logs
2. นับ tokens used per Live
3. หา redundant calls
4. แนะนำ caching strategy
5. ลดขนาด context ถ้าได้
6. พิจารณา smaller model สำหรับ first pass
```

---

## 🎓 Learning Prompts (สำหรับ Founder)

### Architecture Decision

```
ฉันคิดจะใช้ [option A] vs [option B] สำหรับ [problem]

ช่วยวิเคราะห์:
1. Pros/Cons ของแต่ละ
2. Trade-offs (cost, complexity, scalability)
3. Industry best practices
4. แนะนำ choice + reasoning
5. Document decision ใน CLAUDE.md → Decision Log
```

### Learn by Doing

```
อธิบาย [concept] ในบริบทของ ClipDee:
1. คืออะไร (high-level)
2. ทำไมเราต้องใช้
3. ใช้ที่ไหนใน codebase ของเรา
4. ตัวอย่าง code
5. Pitfalls ที่ต้องระวัง
```

---

## 📦 Project-Wide Commands

### Run All Tests
```bash
pnpm test
```

### Run Specific App
```bash
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter ai dev
```

### Database
```bash
pnpm db:migrate          # Apply migrations
pnpm db:studio           # Open Prisma Studio
pnpm db:seed             # Seed demo data
pnpm db:reset            # Reset DB (dev only!)
```

### Build for Production
```bash
pnpm build               # Build all apps
pnpm --filter web build  # Build only web
```

### Lint & Format
```bash
pnpm lint                # Check all
pnpm lint:fix            # Auto-fix
pnpm format              # Prettier all
```

### Generate Types
```bash
pnpm db:generate         # Regenerate Prisma client
pnpm types:check         # Type-check everything
```

---

## 🚦 Quick Start Sequence (Day 1)

วันแรกเริ่ม build:

```bash
# Terminal 1
mkdir clipdee && cd clipdee
# Copy CLAUDE.md + commands.md เข้ามา
git init
claude
```

ใน Claude Code, paste prompt แรก:
```
อ่าน CLAUDE.md ก่อน
แล้วเริ่ม Phase 1.1: Initialize Monorepo
```

แล้วทำตาม phases เรียงไปเรื่อยๆ ครับ

---

## 💡 Tips การใช้ Claude Code ให้คุ้ม

1. **อ้าง CLAUDE.md เสมอ** — เริ่มแต่ละ session ด้วย "อ่าน CLAUDE.md ก่อน"

2. **Decompose tasks** — แทนที่จะบอก "build dashboard" ให้แยกเป็น sub-tasks

3. **Show, don't tell** — ให้ตัวอย่าง expected output

4. **Commit ถี่ๆ** — ทุก feature ที่ทำเสร็จ commit ทันที (git diff ของ Claude ใหญ่ได้เร็ว)

5. **Test ก่อน merge** — ให้ Claude เขียน test แล้ว run ก่อน commit

6. **Save context** — ถ้า session ยาว ให้บอก Claude สรุปลง CLAUDE.md หรือ docs/

7. **Cost-aware** — Claude Code ใช้ tokens เยอะ จัด task size ให้พอดี

8. **Trust แต่ verify** — Review code Claude เขียน อย่า merge blind

---

**Happy Building! 🚀**

ถ้าติดที่ phase ไหน หรืออยากได้ prompt เพิ่ม — กลับมาถามได้เลย
