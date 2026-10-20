<script setup lang="ts">
import { ref, watch } from 'vue'
import { projectService } from '@/features/projects/services/projectService'
import { formatApiError } from '@/services/apiClient'
import { useNotification } from '@/composables/useNotification'
import type { Project } from '@/features/projects/types/project.types'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { LucideEdit3, LucideX, LucideAlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  workspaceSlug: string
  project: Project | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', project: Project): void
}>()

const notify = useNotification()

const name = ref('')
const description = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

function syncFromProject() {
  if (props.project) {
    name.value = props.project.name
    description.value = props.project.description || ''
  }
  errorMessage.value = ''
}

watch(
  () => props.project,
  () => syncFromProject(),
  { immediate: true }
)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) syncFromProject()
  }
)

function close() {
  errorMessage.value = ''
  emit('update:modelValue', false)
}

async function handleSubmit() {
  if (!props.project) return
  errorMessage.value = ''

  if (!name.value.trim() || name.value.trim().length < 2) {
    errorMessage.value = 'Project name must be at least 2 characters.'
    return
  }

  isSubmitting.value = true
  try {
    const updated = await projectService.updateProject(
      props.workspaceSlug,
      props.project.key,
      {
        name: name.value.trim(),
        description: description.value.trim() || null,
      }
    )

    notify.success(`Project "${updated.name}" updated successfully.`)
    emit('updated', updated)
    close()
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
    notify.error(errorMessage.value)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="modelValue && project"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all animate-in fade-in zoom-in-95 space-y-4"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <LucideEdit3 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Edit Project Details
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Key: {{ project.key }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
          @click="close"
        >
          <LucideX class="w-5 h-5" />
        </button>
      </div>

      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2"
      >
        <LucideAlertCircle class="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <BaseInput
          id="edit-project-name"
          v-model="name"
          label="Project Name"
          placeholder="e.g. Mobile Application"
          required
        />

        <div>
          <label for="edit-project-desc" class="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="edit-project-desc"
            v-model="description"
            rows="3"
            class="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Brief details about the goals of this project..."
          ></textarea>
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
          <BaseButton
            type="button"
            variant="outline"
            size="sm"
            class="w-full sm:w-auto"
            :disabled="isSubmitting"
            @click="close"
          >
            Cancel
          </BaseButton>

          <BaseButton
            type="submit"
            size="sm"
            class="w-full sm:w-auto"
            :loading="isSubmitting"
          >
            Save Changes
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
