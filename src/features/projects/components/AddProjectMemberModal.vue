<script setup lang="ts">
import { ref } from 'vue'
import { projectService } from '@/features/projects/services/projectService'
import { formatApiError } from '@/services/apiClient'
import type { ProjectRole } from '@/features/projects/types/project.types'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { LucideUserPlus, LucideX, LucideAlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  workspaceSlug: string
  projectKey: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'member-added'): void
}>()

const email = ref('')
const role = ref<ProjectRole>('CONTRIBUTOR')
const errorMessage = ref('')
const isSubmitting = ref(false)

function close() {
  email.value = ''
  role.value = 'CONTRIBUTOR'
  errorMessage.value = ''
  emit('update:modelValue', false)
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!email.value.trim()) {
    errorMessage.value = 'User email is required.'
    return
  }

  isSubmitting.value = true
  try {
    await projectService.addProjectMember(props.workspaceSlug, props.projectKey, {
      email: email.value.trim(),
      role: role.value,
    })

    emit('member-added')
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
      class="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 transform transition-all animate-in fade-in zoom-in-95"
    >
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <LucideUserPlus class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-900">
              Add Member to Project
            </h3>
            <p class="text-xs text-slate-500">
              Assign an existing workspace member to this project
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

      <div
        v-if="errorMessage"
        class="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2"
      >
        <LucideAlertCircle class="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>

      <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
        <BaseInput
          id="project-member-email"
          v-model="email"
          type="email"
          label="Member Email"
          placeholder="colleague@example.com"
          hint="Must already be a member of the workspace"
          required
        />

        <div>
          <label for="project-member-role" class="block text-sm font-medium text-slate-700 mb-1">
            Project Role
          </label>
          <select
            id="project-member-role"
            v-model="role"
            class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="CONTRIBUTOR">Contributor (Can view and create tasks)</option>
            <option value="VIEWER">Viewer (Read-only access to project)</option>
            <option value="PROJECT_LEAD">Project Lead (Manage members and tasks)</option>
          </select>
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
            Assign Member
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
