<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { workspaceService } from '@/features/workspaces/services/workspaceService'
import { useWorkspaceStore } from '@/stores/workspace'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'
import { formatApiError } from '@/services/apiClient'
import type { Workspace, WorkspaceMember } from '@/features/workspaces/types/workspace.types'
import { projectService } from '@/features/projects/services/projectService'
import type { Project } from '@/features/projects/types/project.types'
import AddMemberModal from '@/features/workspaces/components/AddMemberModal.vue'
import EditWorkspaceModal from '@/features/workspaces/components/EditWorkspaceModal.vue'
import CreateProjectModal from '@/features/projects/components/CreateProjectModal.vue'
import UnderDevelopmentModal from '@/components/common/UnderDevelopmentModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
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
  LucideUserMinus,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const workspaceStore = useWorkspaceStore()
const authStore = useAuthStore()
const notify = useNotification()

const activeTab = ref<'overview' | 'members' | 'settings'>('overview')
const workspace = ref<Workspace | null>(null)
const members = ref<WorkspaceMember[]>([])
const projects = ref<Project[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const showAddMemberModal = ref(false)
const showCreateProjectModal = ref(false)
const showEditWorkspaceModal = ref(false)
const showDeleteWorkspaceDialog = ref(false)
const isDeletingWorkspace = ref(false)
const showRemoveMemberDialog = ref(false)
const memberToRemove = ref<WorkspaceMember | null>(null)
const isRemovingMember = ref(false)
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
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
    case 'ADMIN':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
    case 'VIEWER':
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    case 'MEMBER':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
  }
}

const currentUserMember = computed(() =>
  members.value.find((m) => m.user_id === authStore.user?.id)
)

const canManageWorkspace = computed(() => {
  if (authStore.isSuperuser) return true
  if (workspace.value?.owner_id === authStore.user?.id) return true
  const role = currentUserMember.value?.role
  return role === 'OWNER' || role === 'ADMIN'
})

const isWorkspaceOwner = computed(() => {
  if (authStore.isSuperuser) return true
  if (workspace.value?.owner_id === authStore.user?.id) return true
  return currentUserMember.value?.role === 'OWNER'
})

const ownersCount = computed(() =>
  members.value.filter((m) => m.role === 'OWNER').length
)

async function handleUpdateMemberRole(member: WorkspaceMember, newRole: string) {
  if (!slug.value) return
  if (member.role === 'OWNER' && newRole !== 'OWNER' && ownersCount.value <= 1) {
    notify.error('Cannot demote the last remaining workspace owner.')
    return
  }
  try {
    const updated = await workspaceService.updateMemberRole(slug.value, member.user.id, newRole)
    const idx = members.value.findIndex((m) => m.id === member.id)
    if (idx !== -1) members.value[idx] = updated
    notify.success(`Updated role for ${member.user.full_name} to ${newRole}.`)
  } catch (err: unknown) {
    notify.error(formatApiError(err))
  }
}

function promptRemoveMember(member: WorkspaceMember) {
  if (member.role === 'OWNER' && ownersCount.value <= 1) {
    notify.error('Cannot remove the last remaining workspace owner.')
    return
  }
  memberToRemove.value = member
  showRemoveMemberDialog.value = true
}

async function confirmRemoveMember() {
  if (!memberToRemove.value || !slug.value) return
  isRemovingMember.value = true
  try {
    await workspaceService.removeMember(slug.value, memberToRemove.value.user.id)
    notify.success(`Member ${memberToRemove.value.user.full_name} removed from workspace.`)
    members.value = members.value.filter((m) => m.id !== memberToRemove.value!.id)
    showRemoveMemberDialog.value = false
    memberToRemove.value = null
  } catch (err: unknown) {
    notify.error(formatApiError(err))
  } finally {
    isRemovingMember.value = false
  }
}

async function confirmDeleteWorkspace() {
  if (!slug.value || !workspace.value) return
  isDeletingWorkspace.value = true
  try {
    await workspaceService.deleteWorkspace(slug.value)
    notify.success(`Workspace "${workspace.value.name}" deleted successfully.`)
    showDeleteWorkspaceDialog.value = false
    await workspaceStore.fetchWorkspaces()
    router.push({ name: 'workspaces' })
  } catch (err: unknown) {
    notify.error(formatApiError(err))
  } finally {
    isDeletingWorkspace.value = false
  }
}

function handleWorkspaceUpdated(updated: Workspace) {
  workspace.value = updated
  workspaceStore.currentWorkspace = updated
  const idx = workspaceStore.workspaces.findIndex((w) => w.id === updated.id)
  if (idx !== -1) workspaceStore.workspaces[idx] = updated
}
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb & Back button -->
    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <router-link
        to="/workspaces"
        class="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <LucideChevronLeft class="w-4 h-4" />
        <span>Workspaces</span>
      </router-link>
      <span>/</span>
      <span class="font-medium text-slate-800 dark:text-slate-200">{{ workspace?.name || slug }}</span>
    </div>

    <!-- Error State -->
    <div
      v-if="errorMessage"
      class="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between"
    >
      <span>{{ errorMessage }}</span>
      <BaseButton size="sm" variant="outline" @click="loadWorkspaceData">
        Retry
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && !workspace"
      class="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3"
    >
      <LoadingSpinner size="lg" />
      <span class="text-sm">Loading workspace details...</span>
    </div>

    <div v-else-if="workspace" class="space-y-6">
      <!-- Workspace Header Banner -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-start gap-3 sm:gap-4 min-w-0">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shrink-0">
              {{ workspace.name.slice(0, 2).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {{ workspace.name }}
                </h1>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {{ workspace.slug }}
                </span>
                <StatusBadge status="implemented" label="API Active" />
              </div>
              <p class="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl line-clamp-2 sm:line-clamp-none">
                {{ workspace.description || 'No description provided.' }}
              </p>
              <div class="mt-2.5 sm:mt-3 flex items-center gap-3 sm:gap-4 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
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
          <div class="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
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

        <!-- Navigation Tabs -->
        <div class="mt-6 flex border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-6 text-sm font-medium">
          <!-- Projects Tab -->
          <button
            type="button"
            class="pb-3 border-b-2 flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-colors flex-1 sm:flex-initial px-2 sm:px-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-t-md"
            :class="[
              activeTab === 'overview'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
            ]"
            title="Projects & Overview"
            aria-label="Projects & Overview"
            @click="activeTab = 'overview'"
          >
            <LucideFolderKanban class="w-4 h-4 shrink-0" />
            <span class="hidden sm:inline">Projects</span>
            <span
              class="text-[11px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium"
              :class="activeTab === 'overview' ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
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
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
            ]"
            title="Team Members"
            aria-label="Team Members"
            @click="activeTab = 'members'"
          >
            <LucideUsers class="w-4 h-4 shrink-0" />
            <span class="hidden sm:inline">Team Members</span>
            <span
              class="text-[11px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium"
              :class="activeTab === 'members' ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
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
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
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
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Projects</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
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
            class="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all relative"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm tracking-wider font-mono border border-indigo-100 dark:border-indigo-900">
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
                <h3 class="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-base truncate">
                  {{ proj.name }}
                </h3>
                <span class="text-xs font-mono font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {{ proj.key }}
                </span>
              </div>
              <p class="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2rem]">
                {{ proj.description || 'No description provided.' }}
              </p>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
              <span class="flex items-center gap-1">
                <LucideCalendar class="w-3.5 h-3.5" />
                {{ formatDate(proj.created_at) }}
              </span>
              <span class="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                <span>View</span>
                <LucideArrowRight class="w-3.5 h-3.5" />
              </span>
            </div>
          </router-link>
        </div>

        <!-- Empty State -->
        <div v-else class="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 sm:p-12 text-center space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <LucideFolderKanban class="w-6 h-6" />
          </div>
          <div class="max-w-sm mx-auto">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">
              No projects yet
            </h3>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
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
      <div v-else-if="activeTab === 'members'" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Workspace Members</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
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
              <tr class="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th class="py-3 px-6 font-semibold">User</th>
                <th class="py-3 px-6 font-semibold">Email</th>
                <th class="py-3 px-6 font-semibold">Role</th>
                <th class="py-3 px-6 font-semibold">Joined Date</th>
                <th v-if="canManageWorkspace" class="py-3 px-6 font-semibold text-right">Actions</th>
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
                  <!-- If can manage and not the sole owner: allow role change -->
                  <div v-if="isWorkspaceOwner && !(member.role === 'OWNER' && ownersCount <= 1)">
                    <select
                      :value="member.role"
                      @change="handleUpdateMemberRole(member, ($event.target as HTMLSelectElement).value)"
                      class="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  </div>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border"
                    :class="getRoleBadgeColor(member.role)"
                  >
                    <LucideShield class="w-3 h-3" />
                    {{ member.role }}
                  </span>
                </td>
                <td class="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs">
                  {{ formatDate(member.joined_at) }}
                </td>
                <td v-if="canManageWorkspace" class="py-4 px-6 text-right">
                  <button
                    v-if="!(member.role === 'OWNER' && ownersCount <= 1)"
                    type="button"
                    title="Remove member"
                    class="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                    @click="promptRemoveMember(member)"
                  >
                    <LucideUserMinus class="w-4 h-4" />
                  </button>
                  <span v-else class="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    Sole Owner
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab Content: Settings / Management -->
      <div v-else-if="activeTab === 'settings'" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 transition-colors">
        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">Workspace Management</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Manage workspace configuration and lifecycle
          </p>
        </div>

        <div class="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
            <div>
              <h4 class="text-sm font-semibold text-slate-900 dark:text-white">Update Workspace Info</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400">Change workspace display name and description</p>
            </div>
            <BaseButton
              v-if="canManageWorkspace"
              variant="outline"
              size="sm"
              @click="showEditWorkspaceModal = true"
            >
              <LucideEdit class="w-4 h-4" />
              <span>Edit Details</span>
            </BaseButton>
            <span v-else class="text-xs text-slate-400 dark:text-slate-500 italic">Admin only</span>
          </div>

          <div class="flex items-center justify-between p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
            <div>
              <h4 class="text-sm font-semibold text-rose-900 dark:text-rose-200">Delete Workspace</h4>
              <p class="text-xs text-rose-600 dark:text-rose-400">Soft-delete this workspace and hide its descendant projects and tasks</p>
            </div>
            <BaseButton
              v-if="isWorkspaceOwner"
              variant="danger"
              size="sm"
              @click="showDeleteWorkspaceDialog = true"
            >
              <LucideTrash2 class="w-4 h-4" />
              <span>Delete Workspace</span>
            </BaseButton>
            <span v-else class="text-xs text-slate-400 dark:text-slate-500 italic">Owner only</span>
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

    <EditWorkspaceModal
      v-if="workspace"
      v-model="showEditWorkspaceModal"
      :workspace="workspace"
      @updated="handleWorkspaceUpdated"
    />

    <AddMemberModal
      v-model="showAddMemberModal"
      :slug="slug"
      @member-added="loadWorkspaceData"
    />

    <!-- Delete Workspace Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteWorkspaceDialog"
      title="Delete Workspace"
      :message="`Are you sure you want to soft-delete workspace &quot;${workspace?.name}&quot; (${workspace?.slug})?`"
      details="This will soft-delete this workspace along with all child projects, tasks, and task comments. They will be archived and hidden from active views while preserving audit history."
      confirm-text="Delete Workspace"
      variant="danger"
      :loading="isDeletingWorkspace"
      @confirm="confirmDeleteWorkspace"
    />

    <!-- Remove Member Confirmation Dialog -->
    <ConfirmDialog
      v-model="showRemoveMemberDialog"
      title="Remove Workspace Member"
      :message="`Are you sure you want to remove ${memberToRemove?.user.full_name} (${memberToRemove?.user.email}) from this workspace?`"
      details="They will immediately lose access to all projects, tickets, and team collaboration in this workspace."
      confirm-text="Remove Member"
      variant="danger"
      :loading="isRemovingMember"
      @confirm="confirmRemoveMember"
    />

    <UnderDevelopmentModal
      v-model="showUnderDevModal"
      :feature-name="underDevFeature"
    />
  </div>
</template>
