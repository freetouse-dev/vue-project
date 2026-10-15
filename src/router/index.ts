import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Guest Routes
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/features/auth/views/RegisterView.vue'),
      meta: { guestOnly: true },
    },

    // Authenticated Application Shell
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/workspaces',
        },
        {
          path: 'workspaces',
          name: 'workspaces',
          component: () => import('@/features/workspaces/views/WorkspaceListView.vue'),
        },
        {
          path: 'workspaces/:slug',
          name: 'workspace-detail',
          component: () => import('@/features/workspaces/views/WorkspaceDetailView.vue'),
        },
        {
          path: 'workspaces/:slug/projects/:key',
          name: 'project-detail',
          component: () => import('@/features/projects/views/ProjectDetailView.vue'),
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('@/features/projects/views/ProjectsPlaceholderView.vue'),
        },
      ],
    },

    // Catch-all 404
    {
      path: '/:pathMatch(.*)*',
      redirect: '/workspaces',
    },
  ],
})

// Navigation Guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Ensure persistent auth state has been checked
  if (!authStore.isInitialized) {
    await authStore.initAuth()
  }

  const isAuth = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuth) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.guestOnly && isAuth) {
    next({ name: 'workspaces' })
    return
  }

  next()
})

export default router
