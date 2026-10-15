import type { User } from '@/features/auth/types/auth.types'

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface Workspace {
  id: number
  name: string
  description: string | null
  slug: string
  owner_id: number
  created_at: string
  updated_at: string
}

export interface WorkspaceCreatePayload {
  name: string
  description?: string | null
  slug?: string | null
}

export interface WorkspaceMember {
  id: number
  workspace_id: number
  user_id: number
  role: WorkspaceRole
  joined_at: string
  user: User
}

export interface WorkspaceMemberAddPayload {
  email: string
  role: WorkspaceRole
}
