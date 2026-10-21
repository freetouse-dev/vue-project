<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { adminService } from '@/features/admin/services/adminService'
import type { CompanyCreationRequest } from '@/features/company/types/company.types'

const isLoading = ref(true)
const isOperating = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const requests = ref<CompanyCreationRequest[]>([])
const statusFilter = ref('PENDING')

// Rejection modal
const rejectModalOpen = ref(false)
const selectedRequest = ref<CompanyCreationRequest | null>(null)
const rejectionReason = ref('')

// Confirmation modal (for approval)
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

async function loadRequests() {
  isLoading.value = true
  try {
    requests.value = await adminService.getCompanyRequests(statusFilter.value || undefined)
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to fetch company requests.', true)
  } finally {
    isLoading.value = false
  }
}

function promptApprove(req: CompanyCreationRequest) {
  confirmTitle.value = 'Approve Organization Creation'
  confirmMessage.value = `Approve organization "${req.company_name}" (slug: ${req.company_slug})? This will create the organization and assign ${req.requester?.full_name || req.requester?.email || 'the user'} as Organization Owner.`
  confirmCallback.value = async () => {
    isOperating.value = true
    try {
      await adminService.approveCompanyRequest(req.id)
      showNotice(`Organization "${req.company_name}" successfully created and approved!`)
      await loadRequests()
    } catch (err: any) {
      showNotice(err.response?.data?.detail || 'Failed to approve request.', true)
    } finally {
      isOperating.value = false
      confirmOpen.value = false
    }
  }
  confirmOpen.value = true
}

function openRejectModal(req: CompanyCreationRequest) {
  selectedRequest.value = req
  rejectionReason.value = ''
  rejectModalOpen.value = true
}

async function handleReject() {
  if (!selectedRequest.value) return
  isOperating.value = true
  try {
    await adminService.rejectCompanyRequest(selectedRequest.value.id, rejectionReason.value.trim() || undefined)
    showNotice(`Organization request for "${selectedRequest.value.company_name}" rejected.`)
    rejectModalOpen.value = false
    await loadRequests()
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to reject request.', true)
  } finally {
    isOperating.value = false
  }
}

onMounted(() => {
  loadRequests()
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
          <UserCheck class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <span>Organization Creation Requests</span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review and approve registered users requesting new tenant organization provisioning.
        </p>
      </div>

      <button
        type="button"
        class="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        @click="loadRequests"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
        <span>Refresh</span>
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap gap-3 items-center">
      <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          :class="statusFilter === 'PENDING'
            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
          @click="statusFilter = 'PENDING'; loadRequests()"
        >
          Pending Review
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          :class="statusFilter === 'APPROVED'
            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
          @click="statusFilter = 'APPROVED'; loadRequests()"
        >
          Approved
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          :class="statusFilter === 'REJECTED'
            ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
          @click="statusFilter = 'REJECTED'; loadRequests()"
        >
          Rejected
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          :class="statusFilter === ''
            ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
          @click="statusFilter = ''; loadRequests()"
        >
          All Requests
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Requests Table -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-3 px-4">Proposed Organization</th>
              <th class="py-3 px-4">Requester</th>
              <th class="py-3 px-4">Description</th>
              <th class="py-3 px-4">Submitted At</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="req in requests" :key="req.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {{ req.company_name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {{ req.company_name }}
                    </p>
                    <p class="text-xs font-mono text-slate-400">slug: {{ req.company_slug }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <p class="font-medium text-slate-800 dark:text-slate-200">{{ req.requester?.full_name || 'User' }}</p>
                <p class="text-xs text-slate-400">{{ req.requester?.email }}</p>
              </td>
              <td class="py-3 px-4 max-w-xs">
                <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {{ req.business_description || 'None provided' }}
                </p>
                <p v-if="req.rejection_reason" class="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
                  Reason: {{ req.rejection_reason }}
                </p>
              </td>
              <td class="py-3 px-4 text-xs text-slate-500">
                {{ new Date(req.created_at).toLocaleDateString() }}
              </td>
              <td class="py-3 px-4">
                <span
                  v-if="req.status === 'PENDING'"
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                >
                  <Clock class="w-3 h-3" />
                  <span>Pending</span>
                </span>
                <span
                  v-else-if="req.status === 'APPROVED'"
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  <CheckCircle2 class="w-3 h-3" />
                  <span>Approved</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                >
                  <XCircle class="w-3 h-3" />
                  <span>Rejected</span>
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <div v-if="req.status === 'PENDING'" class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    class="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                    @click="promptApprove(req)"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    class="px-2.5 py-1 text-xs font-bold rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors border border-red-200 dark:border-red-800 cursor-pointer"
                    @click="openRejectModal(req)"
                  >
                    Reject
                  </button>
                </div>
                <span v-else class="text-xs text-slate-400 italic">Completed</span>
              </td>
            </tr>

            <tr v-if="requests.length === 0">
              <td colspan="6" class="py-8 text-center text-slate-400">
                No organization requests found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirm Approval Modal -->
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
            Approve & Create
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div
      v-if="rejectModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">Reject Organization Request</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Provide an optional reason explaining why "{{ selectedRequest?.company_name }}" was not approved.
        </p>

        <form @submit.prevent="handleReject" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rejection Reason
            </label>
            <textarea
              v-model="rejectionReason"
              rows="3"
              placeholder="e.g. Duplicate organization, invalid company domain, or missing contact details..."
              class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              @click="rejectModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isOperating"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
