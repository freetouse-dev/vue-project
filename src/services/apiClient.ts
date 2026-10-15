import axios, { type AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/types/api.types'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Request Interceptor: Attach Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pm_access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Global 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      // Clear invalid credentials
      localStorage.removeItem('pm_access_token')
      localStorage.removeItem('pm_user')

      // Avoid redirect loops if already on login/register
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login?expired=true'
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Extracts a human-readable message from a FastAPI error response.
 */
export function formatApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    const data = axiosError.response?.data

    if (data?.detail) {
      if (typeof data.detail === 'string') {
        return data.detail
      }
      if (Array.isArray(data.detail)) {
        // FastAPI Pydantic ValidationError list
        return data.detail.map((d) => d.msg).join(', ')
      }
    }

    if (data?.message) {
      return data.message
    }

    if (axiosError.message === 'Network Error') {
      return 'Cannot connect to backend server. Please verify FastAPI is running.'
    }

    return axiosError.response?.statusText || 'An unexpected error occurred.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred.'
}

export default apiClient
