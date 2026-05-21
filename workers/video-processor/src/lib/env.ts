import { resolve } from 'node:path'
import { config } from 'dotenv'

// Monorepo: env vars live in the repo-root .env.local.
config({ path: resolve(process.cwd(), '../../.env.local') })

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name} — check .env.local`)
  }
  return value
}

/** Validated worker environment. Throws at startup if anything is missing. */
export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  REDIS_URL: required('REDIS_URL'),
  AI_SERVICE_URL: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
  R2_ACCOUNT_ID: required('R2_ACCOUNT_ID'),
  R2_ACCESS_KEY_ID: required('R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY: required('R2_SECRET_ACCESS_KEY'),
  R2_BUCKET_UPLOADS: process.env.R2_BUCKET_UPLOADS ?? 'clipdee-uploads',
  R2_BUCKET_CLIPS: process.env.R2_BUCKET_CLIPS ?? 'clipdee-clips',
  WORKER_CONCURRENCY: Number(process.env.WORKER_CONCURRENCY ?? 2),
} as const
