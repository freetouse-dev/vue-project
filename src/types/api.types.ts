export interface ApiErrorDetail {
  loc?: (string | number)[]
  msg: string
  type?: string
}

export interface ApiErrorResponse {
  error?: boolean
  status_code?: number
  path?: string
  detail?: string | ApiErrorDetail[]
  errors?: ApiErrorDetail[]
  message?: string
}

export type FeatureStatus = 'implemented' | 'partial' | 'under_development'
