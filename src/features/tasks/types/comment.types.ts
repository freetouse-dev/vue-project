import type { User } from '@/features/auth/types/auth.types'

export interface TaskComment {
  id: number
  task_id: number
  author_id: number
  content: string
  created_at: string
  updated_at: string
  author: User
}

export interface CommentCreatePayload {
  content: string
}

export interface CommentUpdatePayload {
  content: string
}
