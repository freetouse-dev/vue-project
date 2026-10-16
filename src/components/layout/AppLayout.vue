<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'
import CreateWorkspaceModal from '@/features/workspaces/components/CreateWorkspaceModal.vue'

const route = useRoute()
const router = useRouter()
const isMobileMenuOpen = ref(false)
const showCreateModal = ref(false)

// Close mobile menu automatically whenever route changes
watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false
  }
)

function handleWorkspaceCreated(slug: string) {
  router.push({ name: 'workspace-detail', params: { slug } })
}
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
    <!-- Top Navbar with mobile hamburger toggle and workspace dropdown -->
    <Navbar
      :is-mobile-menu-open="isMobileMenuOpen"
      @toggle-mobile-menu="isMobileMenuOpen = !isMobileMenuOpen"
      @open-create-modal="showCreateModal = true"
    />

    <!-- Main Body Area (Anchored height: Sidebar stays fixed, main content scrolls) -->
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- Left Sidebar (Desktop fixed + Mobile slide-over drawer) -->
      <Sidebar
        :is-mobile-open="isMobileMenuOpen"
        @close="isMobileMenuOpen = false"
      />

      <!-- Main Content View (Only this container scrolls) -->
      <main class="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 lg:p-8">
        <div class="max-w-7xl mx-auto">
          <router-view />
        </div>
      </main>
    </div>

    <!-- Global Create Workspace Modal -->
    <CreateWorkspaceModal
      v-model="showCreateModal"
      @created="handleWorkspaceCreated"
    />
  </div>
</template>
