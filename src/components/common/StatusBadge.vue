<script setup lang="ts">
import { computed } from 'vue'
import type { FeatureStatus } from '@/types/api.types'

const props = withDefaults(
  defineProps<{
    status?: FeatureStatus
    label?: string
  }>(),
  {
    status: 'implemented',
  }
)

const badgeStyles = computed(() => {
  switch (props.status) {
    case 'implemented':
      return {
        badge: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        text: props.label || 'Active',
      }
    case 'partial':
      return {
        badge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        text: props.label || 'Partial',
      }
    case 'under_development':
    default:
      return {
        badge: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        dot: 'bg-sky-500',
        text: props.label || 'Under Development',
      }
  }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
    :class="badgeStyles.badge"
  >
    <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="badgeStyles.dot"></span>
    <span>{{ badgeStyles.text }}</span>
  </span>
</template>
