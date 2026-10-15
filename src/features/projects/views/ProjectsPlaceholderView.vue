<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { projectService } from '@/features/projects/services/projectService'
import { formatApiError } from '@/services/apiClient'
import type { Project } from '@/features/projects/types/project.types'
import CreateProjectModal from '@/features/projects/components/CreateProjectModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  LucideFolderKanban,
  LucidePlus,
  LucideBuilding2,
  LucideCalendar,
  LucideArrowRight,
  LucideAlertCircle,
} from 'lucide-vue-next'

const workspaceStore = useWorkspaceStore()

const projects = ref<Project[]>([])
const isLoadingProjects = ref(false)
const errorMessage = ref('')
const showCreateModal = ref(false)

const currentWorkspace = computed(() => workspaceStore.currentWorkspace)
const workspaces = computed(() => workspaceStore.workspaces)

async function loadProjects() {
  if (!currentWorkspace.value?.slug) {
    projects.value = []
    return
  }

  isLoadingProjects.value = true
  errorMessage.value = ''
  try {
    projects.value = await projectService.getProjects(currentWorkspace.value.slug)
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isLoadingProjects.value = false
  }
}

function handleWorkspaceChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const slug = target.value
  workspaceStore.selectWorkspaceBySlug(slug)
}

function handleProjectCreated(newProject: Project) {
  projects.value.unshift(newProject)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'COMPLETED':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'ARCHIVED':
      return 'bg-slate-100 text-slate-600 border-slate-200'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

onMounted(async () => {
  if (workspaces.value.length === 0) {
    await workspaceStore.fetchWorkspaces().catch(() => {})
  }
  if (currentWorkspace.value) {
    loadProjects()
  }
})

watch(
  () => currentWorkspace.value?.slug,
  (newSlug) => {
    if (newSlug) {
      loadProjects()
    }
  }
)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Projects
          </h1>
          <StatusBadge status="implemented" label="API Active" />
        </div>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
          View and organize team initiatives across your workspaces
        </p>
      </div>

      <div
        v-if="currentWorkspace"
        class="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto"
      >
        <BaseButton
          size="sm"
          class="sm:text-sm"
          @click="showCreateModal = true"
        >
          <LucidePlus class="w-4 h-4" />
          <span>New Project</span>
        </BaseButton>
      </div>
    </div>

    <!-- Workspace Selector Bar (if user has workspaces) -->
    <div
      v-if="workspaces.length > 0"
      class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2 text-sm text-slate-600">
        <LucideBuilding2 class="w-4 h-4 text-indigo-600" />
        <span class="font-medium">Active Workspace:</span>
      </div>

      <div class="flex items-center gap-3">
        <select
          :value="currentWorkspace?.slug"
          class="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
          @change="handleWorkspaceChange"
        >
          <option
            v-for="ws in workspaces"
            :key="ws.id"
            :value="ws.slug"
          >
            {{ ws.name }} ({{ ws.slug }})
          </option>
        </select>

        <router-link
          v-if="currentWorkspace"
          :to="`/workspaces/${currentWorkspace.slug}`"
          class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
        >
          <span>Workspace Details</span>
          <LucideArrowRight class="w-3.5 h-3.5" />
        </router-link>
      </div>
    </div>

    <!-- Error message -->
    <div
      v-if="errorMessage"
      class="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <LucideAlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <BaseButton size="sm" variant="outline" @click="loadProjects">
        Retry
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoadingProjects"
      class="py-16 flex flex-col items-center justify-center text-slate-400 gap-3"
    >
      <LoadingSpinner size="lg" />
      <span class="text-sm">Loading projects...</span>
    </div>

    <!-- No Workspaces State -->
    <div
      v-else-if="workspaces.length === 0"
      class="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
        <LucideBuilding2 class="w-6 h-6" />
      </div>
      <div class="max-w-sm mx-auto">
        <h3 class="text-base font-semibold text-slate-900">
          No workspaces found
        </h3>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          Projects belong to workspaces. Please create or join a workspace first to start organizing projects.
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

    <!-- Projects List -->
    <div v-else-if="currentWorkspace">
      <!-- Grid -->
      <div
        v-if="projects.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <router-link
          v-for="project in projects"
          :key="project.id"
          :to="`/workspaces/${currentWorkspace.slug}/projects/${project.key}`"
          class="group block bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-400 hover:shadow-md transition-all relative"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm tracking-wider font-mono border border-indigo-100">
              {{ project.key.slice(0, 3) }}
            </div>
            <span
              class="px-2 py-0.5 rounded-full text-[11px] font-semibold border"
              :class="getStatusBadgeColor(project.status)"
            >
              {{ project.status }}
            </span>
          </div>

          <div class="mt-3">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-base truncate">
                {{ project.name }}
              </h3>
              <span class="text-xs font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {{ project.key }}
              </span>
            </div>
            <p class="mt-1.5 text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
              {{ project.description || 'No description provided.' }}
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span class="flex items-center gap-1">
              <LucideCalendar class="w-3.5 h-3.5" />
              {{ formatDate(project.created_at) }}
            </span>
            <span class="inline-flex items-center gap-1 font-medium text-indigo-600 group-hover:translate-x-0.5 transition-transform">
              <span>View</span>
              <LucideArrowRight class="w-3.5 h-3.5" />
            </span>
          </div>
        </router-link>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4"
      >
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
          <LucideFolderKanban class="w-6 h-6" />
        </div>
        <div class="max-w-sm mx-auto">
          <h3 class="text-base font-semibold text-slate-900">
            No projects in {{ currentWorkspace.name }}
          </h3>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">
            Create your first project in this workspace to organize tasks, track milestones, and assign team members.
          </p>
        </div>
        <div class="pt-2">
          <BaseButton size="sm" @click="showCreateModal = true">
            <LucidePlus class="w-4 h-4" />
            <span>Create First Project</span>
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <CreateProjectModal
      v-if="currentWorkspace"
      v-model="showCreateModal"
      :workspace-slug="currentWorkspace.slug"
      @created="handleProjectCreated"
    />
  </div>
</template>
