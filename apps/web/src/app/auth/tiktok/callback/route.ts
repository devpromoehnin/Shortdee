import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * TikTok OAuth callback — TikTok redirects here with a `code`, which we hand
 * to the API to exchange for tokens, then return the user to settings.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const settingsUrl = `${origin}/settings`

  if (!code) {
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
    body: JSON.stringify({ code }),
  })

  return NextResponse.redirect(`${settingsUrl}?tiktok=${res.ok ? 'connected' : 'error'}`)
}
