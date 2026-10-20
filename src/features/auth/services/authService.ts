import apiClient from '@/services/apiClient'
import type {
  AuthMessageResponse,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterPayload,
  ResendOTPPayload,
  ResetPasswordPayload,
  TokenResponse,
  User,
  VerifyEmailPayload,
  VerifyResetOTPPayload,
  VerifyResetOTPResponse,
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
   * Registers a new user account (initiates email verification)
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
   * Verifies an email address using the received 6-digit OTP
   */
  async verifyEmail(payload: VerifyEmailPayload): Promise<AuthMessageResponse> {
    const response = await apiClient.post<AuthMessageResponse>('/auth/verify-email', {
      email: payload.email.trim(),
      otp: payload.otp.trim(),
    })
    return response.data
  },

  /**
   * Resends a verification OTP to the specified email address
   */
  async resendVerificationOtp(payload: ResendOTPPayload): Promise<AuthMessageResponse> {
    const response = await apiClient.post<AuthMessageResponse>('/auth/resend-verification-otp', {
      email: payload.email.trim(),
    })
    return response.data
  },

  /**
   * Requests a password reset OTP code
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<AuthMessageResponse> {
    const response = await apiClient.post<AuthMessageResponse>('/auth/forgot-password', {
      email: payload.email.trim(),
    })
    return response.data
  },

  /**
   * Verifies password reset OTP code and returns a short-lived reset authorization token
   */
  async verifyResetOtp(payload: VerifyResetOTPPayload): Promise<VerifyResetOTPResponse> {
    const response = await apiClient.post<VerifyResetOTPResponse>('/auth/verify-reset-otp', {
      email: payload.email.trim(),
      otp: payload.otp.trim(),
    })
    return response.data
  },

  /**
   * Resets password using the received reset token
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<AuthMessageResponse> {
    const response = await apiClient.post<AuthMessageResponse>('/auth/reset-password', {
      reset_token: payload.reset_token,
      new_password: payload.new_password,
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

  /**
   * Uploads or replaces current user profile avatar image
   */
  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.put<User>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Removes current user profile avatar image
   */
  async removeAvatar(): Promise<User> {
    const response = await apiClient.delete<User>('/users/me/avatar')
    return response.data
  },
}

export default authService

