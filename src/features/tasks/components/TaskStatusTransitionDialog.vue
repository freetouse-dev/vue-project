<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { Task, TaskStatus } from '@/features/tasks/types/task.types'
import { getTaskStatusConfig } from '@/utils/statusTheme'
import BaseButton from '@/components/common/BaseButton.vue'
import {
  LucideArrowRight,
  LucideClock,
  LucideCheckCircle2,
  LucidePlay,
  LucideEye,
  LucideHelpCircle,
  LucideX,
} from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    task: Task | null
    newStatus: TaskStatus | null
    loading?: boolean
  }>(),
  {
    loading: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function close() {
  if (props.loading) return
  emit('update:modelValue', false)
  emit('cancel')
}

function handleConfirm() {
  emit('confirm')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue && !props.loading) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const transitionInfo = computed(() => {
  if (!props.task || !props.newStatus) {
    return {
      title: 'Move Task?',
      actionLabel: 'Confirm Move',
      icon: LucideHelpCircle,
      iconColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
      consequence: 'This will update the task status in the workflow.',
    }
  }

  const from = props.task.status
  const to = props.newStatus

  if (to === 'DONE') {
    return {
      title: 'Mark Task as Completed?',
      actionLabel: 'Mark as Completed',
      icon: LucideCheckCircle2,
      iconColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      consequence: 'Moving to Done marks this task as finished and archives it under completed work.',
    }
  }

  if (to === 'IN_REVIEW') {
    return {
      title: 'Submit Task for Review?',
      actionLabel: 'Submit for Review',
      icon: LucideEye,
      iconColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      consequence: 'Submitting for review indicates your implementation is ready for peer evaluation.',
    }
  }

  if (to === 'IN_PROGRESS') {
    return {
      title: 'Start Working on Task?',
      actionLabel: 'Start Task',
      icon: LucidePlay,
      iconColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      consequence: 'Moving to In Progress signals to your team that active work has begun.',
    }
  }

  if (to === 'TODO' && from === 'DONE') {
    return {
      title: 'Reopen Task?',
      actionLabel: 'Reopen Task',
      icon: LucideClock,
      iconColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
      consequence: 'Reopening this task moves it back into the active backlog/todo queue.',
    }
  }

  return {
    title: `Move Task to ${to.replace('_', ' ')}?`,
    actionLabel: 'Confirm Move',
    icon: LucideArrowRight,
    iconColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    consequence: `Task will transition from ${from.replace('_', ' ')} to ${to.replace('_', ' ')}.`,
  }
})
</script>

<template>
  <div
    v-if="modelValue && task && newStatus"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all animate-in fade-in zoom-in-95 space-y-4"
    >
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div
            class="p-2.5 rounded-xl shrink-0"
            :class="transitionInfo.iconColor"
          >
            <component :is="transitionInfo.icon" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {{ transitionInfo.title }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium mt-0.5">
              {{ task.ticket_key }}
            </p>
          </div>
        </div>
        <button
          type="button"
          :disabled="loading"
          class="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          @click="close"
        >
          <LucideX class="w-5 h-5" />
        </button>
      </div>

      <!-- Task Details & Visual Transition -->
      <div class="space-y-3">
        <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Task</span>
          <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {{ task.title }}
          </p>

          <div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
            <!-- Current Status -->
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">From:</span>
              <span
                class="text-xs px-2 py-0.5 rounded-md border font-medium truncate"
                :class="getTaskStatusConfig(task.status).badgeClass"
              >
                {{ getTaskStatusConfig(task.status).label }}
              </span>
            </div>

            <LucideArrowRight class="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />

            <!-- Intended Status -->
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">To:</span>
              <span
                class="text-xs px-2 py-0.5 rounded-md border font-bold truncate"
                :class="getTaskStatusConfig(newStatus).badgeClass"
              >
                {{ getTaskStatusConfig(newStatus).label }}
              </span>
            </div>
          </div>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed px-1">
          {{ transitionInfo.consequence }}
        </p>
      </div>

      <!-- Actions -->
      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
        <BaseButton
          type="button"
          variant="outline"
          size="sm"
          class="w-full sm:w-auto"
          :disabled="loading"
          @click="close"
        >
          Cancel
        </BaseButton>

        <BaseButton
          type="button"
          variant="primary"
          size="sm"
          class="w-full sm:w-auto"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ transitionInfo.actionLabel }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
