<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Building2,
  Search,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Ban,
  CheckCircle2,
  Edit2,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { adminService } from '@/features/admin/services/adminService'
import type { Company } from '@/features/company/types/company.types'

const isLoading = ref(true)
const isOperating = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const companies = ref<Company[]>([])
const search = ref('')
const statusFilter = ref('')
const includeDeleted = ref(true)

// Confirmation modal state
const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmCallback = ref<(() => Promise<void>) | null>(null)

// Edit modal state
const editModalOpen = ref(false)
const editingCompany = ref<Company | null>(null)
const editName = ref('')
const editDescription = ref('')

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

async function loadCompanies() {
  isLoading.value = true
  try {
    companies.value = await adminService.getCompanies({
      search: search.value.trim() || undefined,
      status: statusFilter.value || undefined,
      include_deleted: includeDeleted.value,
    })
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to fetch companies.', true)
  } finally {
    isLoading.value = false
  }
}

function promptSuspendToggle(comp: Company) {
  const isSuspending = comp.status === 'ACTIVE'
  confirmTitle.value = isSuspending ? 'Suspend Company' : 'Reactivate Company'
  confirmMessage.value = isSuspending
    ? `Are you sure you want to suspend "${comp.name}"? All members of this company will be blocked from accessing company resources.`
    : `Reactivate "${comp.name}" to restore member access?`

  confirmCallback.value = async () => {
    isOperating.value = true
    try {
      await adminService.updateCompany(comp.id, {}, isSuspending ? 'SUSPENDED' : 'ACTIVE')
      showNotice(`Company "${comp.name}" ${isSuspending ? 'suspended' : 'reactivated'}.`)
      await loadCompanies()
    } catch (err: any) {
      showNotice(err.response?.data?.detail || 'Failed to update company status.', true)
    } finally {
      isOperating.value = false
      confirmOpen.value = false
    }
  }
  confirmOpen.value = true
}

function promptDelete(comp: Company) {
  confirmTitle.value = 'Delete Company'
  confirmMessage.value = `Are you sure you want to soft-delete "${comp.name}"? Its workspaces and data will be archived.`
  confirmCallback.value = async () => {
    isOperating.value = true
    try {
      await adminService.deleteCompany(comp.id)
      showNotice(`Company "${comp.name}" deleted.`)
      await loadCompanies()
    } catch (err: any) {
      showNotice(err.response?.data?.detail || 'Failed to delete company.', true)
    } finally {
      isOperating.value = false
      confirmOpen.value = false
    }
  }
  confirmOpen.value = true
}

function promptRestore(comp: Company) {
  confirmTitle.value = 'Restore Company'
  confirmMessage.value = `Restore company "${comp.name}" and its associated resources?`
  confirmCallback.value = async () => {
    isOperating.value = true
    try {
      await adminService.restoreCompany(comp.id)
      showNotice(`Company "${comp.name}" restored.`)
      await loadCompanies()
    } catch (err: any) {
      showNotice(err.response?.data?.detail || 'Failed to restore company.', true)
    } finally {
      isOperating.value = false
      confirmOpen.value = false
    }
  }
  confirmOpen.value = true
}

function openEditModal(comp: Company) {
  editingCompany.value = comp
  editName.value = comp.name
  editDescription.value = comp.description || ''
  editModalOpen.value = true
}

async function handleSaveEdit() {
  if (!editingCompany.value || !editName.value.trim()) return
  isOperating.value = true
  try {
    await adminService.updateCompany(editingCompany.value.id, {
      name: editName.value.trim(),
      description: editDescription.value.trim() || undefined,
    })
    showNotice(`Updated company "${editName.value}".`)
    editModalOpen.value = false
    await loadCompanies()
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to update company.', true)
  } finally {
    isOperating.value = false
  }
}

onMounted(() => {
  loadCompanies()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Notifications -->
    <div
      v-if="successMessage"
      class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <Check class="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>{{ successMessage }}</span>
      </div>
      <button @click="successMessage = null" class="text-emerald-600 hover:text-emerald-800">
        <X class="w-4 h-4" />
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <AlertTriangle class="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="errorMessage = null" class="text-red-600 hover:text-red-800">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Header & Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Building2 class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <span>Company & Tenant Management</span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Platform-wide oversight of tenant companies, member counts, and account status.
        </p>
      </div>

      <button
        type="button"
        class="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        @click="loadCompanies"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
        <span>Refresh</span>
      </button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by company name or slug..."
          class="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          @keydown.enter="loadCompanies"
        />
      </div>

      <select
        v-model="statusFilter"
        class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
        @change="loadCompanies"
      >
        <option value="">All Statuses</option>
        <option value="ACTIVE">ACTIVE</option>
        <option value="SUSPENDED">SUSPENDED</option>
      </select>

      <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none px-2 py-2">
        <input
          v-model="includeDeleted"
          type="checkbox"
          class="rounded-sm border-slate-300 text-purple-600 focus:ring-purple-500"
          @change="loadCompanies"
        />
        <span>Include Deleted</span>
      </label>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Companies Table -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-3 px-4">Organization</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Members</th>
              <th class="py-3 px-4">Workspaces</th>
              <th class="py-3 px-4">Created Date</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="comp in companies"
              :key="comp.id"
              class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              :class="{ 'opacity-60 bg-slate-50/30 dark:bg-slate-800/10': comp.deleted_at }"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {{ comp.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {{ comp.name }}
                    </p>
                    <p class="text-xs font-mono text-slate-400">{{ comp.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-1.5">
                  <span
                    v-if="comp.deleted_at"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                  >
                    Deleted
                  </span>
                  <span
                    v-else-if="comp.status === 'ACTIVE'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    Active
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  >
                    Suspended
                  </span>
                </div>
              </td>
              <td class="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                {{ comp.members_count ?? '-' }}
              </td>
              <td class="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                {{ comp.workspaces_count ?? '-' }}
              </td>
              <td class="py-3 px-4 text-slate-500 text-xs">
                {{ new Date(comp.created_at).toLocaleDateString() }}
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <!-- Edit Button -->
                  <button
                    type="button"
                    class="p-1.5 text-slate-400 hover:text-purple-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                    title="Edit Company"
                    @click="openEditModal(comp)"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>

                  <!-- Suspend / Reactivate Button -->
                  <button
                    v-if="!comp.deleted_at"
                    type="button"
                    class="p-1.5 rounded-md transition-colors cursor-pointer"
                    :class="comp.status === 'ACTIVE'
                      ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'"
                    :title="comp.status === 'ACTIVE' ? 'Suspend Company' : 'Reactivate Company'"
                    @click="promptSuspendToggle(comp)"
                  >
                    <Ban v-if="comp.status === 'ACTIVE'" class="w-4 h-4" />
                    <CheckCircle2 v-else class="w-4 h-4" />
                  </button>

                  <!-- Delete / Restore Button -->
                  <button
                    v-if="!comp.deleted_at"
                    type="button"
                    class="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Delete Company"
                    @click="promptDelete(comp)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                  <button
                    v-else
                    type="button"
                    class="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                    title="Restore Company"
                    @click="promptRestore(comp)"
                  >
                    <RotateCcw class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="companies.length === 0">
              <td colspan="6" class="py-8 text-center text-slate-400">
                No companies found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div
      v-if="confirmOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">{{ confirmTitle }}</h3>
        <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{{ confirmMessage }}</p>
        <div class="flex items-center justify-end gap-2.5">
          <button
            type="button"
            class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            @click="confirmOpen = false"
          >
            Cancel
          </button>
          <BaseButton
            type="button"
            variant="primary"
            :loading="isOperating"
            @click="confirmCallback?.()"
          >
            Confirm
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="editModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-3">Edit Company</h3>
        <form @submit.prevent="handleSaveEdit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Name
            </label>
            <input
              v-model="editName"
              type="text"
              required
              class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              v-model="editDescription"
              rows="3"
              class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              @click="editModalOpen = false"
            >
              Cancel
            </button>
            <BaseButton type="submit" variant="primary" :loading="isOperating">
              Save Changes
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
