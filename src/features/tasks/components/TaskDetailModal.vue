<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceStore } from '@/stores/workspace'
import { taskService } from '@/features/tasks/services/taskService'
import { commentService } from '@/features/tasks/services/commentService'
import { useNotification } from '@/composables/useNotification'
import { formatApiError } from '@/services/apiClient'
import type { Task, TaskPriority, TaskStatus } from '@/features/tasks/types/task.types'
import type { TaskComment } from '@/features/tasks/types/comment.types'
import type { TaskActivity } from '@/features/tasks/types/activity.types'
import type { ProjectMember } from '@/features/projects/types/project.types'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import CommentAttachmentList from '@/features/tasks/components/CommentAttachmentList.vue'
import TaskStatusTransitionDialog from '@/features/tasks/components/TaskStatusTransitionDialog.vue'
import {
  TASK_STATUS_SELECT_OPTIONS,
  TASK_PRIORITY_SELECT_OPTIONS,
  getTaskPriorityConfig,
  getTaskStatusConfig,
} from '@/utils/statusTheme'
import {
  LucideX,
  LucideAlertCircle,
  LucideClock,
  LucideMessageSquare,
  LucideActivity,
  LucideFileText,
  LucideTrash2,
  LucideEdit,
  LucideSend,
  LucideUser,
  LucideCheck,
  LucidePaperclip,
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
  (e: 'deleted', taskNumber: number): void
}>()

const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()
const notify = useNotification()

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

// Delete Task Dialog
const showDeleteTaskDialog = ref(false)
const isDeletingTask = ref(false)

// Status Transition Dialog
const showStatusTransitionDialog = ref(false)
const pendingTargetStatus = ref<TaskStatus | null>(null)
const isSubmittingTransition = ref(false)

// Comments State
const comments = ref<TaskComment[]>([])
const isLoadingComments = ref(false)
const newCommentContent = ref('')
const isPostingComment = ref(false)

// Attachments State
interface StagedAttachment {
  file: File
  previewUrl?: string
  isImage: boolean
}
const stagedAttachments = ref<StagedAttachment[]>([])
const attachmentInputRef = ref<HTMLInputElement | null>(null)

function triggerAttachmentInput() {
  attachmentInputRef.value?.click()
}

function handleAttachmentSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files) return
  addFilesToStaged(Array.from(target.files))
  target.value = ''
}

function handleCommentDrop(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer?.files) {
    addFilesToStaged(Array.from(e.dataTransfer.files))
  }
}

function addFilesToStaged(files: File[]) {
  errorMessage.value = ''
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  for (const file of files) {
    if (stagedAttachments.value.length >= 5) {
      notify.warning('Maximum 5 attachments allowed per comment.')
      break
    }
    if (file.size > 10 * 1024 * 1024) {
      notify.error(`File "${file.name}" exceeds 10MB limit.`)
      continue
    }
    const isAllowed = allowed.includes(file.type) || file.name.endsWith('.docx') || file.name.endsWith('.pdf')
    if (!isAllowed) {
      notify.error(`File "${file.name}" is not a supported format (JPEG, PNG, WebP, GIF, PDF, DOCX).`)
      continue
    }

    const isImage = file.type.startsWith('image/')
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined
    stagedAttachments.value.push({ file, previewUrl, isImage })
  }
}

function removeStagedAttachment(index: number) {
  const item = stagedAttachments.value[index]
  if (item.previewUrl) {
    URL.revokeObjectURL(item.previewUrl)
  }
  stagedAttachments.value.splice(index, 1)
}

function clearStagedAttachments() {
  stagedAttachments.value.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
  })
  stagedAttachments.value = []
}

// Edit Comment State
const editingCommentId = ref<number | null>(null)
const editingCommentContent = ref('')
const isUpdatingComment = ref(false)

// Delete Comment State
const showDeleteCommentDialog = ref(false)
const commentToDelete = ref<TaskComment | null>(null)
const isDeletingComment = ref(false)

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
  editingCommentId.value = null
  clearStagedAttachments()
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

// Status transition triggered by header dropdown
function promptStatusChange(newStatus: TaskStatus) {
  if (!props.task || props.task.status === newStatus) return
  pendingTargetStatus.value = newStatus
  showStatusTransitionDialog.value = true
}

async function confirmStatusTransition() {
  if (!props.task || !pendingTargetStatus.value) return
  isSubmittingTransition.value = true
  errorMessage.value = ''
  try {
    const updated = await taskService.updateTask(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number,
      { status: pendingTargetStatus.value }
    )
    status.value = updated.status
    emit('updated', updated)
    notify.success(`Status updated to ${getTaskStatusConfig(updated.status).label}`)
    showStatusTransitionDialog.value = false
    pendingTargetStatus.value = null
    if (activeTab.value === 'activity') {
      loadActivities()
    }
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
    notify.error(errorMessage.value)
  } finally {
    isSubmittingTransition.value = false
  }
}

function cancelStatusTransition() {
  pendingTargetStatus.value = null
  showStatusTransitionDialog.value = false
}

// Delete Task Handler
async function confirmDeleteTask() {
  if (!props.task) return
  isDeletingTask.value = true
  try {
    await taskService.deleteTask(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number
    )
    showDeleteTaskDialog.value = false
    emit('deleted', props.task.task_number)
    close()
  } catch (err: unknown) {
    notify.error(formatApiError(err))
  } finally {
    isDeletingTask.value = false
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
    notify.success('Task details updated')
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
  if (!props.task || (!newCommentContent.value.trim() && stagedAttachments.value.length === 0)) return

  isPostingComment.value = true
  errorMessage.value = ''
  try {
    const created = await commentService.addComment(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number,
      { content: newCommentContent.value.trim() || '(Attachment)' }
    )

    if (stagedAttachments.value.length > 0) {
      const filesToUpload = stagedAttachments.value.map((item) => item.file)
      try {
        const uploadedAttachments = await commentService.uploadAttachments(
          props.workspaceSlug,
          props.projectKey,
          props.task.task_number,
          created.id,
          filesToUpload
        )
        created.attachments = uploadedAttachments
      } catch (attErr: unknown) {
        notify.warning('Comment posted, but attachments failed: ' + formatApiError(attErr))
      }
    }

    comments.value.push(created)
    newCommentContent.value = ''
    clearStagedAttachments()
    notify.success('Comment added')
    if (activeTab.value === 'activity') {
      loadActivities()
    }
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isPostingComment.value = false
  }
}

async function handleDeleteAttachment(commentId: number, attachmentId: number) {
  if (!props.task) return
  try {
    await commentService.deleteAttachment(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number,
      commentId,
      attachmentId
    )
    const comm = comments.value.find((c) => c.id === commentId)
    if (comm && comm.attachments) {
      comm.attachments = comm.attachments.filter((a) => a.id !== attachmentId)
    }
    notify.success('Attachment removed')
  } catch (err: unknown) {
    notify.error(formatApiError(err))
  }
}

function canManageComment(comment: TaskComment): boolean {
  if (!authStore.user) return false
  if (comment.author_id === authStore.user.id) return true
  if (authStore.user.is_superuser) return true
  if (workspaceStore.currentWorkspace?.owner_id === authStore.user.id) return true
  return false
}

function startEditComment(comment: TaskComment) {
  editingCommentId.value = comment.id
  editingCommentContent.value = comment.content
}

function cancelEditComment() {
  editingCommentId.value = null
  editingCommentContent.value = ''
}

async function handleSaveEditedComment(commentId: number) {
  if (!props.task || !editingCommentContent.value.trim()) return
  isUpdatingComment.value = true
  try {
    const updated = await commentService.updateComment(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number,
      commentId,
      editingCommentContent.value.trim()
    )
    const idx = comments.value.findIndex((c) => c.id === commentId)
    if (idx !== -1) {
      comments.value[idx] = updated
    }
    editingCommentId.value = null
    editingCommentContent.value = ''
    notify.success('Comment updated')
  } catch (err: unknown) {
    notify.error(formatApiError(err))
  } finally {
    isUpdatingComment.value = false
  }
}

function promptDeleteComment(comment: TaskComment) {
  commentToDelete.value = comment
  showDeleteCommentDialog.value = true
}

async function confirmDeleteComment() {
  if (!props.task || !commentToDelete.value) return
  isDeletingComment.value = true
  try {
    await commentService.deleteComment(
      props.workspaceSlug,
      props.projectKey,
      props.task.task_number,
      commentToDelete.value.id
    )
    comments.value = comments.value.filter((c) => c.id !== commentToDelete.value?.id)
    notify.success('Comment deleted')
    showDeleteCommentDialog.value = false
    commentToDelete.value = null
  } catch (err: unknown) {
    notify.error(formatApiError(err))
  } finally {
    isDeletingComment.value = false
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
      <!-- Top header bar: Ticket Key, Quick Status, Delete, Close -->
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
              @update:model-value="(val) => promptStatusChange(val as TaskStatus)"
            />
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <!-- Delete Task Button -->
          <button
            type="button"
            class="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Delete task"
            @click="showDeleteTaskDialog = true"
          >
            <LucideTrash2 class="w-4 h-4" />
          </button>

          <!-- Close Modal Button -->
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
                  <UserAvatar :user="task.assignee" size="xs" />
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
              <div class="flex items-center gap-2 mt-1">
                <UserAvatar :user="task.creator" size="xs" />
                <span class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ task.creator.full_name }}</span>
              </div>
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
              <LucideEdit class="w-3.5 h-3.5 mr-1" />
              Edit Details
            </BaseButton>

            <div class="flex items-center gap-2">
              <BaseButton
                size="sm"
                variant="outline"
                class="hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800 text-rose-600 dark:text-rose-400"
                @click="showDeleteTaskDialog = true"
              >
                <LucideTrash2 class="w-3.5 h-3.5 mr-1" />
                Delete Task
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
        <form
          class="space-y-2.5 rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50"
          @submit.prevent="handleAddComment"
          @dragover.prevent
          @drop="handleCommentDrop"
        >
          <div class="flex items-center justify-between">
            <label for="comment-input" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Add Comment
            </label>
            <span class="text-[11px] text-slate-400 dark:text-slate-500">
              Drop files here or click paperclip
            </span>
          </div>

          <textarea
            id="comment-input"
            v-model="newCommentContent"
            rows="3"
            placeholder="Write a comment or update on this task..."
            :required="stagedAttachments.length === 0"
            class="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 resize-y"
          ></textarea>

          <!-- Hidden Attachment File Input -->
          <input
            ref="attachmentInputRef"
            type="file"
            multiple
            class="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.docx"
            @change="handleAttachmentSelect"
          />

          <!-- Staged Attachments Preview -->
          <div v-if="stagedAttachments.length > 0" class="flex flex-wrap gap-2 pt-1">
            <div
              v-for="(staged, idx) in stagedAttachments"
              :key="idx"
              class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs"
            >
              <img
                v-if="staged.isImage && staged.previewUrl"
                :src="staged.previewUrl"
                alt="Preview"
                class="w-6 h-6 rounded object-cover border border-slate-200 dark:border-slate-700"
              />
              <LucideFileText v-else class="w-4 h-4 text-indigo-500" />
              <span class="max-w-[140px] truncate font-medium" :title="staged.file.name">{{ staged.file.name }}</span>
              <span class="text-[10px] text-slate-400">({{ (staged.file.size / 1024).toFixed(0) }} KB)</span>
              <button
                type="button"
                class="p-0.5 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Remove attachment"
                @click="removeStagedAttachment(idx)"
              >
                <LucideX class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <BaseButton
              type="button"
              variant="outline"
              size="sm"
              title="Attach files (JPEG, PNG, WebP, GIF, PDF, DOCX up to 10MB)"
              @click="triggerAttachmentInput"
            >
              <LucidePaperclip class="w-3.5 h-3.5 mr-1" />
              Attach
              <span v-if="stagedAttachments.length > 0" class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                {{ stagedAttachments.length }}
              </span>
            </BaseButton>

            <BaseButton
              type="submit"
              size="sm"
              :loading="isPostingComment"
              :disabled="!newCommentContent.trim() && stagedAttachments.length === 0"
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
          <div v-else class="space-y-3 max-h-80 overflow-y-auto pr-1">
            <div
              v-for="comm in comments"
              :key="comm.id"
              class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UserAvatar :user="comm.author" size="xs" />
                  <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {{ comm.author.full_name }}
                  </span>
                  <span class="text-[10px] text-slate-400">
                    {{ formatDate(comm.created_at) }}
                  </span>
                </div>

                <!-- Comment Actions (Edit / Delete) -->
                <div v-if="canManageComment(comm)" class="flex items-center gap-1">
                  <button
                    v-if="comm.author_id === authStore.user?.id || authStore.user?.is_superuser"
                    type="button"
                    title="Edit comment"
                    class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md transition-colors cursor-pointer"
                    @click="startEditComment(comm)"
                  >
                    <LucideEdit class="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    title="Delete comment"
                    class="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                    @click="promptDeleteComment(comm)"
                  >
                    <LucideTrash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Inline Edit Form -->
              <div v-if="editingCommentId === comm.id" class="space-y-2 mt-2">
                <textarea
                  v-model="editingCommentContent"
                  rows="2"
                  class="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                ></textarea>
                <div class="flex justify-end gap-2">
                  <BaseButton
                    size="sm"
                    variant="outline"
                    :disabled="isUpdatingComment"
                    @click="cancelEditComment"
                  >
                    Cancel
                  </BaseButton>
                  <BaseButton
                    size="sm"
                    :loading="isUpdatingComment"
                    :disabled="!editingCommentContent.trim()"
                    @click="handleSaveEditedComment(comm.id)"
                  >
                    <LucideCheck class="w-3 h-3 mr-1" />
                    Save
                  </BaseButton>
                </div>
              </div>

              <!-- Comment Content Display -->
              <div v-else class="space-y-2 pl-8">
                <p class="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {{ comm.content }}
                </p>

                <!-- Comment Attachments -->
                <CommentAttachmentList
                  v-if="comm.attachments && comm.attachments.length > 0"
                  :attachments="comm.attachments"
                  :can-delete="canManageComment(comm)"
                  @delete="(attId) => handleDeleteAttachment(comm.id, attId)"
                />
              </div>
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

    <!-- Confirm Delete Task Dialog -->
    <ConfirmDialog
      v-model="showDeleteTaskDialog"
      title="Delete Task"
      :message="`Are you sure you want to delete task &quot;${task?.ticket_key} - ${task?.title}&quot;? This action will archive the task.`"
      confirm-text="Delete Task"
      variant="danger"
      :loading="isDeletingTask"
      @confirm="confirmDeleteTask"
    />

    <!-- Confirm Delete Comment Dialog -->
    <ConfirmDialog
      v-model="showDeleteCommentDialog"
      title="Delete Comment"
      message="Are you sure you want to delete this comment? This action cannot be undone."
      confirm-text="Delete Comment"
      variant="danger"
      :loading="isDeletingComment"
      @confirm="confirmDeleteComment"
    />

    <!-- Task Status Transition Dialog -->
    <TaskStatusTransitionDialog
      v-model="showStatusTransitionDialog"
      :task="task"
      :new-status="pendingTargetStatus"
      :loading="isSubmittingTransition"
      @confirm="confirmStatusTransition"
      @cancel="cancelStatusTransition"
    />
  </div>
</template>
