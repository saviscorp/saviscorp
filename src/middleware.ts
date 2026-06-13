import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const uid = request.cookies.get('savis_uid')?.value

  // Redirect already-authenticated users away from auth pages
  if (uid && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/register'],
}
