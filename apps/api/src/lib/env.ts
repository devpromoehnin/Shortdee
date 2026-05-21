import { resolve } from 'node:path'
import { config } from 'dotenv'
import { z } from 'zod'

// Monorepo: env vars live in the repo-root .env.local. Load before parsing.
config({ path: resolve(process.cwd(), '../../.env.local') })

/**
 * Validated environment for the API gateway.
 * Supabase URL + anon key are required from Phase 2 on (used for auth).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  // Redis (BullMQ) + Cloudflare R2 — optional so the API still boots
  // without them; the upload/queue endpoints fail cleanly if unset.
  REDIS_URL: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_UPLOADS: z.string().default('clipdee-uploads'),
  R2_BUCKET_CLIPS: z.string().default('clipdee-clips'),
  R2_PUBLIC_URL: z.string().optional(),
  // TikTok publishing (Phase 7) — optional until configured.
  TIKTOK_CLIENT_KEY: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Environment validation failed — check .env.local')
}

export type Env = z.infer<typeof envSchema>
export const env: Env = parsed.data
