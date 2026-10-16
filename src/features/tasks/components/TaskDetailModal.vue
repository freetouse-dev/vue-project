<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceStore } from '@/stores/workspace'
import { taskService } from '@/features/tasks/services/taskService'
import { commentService } from '@/features/tasks/services/commentService'
import { formatApiError } from '@/services/apiClient'
import type { Task, TaskPriority, TaskStatus } from '@/features/tasks/types/task.types'
import type { TaskComment } from '@/features/tasks/types/comment.types'
import type { TaskActivity } from '@/features/tasks/types/activity.types'
import type { ProjectMember } from '@/features/projects/types/project.types'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import {
  TASK_STATUS_SELECT_OPTIONS,
  TASK_PRIORITY_SELECT_OPTIONS,
  getTaskPriorityConfig,
} from '@/utils/statusTheme'
import {
  LucideX,
  LucideAlertCircle,
  LucideClock,
  LucideMessageSquare,
  LucideActivity,
  LucideFileText,
  LucideTrash2,
  LucideSend,
  LucideUser,
} from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  task: Task | null
  workspaceSlug: string
  projectKey: string
  members?: ProjectMember[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', task: Task): void
}>()

const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()

// Tabs: details | comments | activity
const activeTab = ref<'details' | 'comments' | 'activity'>('details')

// Form Fields
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

const isEditing = ref(false)
const errorMessage = ref('')
const isSubmitting = ref(false)

// Comments State
const comments = ref<TaskComment[]>([])
const isLoadingComments = ref(false)
const newCommentContent = ref('')
const isPostingComment = ref(false)

// Activities State
const activities = ref<TaskActivity[]>([])
const isLoadingActivities = ref(false)

function syncFromTask() {
  if (!props.task) return
  title.value = props.task.title
  description.value = props.task.description || ''
  status.value = props.task.status
  priority.value = props.task.priority
  assigneeEmail.value = props.task.assignee?.email || ''
  dueDate.value = props.task.due_date ? props.task.due_date.slice(0, 10) : ''
  errorMessage.value = ''
  isEditing.value = false
  activeTab.value = 'details'
  comments.value = []
  activities.value = []
}

watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      syncFromTask()
      loadComments()
    }
  },
  { immediate: true }
)

watch(
  () => activeTab.value,
  (newTab) => {
    if (newTab === 'comments' && props.task) {
      loadComments()
    } else if (newTab === 'activity' && props.task) {
      loadActivities()
    }
  }
)

function close() {
  emit('update:modelValue', false)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handleStatusChange(newStatus: TaskStatus) {
  if (!props.task || props.task.status === newStatus) return

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const updated = await taskService.updateTask(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number,
      { status: newStatus }
    )
    status.value = updated.status
    emit('updated', updated)
    // Reload activity history if open
    if (activeTab.value === 'activity') {
      loadActivities()
    }
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isSubmitting.value = false
  }
}

async function handleSaveDetails() {
  if (!props.task) return
  errorMessage.value = ''

  if (!title.value.trim() || title.value.trim().length < 3) {
    errorMessage.value = 'Task title must be at least 3 characters.'
    return
  }

  isSubmitting.value = true
  try {
    const updated = await taskService.updateTask(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number,
      {
        title: title.value.trim(),
        description: description.value.trim() || null,
        priority: priority.value,
        assignee_email: assigneeEmail.value.trim() || null,
        due_date: dueDate.value ? new Date(dueDate.value).toISOString() : null,
      }
    )
    isEditing.value = false
    emit('updated', updated)
    if (activeTab.value === 'activity') {
      loadActivities()
    }
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isSubmitting.value = false
  }
}

// Comments API integration
async function loadComments() {
  if (!props.task) return
  isLoadingComments.value = true
  try {
    comments.value = await commentService.getComments(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number
    )
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isLoadingComments.value = false
  }
}

async function handleAddComment() {
  if (!props.task || !newCommentContent.value.trim()) return

  isPostingComment.value = true
  errorMessage.value = ''
  try {
    const created = await commentService.addComment(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number,
      { content: newCommentContent.value.trim() }
    )
    comments.value.push(created)
    newCommentContent.value = ''
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isPostingComment.value = false
  }
}

function canDeleteComment(comment: TaskComment): boolean {
  if (!authStore.user) return false
  if (comment.author_id === authStore.user.id) return true
  if (authStore.user.is_superuser) return true
  if (workspaceStore.currentWorkspace?.owner_id === authStore.user.id) return true
  return false
}

async function handleDeleteComment(commentId: number) {
  if (!props.task) return
  try {
    await commentService.deleteComment(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number,
      commentId
    )
    comments.value = comments.value.filter((c) => c.id !== commentId)
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  }
}

// Activity Trail API integration
async function loadActivities() {
  if (!props.task) return
  isLoadingActivities.value = true
  try {
    activities.value = await taskService.getTaskActivities(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number
    )
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isLoadingActivities.value = false
  }
}

function formatActionText(act: TaskActivity): string {
  switch (act.action) {
    case 'TASK_CREATED':
      return 'created this task'
    case 'STATUS_CHANGED':
      return `changed status from ${act.old_value || 'None'} to ${act.new_value}`
    case 'PRIORITY_CHANGED':
      return `changed priority from ${act.old_value || 'None'} to ${act.new_value}`
    case 'ASSIGNEE_CHANGED':
      return `reassigned task to ${act.new_value || 'Unassigned'}`
    case 'TITLE_CHANGED':
      return `updated title to "${act.new_value}"`
    case 'DESCRIPTION_CHANGED':
      return 'updated the task description'
    case 'DUE_DATE_CHANGED':
      return `changed due date to ${act.new_value || 'No deadline'}`
    default:
      return 'updated this task'
  }
}
</script>

<template>
  <div
    v-if="modelValue && task"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all animate-in fade-in zoom-in-95 space-y-4"
    >
      <!-- Top header bar: Ticket Key & Actions -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <span class="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900 shrink-0">
            {{ task.ticket_key }}
          </span>

          <!-- Quick Status Dropdown using BaseSelect -->
          <div class="w-44 shrink-0">
            <BaseSelect
              :model-value="task.status"
              :options="TASK_STATUS_SELECT_OPTIONS"
              size="sm"
              :disabled="isSubmitting"
              @update:model-value="(val) => handleStatusChange(val as TaskStatus)"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
            @click="close"
          >
            <LucideX class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Navigation Tabs: Details | Comments | Activity -->
      <div class="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          :class="
            activeTab === 'details'
              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          "
          @click="activeTab = 'details'"
        >
          <LucideFileText class="w-3.5 h-3.5" />
          Details
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          :class="
            activeTab === 'comments'
              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          "
          @click="activeTab = 'comments'"
        >
          <LucideMessageSquare class="w-3.5 h-3.5" />
          Comments
          <span
            v-if="comments.length > 0"
            class="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold"
          >
            {{ comments.length }}
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          :class="
            activeTab === 'activity'
              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          "
          @click="activeTab = 'activity'"
        >
          <LucideActivity class="w-3.5 h-3.5" />
          Activity Log
        </button>
      </div>

      <!-- Error message -->
      <div
        v-if="errorMessage"
        class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2"
      >
        <LucideAlertCircle class="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- TAB 1: DETAILS -->
      <div v-if="activeTab === 'details'">
        <!-- View Mode -->
        <div v-if="!isEditing" class="space-y-4">
          <!-- Title & Description -->
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {{ task.title }}
            </h3>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {{ task.description || 'No description provided.' }}
            </p>
          </div>

          <!-- Meta Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <!-- Priority -->
            <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">Priority</span>
              <div class="mt-1">
                <span
                  class="text-xs font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5"
                  :class="getTaskPriorityConfig(task.priority).badgeClass"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="getTaskPriorityConfig(task.priority).dotClass"></span>
                  {{ task.priority }}
                </span>
              </div>
            </div>

            <!-- Assignee -->
            <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">Assignee</span>
              <div class="flex items-center gap-2 mt-1">
                <template v-if="task.assignee">
                  <div class="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                    {{ task.assignee.full_name.slice(0, 2).toUpperCase() }}
                  </div>
                  <span class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ task.assignee.full_name }}</span>
                </template>
                <template v-else>
                  <span class="text-sm text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                </template>
              </div>
            </div>

            <!-- Due Date -->
            <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">Due Date</span>
              <p class="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {{ task.due_date ? formatDate(task.due_date) : 'No deadline' }}
              </p>
            </div>

            <!-- Author -->
            <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">Created By</span>
              <p class="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{{ task.creator.full_name }}</p>
            </div>
          </div>

          <!-- Timestamps -->
          <div class="pt-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span class="flex items-center gap-1">
              <LucideClock class="w-3.5 h-3.5" />
              Created {{ formatDate(task.created_at) }}
            </span>
            <span>Updated {{ formatDate(task.updated_at) }}</span>
          </div>

          <!-- Action Footer -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <BaseButton
              variant="outline"
              size="sm"
              @click="isEditing = true"
            >
              Edit Details
            </BaseButton>

            <BaseButton
              size="sm"
              variant="outline"
              @click="close"
            >
              Close
            </BaseButton>
          </div>
        </div>

        <!-- Edit Form Mode -->
        <form v-else class="space-y-4" @submit.prevent="handleSaveDetails">
          <div>
            <label for="edit-title" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title
            </label>
            <input
              id="edit-title"
              v-model="title"
              type="text"
              required
              class="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div>
            <label for="edit-desc" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              id="edit-desc"
              v-model="description"
              rows="3"
              class="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 resize-y"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BaseSelect
              v-model="priority"
              label="Priority"
              :options="TASK_PRIORITY_SELECT_OPTIONS"
            />

            <div>
              <BaseSelect
                v-if="members && members.length > 0"
                v-model="assigneeEmail"
                label="Assignee"
                :options="assigneeOptions"
              />
              <div v-else>
                <label for="edit-assignee-text" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assignee Email
                </label>
                <input
                  id="edit-assignee-text"
                  v-model="assigneeEmail"
                  type="email"
                  placeholder="member@example.com"
                  class="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label for="edit-due-date" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Due Date
            </label>
            <input
              id="edit-due-date"
              v-model="dueDate"
              type="date"
              class="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <BaseButton
              type="button"
              variant="outline"
              size="sm"
              :disabled="isSubmitting"
              @click="isEditing = false"
            >
              Cancel
            </BaseButton>

            <BaseButton
              type="submit"
              size="sm"
              :loading="isSubmitting"
            >
              Save Changes
            </BaseButton>
          </div>
        </form>
      </div>

      <!-- TAB 2: COMMENTS -->
      <div v-else-if="activeTab === 'comments'" class="space-y-4">
        <!-- New Comment Form -->
        <form class="space-y-2.5" @submit.prevent="handleAddComment">
          <label for="comment-input" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Add Comment
          </label>
          <textarea
            id="comment-input"
            v-model="newCommentContent"
            rows="3"
            placeholder="Write a comment or update on this task..."
            required
            class="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
          ></textarea>
          <div class="flex justify-end">
            <BaseButton
              type="submit"
              size="sm"
              :loading="isPostingComment"
              :disabled="!newCommentContent.trim()"
            >
              <LucideSend class="w-3.5 h-3.5 mr-1" />
              Post Comment
            </BaseButton>
          </div>
        </form>

        <!-- Comments List -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div v-if="isLoadingComments" class="py-6 text-center text-xs text-slate-400">
            Loading comments...
          </div>
          <div
            v-else-if="comments.length === 0"
            class="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic"
          >
            No comments yet. Be the first to start the discussion!
          </div>
          <div v-else class="space-y-3 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="comm in comments"
              :key="comm.id"
              class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                    {{ comm.author.full_name.slice(0, 2).toUpperCase() }}
                  </div>
                  <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {{ comm.author.full_name }}
                  </span>
                  <span class="text-[10px] text-slate-400">
                    {{ formatDate(comm.created_at) }}
                  </span>
                </div>

                <button
                  v-if="canDeleteComment(comm)"
                  type="button"
                  title="Delete comment"
                  class="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                  @click="handleDeleteComment(comm.id)"
                >
                  <LucideTrash2 class="w-3.5 h-3.5" />
                </button>
              </div>

              <p class="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pl-8">
                {{ comm.content }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: ACTIVITY LOG -->
      <div v-else-if="activeTab === 'activity'" class="space-y-3">
        <div v-if="isLoadingActivities" class="py-6 text-center text-xs text-slate-400">
          Loading activity trail...
        </div>
        <div
          v-else-if="activities.length === 0"
          class="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic"
        >
          No activity recorded for this task.
        </div>
        <div v-else class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          <div
            v-for="act in activities"
            :key="act.id"
            class="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
          >
            <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
              <LucideUser class="w-3.5 h-3.5" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-slate-800 dark:text-slate-200 leading-snug">
                <span class="font-semibold">{{ act.actor.full_name }}</span>
                {{ ' ' }}
                <span class="text-slate-600 dark:text-slate-400">{{ formatActionText(act) }}</span>
              </p>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                {{ formatDate(act.created_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
