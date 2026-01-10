import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = [
  '/customer',
  '/merchant',
  '/admin',
  '/dashboard',
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth',
  '/auth/callback',
]

// Define admin-only routes
const adminRoutes = [
  '/admin',
]

// Define merchant-only routes
const merchantRoutes = [
  '/merchant',
]

// Helper function to verify JWT token (disabled - backend doesn't have working endpoint)
// async function verifyToken(token: string): Promise<any | null> {
//   try {
//     const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

//     const response = await fetch(`${API_BASE_URL}/api/v1/accounts/token/validate/`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//     })

//     if (response.ok) {
//       const data = await response.json()
//       return data.user
//     }

//     return null
//   } catch (error) {
//     console.error('Token verification failed:', error)
//     return null
//   }
// }

// Helper function to check if path matches any of the routes
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => pathname.startsWith(route))
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next()
  }

  // Get token from cookies or localStorage (server-side, so we check cookies)
  const token = request.cookies.get('access_token')?.value

  // Check if current route requires authentication
  const requiresAuth = matchesRoute(pathname, protectedRoutes)
  const isPublicRoute = matchesRoute(pathname, publicRoutes)
  const isAdminRoute = matchesRoute(pathname, adminRoutes)
  const isMerchantRoute = matchesRoute(pathname, merchantRoutes)

  if (requiresAuth && !token) {
    // Redirect to login if trying to access protected route without token
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token) {
    // Skip token validation since backend doesn't have working endpoint
    // Just check if we have a token and assume it's valid (client-side will handle validation)
    console.log('🔐 Token found in cookies, allowing access')

    // TODO: Add proper server-side user info extraction from token
    // For now, disable role-based redirects since they interfere with client-side auth
    // const user = { role: 'merchant' }

    // Check role-based access - DISABLED until proper token validation is implemented
    // if (isAdminRoute && user.role !== 'admin') {
    //   return NextResponse.redirect(new URL('/customer', request.url))
    // }

    // if (isMerchantRoute && user.role !== 'merchant') {
    //   return NextResponse.redirect(new URL('/customer', request.url))
    // }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    // COMPLETELY DISABLED: This breaks login flow and always redirects to customer
    // if (isPublicRoute && pathname.startsWith('/auth') && !pathname.includes('/callback')) {
    //   const dashboardUrl = user.role === 'admin' ? '/admin' :
    //                       user.role === 'merchant' ? '/merchant' : '/customer'
    //   return NextResponse.redirect(new URL(dashboardUrl, request.url))
    // }
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
     * - files with extensions (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
