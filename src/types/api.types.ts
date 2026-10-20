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

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
  has_next: boolean
  has_prev: boolean
}
