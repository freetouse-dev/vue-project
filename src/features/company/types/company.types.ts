export type CompanyRole = 'COMPANY_OWNER' | 'COMPANY_ADMIN' | 'MEMBER' | 'VIEWER'
export type CompanyStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL'

export interface Company {
  id: number
  name: string
  slug: string
  description?: string | null
  status: CompanyStatus
  owner_id: number
  created_by_id: number
  deleted_at?: string | null
  created_at: string
  updated_at: string
  members_count?: number
  workspaces_count?: number
  my_role?: CompanyRole | null
  can_create_workspace?: boolean | null
}

export interface CompanyMember {
  id: number
  company_id: number
  user_id: number
  role: CompanyRole
  status: string
  can_create_workspace?: boolean
  joined_at: string
  created_at: string
  user?: {
    id: number
    email: string
    full_name: string
    avatar_url?: string | null
    is_active: boolean
  }
}

export interface CompanyCreationRequest {
  id: number
  user_id: number
  company_name: string
  company_slug: string
  business_description?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewed_by_id?: number | null
  reviewed_at?: string | null
  rejection_reason?: string | null
  created_at: string
  requester?: {
    id: number
    email: string
    full_name: string
  }
}

export interface CompanyInvitation {
  id: number
  company_id: number
  email: string
  role: CompanyRole
  status: string
  expires_at: string
  created_at: string
  token?: string | null
}

export type WorkspaceAccessRequestType = 'CREATE_WORKSPACE' | 'JOIN_WORKSPACE'
export type WorkspaceAccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface WorkspaceAccessRequest {
  id: number
  company_id: number
  user_id: number
  request_type: WorkspaceAccessRequestType
  workspace_id?: number | null
  requested_role?: string | null
  reason?: string | null
  status: WorkspaceAccessRequestStatus
  reviewer_id?: number | null
  reviewed_at?: string | null
  decision_reason?: string | null
  created_at: string
  updated_at: string
  user?: {
    id: number
    email: string
    full_name: string
    avatar_url?: string | null
  }
  workspace?: {
    id: number
    name: string
    slug: string
  }
}
