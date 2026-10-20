import type { User } from '@/features/auth/types/auth.types'

export interface CommentAttachment {
  id: number
  comment_id: number
  original_filename: string
  mime_type: string
  file_size: number
  uploaded_by_id: number
  created_at: string
  download_url: string
  preview_url: string
}

export interface TaskComment {
  id: number
  task_id: number
  author_id: number
  content: string
  deleted_at?: string | null
  deleted_by_id?: number | null
  created_at: string
  updated_at: string
  author: User
  attachments?: CommentAttachment[]
}

export interface CommentCreatePayload {
  content: string
}

export interface CommentUpdatePayload {
  content: string
}
