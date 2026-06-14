import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Authenticated users are redirected away from these paths
const AUTH_ONLY_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const uid = request.cookies.get('savis_uid')?.value

  // Logged-in users shouldn't see the auth pages
  if (uid && AUTH_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Unauthenticated users can't access the app
  if (!uid && (pathname === '/' || pathname.startsWith('/onboarding'))) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/register', '/onboarding/:path*'],
}
