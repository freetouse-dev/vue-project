import apiClient from '@/services/apiClient'
import type {
  Project,
  ProjectCreatePayload,
  ProjectMember,
  ProjectMemberAddPayload,
} from '@/features/projects/types/project.types'

export const projectService = {
  /**
   * Fetches all projects in a workspace visible to current user
   */
  async getProjects(workspaceSlug: string): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/`
    )
    return response.data
  },

  /**
   * Fetches single project by key within a workspace
   */
  async getProject(workspaceSlug: string, key: string): Promise<Project> {
    const response = await apiClient.get<Project>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(key)}`
    )
    return response.data
  },

  /**
   * Creates a new project in a workspace (requires OWNER or ADMIN)
   */
  async createProject(workspaceSlug: string, payload: ProjectCreatePayload): Promise<Project> {
    const response = await apiClient.post<Project>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/`,
      {
        name: payload.name.trim(),
        key: payload.key.trim().toUpperCase(),
        description: payload.description?.trim() || null,
      }
    )
    return response.data
  },

  /**
   * Lists all members assigned to a project
   */
  async getProjectMembers(workspaceSlug: string, key: string): Promise<ProjectMember[]> {
    const response = await apiClient.get<ProjectMember[]>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(key)}/members`
    )
    return response.data
  },

  /**
   * Adds an existing workspace member to the project
   */
  async addProjectMember(
    workspaceSlug: string,
    key: string,
    payload: ProjectMemberAddPayload
  ): Promise<ProjectMember> {
    const response = await apiClient.post<ProjectMember>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(key)}/members`,
      {
        email: payload.email.trim(),
        role: payload.role,
      }
    )
    return response.data
  },
}
