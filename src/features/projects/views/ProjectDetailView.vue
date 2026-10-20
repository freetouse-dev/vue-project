<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectService } from '@/features/projects/services/projectService'
import { taskService } from '@/features/tasks/services/taskService'
import { reportService } from '@/features/projects/services/reportService'
import { useNotification } from '@/composables/useNotification'
import { formatApiError } from '@/services/apiClient'
import type { Project, ProjectMember } from '@/features/projects/types/project.types'
import type { Task, TaskPriority, TaskStatus } from '@/features/tasks/types/task.types'
import type { ProjectDashboardResponse } from '@/features/projects/types/report.types'
import AddProjectMemberModal from '@/features/projects/components/AddProjectMemberModal.vue'
import EditProjectModal from '@/features/projects/components/EditProjectModal.vue'
import CreateTaskModal from '@/features/tasks/components/CreateTaskModal.vue'
import TaskDetailModal from '@/features/tasks/components/TaskDetailModal.vue'
import TaskCard from '@/features/tasks/components/TaskCard.vue'
import TaskStatusTransitionDialog from '@/features/tasks/components/TaskStatusTransitionDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import {
  KANBAN_PRIMARY_COLUMNS,
  TASK_STATUS_SELECT_OPTIONS,
  TASK_PRIORITY_SELECT_OPTIONS,
  getTaskPriorityConfig,
  getTaskStatusConfig,
} from '@/utils/statusTheme'
import {
  LucideFolderKanban,
  LucideUsers,
  LucideUserPlus,
  LucideCalendar,
  LucideShield,
  LucideEdit,
  LucideTrash2,
  LucideLayers,
  LucidePlus,
  LucideLayoutGrid,
  LucideList,
  LucideCheckSquare,
  LucideSearch,
  LucideArrowUpDown,
  LucideUserMinus,
  LucideX,
  LucideFilter,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const notify = useNotification()

const slug = computed(() => route.params.slug as string)
const key = computed(() => route.params.key as string)

const project = ref<Project | null>(null)
const members = ref<ProjectMember[]>([])
const tasks = ref<Task[]>([])
const dashboard = ref<ProjectDashboardResponse | null>(null)
const isLoading = ref(true)
const isLoadingTasks = ref(false)
const errorMessage = ref('')

// Modal visibility states
const showAddMemberModal = ref(false)
const showEditProjectModal = ref(false)
const showDeleteProjectDialog = ref(false)
const isDeletingProject = ref(false)
const showCreateTaskModal = ref(false)
const showTaskDetailModal = ref(false)
const selectedTask = ref<Task | null>(null)

// Member removal state
const showRemoveMemberDialog = ref(false)
const memberToRemove = ref<ProjectMember | null>(null)
const isRemovingMember = ref(false)

// Status transition state
const showStatusTransitionDialog = ref(false)
const pendingStatusTransition = ref<{
  task: Task
  targetStatus: TaskStatus
  sourceStatus: TaskStatus
} | null>(null)
const isSubmittingTransition = ref(false)
const activeDragColumn = ref<TaskStatus | null>(null)

const activeTab = ref<'overview' | 'members' | 'tasks'>('overview')
const viewMode = ref<'kanban' | 'list'>('kanban')

// Search, Sort, Filters, and Pagination
const searchQuery = ref('')
const filterStatus = ref<TaskStatus | ''>('')
const filterPriority = ref<TaskPriority | ''>('')
const sortBy = ref('task_number')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const pageSize = ref(20)
const totalTasks = ref(0)
const totalPages = ref(1)

const kanbanColumns = KANBAN_PRIMARY_COLUMNS

const filterStatusOptions = [
  { value: '', label: 'All Statuses' },
  ...TASK_STATUS_SELECT_OPTIONS,
]

const filterPriorityOptions = [
  { value: '', label: 'All Priorities' },
  ...TASK_PRIORITY_SELECT_OPTIONS,
]

const sortByOptions = [
  { value: 'task_number', label: 'Key' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'created_at', label: 'Created' },
]

// Active filter tracking
const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim().length > 0 ||
    filterStatus.value !== '' ||
    filterPriority.value !== ''
  )
})

const activeFilterCount = computed(() => {
  let count = 0
  if (searchQuery.value.trim().length > 0) count++
  if (filterStatus.value !== '') count++
  if (filterPriority.value !== '') count++
  return count
})

function clearFilters() {
  searchQuery.value = ''
  filterStatus.value = ''
  filterPriority.value = ''
  currentPage.value = 1
  loadTasks()
}

const completedTasksCount = computed(() => {
  if (dashboard.value) return dashboard.value.completed_tasks
  return tasks.value.filter((t) => t.status === 'DONE').length
})

const progressPercentage = computed(() => {
  if (dashboard.value) return Math.round(dashboard.value.completion_rate_percentage)
  if (tasks.value.length === 0) return 0
  return Math.round((completedTasksCount.value / tasks.value.length) * 100)
})

async function loadDashboard() {
  if (!slug.value || !key.value) return
  try {
    dashboard.value = await reportService.getProjectDashboard(slug.value, key.value)
  } catch {
    // Non-fatal
  }
}

async function loadProjectData() {
  if (!slug.value || !key.value) return

  isLoading.value = true
  errorMessage.value = ''
  try {
    const [projectData, membersData] = await Promise.all([
      projectService.getProject(slug.value, key.value),
      projectService.getProjectMembers(slug.value, key.value),
    ])
    project.value = projectData
    members.value = membersData

    await Promise.all([loadTasks(), loadDashboard()])
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isLoading.value = false
  }
}

async function loadTasks() {
  if (!slug.value || !key.value) return
  isLoadingTasks.value = true
  try {
    const res = await taskService.getTasksPaginated(slug.value, key.value, {
      search: searchQuery.value.trim() || undefined,
      status: filterStatus.value || undefined,
      priority: filterPriority.value || undefined,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
      page: currentPage.value,
      size: pageSize.value,
    })
    tasks.value = res.items
    totalTasks.value = res.total
    totalPages.value = res.total_pages
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isLoadingTasks.value = false
  }
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

function handlePageChange(newPage: number) {
  if (newPage < 1 || newPage > totalPages.value) return
  currentPage.value = newPage
  loadTasks()
}

// Watch search query debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(
  () => searchQuery.value,
  () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      currentPage.value = 1
      loadTasks()
    }, 300)
  }
)

watch([filterStatus, filterPriority, sortBy, sortOrder], () => {
  currentPage.value = 1
  loadTasks()
})

// Project CRUD Handlers
function handleProjectUpdated(updated: Project) {
  project.value = updated
  notify.success(`Project "${updated.name}" updated successfully`)
}

async function confirmDeleteProject() {
  if (!project.value || !slug.value) return
  isDeletingProject.value = true
  try {
    await projectService.deleteProject(slug.value, project.value.key)
    notify.success(`Project "${project.value.name}" deleted successfully`)
    showDeleteProjectDialog.value = false
    router.push(`/workspaces/${slug.value}`)
  } catch (err: unknown) {
    notify.error(formatApiError(err))
  } finally {
    isDeletingProject.value = false
  }
}

// Member Removal Handlers
function promptRemoveMember(member: ProjectMember) {
  memberToRemove.value = member
  showRemoveMemberDialog.value = true
}

async function confirmRemoveMember() {
  if (!memberToRemove.value || !slug.value || !key.value) return
  isRemovingMember.value = true
  try {
    await projectService.removeProjectMember(
      slug.value,
      key.value,
      memberToRemove.value.user.id
    )
    notify.success(`Removed ${memberToRemove.value.user.full_name} from project`)
    showRemoveMemberDialog.value = false
    memberToRemove.value = null
    members.value = await projectService.getProjectMembers(slug.value, key.value)
  } catch (err: unknown) {
    notify.error(formatApiError(err))
  } finally {
    isRemovingMember.value = false
  }
}

// Task Callbacks
function handleTaskCreated(newTask: Task) {
  tasks.value.unshift(newTask)
  totalTasks.value += 1
  loadDashboard()
  notify.success(`Task ${newTask.ticket_key} created successfully`)
}

function handleTaskUpdated(updatedTask: Task) {
  const index = tasks.value.findIndex((t) => t.id === updatedTask.id)
  if (index !== -1) {
    tasks.value[index] = updatedTask
  }
  if (selectedTask.value?.id === updatedTask.id) {
    selectedTask.value = updatedTask
  }
  loadDashboard()
}

function handleTaskDeleted(taskNumber: number) {
  tasks.value = tasks.value.filter((t) => t.task_number !== taskNumber)
  totalTasks.value = Math.max(0, totalTasks.value - 1)
  if (selectedTask.value?.task_number === taskNumber) {
    selectedTask.value = null
    showTaskDetailModal.value = false
  }
  loadDashboard()
  notify.success('Task deleted successfully')
}

// Status Transition Confirmation & Drag/Drop
function requestStatusTransition(task: Task, targetStatus: TaskStatus) {
  if (task.status === targetStatus) return
  pendingStatusTransition.value = {
    task,
    targetStatus,
    sourceStatus: task.status,
  }
  showStatusTransitionDialog.value = true
}

async function confirmStatusTransition() {
  if (!pendingStatusTransition.value || !slug.value || !key.value) return
  const { task, targetStatus, sourceStatus } = pendingStatusTransition.value
  isSubmittingTransition.value = true
  try {
    const updated = await taskService.updateTask(
      slug.value,
      key.value,
      task.task_number,
      { status: targetStatus }
    )
    handleTaskUpdated(updated)
    notify.success(`Task ${task.ticket_key} moved to ${getTaskStatusConfig(targetStatus).label}`)
    showStatusTransitionDialog.value = false
    pendingStatusTransition.value = null
  } catch (err: unknown) {
    // Explicit rollback
    task.status = sourceStatus
    notify.error(formatApiError(err))
  } finally {
    isSubmittingTransition.value = false
  }
}

function cancelStatusTransition() {
  if (pendingStatusTransition.value) {
    pendingStatusTransition.value.task.status = pendingStatusTransition.value.sourceStatus
  }
  pendingStatusTransition.value = null
  showStatusTransitionDialog.value = false
}

// Drag & Drop
function onDragOver(colStatus: TaskStatus, event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  activeDragColumn.value = colStatus
}

function onDragLeave(colStatus: TaskStatus, event: DragEvent) {
  const currentTarget = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as HTMLElement
  if (!currentTarget?.contains(relatedTarget)) {
    if (activeDragColumn.value === colStatus) {
      activeDragColumn.value = null
    }
  }
}

function onDrop(event: DragEvent, targetStatus: TaskStatus) {
  activeDragColumn.value = null
  const raw = event.dataTransfer?.getData('text/plain')
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    const task = tasks.value.find((t) => t.id === parsed.id || t.task_number === parsed.taskNumber)
    if (!task) return
    if (task.status === targetStatus) return
    requestStatusTransition(task, targetStatus)
  } catch (err) {
    console.error('Failed to parse drag data:', err)
  }
}

function openTaskDetail(task: Task) {
  selectedTask.value = task
  showTaskDetailModal.value = true
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getProjectRoleBadgeColor(role: string) {
  switch (role?.toUpperCase()) {
    case 'PROJECT_LEAD':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
    case 'CONTRIBUTOR':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800'
    case 'VIEWER':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  }
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
    case 'COMPLETED':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
    case 'ARCHIVED':
      return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  }
}

onMounted(() => {
  loadProjectData()
})

watch([slug, key], () => {
  loadProjectData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb & Back -->
    <div class="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
      <router-link
        to="/workspaces"
        class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        Workspaces
      </router-link>
      <span>/</span>
      <router-link
        :to="`/workspaces/${slug}`"
        class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        {{ slug }}
      </router-link>
      <span>/</span>
      <span class="font-semibold text-slate-800 dark:text-slate-200">
        {{ project?.name || key }}
      </span>
    </div>

    <!-- Error state -->
    <div
      v-if="errorMessage"
      class="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between gap-3"
    >
      <span>{{ errorMessage }}</span>
      <BaseButton size="sm" variant="outline" @click="loadProjectData">
        Retry
      </BaseButton>
    </div>

    <!-- Loading Project Skeleton -->
    <div
      v-if="isLoading && !project"
      class="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3"
    >
      <LoadingSpinner size="lg" />
      <span class="text-sm">Loading project details...</span>
    </div>

    <!-- Project Content -->
    <div v-else-if="project" class="space-y-6">
      <!-- Project Header Card -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-start gap-3 sm:gap-4 min-w-0">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shrink-0 font-mono">
              {{ project.key }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {{ project.name }}
                </h1>
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                  :class="getStatusBadgeColor(project.status)"
                >
                  {{ project.status }}
                </span>
                <StatusBadge status="implemented" label="API Active" />
              </div>
              <p class="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl line-clamp-2 sm:line-clamp-none">
                {{ project.description || 'No description provided.' }}
              </p>
              <div class="mt-2.5 sm:mt-3 flex items-center gap-3 sm:gap-4 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                <span class="flex items-center gap-1">
                  <LucideCalendar class="w-3.5 h-3.5" />
                  Created {{ formatDate(project.created_at) }}
                </span>
                <span class="flex items-center gap-1">
                  <LucideUsers class="w-3.5 h-3.5" />
                  {{ members.length }} {{ members.length === 1 ? 'Member' : 'Members' }}
                </span>
                <span class="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                  <LucideCheckSquare class="w-3.5 h-3.5" />
                  {{ totalTasks || tasks.length }} {{ (totalTasks || tasks.length) === 1 ? 'Task' : 'Tasks' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions: Edit, Delete, Add Member, New Task -->
          <div class="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 flex-wrap">
            <BaseButton
              variant="outline"
              size="sm"
              class="flex-1 sm:flex-initial"
              @click="showEditProjectModal = true"
            >
              <LucideEdit class="w-4 h-4" />
              <span>Edit</span>
            </BaseButton>

            <BaseButton
              variant="outline"
              size="sm"
              class="flex-1 sm:flex-initial hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800"
              @click="showDeleteProjectDialog = true"
            >
              <LucideTrash2 class="w-4 h-4 text-rose-500" />
              <span class="text-rose-600 dark:text-rose-400">Delete</span>
            </BaseButton>

            <BaseButton
              variant="outline"
              size="sm"
              class="flex-1 sm:flex-initial"
              @click="showAddMemberModal = true"
            >
              <LucideUserPlus class="w-4 h-4" />
              <span>Add Member</span>
            </BaseButton>

            <BaseButton
              size="sm"
              class="w-full sm:w-auto"
              @click="showCreateTaskModal = true"
            >
              <LucidePlus class="w-4 h-4" />
              <span>New Task</span>
            </BaseButton>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="mt-6 flex border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-6 text-sm font-medium">
          <!-- Overview Tab -->
          <button
            type="button"
            class="pb-3 border-b-2 flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-colors flex-1 sm:flex-initial px-2 sm:px-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-t-md"
            :class="[
              activeTab === 'overview'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
            ]"
            @click="activeTab = 'overview'"
          >
            <LucideFolderKanban class="w-4 h-4 shrink-0" />
            <span>Overview</span>
          </button>

          <!-- Tasks / Kanban Tab -->
          <button
            type="button"
            class="pb-3 border-b-2 flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-colors flex-1 sm:flex-initial px-2 sm:px-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-t-md"
            :class="[
              activeTab === 'tasks'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
            ]"
            @click="activeTab = 'tasks'"
          >
            <LucideLayers class="w-4 h-4 shrink-0" />
            <span>Tasks & Board</span>
            <span
              class="text-[11px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium"
              :class="activeTab === 'tasks' ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
            >
              {{ totalTasks || tasks.length }}
            </span>
          </button>

          <!-- Members Tab -->
          <button
            type="button"
            class="pb-3 border-b-2 flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-colors flex-1 sm:flex-initial px-2 sm:px-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-t-md"
            :class="[
              activeTab === 'members'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
            ]"
            @click="activeTab = 'members'"
          >
            <LucideUsers class="w-4 h-4 shrink-0" />
            <span>Members</span>
            <span
              class="text-[11px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium"
              :class="activeTab === 'members' ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
            >
              {{ members.length }}
            </span>
          </button>
        </div>
      </div>

      <!-- Tab Content: Overview -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Column: Details & Quick Stats -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Project Information</h3>
              <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {{ project.description || 'No detailed description provided for this project.' }}
              </p>

              <div class="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Project Key</span>
                  <p class="text-base font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{{ project.key }}</p>
                </div>
                <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Status</span>
                  <p class="text-base font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{{ project.status }}</p>
                </div>
                <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Created On</span>
                  <p class="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{{ formatDate(project.created_at) }}</p>
                </div>
                <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Last Updated</span>
                  <p class="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{{ formatDate(project.updated_at) }}</p>
                </div>
              </div>
            </div>

            <!-- Quick Tasks Preview -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-white">Recent Tasks</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Tickets in {{ project.name }}</p>
                </div>
                <BaseButton size="sm" variant="outline" @click="activeTab = 'tasks'">
                  View All ({{ totalTasks || tasks.length }})
                </BaseButton>
              </div>

              <div v-if="tasks.length > 0" class="divide-y divide-slate-100 dark:divide-slate-800">
                <div
                  v-for="task in tasks.slice(0, 4)"
                  :key="task.id"
                  class="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                  @click="openTaskDetail(task)"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900 shrink-0">
                      {{ task.ticket_key }}
                    </span>
                    <div class="min-w-0">
                      <h4 class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{{ task.title }}</h4>
                      <p class="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{{ getTaskStatusConfig(task.status).label }}</span>
                        <span v-if="task.assignee">• {{ task.assignee.full_name }}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    class="text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 inline-flex items-center gap-1.5"
                    :class="getTaskPriorityConfig(task.priority).badgeClass"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="getTaskPriorityConfig(task.priority).dotClass"></span>
                    {{ task.priority }}
                  </span>
                </div>
              </div>

              <div v-else class="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No tasks created yet.
              </div>
            </div>
          </div>

          <!-- Sidebar Column: Task Summary & Status Breakdown -->
          <div class="space-y-6">
            <div class="bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
              <div class="flex items-center justify-between">
                <div class="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md">
                  <LucideCheckSquare class="w-5 h-5" />
                </div>
                <span class="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-900 shadow-2xs">
                  {{ progressPercentage }}% Done
                </span>
              </div>

              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Task Completion</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track work items and milestone progress</p>
              </div>

              <!-- Progress bar -->
              <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  class="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                  :style="{ width: `${progressPercentage}%` }"
                ></div>
              </div>

              <!-- Status Breakdown Widget -->
              <div v-if="dashboard" class="pt-3 border-t border-indigo-50 dark:border-slate-800 space-y-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status Breakdown
                </span>
                <div class="space-y-1.5">
                  <div
                    v-for="(count, st) in dashboard.tasks_by_status"
                    :key="st"
                    class="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                  >
                    <span class="font-medium text-slate-700 dark:text-slate-300">
                      {{ getTaskStatusConfig(st as TaskStatus).label }}
                    </span>
                    <span class="font-bold text-slate-900 dark:text-slate-100">
                      {{ count }}
                    </span>
                  </div>
                </div>
              </div>

              <BaseButton
                size="sm"
                class="w-full"
                @click="showCreateTaskModal = true"
              >
                <LucidePlus class="w-4 h-4" />
                <span>Create New Task</span>
              </BaseButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Content: Tasks & Board -->
      <div v-else-if="activeTab === 'tasks'" class="space-y-4">
        <!-- Controls Bar: Responsive, Aligned Filter Toolbar -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors">
          <!-- Left: Search, Filters & Sort -->
          <div class="flex items-center gap-2.5 flex-wrap flex-1">
            <!-- Search Bar with Clear Icon -->
            <div class="relative w-full sm:w-56">
              <LucideSearch class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search tasks..."
                class="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                @click="searchQuery = ''"
              >
                <LucideX class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Priority Filter -->
            <div class="w-36">
              <BaseSelect
                v-model="filterPriority"
                :options="filterPriorityOptions"
                placeholder="All Priorities"
                size="sm"
              />
            </div>

            <!-- Status Filter -->
            <div class="w-36">
              <BaseSelect
                v-model="filterStatus"
                :options="filterStatusOptions"
                placeholder="All Statuses"
                size="sm"
              />
            </div>

            <!-- Sort By -->
            <div class="w-32">
              <BaseSelect
                v-model="sortBy"
                :options="sortByOptions"
                size="sm"
              />
            </div>

            <!-- Sort Direction Toggle -->
            <button
              type="button"
              class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              :title="sortOrder === 'asc' ? 'Ascending' : 'Descending'"
              @click="toggleSortOrder"
            >
              <LucideArrowUpDown class="w-4 h-4" />
            </button>

            <!-- Clear Filters Button -->
            <button
              v-if="hasActiveFilters"
              type="button"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
              @click="clearFilters"
            >
              <LucideFilter class="w-3.5 h-3.5" />
              <span>Clear</span>
              <span class="w-4 h-4 rounded-full bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 text-[10px] flex items-center justify-center font-bold">
                {{ activeFilterCount }}
              </span>
            </button>
          </div>

          <!-- Right: View Mode & Add Task -->
          <div class="flex items-center gap-2.5 justify-end shrink-0">
            <!-- View Mode Switcher -->
            <div class="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                :class="viewMode === 'kanban' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
                @click="viewMode = 'kanban'"
              >
                <LucideLayoutGrid class="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                :class="viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
                @click="viewMode = 'list'"
              >
                <LucideList class="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

            <BaseButton size="sm" @click="showCreateTaskModal = true">
              <LucidePlus class="w-4 h-4" />
              <span>Add Task</span>
            </BaseButton>
          </div>
        </div>

        <!-- Kanban Board View with Drag & Drop Dropzones -->
        <div
          v-if="viewMode === 'kanban'"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start"
        >
          <div
            v-for="col in kanbanColumns"
            :key="col.value"
            class="rounded-2xl border p-3.5 space-y-3 transition-all"
            :class="[
              col.columnBorder,
              col.columnBg,
              activeDragColumn === col.value
                ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 border-indigo-400 dark:border-indigo-500'
                : ''
            ]"
            @dragover="onDragOver(col.value, $event)"
            @dragleave="onDragLeave(col.value, $event)"
            @drop="onDrop($event, col.value)"
          >
            <!-- Column Header -->
            <div class="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :class="col.dotClass"></span>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {{ col.label }}
                </h4>
              </div>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                {{ tasks.filter((t) => t.status === col.value).length }}
              </span>
            </div>

            <!-- Task Cards -->
            <div class="space-y-2.5 min-h-[120px]">
              <TaskCard
                v-for="task in tasks.filter((t) => t.status === col.value)"
                :key="task.id"
                :task="task"
                @click="openTaskDetail"
                @quick-status="requestStatusTransition"
              />

              <div
                v-if="tasks.filter((t) => t.status === col.value).length === 0"
                class="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic rounded-xl border border-dashed border-slate-200 dark:border-slate-800"
              >
                Drop tasks here
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div
          v-else-if="viewMode === 'list'"
          class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors"
        >
          <div v-if="tasks.length > 0" class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th class="py-3 px-6 font-semibold">Key</th>
                  <th class="py-3 px-6 font-semibold">Title</th>
                  <th class="py-3 px-6 font-semibold">Status</th>
                  <th class="py-3 px-6 font-semibold">Priority</th>
                  <th class="py-3 px-6 font-semibold">Assignee</th>
                  <th class="py-3 px-6 font-semibold">Due Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr
                  v-for="task in tasks"
                  :key="task.id"
                  class="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  @click="openTaskDetail(task)"
                >
                  <td class="py-3.5 px-6 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {{ task.ticket_key }}
                  </td>
                  <td class="py-3.5 px-6 font-medium text-slate-800 dark:text-slate-200">
                    {{ task.title }}
                  </td>
                  <td class="py-3.5 px-6">
                    <span
                      class="text-xs font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5"
                      :class="getTaskStatusConfig(task.status).badgeClass"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="getTaskStatusConfig(task.status).dotClass"></span>
                      {{ getTaskStatusConfig(task.status).label }}
                    </span>
                  </td>
                  <td class="py-3.5 px-6">
                    <span
                      class="text-[11px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5"
                      :class="getTaskPriorityConfig(task.priority).badgeClass"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="getTaskPriorityConfig(task.priority).dotClass"></span>
                      {{ task.priority }}
                    </span>
                  </td>
                  <td class="py-3.5 px-6 text-xs text-slate-600 dark:text-slate-400">
                    <span v-if="task.assignee" class="flex items-center gap-1.5">
                      <UserAvatar :user="task.assignee" size="xs" />
                      <span>{{ task.assignee.full_name }}</span>
                    </span>
                    <span v-else class="text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                  </td>
                  <td class="py-3.5 px-6 text-xs text-slate-500 dark:text-slate-400">
                    {{ task.due_date ? formatDate(task.due_date) : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div
            v-if="totalTasks > 0"
            class="py-3 px-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400"
          >
            <span>
              Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalTasks) }} of {{ totalTasks }} tasks
            </span>
            <div class="flex items-center gap-2">
              <BaseButton
                size="sm"
                variant="outline"
                :disabled="currentPage <= 1"
                @click="handlePageChange(currentPage - 1)"
              >
                Previous
              </BaseButton>
              <span class="font-medium text-slate-700 dark:text-slate-300 px-2">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <BaseButton
                size="sm"
                variant="outline"
                :disabled="currentPage >= totalPages"
                @click="handlePageChange(currentPage + 1)"
              >
                Next
              </BaseButton>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="p-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
            <LucideCheckSquare class="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p class="text-sm font-medium text-slate-600 dark:text-slate-400">No tasks found matching your filters</p>
            <BaseButton
              v-if="hasActiveFilters"
              size="sm"
              variant="outline"
              @click="clearFilters"
            >
              Reset Filters
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Tab Content: Members -->
      <div v-else-if="activeTab === 'members'" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Project Members</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Users assigned to contribute to {{ project.name }}
            </p>
          </div>
          <BaseButton size="sm" @click="showAddMemberModal = true">
            <LucideUserPlus class="w-4 h-4" />
            <span>Add Member</span>
          </BaseButton>
        </div>

        <!-- Members Table with Remove Action -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th class="py-3 px-6 font-semibold">User</th>
                <th class="py-3 px-6 font-semibold">Email</th>
                <th class="py-3 px-6 font-semibold">Project Role</th>
                <th class="py-3 px-6 font-semibold">Assigned Date</th>
                <th class="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="member in members"
                :key="member.id"
                class="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
              >
                <td class="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">
                  <div class="flex items-center gap-3">
                    <UserAvatar :user="member.user" size="sm" />
                    <span>{{ member.user.full_name }}</span>
                  </div>
                </td>
                <td class="py-4 px-6 text-slate-600 dark:text-slate-400 font-mono text-xs">
                  {{ member.user.email }}
                </td>
                <td class="py-4 px-6">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                    :class="getProjectRoleBadgeColor(member.role)"
                  >
                    <LucideShield class="w-3 h-3" />
                    {{ member.role }}
                  </span>
                </td>
                <td class="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs">
                  {{ formatDate(member.joined_at) }}
                </td>
                <td class="py-4 px-6 text-right">
                  <button
                    type="button"
                    class="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Remove member from project"
                    @click="promptRemoveMember(member)"
                  >
                    <LucideUserMinus class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateTaskModal
      v-if="project"
      v-model="showCreateTaskModal"
      :workspace-slug="slug"
      :project-key="project.key"
      :members="members"
      @created="handleTaskCreated"
    />

    <TaskDetailModal
      v-if="project"
      v-model="showTaskDetailModal"
      :task="selectedTask"
      :workspace-slug="slug"
      :project-key="project.key"
      :members="members"
      @updated="handleTaskUpdated"
      @deleted="handleTaskDeleted"
    />

    <AddProjectMemberModal
      v-if="project"
      v-model="showAddMemberModal"
      :workspace-slug="slug"
      :project-key="project.key"
      @member-added="loadProjectData"
    />

    <EditProjectModal
      v-if="project"
      v-model="showEditProjectModal"
      :workspace-slug="slug"
      :project="project"
      @updated="handleProjectUpdated"
    />

    <!-- Delete Project Confirm Dialog -->
    <ConfirmDialog
      v-model="showDeleteProjectDialog"
      title="Delete Project"
      :message="`Are you sure you want to delete project &quot;${project?.name}&quot; (${project?.key})? This action will archive the project and all associated tasks.`"
      confirm-text="Delete Project"
      variant="danger"
      :loading="isDeletingProject"
      @confirm="confirmDeleteProject"
    />

    <!-- Remove Member Confirm Dialog -->
    <ConfirmDialog
      v-model="showRemoveMemberDialog"
      title="Remove Member from Project"
      :message="`Are you sure you want to remove &quot;${memberToRemove?.user?.full_name}&quot; from this project? They will no longer have access to its tasks.`"
      confirm-text="Remove Member"
      variant="danger"
      :loading="isRemovingMember"
      @confirm="confirmRemoveMember"
    />

    <!-- Task Status Transition Dialog -->
    <TaskStatusTransitionDialog
      v-model="showStatusTransitionDialog"
      :task="pendingStatusTransition?.task || null"
      :new-status="pendingStatusTransition?.targetStatus || null"
      :loading="isSubmittingTransition"
      @confirm="confirmStatusTransition"
      @cancel="cancelStatusTransition"
    />
  </div>
</template>
