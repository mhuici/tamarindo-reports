/**
 * Global auth middleware
 * - Fetches user on initial load
 * - Protects dashboard routes (routes with tenant slug)
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser, isLoading } = useAuth()

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.includes(to.path)

  // Fetch user if not loaded yet (first load or refresh)
  if (user.value === null && isLoading.value) {
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
