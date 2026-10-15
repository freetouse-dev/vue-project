<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import UnderDevelopmentModal from '@/components/common/UnderDevelopmentModal.vue'
import {
  LucideFolderKanban,
  LucidePlus,
  LucideCheckCircle2,
  LucideClock,
  LucideCode,
} from 'lucide-vue-next'

const showModal = ref(false)
const modalFeature = ref('')

function openModal(feature: string) {
  modalFeature.value = feature
  showModal.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Projects
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
          Organize, plan, and track team initiatives
        </p>
      </div>

      <div class="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
        <StatusBadge status="under_development" label="In Progress" />
        <BaseButton size="sm" class="sm:text-sm" @click="openModal('Create Project API')">
          <LucidePlus class="w-4 h-4" />
          <span>New Project</span>
        </BaseButton>
      </div>
    </div>

    <!-- Feature Status Explanation Card -->
    <div class="bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 rounded-2xl border border-indigo-100 p-5 sm:p-8 shadow-xs">
      <div class="max-w-3xl space-y-4">
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
          <LucideFolderKanban class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <h2 class="text-lg sm:text-xl font-bold text-slate-900">
          Projects Module — Ready for Backend Integration
        </h2>

        <p class="text-sm text-slate-600 leading-relaxed">
          The frontend layout and architecture are set up and awaiting the project endpoints in your FastAPI backend. In accordance with your project requirements, we do not simulate fake data or call non-existent endpoints.
        </p>

        <!-- Current Implementation Matrix -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div class="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <div class="flex items-center gap-2 font-semibold text-sm text-slate-800">
              <LucideCheckCircle2 class="w-4 h-4 text-emerald-500" />
              <span>Backend Ready Components</span>
            </div>
            <ul class="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Project SQL Model (<code class="text-slate-700 font-mono">models/project.py</code>)</li>
              <li>Pydantic Schemas (<code class="text-slate-700 font-mono">schemas/project.py</code>)</li>
              <li>Project CRUD helpers (<code class="text-slate-700 font-mono">crud/project.py</code>)</li>
            </ul>
          </div>

          <div class="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <div class="flex items-center gap-2 font-semibold text-sm text-slate-800">
              <LucideClock class="w-4 h-4 text-amber-500" />
              <span>Next Backend Steps</span>
            </div>
            <ul class="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Create Project API endpoints router (<code class="text-slate-700 font-mono">endpoints/projects.py</code>)</li>
              <li>Register projects router in <code class="text-slate-700 font-mono">api/v1/api.py</code></li>
              <li>Request frontend update once backend endpoints are completed!</li>
            </ul>
          </div>
        </div>

        <div class="pt-2 flex items-center gap-3">
          <BaseButton variant="outline" size="sm" @click="openModal('Project Endpoints Details')">
            <LucideCode class="w-4 h-4" />
            <span>View Architecture Notice</span>
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Reusable Modal -->
    <UnderDevelopmentModal
      v-model="showModal"
      :feature-name="modalFeature"
      description="The Project REST endpoints are currently being built in the FastAPI backend. Once you expose the router and request an update, this page will be fully connected to live project CRUD operations."
    />
  </div>
</template>
