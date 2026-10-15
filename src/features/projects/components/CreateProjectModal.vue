<script setup lang="ts">
import { ref } from 'vue'
import { projectService } from '@/features/projects/services/projectService'
import { formatApiError } from '@/services/apiClient'
import type { Project } from '@/features/projects/types/project.types'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { LucideFolderPlus, LucideX, LucideAlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  workspaceSlug: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', project: Project): void
}>()

const name = ref('')
const key = ref('')
const description = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

function close() {
  name.value = ''
  key.value = ''
  description.value = ''
  errorMessage.value = ''
  emit('update:modelValue', false)
}

function handleNameInput(val: string) {
  name.value = val
  // Automatically suggest a key from the project name if user hasn't explicitly customized key
  if (!key.value || key.value === generateKeySuggestion(name.value.slice(0, -1))) {
    key.value = generateKeySuggestion(val)
  }
}

function handleKeyInput(val: string) {
  // Enforce uppercase alphanumeric only
  key.value = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
}

function generateKeySuggestion(text: string): string {
  const words = text.trim().split(/\s+/)
  if (words.length > 1) {
    return words
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6)
  }
  return text
    .trim()
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 4)
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!name.value.trim()) {
    errorMessage.value = 'Project name is required.'
    return
  }

  const cleanKey = key.value.trim().toUpperCase()
  if (cleanKey.length < 2 || cleanKey.length > 10) {
    errorMessage.value = 'Project key must be between 2 and 10 alphanumeric characters (e.g. PROJ, CIN).'
    return
  }

  isSubmitting.value = true
  try {
    const created = await projectService.createProject(props.workspaceSlug, {
      name: name.value.trim(),
      key: cleanKey,
      description: description.value.trim() || undefined,
    })

    emit('created', created)
    close()
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div
      class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 transform transition-all animate-in fade-in zoom-in-95"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <LucideFolderPlus class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-900">
              Create New Project
            </h3>
            <p class="text-xs text-slate-500">
              Create a dedicated initiative inside this workspace
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          @click="close"
        >
          <LucideX class="w-5 h-5" />
        </button>
      </div>

      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2"
      >
        <LucideAlertCircle class="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>

      <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
        <BaseInput
          id="project-name"
          :model-value="name"
          label="Project Name"
          placeholder="e.g. Mobile Application"
          required
          @update:model-value="handleNameInput"
        />

        <BaseInput
          id="project-key"
          :model-value="key"
          label="Project Key"
          placeholder="e.g. MOB"
          hint="Short uppercase code (2-10 characters) used as task prefix"
          required
          @update:model-value="handleKeyInput"
        />

        <div>
          <label for="project-desc" class="block text-sm font-medium text-slate-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="project-desc"
            v-model="description"
            rows="3"
            class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Brief details about the goals of this project..."
          ></textarea>
        </div>

        <div class="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100">
          <BaseButton
            type="button"
            variant="outline"
            class="w-full sm:w-auto"
            @click="close"
          >
            Cancel
          </BaseButton>
          <BaseButton
            type="submit"
            class="w-full sm:w-auto"
            :loading="isSubmitting"
          >
            Create Project
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
