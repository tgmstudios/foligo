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
      meta: { title: 'GoApply · Kanban' },
    },
    {
      path: 'jobs',
      name: 'goapply-jobs',
      component: () => import('@/views/goapply/JobList.vue'),
      meta: { title: 'GoApply · Job List' },
    },
    {
      path: 'assistant',
      name: 'goapply-assistant',
      component: () => import('@/views/goapply/JobAssistant.vue'),
      meta: { title: 'GoApply · Job Assistant' },
    },
    {
      path: 'assistant/:sessionId',
      name: 'goapply-assistant-session',
      component: () => import('@/views/goapply/JobAssistant.vue'),
      props: true,
      meta: { title: 'GoApply · Job Assistant' },
    },
    {
      path: 'resume',
      name: 'goapply-resume',
      component: () => import('@/views/goapply/ResumeGallery.vue'),
      meta: { title: 'GoApply · Resumes' },
    },
    {
      path: 'saved-answers',
      name: 'goapply-answers',
      component: () => import('@/views/goapply/SavedAnswers.vue'),
      meta: { title: 'GoApply · Saved Answers' },
    },
    {
      path: 'cover-letters',
      name: 'goapply-letters',
      component: () => import('@/views/goapply/CoverLetters.vue'),
      meta: { title: 'GoApply · Cover Letters' },
    },
    {
      path: 'profile',
      name: 'goapply-profile',
      component: () => import('@/views/goapply/ProfileSettings.vue'),
      meta: { title: 'GoApply · Profile' },
    },
  ],
}

export default goapplyRoutes
