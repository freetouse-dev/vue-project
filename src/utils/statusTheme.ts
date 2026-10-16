import type { TaskPriority, TaskStatus } from '@/features/tasks/types/task.types'

export interface StatusConfig {
  value: TaskStatus
  label: string
  dotClass: string
  badgeClass: string
  columnBorder: string
  columnBg: string
}

export interface PriorityConfig {
  value: TaskPriority
  label: string
  dotClass: string
  badgeClass: string
}

export const TASK_STATUS_CONFIGS: Record<TaskStatus, StatusConfig> = {
  BACKLOG: {
    value: 'BACKLOG',
    label: 'Backlog',
    dotClass: 'bg-slate-400 dark:bg-slate-500',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    columnBorder: 'border-slate-200 dark:border-slate-800',
    columnBg: 'bg-slate-50/60 dark:bg-slate-900/40',
  },
  TODO: {
    value: 'TODO',
    label: 'To Do',
    dotClass: 'bg-sky-500',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    columnBorder: 'border-sky-200 dark:border-sky-900/50',
    columnBg: 'bg-sky-50/40 dark:bg-sky-950/20',
  },
  IN_PROGRESS: {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    dotClass: 'bg-indigo-500',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    columnBorder: 'border-indigo-200 dark:border-indigo-900/50',
    columnBg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
  },
  IN_REVIEW: {
    value: 'IN_REVIEW',
    label: 'In Review',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    columnBorder: 'border-amber-200 dark:border-amber-900/50',
    columnBg: 'bg-amber-50/40 dark:bg-amber-950/20',
  },
  DONE: {
    value: 'DONE',
    label: 'Done',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    columnBorder: 'border-emerald-200 dark:border-emerald-900/50',
    columnBg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
  },
  CANCELLED: {
    value: 'CANCELLED',
    label: 'Cancelled',
    dotClass: 'bg-rose-400 dark:bg-rose-500',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    columnBorder: 'border-rose-200 dark:border-rose-900/50',
    columnBg: 'bg-rose-50/40 dark:bg-rose-950/20',
  },
}

export const TASK_PRIORITY_CONFIGS: Record<TaskPriority, PriorityConfig> = {
  URGENT: {
    value: 'URGENT',
    label: 'Urgent',
    dotClass: 'bg-rose-500',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  },
  HIGH: {
    value: 'HIGH',
    label: 'High',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  MEDIUM: {
    value: 'MEDIUM',
    label: 'Medium',
    dotClass: 'bg-indigo-500',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
  },
  LOW: {
    value: 'LOW',
    label: 'Low',
    dotClass: 'bg-slate-400 dark:bg-slate-500',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
}

export function getTaskStatusConfig(status: TaskStatus): StatusConfig {
  return TASK_STATUS_CONFIGS[status] || TASK_STATUS_CONFIGS.TODO
}

export function getTaskPriorityConfig(priority: TaskPriority): PriorityConfig {
  return TASK_PRIORITY_CONFIGS[priority] || TASK_PRIORITY_CONFIGS.MEDIUM
}

// Kanban Columns for the 4 primary active lifecycle states
export const KANBAN_PRIMARY_COLUMNS: StatusConfig[] = [
  TASK_STATUS_CONFIGS.TODO,
  TASK_STATUS_CONFIGS.IN_PROGRESS,
  TASK_STATUS_CONFIGS.IN_REVIEW,
  TASK_STATUS_CONFIGS.DONE,
]

// Option items formatted for BaseSelect dropdowns
export const TASK_STATUS_SELECT_OPTIONS = Object.values(TASK_STATUS_CONFIGS).map((c) => ({
  value: c.value,
  label: c.label,
  dotColor: c.dotClass,
  badgeClass: c.badgeClass,
}))

export const TASK_PRIORITY_SELECT_OPTIONS = Object.values(TASK_PRIORITY_CONFIGS).map((c) => ({
  value: c.value,
  label: c.label,
  dotColor: c.dotClass,
  badgeClass: c.badgeClass,
}))
