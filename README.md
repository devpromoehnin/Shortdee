# ClipDee — AI Live-to-Shorts for Thai Live Commerce

> เปลี่ยน Live ขายของไทยให้เป็น Short ขายดี ผ่าน AI ที่เข้าใจ Commerce Context

ClipDee รับ Live Stream (TikTok/Facebook/Shopee Live) มาวิเคราะห์ด้วย Multimodal AI
เพื่อจับ **Commerce Moment** 7 ประเภท แล้วตัดเป็น Short Video พร้อม Caption ไทย
+ Auto-Reframe 9:16 และโพสต์ได้ทุกแพลตฟอร์ม

## 🗂️ Monorepo Structure

```
clipdee/
├── apps/
│   ├── web/        # Next.js 15 frontend (App Router)
│   ├── api/        # Fastify API gateway (TypeScript)
│   └── ai/         # FastAPI AI service (Python 3.11+)
├── workers/
│   ├── video-processor/   # FFmpeg pipeline (BullMQ)
│   └── publisher/         # Multi-platform publisher
├── packages/
│   ├── config/     # Shared TS / ESLint / Prettier config
│   ├── types/      # Shared TypeScript types
│   ├── database/   # Prisma schema + client
│   └── ui/         # Shared UI components
├── infra/          # docker-compose, deploy configs
└── docs/           # Architecture, API, deployment docs
```

## 🚀 Quickstart

### Prerequisites

- Node.js ≥ 20, pnpm ≥ 9
- Python ≥ 3.11 (for `apps/ai`)
- FFmpeg (for video workers)
- Docker (optional — local Redis)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Fill: SUPABASE_URL, GEMINI_API_KEY, DATABASE_URL, ...

# 3. Start local services (Redis)
docker compose -f infra/docker-compose.yml up -d

# 4. Run all apps in dev mode
pnpm dev
```

| App | Dev URL |
|-----|---------|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| AI  | http://localhost:8000 |

### Python AI service (separate setup)

```bash
cd apps/ai
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

## 📜 Common Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps (Turborepo) |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint everything |
| `pnpm typecheck` | Type-check everything |
| `pnpm test` | Run all tests |
| `pnpm format` | Prettier format |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio |

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) — Project context & conventions
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design deep-dive
- [commands.md](./commands.md) — Build prompts library

---

**StateWave Technologies Co., Ltd.** · Status: Pre-MVP
