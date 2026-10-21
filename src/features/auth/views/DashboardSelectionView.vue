<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLogo from '@/components/common/AppLogo.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import {
  Shield,
  FolderKanban,
  ArrowRight,
  LogOut,
  Sparkles,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

function chooseUserDashboard() {
  router.push('/dashboard')
}

function chooseAdminDashboard() {
  router.push('/admin')
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-8 transition-colors">
    <!-- Top Navigation Bar -->
    <header class="max-w-5xl w-full mx-auto flex items-center justify-between">
      <div class="flex items-center gap-2">
        <AppLogo size="md" />
        <span class="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">Unitask</span>
      </div>

      <div class="flex items-center gap-3">
        <ThemeToggle />
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </header>

    <!-- Main Selection Section -->
    <main class="max-w-3xl w-full mx-auto my-auto py-10 space-y-8">
      <div class="text-center space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Superuser Privileges Active</span>
        </div>

        <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Select Your Workspace Mode
        </h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Welcome back, <strong class="text-slate-800 dark:text-slate-200">{{ user?.full_name }}</strong>. Choose how you would like to work today. You can freely switch dashboards at any time from the top bar.
        </p>
      </div>

      <!-- Decision Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-2">
        <!-- Card 1: User Dashboard -->
        <div
          class="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-xl transition-all duration-200 cursor-pointer text-left"
          @click="chooseUserDashboard"
        >
          <div class="space-y-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <FolderKanban class="w-6 h-6" />
            </div>

            <div class="space-y-1.5">
              <h2 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                User Dashboard
              </h2>
              <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Work on everyday project tasks, collaborate on project boards, manage assigned deliverables, and track task comments.
              </p>
            </div>

            <ul class="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                My Assigned Tasks & Due Dates
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Authorized Workspaces & Projects
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Task Discussions & File Attachments
              </li>
            </ul>
          </div>

          <div class="pt-6 mt-4 flex items-center justify-between font-semibold text-xs text-indigo-600 dark:text-indigo-400">
            <span>Enter User Workspace</span>
            <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <!-- Card 2: Admin Dashboard -->
        <div
          class="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-xl transition-all duration-200 cursor-pointer text-left"
          @click="chooseAdminDashboard"
        >
          <div class="space-y-4">
            <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <Shield class="w-6 h-6" />
            </div>

            <div class="space-y-1.5">
              <h2 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Admin Dashboard
              </h2>
              <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Global application maintenance, user account administration, workspace management, soft-delete recovery, and security audit logs.
              </p>
            </div>

            <ul class="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                User & Role Permissions Management
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Platform-Wide Workspace Governance
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                System Audit Trails & Resource Recovery
              </li>
            </ul>
          </div>

          <div class="pt-6 mt-4 flex items-center justify-between font-semibold text-xs text-purple-600 dark:text-purple-400">
            <span>Enter Admin Dashboard</span>
            <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="max-w-5xl w-full mx-auto text-center text-xs text-slate-400">
      Signed in as {{ user?.email }} &bull; Unitask Platform Management
    </footer>
  </div>
</template>
