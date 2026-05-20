import { z } from 'zod'

/**
 * Validated environment for the API gateway.
 * Phase 1: external secrets are optional so the server boots without a full
 * `.env`. Phase 2 makes SUPABASE_* / DATABASE_URL required.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)
