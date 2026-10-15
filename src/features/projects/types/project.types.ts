import type { User } from '@/features/auth/types/auth.types'

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'
export type ProjectRole = 'PROJECT_LEAD' | 'CONTRIBUTOR' | 'VIEWER'

export interface Project {
  id: number
  workspace_id: number
  name: string
  key: string
  description: string | null
  status: ProjectStatus
  created_by_id: number
  created_at: string
  updated_at: string
}

export interface ProjectCreatePayload {
  name: string
  key: string
  description?: string | null
}

export interface ProjectMember {
  id: number
  project_id: number
  user_id: number
  role: ProjectRole
  joined_at: string
  user: User
}

export interface ProjectMemberAddPayload {
  email: string
  role: ProjectRole
}
