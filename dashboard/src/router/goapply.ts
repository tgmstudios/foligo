import type { RouteRecordRaw } from 'vue-router'

const goapplyRoutes: RouteRecordRaw = {
  path: '/goapply',
  component: () => import('@/views/goapply/JobTracker.vue'),
  meta: { requiresAuth: true },
  children: [
    {
      path: '',
      redirect: { name: 'goapply-kanban' },
    },
    {
      path: 'kanban',
      name: 'goapply-kanban',
      component: () => import('@/views/goapply/KanbanBoard.vue'),
    },
    {
      path: 'jobs',
      name: 'goapply-jobs',
      component: () => import('@/views/goapply/JobList.vue'),
    },
    {
      path: 'saved-answers',
      name: 'goapply-answers',
      component: () => import('@/views/goapply/SavedAnswers.vue'),
    },
    {
      path: 'cover-letters',
      name: 'goapply-letters',
      component: () => import('@/views/goapply/CoverLetters.vue'),
    },
    {
      path: 'profile',
      name: 'goapply-profile',
      component: () => import('@/views/goapply/ProfileSettings.vue'),
    },
  ],
}

export default goapplyRoutes
