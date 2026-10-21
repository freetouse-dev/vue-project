<script setup lang="ts">
import { ref } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { companyService } from '@/features/company/services/companyService'
import { formatApiError } from '@/services/apiClient'
import BaseButton from '@/components/common/BaseButton.vue'
import { LucideBuilding2, LucideX, LucideAlertCircle } from 'lucide-vue-next'
import { useNotification } from '@/composables/useNotification'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submitted'): void
}>()

const companyStore = useCompanyStore()
const { success, error: notifyError } = useNotification()

const reason = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

function close() {
  reason.value = ''
  errorMessage.value = ''
  emit('update:modelValue', false)
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!companyStore.activeCompany) {
    errorMessage.value = 'No active organization selected.'
    return
  }

  isSubmitting.value = true
  try {
    await companyService.createWorkspaceRequest(companyStore.activeCompany.slug, {
      request_type: 'CREATE_WORKSPACE',
      reason: reason.value.trim() || undefined,
    })
    success('Workspace creation request submitted to company administrators.')
    emit('submitted')
    close()
  } catch (err: unknown) {
    const msg = formatApiError(err)
    errorMessage.value = msg
    notifyError(msg)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-4 sm:p-6 space-y-4"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <LucideBuilding2 class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Request Workspace Permission
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Ask {{ companyStore.activeCompany?.name || 'Company' }} administrators for permission to create a workspace
            </p>
          </div>
        </div>
        <button
          type="button"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          @click="close"
        >
          <LucideX class="w-5 h-5" />
        </button>
      </div>

      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
      >
        <LucideAlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reason / Proposed Purpose
          </label>
          <textarea
            v-model="reason"
            rows="3"
            placeholder="e.g. Setting up a dedicated workspace for the Frontend Modernization project..."
            class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            class="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            @click="close"
          >
            Cancel
          </button>
          <BaseButton type="submit" variant="primary" size="sm" :loading="isSubmitting">
            Submit Request
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
