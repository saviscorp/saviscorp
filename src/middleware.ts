import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const uid = request.cookies.get('savis_uid')?.value
  const role = request.cookies.get('savis_role')?.value

  // Allow public paths through; bounce already-logged-in users away from auth pages
  if (PUBLIC_PATHS.includes(pathname)) {
    if (uid && (pathname === '/login' || pathname === '/register')) {
      const dest = !role
        ? '/choose-role'
        : role === 'provider'
        ? '/provider/dashboard'
        : '/browse'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  // Not authenticated → login
  if (!uid) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated but no role → choose-role
  if (!role && pathname !== '/choose-role') {
    return NextResponse.redirect(new URL('/choose-role', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
