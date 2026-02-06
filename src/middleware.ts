import { auth } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// Routes that require ADMIN role
const adminRoutes = [
  '/dashboard/employees',
  '/dashboard/departments',
  '/dashboard/positions',
  '/dashboard/allowances',
  '/dashboard/bonuses',
  '/dashboard/payroll',
  '/dashboard/payslips',
  '/dashboard/settings',
]

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role as UserRole | undefined
  const { pathname } = req.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Check if route requires admin role
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  // API routes should be handled separately
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    if (!isLoggedIn) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Check admin-only API routes
    const adminApiRoutes = ['/api/employees', '/api/departments', '/api/positions', '/api/bonuses', '/api/payroll', '/api/allowances']
    const isAdminApiRoute = adminApiRoutes.some((route) => pathname.startsWith(route))
    if (isAdminApiRoute && userRole !== UserRole.ADMIN) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    return
  }

  // If not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(loginUrl)
  }

  // If logged in and trying to access login page, redirect to dashboard
  if (isLoggedIn && pathname === '/login') {
    return Response.redirect(new URL('/dashboard', req.url))
  }

  // Check admin-only routes
  if (isLoggedIn && isAdminRoute && userRole !== UserRole.ADMIN) {
    return Response.redirect(new URL('/dashboard', req.url))
  }

  return
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
  runtime: 'nodejs',
}
