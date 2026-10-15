<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  LucideBuilding2,
  LucideFolderKanban,
  LucideCheckSquare,
  LucideSettings,
  LucideHelpCircle,
  LucideX,
} from 'lucide-vue-next'
import AppLogo from '@/components/common/AppLogo.vue'
import UnderDevelopmentModal from '@/components/common/UnderDevelopmentModal.vue'

defineProps<{
  isMobileOpen?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const route = useRoute()

const showUnderDevModal = ref(false)
const underDevFeature = ref('')

function openUnderDev(feature: string) {
  underDevFeature.value = feature
  showUnderDevModal.value = true
}

function handleNavClick() {
  emit('close')
}
</script>

<template>
  <div class="h-full flex shrink-0">
    <!-- Desktop Sidebar (Hidden on mobile) -->
    <aside class="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 h-full overflow-hidden select-none">
      <div class="p-4 flex-1 flex flex-col justify-between min-h-0 overflow-y-auto">
        <nav class="space-y-1">
          <p class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Workspace
          </p>

          <!-- Workspaces -->
          <router-link
            to="/workspaces"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            :class="[
              route.path.startsWith('/workspaces')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            ]"
          >
            <LucideBuilding2 class="w-5 h-5 shrink-0" />
            <span>Workspaces</span>
            <span class="ml-auto w-2 h-2 rounded-full bg-emerald-500" title="Active feature"></span>
          </router-link>

          <!-- Projects -->
          <router-link
            to="/projects"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            :class="[
              route.path.startsWith('/projects')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            ]"
          >
            <LucideFolderKanban class="w-5 h-5 shrink-0" />
            <span>Projects</span>
            <span class="ml-auto text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-mono">
              dev
            </span>
          </router-link>

          <!-- Tasks & Sprints -->
          <button
            type="button"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            @click="openUnderDev('Tasks & Kanban Board')"
          >
            <LucideCheckSquare class="w-5 h-5 shrink-0" />
            <span>Tasks & Board</span>
            <span class="ml-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
              soon
            </span>
          </button>

          <p class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-5 mb-2">
            Management
          </p>

          <!-- Settings -->
          <button
            type="button"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            @click="openUnderDev('Workspace Settings')"
          >
            <LucideSettings class="w-5 h-5 shrink-0" />
            <span>Settings</span>
            <span class="ml-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
              soon
            </span>
          </button>
        </nav>

        <!-- Bottom Help card -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div class="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <LucideHelpCircle class="w-4 h-4 text-indigo-500" />
            <span>FastAPI Integration</span>
          </div>
          <p class="mt-1 text-xs text-slate-500 leading-relaxed">
            Connected to <code class="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[11px]">/api/v1</code>.
          </p>
        </div>
      </div>
    </aside>

    <!-- Mobile Slide-over Drawer (Only on mobile when open) -->
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 z-50 md:hidden flex"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        @click="emit('close')"
      ></div>

      <!-- Drawer Content -->
      <div
        class="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 p-5 justify-between animate-in slide-in-from-left duration-200"
      >
        <div>
          <!-- Drawer Header with Brand & Close Button -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div class="flex items-center gap-2.5">
              <AppLogo size="sm" />
              <span class="font-extrabold text-base tracking-tight text-slate-900">TaskFlow</span>
            </div>
            <button
              type="button"
              class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              @click="emit('close')"
            >
              <LucideX class="w-5 h-5" />
            </button>
          </div>

          <!-- Mobile Nav Links -->
          <nav class="space-y-1.5">
            <p class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Workspace
            </p>

            <router-link
              to="/workspaces"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              :class="[
                route.path.startsWith('/workspaces')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              ]"
              @click="handleNavClick"
            >
              <LucideBuilding2 class="w-5 h-5 shrink-0" />
              <span>Workspaces</span>
              <span class="ml-auto w-2 h-2 rounded-full bg-emerald-500"></span>
            </router-link>

            <router-link
              to="/projects"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              :class="[
                route.path.startsWith('/projects')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              ]"
              @click="handleNavClick"
            >
              <LucideFolderKanban class="w-5 h-5 shrink-0" />
              <span>Projects</span>
              <span class="ml-auto text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-mono">
                dev
              </span>
            </router-link>

            <button
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 transition-colors text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              @click="openUnderDev('Tasks & Kanban Board')"
            >
              <LucideCheckSquare class="w-5 h-5 shrink-0" />
              <span>Tasks & Board</span>
              <span class="ml-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                soon
              </span>
            </button>

            <p class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-5 mb-2">
              Management
            </p>

            <button
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 transition-colors text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              @click="openUnderDev('Workspace Settings')"
            >
              <LucideSettings class="w-5 h-5 shrink-0" />
              <span>Settings</span>
              <span class="ml-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                soon
              </span>
            </button>
          </nav>
        </div>

        <!-- Mobile Drawer Footer -->
        <div class="pt-4 border-t border-slate-100">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div class="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <LucideHelpCircle class="w-4 h-4 text-indigo-500" />
              <span>FastAPI Integration</span>
            </div>
            <p class="mt-1 text-xs text-slate-500 leading-relaxed">
              Connected to <code class="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[11px]">/api/v1</code>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Reusable Under Development Modal -->
    <UnderDevelopmentModal
      v-model="showUnderDevModal"
      :feature-name="underDevFeature"
    />
  </div>
</template>
