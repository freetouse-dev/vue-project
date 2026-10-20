<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { projectService } from '@/features/projects/services/projectService'
import { taskService } from '@/features/tasks/services/taskService'
import { useNotification } from '@/composables/useNotification'
import { formatApiError } from '@/services/apiClient'
import type { Project, ProjectMember } from '@/features/projects/types/project.types'
import type { Task, TaskPriority, TaskStatus } from '@/features/tasks/types/task.types'
import {
  TASK_STATUS_SELECT_OPTIONS,
  TASK_PRIORITY_SELECT_OPTIONS,
  KANBAN_PRIMARY_COLUMNS,
  getTaskPriorityConfig,
  getTaskStatusConfig,
} from '@/utils/statusTheme'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import TaskCard from '@/features/tasks/components/TaskCard.vue'
import CreateTaskModal from '@/features/tasks/components/CreateTaskModal.vue'
import TaskDetailModal from '@/features/tasks/components/TaskDetailModal.vue'
import TaskStatusTransitionDialog from '@/features/tasks/components/TaskStatusTransitionDialog.vue'
import {
  LucideCheckSquare,
  LucidePlus,
  LucideLayoutGrid,
  LucideList,
  LucideBuilding2,
  LucideFolderKanban,
  LucideArrowRight,
  LucideAlertCircle,
  LucideSearch,
  LucideArrowUpDown,
  LucideFilter,
  LucideX,
} from 'lucide-vue-next'

const workspaceStore = useWorkspaceStore()
const notify = useNotification()

const workspaces = computed(() => workspaceStore.workspaces)
const currentWorkspace = computed(() => workspaceStore.currentWorkspace)

const projects = ref<Project[]>([])
const selectedProjectKey = ref<string>('')
const selectedProject = computed(() =>
  projects.value.find((p) => p.key === selectedProjectKey.value)
)

const members = ref<ProjectMember[]>([])
const tasks = ref<Task[]>([])

const isLoading = ref(false)
const errorMessage = ref('')

const viewMode = ref<'kanban' | 'list'>('kanban')
const searchQuery = ref('')
const filterStatus = ref<TaskStatus | ''>('')
const filterPriority = ref<TaskPriority | ''>('')
const sortBy = ref('task_number')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const pageSize = ref(20)
const totalTasks = ref(0)
const totalPages = ref(1)

// Transition & Drag/Drop states
const showStatusTransitionDialog = ref(false)
const pendingStatusTransition = ref<{
  task: Task
  targetStatus: TaskStatus
  sourceStatus: TaskStatus
} | null>(null)
const isSubmittingTransition = ref(false)
const activeDragColumn = ref<TaskStatus | null>(null)

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
  loadTasksForProject()
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

function handlePageChange(newPage: number) {
  if (newPage < 1 || newPage > totalPages.value) return
  currentPage.value = newPage
  loadTasksForProject()
}

const showCreateTaskModal = ref(false)
const showTaskDetailModal = ref(false)
const activeTask = ref<Task | null>(null)

// Project Select Options
const projectSelectOptions = computed(() =>
  projects.value.map((p) => ({
    value: p.key,
    label: `${p.name} (${p.key})`,
  }))
)

// Workspace Select Options
const workspaceSelectOptions = computed(() =>
  workspaces.value.map((w) => ({
    value: w.slug,
    label: `${w.name} (${w.slug})`,
  }))
)

// Status & Priority Filter Options with "All" prepended
const statusFilterOptions = computed(() => [
  { value: '', label: 'All Statuses' },
  ...TASK_STATUS_SELECT_OPTIONS,
])

const priorityFilterOptions = computed(() => [
  { value: '', label: 'All Priorities' },
  ...TASK_PRIORITY_SELECT_OPTIONS,
])

async function loadProjectsForWorkspace() {
  if (!currentWorkspace.value?.slug) {
    projects.value = []
    selectedProjectKey.value = ''
    tasks.value = []
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    const projs = await projectService.getProjects(currentWorkspace.value.slug)
    projects.value = projs
    if (projs.length > 0 && !selectedProjectKey.value) {
      selectedProjectKey.value = projs[0].key
    } else if (projs.length === 0) {
      selectedProjectKey.value = ''
      tasks.value = []
    }
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isLoading.value = false
  }
}

async function loadTasksForProject() {
  if (!currentWorkspace.value?.slug || !selectedProjectKey.value) {
    tasks.value = []
    totalTasks.value = 0
    totalPages.value = 1
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    const isKanban = viewMode.value === 'kanban'
    const [tasksRes, membersData] = await Promise.all([
      taskService.getTasksPaginated(currentWorkspace.value.slug, selectedProjectKey.value, {
        search: searchQuery.value.trim() || undefined,
        status: filterStatus.value || undefined,
        priority: filterPriority.value || undefined,
        sort_by: sortBy.value,
        sort_order: sortOrder.value,
        page: isKanban ? 1 : currentPage.value,
        size: isKanban ? 100 : pageSize.value,
      }),
      projectService.getProjectMembers(currentWorkspace.value.slug, selectedProjectKey.value).catch(() => []),
    ])
    tasks.value = tasksRes.items
    totalTasks.value = tasksRes.total
    totalPages.value = tasksRes.total_pages
    members.value = membersData
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isLoading.value = false
  }
}

function handleWorkspaceChange(slug: string | number) {
  workspaceStore.selectWorkspaceBySlug(String(slug))
  selectedProjectKey.value = ''
}

function handleProjectChange(key: string | number) {
  selectedProjectKey.value = String(key)
}

function handleTaskCreated(newTask: Task) {
  tasks.value.unshift(newTask)
  totalTasks.value++
  notify.success(`Task ${newTask.ticket_key} created successfully`)
}

function handleTaskUpdated(updatedTask: Task) {
  const index = tasks.value.findIndex((t) => t.id === updatedTask.id)
  if (index !== -1) {
    tasks.value[index] = updatedTask
  }
  if (activeTask.value?.id === updatedTask.id) {
    activeTask.value = updatedTask
  }
}

function handleTaskDeleted(taskNumber: number) {
  tasks.value = tasks.value.filter((t) => t.task_number !== taskNumber)
  totalTasks.value = Math.max(0, totalTasks.value - 1)
  if (activeTask.value?.task_number === taskNumber) {
    activeTask.value = null
    showTaskDetailModal.value = false
  }
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
  if (!pendingStatusTransition.value || !currentWorkspace.value?.slug || !selectedProjectKey.value) return
  const { task, targetStatus, sourceStatus } = pendingStatusTransition.value
  isSubmittingTransition.value = true
  try {
    const updated = await taskService.updateTask(
      currentWorkspace.value.slug,
      selectedProjectKey.value,
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
    console.error('Failed to parse drag payload:', err)
  }
}

function openTaskDetail(task: Task) {
  activeTask.value = task
  showTaskDetailModal.value = true
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

onMounted(async () => {
  if (workspaces.value.length === 0) {
    await workspaceStore.fetchWorkspaces().catch(() => {})
  }
  if (currentWorkspace.value) {
    await loadProjectsForWorkspace()
    if (selectedProjectKey.value) {
      loadTasksForProject()
    }
  }
})

watch(
  () => currentWorkspace.value?.slug,
  async (newSlug) => {
    if (newSlug) {
      await loadProjectsForWorkspace()
      if (selectedProjectKey.value) {
        loadTasksForProject()
      }
    }
  }
)

watch(selectedProjectKey, (newKey) => {
  if (newKey) {
    loadTasksForProject()
  }
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(
  () => searchQuery.value,
  () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      currentPage.value = 1
      if (selectedProjectKey.value) {
        loadTasksForProject()
      }
    }, 300)
  }
)

watch([filterStatus, filterPriority, sortBy, sortOrder], () => {
  currentPage.value = 1
  if (selectedProjectKey.value) {
    loadTasksForProject()
  }
})

watch(viewMode, () => {
  currentPage.value = 1
  if (selectedProjectKey.value) {
    loadTasksForProject()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Tasks & Kanban Board
          </h1>
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            Active
          </span>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
          Track work items, manage workflow columns, and update task progress
        </p>
      </div>

      <div v-if="selectedProject" class="flex items-center gap-2">
        <BaseButton size="sm" @click="showCreateTaskModal = true">
          <LucidePlus class="w-4 h-4" />
          <span>New Task</span>
        </BaseButton>
      </div>
    </div>

    <!-- Workspace & Project Switcher Bar -->
    <div
      v-if="workspaces.length > 0"
      class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
    >
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Workspace Selector -->
        <div class="flex items-center gap-2">
          <LucideBuilding2 class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <BaseSelect
            :model-value="currentWorkspace?.slug"
            :options="workspaceSelectOptions"
            placeholder="Select Workspace"
            size="sm"
            @update:model-value="handleWorkspaceChange"
          />
        </div>

        <span class="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>

        <!-- Project Selector -->
        <div v-if="projects.length > 0" class="flex items-center gap-2">
          <LucideFolderKanban class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <BaseSelect
            :model-value="selectedProjectKey"
            :options="projectSelectOptions"
            placeholder="Select Project"
            size="sm"
            @update:model-value="handleProjectChange"
          />
        </div>
      </div>

      <!-- Quick Link to Project Page -->
      <div v-if="currentWorkspace && selectedProject" class="flex items-center gap-2">
        <router-link
          :to="`/workspaces/${currentWorkspace.slug}/projects/${selectedProject.key}`"
          class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline inline-flex items-center gap-1"
        >
          <span>Open Full Project Page</span>
          <LucideArrowRight class="w-3.5 h-3.5" />
        </router-link>
      </div>
    </div>

    <!-- Error message -->
    <div
      v-if="errorMessage"
      class="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <LucideAlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <BaseButton size="sm" variant="outline" @click="loadTasksForProject">
        Retry
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="py-16 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3"
    >
      <LoadingSpinner size="lg" />
      <span class="text-sm">Loading tasks...</span>
    </div>

    <!-- Empty Workspace State -->
    <div
      v-else-if="workspaces.length === 0"
      class="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
        <LucideBuilding2 class="w-6 h-6" />
      </div>
      <div class="max-w-sm mx-auto">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">
          No workspaces found
        </h3>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Create a workspace and project first to start tracking tasks.
        </p>
      </div>
      <div class="pt-2">
        <router-link to="/workspaces">
          <BaseButton size="sm">
            <span>Go to Workspaces</span>
          </BaseButton>
        </router-link>
      </div>
    </div>

    <!-- Empty Projects State -->
    <div
      v-else-if="projects.length === 0"
      class="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
        <LucideFolderKanban class="w-6 h-6" />
      </div>
      <div class="max-w-sm mx-auto">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">
          No projects in this workspace
        </h3>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tasks belong to projects. Create a project in {{ currentWorkspace?.name }} to begin.
        </p>
      </div>
      <div class="pt-2">
        <router-link v-if="currentWorkspace" :to="`/workspaces/${currentWorkspace.slug}`">
          <BaseButton size="sm">
            <span>Create Project</span>
          </BaseButton>
        </router-link>
      </div>
    </div>

    <!-- Tasks Board & Controls -->
    <div v-else-if="selectedProject" class="space-y-4">
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
              :options="priorityFilterOptions"
              placeholder="All Priorities"
              size="sm"
            />
          </div>

          <!-- Status Filter -->
          <div class="w-36">
            <BaseSelect
              v-model="filterStatus"
              :options="statusFilterOptions"
              placeholder="All Statuses"
              size="sm"
            />
          </div>

          <!-- Sort By (when list view or sorting) -->
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
          <!-- View Mode Toggle -->
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

      <!-- Kanban View with Drag & Drop Dropzones -->
      <div
        v-if="viewMode === 'kanban'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start"
      >
        <div
          v-for="col in KANBAN_PRIMARY_COLUMNS"
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

          <!-- Column Tasks -->
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
              <tr class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
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
                class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
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

    <!-- Modals -->
    <CreateTaskModal
      v-if="currentWorkspace && selectedProject"
      v-model="showCreateTaskModal"
      :workspace-slug="currentWorkspace.slug"
      :project-key="selectedProject.key"
      :members="members"
      @created="handleTaskCreated"
    />

    <TaskDetailModal
      v-if="currentWorkspace && selectedProject"
      v-model="showTaskDetailModal"
      :task="activeTask"
      :workspace-slug="currentWorkspace.slug"
      :project-key="selectedProject.key"
      :members="members"
      @updated="handleTaskUpdated"
      @deleted="handleTaskDeleted"
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
