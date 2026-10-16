import type { User } from '@/features/auth/types/auth.types'

export type ActivityAction =
  | 'TASK_CREATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'ASSIGNEE_CHANGED'
  | 'TITLE_CHANGED'
  | 'DESCRIPTION_CHANGED'
  | 'DUE_DATE_CHANGED'

export interface TaskActivity {
  id: number
  task_id: number
  actor_id: number
  action: ActivityAction
  field_name: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
  actor: User
}
