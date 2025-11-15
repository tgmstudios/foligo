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
          path: 'analytics',
          name: 'analytics',
          component: AnalyticsView
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsView
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
        }
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
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
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
