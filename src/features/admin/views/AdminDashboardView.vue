<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Shield,
  Users,
  Layers,
  FolderKanban,
  CheckSquare,
  FileText,
  RefreshCw,
  Search,
  Trash2,
  AlertTriangle,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { adminService } from '@/features/admin/services/adminService'
import { workspaceService } from '@/features/workspaces/services/workspaceService'
import type { AdminStats, AuditLog } from '@/features/admin/types/admin.types'
import type { User } from '@/features/auth/types/auth.types'
import type { Workspace } from '@/features/workspaces/types/workspace.types'
import type { Project } from '@/features/projects/types/project.types'

const activeTab = ref<'overview' | 'users' | 'workspaces' | 'projects' | 'audit_logs'>('overview')
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Stats
const stats = ref<AdminStats | null>(null)

// Users
const users = ref<User[]>([])
const userSearch = ref('')
const userFilterActive = ref<string>('all')
const userPage = ref(1)
const userTotalPages = ref(1)
const userTotal = ref(0)
const isUpdatingUser = ref(false)

// Workspaces
const workspaces = ref<Workspace[]>([])
const includeDeletedWorkspaces = ref(true)

// Projects
const projects = ref<Project[]>([])
const includeDeletedProjects = ref(true)

// Audit Logs
const auditLogs = ref<AuditLog[]>([])
const auditPage = ref(1)
const auditTotalPages = ref(1)
const auditTotal = ref(0)
const auditActionFilter = ref('')
const auditResourceFilter = ref('')

// Confirmation Modal State
const confirmModalOpen = ref(false)
const confirmModalTitle = ref('')
const confirmModalMessage = ref('')
const confirmAction = ref<(() => Promise<void>) | null>(null)

function showNotification(msg: string, isError: boolean = false) {
  if (isError) {
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

async function loadStats() {
  try {
    stats.value = await adminService.getStats()
  } catch (err: any) {
    showNotification(err.response?.data?.detail || 'Failed to load platform stats', true)
  }
}

async function loadUsers() {
  try {
    const params: any = {
      page: userPage.value,
      size: 15,
      search: userSearch.value.trim() || undefined,
    }
    if (userFilterActive.value === 'active') params.is_active = true
    if (userFilterActive.value === 'inactive') params.is_active = false

    const res = await adminService.getUsers(params)
    users.value = res.items
    userTotal.value = res.total
    userTotalPages.value = res.pages || 1
  } catch (err: any) {
    showNotification(err.response?.data?.detail || 'Failed to load users', true)
  }
}

async function loadWorkspaces() {
  try {
    workspaces.value = await adminService.getWorkspaces(includeDeletedWorkspaces.value)
  } catch (err: any) {
    showNotification(err.response?.data?.detail || 'Failed to load workspaces', true)
  }
}

async function loadProjects() {
  try {
    projects.value = await adminService.getProjects(includeDeletedProjects.value)
  } catch (err: any) {
    showNotification(err.response?.data?.detail || 'Failed to load projects', true)
  }
}

async function loadAuditLogs() {
  try {
    const params: any = {
      page: auditPage.value,
      size: 20,
      action: auditActionFilter.value.trim() || undefined,
      resource_type: auditResourceFilter.value.trim() || undefined,
    }
    const res = await adminService.getAuditLogs(params)
    auditLogs.value = res.items
    auditTotal.value = res.total
    auditTotalPages.value = res.pages || 1
  } catch (err: any) {
    showNotification(err.response?.data?.detail || 'Failed to load audit logs', true)
  }
}

async function refreshAll() {
  isLoading.value = true
  errorMessage.value = null
  try {
    await Promise.all([loadStats(), loadUsers(), loadWorkspaces(), loadProjects(), loadAuditLogs()])
  } finally {
    isLoading.value = false
  }
}

function openConfirmModal(title: string, message: string, action: () => Promise<void>) {
  confirmModalTitle.value = title
  confirmModalMessage.value = message
  confirmAction.value = action
  confirmModalOpen.value = true
}

async function handleConfirm() {
  if (!confirmAction.value) return
  try {
    await confirmAction.value()
    confirmModalOpen.value = false
  } catch (err: any) {
    showNotification(err.response?.data?.detail || 'Action failed', true)
  }
}

// User Actions
function toggleUserActive(user: User) {
  const newStatus = !user.is_active
  const actionText = newStatus ? 'activate' : 'deactivate'
  openConfirmModal(
    `Confirm User ${actionText.toUpperCase()}`,
    `Are you sure you want to ${actionText} user ${user.email}? ${
      !newStatus ? 'They will no longer be able to log in or use the API.' : ''
    }`,
    async () => {
      isUpdatingUser.value = true
      try {
        await adminService.updateUser(user.id, { is_active: newStatus })
        user.is_active = newStatus
        showNotification(`User ${user.email} successfully ${newStatus ? 'activated' : 'deactivated'}.`)
        await loadStats()
      } finally {
        isUpdatingUser.value = false
      }
    }
  )
}

function toggleSuperuser(user: User) {
  const newStatus = !user.is_superuser
  openConfirmModal(
    `Confirm Superuser Privilege Change`,
    `Are you sure you want to ${newStatus ? 'GRANT' : 'REVOKE'} platform-wide SUPERUSER privileges for ${user.email}?`,
    async () => {
      isUpdatingUser.value = true
      try {
        await adminService.updateUser(user.id, { is_superuser: newStatus })
        user.is_superuser = newStatus
        showNotification(`Superuser privileges for ${user.email} updated.`)
      } finally {
        isUpdatingUser.value = false
      }
    }
  )
}

// Workspace Actions
function softDeleteWorkspace(ws: Workspace) {
  openConfirmModal(
    'Confirm Workspace Soft Delete',
    `Are you sure you want to soft-delete workspace "${ws.name}" (${ws.slug})? All child projects, tasks, and comments will be soft-deleted and hidden from active views while preserving audit history.`,
    async () => {
      await workspaceService.deleteWorkspace(ws.slug)
      showNotification(`Workspace ${ws.name} soft-deleted.`)
      await Promise.all([loadWorkspaces(), loadStats(), loadAuditLogs()])
    }
  )
}

onMounted(() => {
  refreshAll()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-primary/10 text-primary">
            <Shield class="w-7 h-7" />
          </div>
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
            <p class="text-sm text-muted-foreground">
              Platform-wide governance, RBAC authorization, and audit log inspection.
            </p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Superuser Access
        </span>
        <BaseButton variant="outline" size="sm" :loading="isLoading" @click="refreshAll">
          <RefreshCw class="w-4 h-4 mr-1.5" />
          Refresh
        </BaseButton>
      </div>
    </div>

    <!-- Alert Banners -->
    <div v-if="errorMessage" class="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <AlertTriangle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="errorMessage = null" class="text-destructive hover:opacity-75">
        <X class="w-4 h-4" />
      </button>
    </div>

    <div v-if="successMessage" class="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Check class="w-4 h-4 shrink-0" />
        <span>{{ successMessage }}</span>
      </div>
      <button @click="successMessage = null" class="hover:opacity-75">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Tabs Navigation -->
    <div class="flex items-center gap-1 border-b border-border overflow-x-auto pb-px">
      <button
        @click="activeTab = 'overview'"
        :class="[
          'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 border-b-2',
          activeTab === 'overview'
            ? 'border-primary text-primary bg-primary/5'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
        ]"
      >
        <Shield class="w-4 h-4" />
        Overview
      </button>
      <button
        @click="activeTab = 'users'"
        :class="[
          'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 border-b-2',
          activeTab === 'users'
            ? 'border-primary text-primary bg-primary/5'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
        ]"
      >
        <Users class="w-4 h-4" />
        Users ({{ stats?.total_users ?? 0 }})
      </button>
      <button
        @click="activeTab = 'workspaces'"
        :class="[
          'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 border-b-2',
          activeTab === 'workspaces'
            ? 'border-primary text-primary bg-primary/5'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
        ]"
      >
        <Layers class="w-4 h-4" />
        Workspaces ({{ stats?.total_workspaces ?? 0 }})
      </button>
      <button
        @click="activeTab = 'projects'"
        :class="[
          'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 border-b-2',
          activeTab === 'projects'
            ? 'border-primary text-primary bg-primary/5'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
        ]"
      >
        <FolderKanban class="w-4 h-4" />
        Projects ({{ stats?.total_projects ?? 0 }})
      </button>
      <button
        @click="activeTab = 'audit_logs'"
        :class="[
          'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 border-b-2',
          activeTab === 'audit_logs'
            ? 'border-primary text-primary bg-primary/5'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
        ]"
      >
        <FileText class="w-4 h-4" />
        Audit Logs ({{ stats?.total_audit_logs ?? 0 }})
      </button>
    </div>

    <!-- TAB 1: OVERVIEW -->
    <div v-if="activeTab === 'overview'" class="space-y-6">
      <div v-if="isLoading" class="py-12 flex justify-center">
        <LoadingSpinner />
      </div>
      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Users Card -->
        <div class="p-5 rounded-2xl bg-card border border-border space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</span>
            <div class="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Users class="w-4 h-4" /></div>
          </div>
          <div class="text-3xl font-bold text-foreground">{{ stats?.total_users ?? 0 }}</div>
          <div class="text-xs text-muted-foreground flex items-center gap-2">
            <span class="text-emerald-500 font-medium">{{ stats?.active_users ?? 0 }} active</span>
            <span>•</span>
            <span class="text-amber-500 font-medium">{{ stats?.unverified_users ?? 0 }} unverified</span>
          </div>
        </div>

        <!-- Workspaces Card -->
        <div class="p-5 rounded-2xl bg-card border border-border space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Workspaces</span>
            <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><Layers class="w-4 h-4" /></div>
          </div>
          <div class="text-3xl font-bold text-foreground">{{ stats?.total_workspaces ?? 0 }}</div>
          <div class="text-xs text-muted-foreground">Active multi-tenant spaces</div>
        </div>

        <!-- Projects Card -->
        <div class="p-5 rounded-2xl bg-card border border-border space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</span>
            <div class="p-2 rounded-lg bg-amber-500/10 text-amber-500"><FolderKanban class="w-4 h-4" /></div>
          </div>
          <div class="text-3xl font-bold text-foreground">{{ stats?.total_projects ?? 0 }}</div>
          <div class="text-xs text-muted-foreground">Active projects configured</div>
        </div>

        <!-- Tasks Card -->
        <div class="p-5 rounded-2xl bg-card border border-border space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks</span>
            <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><CheckSquare class="w-4 h-4" /></div>
          </div>
          <div class="text-3xl font-bold text-foreground">{{ stats?.total_tasks ?? 0 }}</div>
          <div class="text-xs text-muted-foreground">{{ stats?.total_comments ?? 0 }} comments posted</div>
        </div>
      </div>

      <!-- Recent Audit Trail in Overview -->
      <div class="p-5 rounded-2xl bg-card border border-border space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
            <FileText class="w-4 h-4 text-primary" />
            Recent Security & Audit Events
          </h2>
          <BaseButton variant="ghost" size="sm" @click="activeTab = 'audit_logs'">
            View All Audit Logs &rarr;
          </BaseButton>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th class="px-4 py-3">Timestamp</th>
                <th class="px-4 py-3">Action</th>
                <th class="px-4 py-3">Resource</th>
                <th class="px-4 py-3">Actor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="log in auditLogs.slice(0, 5)" :key="log.id" class="hover:bg-muted/30">
                <td class="px-4 py-3 text-xs text-muted-foreground">{{ new Date(log.created_at).toLocaleString() }}</td>
                <td class="px-4 py-3 font-medium">
                  <span class="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-mono">{{ log.action }}</span>
                </td>
                <td class="px-4 py-3 text-xs">{{ log.resource_type }}:{{ log.resource_id }}</td>
                <td class="px-4 py-3 text-xs text-muted-foreground">{{ log.actor?.email || `User #${log.actor_id}` }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: USERS -->
    <div v-if="activeTab === 'users'" class="space-y-4">
      <!-- Search & Filters -->
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            v-model="userSearch"
            type="text"
            placeholder="Search users by name or email..."
            @input="userPage = 1; loadUsers()"
            class="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <select
            v-model="userFilterActive"
            @change="userPage = 1; loadUsers()"
            class="px-3 py-2 text-sm rounded-lg bg-background border border-border"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      <!-- Users Table -->
      <div class="rounded-xl border border-border overflow-hidden bg-card">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th class="px-4 py-3">User</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Verified</th>
                <th class="px-4 py-3">Role</th>
                <th class="px-4 py-3">Registered</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="user in users" :key="user.id" class="hover:bg-muted/30">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    <UserAvatar :user="user" size="sm" />
                    <div>
                      <div class="font-medium text-foreground">{{ user.full_name }}</div>
                      <div class="text-xs text-muted-foreground">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-xs font-semibold',
                      user.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                    ]"
                  >
                    {{ user.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs">
                  <span v-if="user.is_verified" class="text-emerald-500 flex items-center gap-1">
                    <Check class="w-3.5 h-3.5" /> Verified
                  </span>
                  <span v-else class="text-amber-500 flex items-center gap-1">
                    <AlertTriangle class="w-3.5 h-3.5" /> Unverified
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs font-semibold font-mono',
                      user.is_superuser ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-muted text-muted-foreground'
                    ]"
                  >
                    {{ user.is_superuser ? 'SUPERUSER' : 'USER' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-muted-foreground">
                  {{ new Date(user.created_at).toLocaleDateString() }}
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button
                    @click="toggleUserActive(user)"
                    :disabled="isUpdatingUser"
                    :class="[
                      'px-2.5 py-1 text-xs font-medium rounded transition-colors',
                      user.is_active
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                        : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                    ]"
                  >
                    {{ user.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button
                    @click="toggleSuperuser(user)"
                    :disabled="isUpdatingUser"
                    class="px-2.5 py-1 text-xs font-medium rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                  >
                    {{ user.is_superuser ? 'Revoke Superuser' : 'Make Superuser' }}
                  </button>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-muted-foreground text-sm">
                  No users found matching your search.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Total: {{ userTotal }} user(s)</span>
          <div class="flex items-center gap-2">
            <button
              :disabled="userPage <= 1"
              @click="userPage--; loadUsers()"
              class="p-1 rounded hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span>Page {{ userPage }} of {{ userTotalPages }}</span>
            <button
              :disabled="userPage >= userTotalPages"
              @click="userPage++; loadUsers()"
              class="p-1 rounded hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: WORKSPACES -->
    <div v-if="activeTab === 'workspaces'" class="space-y-4">
      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            v-model="includeDeletedWorkspaces"
            @change="loadWorkspaces"
            class="rounded border-border text-primary focus:ring-primary/20"
          />
          Include Soft-Deleted Workspaces
        </label>
      </div>

      <div class="rounded-xl border border-border overflow-hidden bg-card">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th class="px-4 py-3">Workspace</th>
                <th class="px-4 py-3">Slug</th>
                <th class="px-4 py-3">Owner ID</th>
                <th class="px-4 py-3">State</th>
                <th class="px-4 py-3">Created</th>
                <th class="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="ws in workspaces" :key="ws.id" class="hover:bg-muted/30">
                <td class="px-4 py-3">
                  <div class="font-medium text-foreground">{{ ws.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ ws.description || 'No description' }}</div>
                </td>
                <td class="px-4 py-3 font-mono text-xs">{{ ws.slug }}</td>
                <td class="px-4 py-3 text-xs">User #{{ ws.owner_id }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs font-semibold',
                      ws.deleted_at ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-500'
                    ]"
                  >
                    {{ ws.deleted_at ? 'DELETED' : 'ACTIVE' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-muted-foreground">
                  {{ new Date(ws.created_at).toLocaleDateString() }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    v-if="!ws.deleted_at"
                    @click="softDeleteWorkspace(ws)"
                    class="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
                    title="Soft Delete Workspace"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                  <span v-else class="text-xs text-muted-foreground italic">Deleted</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: PROJECTS -->
    <div v-if="activeTab === 'projects'" class="space-y-4">
      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            v-model="includeDeletedProjects"
            @change="loadProjects"
            class="rounded border-border text-primary focus:ring-primary/20"
          />
          Include Soft-Deleted Projects
        </label>
      </div>

      <div class="rounded-xl border border-border overflow-hidden bg-card">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th class="px-4 py-3">Key</th>
                <th class="px-4 py-3">Project Name</th>
                <th class="px-4 py-3">Workspace ID</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">State</th>
                <th class="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="proj in projects" :key="proj.id" class="hover:bg-muted/30">
                <td class="px-4 py-3 font-mono font-bold text-xs text-primary">{{ proj.key }}</td>
                <td class="px-4 py-3 font-medium text-foreground">{{ proj.name }}</td>
                <td class="px-4 py-3 text-xs">#{{ proj.workspace_id }}</td>
                <td class="px-4 py-3 text-xs">{{ proj.status }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs font-semibold',
                      proj.deleted_at ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-500'
                    ]"
                  >
                    {{ proj.deleted_at ? 'DELETED' : 'ACTIVE' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-muted-foreground">
                  {{ new Date(proj.created_at).toLocaleDateString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 5: AUDIT LOGS -->
    <div v-if="activeTab === 'audit_logs'" class="space-y-4">
      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3">
        <input
          v-model="auditActionFilter"
          type="text"
          placeholder="Filter by action (e.g. WORKSPACE_DELETED)..."
          @input="auditPage = 1; loadAuditLogs()"
          class="px-3 py-2 text-sm rounded-lg bg-background border border-border w-full sm:w-64"
        />
        <input
          v-model="auditResourceFilter"
          type="text"
          placeholder="Filter by resource (WORKSPACE, PROJECT, USER)..."
          @input="auditPage = 1; loadAuditLogs()"
          class="px-3 py-2 text-sm rounded-lg bg-background border border-border w-full sm:w-64"
        />
      </div>

      <!-- Logs Table -->
      <div class="rounded-xl border border-border overflow-hidden bg-card">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th class="px-4 py-3">Timestamp</th>
                <th class="px-4 py-3">Action</th>
                <th class="px-4 py-3">Resource</th>
                <th class="px-4 py-3">Actor</th>
                <th class="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-muted/30">
                <td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {{ new Date(log.created_at).toLocaleString() }}
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary font-medium">
                    {{ log.action }}
                  </span>
                </td>
                <td class="px-4 py-3 font-mono text-xs">
                  {{ log.resource_type }}:{{ log.resource_id }}
                </td>
                <td class="px-4 py-3 text-xs">
                  {{ log.actor?.email || `User #${log.actor_id}` }}
                </td>
                <td class="px-4 py-3 text-xs font-mono text-muted-foreground max-w-xs truncate" :title="log.details || ''">
                  {{ log.details || '-' }}
                </td>
              </tr>
              <tr v-if="auditLogs.length === 0">
                <td colspan="5" class="px-4 py-8 text-center text-muted-foreground text-sm">
                  No audit log entries recorded.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Total: {{ auditTotal }} event(s)</span>
          <div class="flex items-center gap-2">
            <button
              :disabled="auditPage <= 1"
              @click="auditPage--; loadAuditLogs()"
              class="p-1 rounded hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span>Page {{ auditPage }} of {{ auditTotalPages }}</span>
            <button
              :disabled="auditPage >= auditTotalPages"
              @click="auditPage++; loadAuditLogs()"
              class="p-1 rounded hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div
      v-if="confirmModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="w-full max-w-md p-6 bg-card rounded-2xl border border-border shadow-xl space-y-4">
        <div class="flex items-center gap-3 text-amber-500">
          <div class="p-2 rounded-lg bg-amber-500/10">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-foreground">{{ confirmModalTitle }}</h3>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">
          {{ confirmModalMessage }}
        </p>
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="outline" size="sm" @click="confirmModalOpen = false">
            Cancel
          </BaseButton>
          <BaseButton variant="primary" size="sm" @click="handleConfirm">
            Confirm Action
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
