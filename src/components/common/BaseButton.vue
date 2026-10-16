<script setup lang="ts">
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    type: 'button',
  }
)

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-slate-400 dark:focus:ring-slate-600'
    case 'danger':
      return 'bg-rose-600 dark:bg-rose-600 text-white hover:bg-rose-700 dark:hover:bg-rose-700 focus:ring-rose-500 shadow-xs'
    case 'outline':
      return 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-indigo-500'
    case 'ghost':
      return 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:ring-slate-300'
    case 'primary':
    default:
      return 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-xs'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-2.5 py-1.5 text-xs rounded-md gap-1.5'
    case 'lg':
      return 'px-5 py-2.5 text-base rounded-lg gap-2.5'
    case 'md':
    default:
      return 'px-4 py-2 text-sm rounded-lg gap-2'
  }
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    :class="[variantClasses, sizeClasses]"
  >
    <LoadingSpinner
      v-if="loading"
      size="sm"
      :color="variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-slate-600'"
    />
    <slot />
  </button>
</template>
