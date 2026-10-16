<script setup lang="ts">
import { ref, computed } from 'vue'
import { taskService } from '@/features/tasks/services/taskService'
import { formatApiError } from '@/services/apiClient'
import type { Task, TaskPriority, TaskStatus } from '@/features/tasks/types/task.types'
import type { ProjectMember } from '@/features/projects/types/project.types'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import {
  TASK_STATUS_SELECT_OPTIONS,
  TASK_PRIORITY_SELECT_OPTIONS,
} from '@/utils/statusTheme'
import { LucideCheckSquare, LucideX, LucideAlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  workspaceSlug: string
  projectKey: string
  members?: ProjectMember[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', task: Task): void
}>()

const title = ref('')
const description = ref('')
const status = ref<TaskStatus>('TODO')
const priority = ref<TaskPriority>('MEDIUM')
const assigneeEmail = ref('')
const dueDate = ref('')

const assigneeOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...(props.members || []).map((m) => ({
    value: m.user.email,
    label: `${m.user.full_name} (${m.role})`,
  })),
])

const errorMessage = ref('')
const isSubmitting = ref(false)

function close() {
  title.value = ''
  description.value = ''
  status.value = 'TODO'
  priority.value = 'MEDIUM'
  assigneeEmail.value = ''
  dueDate.value = ''
  errorMessage.value = ''
  emit('update:modelValue', false)
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!title.value.trim() || title.value.trim().length < 3) {
    errorMessage.value = 'Task title must be at least 3 characters.'
    return
  }

  isSubmitting.value = true
  try {
    const created = await taskService.createTask(props.workspaceSlug, props.projectKey, {
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      status: status.value,
      priority: priority.value,
      assignee_email: assigneeEmail.value.trim() || undefined,
      due_date: dueDate.value ? new Date(dueDate.value).toISOString() : undefined,
    })

    emit('created', created)
    close()
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all animate-in fade-in zoom-in-95"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <LucideCheckSquare class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              Create New Task
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Add a ticket to project <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ projectKey }}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
          @click="close"
        >
          <LucideX class="w-5 h-5" />
        </button>
      </div>

      <!-- Error notification -->
      <div
        v-if="errorMessage"
        class="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2"
      >
        <LucideAlertCircle class="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Form -->
      <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
        <!-- Title -->
        <BaseInput
          id="task-title"
          v-model="title"
          label="Task Title"
          placeholder="e.g. Implement user login with OAuth2"
          required
          autofocus
        />

        <!-- Description -->
        <div>
          <label for="task-desc" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description <span class="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
          </label>
          <textarea
            id="task-desc"
            v-model="description"
            rows="3"
            placeholder="Add context, acceptance criteria, or technical details..."
            class="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors resize-y"
          ></textarea>
        </div>

        <!-- Status & Priority Row with BaseSelect -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BaseSelect
            v-model="status"
            label="Initial Status"
            :options="TASK_STATUS_SELECT_OPTIONS"
          />

          <BaseSelect
            v-model="priority"
            label="Priority"
            :options="TASK_PRIORITY_SELECT_OPTIONS"
          />
        </div>

        <!-- Assignee & Due Date Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <BaseSelect
              v-if="members && members.length > 0"
              v-model="assigneeEmail"
              label="Assignee"
              :options="assigneeOptions"
            />
            <div v-else>
              <label for="task-assignee-text" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assignee Email
              </label>
              <input
                id="task-assignee-text"
                v-model="assigneeEmail"
                type="email"
                placeholder="member@example.com"
                class="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label for="task-due-date" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Due Date
            </label>
            <input
              id="task-due-date"
              v-model="dueDate"
              type="date"
              class="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <BaseButton
            type="button"
            variant="outline"
            size="sm"
            :disabled="isSubmitting"
            @click="close"
          >
            Cancel
          </BaseButton>
          <BaseButton
            type="submit"
            size="sm"
            :loading="isSubmitting"
          >
            Create Task
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
