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

  // Onboarding requires auth — everything else is publicly browsable
  if (!uid && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/register', '/onboarding/:path*'],
}
