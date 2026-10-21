import type { User } from '@/features/auth/types/auth.types'

export interface AdminStats {
  total_users: number
  active_users: number
  unverified_users: number
  total_companies?: number
  pending_company_requests?: number
  total_workspaces: number
  total_projects: number
  total_tasks: number
  total_comments: number
  total_audit_logs: number
}

export interface AuditLog {
  id: number
  actor_id: number | null
  action: string
  resource_type: string
  resource_id: string
  details: string | null
  ip_address: string | null
  created_at: string
  actor: User | null
}

export interface UserAdminUpdatePayload {
  full_name?: string
  email?: string
  is_active?: boolean
  is_verified?: boolean
  is_superuser?: boolean
}

export interface AuditLogFilterParams {
  actor_id?: number
  action?: string
  resource_type?: string
  resource_id?: string
  page?: number
  size?: number
}
