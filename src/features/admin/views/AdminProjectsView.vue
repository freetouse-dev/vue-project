<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  FolderKanban,
  Search,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Check,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-vue-next'
import BaseButton from '@/components/common/BaseButton.vue'
import { adminService } from '@/features/admin/services/adminService'
import type { Project } from '@/features/projects/types/project.types'

const isLoading = ref(true)
const isOperating = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const projects = ref<Project[]>([])
const search = ref('')
const includeDeleted = ref(true)

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

async function loadProjects() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const list = await adminService.getProjects(includeDeleted.value)
    projects.value = list
  } catch (err: any) {
    showNotice(err.response?.data?.detail || 'Failed to load projects', true)
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

function handleSoftDelete(proj: Project) {
  openConfirm(
    `Confirm Project Soft-Delete: ${proj.name}`,
    `Are you sure you want to soft-delete project "${proj.name}" [${proj.key}]? Its tasks will be hidden from regular views.`,
    async () => {
      await adminService.deleteProject(proj.id)
      showNotice(`Project "${proj.name}" soft-deleted successfully.`)
      await loadProjects()
    }
  )
}

function handleRestore(proj: Project) {
  openConfirm(
    `Restore Project: ${proj.name}`,
    `This will restore project "${proj.name}" [${proj.key}]. Note: Its parent workspace must be active, otherwise restoration will be rejected by backend RBAC validation.`,
    async () => {
      await adminService.restoreProject(proj.id)
      showNotice(`Project "${proj.name}" restored successfully.`)
      await loadProjects()
    }
  )
}

const filteredProjects = () => {
  const query = search.value.toLowerCase().trim()
  if (!query) return projects.value
  return projects.value.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.key.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
  )
}

onMounted(() => {
  loadProjects()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
          <FolderKanban class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Project Management</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Platform-wide project oversight, task count inspection, soft-delete and hierarchical restoration.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <BaseButton variant="outline" size="sm" :loading="isLoading" @click="loadProjects">
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
          placeholder="Filter by project name or key..."
          class="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-900 dark:text-white"
        />
      </div>

      <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
        <input
          type="checkbox"
          v-model="includeDeleted"
          @change="loadProjects"
          class="rounded text-purple-600 focus:ring-purple-500"
        />
        <span>Include Soft-Deleted Projects</span>
      </label>
    </div>

    <!-- Projects Table -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
            <tr>
              <th class="px-5 py-3.5">Key</th>
              <th class="px-5 py-3.5">Project Name</th>
              <th class="px-5 py-3.5">Workspace</th>
              <th class="px-5 py-3.5">Lifecycle State</th>
              <th class="px-5 py-3.5">Created</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="p in filteredProjects()" :key="p.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-5 py-4 font-mono font-bold text-xs text-purple-700 dark:text-purple-300">
                {{ p.key }}
              </td>
              <td class="px-5 py-4">
                <div class="font-semibold text-slate-900 dark:text-white">{{ p.name }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {{ p.description || 'No description provided' }}
                </div>
              </td>
              <td class="px-5 py-4 text-xs text-slate-600 dark:text-slate-400">
                Workspace #{{ p.workspace_id }}
              </td>
              <td class="px-5 py-4">
                <div v-if="p.deleted_at" class="space-y-1">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    SOFT-DELETED
                  </span>
                  <div class="text-[11px] text-slate-400">
                    {{ new Date(p.deleted_at).toLocaleDateString() }}
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
                {{ new Date(p.created_at).toLocaleDateString() }}
              </td>
              <td class="px-5 py-4 text-right space-x-2">
                <!-- Soft Delete Action -->
                <button
                  v-if="!p.deleted_at"
                  @click="handleSoftDelete(p)"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="Soft-delete project"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span>Soft-Delete</span>
                </button>

                <!-- Restore Action -->
                <button
                  v-else
                  @click="handleRestore(p)"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="Restore project"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </td>
            </tr>
            <tr v-if="filteredProjects().length === 0 && !isLoading">
              <td colspan="6" class="px-5 py-10 text-center text-slate-400 text-sm">
                No projects found matching query.
              </td>
            </tr>
          </tbody>
        </table>
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
