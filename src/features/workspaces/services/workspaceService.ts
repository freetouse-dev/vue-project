import apiClient from '@/services/apiClient'
import type {
  Workspace,
  WorkspaceCreatePayload,
  WorkspaceMember,
  WorkspaceMemberAddPayload,
} from '@/features/workspaces/types/workspace.types'

export const workspaceService = {
  /**
   * Fetches all workspaces where current user is a member
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await apiClient.get<Workspace[]>('/workspaces/')
    return response.data
  },

  /**
   * Fetches single workspace details by slug
   */
  async getWorkspace(slug: string): Promise<Workspace> {
    const response = await apiClient.get<Workspace>(`/workspaces/${encodeURIComponent(slug)}`)
    return response.data
  },

  /**
   * Creates a new workspace and assigns current user as OWNER
   */
  async createWorkspace(payload: WorkspaceCreatePayload): Promise<Workspace> {
    const response = await apiClient.post<Workspace>('/workspaces/', payload)
    return response.data
  },

  /**
   * Lists all members of a workspace
   */
  async getWorkspaceMembers(slug: string): Promise<WorkspaceMember[]> {
    const response = await apiClient.get<WorkspaceMember[]>(
      `/workspaces/${encodeURIComponent(slug)}/members`
    )
    return response.data
  },

  /**
   * Adds a new member to the workspace (OWNER or ADMIN only)
   */
  async addWorkspaceMember(
    slug: string,
    payload: WorkspaceMemberAddPayload
  ): Promise<WorkspaceMember> {
    const response = await apiClient.post<WorkspaceMember>(
      `/workspaces/${encodeURIComponent(slug)}/members`,
      payload
    )
    return response.data
  },

  /**
   * Updates workspace name or description
   */
  async updateWorkspace(slug: string, payload: { name?: string; description?: string | null }): Promise<Workspace> {
    const response = await apiClient.patch<Workspace>(`/workspaces/${encodeURIComponent(slug)}`, payload)
    return response.data
  },

  /**
   * Soft-deletes a workspace
   */
  async deleteWorkspace(slug: string): Promise<void> {
    await apiClient.delete(`/workspaces/${encodeURIComponent(slug)}`)
  },

  /**
   * Updates a workspace member's role
   */
  async updateMemberRole(slug: string, userId: number, role: string): Promise<WorkspaceMember> {
    const response = await apiClient.patch<WorkspaceMember>(
      `/workspaces/${encodeURIComponent(slug)}/members/${userId}`,
      { role }
    )
    return response.data
  },

  /**
   * Removes a member from the workspace
   */
  async removeMember(slug: string, userId: number): Promise<void> {
    await apiClient.delete(`/workspaces/${encodeURIComponent(slug)}/members/${userId}`)
  },
}

export default workspaceService
