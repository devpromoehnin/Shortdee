import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Logout handler — posted to by the sidebar logout form. */
export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // 303 forces a GET on the redirect target.
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}
