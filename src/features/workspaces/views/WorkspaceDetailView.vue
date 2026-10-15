<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { workspaceService } from '@/features/workspaces/services/workspaceService'
import { useWorkspaceStore } from '@/stores/workspace'
import { formatApiError } from '@/services/apiClient'
import type { Workspace, WorkspaceMember } from '@/features/workspaces/types/workspace.types'
import { projectService } from '@/features/projects/services/projectService'
import type { Project } from '@/features/projects/types/project.types'
import AddMemberModal from '@/features/workspaces/components/AddMemberModal.vue'
import CreateProjectModal from '@/features/projects/components/CreateProjectModal.vue'
import UnderDevelopmentModal from '@/components/common/UnderDevelopmentModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  LucideUsers,
  LucideFolderKanban,
  LucideSettings,
  LucideUserPlus,
  LucideCalendar,
  LucideChevronLeft,
  LucideShield,
  LucideEdit,
  LucideTrash2,
  LucidePlus,
  LucideArrowRight,
} from 'lucide-vue-next'

const route = useRoute()
const workspaceStore = useWorkspaceStore()

const activeTab = ref<'overview' | 'members' | 'settings'>('overview')
const workspace = ref<Workspace | null>(null)
const members = ref<WorkspaceMember[]>([])
const projects = ref<Project[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const showAddMemberModal = ref(false)
const showCreateProjectModal = ref(false)
const showUnderDevModal = ref(false)
const underDevFeature = ref('')

const slug = computed(() => route.params.slug as string)

async function loadWorkspaceData() {
  if (!slug.value) return

  isLoading.value = true
  errorMessage.value = ''
  try {
    const [wsData, membersData, projectsData] = await Promise.all([
      workspaceService.getWorkspace(slug.value),
      workspaceService.getWorkspaceMembers(slug.value),
      projectService.getProjects(slug.value).catch(() => []),
    ])
    workspace.value = wsData
    members.value = membersData
    projects.value = projectsData
    workspaceStore.currentWorkspace = wsData
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isLoading.value = false
  }
}

function handleProjectCreated(newProject: Project) {
  projects.value.unshift(newProject)
}

function getProjectStatusBadgeColor(status: string) {
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
  loadWorkspaceData()
})

watch(slug, () => {
  loadWorkspaceData()
})

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

function getRoleBadgeColor(role: string) {
  switch (role?.toUpperCase()) {
    case 'OWNER':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'ADMIN':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'MEMBER':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb & Back button -->
    <div class="flex items-center gap-2 text-sm text-slate-500">
      <router-link
        to="/workspaces"
        class="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
      >
        <LucideChevronLeft class="w-4 h-4" />
        <span>Workspaces</span>
      </router-link>
      <span>/</span>
      <span class="font-medium text-slate-800">{{ workspace?.name || slug }}</span>
    </div>

    <!-- Error State -->
    <div
      v-if="errorMessage"
      class="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center justify-between"
    >
      <span>{{ errorMessage }}</span>
      <BaseButton size="sm" variant="outline" @click="loadWorkspaceData">
        Retry
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && !workspace"
      class="py-20 flex flex-col items-center justify-center text-slate-400 gap-3"
    >
      <LoadingSpinner size="lg" />
      <span class="text-sm">Loading workspace details...</span>
    </div>

    <div v-else-if="workspace" class="space-y-6">
      <!-- Workspace Header Banner -->
      <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-start gap-3 sm:gap-4 min-w-0">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shrink-0">
              {{ workspace.name.slice(0, 2).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 class="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                  {{ workspace.name }}
                </h1>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-slate-600 border border-slate-200">
                  {{ workspace.slug }}
                </span>
                <StatusBadge status="implemented" label="API Active" />
              </div>
              <p class="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl line-clamp-2 sm:line-clamp-none">
                {{ workspace.description || 'No description provided.' }}
              </p>
              <div class="mt-2.5 sm:mt-3 flex items-center gap-3 sm:gap-4 text-xs text-slate-400 flex-wrap">
                <span class="flex items-center gap-1">
                  <LucideCalendar class="w-3.5 h-3.5" />
                  Created {{ formatDate(workspace.created_at) }}
                </span>
                <span class="flex items-center gap-1">
                  <LucideUsers class="w-3.5 h-3.5" />
                  {{ members.length }} {{ members.length === 1 ? 'Member' : 'Members' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <BaseButton
              variant="outline"
              size="sm"
              class="flex-1 sm:flex-initial"
              @click="triggerUnderDev('Workspace Settings')"
            >
              <LucideSettings class="w-4 h-4" />
              <span>Settings</span>
            </BaseButton>

            <BaseButton
              size="sm"
              class="flex-1 sm:flex-initial"
              @click="showAddMemberModal = true"
            >
              <LucideUserPlus class="w-4 h-4" />
              <span>Add Member</span>
            </BaseButton>
          </div>
        </div>

        <!-- Navigation Tabs (No horizontal scrolling: switches from text to icons on small screens) -->
        <div class="mt-6 flex border-b border-slate-200 gap-1 sm:gap-6 text-sm font-medium">
          <!-- Projects Tab -->
          <button
            type="button"
            class="pb-3 border-b-2 flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-colors flex-1 sm:flex-initial px-2 sm:px-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-t-md"
            :class="[
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ]"
            title="Projects & Overview"
            aria-label="Projects & Overview"
            @click="activeTab = 'overview'"
          >
            <LucideFolderKanban class="w-4 h-4 shrink-0" />
            <span class="hidden sm:inline">Projects</span>
            <span
              class="text-[11px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium"
              :class="activeTab === 'overview' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'"
            >
              {{ projects.length }}
            </span>
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
            title="Team Members"
            aria-label="Team Members"
            @click="activeTab = 'members'"
          >
            <LucideUsers class="w-4 h-4 shrink-0" />
            <span class="hidden sm:inline">Team Members</span>
            <span
              class="text-[11px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium"
              :class="activeTab === 'members' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'"
            >
              {{ members.length }}
            </span>
          </button>

          <!-- Management / Settings Tab -->
          <button
            type="button"
            class="pb-3 border-b-2 flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-colors flex-1 sm:flex-initial px-2 sm:px-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-t-md"
            :class="[
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ]"
            title="Management"
            aria-label="Management"
            @click="activeTab = 'settings'"
          >
            <LucideSettings class="w-4 h-4 shrink-0" />
            <span class="hidden sm:inline">Management</span>
          </button>
        </div>
      </div>

      <!-- Tab Content: Overview & Projects -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Projects</h2>
            <p class="text-xs text-slate-500">
              Projects contained within this workspace
            </p>
          </div>

          <BaseButton
            size="sm"
            @click="showCreateProjectModal = true"
          >
            <LucidePlus class="w-4 h-4" />
            <span>New Project</span>
          </BaseButton>
        </div>

        <!-- Project Cards Grid -->
        <div v-if="projects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <router-link
            v-for="proj in projects"
            :key="proj.id"
            :to="`/workspaces/${workspace.slug}/projects/${proj.key}`"
            class="group block bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-400 hover:shadow-md transition-all relative"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm tracking-wider font-mono border border-indigo-100">
                {{ proj.key.slice(0, 3) }}
              </div>
              <span
                class="px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                :class="getProjectStatusBadgeColor(proj.status)"
              >
                {{ proj.status }}
              </span>
            </div>

            <div class="mt-3">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-base truncate">
                  {{ proj.name }}
                </h3>
                <span class="text-xs font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {{ proj.key }}
                </span>
              </div>
              <p class="mt-1.5 text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
                {{ proj.description || 'No description provided.' }}
              </p>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span class="flex items-center gap-1">
                <LucideCalendar class="w-3.5 h-3.5" />
                {{ formatDate(proj.created_at) }}
              </span>
              <span class="inline-flex items-center gap-1 font-medium text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                <span>View</span>
                <LucideArrowRight class="w-3.5 h-3.5" />
              </span>
            </div>
          </router-link>
        </div>

        <!-- Empty State -->
        <div v-else class="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <LucideFolderKanban class="w-6 h-6" />
          </div>
          <div class="max-w-sm mx-auto">
            <h3 class="text-base font-semibold text-slate-900">
              No projects yet
            </h3>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">
              Create your first project in this workspace to organize tasks, track milestones, and assign team members.
            </p>
          </div>
          <div class="pt-2">
            <BaseButton size="sm" @click="showCreateProjectModal = true">
              <LucidePlus class="w-4 h-4" />
              <span>Create First Project</span>
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Tab Content: Members -->
      <div v-else-if="activeTab === 'members'" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div class="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900">Workspace Members</h2>
            <p class="text-xs text-slate-500">
              Users who have access to this workspace and its resources
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
                <th class="py-3 px-6 font-semibold">Role</th>
                <th class="py-3 px-6 font-semibold">Joined Date</th>
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
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border"
                    :class="getRoleBadgeColor(member.role)"
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

      <!-- Tab Content: Settings / Management -->
      <div v-else-if="activeTab === 'settings'" class="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Workspace Management</h2>
          <p class="text-xs text-slate-500">
            Manage workspace configuration and lifecycle
          </p>
        </div>

        <div class="space-y-4 pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div>
              <h4 class="text-sm font-semibold text-slate-900">Update Workspace Info</h4>
              <p class="text-xs text-slate-500">Change workspace display name and description</p>
            </div>
            <BaseButton
              variant="outline"
              size="sm"
              @click="triggerUnderDev('Update Workspace (PUT /workspaces/{slug})')"
            >
              <LucideEdit class="w-4 h-4" />
              <span>Edit Details</span>
            </BaseButton>
          </div>

          <div class="flex items-center justify-between p-4 rounded-xl border border-rose-200 bg-rose-50/50">
            <div>
              <h4 class="text-sm font-semibold text-rose-900">Delete Workspace</h4>
              <p class="text-xs text-rose-600">Permanently delete this workspace and all associated resources</p>
            </div>
            <BaseButton
              variant="danger"
              size="sm"
              @click="triggerUnderDev('Delete Workspace (DELETE /workspaces/{slug})')"
            >
              <LucideTrash2 class="w-4 h-4" />
              <span>Delete Workspace</span>
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateProjectModal
      v-if="workspace"
      v-model="showCreateProjectModal"
      :workspace-slug="workspace.slug"
      @created="handleProjectCreated"
    />

    <AddMemberModal
      v-model="showAddMemberModal"
      :slug="slug"
      @member-added="loadWorkspaceData"
    />

    <UnderDevelopmentModal
      v-model="showUnderDevModal"
      :feature-name="underDevFeature"
    />
  </div>
</template>
