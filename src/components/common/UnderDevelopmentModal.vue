<script setup lang="ts">
import { LucideConstruction, LucideX } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    featureName?: string
    description?: string
  }>(),
  {
    title: 'Feature Under Development',
    featureName: 'This feature',
    description:
      'This feature is currently under development on the backend and is not available yet. It will be enabled once the corresponding functionality has been implemented.',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function close() {
  emit('update:modelValue', false)
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
      class="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 transform transition-all animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 sm:p-2.5 bg-amber-100 text-amber-600 rounded-lg shrink-0">
            <LucideConstruction class="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-semibold text-slate-900">
              {{ title }}
            </h3>
            <p v-if="featureName" class="text-xs text-amber-700 font-medium mt-0.5">
              {{ featureName }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          @click="close"
        >
          <LucideX class="w-5 h-5" />
          <span class="sr-only">Close</span>
        </button>
      </div>

      <div class="mt-4">
        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {{ description }}
        </p>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
          @click="close"
        >
          Understood
        </button>
      </div>
    </div>
  </div>
</template>
