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
}
