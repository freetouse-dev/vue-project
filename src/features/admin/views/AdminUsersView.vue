<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Users,
  Search,
  Shield,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-vue-next'
import BaseButton from '@/components/common/BaseButton.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { adminService } from '@/features/admin/services/adminService'
import type { User } from '@/features/auth/types/auth.types'

const isLoading = ref(true)
const isUpdating = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const users = ref<User[]>([])
const search = ref('')
const statusFilter = ref<string>('all')
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)

// Confirmation modal state
const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmCallback = ref<(() => Promise<void>) | null>(null)

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

async function loadUsers() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const params: any = {
      page: page.value,
      size: 15,
      search: search.value.trim() || undefined,
    }
    if (statusFilter.value === 'active') params.is_active = true
    if (statusFilter.value === 'inactive') params.is_active = false

    const res = await adminService.getUsers(params)
    users.value = res.items
    total.value = res.total
    totalPages.value = res.pages || 1
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to load users', true)
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
  isUpdating.value = true
  try {
    await confirmCallback.value()
    confirmOpen.value = false
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Operation failed', true)
  } finally {
    isUpdating.value = false
  }
}

function handleToggleActive(user: User) {
  const newStatus = !user.is_active
  const actionText = newStatus ? 'activate' : 'deactivate'
  openConfirm(
    `Confirm Account ${newStatus ? 'Activation' : 'Deactivation'}`,
    `Are you sure you want to ${actionText} ${user.email}? ${
      !newStatus ? 'The user will be immediately logged out and unable to access the API.' : ''
    }`,
    async () => {
      await adminService.updateUser(user.id, { is_active: newStatus })
      user.is_active = newStatus
      showNotice(`User ${user.email} successfully ${newStatus ? 'activated' : 'deactivated'}.`)
    }
  )
}

function handleToggleSuperuser(user: User) {
  const newStatus = !user.is_superuser
  openConfirm(
    `Confirm Superuser ${newStatus ? 'Grant' : 'Revocation'}`,
    `Are you sure you want to ${newStatus ? 'grant global Superuser privileges to' : 'revoke Superuser privileges from'} ${user.email}? ${
      !newStatus ? 'If this is the only active superuser, the system will block this action.' : ''
    }`,
    async () => {
      await adminService.updateUser(user.id, { is_superuser: newStatus })
      user.is_superuser = newStatus
      showNotice(`Superuser privileges for ${user.email} updated.`)
    }
  )
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Users class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">User Management</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Manage accounts, superuser privileges, and enforce platform safeguards.
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <BaseButton variant="outline" size="sm" :loading="isLoading" @click="loadUsers">
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
      <button @click="errorMessage = null" class="text-rose-700 dark:text-rose-300 hover:opacity-75">
        <X class="w-4 h-4" />
      </button>
    </div>

    <div v-if="successMessage" class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Check class="w-4 h-4 shrink-0" />
        <span>{{ successMessage }}</span>
      </div>
      <button @click="successMessage = null" class="text-emerald-700 dark:text-emerald-300 hover:opacity-75">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Safeguard Advisory Banner -->
    <div class="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/50 flex items-start gap-3">
      <Shield class="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
      <div class="text-xs text-purple-900 dark:text-purple-300 leading-relaxed">
        <strong>Lockout Safeguard Active:</strong> The backend strictly prevents demoting or deactivating the last active superuser on the platform. Even administrators cannot lock themselves out of the system.
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
      <div class="relative w-full sm:w-80">
        <Search class="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by full name or email..."
          @input="page = 1; loadUsers()"
          class="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-900 dark:text-white"
        />
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <select
          v-model="statusFilter"
          @change="page = 1; loadUsers()"
          class="px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>
    </div>

    <!-- Users Table -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
            <tr>
              <th class="px-5 py-3.5">User</th>
              <th class="px-5 py-3.5">Status</th>
              <th class="px-5 py-3.5">Email Verified</th>
              <th class="px-5 py-3.5">Privileges</th>
              <th class="px-5 py-3.5">Registered</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="u in users" :key="u.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <UserAvatar :user="u" size="sm" />
                  <div>
                    <div class="font-semibold text-slate-900 dark:text-white">{{ u.full_name }}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">{{ u.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <span
                  :class="[
                    'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                    u.is_active
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  ]"
                >
                  {{ u.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-4 text-xs">
                <span v-if="u.is_verified" class="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <Check class="w-3.5 h-3.5" /> Verified
                </span>
                <span v-else class="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                  <AlertTriangle class="w-3.5 h-3.5" /> Unverified
                </span>
              </td>
              <td class="px-5 py-4">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-xs font-mono font-bold uppercase',
                    u.is_superuser
                      ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  ]"
                >
                  {{ u.is_superuser ? 'SUPERUSER' : 'USER' }}
                </span>
              </td>
              <td class="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {{ new Date(u.created_at).toLocaleDateString() }}
              </td>
              <td class="px-5 py-4 text-right space-x-2">
                <button
                  @click="handleToggleActive(u)"
                  :disabled="isUpdating"
                  :class="[
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                    u.is_active
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                  ]"
                >
                  {{ u.is_active ? 'Deactivate' : 'Activate' }}
                </button>
                <button
                  @click="handleToggleSuperuser(u)"
                  :disabled="isUpdating"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  {{ u.is_superuser ? 'Revoke Superuser' : 'Make Superuser' }}
                </button>
              </td>
            </tr>
            <tr v-if="users.length === 0 && !isLoading">
              <td colspan="6" class="px-5 py-10 text-center text-slate-400 text-sm">
                No users found matching query.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Total: <strong>{{ total }}</strong> user account(s)</span>
        <div class="flex items-center gap-2">
          <button
            :disabled="page <= 1"
            @click="page--; loadUsers()"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span>Page {{ page }} of {{ totalPages }}</span>
          <button
            :disabled="page >= totalPages"
            @click="page++; loadUsers()"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
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
          <BaseButton variant="primary" size="sm" :loading="isUpdating" @click="executeConfirm">
            Confirm Action
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
