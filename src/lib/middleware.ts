import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_ONLY_PATHS = ['/login', '/register']

const PROTECTED_PREFIXES = ['/onboarding', '/listing', '/provider', '/bookings', '/profile', '/dashboard']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const uid = request.cookies.get('savis_uid')?.value

  // Logged-in users shouldn't see the auth pages
  if (uid && AUTH_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Protected routes require auth
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
  if (!uid && isProtected) {
    // Dashboard routes redirect to the role-specific auth page
    if (pathname.startsWith('/dashboard/provider')) {
      return NextResponse.redirect(new URL(`/auth?role=provider&redirect=${encodeURIComponent(pathname)}`, request.url))
    }
    if (pathname.startsWith('/dashboard/requestor')) {
      return NextResponse.redirect(new URL(`/auth?role=requestor&redirect=${encodeURIComponent(pathname)}`, request.url))
    }
    // All other protected routes redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/onboarding/:path*',
    '/listing/:path*',
    '/provider/:path*',
    '/bookings',
    '/profile',
    '/dashboard/:path*',
  ],
}
