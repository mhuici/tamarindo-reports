/**
 * Global auth middleware
 * - Fetches user on initial load
 * - Protects dashboard routes (routes with tenant slug)
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser, isLoading } = useAuth()

  // Skip middleware for API routes (handled by server-side auth)
  if (to.path.startsWith('/api/')) {
    return
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/privacy', '/demo']
  const isPublicRoute = publicRoutes.includes(to.path) || to.path.startsWith('/d/') || to.path.startsWith('/r/')

  // Always fetch user if not loaded (handles SSR and client navigation)
  if (user.value === null) {
    await fetchUser()
  }

  // If authenticated and trying to access login/register, redirect to dashboard
  if (user.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo(`/${user.value.tenantSlug}`)
  }

  // If not authenticated and trying to access protected route
  if (!user.value && !isPublicRoute) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
