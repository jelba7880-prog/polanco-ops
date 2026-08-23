import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/inventory', '/leads', '/deals', '/settings']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove this. getUser() never throws (every
  // failure mode, including an invalid/expired refresh token, resolves to
  // `{ user: null, error }`), but guard it anyway as defense-in-depth against
  // an unexpected throw from the underlying fetch.
  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch (err) {
    console.error('proxy: auth.getUser() threw unexpectedly', err)
  }

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))

  // A redirect is a fresh NextResponse, so it does NOT inherit the Set-Cookie
  // headers accumulated on supabaseResponse by setAll() above — without this,
  // a request whose refresh token was just invalidated (and its cookie thus
  // just cleared) would ship the redirect with the stale cookie still
  // attached, deferring the actual clear to the user's next request instead
  // of this one.
  function redirectWithRefreshedCookies(pathname: string) {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    const response = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  }

  // Unauthenticated user trying to access a protected route
  if (!user && isProtected) {
    return redirectWithRefreshedCookies('/login')
  }

  // Authenticated user hitting /login — send them to dashboard
  if (user && pathname === '/login') {
    return redirectWithRefreshedCookies('/dashboard')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|polanco-logo.png|cars|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
