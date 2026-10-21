<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceStore } from '@/stores/workspace'
import { dashboardService, type UserDashboardData } from '@/features/dashboard/services/dashboardService'
import { useNotification } from '@/composables/useNotification'
import { formatApiError } from '@/services/apiClient'
import type { Task } from '@/features/tasks/types/task.types'
import { getTaskPriorityConfig, getTaskStatusConfig } from '@/utils/statusTheme'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import TaskDetailModal from '@/features/tasks/components/TaskDetailModal.vue'
import CreateWorkspaceModal from '@/features/workspaces/components/CreateWorkspaceModal.vue'
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  FolderKanban,
  Plus,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()
const notify = useNotification()

const user = computed(() => authStore.user)
const workspaces = computed(() => workspaceStore.workspaces)

const isLoading = ref(true)
const dashboardData = ref<UserDashboardData | null>(null)
const selectedFilter = ref<string>('all')

// Modals
const showCreateWsModal = ref(false)
const selectedTask = ref<Task | null>(null)
const showTaskDetailModal = ref(false)
const activeTaskWorkspaceSlug = ref('')
const activeTaskProjectKey = ref('')

const filteredTasks = computed(() => {
  if (!dashboardData.value) return []
  if (selectedFilter.value === 'all') return dashboardData.value.assigned_tasks
  return dashboardData.value.assigned_tasks.filter((t) => t.status === selectedFilter.value)
})

async function loadDashboard() {
  isLoading.value = true
  try {
    const [data] = await Promise.all([
      dashboardService.getDashboardData(),
      workspaceStore.fetchWorkspaces(),
    ])
    dashboardData.value = data
  } catch (err: unknown) {
    notify.error(formatApiError(err))
  } finally {
    isLoading.value = false
  }
}

function openTaskDetail(task: Task) {
  selectedTask.value = task
  // Find project and workspace for this task
  if (workspaces.value.length > 0) {
    activeTaskWorkspaceSlug.value = workspaces.value[0].slug
    activeTaskProjectKey.value = task.ticket_key.split('-')[0]
  }
  showTaskDetailModal.value = true
}

function handleTaskUpdated(updated: Task) {
  if (dashboardData.value) {
    const idx = dashboardData.value.assigned_tasks.findIndex((t) => t.id === updated.id)
    if (idx !== -1) {
      dashboardData.value.assigned_tasks[idx] = updated
    }
  }
  selectedTask.value = updated
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Header Banner -->
    <div class="p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-md relative overflow-hidden">
      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <UserAvatar :user="user" size="xl" class="ring-4 ring-white/20 shadow-lg" />
          <div class="space-y-1">
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {{ user?.full_name }}! 👋
            </h1>
            <p class="text-indigo-100 text-xs sm:text-sm">
              Here is your personal project workflow and tasks overview.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-colors cursor-pointer"
            @click="showCreateWsModal = true"
          >
            <Plus class="w-4 h-4" />
            <span>New Workspace</span>
          </button>

          <router-link
            to="/workspaces"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-indigo-700 hover:bg-indigo-50 shadow-xs transition-colors"
          >
            <FolderKanban class="w-4 h-4 text-indigo-600" />
            <span>All Workspaces</span>
          </router-link>
        </div>
      </div>

      <!-- Subtle background circles -->
      <div class="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none"></div>
      <div class="absolute right-20 -top-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none"></div>
    </div>

    <LoadingSpinner v-if="isLoading" message="Loading your personal workspace dashboard..." />

    <template v-else-if="dashboardData">
      <!-- Top Metrics Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Assigned Tasks</span>
            <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CheckSquare class="w-4 h-4" />
            </div>
          </div>
          <div class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {{ dashboardData.total_assigned }}
          </div>
          <p class="text-[11px] text-slate-400">Active tasks across all projects</p>
        </div>

        <div class="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">In Progress</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock class="w-4 h-4" />
            </div>
          </div>
          <div class="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {{ dashboardData.status_counts['IN_PROGRESS'] || 0 }}
          </div>
          <p class="text-[11px] text-slate-400">Tasks currently being executed</p>
        </div>

        <div class="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Completed</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 class="w-4 h-4" />
            </div>
          </div>
          <div class="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {{ dashboardData.status_counts['DONE'] || 0 }}
          </div>
          <p class="text-[11px] text-slate-400">Tasks verified and closed</p>
        </div>

        <div class="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">My Workspaces</span>
            <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers class="w-4 h-4" />
            </div>
          </div>
          <div class="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
            {{ dashboardData.workspaces_count }}
          </div>
          <p class="text-[11px] text-slate-400">Active workspace memberships</p>
        </div>
      </div>

      <!-- Main Two-Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: My Assigned Tasks Table -->
        <div class="lg:col-span-2 space-y-4">
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare class="w-4 h-4 text-indigo-600" />
                  My Assigned Tasks
                </h2>
                <p class="text-xs text-slate-400">Review deliverables assigned to your account</p>
              </div>

              <!-- Status filter chips -->
              <div class="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
                  :class="selectedFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'"
                  @click="selectedFilter = 'all'"
                >
                  All ({{ dashboardData.total_assigned }})
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
                  :class="selectedFilter === 'TODO' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'"
                  @click="selectedFilter = 'TODO'"
                >
                  To Do
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
                  :class="selectedFilter === 'IN_PROGRESS' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'"
                  @click="selectedFilter = 'IN_PROGRESS'"
                >
                  In Progress
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
                  :class="selectedFilter === 'DONE' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'"
                  @click="selectedFilter = 'DONE'"
                >
                  Done
                </button>
              </div>
            </div>

            <!-- Tasks Table / Empty State -->
            <div v-if="filteredTasks.length === 0" class="py-12 text-center space-y-2">
              <CheckCircle2 class="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">No tasks in this category</p>
              <p class="text-xs text-slate-400">All clear! Check other workspaces or take a break.</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th class="py-2.5 px-3">Ticket</th>
                    <th class="py-2.5 px-3">Title</th>
                    <th class="py-2.5 px-3">Status</th>
                    <th class="py-2.5 px-3">Priority</th>
                    <th class="py-2.5 px-3 text-right">Due Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <tr
                    v-for="task in filteredTasks"
                    :key="task.id"
                    class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    @click="openTaskDetail(task)"
                  >
                    <td class="py-3 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {{ task.ticket_key }}
                    </td>
                    <td class="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {{ task.title }}
                    </td>
                    <td class="py-3 px-3">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-semibold border inline-flex items-center gap-1"
                        :class="getTaskStatusConfig(task.status).badgeClass"
                      >
                        <span class="w-1.5 h-1.5 rounded-full" :class="getTaskStatusConfig(task.status).dotClass"></span>
                        {{ task.status }}
                      </span>
                    </td>
                    <td class="py-3 px-3">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                        :class="getTaskPriorityConfig(task.priority).badgeClass"
                      >
                        {{ task.priority }}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-right text-slate-500 dark:text-slate-400">
                      {{ formatDate(task.due_date) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Column: My Workspaces & Recent Activity -->
        <div class="space-y-6">
          <!-- Workspaces Quick Access -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban class="w-4 h-4 text-indigo-600" />
                Workspaces
              </h3>
              <router-link to="/workspaces" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                View all
              </router-link>
            </div>

            <div v-if="workspaces.length === 0" class="py-6 text-center text-xs text-slate-400">
              No workspaces joined yet. Create one to get started!
            </div>

            <div v-else class="space-y-2">
              <router-link
                v-for="ws in workspaces.slice(0, 4)"
                :key="ws.id"
                :to="`/workspaces/${ws.slug}`"
                class="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div class="flex items-center gap-2.5 min-w-0 pr-2">
                  <div class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    {{ ws.name.slice(0, 2).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{{ ws.name }}</p>
                    <p class="text-[10px] text-slate-400 font-mono truncate">/{{ ws.slug }}</p>
                  </div>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </router-link>
            </div>
          </div>

          <!-- Recent Activity Trail -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity class="w-4 h-4 text-indigo-600" />
              Recent Task Updates
            </h3>

            <div v-if="dashboardData.recent_activities.length === 0" class="py-6 text-center text-xs text-slate-400">
              No recent activity recorded.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="act in dashboardData.recent_activities"
                :key="act.id"
                class="flex items-start gap-2.5 text-xs"
              >
                <UserAvatar :user="act.actor" size="xs" class="mt-0.5" />
                <div class="min-w-0 flex-1">
                  <p class="text-slate-700 dark:text-slate-300 leading-tight">
                    <strong class="font-semibold text-slate-900 dark:text-white">{{ act.actor?.full_name || 'Someone' }}</strong>
                    updated task
                  </p>
                  <span class="text-[10px] text-slate-400">{{ formatRelativeTime(act.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Task Detail Modal -->
    <TaskDetailModal
      v-model="showTaskDetailModal"
      :task="selectedTask"
      :workspace-slug="activeTaskWorkspaceSlug"
      :project-key="activeTaskProjectKey"
      @updated="handleTaskUpdated"
    />

    <!-- Create Workspace Modal -->
    <CreateWorkspaceModal
      v-model="showCreateWsModal"
      @created="loadDashboard"
    />
  </div>
</template>
