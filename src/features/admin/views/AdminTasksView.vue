<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  CheckSquare,
  MessageSquare,
  Search,
  AlertTriangle,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'
import BaseButton from '@/components/common/BaseButton.vue'
import { getTaskStatusConfig } from '@/utils/statusTheme'
import { adminService } from '@/features/admin/services/adminService'
import type { Task } from '@/features/tasks/types/task.types'
import type { TaskComment } from '@/features/tasks/types/comment.types'

const activeTab = ref<'tasks' | 'comments'>('tasks')
const isLoading = ref(true)
const isOperating = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Tasks state
const tasks = ref<Task[]>([])
const taskSearch = ref('')
const taskStatusFilter = ref('')
const taskIncludeDeleted = ref(true)
const taskPage = ref(1)
const taskTotalPages = ref(1)
const taskTotal = ref(0)

// Comments state
const comments = ref<TaskComment[]>([])
const commentIncludeDeleted = ref(true)
const commentPage = ref(1)
const commentTotalPages = ref(1)
const commentTotal = ref(0)

// Confirmation modal state
const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmCallback = ref<(() => Promise<void>) | null>(null)

function showNotice(msg: string, isErr = false) {
  if (isErr) {
    errorMessage.value = msg
    successMessage.value = null
  } else {
    successMessage.value = msg
    errorMessage.value = null
  }
  setTimeout(() => {
    errorMessage.value = null
    successMessage.value = null
  }, 5000)
}

async function loadTasks() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await adminService.getTasks({
      page: taskPage.value,
      size: 15,
      search: taskSearch.value.trim() || undefined,
      status: taskStatusFilter.value || undefined,
      include_deleted: taskIncludeDeleted.value,
    })
    tasks.value = res.items
    taskTotal.value = res.total
    taskTotalPages.value = res.pages || 1
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to load tasks', true)
  } finally {
    isLoading.value = false
  }
}

async function loadComments() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await adminService.getComments({
      page: commentPage.value,
      size: 15,
      include_deleted: commentIncludeDeleted.value,
    })
    comments.value = res.items
    commentTotal.value = res.total
    commentTotalPages.value = res.pages || 1
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to load comments', true)
  } finally {
    isLoading.value = false
  }
}

function openConfirm(title: string, msg: string, action: () => Promise<void>) {
  confirmTitle.value = title
  confirmMessage.value = msg
  confirmCallback.value = action
  confirmOpen.value = true
}

async function executeConfirm() {
  if (!confirmCallback.value) return
  isOperating.value = true
  try {
    await confirmCallback.value()
    confirmOpen.value = false
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Operation failed', true)
  } finally {
    isOperating.value = false
  }
}

// Task actions
function handleSoftDeleteTask(task: Task) {
  openConfirm(
    `Confirm Task Soft-Delete: ${task.title}`,
    `Are you sure you want to soft-delete task "${task.title}"? It will be hidden from team boards.`,
    async () => {
      await adminService.deleteTask(task.id)
      showNotice(`Task "${task.title}" soft-deleted.`)
      await loadTasks()
    }
  )
}

function handleRestoreTask(task: Task) {
  openConfirm(
    `Restore Task: ${task.title}`,
    `Restore task "${task.title}". The parent project and workspace must be active.`,
    async () => {
      await adminService.restoreTask(task.id)
      showNotice(`Task "${task.title}" restored successfully.`)
      await loadTasks()
    }
  )
}

// Comment actions
function handleSoftDeleteComment(comment: TaskComment) {
  openConfirm(
    `Confirm Comment Soft-Delete`,
    `Are you sure you want to moderate and remove this comment?`,
    async () => {
      await adminService.deleteComment(comment.id)
      showNotice('Comment soft-deleted.')
      await loadComments()
    }
  )
}

function handleRestoreComment(comment: TaskComment) {
  openConfirm(
    `Restore Moderated Comment`,
    `Restore comment #${comment.id}. The parent task and project must be active.`,
    async () => {
      await adminService.restoreComment(comment.id)
      showNotice('Comment restored successfully.')
      await loadComments()
    }
  )
}

onMounted(() => {
  loadTasks()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
          <CheckSquare class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tasks & Content Moderation</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Inspect all platform tasks and comments, remove inappropriate content, or restore deleted items.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <BaseButton variant="outline" size="sm" :loading="isLoading" @click="activeTab === 'tasks' ? loadTasks() : loadComments()">
          <RefreshCw class="w-4 h-4 mr-1.5" />
          Refresh
        </BaseButton>
      </div>
    </div>

    <!-- Alert Notices -->
    <div v-if="errorMessage" class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="errorMessage = null" class="hover:opacity-75"><X class="w-4 h-4" /></button>
    </div>

    <div v-if="successMessage" class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Check class="w-4 h-4 shrink-0" />
        <span>{{ successMessage }}</span>
      </div>
      <button @click="successMessage = null" class="hover:opacity-75"><X class="w-4 h-4" /></button>
    </div>

    <!-- Tab Buttons -->
    <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
      <button
        @click="activeTab = 'tasks'; loadTasks()"
        :class="[
          'px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 cursor-pointer',
          activeTab === 'tasks'
            ? 'border-purple-600 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/40'
            : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
        ]"
      >
        <CheckSquare class="w-4 h-4" />
        <span>Tasks</span>
      </button>

      <button
        @click="activeTab = 'comments'; loadComments()"
        :class="[
          'px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 cursor-pointer',
          activeTab === 'comments'
            ? 'border-purple-600 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/40'
            : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
        ]"
      >
        <MessageSquare class="w-4 h-4" />
        <span>Comments Moderation</span>
      </button>
    </div>

    <!-- TAB 1: TASKS -->
    <div v-if="activeTab === 'tasks'" class="space-y-4">
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div class="relative w-full sm:w-80">
            <Search class="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              v-model="taskSearch"
              type="text"
              placeholder="Search tasks..."
              @input="taskPage = 1; loadTasks()"
              class="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-900 dark:text-white"
            />
          </div>
          <select
            v-model="taskStatusFilter"
            @change="taskPage = 1; loadTasks()"
            class="px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="taskIncludeDeleted"
            @change="loadTasks"
            class="rounded text-purple-600 focus:ring-purple-500"
          />
          <span>Include Soft-Deleted Tasks</span>
        </label>
      </div>

      <!-- Tasks Table -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th class="px-5 py-3.5">Task</th>
                <th class="px-5 py-3.5">Project ID</th>
                <th class="px-5 py-3.5">Priority</th>
                <th class="px-5 py-3.5">Status</th>
                <th class="px-5 py-3.5">Lifecycle</th>
                <th class="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="t in tasks" :key="t.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td class="px-5 py-4">
                  <div class="font-semibold text-slate-900 dark:text-white">{{ t.title }}</div>
                  <div class="text-xs text-slate-400 font-mono">ID #{{ t.id }}</div>
                </td>
                <td class="px-5 py-4 text-xs text-slate-600 dark:text-slate-400">
                  Project #{{ t.project_id }}
                </td>
                <td class="px-5 py-4 text-xs font-semibold">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[11px] font-semibold',
                      t.priority === 'URGENT' || t.priority === 'HIGH'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    ]"
                  >
                    {{ t.priority }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    {{ getTaskStatusConfig(t.status).label }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <div v-if="t.deleted_at">
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      DELETED
                    </span>
                  </div>
                  <span v-else class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    ACTIVE
                  </span>
                </td>
                <td class="px-5 py-4 text-right space-x-2">
                  <button
                    v-if="!t.deleted_at"
                    @click="handleSoftDeleteTask(t)"
                    class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                  >
                    Soft-Delete
                  </button>
                  <button
                    v-else
                    @click="handleRestoreTask(t)"
                    class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                  >
                    Restore
                  </button>
                </td>
              </tr>
              <tr v-if="tasks.length === 0 && !isLoading">
                <td colspan="6" class="px-5 py-10 text-center text-slate-400 text-sm">
                  No tasks found matching criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Total: {{ taskTotal }} task(s)</span>
          <div class="flex items-center gap-2">
            <button
              :disabled="taskPage <= 1"
              @click="taskPage--; loadTasks()"
              class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span>Page {{ taskPage }} of {{ taskTotalPages }}</span>
            <button
              :disabled="taskPage >= taskTotalPages"
              @click="taskPage++; loadTasks()"
              class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: COMMENTS -->
    <div v-if="activeTab === 'comments'" class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-500">Inspect comments posted across tasks and attachments for moderation.</span>
        <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="commentIncludeDeleted"
            @change="loadComments"
            class="rounded text-purple-600 focus:ring-purple-500"
          />
          <span>Include Soft-Deleted Comments</span>
        </label>
      </div>

      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th class="px-5 py-3.5">ID</th>
                <th class="px-5 py-3.5">Task ID</th>
                <th class="px-5 py-3.5">Author</th>
                <th class="px-5 py-3.5">Content Preview</th>
                <th class="px-5 py-3.5">Lifecycle</th>
                <th class="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="c in comments" :key="c.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td class="px-5 py-4 font-mono text-xs">#{{ c.id }}</td>
                <td class="px-5 py-4 text-xs font-mono">Task #{{ c.task_id }}</td>
                <td class="px-5 py-4 text-xs font-medium text-slate-900 dark:text-white">
                  {{ c.author?.email || `User #${c.author_id}` }}
                </td>
                <td class="px-5 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-sm truncate" :title="c.content">
                  {{ c.content }}
                </td>
                <td class="px-5 py-4">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[11px] font-semibold',
                      c.deleted_at
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    ]"
                  >
                    {{ c.deleted_at ? 'DELETED' : 'ACTIVE' }}
                  </span>
                </td>
                <td class="px-5 py-4 text-right space-x-2">
                  <button
                    v-if="!c.deleted_at"
                    @click="handleSoftDeleteComment(c)"
                    class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    Moderate & Delete
                  </button>
                  <button
                    v-else
                    @click="handleRestoreComment(c)"
                    class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Restore
                  </button>
                </td>
              </tr>
              <tr v-if="comments.length === 0 && !isLoading">
                <td colspan="6" class="px-5 py-10 text-center text-slate-400 text-sm">
                  No comments found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Total: {{ commentTotal }} comment(s)</span>
          <div class="flex items-center gap-2">
            <button
              :disabled="commentPage <= 1"
              @click="commentPage--; loadComments()"
              class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span>Page {{ commentPage }} of {{ commentTotalPages }}</span>
            <button
              :disabled="commentPage >= commentTotalPages"
              @click="commentPage++; loadComments()"
              class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <div
      v-if="confirmOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div class="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <div class="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ confirmTitle }}</h3>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {{ confirmMessage }}
        </p>
        <div class="flex justify-end gap-3 pt-3">
          <BaseButton variant="outline" size="sm" @click="confirmOpen = false">
            Cancel
          </BaseButton>
          <BaseButton variant="primary" size="sm" :loading="isOperating" @click="executeConfirm">
            Confirm Action
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
