import apiClient from '@/services/apiClient'
import type {
  LoginCredentials,
  RegisterPayload,
  TokenResponse,
  User,
} from '@/features/auth/types/auth.types'

export const authService = {
  /**
   * Authenticates user using FastAPI OAuth2 password request form (form-urlencoded)
   */
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const params = new URLSearchParams()
    params.append('username', credentials.email.trim())
    params.append('password', credentials.password)

    const response = await apiClient.post<TokenResponse>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },

  /**
   * Registers a new user account
   */
  async register(payload: RegisterPayload): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', {
      email: payload.email.trim(),
      full_name: payload.full_name.trim(),
      password: payload.password,
    })
    return response.data
  },

  /**
   * Retrieves profile of current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/users/me')
    return response.data
  },
}
