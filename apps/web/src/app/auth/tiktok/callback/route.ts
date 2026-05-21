import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * TikTok OAuth callback — TikTok redirects here with a `code`. We pair it with
 * the PKCE verifier (stored in a cookie when the flow started) and hand both
 * to the API to exchange for tokens, then return the user to settings.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const settingsUrl = `${origin}/settings`

  const cookieStore = await cookies()
  const codeVerifier = cookieStore.get('tiktok_cv')?.value

  if (!code || !codeVerifier) {
    return NextResponse.redirect(`${settingsUrl}?tiktok=error`)
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const res = await fetch(`${API_URL}/api/integrations/tiktok/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ code, codeVerifier }),
  })

  const response = NextResponse.redirect(
    `${settingsUrl}?tiktok=${res.ok ? 'connected' : 'error'}`,
  )
  response.cookies.delete('tiktok_cv')
  return response
}
