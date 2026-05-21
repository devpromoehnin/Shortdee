import { createClient } from '@/lib/supabase/client'

/**
 * Calls the API gateway with the current Supabase session token attached.
 * Requests are same-origin (`/api/...`) and proxied to the API by a Next
 * rewrite — so the app works behind an HTTPS tunnel without CORS issues.
 * Unwraps the `{ data }` envelope, or throws with the API error message.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session ? { Authorization: `Bearer ${session.access_token}` } : {}
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
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
