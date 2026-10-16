import apiClient from '@/services/apiClient'
import type { CommentCreatePayload, TaskComment } from '@/features/tasks/types/comment.types'

export const commentService = {
  /**
   * Fetches all comments for a task in chronological order
   */
  async getComments(
    workspaceSlug: string,
    projectKey: string,
    taskNumber: number
  ): Promise<TaskComment[]> {
    const response = await apiClient.get<TaskComment[]>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectKey)}/tasks/${taskNumber}/comments/`
    )
    return response.data
  },

  /**
   * Adds a new comment to the specified task
   */
  async addComment(
    workspaceSlug: string,
    projectKey: string,
    taskNumber: number,
    payload: CommentCreatePayload
  ): Promise<TaskComment> {
    const response = await apiClient.post<TaskComment>(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectKey)}/tasks/${taskNumber}/comments/`,
      {
        content: payload.content.trim(),
      }
    )
    return response.data
  },

  /**
   * Deletes a comment by ID (must be author, project lead, or workspace admin/owner)
   */
  async deleteComment(
    workspaceSlug: string,
    projectKey: string,
    taskNumber: number,
    commentId: number
  ): Promise<void> {
    await apiClient.delete(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectKey)}/tasks/${taskNumber}/comments/${commentId}`
    )
  },
}
