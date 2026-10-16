import apiClient from '@/services/apiClient'
import type {
  Task,
  TaskCreatePayload,
  TaskFilterParams,
  TaskUpdatePayload,
} from '@/features/tasks/types/task.types'

export const taskService = {
  /**
   * Fetches all tasks for a project with optional status and priority query filters
   */
  async getTasks(
    workspaceSlug: string,
    projectKey: string,
    params?: TaskFilterParams
  ): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectKey)}/tasks/`,
      {
        params: {
          status: params?.status || undefined,
          priority: params?.priority || undefined,
        },
      }
    )
    return response.data
  },

  /**
   * Fetches a single task by its project ticket number (e.g. 1 for MOB-1)
   */
  async getTask(
    workspaceSlug: string,
    projectKey: string,
    taskNumber: number
  ): Promise<Task> {
    const response = await apiClient.get<Task>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectKey)}/tasks/${taskNumber}`
    )
    return response.data
  },

  /**
   * Creates a new task in the project with auto-incremented ticket numbering
   */
  async createTask(
    workspaceSlug: string,
    projectKey: string,
    payload: TaskCreatePayload
  ): Promise<Task> {
    const response = await apiClient.post<Task>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectKey)}/tasks/`,
      {
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        status: payload.status || 'TODO',
        priority: payload.priority || 'MEDIUM',
        assignee_email: payload.assignee_email?.trim() || null,
        due_date: payload.due_date || null,
      }
    )
    return response.data
  },

  /**
   * Updates task status, priority, description, or reassigned user
   */
  async updateTask(
    workspaceSlug: string,
    projectKey: string,
    taskNumber: number,
    payload: TaskUpdatePayload
  ): Promise<Task> {
    const body: Record<string, unknown> = {}
    if (payload.title !== undefined) body.title = payload.title.trim()
    if (payload.description !== undefined) body.description = payload.description?.trim() || null
    if (payload.status !== undefined) body.status = payload.status
    if (payload.priority !== undefined) body.priority = payload.priority
    if (payload.assignee_email !== undefined) body.assignee_email = payload.assignee_email?.trim() || null
    if (payload.due_date !== undefined) body.due_date = payload.due_date

    const response = await apiClient.patch<Task>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectKey)}/tasks/${taskNumber}`,
      body
    )
    return response.data
  },
}
