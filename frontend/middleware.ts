import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const role = request.cookies.get('userRole')?.value

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth', '/api/auth', '/account', '/admin', '/merchant', '/dashboard']
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if user is authenticated (has a role)
  if (!role) {
    return NextResponse.redirect(new URL('/auth?error=unauthorized', request.url))
  }

  // Protect admin routes
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/auth?error=admin_required', request.url))
  }

  // Protect merchant routes
  if (path.startsWith('/merchant') && role !== 'merchant') {
    return NextResponse.redirect(new URL('/auth?error=merchant_required', request.url))
  }

  // Protect customer routes (dashboard, account pages)
  if (path.startsWith('/dashboard') && !['customer', 'merchant', 'admin'].includes(role)) {
    return NextResponse.redirect(new URL('/auth?error=authentication_required', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
