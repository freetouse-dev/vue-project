import apiClient from '@/services/apiClient'
import type { ProjectDashboardResponse } from '@/features/projects/types/report.types'

export const reportService = {
  /**
   * Fetches aggregate project analytics and dashboard metrics
   */
  async getProjectDashboard(
    workspaceSlug: string,
    projectKey: string
  ): Promise<ProjectDashboardResponse> {
    const response = await apiClient.get<ProjectDashboardResponse>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectKey)}/dashboard`
    )
    return response.data
  },
}
