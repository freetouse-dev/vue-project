export interface ApiErrorDetail {
  loc?: (string | number)[]
  msg: string
  type?: string
}

export interface ApiErrorResponse {
  detail?: string | ApiErrorDetail[]
  message?: string
}

export type FeatureStatus = 'implemented' | 'partial' | 'under_development'
