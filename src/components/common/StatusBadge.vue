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
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        text: props.label || 'Active',
      }
    case 'partial':
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        text: props.label || 'Partial',
      }
    case 'under_development':
    default:
      return {
        badge: 'bg-sky-50 text-sky-700 border-sky-200',
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
