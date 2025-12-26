import { defineEventHandler, deleteCookie } from 'h3'

/**
 * POST /api/auth/logout
 * Clear auth cookie
 */
export default defineEventHandler(async (event) => {
  deleteCookie(event, 'auth_token', {
    path: '/',
  })

  return { success: true }
})
