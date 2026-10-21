import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCompanyStore } from '@/stores/company'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'

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
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('@/features/auth/views/VerifyEmailView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/features/auth/views/ForgotPasswordView.vue'),
      meta: { guestOnly: true },
    },

    // Hybrid Onboarding Route for users with 0 companies
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/features/onboarding/views/OnboardingView.vue'),
      meta: { requiresAuth: true },
    },

    // Superuser Gateway Selection Route (Redirects directly to /admin/overview)
    {
      path: '/select-dashboard',
      redirect: '/admin/overview',
    },

    // Dedicated Admin Application Shell
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          redirect: '/admin/overview',
        },
        {
          path: 'overview',
          name: 'admin-overview',
          component: () => import('@/features/admin/views/AdminOverviewView.vue'),
        },
        {
          path: 'companies',
          name: 'admin-companies',
          component: () => import('@/features/admin/views/AdminCompaniesView.vue'),
        },
        {
          path: 'company-requests',
          name: 'admin-company-requests',
          component: () => import('@/features/admin/views/AdminCompanyRequestsView.vue'),
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/features/admin/views/AdminUsersView.vue'),
        },
        {
          path: 'workspaces',
          name: 'admin-workspaces',
          component: () => import('@/features/admin/views/AdminWorkspacesView.vue'),
        },
        {
          path: 'projects',
          name: 'admin-projects',
          component: () => import('@/features/admin/views/AdminProjectsView.vue'),
        },
        {
          path: 'tasks',
          name: 'admin-tasks',
          component: () => import('@/features/admin/views/AdminTasksView.vue'),
        },
        {
          path: 'roles',
          name: 'admin-roles',
          component: () => import('@/features/admin/views/AdminRolesView.vue'),
        },
        {
          path: 'audit-logs',
          name: 'admin-audit-logs',
          component: () => import('@/features/admin/views/AdminAuditLogsView.vue'),
        },
      ],
    },

    // Authenticated User Application Shell
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'user-dashboard',
          component: () => import('@/features/dashboard/views/UserDashboardView.vue'),
        },
        {
          path: 'company/admin',
          name: 'company-admin',
          component: () => import('@/features/company/views/CompanyAdminView.vue'),
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
        {
          path: 'tasks',
          name: 'tasks',
          component: () => import('@/features/tasks/views/TasksOverviewView.vue'),
        },
      ],
    },

    // Catch-all 404
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
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
    if (authStore.user?.is_superuser) {
      next({ name: 'admin-overview' })
    } else {
      next({ name: 'user-dashboard' })
    }
    return
  }

  if (to.meta.requiresAdmin && !authStore.user?.is_superuser) {
    next({ name: 'user-dashboard' })
    return
  }

  // Check company membership for non-superuser users
  if (isAuth && !authStore.user?.is_superuser && to.name !== 'onboarding') {
    const companyStore = useCompanyStore()
    if (companyStore.companies.length === 0 && !companyStore.isLoading) {
      try {
        const comps = await companyStore.fetchMyCompanies()
        if (comps.length === 0) {
          next({ name: 'onboarding' })
          return
        }
      } catch {
        // If error fetching companies, proceed
      }
    }
  }

  next()
})

export default router
