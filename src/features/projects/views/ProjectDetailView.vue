<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { projectService } from '@/features/projects/services/projectService'
import { formatApiError } from '@/services/apiClient'
import type { Project, ProjectMember } from '@/features/projects/types/project.types'
import AddProjectMemberModal from '@/features/projects/components/AddProjectMemberModal.vue'
import UnderDevelopmentModal from '@/components/common/UnderDevelopmentModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  LucideFolderKanban,
  LucideUsers,
  LucideUserPlus,
  LucideCalendar,
  LucideChevronLeft,
  LucideShield,
  LucideEdit,
  LucideTrash2,
  LucideLayers,
  LucideSparkles,
} from 'lucide-vue-next'

const route = useRoute()

const slug = computed(() => route.params.slug as string)
const key = computed(() => route.params.key as string)

const project = ref<Project | null>(null)
const members = ref<ProjectMember[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const showAddMemberModal = ref(false)
const showUnderDevModal = ref(false)
const underDevFeature = ref('')

const activeTab = ref<'overview' | 'members' | 'tasks'>('overview')

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
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isLoading.value = false
  }
}

function triggerUnderDev(feature: string) {
  underDevFeature.value = feature
  showUnderDevModal.value = true
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
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'CONTRIBUTOR':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'VIEWER':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
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

onMounted(() => {
  loadProjectData()
})

watch([slug, key], () => {
  loadProjectData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb Navigation -->
    <div class="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
      <router-link
        to="/workspaces"
        class="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
      >
        <LucideChevronLeft class="w-4 h-4" />
        <span>Workspaces</span>
      </router-link>
      <span>/</span>
      <router-link
        :to="`/workspaces/${slug}`"
        class="hover:text-indigo-600 transition-colors"
      >
        {{ slug }}
      </router-link>
      <span>/</span>
      <span class="font-medium text-slate-800">{{ project?.name || key }}</span>
    </div>

    <!-- Error State -->
    <div
      v-if="errorMessage"
      class="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center justify-between"
    >
      <span>{{ errorMessage }}</span>
      <BaseButton size="sm" variant="outline" @click="loadProjectData">
        Retry
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && !project"
      class="py-20 flex flex-col items-center justify-center text-slate-400 gap-3"
    >
      <LoadingSpinner size="lg" />
      <span class="text-sm">Loading project details...</span>
    </div>

    <!-- Project Content -->
    <div v-else-if="project" class="space-y-6">
      <!-- Project Header Card -->
      <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-start gap-3 sm:gap-4 min-w-0">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shrink-0 font-mono">
              {{ project.key }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 class="text-xl sm:text-2xl font-bold text-slate-900 truncate">
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
              <p class="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl line-clamp-2 sm:line-clamp-none">
                {{ project.description || 'No description provided.' }}
              </p>
              <div class="mt-2.5 sm:mt-3 flex items-center gap-3 sm:gap-4 text-xs text-slate-400 flex-wrap">
                <span class="flex items-center gap-1">
                  <LucideCalendar class="w-3.5 h-3.5" />
                  Created {{ formatDate(project.created_at) }}
                </span>
                <span class="flex items-center gap-1">
                  <LucideUsers class="w-3.5 h-3.5" />
                  {{ members.length }} {{ members.length === 1 ? 'Member' : 'Members' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-wrap">
            <BaseButton
              variant="outline"
              size="sm"
              class="flex-1 sm:flex-initial"
              @click="triggerUnderDev('Edit Project (PUT /workspaces/{slug}/projects/{key})')"
            >
              <LucideEdit class="w-4 h-4" />
              <span>Edit</span>
            </BaseButton>

            <BaseButton
              variant="outline"
              size="sm"
              class="flex-1 sm:flex-initial"
              @click="triggerUnderDev('Delete Project (DELETE /workspaces/{slug}/projects/{key})')"
            >
              <LucideTrash2 class="w-4 h-4 text-rose-500" />
              <span class="text-rose-600">Delete</span>
            </BaseButton>

            <BaseButton
              size="sm"
              class="w-full sm:w-auto"
              @click="showAddMemberModal = true"
            >
              <LucideUserPlus class="w-4 h-4" />
              <span>Add Member</span>
            </BaseButton>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="mt-6 flex border-b border-slate-200 gap-1 sm:gap-6 text-sm font-medium">
          <!-- Overview Tab -->
          <button
            type="button"
            class="pb-3 border-b-2 flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-colors flex-1 sm:flex-initial px-2 sm:px-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-t-md"
            :class="[
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ]"
            @click="activeTab = 'overview'"
          >
            <LucideFolderKanban class="w-4 h-4 shrink-0" />
            <span>Overview</span>
          </button>

          <!-- Members Tab -->
          <button
            type="button"
            class="pb-3 border-b-2 flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-colors flex-1 sm:flex-initial px-2 sm:px-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-t-md"
            :class="[
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ]"
            @click="activeTab = 'members'"
          >
            <LucideUsers class="w-4 h-4 shrink-0" />
            <span>Project Members</span>
            <span
              class="text-[11px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium"
              :class="activeTab === 'members' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'"
            >
              {{ members.length }}
            </span>
          </button>

          <!-- Tasks / Kanban Tab -->
          <button
            type="button"
            class="pb-3 border-b-2 flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-colors flex-1 sm:flex-initial px-2 sm:px-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-t-md"
            :class="[
              activeTab === 'tasks'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ]"
            @click="activeTab = 'tasks'"
          >
            <LucideLayers class="w-4 h-4 shrink-0" />
            <span>Tasks & Board</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
              Soon
            </span>
          </button>
        </div>
      </div>

      <!-- Tab Content: Overview -->
      <div v-if="activeTab === 'overview'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Main Details Column -->
        <div class="md:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 class="text-base font-bold text-slate-900">About this Project</h2>
            <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {{ project.description || 'No description provided for this project.' }}
            </p>

            <div class="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-xs text-slate-500 font-medium">Project Key</span>
                <p class="text-base font-mono font-bold text-slate-800 mt-0.5">{{ project.key }}</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-xs text-slate-500 font-medium">Status</span>
                <p class="text-base font-semibold text-slate-800 mt-0.5">{{ project.status }}</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-xs text-slate-500 font-medium">Created On</span>
                <p class="text-sm font-medium text-slate-800 mt-0.5">{{ formatDate(project.created_at) }}</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-xs text-slate-500 font-medium">Last Updated</span>
                <p class="text-sm font-medium text-slate-800 mt-0.5">{{ formatDate(project.updated_at) }}</p>
              </div>
            </div>
          </div>

          <!-- Quick Member Preview -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-slate-900">Project Members</h3>
                <p class="text-xs text-slate-500">Assigned members working on {{ project.name }}</p>
              </div>
              <BaseButton size="sm" variant="outline" @click="activeTab = 'members'">
                View All ({{ members.length }})
              </BaseButton>
            </div>

            <div class="divide-y divide-slate-100">
              <div
                v-for="member in members.slice(0, 4)"
                :key="member.id"
                class="py-3 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {{ member.user.full_name.slice(0, 2).toUpperCase() }}
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-slate-800">{{ member.user.full_name }}</h4>
                    <p class="text-xs text-slate-500 font-mono">{{ member.user.email }}</p>
                  </div>
                </div>
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                  :class="getProjectRoleBadgeColor(member.role)"
                >
                  <LucideShield class="w-3 h-3" />
                  {{ member.role }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Column: Tasks Feature Preview -->
        <div class="space-y-6">
          <div class="bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/60 rounded-2xl border border-indigo-100 p-6 shadow-xs space-y-4">
            <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <LucideSparkles class="w-5 h-5" />
            </div>

            <h3 class="text-base font-bold text-slate-900">
              Task Management
            </h3>

            <p class="text-xs text-slate-600 leading-relaxed">
              Task management, sprint tracking, and Kanban boards are currently planned for upcoming backend steps. Stay tuned!
            </p>

            <BaseButton
              variant="outline"
              size="sm"
              class="w-full"
              @click="triggerUnderDev('Task Tracking & Kanban Board')"
            >
              <span>Explore Preview</span>
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Tab Content: Members -->
      <div v-else-if="activeTab === 'members'" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div class="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900">Project Members</h2>
            <p class="text-xs text-slate-500">
              Users assigned to contribute to {{ project.name }}
            </p>
          </div>
          <BaseButton size="sm" @click="showAddMemberModal = true">
            <LucideUserPlus class="w-4 h-4" />
            <span>Add Member</span>
          </BaseButton>
        </div>

        <!-- Members Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th class="py-3 px-6 font-semibold">User</th>
                <th class="py-3 px-6 font-semibold">Email</th>
                <th class="py-3 px-6 font-semibold">Project Role</th>
                <th class="py-3 px-6 font-semibold">Assigned Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="member in members"
                :key="member.id"
                class="hover:bg-slate-50/80 transition-colors"
              >
                <td class="py-4 px-6 font-medium text-slate-800">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {{ member.user.full_name.slice(0, 2).toUpperCase() }}
                    </div>
                    <span>{{ member.user.full_name }}</span>
                  </div>
                </td>
                <td class="py-4 px-6 text-slate-600 font-mono text-xs">
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
                <td class="py-4 px-6 text-slate-500 text-xs">
                  {{ formatDate(member.joined_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab Content: Tasks / Kanban (Honest Coming Soon) -->
      <div v-else-if="activeTab === 'tasks'" class="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
          <LucideLayers class="w-6 h-6" />
        </div>
        <div class="max-w-md mx-auto">
          <div class="inline-flex items-center gap-2 mb-2">
            <StatusBadge status="under_development" label="Tasks Coming Soon" />
          </div>
          <h3 class="text-base font-semibold text-slate-900">
            Task Management & Kanban Board
          </h3>
          <p class="text-sm text-slate-500 mt-1 leading-relaxed">
            Task creation, status columns, backlog assignment, and sprints will be supported in upcoming backend development phases.
          </p>
        </div>
        <div class="pt-2">
          <BaseButton
            variant="outline"
            size="sm"
            @click="triggerUnderDev('Task & Kanban Management')"
          >
            Learn More
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AddProjectMemberModal
      v-if="project"
      v-model="showAddMemberModal"
      :workspace-slug="slug"
      :project-key="project.key"
      @member-added="loadProjectData"
    />

    <UnderDevelopmentModal
      v-model="showUnderDevModal"
      :feature-name="underDevFeature"
    />
  </div>
</template>
