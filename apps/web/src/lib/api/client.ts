import { createClient } from '@/lib/supabase/client'

/** Base URL of the Fastify API gateway. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session ? { Authorization: `Bearer ${session.access_token}` } : {}
}

/**
 * Calls the API gateway with the current Supabase session token attached.
 * Unwraps the `{ data }` envelope, or throws with the API error message.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      // Only declare a JSON body when one is actually sent — Fastify rejects
      // an empty body when Content-Type is application/json.
      ...(init?.body != null ? { 'Content-Type': 'application/json' } : {}),
      ...(await authHeaders()),
      ...init?.headers,
    },
  })

  const json = (await res.json().catch(() => null)) as
    | { data?: T; error?: { message?: string } }
    | null

  if (!res.ok) {
    throw new Error(json?.error?.message ?? `เกิดข้อผิดพลาด (${res.status})`)
  }
  return json?.data as T
}
