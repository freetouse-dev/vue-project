import apiClient from '@/services/apiClient'
import type { Task } from '@/features/tasks/types/task.types'
import type { TaskActivity } from '@/features/tasks/types/activity.types'

export interface UserDashboardData {
  assigned_tasks: Task[]
  total_assigned: number
  status_counts: Record<string, number>
  workspaces_count: number
  recent_activities: TaskActivity[]
}

export const dashboardService = {
  async getDashboardData(): Promise<UserDashboardData> {
    const response = await apiClient.get<UserDashboardData>('/users/me/dashboard')
    return response.data
  },
}
