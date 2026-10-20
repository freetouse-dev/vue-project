import apiClient from '@/services/apiClient'
import type { PaginatedResponse } from '@/types/api.types'
import type { User } from '@/features/auth/types/auth.types'
import type { Workspace } from '@/features/workspaces/types/workspace.types'
import type { Project } from '@/features/projects/types/project.types'
import type { Task } from '@/features/tasks/types/task.types'
import type { TaskComment } from '@/features/tasks/types/comment.types'
import type {
  AdminStats,
  AuditLog,
  AuditLogFilterParams,
  UserAdminUpdatePayload,
} from '@/features/admin/types/admin.types'

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
   * Fetches paginated system audit logs
   */
  async getAuditLogs(params?: AuditLogFilterParams): Promise<PaginatedResponse<AuditLog>> {
    const response = await apiClient.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params })
    return response.data
  },

  /**
   * Fetches all workspaces across platform (including soft-deleted if requested)
   */
  async getWorkspaces(includeDeleted: boolean = false): Promise<Workspace[]> {
    const response = await apiClient.get<Workspace[]>('/admin/workspaces', {
      params: { include_deleted: includeDeleted },
    })
    return response.data
  },

  /**
   * Fetches all projects across platform
   */
  async getProjects(includeDeleted: boolean = false): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/admin/projects', {
      params: { include_deleted: includeDeleted },
    })
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
}

export default adminService
