import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options: CookieOptions }

/** Dashboard route group — requires a signed-in user. */
const PROTECTED_PREFIXES = ['/dashboard', '/lives', '/clips', '/analytics', '/settings']
/** Auth pages — redirect away if already signed in. */
const AUTH_PAGES = ['/login', '/signup']

/**
 * Refreshes the Supabase session cookie on every request and enforces
 * route protection. Must run in Next middleware so cookies can be written.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: getUser() revalidates the token — do not trust getSession() here.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  )

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  if (user && AUTH_PAGES.includes(path)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
