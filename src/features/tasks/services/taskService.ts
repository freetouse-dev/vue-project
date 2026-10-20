import apiClient from '@/services/apiClient'
import type {
  PaginatedResponse,
  Task,
  TaskCreatePayload,
  TaskFilterParams,
  TaskUpdatePayload,
} from '@/features/tasks/types/task.types'
import type { TaskActivity } from '@/features/tasks/types/activity.types'

export const taskService = {
  /**
   * Fetches tasks for a project and normalizes to an array of Task objects.
   * Seamlessly handles both new PaginatedResponse and legacy raw array payloads.
   */
  async getTasks(
    workspaceSlug: string,
    projectKey: string,
    params?: TaskFilterParams
  ): Promise<Task[]> {
    const paginated = await this.getTasksPaginated(workspaceSlug, projectKey, params)
    return paginated.items
  },

  /**
   * Fetches paginated tasks with search, filtering, sorting, and pagination metadata
   */
  async getTasksPaginated(
    workspaceSlug: string,
    projectKey: string,
    params?: TaskFilterParams
  ): Promise<PaginatedResponse<Task>> {
    const response = await apiClient.get<PaginatedResponse<Task> | Task[]>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectKey)}/tasks/`,
      {
        params: {
          search: params?.search || undefined,
          status: params?.status || undefined,
          priority: params?.priority || undefined,
          sort_by: params?.sort_by || undefined,
          sort_order: params?.sort_order || undefined,
          page: params?.page || undefined,
          size: params?.size || undefined,
        },
      }
    )

    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.data.length,
        page: 1,
        size: response.data.length,
        total_pages: 1,
      }
    }

    return response.data
  },

  /**
   * Fetches the audit trail / activity history for a task
   */
  async getTaskActivities(
    workspaceSlug: string,
    projectKey: string,
    taskNumber: number
  ): Promise<TaskActivity[]> {
    const response = await apiClient.get<TaskActivity[]>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectKey)}/tasks/${taskNumber}/activities/`
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

  /**
   * Soft-deletes a task
   */
  async deleteTask(
    workspaceSlug: string,
    projectKey: string,
    taskNumber: number
  ): Promise<void> {
    await apiClient.delete(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectKey)}/tasks/${taskNumber}`
    )
  },
}

export default taskService
