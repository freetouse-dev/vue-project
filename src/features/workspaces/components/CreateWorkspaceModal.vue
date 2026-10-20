<script setup lang="ts">
import { ref } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { formatApiError } from '@/services/apiClient'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { LucideBuilding2, LucideX, LucideAlertCircle } from 'lucide-vue-next'
import { useNotification } from '@/composables/useNotification'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', slug: string): void
}>()

const workspaceStore = useWorkspaceStore()
const notify = useNotification()

const name = ref('')
const slug = ref('')
const description = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

function close() {
  name.value = ''
  slug.value = ''
  description.value = ''
  errorMessage.value = ''
  emit('update:modelValue', false)
}

function handleNameInput(val: string) {
  name.value = val
  // Auto-generate suggested slug if user hasn't explicitly entered one
  if (!slug.value || slug.value === generateSlug(name.value.slice(0, -1))) {
    slug.value = generateSlug(val)
  }
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!name.value.trim()) {
    errorMessage.value = 'Workspace name is required.'
    return
  }

  isSubmitting.value = true
  try {
    const created = await workspaceStore.createWorkspace({
      name: name.value.trim(),
      slug: slug.value.trim() ? slug.value.trim() : undefined,
      description: description.value.trim() || undefined,
    })

    notify.success(`Workspace "${created.name}" created successfully.`)
    emit('created', created.slug)
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
    v-if="modelValue"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all animate-in fade-in zoom-in-95"
    >
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <LucideBuilding2 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              Create New Workspace
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              A shared space for team projects and collaboration
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

      <div
        v-if="errorMessage"
        class="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2"
      >
        <LucideAlertCircle class="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>

      <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
        <BaseInput
          id="ws-name"
          :model-value="name"
          label="Workspace Name"
          placeholder="e.g. Acme Corporation"
          required
          @update:model-value="handleNameInput"
        />

        <BaseInput
          id="ws-slug"
          v-model="slug"
          label="Custom URL Slug (Optional)"
          placeholder="e.g. acme-corp"
          hint="Lowercase alphanumeric characters and hyphens only"
        />

        <div>
          <label for="ws-desc" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="ws-desc"
            v-model="description"
            rows="3"
            class="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Brief overview of what this workspace is used for..."
          ></textarea>
        </div>

        <div class="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
            Create Workspace
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
