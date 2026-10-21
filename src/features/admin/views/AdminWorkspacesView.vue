<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Layers,
  Search,
  Trash2,
  RotateCcw,
  Users,
  AlertTriangle,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  UserMinus,
  UserPlus,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { adminService } from '@/features/admin/services/adminService'
import type { Workspace, WorkspaceMember } from '@/features/workspaces/types/workspace.types'

const isLoading = ref(true)
const isOperating = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const workspaces = ref<Workspace[]>([])
const search = ref('')
const includeDeleted = ref(true)

// Confirmation modal state
const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmCallback = ref<(() => Promise<void>) | null>(null)

// Member management modal state
const membersModalOpen = ref(false)
const selectedWorkspace = ref<Workspace | null>(null)
const workspaceMembers = ref<WorkspaceMember[]>([])
const isLoadingMembers = ref(false)
const newMemberEmail = ref('')
const newMemberRole = ref('MEMBER')

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

async function loadWorkspaces() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const list = await adminService.getWorkspaces(includeDeleted.value)
    workspaces.value = list
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to load workspaces', true)
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

function handleSoftDelete(ws: Workspace) {
  openConfirm(
    `Confirm Workspace Soft-Delete: ${ws.name}`,
    `Are you sure you want to soft-delete workspace "${ws.name}" (${ws.slug})? All child projects, tasks, and task comments will be hidden from regular users but preserved in the database.`,
    async () => {
      await adminService.deleteWorkspace(ws.id)
      showNotice(`Workspace "${ws.name}" soft-deleted successfully.`)
      await loadWorkspaces()
    }
  )
}

function handleRestore(ws: Workspace) {
  openConfirm(
    `Restore Workspace: ${ws.name}`,
    `This will restore workspace "${ws.name}" (${ws.slug}) and make it accessible again to its authorized members.`,
    async () => {
      await adminService.restoreWorkspace(ws.id)
      showNotice(`Workspace "${ws.name}" has been restored successfully.`)
      await loadWorkspaces()
    }
  )
}

async function openMembersModal(ws: Workspace) {
  selectedWorkspace.value = ws
  membersModalOpen.value = true
  isLoadingMembers.value = true
  try {
    workspaceMembers.value = await adminService.getWorkspaceMembers(ws.id)
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to load members', true)
  } finally {
    isLoadingMembers.value = false
  }
}

async function handleAddMember() {
  if (!selectedWorkspace.value || !newMemberEmail.value) return
  isOperating.value = true
  try {
    await adminService.manageWorkspaceMember(selectedWorkspace.value.id, {
      email: newMemberEmail.value.trim(),
      role: newMemberRole.value,
    })
    newMemberEmail.value = ''
    showNotice('Member updated successfully')
    workspaceMembers.value = await adminService.getWorkspaceMembers(selectedWorkspace.value.id)
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to assign member', true)
  } finally {
    isOperating.value = false
  }
}

async function handleRemoveMember(userId: number) {
  if (!selectedWorkspace.value) return
  try {
    await adminService.removeWorkspaceMember(selectedWorkspace.value.id, userId)
    showNotice('Member removed successfully')
    workspaceMembers.value = await adminService.getWorkspaceMembers(selectedWorkspace.value.id)
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to remove member', true)
  }
}

const filteredWorkspaces = () => {
  const query = search.value.toLowerCase().trim()
  if (!query) return workspaces.value
  return workspaces.value.filter(
    (w) => w.name.toLowerCase().includes(query) || w.slug.toLowerCase().includes(query)
  )
}

onMounted(() => {
  loadWorkspaces()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
          <Layers class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Management</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Inspect platform workspaces, manage tenant memberships, and handle soft-delete / restore.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <BaseButton variant="outline" size="sm" :loading="isLoading" @click="loadWorkspaces">
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

    <!-- Filter Bar -->
    <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
      <div class="relative w-full sm:w-80">
        <Search class="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Filter workspaces by name or slug..."
          class="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-900 dark:text-white"
        />
      </div>

      <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
        <input
          type="checkbox"
          v-model="includeDeleted"
          @change="loadWorkspaces"
          class="rounded text-purple-600 focus:ring-purple-500"
        />
        <span>Include Soft-Deleted Workspaces</span>
      </label>
    </div>

    <!-- Workspaces Table -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
            <tr>
              <th class="px-5 py-3.5">Workspace</th>
              <th class="px-5 py-3.5">Slug</th>
              <th class="px-5 py-3.5">Owner ID</th>
              <th class="px-5 py-3.5">Lifecycle State</th>
              <th class="px-5 py-3.5">Created</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="ws in filteredWorkspaces()" :key="ws.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-5 py-4">
                <div class="font-semibold text-slate-900 dark:text-white">{{ ws.name }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {{ ws.description || 'No description provided' }}
                </div>
              </td>
              <td class="px-5 py-4 font-mono text-xs text-purple-700 dark:text-purple-300">
                {{ ws.slug }}
              </td>
              <td class="px-5 py-4 text-xs text-slate-600 dark:text-slate-400">
                User #{{ ws.owner_id }}
              </td>
              <td class="px-5 py-4">
                <div v-if="ws.deleted_at" class="space-y-1">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    SOFT-DELETED
                  </span>
                  <div class="text-[11px] text-slate-400">
                    {{ new Date(ws.deleted_at).toLocaleDateString() }}
                  </div>
                </div>
                <span
                  v-else
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  ACTIVE
                </span>
              </td>
              <td class="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {{ new Date(ws.created_at).toLocaleDateString() }}
              </td>
              <td class="px-5 py-4 text-right space-x-2">
                <!-- Manage Members -->
                <button
                  @click="openMembersModal(ws)"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="Inspect Members"
                >
                  <Users class="w-3.5 h-3.5" />
                  <span>Members</span>
                </button>

                <!-- Soft Delete Action -->
                <button
                  v-if="!ws.deleted_at"
                  @click="handleSoftDelete(ws)"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="Soft-delete workspace"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span>Soft-Delete</span>
                </button>

                <!-- Restore Action -->
                <button
                  v-else
                  @click="handleRestore(ws)"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="Restore workspace"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </td>
            </tr>
            <tr v-if="filteredWorkspaces().length === 0 && !isLoading">
              <td colspan="6" class="px-5 py-10 text-center text-slate-400 text-sm">
                No workspaces found matching filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Members Management Modal -->
    <div
      v-if="membersModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="w-full max-w-lg p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <Users class="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              Members of {{ selectedWorkspace?.name }}
            </h3>
          </div>
          <button @click="membersModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Add Member Input -->
        <div class="flex items-center gap-2">
          <input
            v-model="newMemberEmail"
            type="email"
            placeholder="User email to add / update..."
            class="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
          <select
            v-model="newMemberRole"
            class="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="MEMBER">MEMBER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="VIEWER">VIEWER</option>
          </select>
          <BaseButton size="sm" variant="primary" :loading="isOperating" @click="handleAddMember">
            <UserPlus class="w-3.5 h-3.5 mr-1" />
            Add
          </BaseButton>
        </div>

        <!-- Members List -->
        <div v-if="isLoadingMembers" class="py-8 flex justify-center">
          <LoadingSpinner />
        </div>
        <div v-else class="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl border-slate-200 dark:border-slate-800">
          <div
            v-for="m in workspaceMembers"
            :key="m.id"
            class="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <div>
              <div class="font-medium text-slate-900 dark:text-white">{{ m.user?.email || `User #${m.user_id}` }}</div>
              <div class="text-[11px] text-slate-500">{{ m.user?.full_name }}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {{ m.role }}
              </span>
              <button
                v-if="m.role !== 'OWNER'"
                @click="handleRemoveMember(m.user_id)"
                class="p-1 text-slate-400 hover:text-rose-600 rounded"
                title="Remove Member"
              >
                <UserMinus class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div v-if="workspaceMembers.length === 0" class="py-6 text-center text-xs text-slate-400">
            No members in this workspace.
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <BaseButton variant="outline" size="sm" @click="membersModalOpen = false">Close</BaseButton>
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
