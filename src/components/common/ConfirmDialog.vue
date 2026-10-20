<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import {
  LucideAlertTriangle,
  LucideAlertCircle,
  LucideInfo,
  LucideX,
} from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    message: string
    details?: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'primary'
    loading?: boolean
  }>(),
  {
    details: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    loading: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function close() {
  if (props.loading) return
  emit('update:modelValue', false)
  emit('cancel')
}

function handleConfirm() {
  emit('confirm')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue && !props.loading) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function getVariantConfig() {
  switch (props.variant) {
    case 'danger':
      return {
        icon: LucideAlertCircle,
        iconBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
        buttonVariant: 'danger' as const,
      }
    case 'warning':
      return {
        icon: LucideAlertTriangle,
        iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
        buttonVariant: 'primary' as const,
      }
    case 'primary':
    default:
      return {
        icon: LucideInfo,
        iconBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
        buttonVariant: 'primary' as const,
      }
  }
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-dialog-title"
    @click.self="close"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all animate-in fade-in zoom-in-95 duration-150 space-y-4"
    >
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div
            class="p-2.5 rounded-xl shrink-0"
            :class="getVariantConfig().iconBg"
          >
            <component :is="getVariantConfig().icon" class="w-5 h-5" />
          </div>
          <div>
            <h3
              id="confirm-dialog-title"
              class="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
            >
              {{ title }}
            </h3>
          </div>
        </div>
        <button
          type="button"
          :disabled="loading"
          class="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          @click="close"
        >
          <LucideX class="w-5 h-5" />
          <span class="sr-only">Close</span>
        </button>
      </div>

      <div class="space-y-2">
        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {{ message }}
        </p>

        <div
          v-if="details"
          class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300"
        >
          {{ details }}
        </div>
      </div>

      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
        <BaseButton
          type="button"
          variant="outline"
          size="sm"
          class="w-full sm:w-auto"
          :disabled="loading"
          @click="close"
        >
          {{ cancelText }}
        </BaseButton>

        <BaseButton
          type="button"
          :variant="getVariantConfig().buttonVariant"
          size="sm"
          class="w-full sm:w-auto"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
