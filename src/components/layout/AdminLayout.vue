<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLogo from '@/components/common/AppLogo.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import UserProfileModal from '@/components/common/UserProfileModal.vue'
import {
  Building2,
  UserCheck,
  Shield,
  LayoutDashboard,
  Users,
  Layers,
  FolderKanban,
  CheckSquare,
  Lock,
  FileText,
  LogOut,
  Menu,
  X,
  ArrowLeftRight,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const showProfileModal = ref(false)
const isMobileMenuOpen = ref(false)

const navItems = [
  { name: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
  { name: 'Companies', path: '/admin/companies', icon: Building2 },
  { name: 'Company Requests', path: '/admin/company-requests', icon: UserCheck },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Workspaces', path: '/admin/workspaces', icon: Layers },
  { name: 'Projects', path: '/admin/projects', icon: FolderKanban },
  { name: 'Tasks & Moderation', path: '/admin/tasks', icon: CheckSquare },
  { name: 'Roles & RBAC', path: '/admin/roles', icon: Lock },
  { name: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
]

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}

function switchToUserDashboard() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
    <!-- Admin Topbar Header -->
    <header class="h-16 bg-white dark:bg-slate-900 border-b border-purple-200 dark:border-purple-900/50 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors shadow-2xs">
      <!-- Left: Mobile Menu Toggle + Admin Brand -->
      <div class="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          class="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle admin navigation"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <X v-if="isMobileMenuOpen" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <Menu v-else class="w-5 h-5" />
        </button>

        <router-link
          to="/admin/overview"
          class="flex items-center gap-2.5 font-bold text-lg text-purple-700 dark:text-purple-400 hover:opacity-90 transition-opacity shrink-0"
        >
          <AppLogo size="sm" />
          <span class="tracking-tight font-extrabold text-slate-900 dark:text-white">Unitask</span>
        </router-link>

        <div class="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Shield class="w-3.5 h-3.5" />
            Admin Console
          </span>
        </div>
      </div>

      <!-- Right: Dashboard Switcher + Theme Toggle + User Info & Logout -->
      <div class="flex items-center gap-2 sm:gap-3 shrink-0">
        <!-- Switcher to User Dashboard -->
        <button
          type="button"
          @click="switchToUserDashboard"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer shadow-2xs"
          title="Switch to User Dashboard to view normal tasks and workspaces"
        >
          <ArrowLeftRight class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">User Dashboard</span>
          <span class="sm:hidden">User App</span>
        </button>

        <ThemeToggle />

        <!-- User Identity -->
        <div v-if="user" class="hidden md:flex flex-col text-right">
          <span class="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
            {{ user.full_name }}
          </span>
          <span class="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold leading-tight">
            SUPERUSER
          </span>
        </div>

        <button
          type="button"
          class="rounded-full focus:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer transition-transform active:scale-95"
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
          <LogOut class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- Admin Body: Sidebar + Main Views -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Desktop Admin Sidebar -->
      <aside class="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col shrink-0 overflow-y-auto select-none transition-colors">
        <div class="p-4 flex-1 flex flex-col justify-between">
          <nav class="space-y-1">
            <p class="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Platform Governance
            </p>

            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              :class="[
                route.path.startsWith(item.path)
                  ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
              ]"
            >
              <component :is="item.icon" class="w-4 h-4 shrink-0" />
              <span>{{ item.name }}</span>
            </router-link>
          </nav>

          <!-- Sidebar Footer Notice -->
          <div class="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 space-y-2 mt-6">
            <div class="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
              <Shield class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Full System Authority</span>
            </div>
            <p class="text-[11px] text-purple-800/80 dark:text-purple-300/70 leading-relaxed">
              Global operations bypass tenant constraints. Audit logging is active for all administrative changes.
            </p>
            <button
              type="button"
              @click="switchToUserDashboard"
              class="w-full mt-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/80 transition-colors text-center cursor-pointer"
            >
              Back to User Workspace
            </button>
          </div>
        </div>
      </aside>

      <!-- Mobile Slide-over Drawer -->
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 z-50 lg:hidden flex"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs transition-opacity"
          @click="isMobileMenuOpen = false"
        ></div>

        <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-10 p-5 justify-between animate-in slide-in-from-left duration-200">
          <div>
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div class="flex items-center gap-2">
                <AppLogo size="sm" />
                <span class="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">Admin Console</span>
              </div>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                @click="isMobileMenuOpen = false"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <nav class="space-y-1">
              <router-link
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                @click="isMobileMenuOpen = false"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                :class="[
                  route.path.startsWith(item.path)
                    ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                ]"
              >
                <component :is="item.icon" class="w-4 h-4 shrink-0" />
                <span>{{ item.name }}</span>
              </router-link>
            </nav>
          </div>

          <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              type="button"
              @click="switchToUserDashboard(); isMobileMenuOpen = false"
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
            >
              <ArrowLeftRight class="w-4 h-4" />
              <span>Return to User Dashboard</span>
            </button>
            <button
              type="button"
              @click="handleLogout"
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut class="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Admin Content Area -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <router-view />
      </main>
    </div>

    <!-- User Profile & Avatar Modal -->
    <UserProfileModal v-model="showProfileModal" />
  </div>
</template>
