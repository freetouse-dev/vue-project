<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkspaceStore } from '@/stores/workspace'
import { formatApiError } from '@/services/apiClient'
import CreateWorkspaceModal from '@/features/workspaces/components/CreateWorkspaceModal.vue'
import UnderDevelopmentModal from '@/components/common/UnderDevelopmentModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  LucideBuilding2,
  LucidePlus,
  LucideArrowRight,
  LucideMoreVertical,
  LucideCalendar,
} from 'lucide-vue-next'

const router = useRouter()
const workspaceStore = useWorkspaceStore()

const showCreateModal = ref(false)
const showUnderDevModal = ref(false)
const underDevFeature = ref('')
const fetchError = ref('')

onMounted(async () => {
  try {
    await workspaceStore.fetchWorkspaces()
  } catch (err: unknown) {
    fetchError.value = formatApiError(err)
  }
})

function handleCreated(slug: string) {
  router.push({ name: 'workspace-detail', params: { slug } })
}

function triggerUnderDev(action: string) {
  underDevFeature.value = action
  showUnderDevModal.value = true
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Workspaces
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
          Select or manage the collaboration spaces you belong to
        </p>
      </div>

      <div class="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
        <StatusBadge status="implemented" label="Live API" />
        <BaseButton size="sm" class="sm:text-sm" @click="showCreateModal = true">
          <LucidePlus class="w-4 h-4" />
          <span>New Workspace</span>
        </BaseButton>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="fetchError"
      class="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center justify-between"
    >
      <span>{{ fetchError }}</span>
      <BaseButton size="sm" variant="outline" @click="workspaceStore.fetchWorkspaces()">
        Retry
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div
      v-if="workspaceStore.isLoading && workspaceStore.workspaces.length === 0"
      class="py-20 flex flex-col items-center justify-center text-slate-400 gap-3"
    >
      <LoadingSpinner size="lg" />
      <span class="text-sm">Loading workspaces from FastAPI...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="workspaceStore.workspaces.length === 0"
      class="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center max-w-lg mx-auto my-8 space-y-4"
    >
      <div class="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
        <LucideBuilding2 class="w-8 h-8" />
      </div>
      <div>
        <h3 class="text-base font-semibold text-slate-900">No workspaces yet</h3>
        <p class="text-sm text-slate-500 mt-1">
          Create your first workspace to start collaborating on projects.
        </p>
      </div>
      <BaseButton @click="showCreateModal = true">
        <LucidePlus class="w-4 h-4" />
        <span>Create Workspace</span>
      </BaseButton>
    </div>

    <!-- Workspace Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="ws in workspaceStore.workspaces"
        :key="ws.id"
        class="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col justify-between group"
      >
        <div>
          <!-- Card Header -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                {{ ws.name.slice(0, 2).toUpperCase() }}
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {{ ws.name }}
                </h3>
                <span class="text-xs font-mono text-slate-400">
                  /{{ ws.slug }}
                </span>
              </div>
            </div>

            <!-- More / Quick Options (Triggers Under Development for unbuilt APIs) -->
            <button
              type="button"
              class="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              title="Workspace Options"
              @click="triggerUnderDev('Workspace Settings & Deletion')"
            >
              <LucideMoreVertical class="w-4 h-4" />
            </button>
          </div>

          <!-- Description -->
          <p class="mt-3 text-sm text-slate-600 line-clamp-2 min-h-10">
            {{ ws.description || 'No description provided for this workspace.' }}
          </p>
        </div>

        <!-- Card Footer -->
        <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div class="flex items-center gap-1.5">
            <LucideCalendar class="w-3.5 h-3.5 text-slate-400" />
            <span>{{ formatDate(ws.created_at) }}</span>
          </div>

          <router-link
            :to="{ name: 'workspace-detail', params: { slug: ws.slug } }"
            class="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <span>Open</span>
            <LucideArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateWorkspaceModal
      v-model="showCreateModal"
      @created="handleCreated"
    />

    <UnderDevelopmentModal
      v-model="showUnderDevModal"
      :feature-name="underDevFeature"
      description="Updating and deleting workspaces is currently under development in the FastAPI backend. These actions will be unlocked when the backend endpoints are exposed."
    />
  </div>
</template>
