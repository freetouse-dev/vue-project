<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme, type ThemeMode } from '@/composables/useTheme'
import {
  LucideSun,
  LucideMoon,
  LucideLaptop,
  LucideCheck,
} from 'lucide-vue-next'

const { theme, setTheme } = useTheme()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

function handleSelect(mode: ThemeMode) {
  setTheme(mode)
  closeMenu()
}

function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    closeMenu()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div ref="menuRef" class="relative inline-block text-left">
    <!-- Trigger Button -->
    <button
      type="button"
      class="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer flex items-center justify-center"
      :title="`Current theme: ${theme}. Click to change.`"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @click="toggleMenu"
    >
      <LucideSun v-if="theme === 'light'" class="w-4 h-4 text-amber-500" />
      <LucideMoon v-else-if="theme === 'dark'" class="w-4 h-4 text-indigo-400" />
      <LucideLaptop v-else class="w-4 h-4 text-slate-500 dark:text-slate-400" />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
      role="menu"
    >
      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
        role="menuitem"
        @click="handleSelect('light')"
      >
        <span class="flex items-center gap-2">
          <LucideSun class="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </span>
        <LucideCheck v-if="theme === 'light'" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      </button>

      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
        role="menuitem"
        @click="handleSelect('dark')"
      >
        <span class="flex items-center gap-2">
          <LucideMoon class="w-3.5 h-3.5 text-indigo-400" />
          <span>Dark</span>
        </span>
        <LucideCheck v-if="theme === 'dark'" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      </button>

      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
        role="menuitem"
        @click="handleSelect('system')"
      >
        <span class="flex items-center gap-2">
          <LucideLaptop class="w-3.5 h-3.5 text-slate-400" />
          <span>System</span>
        </span>
        <LucideCheck v-if="theme === 'system'" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      </button>
    </div>
  </div>
</template>
