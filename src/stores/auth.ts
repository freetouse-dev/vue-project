import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/features/auth/services/authService'
import type {
  LoginCredentials,
  RegisterPayload,
  User,
} from '@/features/auth/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('pm_access_token'))
  const user = ref<User | null>(null)
  const isLoading = ref<boolean>(false)
  const isInitialized = ref<boolean>(false)

  const isAuthenticated = computed(() => !!token.value)

  /**
   * Initializes auth state on application startup by checking persisted token
   */
  async function initAuth() {
    if (isInitialized.value) return

    if (token.value) {
      try {
        isLoading.value = true
        user.value = await authService.getCurrentUser()
      } catch {
        // Token is expired or invalid
        logout()
      } finally {
        isLoading.value = false
      }
    }
    isInitialized.value = true
  }

  /**
   * Logs in the user and fetches their profile
   */
  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    try {
      const tokenData = await authService.login(credentials)
      token.value = tokenData.access_token
      localStorage.setItem('pm_access_token', tokenData.access_token)

      // Fetch user profile
      user.value = await authService.getCurrentUser()
      return user.value
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Registers a new user account
   */
  async function register(payload: RegisterPayload) {
    isLoading.value = true
    try {
      return await authService.register(payload)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clears tokens and resets user state
   */
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('pm_access_token')
  }

  return {
    token,
    user,
    isLoading,
    isInitialized,
    isAuthenticated,
    initAuth,
    login,
    register,
    logout,
  }
})
