import type { TaskPriority, TaskStatus } from '@/features/tasks/types/task.types'

export interface ProjectDashboardResponse {
  project_id: number
  project_key: string
  project_name: string
  total_tasks: number
  completed_tasks: number
  completion_rate_percentage: number
  overdue_tasks: number
  tasks_by_status: Record<TaskStatus, number>
  tasks_by_priority: Record<TaskPriority, number>
}
