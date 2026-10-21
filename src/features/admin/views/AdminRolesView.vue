<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Lock,
  RefreshCw,
  AlertCircle,
  FileCode,
  Info,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { adminService, type RolesResponse } from '@/features/admin/services/adminService'

const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const rolesData = ref<RolesResponse | null>(null)

async function loadRoles() {
  isLoading.value = true
  errorMessage.value = null
  try {
    rolesData.value = await adminService.getRoles()
  } catch (err: any) {
    errorMessage.value = err.response?.data?.detail || 'Failed to load roles definition'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRoles()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
          <Lock class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Roles & Permissions (RBAC)</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Platform-wide access control policies, permission hierarchy, and security safeguards.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <BaseButton variant="outline" size="sm" :loading="isLoading" @click="loadRoles">
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
      <BaseButton variant="ghost" size="sm" @click="loadRoles">Try Again</BaseButton>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !rolesData" class="py-20 flex justify-center">
      <LoadingSpinner />
    </div>

    <template v-else-if="rolesData">
      <!-- Roles Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="r in rolesData.roles"
          :key="r.role"
          class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs flex flex-col justify-between"
        >
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span
                :class="[
                  'px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wider',
                  r.scope === 'system'
                    ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                ]"
              >
                {{ r.role }}
              </span>
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {{ r.scope }} scope
              </span>
            </div>

            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {{ r.description }}
            </p>
          </div>

          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Granted Permissions ({{ r.permissions.length }})
            </span>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="perm in r.permissions"
                :key="perm"
                class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {{ perm }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Permission Matrix Table -->
      <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
        <div class="flex items-center gap-2">
          <FileCode class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 class="text-base font-bold text-slate-900 dark:text-white">
            Permission Code Directory
          </h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th class="px-5 py-3">Permission Code</th>
                <th class="px-5 py-3">Description</th>
                <th class="px-5 py-3">Permitted Roles</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="p in rolesData.permissions" :key="p.code" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td class="px-5 py-3 font-mono text-xs font-semibold text-purple-700 dark:text-purple-300">
                  {{ p.code }}
                </td>
                <td class="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                  {{ p.description }}
                </td>
                <td class="px-5 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="roleName in p.roles"
                      :key="roleName"
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {{ roleName }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Security Policies Card -->
      <div class="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3 shadow-2xs">
        <div class="flex items-center gap-2 text-sm font-bold text-purple-900 dark:text-purple-300">
          <Info class="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Platform Security & Lockout Guarantees</span>
        </div>
        <ul class="space-y-1.5 text-xs text-purple-950/80 dark:text-purple-200/80 list-disc list-inside leading-relaxed">
          <li><strong>Superuser Safeguard:</strong> The system enforces that at least one active superuser must always exist on the platform. Any operation that attempts to deactivate or demote the last superuser will be rejected with an administrative error.</li>
          <li><strong>Superuser Separation:</strong> Superusers operating within the User Dashboard adhere strictly to tenant boundaries and only see workspaces where they are explicit members. In the Admin Dashboard, superusers possess platform-wide administrative authority.</li>
          <li><strong>Hierarchical Integrity:</strong> Soft-deleted projects cannot be restored if their parent workspace remains soft-deleted. Tasks cannot be restored if their parent project remains soft-deleted.</li>
        </ul>
      </div>
    </template>
  </div>
</template>
