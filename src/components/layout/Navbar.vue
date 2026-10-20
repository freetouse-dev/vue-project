<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceStore } from '@/stores/workspace'
import AppLogo from '@/components/common/AppLogo.vue'
import WorkspaceDropdown from '@/components/layout/WorkspaceDropdown.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import UserProfileModal from '@/components/common/UserProfileModal.vue'
import {
  LucideLogOut,
  LucideMenu,
  LucideX,
  Shield,
} from 'lucide-vue-next'

defineProps<{
  isMobileMenuOpen?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-mobile-menu'): void
  (e: 'open-create-modal'): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()

const user = computed(() => authStore.user)
const showProfileModal = ref(false)

function handleLogout() {
  authStore.logout()
  workspaceStore.reset()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
    <!-- Left: Mobile Menu Toggle + Brand + Workspace Selector -->
    <div class="flex items-center gap-2 sm:gap-3.5 min-w-0">
      <!-- Mobile Hamburger Button -->
      <button
        type="button"
        class="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        aria-label="Toggle navigation menu"
        @click="emit('toggle-mobile-menu')"
      >
        <LucideX v-if="isMobileMenuOpen" class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <LucideMenu v-else class="w-5 h-5" />
      </button>

      <!-- Brand -->
      <router-link
        to="/workspaces"
        class="flex items-center gap-2 font-bold text-lg text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors shrink-0"
      >
        <AppLogo size="sm" />
        <span class="hidden sm:inline tracking-tight font-extrabold text-slate-900 dark:text-white">TaskFlow</span>
      </router-link>

      <span class="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>

      <!-- Custom Styled Workspace Selector Dropdown -->
      <WorkspaceDropdown
        @open-create-modal="emit('open-create-modal')"
      />
    </div>

    <!-- Right: Admin + Theme Toggle + Current User & Logout -->
    <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
      <!-- Admin Link if Superuser -->
      <router-link
        v-if="authStore.isSuperuser"
        to="/admin"
        class="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
        title="Admin Dashboard"
      >
        <Shield class="w-3.5 h-3.5" />
        <span>Admin</span>
      </router-link>

      <!-- Theme Switcher -->
      <ThemeToggle />

      <div v-if="user" class="hidden md:flex flex-col text-right">
        <span class="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">
          {{ user.full_name }}
        </span>
        <span class="text-xs text-slate-500 dark:text-slate-400 leading-tight">
          {{ user.email }}
        </span>
      </div>

      <button
        type="button"
        class="rounded-full focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer transition-transform active:scale-95"
        :title="user ? `${user.full_name} - Edit profile` : 'User profile'"
        @click="showProfileModal = true"
      >
        <UserAvatar :user="user" size="sm" />
      </button>

      <button
        type="button"
        title="Log out"
        class="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
        @click="handleLogout"
      >
        <LucideLogOut class="w-5 h-5" />
      </button>
    </div>
  </header>

  <!-- User Profile & Avatar Modal -->
  <UserProfileModal v-model="showProfileModal" />
</template>
