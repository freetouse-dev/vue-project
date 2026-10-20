<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { LucideUser } from 'lucide-vue-next'

interface UserLike {
  id?: number
  full_name?: string
  name?: string
  email?: string
  avatar_url?: string | null
}

const props = withDefaults(
  defineProps<{
    user?: UserLike | null
    name?: string
    email?: string
    avatarUrl?: string | null
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    indicator?: 'online' | 'offline' | 'busy' | boolean
  }>(),
  {
    user: null,
    name: '',
    email: '',
    avatarUrl: null,
    size: 'md',
    indicator: false,
  }
)

const hasImageError = ref(false)

// Reset image error state whenever avatar URL changes
watch(
  () => props.avatarUrl || props.user?.avatar_url,
  () => {
    hasImageError.value = false
  }
)

const resolvedName = computed(() => {
  return props.name || props.user?.full_name || props.user?.name || props.email || props.user?.email || 'User'
})

const resolvedAvatarUrl = computed(() => {
  const url = props.avatarUrl || props.user?.avatar_url || null
  if (!url) return null
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000'
  const origin = apiBase.replace(/\/api\/v1\/?$/, '')
  return `${origin}${url}`
})

const initials = computed(() => {
  const parts = resolvedName.value.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return resolvedName.value.slice(0, 2).toUpperCase()
})

// Deterministic pastel color palette based on name/email hash
const colorClass = computed(() => {
  const str = resolvedName.value
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800',
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800',
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800',
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
    'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800',
  ]
  const idx = Math.abs(hash) % colors.length
  return colors[idx]
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return {
        container: 'w-5 h-5 text-[9px]',
        icon: 'w-3 h-3',
        indicator: 'w-1.5 h-1.5 right-0 bottom-0',
      }
    case 'sm':
      return {
        container: 'w-6 h-6 text-[10px]',
        icon: 'w-3.5 h-3.5',
        indicator: 'w-2 h-2 right-0 bottom-0',
      }
    case 'lg':
      return {
        container: 'w-10 h-10 text-sm font-semibold',
        icon: 'w-5 h-5',
        indicator: 'w-2.5 h-2.5 right-0.5 bottom-0.5',
      }
    case 'xl':
      return {
        container: 'w-16 h-16 text-xl font-bold',
        icon: 'w-8 h-8',
        indicator: 'w-3.5 h-3.5 right-1 bottom-1',
      }
    case 'md':
    default:
      return {
        container: 'w-8 h-8 text-xs font-semibold',
        icon: 'w-4 h-4',
        indicator: 'w-2 h-2 right-0 bottom-0',
      }
  }
})
</script>

<template>
  <div class="relative inline-flex shrink-0 select-none">
    <!-- Image Avatar -->
    <div
      v-if="resolvedAvatarUrl && !hasImageError"
      class="rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-center bg-slate-100 dark:bg-slate-800"
      :class="sizeClasses.container"
    >
      <img
        :src="resolvedAvatarUrl"
        :alt="`${resolvedName}'s profile picture`"
        class="w-full h-full object-cover"
        loading="lazy"
        @error="hasImageError = true"
      />
    </div>

    <!-- Fallback Initials / Icon -->
    <div
      v-else
      class="rounded-full border flex items-center justify-center font-bold tracking-tight shadow-2xs transition-colors"
      :class="[sizeClasses.container, colorClass]"
      :title="resolvedName"
    >
      <span v-if="initials">{{ initials }}</span>
      <LucideUser v-else :class="sizeClasses.icon" />
    </div>

    <!-- Status Indicator Dot -->
    <span
      v-if="indicator"
      class="absolute rounded-full ring-2 ring-white dark:ring-slate-900"
      :class="[
        sizeClasses.indicator,
        indicator === 'busy' ? 'bg-amber-500' : indicator === 'offline' ? 'bg-slate-400' : 'bg-emerald-500'
      ]"
    ></span>
  </div>
</template>
