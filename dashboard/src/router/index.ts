import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import views
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import OnboardingView from '@/views/onboarding/OnboardingView.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import ProjectsView from '@/views/projects/ProjectsView.vue'
import ProjectDetailView from '@/views/projects/ProjectDetailView.vue'
import ContentEditorView from '@/views/content/ContentEditorView.vue'
import CreateContentView from '@/views/content/CreateContentView.vue'
import UsersView from '@/views/users/UsersView.vue'
import SettingsView from '@/views/settings/SettingsView.vue'
import ContentManagementView from '@/views/content/ContentManagementView.vue'
import AnalyticsView from '@/views/analytics/AnalyticsView.vue'
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
import AdminUsersView from '@/views/admin/AdminUsersView.vue'
import AdminProjectsView from '@/views/admin/AdminProjectsView.vue'
import AdminContentView from '@/views/admin/AdminContentView.vue'
import AdminSsoView from '@/views/admin/AdminSsoView.vue'
import AdminAiModelsView from '@/views/admin/AdminAiModelsView.vue'
import AdminUserDetailView from '@/views/admin/AdminUserDetailView.vue'
import AdminProjectDetailView from '@/views/admin/AdminProjectDetailView.vue'
import AdminContentDetailView from '@/views/admin/AdminContentDetailView.vue'
import goapplyRoutes from '@/router/goapply'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true }
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingView,
      meta: { requiresAuth: true, requiresOnboarding: true }
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/views/auth/AuthCallbackView.vue')
    },
    {
      path: '/auth/link-device',
      name: 'auth-link-device',
      component: () => import('@/views/auth/LinkDevice.vue'),
      meta: { requiresAuth: false }
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
      meta: { requiresAuth: true }
    },
    {
      path: '/studio/cover-letter/:id',
      name: 'studio-cover-letter',
      component: () => import('@/views/studio/CoverLetterStudioView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/studio/content/:projectId/:id',
      name: 'studio-content',
      component: () => import('@/views/studio/ContentStudioView.vue'),
      meta: { requiresAuth: true }
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
          component: DashboardView
        },
        {
          path: 'blogs',
          name: 'blogs',
          component: () => import('@/views/content/ContentListView.vue')
        },
        {
          path: 'projects',
          name: 'projects-content',
          component: () => import('@/views/content/ContentListView.vue')
        },
        {
          path: 'experience',
          name: 'experience',
          component: () => import('@/views/content/ContentListView.vue')
        },
        {
          path: 'portfolios',
          name: 'portfolios',
          component: () => import('@/views/content/ContentListView.vue')
        },
        {
          path: 'portfolios/:id',
          name: 'portfolio-detail',
          component: ProjectDetailView,
          props: true
        },
        {
          path: 'content/new/:type',
          name: 'create-content',
          component: CreateContentView,
          props: true
        },
        {
          path: 'portfolios/:projectId/content/new/:type',
          name: 'create-content-portfolio',
          component: CreateContentView,
          props: true
        },
        {
          path: 'portfolios/:projectId/content/:id/edit',
          name: 'content-editor',
          component: ContentEditorView,
          props: true
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin',
          name: 'admin-dashboard',
          component: AdminDashboardView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/users',
          name: 'admin-users',
          component: AdminUsersView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/users/:id',
          name: 'admin-user-detail',
          component: AdminUserDetailView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/projects',
          name: 'admin-projects',
          component: AdminProjectsView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/projects/:id',
          name: 'admin-project-detail',
          component: AdminProjectDetailView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/content',
          name: 'admin-content',
          component: AdminContentView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/content/:id',
          name: 'admin-content-detail',
          component: AdminContentDetailView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/sso',
          name: 'admin-sso',
          component: AdminSsoView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/ai-models',
          name: 'admin-ai-models',
          component: AdminAiModelsView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: AnalyticsView
        },
        {
          path: 'settings',
          component: SettingsView,
          children: [
            {
              path: '',
              name: 'settings',
              component: () => import('@/views/settings/UserSettingsView.vue')
            },
            {
              path: 'site',
              name: 'site-settings',
              component: () => import('@/views/settings/SiteSettingsView.vue'),
              meta: { requiresAdmin: true }
            }
          ]
        },
        {
          path: 'media',
          name: 'media-library',
          component: () => import('@/views/media/MediaLibraryView.vue')
        },
        {
          path: 'portfolios/:projectId/media',
          name: 'project-media-library',
          component: () => import('@/views/media/MediaLibraryView.vue'),
          props: true
        },
        goapplyRoutes,
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/'
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
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

export default router
