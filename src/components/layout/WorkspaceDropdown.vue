<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkspaceStore } from '@/stores/workspace'
import type { Workspace } from '@/features/workspaces/types/workspace.types'
import {
  LucideChevronDown,
  LucideCheck,
  LucideBuilding2,
  LucidePlus,
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'open-create-modal'): void
}>()

const router = useRouter()
const workspaceStore = useWorkspaceStore()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const workspaces = computed(() => workspaceStore.workspaces)
const currentWorkspace = computed(() => workspaceStore.currentWorkspace)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function handleSelect(ws: Workspace) {
  workspaceStore.selectWorkspaceBySlug(ws.slug)
  closeDropdown()
  router.push({ name: 'workspace-detail', params: { slug: ws.slug } })
}

function handleCreateClick() {
  closeDropdown()
  emit('open-create-modal')
}

// Close dropdown on click outside
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

// Close on Escape key
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
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
  <div ref="dropdownRef" class="relative inline-block text-left min-w-0">
    <!-- Trigger Button -->
    <button
      type="button"
      class="flex items-center gap-1.5 sm:gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs sm:text-sm font-medium rounded-lg px-2.5 py-1.5 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer max-w-[135px] xs:max-w-[165px] sm:max-w-[220px]"
      :class="{ 'ring-2 ring-indigo-500 border-indigo-500 bg-white': isOpen }"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="toggleDropdown"
    >
      <!-- Workspace initials or icon -->
      <span
        v-if="currentWorkspace"
        class="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0"
      >
        {{ currentWorkspace.name.slice(0, 2).toUpperCase() }}
      </span>
      <LucideBuilding2 v-else class="w-4 h-4 text-slate-400 shrink-0" />

      <!-- Workspace Name -->
      <span class="truncate text-slate-900 font-medium">
        {{ currentWorkspace ? currentWorkspace.name : 'Select workspace' }}
      </span>

      <!-- Chevron -->
      <LucideChevronDown
        class="w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180 text-indigo-600': isOpen }"
      />
    </button>

    <!-- Custom Popover Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 transform transition-all animate-in fade-in zoom-in-95 duration-100"
      role="listbox"
    >
      <!-- Dropdown Header -->
      <div class="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Workspaces
        </span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
          {{ workspaces.length }}
        </span>
      </div>

      <!-- Workspaces List -->
      <div class="max-h-60 overflow-y-auto py-1 divide-y divide-slate-50">
        <button
          v-for="ws in workspaces"
          :key="ws.id"
          type="button"
          class="w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors cursor-pointer group"
          :class="[
            currentWorkspace?.id === ws.id
              ? 'bg-indigo-50/80 text-indigo-950 font-semibold'
              : 'text-slate-700 hover:bg-slate-50',
          ]"
          role="option"
          :aria-selected="currentWorkspace?.id === ws.id"
          @click="handleSelect(ws)"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors"
              :class="[
                currentWorkspace?.id === ws.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700',
              ]"
            >
              {{ ws.name.slice(0, 2).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm leading-tight">
                {{ ws.name }}
              </p>
              <p class="text-[11px] font-mono text-slate-400 truncate">
                /{{ ws.slug }}
              </p>
            </div>
          </div>

          <LucideCheck
            v-if="currentWorkspace?.id === ws.id"
            class="w-4 h-4 text-indigo-600 shrink-0 ml-2"
          />
        </button>
      </div>

      <!-- Footer Quick Action -->
      <div class="pt-1.5 border-t border-slate-100 px-1.5">
        <button
          type="button"
          class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer text-left"
          @click="handleCreateClick"
        >
          <LucidePlus class="w-3.5 h-3.5" />
          <span>Create New Workspace</span>
        </button>
      </div>
    </div>
  </div>
</template>
