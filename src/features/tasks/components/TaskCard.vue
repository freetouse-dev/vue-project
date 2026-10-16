<script setup lang="ts">
import type { Task, TaskStatus } from '@/features/tasks/types/task.types'
import { getTaskPriorityConfig } from '@/utils/statusTheme'
import {
  LucideCalendar,
  LucideUser,
  LucideArrowRight,
} from 'lucide-vue-next'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  (e: 'click', task: Task): void
  (e: 'quick-status', task: Task, newStatus: TaskStatus): void
}>()

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

// Next status suggestion for quick advancement
function getNextStatus(current: TaskStatus): TaskStatus | null {
  switch (current) {
    case 'BACKLOG':
      return 'TODO'
    case 'TODO':
      return 'IN_PROGRESS'
    case 'IN_PROGRESS':
      return 'IN_REVIEW'
    case 'IN_REVIEW':
      return 'DONE'
    default:
      return null
  }
}

const nextStatus = getNextStatus(props.task.status)
</script>

<template>
  <div
    class="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer space-y-2.5 relative"
    @click="emit('click', task)"
  >
    <!-- Top row: Ticket Key & Priority -->
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
        {{ task.ticket_key }}
      </span>

      <span
        class="text-[11px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5"
        :class="getTaskPriorityConfig(task.priority).badgeClass"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="getTaskPriorityConfig(task.priority).dotClass"></span>
        {{ task.priority }}
      </span>
    </div>

    <!-- Title -->
    <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
      {{ task.title }}
    </h4>

    <!-- Description snippet if present -->
    <p
      v-if="task.description"
      class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed"
    >
      {{ task.description }}
    </p>

    <!-- Bottom metadata row: Assignee, Due Date, Quick Action -->
    <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
      <!-- Assignee -->
      <div class="flex items-center gap-1.5 min-w-0">
        <template v-if="task.assignee">
          <div
            class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0"
            :title="`Assigned to ${task.assignee.full_name} (${task.assignee.email})`"
          >
            {{ task.assignee.full_name.slice(0, 2).toUpperCase() }}
          </div>
          <span class="truncate text-[11px] font-medium text-slate-700 dark:text-slate-300 max-w-[100px]">
            {{ task.assignee.full_name }}
          </span>
        </template>
        <template v-else>
          <div
            class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0"
            title="Unassigned"
          >
            <LucideUser class="w-3.5 h-3.5" />
          </div>
          <span class="text-[11px] text-slate-400 dark:text-slate-500 italic">Unassigned</span>
        </template>
      </div>

      <!-- Due Date or Quick Advancement -->
      <div class="flex items-center gap-2">
        <span
          v-if="task.due_date"
          class="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium"
          title="Due Date"
        >
          <LucideCalendar class="w-3 h-3 text-slate-400 dark:text-slate-500" />
          {{ formatDate(task.due_date) }}
        </span>

        <!-- Quick advance button -->
        <button
          v-if="nextStatus"
          type="button"
          class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded transition-all cursor-pointer"
          :title="`Move to ${nextStatus}`"
          @click.stop="emit('quick-status', task, nextStatus)"
        >
          <LucideArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
