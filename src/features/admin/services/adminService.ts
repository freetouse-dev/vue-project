import apiClient from '@/services/apiClient'
import type { PaginatedResponse } from '@/types/api.types'
import type { User } from '@/features/auth/types/auth.types'
import type { Workspace, WorkspaceMember } from '@/features/workspaces/types/workspace.types'
import type { Project } from '@/features/projects/types/project.types'
import type { Task } from '@/features/tasks/types/task.types'
import type { TaskComment } from '@/features/tasks/types/comment.types'
import type {
  AdminStats,
  AuditLog,
  AuditLogFilterParams,
  UserAdminUpdatePayload,
} from '@/features/admin/types/admin.types'
import type {
  Company,
  CompanyCreationRequest,
} from '@/features/company/types/company.types'

export interface RoleDefinition {
  role: string
  scope: string
  description: string
  permissions: string[]
}

export interface PermissionDetail {
  code: string
  description: string
  roles: string[]
}

export interface RolesResponse {
  roles: RoleDefinition[]
  permissions: PermissionDetail[]
}

export const adminService = {
  /**
   * Fetches high-level administrative platform statistics
   */
  async getStats(): Promise<AdminStats> {
    const response = await apiClient.get<AdminStats>('/admin/stats')
    return response.data
  },

  /**
   * Lists all users with pagination and filtering
   */
  async getUsers(params?: {
    search?: string
    is_active?: boolean
    is_verified?: boolean
    is_superuser?: boolean
    page?: number
    size?: number
  }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<PaginatedResponse<User>>('/admin/users', { params })
    return response.data
  },

  /**
   * Updates user activation or superuser status
   */
  async updateUser(userId: number, payload: UserAdminUpdatePayload): Promise<User> {
    const response = await apiClient.patch<User>(`/admin/users/${userId}`, payload)
    return response.data
  },

  /**
   * Deactivates a user account
   */
  async deactivateUser(userId: number): Promise<User> {
    const response = await apiClient.delete<User>(`/admin/users/${userId}`)
    return response.data
  },

  /**
   * Fetches paginated system audit logs
   */
  async getAuditLogs(params?: AuditLogFilterParams): Promise<PaginatedResponse<AuditLog>> {
    const response = await apiClient.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params })
    return response.data
  },

  /**
   * Fetches all workspaces across platform (including soft-deleted if requested)
   */
  async getWorkspaces(includeDeleted: boolean = true): Promise<Workspace[]> {
    const response = await apiClient.get<Workspace[]>('/admin/workspaces', {
      params: { include_deleted: includeDeleted },
    })
    return response.data
  },

  /**
   * Soft-deletes a workspace from admin
   */
  async deleteWorkspace(workspaceId: number): Promise<Workspace> {
    const response = await apiClient.delete<Workspace>(`/admin/workspaces/${workspaceId}`)
    return response.data
  },

  /**
   * Restores a soft-deleted workspace from admin
   */
  async restoreWorkspace(workspaceId: number): Promise<Workspace> {
    const response = await apiClient.post<Workspace>(`/admin/workspaces/${workspaceId}/restore`)
    return response.data
  },

  /**
   * Gets all members of a workspace
   */
  async getWorkspaceMembers(workspaceId: number): Promise<WorkspaceMember[]> {
    const response = await apiClient.get<WorkspaceMember[]>(`/admin/workspaces/${workspaceId}/members`)
    return response.data
  },

  /**
   * Adds or updates a member role in a workspace
   */
  async manageWorkspaceMember(workspaceId: number, data: { email: string; role: string }): Promise<WorkspaceMember> {
    const response = await apiClient.post<WorkspaceMember>(`/admin/workspaces/${workspaceId}/members`, data)
    return response.data
  },

  /**
   * Removes a member from a workspace
   */
  async removeWorkspaceMember(workspaceId: number, userId: number): Promise<void> {
    await apiClient.delete(`/admin/workspaces/${workspaceId}/members/${userId}`)
  },

  /**
   * Fetches all projects across platform
   */
  async getProjects(includeDeleted: boolean = true, workspaceId?: number): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/admin/projects', {
      params: { include_deleted: includeDeleted, workspace_id: workspaceId },
    })
    return response.data
  },

  /**
   * Soft-deletes a project
   */
  async deleteProject(projectId: number): Promise<Project> {
    const response = await apiClient.delete<Project>(`/admin/projects/${projectId}`)
    return response.data
  },

  /**
   * Restores a soft-deleted project
   */
  async restoreProject(projectId: number): Promise<Project> {
    const response = await apiClient.post<Project>(`/admin/projects/${projectId}/restore`)
    return response.data
  },

  /**
   * Fetches all tasks across platform
   */
  async getTasks(params?: {
    search?: string
    status?: string
    priority?: string
    project_id?: number
    include_deleted?: boolean
    page?: number
    size?: number
  }): Promise<PaginatedResponse<Task>> {
    const response = await apiClient.get<PaginatedResponse<Task>>('/admin/tasks', { params })
    return response.data
  },

  /**
   * Soft-deletes a task
   */
  async deleteTask(taskId: number): Promise<Task> {
    const response = await apiClient.delete<Task>(`/admin/tasks/${taskId}`)
    return response.data
  },

  /**
   * Restores a soft-deleted task
   */
  async restoreTask(taskId: number): Promise<Task> {
    const response = await apiClient.post<Task>(`/admin/tasks/${taskId}/restore`)
    return response.data
  },

  /**
   * Fetches comments across platform for moderation
   */
  async getComments(params?: {
    include_deleted?: boolean
    page?: number
    size?: number
  }): Promise<PaginatedResponse<TaskComment>> {
    const response = await apiClient.get<PaginatedResponse<TaskComment>>('/admin/comments', { params })
    return response.data
  },

  /**
   * Soft-deletes a comment
   */
  async deleteComment(commentId: number): Promise<TaskComment> {
    const response = await apiClient.delete<TaskComment>(`/admin/comments/${commentId}`)
    return response.data
  },

  /**
   * Restores a soft-deleted comment
   */
  async restoreComment(commentId: number): Promise<TaskComment> {
    const response = await apiClient.post<TaskComment>(`/admin/comments/${commentId}/restore`)
    return response.data
  },

  /**
   * Fetches roles and permissions definition matrix
   */
  async getRoles(): Promise<RolesResponse> {
    const response = await apiClient.get<RolesResponse>('/admin/roles')
    return response.data
  },

  /**
   * Lists all companies across the platform
   */
  async getCompanies(params?: {
    search?: string
    status?: string
    include_deleted?: boolean
  }): Promise<Company[]> {
    const response = await apiClient.get<Company[]>('/admin/companies', { params })
    return response.data
  },

  /**
   * Updates company or toggles status (ACTIVE / SUSPENDED)
   */
  async updateCompany(
    companyId: number,
    payload: { name?: string; description?: string },
    status?: string
  ): Promise<Company> {
    const response = await apiClient.patch<Company>(`/admin/companies/${companyId}`, payload, {
      params: status ? { status } : undefined,
    })
    return response.data
  },

  /**
   * Soft-deletes a company
   */
  async deleteCompany(companyId: number): Promise<Company> {
    const response = await apiClient.delete<Company>(`/admin/companies/${companyId}`)
    return response.data
  },

  /**
   * Restores a soft-deleted company
   */
  async restoreCompany(companyId: number): Promise<Company> {
    const response = await apiClient.post<Company>(`/admin/companies/${companyId}/restore`)
    return response.data
  },

  /**
   * Lists company creation requests awaiting admin review
   */
  async getCompanyRequests(statusFilter?: string): Promise<CompanyCreationRequest[]> {
    const response = await apiClient.get<CompanyCreationRequest[]>('/admin/company-requests', {
      params: statusFilter ? { status_filter: statusFilter } : undefined,
    })
    return response.data
  },

  /**
   * Approves a company creation request
   */
  async approveCompanyRequest(requestId: number): Promise<Company> {
    const response = await apiClient.post<Company>(`/admin/company-requests/${requestId}/approve`)
    return response.data
  },

  /**
   * Rejects a company creation request
   */
  async rejectCompanyRequest(requestId: number, rejectionReason?: string): Promise<CompanyCreationRequest> {
    const response = await apiClient.post<CompanyCreationRequest>(
      `/admin/company-requests/${requestId}/reject`,
      { approved: false, rejection_reason: rejectionReason }
    )
    return response.data
  },
}

export default adminService
