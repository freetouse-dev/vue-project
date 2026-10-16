<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { projectService } from '@/features/projects/services/projectService'
import { taskService } from '@/features/tasks/services/taskService'
import { formatApiError } from '@/services/apiClient'
import type { Project, ProjectMember } from '@/features/projects/types/project.types'
import type { Task, TaskPriority, TaskStatus } from '@/features/tasks/types/task.types'
import {
  TASK_STATUS_CONFIGS,
  TASK_STATUS_SELECT_OPTIONS,
  TASK_PRIORITY_SELECT_OPTIONS,
  KANBAN_PRIMARY_COLUMNS,
  getTaskPriorityConfig,
} from '@/utils/statusTheme'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import TaskCard from '@/features/tasks/components/TaskCard.vue'
import CreateTaskModal from '@/features/tasks/components/CreateTaskModal.vue'
import TaskDetailModal from '@/features/tasks/components/TaskDetailModal.vue'
import {
  LucideCheckSquare,
  LucidePlus,
  LucideLayoutGrid,
  LucideList,
  LucideBuilding2,
  LucideFolderKanban,
  LucideArrowRight,
  LucideAlertCircle,
} from 'lucide-vue-next'

const workspaceStore = useWorkspaceStore()

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
const filterStatus = ref<TaskStatus | ''>('')
const filterPriority = ref<TaskPriority | ''>('')

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
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    const [tasksData, membersData] = await Promise.all([
      taskService.getTasks(currentWorkspace.value.slug, selectedProjectKey.value, {
        status: filterStatus.value || undefined,
        priority: filterPriority.value || undefined,
      }),
      projectService.getProjectMembers(currentWorkspace.value.slug, selectedProjectKey.value).catch(() => []),
    ])
    tasks.value = tasksData
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

async function handleQuickStatus(task: Task, newStatus: TaskStatus) {
  if (!currentWorkspace.value?.slug || !selectedProjectKey.value) return
  try {
    const updated = await taskService.updateTask(
      currentWorkspace.value.slug,
      selectedProjectKey.value,
      task.task_number,
      { status: newStatus }
    )
    handleTaskUpdated(updated)
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
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

watch([filterStatus, filterPriority], () => {
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
      class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
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
      <!-- Controls Bar: View mode, custom BaseSelect filters -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- View Mode & Custom Select Filters -->
        <div class="flex items-center gap-3 flex-wrap">
          <!-- View Mode Toggle -->
          <div class="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              :class="viewMode === 'kanban' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'"
              @click="viewMode = 'kanban'"
            >
              <LucideLayoutGrid class="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              :class="viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'"
              @click="viewMode = 'list'"
            >
              <LucideList class="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <!-- Priority Filter -->
          <BaseSelect
            :model-value="filterPriority"
            :options="priorityFilterOptions"
            placeholder="All Priorities"
            size="sm"
            @update:model-value="filterPriority = $event as TaskPriority | ''"
          />

          <!-- Status Filter -->
          <BaseSelect
            :model-value="filterStatus"
            :options="statusFilterOptions"
            placeholder="All Statuses"
            size="sm"
            @update:model-value="filterStatus = $event as TaskStatus | ''"
          />
        </div>

        <!-- Add Task Button -->
        <div class="flex items-center justify-end gap-2">
          <BaseButton size="sm" @click="showCreateTaskModal = true">
            <LucidePlus class="w-4 h-4" />
            <span>Add Task</span>
          </BaseButton>
        </div>
      </div>

      <!-- Kanban View -->
      <div
        v-if="viewMode === 'kanban'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start"
      >
        <div
          v-for="col in KANBAN_PRIMARY_COLUMNS"
          :key="col.value"
          class="rounded-2xl border p-3.5 space-y-3 transition-colors"
          :class="[col.columnBorder, col.columnBg]"
        >
          <!-- Column Header -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full" :class="col.dotClass"></span>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {{ col.label }}
              </h4>
            </div>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
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
              @quick-status="handleQuickStatus"
            />

            <div
              v-if="tasks.filter((t) => t.status === col.value).length === 0"
              class="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic"
            >
              No tasks
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div
        v-else-if="viewMode === 'list'"
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
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
                    class="text-xs font-semibold px-2 py-0.5 rounded-full border"
                    :class="TASK_STATUS_CONFIGS[task.status]?.badgeClass"
                  >
                    {{ task.status }}
                  </span>
                </td>
                <td class="py-3.5 px-6">
                  <span
                    class="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                    :class="getTaskPriorityConfig(task.priority).badgeClass"
                  >
                    {{ task.priority }}
                  </span>
                </td>
                <td class="py-3.5 px-6 text-xs text-slate-600 dark:text-slate-400">
                  <span v-if="task.assignee" class="flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 inline-flex items-center justify-center font-bold text-[10px]">
                      {{ task.assignee.full_name.slice(0, 2).toUpperCase() }}
                    </span>
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

        <div v-else class="p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
          <LucideCheckSquare class="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">No tasks found matching your filters</p>
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
    />
  </div>
</template>
