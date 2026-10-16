export interface User {
  id: number
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  is_verified?: boolean
  created_at: string
  updated_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface RegisterPayload {
  email: string
  full_name: string
  password: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface VerifyEmailPayload {
  email: string
  otp: string
}

export interface ResendOTPPayload {
  email: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface VerifyResetOTPPayload {
  email: string
  otp: string
}

export interface VerifyResetOTPResponse {
  reset_token: string
  token_type: string
  message: string
}

export interface ResetPasswordPayload {
  reset_token: string
  new_password: string
}

export interface AuthMessageResponse {
  message: string
  detail?: string | null
}

