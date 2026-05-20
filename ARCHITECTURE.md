# 🏗️ ClipDee System Architecture

> เอกสารโครงสร้างระบบฉบับสมบูรณ์ — ครอบคลุม High-level architecture, data flow, infrastructure, security

---

## 📋 Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Architecture](#2-component-architecture)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [AI Pipeline Deep Dive](#4-ai-pipeline-deep-dive)
5. [Database Design](#5-database-design)
6. [API Design](#6-api-design)
7. [Infrastructure Topology](#7-infrastructure-topology)
8. [Security Architecture](#8-security-architecture)
9. [Scaling Strategy](#9-scaling-strategy)
10. [Cost Architecture](#10-cost-architecture)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          USERS / CLIENTS                          │
│  (แม่ค้า, Agency, MCN — ใช้งานผ่าน Web Browser หรือ Mobile)        │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE (CDN + DDoS + WAF)                   │
└─────────────────────────────┬────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│  ┌────────────────────┐         ┌────────────────────────────┐   │
│  │   FRONTEND          │         │   SOCIAL PLATFORMS         │   │
│  │  ─────────────      │         │  ─────────────────────     │   │
│  │  Next.js 15         │◀───────▶│  TikTok Login/Publish      │   │
│  │  (Vercel)           │  OAuth  │  Facebook Login/Publish    │   │
│  │                     │         │  Instagram Publish         │   │
│  │  - Landing          │         │  Shopee Live (future)      │   │
│  │  - Dashboard        │         │                            │   │
│  │  - Review UI        │         └────────────────────────────┘   │
│  │  - Settings         │                                          │
│  └─────────┬──────────┘                                          │
│            │                                                       │
│            │ HTTPS / WebSocket                                     │
│            ▼                                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  API GATEWAY (Fastify)                       │  │
│  │  ───────────────────────────────────────                    │  │
│  │  - Auth (JWT verify)                                         │  │
│  │  - Rate limiting (per user, per endpoint)                    │  │
│  │  - Input validation (Zod)                                    │  │
│  │  - Routing to services                                       │  │
│  │  - Error handling + logging                                  │  │
│  └────┬─────────────┬──────────────────┬─────────────────┬────┘  │
│       │             │                  │                 │       │
│       ▼             ▼                  ▼                 ▼       │
│  ┌────────┐  ┌──────────┐    ┌────────────────┐  ┌───────────┐  │
│  │SUPABASE│  │  REDIS   │    │  PYTHON AI     │  │  PAYMENT  │  │
│  │  ──    │  │  ──      │    │  SERVICE       │  │  ────     │  │
│  │ Postgres│  │ - Cache  │    │  (FastAPI)     │  │  Omise    │  │
│  │ + Auth │  │ - Queue  │    │  - Whisper     │  │  Webhooks │  │
│  │ + RLS  │  │ (BullMQ) │    │  - Gemini      │  │           │  │
│  │ + Vector│  │ - PubSub │    │  - Audio/Visual│  │           │  │
│  └────────┘  └────┬─────┘    └────────┬───────┘  └───────────┘  │
│                   │                   │                          │
└───────────────────┼───────────────────┼──────────────────────────┘
                    │                   │
                    ▼                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    PROCESSING LAYER                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              VIDEO PROCESSING WORKERS                       │  │
│  │  ──────────────────────────────────────────                │  │
│  │  - BullMQ workers (TypeScript)                              │  │
│  │  - FFmpeg pipeline                                          │  │
│  │  - GPU instances (RunPod / Vast.ai)                         │  │
│  │  - Auto-scale based on queue depth                          │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
│                         │                                          │
│  ┌──────────────────────┴─────────────────────────────────────┐  │
│  │              PUBLISHER WORKERS                              │  │
│  │  - Multi-platform publishing                                 │  │
│  │  - Scheduled posts                                           │  │
│  │  - Retry logic                                               │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       STORAGE LAYER                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              CLOUDFLARE R2 (Object Storage)                 │  │
│  │  Buckets:                                                   │  │
│  │  - clipdee-uploads     (raw lives, 30-day TTL)              │  │
│  │  - clipdee-clips       (processed clips, permanent)         │  │
│  │  - clipdee-thumbnails  (thumbnails)                         │  │
│  │  - clipdee-assets      (logos, captions, templates)         │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

           ┌──────────────────────────────────────────┐
           │       MONITORING & OBSERVABILITY          │
           │  - Sentry (Errors)                        │
           │  - Better Stack (Uptime)                  │
           │  - PostHog (Product Analytics)            │
           │  - Custom Dashboard (Business Metrics)    │
           └──────────────────────────────────────────┘
```

### 1.2 Service Boundaries

| Service | Responsibility | Tech | Deployment |
|---------|---------------|------|------------|
| **Web Frontend** | UI, OAuth flows, user interactions | Next.js 15 | Vercel |
| **API Gateway** | HTTP API, auth, rate limit, validation | Fastify (TS) | Coolify VPS |
| **AI Service** | ML inference (ASR, LLM, vision) | FastAPI (Python) | Coolify + GPU |
| **Video Workers** | FFmpeg processing, cut, reframe | Node.js | Coolify + GPU |
| **Publisher Workers** | Post to social platforms | Node.js | Coolify VPS |
| **Database** | Persistent data | PostgreSQL (Supabase) | Managed |
| **Queue/Cache** | Job queue, caching | Redis | Upstash / self-hosted |
| **Storage** | Video files | Cloudflare R2 | Managed |

---

## 2. Component Architecture

### 2.1 Frontend Architecture (Next.js 15)

```
┌──────────────────────────────────────────────────────┐
│                  Next.js 15 (App Router)              │
├──────────────────────────────────────────────────────┤
│                                                        │
│  Route Groups:                                         │
│  ┌───────────────┐  ┌─────────────────┐              │
│  │  (marketing)  │  │  (auth)         │              │
│  │  - /          │  │  - /login       │              │
│  │  - /pricing   │  │  - /signup      │              │
│  │  - /about     │  │  - /forgot      │              │
│  └───────────────┘  └─────────────────┘              │
│                                                        │
│  ┌──────────────────────────────────────────┐         │
│  │           (dashboard) [protected]          │         │
│  │  - /dashboard                              │         │
│  │  - /lives                                  │         │
│  │  - /lives/[id]/clips                       │         │
│  │  - /clips                                  │         │
│  │  - /analytics                              │         │
│  │  - /settings                               │         │
│  │  - /settings/billing                       │         │
│  │  - /settings/integrations                  │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  State Layers:                                         │
│  ┌───────────────────┐                                 │
│  │ Server Components │  → Direct DB access via API     │
│  │  (RSC)            │    Cached at edge               │
│  └───────────────────┘                                 │
│                                                        │
│  ┌───────────────────┐                                 │
│  │ React Query       │  → Server state, refetching     │
│  │ (TanStack Query)  │    Optimistic updates           │
│  └───────────────────┘                                 │
│                                                        │
│  ┌───────────────────┐                                 │
│  │ Zustand stores    │  → Client UI state only         │
│  │                   │    (modals, filters, etc.)      │
│  └───────────────────┘                                 │
│                                                        │
│  Real-time:                                            │
│  ┌──────────────────────────┐                          │
│  │ Supabase Realtime        │  → DB change subscriptions│
│  │ (Postgres LISTEN/NOTIFY) │    LiveStream status     │
│  └──────────────────────────┘                          │
└──────────────────────────────────────────────────────┘
```

### 2.2 Backend Architecture (Fastify API)

```
┌──────────────────────────────────────────────────────┐
│              API Gateway (Fastify)                    │
├──────────────────────────────────────────────────────┤
│                                                        │
│  Request Flow:                                         │
│                                                        │
│  HTTP Request                                          │
│       │                                                │
│       ▼                                                │
│  ┌────────────────┐                                    │
│  │  Plugins       │   ← CORS, Helmet, Rate Limit       │
│  └────────┬───────┘                                    │
│           ▼                                            │
│  ┌────────────────┐                                    │
│  │  Auth          │   ← Verify Supabase JWT            │
│  │  Middleware    │   ← Extract user_id                │
│  └────────┬───────┘                                    │
│           ▼                                            │
│  ┌────────────────┐                                    │
│  │  Schema        │   ← Zod validation                 │
│  │  Validation    │      (request body/query/params)   │
│  └────────┬───────┘                                    │
│           ▼                                            │
│  ┌────────────────┐                                    │
│  │  Route Handler │                                    │
│  └────────┬───────┘                                    │
│           ▼                                            │
│  ┌────────────────┐                                    │
│  │  Service Layer │   ← Business logic                 │
│  │                │   ← Calls to Prisma, Redis, AI     │
│  └────────┬───────┘                                    │
│           ▼                                            │
│  ┌────────────────┐                                    │
│  │  Response      │   ← Zod-validated response         │
│  │  Serialization │                                    │
│  └────────┬───────┘                                    │
│           ▼                                            │
│  HTTP Response                                         │
│                                                        │
│  Routes:                                               │
│  /api/auth/*         → Auth-related                    │
│  /api/lives/*        → Live stream CRUD                │
│  /api/clips/*        → Clip CRUD                       │
│  /api/jobs/*         → Background job status           │
│  /api/billing/*      → Subscription, payments          │
│  /api/webhooks/*     → External webhooks               │
│  /api/admin/*        → Founder dashboard               │
│                                                        │
└──────────────────────────────────────────────────────┘
```

### 2.3 AI Service Architecture (FastAPI)

```
┌──────────────────────────────────────────────────────┐
│             AI Service (FastAPI + Python)             │
├──────────────────────────────────────────────────────┤
│                                                        │
│  Endpoints:                                            │
│  ┌─────────────────────────────────────────┐         │
│  │ POST /ai/transcribe                       │         │
│  │   Body: { audioPath, language }           │         │
│  │   → Whisper transcription                 │         │
│  │   Returns: TranscriptResult               │         │
│  └─────────────────────────────────────────┘         │
│                                                        │
│  ┌─────────────────────────────────────────┐         │
│  │ POST /ai/analyze                          │         │
│  │   Body: { transcript, audioFeatures,      │         │
│  │           visualFeatures, comments }      │         │
│  │   → Moment detection + scoring            │         │
│  │   Returns: Moment[]                       │         │
│  └─────────────────────────────────────────┘         │
│                                                        │
│  ┌─────────────────────────────────────────┐         │
│  │ POST /ai/generate-hook                    │         │
│  │   Body: { transcript, momentType }        │         │
│  │   → Hook generation                       │         │
│  │   Returns: { hook, alternatives }         │         │
│  └─────────────────────────────────────────┘         │
│                                                        │
│  ┌─────────────────────────────────────────┐         │
│  │ POST /ai/extract-features                 │         │
│  │   Body: { videoPath }                     │         │
│  │   → Audio + Visual features               │         │
│  │   Returns: Features                       │         │
│  └─────────────────────────────────────────┘         │
│                                                        │
│  Services:                                             │
│  ┌──────────────────────────────────────┐             │
│  │  WhisperService                       │             │
│  │  - load model (large-v3)              │             │
│  │  - transcribe with timestamps         │             │
│  │  - Thai jargon dictionary boost       │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  ┌──────────────────────────────────────┐             │
│  │  GeminiService                        │             │
│  │  - Gemini 2.5 Flash client            │             │
│  │  - Structured output (JSON)           │             │
│  │  - Cost tracking                      │             │
│  │  - Retry with backoff                 │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  ┌──────────────────────────────────────┐             │
│  │  MomentClassifier                     │             │
│  │  - Sliding window over transcript     │             │
│  │  - Call Gemini with prompt            │             │
│  │  - Compute ClipDee Score              │             │
│  │  - Diversity filter                   │             │
│  │  - Boundary snapping                  │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  ┌──────────────────────────────────────┐             │
│  │  AudioAnalyzer (Librosa)              │             │
│  │  - RMS energy                         │             │
│  │  - Spectral centroid                  │             │
│  │  - Speech rate                        │             │
│  │  - Silence detection                  │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  ┌──────────────────────────────────────┐             │
│  │  VisualAnalyzer                       │             │
│  │  - Frame extraction (FFmpeg)          │             │
│  │  - Face detection (MediaPipe)         │             │
│  │  - Scene change detection             │             │
│  │  - Product detection (YOLOv8)         │             │
│  └──────────────────────────────────────┘             │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Diagrams

### 3.1 End-to-End: Live Upload to Published Clips

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│  USER    │       │ FRONTEND │       │   API    │
└────┬─────┘       └────┬─────┘       └────┬─────┘
     │                  │                  │
     │ 1. Upload .mp4   │                  │
     │─────────────────▶│                  │
     │                  │ 2. Get upload URL│
     │                  │─────────────────▶│
     │                  │                  │
     │                  │                  │ Create LiveStream
     │                  │                  │ (status: PENDING_UPLOAD)
     │                  │                  │
     │                  │  3. Signed URL    │
     │                  │◀─────────────────│
     │                  │                  │
     │ 4. Direct upload to R2              │
     │═══════════════════════════════════▶│
     │                                     │ ┌─────────┐
     │                                     │ │   R2    │
     │                                     │ └─────────┘
     │                  │                  │
     │                  │ 5. Notify complete                │
     │                  │─────────────────▶│
     │                  │                  │ Enqueue job
     │                  │                  │──────┐
     │                  │                  │      │
     │                  │                  │      ▼
     │                  │                  │  ┌─────────┐
     │                  │                  │  │ BULL_MQ │
     │                  │                  │  └────┬────┘
     │                  │                  │       │
     │                  │  6. Status: QUEUED       │
     │                  │◀─────────────────│       │
     │                  │                  │       │
     │ Real-time updates (Supabase Realtime)       │
     │◀═════════════════════════════════════│       │
                                                    │
                        ┌───────────────────────────┘
                        ▼
                  ┌─────────────┐
                  │ VIDEO WORKER│
                  └──────┬──────┘
                         │ 7. Download from R2
                         ▼
                  ┌─────────────┐
                  │  Pipeline   │
                  │             │
                  │  Stage 1:   │
                  │  Audio      │
                  │  extract    │
                  │  + frames   │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐    ┌─────────────┐
                  │  Stage 2:   │───▶│  AI Service │
                  │  Transcribe │    │  /transcribe│
                  │             │◀───│  (Whisper)  │
                  └──────┬──────┘    └─────────────┘
                         │
                         ▼
                  ┌─────────────┐    ┌─────────────┐
                  │  Stage 3:   │───▶│  AI Service │
                  │  Moment     │    │  /analyze   │
                  │  Detect     │◀───│  (Gemini)   │
                  │             │    └─────────────┘
                  │  Save       │    ┌─────────────┐
                  │  Moments    │───▶│ Supabase DB │
                  └──────┬──────┘    └─────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  Stage 4:   │
                  │  Cut clips  │    For each Moment
                  │  (FFmpeg)   │    score >= 65:
                  │  Reframe    │     - cut
                  │  Caption    │     - reframe 9:16
                  │  Thumbnail  │     - burn caption
                  └──────┬──────┘     - upload to R2
                         │
                         ▼
                  ┌─────────────┐    ┌─────────────┐
                  │  Stage 5:   │───▶│     R2      │
                  │  Upload     │    │  (clips)    │
                  │  outputs    │    └─────────────┘
                  └──────┬──────┘    ┌─────────────┐
                         │      ────▶│ Supabase DB │
                         │           │ (Clip)      │
                         │           └─────────────┘
                         ▼
                  ┌─────────────┐
                  │  Stage 6:   │
                  │  Notify     │ → Email + In-app
                  │  user       │
                  └─────────────┘

                         │
                         ▼
    ┌──────────┐                    ┌──────────┐
    │  USER    │  Reviews clips     │ FRONTEND │
    │          │───────────────────▶│  /clips  │
    │          │                    │          │
    │ Approve  │                    │          │
    │ Edit     │                    │          │
    │ Reject   │                    │          │
    └──────────┘                    └────┬─────┘
                                         │
                                         ▼
                                   ┌─────────┐
                                   │   API   │
                                   └────┬────┘
                                        │
                          Approve clip  │
                                        ▼
                                  ┌──────────┐
                                  │ Publisher│
                                  │ Worker   │
                                  └────┬─────┘
                                       │
                          ┌────────────┼────────────┐
                          ▼            ▼            ▼
                     ┌─────────┐  ┌─────────┐  ┌──────────┐
                     │ TIKTOK  │  │FACEBOOK │  │INSTAGRAM │
                     │   API   │  │   API   │  │   API    │
                     └─────────┘  └─────────┘  └──────────┘
```

### 3.2 Real-time Status Updates

```
┌──────────────┐                        ┌──────────────┐
│   FRONTEND   │                        │   SUPABASE   │
│              │                        │   REALTIME   │
└──────┬───────┘                        └──────┬───────┘
       │                                        │
       │ 1. Subscribe to LiveStream changes     │
       │    for user_id = current               │
       │───────────────────────────────────────▶│
       │                                        │
       │ 2. Acknowledge                         │
       │◀───────────────────────────────────────│
       │                                        │
       │                                        │
       │                  ┌──────────┐          │
       │                  │  WORKER  │          │
       │                  │  updates │          │
       │                  │  DB      │          │
       │                  └────┬─────┘          │
       │                       ▼                │
       │                                        │
       │                  ┌─────────────┐       │
       │                  │ TRIGGER:    │       │
       │                  │ NOTIFY      │       │
       │                  │ live_change │       │
       │                  └──────┬──────┘       │
       │                         │              │
       │                         ▼              │
       │ 3. Push update (WebSocket)             │
       │◀───────────────────────────────────────│
       │                                        │
       │ React Query invalidates query          │
       │ UI updates automatically               │
       │                                        │
```

---

## 4. AI Pipeline Deep Dive

### 4.1 Multi-Modal Analysis Pipeline

```
                    INPUT: Live Stream (.mp4, 4 hours)
                              │
                              ▼
        ┌──────────────────────────────────────────────┐
        │           PARALLEL EXTRACTION                  │
        │                                                │
        │  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
        │  │  AUDIO   │  │  VIDEO   │  │  COMMENTS  │  │
        │  │  TRACK   │  │  FRAMES  │  │  (if avail)│  │
        │  │  (.wav)  │  │  (1/2s)  │  │            │  │
        │  └────┬─────┘  └────┬─────┘  └──────┬─────┘  │
        └───────┼─────────────┼─────────────────┼──────┘
                ▼             ▼                 ▼
        ┌─────────────┐ ┌────────────┐  ┌─────────────┐
        │  WHISPER    │ │  VISUAL    │  │  COMMENT    │
        │  ASR        │ │  ANALYZER  │  │  ANALYZER   │
        │             │ │            │  │             │
        │  → Segments │ │ → Faces    │  │ → Density   │
        │  → Words    │ │ → Scenes   │  │ → Sentiment │
        │  → Timing   │ │ → Products │  │ → CF tags   │
        └──────┬──────┘ └─────┬──────┘  └──────┬──────┘
               │              │                 │
               └──────┬───────┴─────────────────┘
                      ▼
        ┌──────────────────────────────────────────┐
        │       FEATURE FUSION                       │
        │  Per 30-second sliding window:             │
        │  - transcript text                         │
        │  - audio_energy: float                     │
        │  - comment_density: float                  │
        │  - visual_change: float                    │
        │  - speaker_clarity: float                  │
        └──────────────┬───────────────────────────┘
                       ▼
        ┌──────────────────────────────────────────┐
        │   COMMERCE MOMENT CLASSIFIER (Gemini)     │
        │                                            │
        │   For each window:                         │
        │   - Send features to Gemini 2.5 Flash      │
        │   - Get: moment_type, confidence, hook     │
        │   - Output JSON                            │
        └──────────────┬───────────────────────────┘
                       ▼
        ┌──────────────────────────────────────────┐
        │       CLIPDEE SCORE COMPUTATION            │
        │                                            │
        │   Score = 0.30 × moment_type_weight        │
        │         + 0.25 × comment_density_score     │
        │         + 0.20 × audio_energy_score        │
        │         + 0.15 × visual_change_score       │
        │         + 0.10 × speaker_clarity_score     │
        └──────────────┬───────────────────────────┘
                       ▼
        ┌──────────────────────────────────────────┐
        │       POST-PROCESSING                      │
        │  1. Merge adjacent same-type windows       │
        │  2. Snap to sentence boundaries            │
        │  3. Min 15s, Max 60s per clip             │
        │  4. Diversity filter (no 5 CFs in a row)   │
        │  5. Score threshold: ≥ 65                 │
        │  6. Final ranking                          │
        └──────────────┬───────────────────────────┘
                       ▼
              OUTPUT: 10-30 Moments
              (sorted by ClipDee Score)
```

### 4.2 Moment Type Decision Tree

```
                  INCOMING WINDOW
                        │
                        ▼
            ┌───────────────────────┐
            │  Has CF triggers?     │
            │  ("กดเลข", "จอง")     │
            └─────┬─────────────────┘
                  │
              YES │       │ NO
                  ▼       ▼
              ┌─────┐  ┌──────────────────┐
              │ CF  │  │ Has price words? │
              └─────┘  └────┬─────────────┘
                            │
                       YES  │   NO
                            ▼   ▼
                  ┌──────────────┐  ┌──────────────────┐
                  │ PRICE_PROMO  │  │ Has urgency?     │
                  └──────────────┘  └────┬─────────────┘
                                          │
                                     YES  │   NO
                                          ▼   ▼
                                ┌─────────┐  ┌─────────────────┐
                                │ URGENCY │  │ Has question?   │
                                └─────────┘  └────┬────────────┘
                                                   │
                                              YES  │  NO
                                                   ▼  ▼
                                       ┌─────────────┐ ┌───────────────┐
                                       │ CUSTOMER_QA │ │ Visual change?│
                                       └─────────────┘ └────┬──────────┘
                                                            │
                                                       YES  │  NO
                                                            ▼  ▼
                                            ┌───────────────────┐ ┌─────────────────┐
                                            │ PRODUCT_SHOWCASE  │ │ Audio energy>0.8│
                                            └───────────────────┘ └────┬────────────┘
                                                                       │
                                                                  YES  │  NO
                                                                       ▼  ▼
                                                          ┌──────────────┐ ┌────────────────┐
                                                          │ REACTION_PEAK│ │ Has story words│
                                                          └──────────────┘ └────┬───────────┘
                                                                                │
                                                                          YES   │  NO
                                                                                ▼  ▼
                                                                   ┌──────────────┐ ┌──────┐
                                                                   │ STORYTELLING │ │ NONE │
                                                                   └──────────────┘ └──────┘
```

---

## 5. Database Design

### 5.1 Entity Relationship Diagram

```
┌───────────────────────────────┐
│            User                │
│ ─────────────────────────────  │
│ id              UUID PK         │
│ email           TEXT UNIQUE     │
│ name            TEXT?           │
│ plan            ENUM Plan       │
│ creditsMinutes  INT             │
│ creditsResetAt  TIMESTAMP       │
│ stripeCustomerId TEXT?          │
│ omiseCustomerId  TEXT?          │
│ createdAt       TIMESTAMP       │
│ updatedAt       TIMESTAMP       │
└──────────┬────────────────────┘
           │ 1
           │
           │ N
           ▼
┌───────────────────────────────┐         ┌──────────────────────────┐
│         LiveStream             │         │       SocialAccount       │
│ ─────────────────────────────  │         │ ────────────────────────  │
│ id              UUID PK         │         │ id          UUID PK       │
│ userId          UUID FK         │   N  1  │ userId      UUID FK       │
│ sourceUrl       TEXT?           │◀───────│ platform    ENUM          │
│ platform        ENUM Platform   │         │ accessToken TEXT          │
│ title           TEXT?           │         │ refreshToken TEXT?        │
│ durationSeconds INT             │         │ expiresAt   TIMESTAMP?    │
│ status          ENUM Status     │         │ metadata    JSONB         │
│ storageKey      TEXT            │         └──────────────────────────┘
│ metadata        JSONB           │
│ processedAt     TIMESTAMP?      │
│ createdAt       TIMESTAMP       │
└──────────┬────────────────────┘
           │ 1
           │
           │ N
           ▼
┌───────────────────────────────┐
│           Moment               │
│ ─────────────────────────────  │
│ id              UUID PK         │
│ liveStreamId    UUID FK         │
│ startTimeSec    FLOAT           │
│ endTimeSec      FLOAT           │
│ momentType      ENUM MomentType │
│ clipDeeScore    FLOAT (0-100)   │
│ transcript      TEXT            │
│ commentDensity  FLOAT?          │
│ audioEnergy     FLOAT           │
│ hookText        TEXT?           │
│ reasoning       TEXT?           │
│ embedding       VECTOR(768)?    │  ← pgvector
└──────────┬────────────────────┘
           │ 1
           │
           │ 1
           ▼
┌───────────────────────────────┐
│            Clip                │
│ ─────────────────────────────  │
│ id              UUID PK         │
│ momentId        UUID FK UNIQUE  │
│ liveStreamId    UUID FK         │
│ userId          UUID FK         │
│ outputKey       TEXT            │
│ thumbnailKey    TEXT?           │
│ captionText     TEXT            │
│ durationSec     FLOAT           │
│ status          ENUM ClipStatus │
│ publishedTo     JSONB           │
│ analytics       JSONB           │
│ createdAt       TIMESTAMP       │
│ updatedAt       TIMESTAMP       │
└───────────────────────────────┘


┌───────────────────────────────┐
│         UsageLog               │
│ ─────────────────────────────  │
│ id              UUID PK         │
│ userId          UUID FK         │
│ minutesUsed     FLOAT           │
│ liveStreamId    UUID FK?        │
│ type            ENUM            │
│ createdAt       TIMESTAMP       │
└───────────────────────────────┘


┌───────────────────────────────┐
│       Subscription             │
│ ─────────────────────────────  │
│ id              UUID PK         │
│ userId          UUID FK         │
│ plan            ENUM Plan       │
│ status          ENUM            │
│ currentPeriodStart TIMESTAMP    │
│ currentPeriodEnd   TIMESTAMP    │
│ cancelAtPeriodEnd  BOOL         │
│ omiseSubscriptionId TEXT?       │
└───────────────────────────────┘
```

### 5.2 Index Strategy

```sql
-- High-frequency queries

-- 1. Get user's lives (paginated)
CREATE INDEX idx_livestream_user_created
  ON "LiveStream" (userId, createdAt DESC);

-- 2. Get user's clips by status
CREATE INDEX idx_clip_user_status
  ON "Clip" (userId, status, createdAt DESC);

-- 3. Get moments for a live (ordered by time)
CREATE INDEX idx_moment_livestream_time
  ON "Moment" (liveStreamId, startTimeSec);

-- 4. Monthly usage aggregation
CREATE INDEX idx_usage_user_created
  ON "UsageLog" (userId, createdAt);

-- 5. Vector similarity search (for RAG / similar moments)
CREATE INDEX idx_moment_embedding
  ON "Moment" USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### 5.3 Row Level Security (RLS)

```sql
-- Users can only see their own data

CREATE POLICY "user_isolation_lives"
  ON "LiveStream" FOR ALL
  USING (auth.uid()::text = "userId"::text);

CREATE POLICY "user_isolation_clips"
  ON "Clip" FOR ALL
  USING (auth.uid()::text = "userId"::text);

CREATE POLICY "user_isolation_usage"
  ON "UsageLog" FOR SELECT
  USING (auth.uid()::text = "userId"::text);

-- Service role bypasses RLS for system operations
-- (workers, admin dashboard)
```

---

## 6. API Design

### 6.1 RESTful Endpoint Catalog

```
AUTH
  POST   /api/auth/signup
  POST   /api/auth/login
  POST   /api/auth/logout
  POST   /api/auth/forgot-password
  POST   /api/auth/reset-password
  GET    /api/auth/me

LIVES
  POST   /api/lives/upload-url      → { uploadUrl, liveStreamId }
  POST   /api/lives/:id/complete    → trigger processing
  GET    /api/lives                 → list (paginated)
  GET    /api/lives/:id             → details
  DELETE /api/lives/:id             → cascade delete
  POST   /api/lives/:id/reprocess   → retry processing

MOMENTS
  GET    /api/lives/:id/moments     → all moments for live

CLIPS
  GET    /api/clips                 → list user's clips (filters)
  GET    /api/clips/:id             → details
  PATCH  /api/clips/:id             → update (status, caption, hook)
  POST   /api/clips/:id/approve     → mark approved
  POST   /api/clips/:id/reject      → mark rejected
  POST   /api/clips/:id/publish     → enqueue publish job
  POST   /api/clips/:id/regenerate  → re-process with new params
  DELETE /api/clips/:id

JOBS
  GET    /api/jobs/:id              → status
  POST   /api/jobs/:id/cancel

INTEGRATIONS
  GET    /api/integrations          → list connected platforms
  POST   /api/integrations/connect/:platform   → OAuth start
  GET    /api/integrations/callback/:platform  → OAuth callback
  DELETE /api/integrations/:id      → disconnect

BILLING
  GET    /api/billing/plans
  GET    /api/billing/subscription  → current sub
  POST   /api/billing/subscribe
  POST   /api/billing/cancel
  POST   /api/billing/upgrade
  GET    /api/billing/invoices

ANALYTICS
  GET    /api/analytics/overview     → 30-day summary
  GET    /api/analytics/clips        → clip performance
  GET    /api/analytics/platforms    → cross-platform

WEBHOOKS
  POST   /api/webhooks/omise         → payment events
  POST   /api/webhooks/tiktok        → publish status
  POST   /api/webhooks/facebook
```

### 6.2 Response Format Standard

```typescript
// Success
{
  "data": { ... },
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 145
  }
}

// Error
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "เครดิตหมดแล้ว — อัพเกรดเพื่อใช้งานต่อ",
    "details": {
      "used": 240,
      "limit": 240,
      "resetAt": "2026-06-01T00:00:00Z"
    }
  }
}
```

---

## 7. Infrastructure Topology

### 7.1 Production Deployment

```
                  ┌─────────────────┐
                  │  Cloudflare DNS │
                  │   clipdee.ai    │
                  └────────┬────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
      ┌───────────┐  ┌──────────┐  ┌───────────┐
      │  Vercel   │  │ Coolify  │  │ Coolify   │
      │  (Web)    │  │  (API)   │  │ (AI Svc)  │
      └───────────┘  └──────────┘  └───────────┘
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                  ┌─────────────────┐
                  │   Supabase      │
                  │   (Postgres)    │
                  └─────────────────┘
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
            ┌──────────┐     ┌──────────┐
            │ Upstash  │     │   R2     │
            │ Redis    │     │ Storage  │
            └──────────┘     └──────────┘
                  │
                  ▼
            ┌──────────────────────┐
            │  RunPod / Vast.ai    │
            │  GPU Workers         │
            │  (auto-scaled)       │
            └──────────────────────┘
```

### 7.2 Environment Tiers

| Tier | Purpose | Database | Storage | GPU |
|------|---------|----------|---------|-----|
| **Local** | Dev | Local Postgres / Supabase Local | MinIO | None / CPU-only |
| **Staging** | Pre-prod testing | Supabase (separate project) | R2 (staging bucket) | RunPod (1 instance) |
| **Production** | Live | Supabase (prod) | R2 (prod) | RunPod (auto-scale 1-10) |

---

## 8. Security Architecture

### 8.1 Defense in Depth

```
┌──────────────────────────────────────────┐
│  LAYER 1: Network                          │
│  - Cloudflare WAF                          │
│  - DDoS protection                         │
│  - Bot management                          │
└─────────────────┬────────────────────────┘
                  ▼
┌──────────────────────────────────────────┐
│  LAYER 2: Application                      │
│  - Rate limiting (per IP, per user)        │
│  - Input validation (Zod)                  │
│  - SQL injection prevention (Prisma ORM)   │
│  - XSS prevention (React escaping)         │
│  - CSRF tokens                             │
└─────────────────┬────────────────────────┘
                  ▼
┌──────────────────────────────────────────┐
│  LAYER 3: Authentication                   │
│  - Supabase Auth (JWT)                     │
│  - OAuth 2.0 for social platforms          │
│  - 2FA (optional, opt-in)                  │
│  - Session management                      │
└─────────────────┬────────────────────────┘
                  ▼
┌──────────────────────────────────────────┐
│  LAYER 4: Authorization                    │
│  - Row Level Security (RLS) in Postgres    │
│  - Plan-based access control               │
│  - Resource ownership verification         │
└─────────────────┬────────────────────────┘
                  ▼
┌──────────────────────────────────────────┐
│  LAYER 5: Data                             │
│  - Encryption at rest (Supabase)           │
│  - Encryption in transit (TLS 1.3)         │
│  - Secrets management (Vercel/Coolify env) │
│  - R2 signed URLs (1-hour expiry)          │
│  - PII handling per PDPA                   │
└──────────────────────────────────────────┘
```

### 8.2 Sensitive Data Handling

| Data | Storage | Encryption | Retention |
|------|---------|-----------|-----------|
| Password | Supabase Auth (bcrypt) | At rest + transit | Forever |
| OAuth tokens | DB (encrypted field) | AES-256 | Until revoked |
| Payment info | Omise (not stored locally) | PCI DSS compliant | Until revoked |
| Live recordings | R2 | At rest + transit | 30 days then auto-delete |
| Processed clips | R2 | At rest + transit | Until user deletes |
| User analytics | Supabase | At rest + transit | 24 months |
| Server logs | Better Stack | At rest | 30 days |

---

## 9. Scaling Strategy

### 9.1 Vertical Scaling (Initial)

```
Stage 0 (M1-3): MVP
- 1x VPS (4 CPU, 8GB RAM): API + Workers
- Supabase free tier
- 1x GPU instance on-demand
- 0-100 users

Stage 1 (M4-6): Beta
- Same VPS upgraded (8 CPU, 16GB RAM)
- Supabase Pro
- 2x GPU instances (peak)
- 100-1,000 users

Stage 2 (M7-12): Growth
- 2x API VPS (load balanced)
- 2x Worker VPS
- 5x GPU instances (auto-scale)
- Read replicas for DB
- 1,000-10,000 users
```

### 9.2 Horizontal Scaling (Later)

```
Stage 3 (Year 2+): Scale
- Kubernetes cluster (k8s on Coolify or migrate to GKE/EKS)
- Multi-region (TH, ID, VN)
- Read replicas per region
- GPU pool with smart routing
- CDN for video delivery
- 10,000-100,000 users

Bottlenecks to watch:
1. GPU availability (RunPod) → multi-provider
2. Database connections → PgBouncer
3. Storage costs → Tiered storage (cold archive)
4. Gemini API rate limits → batch + cache
```

### 9.3 Cost Scaling

```
Per-User Cost (Monthly):

Free User (loss leader):
- Storage: ~1฿/mo
- AI processing: 42฿/Live × 2 Lives = 84฿
- Total cost: ~85฿/mo
- Revenue: 0฿
- Loss: 85฿ (acquisition cost)

Starter User:
- Storage: ~5฿/mo
- AI processing: 42฿ × 5 = 210฿
- Total cost: 215฿
- Revenue: 399฿
- Margin: 184฿ (46%)

Pro User:
- Storage: ~15฿/mo
- AI processing: 42฿ × 15 = 630฿
- Total cost: 645฿
- Revenue: 1,490฿
- Margin: 845฿ (57%)
```

---

## 10. Cost Architecture

### 10.1 Cost Breakdown by Service (Monthly)

```
                                        Month 6        Month 12       Month 24
                                        ───────       ────────       ────────
Compute (Coolify VPS)
  - API + Workers (1-2 VPS)              2,000฿        4,000฿        12,000฿
  - GPU on-demand (RunPod)               5,000฿       15,000฿        60,000฿

Managed Services
  - Supabase Pro                         1,000฿        1,000฿         5,000฿
  - Upstash Redis                          500฿        2,000฿         8,000฿
  - Cloudflare R2                        2,000฿        8,000฿        30,000฿
  - Vercel (Web)                             0฿        1,000฿         5,000฿

AI APIs
  - Gemini 2.5 Flash                     8,000฿       30,000฿       120,000฿
  - OpenAI fallback                        500฿        2,000฿         8,000฿

Other
  - Sentry, Better Stack                   500฿        1,500฿         3,000฿
  - PostHog                                  0฿        1,000฿         5,000฿
  - Email (Resend)                         300฿        1,000฿         3,000฿
  - Domain + misc                          500฿          500฿           500฿

──────────────────────────────────────────────────────────────────────────
TOTAL                                    20,300฿      67,000฿       259,500฿

Revenue at this stage                    82,500฿     487,500฿     2,625,000฿
Gross margin                             75.4%        86.3%         90.1%
```

### 10.2 Cost Optimization Strategies

1. **AI API Optimization**
   - Cache transcripts by audio hash (50%+ savings)
   - Batch moment classifier calls (reduce per-call overhead)
   - Use Gemini Flash over Pro (4x cheaper)
   - Smaller model for low-priority windows

2. **Compute Optimization**
   - Self-host Whisper (10x cheaper than OpenAI API at scale)
   - Spot instances for non-critical workers
   - Container right-sizing
   - GPU sharing for small jobs

3. **Storage Optimization**
   - Auto-delete raw uploads after 30 days
   - Compress clips with H.265 (Phase 2)
   - Lifecycle policies (cold storage for old clips)
   - R2 instead of S3 (no egress fees)

4. **Bandwidth Optimization**
   - CDN caching for processed clips
   - Adaptive bitrate streaming
   - Lazy load thumbnails

---

## 📚 Related Documents

- **[CLAUDE.md](./CLAUDE.md)** — Project context for Claude Code
- **[commands.md](./commands.md)** — Claude Code prompts library
- **[docs/api.md](./docs/api.md)** — Detailed API reference (TBD)
- **[docs/commerce-moments.md](./docs/commerce-moments.md)** — Moment type specs (TBD)
- **[docs/deployment.md](./docs/deployment.md)** — Production runbook (TBD)

---

**Last Updated:** 2026-05-20
**Author:** BankOver / Claude Collaboration
**Version:** 1.0
