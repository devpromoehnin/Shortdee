# ClipDee — AI Live-to-Shorts for Thai Live Commerce

> **Project Codename:** ClipDee (คลิปดี)
> **Company:** StateWave Technologies Co., Ltd.
> **Mission:** เปลี่ยน Live ขายของไทยให้เป็น Short ขายดี ผ่าน AI ที่เข้าใจ Commerce Context

---

## 🎯 Project Overview

ClipDee คือ AI SaaS ที่รับ Live Stream (TikTok Live, Facebook Live, Shopee Live) มาวิเคราะห์ด้วย Multimodal AI เพื่อจับ "Commerce Moment" 7 ประเภท แล้วตัดออกมาเป็น Short Video พร้อม Caption ภาษาไทย + Auto-Reframe 9:16 และโพสต์ได้ทุกแพลตฟอร์ม

### Core Value Proposition
- **Live 4 ชั่วโมง → 10-30 clips พร้อมโพสต์ ใน 30 นาที**
- **Thai-native AI** ที่เข้าใจ Live Commerce jargon ("CF", "กดเลข 1", "ตะกร้า")
- **ราคาเริ่มต้น 399฿/เดือน** (ถูกกว่าคู่แข่งสากล 3x)

### Direct Competitors
- Opus Clip ($29/mo, $20M ARR) — Generic, English-first
- Klap, Vizard, Submagic — Generic clipping tools
- Pippit (ByteDance) — Template-based, not live-focused

### Our Differentiator
**Commerce Moment Detection** — AI ที่ออกแบบมาเพื่อ Live Commerce ไทยโดยเฉพาะ จับ moment ที่ขายของได้จริง ไม่ใช่แค่ "energy peaks"

---

## 🏗️ System Architecture

```
USER (Web Browser)
    ↓ HTTPS
Cloudflare CDN
    ↓
Next.js Frontend (Vercel)
    ↓
API Gateway (Fastify) — Auth, Rate Limit
    ↓
┌─────────────┬──────────────┬──────────────┐
│  Supabase   │   BullMQ     │  Python AI   │
│  Postgres   │   (Redis)    │   FastAPI    │
│  + pgvector │              │              │
└─────────────┴──────┬───────┴──────┬───────┘
                    ↓               ↓
            ┌───────────────────────────────┐
            │   Video Processing Workers    │
            │   (GPU: RunPod / Vast.ai)     │
            │   FFmpeg + Whisper + Gemini   │
            └───────────────┬───────────────┘
                            ↓
                ┌───────────────────────┐
                │  Cloudflare R2 Store  │
                └───────────────────────┘
```

---

## 📁 Project Structure

```
clipdee/
├── apps/
│   ├── web/                    # Next.js frontend (App Router)
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, signup
│   │   │   ├── (dashboard)/    # Main app
│   │   │   │   ├── lives/      # Live streams list
│   │   │   │   ├── clips/      # Clips management
│   │   │   │   ├── analytics/  # Performance dashboard
│   │   │   │   └── settings/
│   │   │   ├── (marketing)/    # Landing, pricing
│   │   │   └── api/            # API routes (light only)
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── clip-preview/   # Video preview player
│   │   │   ├── timeline/       # Moment timeline editor
│   │   │   └── shared/
│   │   ├── lib/
│   │   │   ├── supabase/       # Supabase clients
│   │   │   ├── api/            # API client wrapper
│   │   │   └── utils/
│   │   └── stores/             # Zustand stores
│   │
│   ├── api/                    # Fastify API gateway (Node.js)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── lives.ts    # Live stream CRUD
│   │   │   │   ├── clips.ts    # Clips CRUD
│   │   │   │   ├── jobs.ts     # Processing jobs
│   │   │   │   └── webhooks.ts # Payment, social platforms
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   └── plugins/
│   │   └── package.json
│   │
│   └── ai/                     # Python AI service (FastAPI)
│       ├── app/
│       │   ├── routers/
│       │   │   ├── transcribe.py
│       │   │   ├── analyze.py
│       │   │   └── classify.py
│       │   ├── services/
│       │   │   ├── whisper_service.py
│       │   │   ├── gemini_service.py
│       │   │   ├── moment_classifier.py
│       │   │   ├── audio_analyzer.py
│       │   │   └── visual_analyzer.py
│       │   ├── prompts/
│       │   │   └── commerce_moments.py
│       │   └── models/
│       └── requirements.txt
│
├── workers/                    # Background job workers
│   ├── video-processor/        # FFmpeg pipeline
│   │   ├── src/
│   │   │   ├── pipeline.ts
│   │   │   ├── transcribe.ts
│   │   │   ├── detect-moments.ts
│   │   │   ├── cut-clips.ts
│   │   │   ├── reframe.ts
│   │   │   ├── caption.ts
│   │   │   └── upload.ts
│   │   └── Dockerfile
│   │
│   └── publisher/              # Multi-platform publisher
│       ├── src/
│       │   ├── tiktok.ts
│       │   ├── facebook.ts
│       │   └── youtube.ts
│       └── Dockerfile
│
├── packages/                   # Shared packages
│   ├── database/               # Prisma schema + migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # Shared UI components
│   └── config/                 # Shared configs (ESLint, TS, etc.)
│
├── infra/                      # Infrastructure as code
│   ├── docker-compose.yml      # Local development
│   ├── coolify/                # Coolify deploy configs
│   └── scripts/
│
├── docs/                       # Documentation
│   ├── architecture.md
│   ├── api.md
│   ├── deployment.md
│   └── commerce-moments.md     # Moment types definition
│
├── .env.example
├── package.json                # Monorepo root (pnpm workspace)
├── turbo.json                  # Turborepo config
├── CLAUDE.md                   # This file
└── README.md
```

---

## 🛠️ Tech Stack (Confirmed)

### Frontend (`apps/web`)
- **Framework:** Next.js 15 (App Router, React Server Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand (client) + React Query (server cache)
- **Forms:** React Hook Form + Zod
- **Video Player:** Video.js / HLS.js
- **Charts:** Recharts
- **Icons:** lucide-react

### Backend API (`apps/api`)
- **Framework:** Fastify (Node.js, faster than Express)
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Validation:** Zod
- **Auth:** Supabase Auth + JWT verification

### AI Service (`apps/ai`)
- **Framework:** FastAPI (Python 3.11+)
- **ASR:** OpenAI Whisper Large-v3 (self-hosted) + OpenAI API (fallback)
- **LLM:** Gemini 2.5 Flash (multimodal) via google-genai SDK
- **Audio:** Librosa
- **Vision:** MediaPipe + YOLOv8

### Workers (`workers/*`)
- **Language:** TypeScript (Node.js)
- **Queue:** BullMQ (Redis)
- **Video:** FFmpeg (via fluent-ffmpeg)
- **Container:** Docker

### Infrastructure
- **Database:** Supabase (Postgres 15 + pgvector)
- **Storage:** Cloudflare R2 (S3-compatible, no egress fees)
- **Cache/Queue:** Redis (Upstash for managed, or self-hosted)
- **CDN:** Cloudflare
- **Deployment:**
  - Frontend → Vercel
  - API → Coolify (self-hosted VPS) or Railway
  - Workers → Coolify / RunPod (GPU)
- **Monitoring:** Sentry + Better Stack (Uptime)
- **Analytics:** PostHog (self-hosted later)

### Payment (Thailand-focused)
- **Primary:** Omise (Thai gateway, supports PromptPay, TrueMoney, credit cards)
- **Secondary:** Stripe (international + future SEA expansion)

---

## 🗄️ Database Schema (Prisma)

```prisma
// Core models — see packages/database/schema.prisma for full

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  name            String?
  plan            Plan     @default(FREE)
  creditsMinutes  Int      @default(240) // free tier: 4hr
  creditsResetAt  DateTime
  createdAt       DateTime @default(now())
  liveStreams     LiveStream[]
  clips           Clip[]
}

enum Plan {
  FREE
  STARTER     // 399 THB / 20hr
  PRO         // 1490 THB / 60hr
  BUSINESS    // 4990 THB / 200hr
  ENTERPRISE  // custom
}

model LiveStream {
  id               String         @id @default(uuid())
  userId           String
  user             User           @relation(fields: [userId], references: [id])
  sourceUrl        String?
  platform         Platform       // TIKTOK | FACEBOOK | SHOPEE | UPLOAD
  title            String?
  durationSeconds  Int
  status           ProcessStatus  // QUEUED | PROCESSING | DONE | FAILED
  storageKey       String         // R2 object key
  metadata         Json           // platform-specific
  moments          Moment[]
  clips            Clip[]
  createdAt        DateTime       @default(now())
  processedAt      DateTime?
}

model Moment {
  id              String       @id @default(uuid())
  liveStreamId    String
  liveStream      LiveStream   @relation(fields: [liveStreamId], references: [id])
  startTimeSec    Float
  endTimeSec      Float
  momentType      MomentType   // CF | SHOWCASE | QA | PROMO | STORY | URGENCY | REACTION
  clipDeeScore    Float        // 0-100
  transcript      String       @db.Text
  commentDensity  Float?
  audioEnergy     Float
  hookText        String?
  reasoning       String?      @db.Text
  embedding       Unsupported("vector(768)")?  // for RAG
  clip            Clip?
}

enum MomentType {
  CF
  PRODUCT_SHOWCASE
  CUSTOMER_QA
  PRICE_PROMO
  STORYTELLING
  URGENCY
  REACTION_PEAK
}

model Clip {
  id              String       @id @default(uuid())
  momentId        String       @unique
  moment          Moment       @relation(fields: [momentId], references: [id])
  liveStreamId    String
  liveStream      LiveStream   @relation(fields: [liveStreamId], references: [id])
  userId          String
  user            User         @relation(fields: [userId], references: [id])
  outputKey       String       // R2 key
  thumbnailKey    String?
  captionText     String       @db.Text
  durationSec     Float
  status          ClipStatus   // DRAFT | APPROVED | PUBLISHED | REJECTED
  publishedTo     Json         // { tiktok: { id, url, postedAt }, facebook: {...} }
  analytics       Json         // { views, likes, comments, shares }
  createdAt       DateTime     @default(now())
}

enum ClipStatus {
  DRAFT
  APPROVED
  PUBLISHED
  REJECTED
}

model UsageLog {
  id              String   @id @default(uuid())
  userId          String
  minutesUsed     Float
  liveStreamId    String?
  createdAt       DateTime @default(now())
}
```

---

## 🧠 Commerce Moment Classifier (Core IP)

ระบบหัวใจของ ClipDee — LLM-based classifier ที่จับ 7 ประเภท moment ในบริบท Live Commerce ไทย

### Moment Types

| Type | คำอธิบาย | Triggers | Score Weight |
|------|---------|----------|--------------|
| `CF` | Customer confirms order | "กดเลข 1", "จองค่ะ", "CF", "ตะกร้าเปิด" | ★★★★★ |
| `PRODUCT_SHOWCASE` | แสดงสินค้า | "ตัวนี้นะคะ", "เห็นไหมว่า", visual product change | ★★★★★ |
| `CUSTOMER_QA` | ตอบคำถามลูกค้า | "ลูกค้าถามว่า", "พี่...ถามมา" | ★★★★ |
| `PRICE_PROMO` | เปิดเผยราคา/โปร | "ลดเหลือ", "พิเศษ", "แถม" | ★★★★ |
| `STORYTELLING` | เล่าเรื่องสินค้า | "ที่มาของ", "ตอนแรก..." | ★★★ |
| `URGENCY` | สร้างความเร่งด่วน | "เหลือ X ตัว", "หมดเขต" | ★★★★ |
| `REACTION_PEAK` | หัวเราะ ตกใจ ดราม่า | audio energy spike, comment density spike | ★★★ |

### ClipDee Score Formula

```
ClipDee Score = (0.30 × Moment Type Weight)
              + (0.25 × Comment Density Score)
              + (0.20 × Audio Energy Score)
              + (0.15 × Visual Change Score)
              + (0.10 × Speaker Clarity Score)

Range: 0-100
Threshold: ≥65 = auto-clip candidate
```

### Prompt Template (Gemini 2.5 Flash)

ดูใน `apps/ai/app/prompts/commerce_moments.py`

---

## 💰 Pricing Model

| Plan | Price (THB/mo) | Lives Cap | Hours Cap | Target |
|------|---------------|-----------|-----------|--------|
| Free | 0 | 1 | 4hr | Trial |
| Starter | 399 | 5 | 20hr | Solo seller |
| Pro | 1,490 | 15 | 60hr | Pro seller |
| Business | 4,990 | 50 | 200hr | Agency / Brand |
| Enterprise | Custom | Unlimited | Unlimited | MCN / large brand |
| Overage | — | — | +10฿/hr | Above cap |

**Cost per Live (4hr):** ≈ 42 THB
**Pro plan Gross Margin:** 58%

---

## 🎨 Brand Guidelines

### Identity
- **Name:** ClipDee (คลิปดี)
- **Tagline:** "เปลี่ยน Live ขายของให้เป็น Short ขายดี"

### Color Palette
```css
--primary: #FF4D6D;      /* energetic, commerce urgency */
--secondary: #1F3A5F;    /* navy — trust */
--accent: #FFB800;       /* premium yellow */
--bg: #F8F9FA;
--text: #2D3748;
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
```

### Typography
- **Headings:** Sarabun (Thai-friendly, modern)
- **Body:** Sarabun / Inter
- **Code:** JetBrains Mono / Fira Code

### Voice & Tone
- เป็นกันเอง ตรงไปตรงมา (เหมือนเพื่อนที่ฉลาด)
- เน้น outcome (ยอดขายเพิ่ม, เวลาประหยัด) ไม่ใช่ technology jargon
- ห้ามใช้ corporate-speak

---

## 📐 Coding Conventions

### General
- **TypeScript strict mode** ทุก project
- **ESLint + Prettier** ตั้งค่าแล้วใน `packages/config`
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.)
- **English code, English comments** สำหรับ technical
- **Thai comments OK** สำหรับ business logic / domain-specific

### Naming
- **Files:** kebab-case (`live-stream-processor.ts`)
- **Components:** PascalCase (`ClipPreview.tsx`)
- **Functions:** camelCase (`processLiveStream`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_CLIP_DURATION`)
- **Types/Interfaces:** PascalCase (`LiveStream`, `MomentType`)
- **DB tables:** snake_case (Prisma handles mapping)

### Component Structure (React)
```tsx
// 1. Imports (grouped: react, libs, local)
// 2. Types
// 3. Constants
// 4. Component
// 5. Sub-components (if any)
// 6. Helpers

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Clip } from '@/types'

interface ClipCardProps {
  clip: Clip
  onApprove: (id: string) => void
}

export function ClipCard({ clip, onApprove }: ClipCardProps) {
  // hooks
  // handlers
  // render
}
```

### API Routes (Fastify)
- ทุก route ต้องมี Zod schema สำหรับ request + response
- Error handling ผ่าน Fastify error handler (consistent format)
- Rate limiting ที่ gateway level

### Database
- ทุก migration ต้อง reversible
- ห้าม raw SQL ใน app code (ใช้ Prisma)
- pgvector queries ใช้ Prisma raw แต่ปิดใน service layer

---

## 🧪 Testing Strategy

### MVP Phase
- **Unit tests:** Vitest สำหรับ utility functions, business logic
- **Integration:** Test pipeline เต็มกับ recorded Live samples (10 ตัว)
- **Manual QA:** Dogfood ทุกวันก่อน beta

### Post-Beta
- **E2E:** Playwright สำหรับ critical flows (signup → upload → process → publish)
- **AI Quality Tests:** Eval suite วัด moment detection accuracy
- **Load tests:** k6 สำหรับ video processing pipeline

---

## 🚀 Development Workflow

### Local Setup
```bash
# 1. Clone & install
git clone <repo>
cd clipdee
pnpm install

# 2. Setup env
cp .env.example .env.local
# Fill: SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY, etc.

# 3. Start services
docker compose up -d  # Redis, local Supabase (optional)
pnpm dev              # Turborepo runs all apps

# 4. Database
pnpm db:migrate
pnpm db:seed          # demo data
```

### Branch Strategy
- `main` → production
- `develop` → staging
- `feat/*`, `fix/*`, `chore/*` → feature branches
- PRs require: 1 review, all checks pass, conventional commit title

### Deployment
- `main` push → Vercel (frontend) + Coolify webhook (API + workers)
- Database migrations: manual via `pnpm db:deploy` (safety first)

---

## 📊 Key Metrics to Track

### North Star
**Weekly Active Clipped Lives (WACL)** — จำนวน Live ที่ผ่าน ClipDee ต่อสัปดาห์

### Product Metrics
- AI moment detection accuracy (target ≥ 85%)
- % clips approved without manual edit (target ≥ 50%)
- Processing time per 4hr Live (target < 30 min)
- Time from signup to first clip (target < 24hr)

### Business Metrics
- MRR / ARR
- Free → Paid conversion (target ≥ 5%)
- Monthly churn (target < 5% by M12)
- LTV / CAC (target > 5x)
- Gross margin (target > 60% by M12)

---

## 🔐 Security & Privacy

### Critical Rules
- **ห้าม commit secrets** ลง git (ใช้ .env, Vercel env, Coolify secrets)
- **PII encryption** at rest (Supabase handles)
- **R2 signed URLs** สำหรับ video access (expire 1hr)
- **Rate limiting** ทุก endpoint (โดยเฉพาะ AI calls)
- **Input validation** ด้วย Zod ทุก API route
- **User data deletion** within 30 days of account closure

### Compliance
- PDPA (Thailand Personal Data Protection Act)
- Terms of Service + Privacy Policy ที่ชัดเจน
- Platform policies (TikTok, Facebook, Shopee API)

---

## 📚 Key Documentation

| Doc | Location | Purpose |
|-----|----------|---------|
| Architecture | `docs/architecture.md` | System design deep-dive |
| API Reference | `docs/api.md` | Endpoint catalog |
| Commerce Moments | `docs/commerce-moments.md` | Moment type definitions + examples |
| Deployment | `docs/deployment.md` | Production runbook |
| Database Schema | `packages/database/schema.prisma` | Source of truth |

---

## 🎯 Current Phase: MVP (Month 1-3)

### Active Sprint Goals
- [ ] Setup monorepo (pnpm workspace + Turborepo)
- [ ] Setup Supabase project + schema
- [ ] Build core video processing pipeline (upload → transcribe → detect → cut)
- [ ] Build review dashboard (UI/UX)
- [ ] Internal testing with real Live recordings
- [ ] Achieve ≥75% moment detection accuracy

### Out of Scope (for now)
- Payment integration (Phase 1.5)
- Multi-account management (Phase 2)
- Mobile app (Phase 3)
- Podcast mode (Phase 2)
- SEA expansion (Year 2)

---

## 💡 Decision Log

Major architectural decisions documented here for future reference:

### 2026-05-20: Why Fastify over Express
- Faster (2-3x throughput)
- Better TypeScript support
- Built-in schema validation
- Smaller community OK because we're solo founder + AI

### 2026-05-20: Why self-host Whisper vs OpenAI API
- Cost: $0.10/hr vs $0.36/hr at scale
- Latency: lower in our region
- Privacy: customer Live data stays in our infra
- Trade-off: complexity of GPU management

### 2026-05-20: Why Gemini Flash over GPT-4o for moment detection
- Native multimodal (video understanding)
- Cheaper ($0.075/M tokens input)
- Better Thai language quality in our tests
- Trade-off: less mature ecosystem

### 2026-05-20: Why Cloudflare R2 over AWS S3
- No egress fees (huge for video CDN)
- S3-compatible API
- Cheaper storage ($0.015/GB vs $0.023/GB)
- Trade-off: smaller ecosystem of integrations

---

## 🆘 Common Tasks Cheatsheet

### Add a new moment type
1. Add to `enum MomentType` in `packages/database/schema.prisma`
2. Add to `apps/ai/app/prompts/commerce_moments.py` (prompt + examples)
3. Add weight in `apps/ai/app/services/moment_classifier.py`
4. Update `docs/commerce-moments.md`
5. Add test cases in `apps/ai/tests/test_classifier.py`

### Process a Live stream end-to-end (manual test)
```bash
# 1. Upload sample
pnpm cli upload --file=./samples/live-1.mp4 --user=demo@clipdee.ai

# 2. Trigger processing
pnpm cli process --live-id=<id>

# 3. View results
pnpm cli moments --live-id=<id>
```

### Deploy hotfix to production
```bash
git checkout main
git pull
# Make fix
git commit -m "fix: critical bug in X"
git push origin main
# Vercel + Coolify auto-deploy
```

---

## 🎓 For Claude Code: How to Help with This Project

When working on ClipDee:

1. **Always read this file first** to understand context
2. **Check existing patterns** before creating new ones (consistency matters in solo-founder codebase)
3. **Suggest improvements** but prioritize shipping MVP
4. **Test locally** before suggesting production deploy
5. **Document decisions** in `docs/` or this file (Decision Log)
6. **Watch for cost** — every AI API call costs money, optimize ruthlessly
7. **Thai-first** for user-facing copy, English-first for technical
8. **MVP mindset** — perfect is enemy of done

### Things I (Claude Code) should NEVER do without confirmation:
- Run `pnpm db:migrate` in production
- Delete files outside the project
- Commit to `main` directly
- Install large dependencies without justification
- Make architectural changes (DB schema, infra) without checking
- Expose API keys or secrets in logs

### Things I (Claude Code) CAN do freely:
- Read all project files
- Suggest refactors with explanation
- Write tests
- Create new components/services following established patterns
- Fix linter errors
- Update documentation
- Optimize prompts in `apps/ai/app/prompts/`

---

**Last Updated:** 2026-05-20
**Maintainer:** BankOver (Founder)
**Project Status:** Pre-MVP, planning phase
