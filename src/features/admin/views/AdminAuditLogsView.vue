<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
} from 'lucide-vue-next'
import BaseButton from '@/components/common/BaseButton.vue'
import { adminService } from '@/features/admin/services/adminService'
import type { AuditLog } from '@/features/admin/types/admin.types'

const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

const logs = ref<AuditLog[]>([])
const actionFilter = ref('')
const resourceFilter = ref('')
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)

// Details modal state
const selectedLog = ref<AuditLog | null>(null)
const detailsModalOpen = ref(false)

async function loadAuditLogs() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await adminService.getAuditLogs({
      page: page.value,
      size: 20,
      action: actionFilter.value.trim() || undefined,
      resource_type: resourceFilter.value.trim() || undefined,
    })
    logs.value = res.items
    total.value = res.total
    totalPages.value = res.pages || 1
  } catch (err: any) {
    errorMessage.value = err.response?.data?.detail || 'Failed to load audit logs'
  } finally {
    isLoading.value = false
  }
}

function openDetails(log: AuditLog) {
  selectedLog.value = log
  detailsModalOpen.value = true
}

onMounted(() => {
  loadAuditLogs()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
          <FileText class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Security & Audit Logs</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Immutable platform audit trail tracking administrative actions, soft-deletions, and security events.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <BaseButton variant="outline" size="sm" :loading="isLoading" @click="loadAuditLogs">
          <RefreshCw class="w-4 h-4 mr-1.5" />
          Refresh
        </BaseButton>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="errorMessage" class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="errorMessage = null" class="hover:opacity-75"><X class="w-4 h-4" /></button>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-col sm:flex-row gap-3">
      <input
        v-model="actionFilter"
        type="text"
        placeholder="Filter by action (e.g. WORKSPACE_DELETED, USER_CREATED)..."
        @input="page = 1; loadAuditLogs()"
        class="px-3.5 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
      />
      <input
        v-model="resourceFilter"
        type="text"
        placeholder="Filter by resource type (WORKSPACE, PROJECT, USER)..."
        @input="page = 1; loadAuditLogs()"
        class="px-3.5 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
      />
    </div>

    <!-- Audit Logs Table -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
            <tr>
              <th class="px-5 py-3.5">Timestamp</th>
              <th class="px-5 py-3.5">Action</th>
              <th class="px-5 py-3.5">Resource</th>
              <th class="px-5 py-3.5">Actor</th>
              <th class="px-5 py-3.5">Details</th>
              <th class="px-5 py-3.5 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {{ new Date(log.created_at).toLocaleString() }}
              </td>
              <td class="px-5 py-4">
                <span class="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {{ log.action }}
                </span>
              </td>
              <td class="px-5 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                {{ log.resource_type }}:{{ log.resource_id }}
              </td>
              <td class="px-5 py-4 text-xs text-slate-600 dark:text-slate-400">
                {{ log.actor?.email || `User #${log.actor_id}` }}
              </td>
              <td class="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" :title="log.details || ''">
                {{ log.details || '-' }}
              </td>
              <td class="px-5 py-4 text-right">
                <button
                  @click="openDetails(log)"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                  title="View full event details"
                >
                  <Eye class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <tr v-if="logs.length === 0 && !isLoading">
              <td colspan="6" class="px-5 py-10 text-center text-slate-400 text-sm">
                No audit log records found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Total: <strong>{{ total }}</strong> event(s) logged</span>
        <div class="flex items-center gap-2">
          <button
            :disabled="page <= 1"
            @click="page--; loadAuditLogs()"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span>Page {{ page }} of {{ totalPages }}</span>
          <button
            :disabled="page >= totalPages"
            @click="page++; loadAuditLogs()"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Event Detail Modal -->
    <div
      v-if="detailsModalOpen && selectedLog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="w-full max-w-xl p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <FileText class="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Audit Event Details</h3>
          </div>
          <button @click="detailsModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span class="text-slate-400 block mb-0.5">Event Action</span>
              <span class="font-mono font-bold text-purple-600 dark:text-purple-400">{{ selectedLog.action }}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span class="text-slate-400 block mb-0.5">Target Resource</span>
              <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{{ selectedLog.resource_type }}:{{ selectedLog.resource_id }}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span class="text-slate-400 block mb-0.5">Actor</span>
              <span class="font-medium text-slate-800 dark:text-slate-200">{{ selectedLog.actor?.email || `User #${selectedLog.actor_id}` }}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span class="text-slate-400 block mb-0.5">Timestamp</span>
              <span class="text-slate-800 dark:text-slate-200">{{ new Date(selectedLog.created_at).toLocaleString() }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span class="text-slate-400 block">Payload / Details Payload</span>
            <pre class="font-mono text-[11px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">{{ selectedLog.details || 'None provided' }}</pre>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <BaseButton variant="outline" size="sm" @click="detailsModalOpen = false">Close</BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
