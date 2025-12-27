import { computed, readonly } from 'vue'
import { useState, navigateTo } from '#imports'
import type { AuthUser } from '@tamarindo/types'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
  agencyName: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const isLoading = useState<boolean>('auth-loading', () => true)

  const isAuthenticated = computed(() => !!user.value)

  /**
   * Fetch current user from API
   */
  async function fetchUser(): Promise<AuthUser | null> {
    try {
      const response = await $fetch<{ user: AuthUser | null }>('/api/auth/me')
      user.value = response?.user ?? null
      return user.value
    }
    catch {
      user.value = null
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Login with email and password
   */
  async function login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    isLoading.value = true

    try {
      const response = await $fetch<{ success: boolean; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: credentials,
      })

      if (response.success && response.user) {
        user.value = response.user as AuthUser
        return { success: true }
      }

      return { success: false, error: 'Login failed' }
    }
    catch (error: any) {
      const message = error?.data?.message || error?.message || 'Invalid email or password'
      return { success: false, error: message }
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Register a new user and agency
   */
  async function register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
    isLoading.value = true

    try {
      const response = await $fetch<{ success: boolean; user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: data,
      })

      if (response.success && response.user) {
        user.value = response.user as AuthUser
        return { success: true }
      }

      return { success: false, error: 'Registration failed' }
    }
    catch (error: any) {
      const message = error?.data?.message || error?.message || 'Registration failed'
      return { success: false, error: message }
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Logout current user
   */
  async function logout(): Promise<void> {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    }
    finally {
      user.value = null
      await navigateTo('/login')
    }
  }

  /**
   * Check if user has required role
   */
  function hasRole(requiredRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'): boolean {
    if (!user.value) return false

    const roleHierarchy: Record<string, number> = {
      VIEWER: 0,
      MEMBER: 1,
      ADMIN: 2,
      OWNER: 3,
    }

    const userRoleLevel = roleHierarchy[user.value.role] ?? 0
    const requiredRoleLevel = roleHierarchy[requiredRole] ?? 0
    return userRoleLevel >= requiredRoleLevel
  }

  return {
    // State
    user: readonly(user),
    isLoading: readonly(isLoading),
    isAuthenticated,

    // Actions
    fetchUser,
    login,
    register,
    logout,
    hasRole,
  }
}
