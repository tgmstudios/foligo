import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import views
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import OnboardingView from '@/views/onboarding/OnboardingView.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import ProjectDetailView from '@/views/projects/ProjectDetailView.vue'
import ContentEditorView from '@/views/content/ContentEditorView.vue'
import CreateContentView from '@/views/content/CreateContentView.vue'
import UsersView from '@/views/users/UsersView.vue'
import SettingsView from '@/views/settings/SettingsView.vue'
import AnalyticsView from '@/views/analytics/AnalyticsView.vue'
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
import AdminUsersView from '@/views/admin/AdminUsersView.vue'
import AdminProjectsView from '@/views/admin/AdminProjectsView.vue'
import AdminContentView from '@/views/admin/AdminContentView.vue'
import AdminSsoView from '@/views/admin/AdminSsoView.vue'
import AdminAiModelsView from '@/views/admin/AdminAiModelsView.vue'
import AdminSettingsView from '@/views/admin/AdminSettingsView.vue'
import AdminUserDetailView from '@/views/admin/AdminUserDetailView.vue'
import AdminProjectDetailView from '@/views/admin/AdminProjectDetailView.vue'
import AdminContentDetailView from '@/views/admin/AdminContentDetailView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { formatDocumentTitle } from '@/router/titles'
import goapplyRoutes from '@/router/goapply'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: 'Sign in', requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { title: 'Create account', requiresGuest: true }
    },
    {
      path: '/signup',
      name: 'signup',
      component: RegisterView,
      meta: { title: 'Create account', requiresGuest: true }
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingView,
      meta: { title: 'Welcome', requiresAuth: true, requiresOnboarding: true }
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/views/auth/AuthCallbackView.vue'),
      meta: { title: 'Signing in' }
    },
    {
      path: '/auth/link-device',
      name: 'auth-link-device',
      component: () => import('@/views/auth/LinkDevice.vue'),
      meta: { title: 'Link device', requiresAuth: false }
    },
    // Editor Studio: full-page, chrome-free editors living under one global
    // /studio namespace — deliberately top-level siblings of the DashboardLayout
    // route below (not nested under it) so they render with no dashboard
    // sidebar/header, same pattern as /login. One route per content-type adapter.
    {
      // No `props: true` — both Studio views read route.params directly via
      // useRoute() and have multi-root (fragment) templates, so Vue Router's
      // prop-fallthrough would otherwise warn about un-inheritable attrs.
      path: '/studio/resume/:id',
      name: 'studio-resume',
      component: () => import('@/views/studio/EditorStudioView.vue'),
      meta: { title: 'Resume Studio', requiresAuth: true }
    },
    {
      path: '/studio/cover-letter/:id',
      name: 'studio-cover-letter',
      component: () => import('@/views/studio/CoverLetterStudioView.vue'),
      meta: { title: 'Cover Letter Studio', requiresAuth: true }
    },
    {
      path: '/studio/content/:projectId/:id',
      name: 'studio-content',
      component: () => import('@/views/studio/ContentStudioView.vue'),
      meta: { title: 'Content Studio', requiresAuth: true }
    },
    {
      // Back-compat for the old resume Studio URL.
      path: '/goapply/resume/:id/studio',
      redirect: (to) => ({ name: 'studio-resume', params: { id: to.params.id } })
    },
    {
      path: '/',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView,
          meta: { title: 'Dashboard' }
        },
        {
          path: 'blogs',
          name: 'blogs',
          component: () => import('@/views/content/ContentListView.vue'),
          meta: { title: 'Blog Posts' }
        },
        {
          path: 'projects',
          name: 'projects-content',
          component: () => import('@/views/content/ContentListView.vue'),
          meta: { title: 'Projects' }
        },
        {
          path: 'experience',
          name: 'experience',
          component: () => import('@/views/content/ContentListView.vue'),
          meta: { title: 'Experience' }
        },
        {
          path: 'portfolios',
          name: 'portfolios',
          component: () => import('@/views/content/ContentListView.vue'),
          meta: { title: 'Portfolios' }
        },
        {
          path: 'portfolios/:id',
          name: 'portfolio-detail',
          component: ProjectDetailView,
          props: true,
          meta: { title: 'Portfolio' }
        },
        {
          path: 'content/new/:type',
          name: 'create-content',
          component: CreateContentView,
          props: true,
          meta: { title: 'New Content' }
        },
        {
          path: 'portfolios/:projectId/content/new/:type',
          name: 'create-content-portfolio',
          component: CreateContentView,
          props: true,
          meta: { title: 'New Content' }
        },
        {
          path: 'portfolios/:projectId/content/:id/edit',
          name: 'content-editor',
          component: ContentEditorView,
          props: true,
          meta: { title: 'Edit Content' }
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: { title: 'Users', requiresAdmin: true }
        },
        {
          path: 'admin',
          name: 'admin-dashboard',
          component: AdminDashboardView,
          meta: { title: 'Admin Dashboard', requiresAdmin: true }
        },
        {
          path: 'admin/users',
          name: 'admin-users',
          component: AdminUsersView,
          meta: { title: 'User Management', requiresAdmin: true }
        },
        {
          path: 'admin/users/:id',
          name: 'admin-user-detail',
          component: AdminUserDetailView,
          meta: { title: 'User Details', requiresAdmin: true }
        },
        {
          path: 'admin/projects',
          name: 'admin-projects',
          component: AdminProjectsView,
          meta: { title: 'Portfolio Management', requiresAdmin: true }
        },
        {
          path: 'admin/projects/:id',
          name: 'admin-project-detail',
          component: AdminProjectDetailView,
          meta: { title: 'Portfolio Details (Admin)', requiresAdmin: true }
        },
        {
          path: 'admin/content',
          name: 'admin-content',
          component: AdminContentView,
          meta: { title: 'Content Management', requiresAdmin: true }
        },
        {
          path: 'admin/content/:id',
          name: 'admin-content-detail',
          component: AdminContentDetailView,
          meta: { title: 'Content Details (Admin)', requiresAdmin: true }
        },
        {
          path: 'admin/sso',
          name: 'admin-sso',
          component: AdminSsoView,
          meta: { title: 'SSO Providers', requiresAdmin: true }
        },
        {
          path: 'admin/ai-models',
          name: 'admin-ai-models',
          component: AdminAiModelsView,
          meta: { title: 'AI Models', requiresAdmin: true }
        },
        {
          path: 'admin/settings',
          name: 'admin-settings',
          component: AdminSettingsView,
          meta: { title: 'Platform Settings', requiresAdmin: true }
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: AnalyticsView,
          meta: { title: 'Analytics' }
        },
        {
          path: 'settings',
          component: SettingsView,
          children: [
            {
              path: '',
              name: 'settings',
              component: () => import('@/views/settings/UserSettingsView.vue'),
              meta: { title: 'User Settings' }
            },
            {
              path: 'site',
              name: 'site-settings',
              component: () => import('@/views/settings/SiteSettingsView.vue'),
              meta: { title: 'Site-wide Settings', requiresAdmin: true }
            }
          ]
        },
        {
          path: 'media',
          name: 'media-library',
          component: () => import('@/views/media/MediaLibraryView.vue'),
          meta: { title: 'Media Library' }
        },
        {
          path: 'portfolios/:projectId/media',
          name: 'project-media-library',
          component: () => import('@/views/media/MediaLibraryView.vue'),
          props: true,
          meta: { title: 'Portfolio Media Library' }
        },
        goapplyRoutes,
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { title: 'Page not found' }
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth initialization if we have a token but no user
  if (authStore.token && !authStore.user) {
    try {
      await authStore.initializeAuth()
    } catch (error) {
      console.error('Auth initialization failed:', error)
    }
  }
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.token) {
    // No token at all — redirect to login
    next('/login')
    return
  }
  
  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && authStore.token) {
    next('/')
    return
  }
  
  // Check if user needs onboarding (but not if already on onboarding page)
  if (to.meta.requiresOnboarding && authStore.user && !authStore.user.hasCompletedOnboarding && to.name !== 'onboarding') {
    next('/onboarding')
    return
  }
  
  // If user has completed onboarding and tries to access onboarding page, redirect to dashboard
  if (to.name === 'onboarding' && authStore.user && authStore.user.hasCompletedOnboarding) {
    next('/')
    return
  }
  
  // Check if route requires admin access
  if (to.meta.requiresAdmin && authStore.user && !authStore.user.isAdmin) {
    next('/')
    return
  }
  
  next()
})

router.afterEach((to) => {
  document.title = formatDocumentTitle(to)
})

export default router
