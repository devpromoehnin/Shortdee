import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env.js'

let client: SupabaseClient | undefined

/**
 * Shared Supabase client for the API gateway.
 * Used to validate user access tokens (JWTs) sent by the web app.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}
