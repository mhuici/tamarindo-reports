/**
 * Tenant middleware - validates user has access to the tenant slug in the URL
 * Applied to routes under /[tenant]/*
 */
export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth()
  const tenantSlug = to.params.tenant as string

  // Skip if no tenant in route (public pages)
  if (!tenantSlug) {
    return
  }

  // If not authenticated, the auth middleware will handle redirect
  if (!user.value) {
    return
  }

  // Validate user belongs to this tenant
  if (user.value.tenantSlug !== tenantSlug) {
    // Redirect to user's actual tenant
    return navigateTo(`/${user.value.tenantSlug}`)
  }
})
