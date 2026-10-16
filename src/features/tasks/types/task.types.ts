import type { User } from '@/features/auth/types/auth.types'

export type TaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE'
  | 'CANCELLED'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Task {
  id: number
  project_id: number
  task_number: number
  ticket_key: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  creator_id: number
  assignee_id: number | null
  due_date: string | null
  created_at: string
  updated_at: string
  creator: User
  assignee: User | null
}

export interface TaskCreatePayload {
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assignee_email?: string | null
  due_date?: string | null
}

export interface TaskUpdatePayload {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assignee_email?: string | null
  due_date?: string | null
}

export interface TaskFilterParams {
  status?: TaskStatus
  priority?: TaskPriority
}
