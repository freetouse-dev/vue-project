<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Users,
  Layers,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Shield,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  Activity,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { adminService } from '@/features/admin/services/adminService'
import type { AdminStats, AuditLog } from '@/features/admin/types/admin.types'

const router = useRouter()
const isLoading = ref(true)
const stats = ref<AdminStats | null>(null)
const recentLogs = ref<AuditLog[]>([])
const error = ref<string | null>(null)

async function loadData() {
  isLoading.value = true
  error.value = null
  try {
    const [statsRes, logsRes] = await Promise.all([
      adminService.getStats(),
      adminService.getAuditLogs({ page: 1, size: 6 }),
    ])
    stats.value = statsRes
    recentLogs.value = logsRes.items
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Failed to load platform data'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">System Overview</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          High-level operational metrics, platform health, and security event overview.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <BaseButton variant="outline" size="sm" :loading="isLoading" @click="loadData">
          <RefreshCw class="w-4 h-4 mr-1.5" />
          Refresh Metrics
        </BaseButton>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ error }}</span>
      </div>
      <BaseButton variant="ghost" size="sm" @click="loadData">Try Again</BaseButton>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !stats" class="py-20 flex justify-center">
      <LoadingSpinner />
    </div>

    <template v-else-if="stats">
      <!-- KPI Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Users Card -->
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Users</span>
            <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users class="w-4 h-4" />
            </div>
          </div>
          <div class="text-3xl font-extrabold text-slate-900 dark:text-white">{{ stats.total_users }}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ stats.active_users }} active</span>
            <span>•</span>
            <span class="text-amber-600 dark:text-amber-400">{{ stats.unverified_users }} unverified</span>
          </div>
        </div>

        <!-- Workspaces Card -->
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Workspaces</span>
            <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Layers class="w-4 h-4" />
            </div>
          </div>
          <div class="text-3xl font-extrabold text-slate-900 dark:text-white">{{ stats.total_workspaces }}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 pt-1">
            Multi-tenant organizational boundaries
          </div>
        </div>

        <!-- Projects Card -->
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Projects</span>
            <div class="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <FolderKanban class="w-4 h-4" />
            </div>
          </div>
          <div class="text-3xl font-extrabold text-slate-900 dark:text-white">{{ stats.total_projects }}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 pt-1">
            Active workspaces deliverables
          </div>
        </div>

        <!-- Tasks & Comments Card -->
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tasks & Activity</span>
            <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckSquare class="w-4 h-4" />
            </div>
          </div>
          <div class="text-3xl font-extrabold text-slate-900 dark:text-white">{{ stats.total_tasks }}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
            <MessageSquare class="w-3.5 h-3.5 text-slate-400" />
            <span>{{ stats.total_comments }} discussion comments</span>
          </div>
        </div>
      </div>

      <!-- Quick Administration Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          @click="router.push('/admin/users')"
          class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all cursor-pointer group space-y-2 shadow-2xs"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
              <Users class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>User Governance</span>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Activate, deactivate, promote superusers, and prevent platform lockout.
          </p>
        </div>

        <div
          @click="router.push('/admin/workspaces')"
          class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all cursor-pointer group space-y-2 shadow-2xs"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
              <Layers class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Workspace Oversight</span>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Soft-delete, restore, and inspect all platform workspace organizations.
          </p>
        </div>

        <div
          @click="router.push('/admin/roles')"
          class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all cursor-pointer group space-y-2 shadow-2xs"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
              <Shield class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>RBAC Matrix</span>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Inspect role hierarchy, permission assignments, and access policies.
          </p>
        </div>
      </div>

      <!-- Recent Audit Trail Section -->
      <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Activity class="w-4 h-4" />
            </div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">
              Recent Security & System Events
            </h2>
          </div>
          <router-link
            to="/admin/audit-logs"
            class="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({{ stats.total_audit_logs }})</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th class="px-4 py-3 rounded-l-lg">Timestamp</th>
                <th class="px-4 py-3">Action</th>
                <th class="px-4 py-3">Target Resource</th>
                <th class="px-4 py-3">Actor</th>
                <th class="px-4 py-3 rounded-r-lg">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="log in recentLogs" :key="log.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {{ new Date(log.created_at).toLocaleString() }}
                </td>
                <td class="px-4 py-3 font-medium">
                  <span class="px-2 py-0.5 rounded text-xs font-mono bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                    {{ log.action }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs font-mono text-slate-700 dark:text-slate-300">
                  {{ log.resource_type }}:{{ log.resource_id }}
                </td>
                <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                  {{ log.actor?.email || `User #${log.actor_id}` }}
                </td>
                <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" :title="log.details || ''">
                  {{ log.details || '-' }}
                </td>
              </tr>
              <tr v-if="recentLogs.length === 0">
                <td colspan="5" class="px-4 py-8 text-center text-slate-400 text-xs">
                  No audit log entries recorded yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
