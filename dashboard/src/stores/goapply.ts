import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import api, { aiApi } from '@/services/api'
import type { Content, Skill } from '@/types/project'
import { withErrorToast } from '@/composables/useApiAction'

// ── Types ──────────────────────────────────────────────────────────────

// 'JOB' and 'EDUCATION' are the two experienceCategory values GoApply links against —
// Content also allows 'CERTIFICATION' but that has no home on the GoApply profile yet.
export type LinkableExperienceCategory = 'JOB' | 'EDUCATION'

export interface GoApplyProfile {
  id?: string
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  portfolio: string
  linkedJobs: Content[]
  linkedEducation: Content[]
  linkedSkills: Skill[]

  // User-managed job-application categories (hiring seasons)
  jobCategories?: string[]

  // Personal Information
  firstName?: string
  lastName?: string
  middleName?: string
  preferredName?: string
  legalName?: string
  username?: string
  phoneType?: string
  phoneCountry?: string
  birthday?: string
  pronouns?: string

  // Location
  address?: string
  address2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string

  language?: string

  // Education & Experience — fully derived server-side from linkedEducation/linkedJobs
  // (see api/src/routes/goapply.js computeDerivedFields). Read-only: editing happens by
  // changing the linked entries, not these fields directly.
  highestDegree?: string
  school?: string
  discipline?: string
  educationSummary?: string
  currentCompany?: string
  currentTitle?: string
  currentlyWorking?: boolean
  experienceSummary?: string
  yearsExperience?: string
  skills?: string[]

  // EEO / voluntary disclosures
  gender?: string
  ethnicity?: string
  hispanicLatino?: string
  veteranStatus?: string
  disabilityStatus?: string
  lgbtStatus?: string
  over18?: boolean
  over21?: boolean
  hasDriversLicense?: boolean

  // Work Authorization
  workAuthUS?: string
  workAuth?: string
  sponsorshipRequired?: string

  // Social & Links
  twitter?: string
  behance?: string
  dribbble?: string
  website?: string

  // Other
  desiredSalary?: string
  referredBy?: string
  source?: string
}

export interface GoApplyJob {
  id: string
  company: string
  position: string
  url: string
  notes: string
  description: string | null
  category: string | null
  tags: string[]
  status: JobStatus
  referredBy: string | null
  sortOrder: number
  appliedAt: string | null
  createdAt: string
  updatedAt: string
}

export type JobStatus =
  | 'saved'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'archived'

export interface SavedAnswer {
  id: string
  question: string
  answer: string
  category: string | null
  jobs: Pick<GoApplyJob, 'id' | 'company' | 'position'>[]
  createdAt: string
  updatedAt: string
}

export interface CoverLetter {
  id: string
  title: string
  content: string
  jobId?: string
  company?: string
  position?: string
  createdAt: string
  updatedAt: string
}

export interface JobFormData {
  company: string
  position: string
  url: string
  notes: string
  description?: string
  category: string
  tags: string[]
  status: JobStatus
  referredBy: string
  sortOrder: number
  appliedAt: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────

export const JOB_STATUSES: JobStatus[] = [
  'saved',
  'applied',
  'screening',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
  'archived',
]

export const STATUS_LABELS: Record<JobStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  archived: 'Archived',
}

export const STATUS_COLORS: Record<JobStatus, string> = {
  saved: 'bg-gray-100 text-gray-800',
  applied: 'bg-blue-100 text-blue-800',
  screening: 'bg-indigo-100 text-indigo-800',
  interview: 'bg-purple-100 text-purple-800',
  offer: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-orange-100 text-orange-800',
  archived: 'bg-gray-300 text-gray-600',
}

export const KANBAN_COLUMNS: { status: JobStatus; label: string; color: string }[] = [
  { status: 'saved', label: 'Saved', color: 'bg-gray-500' },
  { status: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { status: 'screening', label: 'Screening', color: 'bg-indigo-500' },
  { status: 'interview', label: 'Interview', color: 'bg-purple-500' },
  { status: 'offer', label: 'Offer', color: 'bg-yellow-500' },
  { status: 'accepted', label: 'Accepted', color: 'bg-green-500' },
  { status: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { status: 'withdrawn', label: 'Withdrawn', color: 'bg-orange-500' },
  { status: 'archived', label: 'Archived', color: 'bg-gray-700' },
]

// ── Store ──────────────────────────────────────────────────────────────

export const useGoApplyStore = defineStore('goapply', () => {
  const toast = useToast()

  // ── State ──────────────────────────────────────────────────────────
  const profile = ref<GoApplyProfile | null>(null)
  const jobs = ref<GoApplyJob[]>([])
  const answers = ref<SavedAnswer[]>([])
  const coverLetters = ref<CoverLetter[]>([])

  const isLoading = ref(false)
  const isSaving = ref(false)
  const isGenerating = ref(false)

  // ── Getters (kanban) ───────────────────────────────────────────────
  const kanbanColumns = computed(() => {
    const map: Record<JobStatus, GoApplyJob[]> = {} as any
    for (const s of JOB_STATUSES) map[s] = []
    for (const job of jobs.value) {
      if (map[job.status]) map[job.status].push(job)
    }
    return KANBAN_COLUMNS.map((col) => ({
      ...col,
      jobs: map[col.status],
    }))
  })

  const totalJobs = computed(() => jobs.value.length)

  // ── Profile ────────────────────────────────────────────────────────
  async function fetchProfile() {
    try {
      isLoading.value = true
      const { data } = await api.get('/goapply/profile')
      profile.value = data
      return data
    } catch (err: any) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load profile')
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function saveProfile(data: GoApplyProfile) {
    return withErrorToast(async () => {
      isSaving.value = true
      try {
        // Backend uses PUT /api/goapply/profile (upsert)
        const { data: result } = await api.put('/goapply/profile', data)
        profile.value = result
        return result
      } finally {
        isSaving.value = false
      }
    }, 'Failed to save profile', 'Profile saved')
  }

  // Search the user's own portfolio Content(EXPERIENCE) items for the "link existing"
  // pickers — not tied to isLoading/isSaving since it's a debounced, in-place search.
  async function searchExperience(category: LinkableExperienceCategory, q: string) {
    try {
      const { data } = await api.get('/goapply/experience', { params: { category, q } })
      return (data || []) as Content[]
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to search experience')
      return []
    }
  }

  async function linkJobs(contentIds: string[]) {
    return withErrorToast(async () => {
      const { data } = await api.put('/goapply/profile/jobs', { contentIds })
      profile.value = data
      return data
    }, 'Failed to update linked jobs')
  }

  async function linkEducation(contentIds: string[]) {
    return withErrorToast(async () => {
      const { data } = await api.put('/goapply/profile/education', { contentIds })
      profile.value = data
      return data
    }, 'Failed to update linked education')
  }

  async function createGlobalSkill(name: string, category?: string) {
    return withErrorToast(async () => {
      const { data } = await api.post('/goapply/skills', { name, category })
      return data as Skill
    }, 'Failed to create skill')
  }

  async function linkSkills(skillIds: string[]) {
    return withErrorToast(async () => {
      const { data } = await api.put('/goapply/profile/skills', { skillIds })
      profile.value = data
      return data
    }, 'Failed to update linked skills')
  }

  // ── Jobs ───────────────────────────────────────────────────────────
  async function fetchJobs() {
    try {
      isLoading.value = true
      const { data } = await api.get('/goapply/jobs')
      jobs.value = Array.isArray(data) ? data : data.jobs || data.data || []
    } catch (err: any) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load jobs')
      }
      jobs.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function createJob(form: JobFormData) {
    return withErrorToast(async () => {
      isSaving.value = true
      try {
        const { data } = await api.post('/goapply/jobs', form)
        jobs.value.unshift(data)
        return data
      } finally {
        isSaving.value = false
      }
    }, 'Failed to create job', 'Job created')
  }

  async function updateJob(id: string, form: Partial<JobFormData>) {
    return withErrorToast(async () => {
      isSaving.value = true
      try {
        const { data } = await api.put(`/goapply/jobs/${id}`, form)
        const idx = jobs.value.findIndex((j) => j.id === id)
        if (idx !== -1) jobs.value[idx] = data
        return data
      } finally {
        isSaving.value = false
      }
    }, 'Failed to update job', 'Job updated')
  }

  async function updateJobStatus(id: string, status: JobStatus) {
    return updateJob(id, { status } as any)
  }

  async function reorderJobs(items: { id: string; sortOrder: number; status?: JobStatus }[]) {
    return withErrorToast(async () => {
      const { data } = await api.put('/goapply/jobs/reorder', { items })
      return data
    }, 'Failed to reorder jobs')
  }

  async function deleteJob(id: string) {
    return withErrorToast(async () => {
      await api.delete(`/goapply/jobs/${id}`)
      jobs.value = jobs.value.filter((j) => j.id !== id)
    }, 'Failed to delete job', 'Job deleted')
  }

  // ── Saved Answers ──────────────────────────────────────────────────
  async function fetchAnswers() {
    try {
      isLoading.value = true
      const { data } = await api.get('/goapply/answers')
      answers.value = Array.isArray(data) ? data : data.answers || data.data || []
    } catch (err: any) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load answers')
      }
      answers.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function createAnswer(form: { question: string; answer: string; category: string; jobIds: string[] }) {
    return withErrorToast(async () => {
      isSaving.value = true
      try {
        const { data } = await api.post('/goapply/answers', form)
        answers.value.unshift(data)
        return data
      } finally {
        isSaving.value = false
      }
    }, 'Failed to save answer', 'Answer saved')
  }

  async function updateAnswer(id: string, form: { question: string; answer: string; category: string; jobIds: string[] }) {
    return withErrorToast(async () => {
      isSaving.value = true
      try {
        const { data } = await api.put(`/goapply/answers/${id}`, form)
        const idx = answers.value.findIndex((a) => a.id === id)
        if (idx !== -1) answers.value[idx] = data
        return data
      } finally {
        isSaving.value = false
      }
    }, 'Failed to update answer', 'Answer updated')
  }

  async function deleteAnswer(id: string) {
    return withErrorToast(async () => {
      await api.delete(`/goapply/answers/${id}`)
      answers.value = answers.value.filter((a) => a.id !== id)
    }, 'Failed to delete answer', 'Answer deleted')
  }

  // ── Cover Letters ──────────────────────────────────────────────────
  async function fetchCoverLetters() {
    try {
      isLoading.value = true
      const { data } = await api.get('/goapply/cover-letters')
      coverLetters.value = Array.isArray(data) ? data : data.letters || data.data || []
    } catch (err: any) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load cover letters')
      }
      coverLetters.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function generateCoverLetter(jobId?: string, jobDescription?: string) {
    return withErrorToast(async () => {
      isGenerating.value = true
      try {
        const { data } = await aiApi.post('/ai/cover-letter', {
          jobId,
          jobDescription,
        })
        if (data) {
          coverLetters.value.unshift(data)
        }
        return data
      } finally {
        isGenerating.value = false
      }
    }, 'Failed to generate cover letter', (data) => (data ? 'Cover letter generated' : undefined))
  }

  async function deleteCoverLetter(id: string) {
    return withErrorToast(async () => {
      await api.delete(`/goapply/cover-letters/${id}`)
      coverLetters.value = coverLetters.value.filter((c) => c.id !== id)
    }, 'Failed to delete cover letter', 'Cover letter deleted')
  }

  // ── Init ───────────────────────────────────────────────────────────
  async function init() {
    await Promise.allSettled([
      fetchProfile(),
      fetchJobs(),
      fetchAnswers(),
      fetchCoverLetters(),
    ])
  }

  return {
    // state
    profile,
    jobs,
    answers,
    coverLetters,
    isLoading,
    isSaving,
    isGenerating,

    // getters
    kanbanColumns,
    totalJobs,

    // profile
    fetchProfile,
    saveProfile,
    searchExperience,
    linkJobs,
    linkEducation,
    createGlobalSkill,
    linkSkills,

    // jobs
    fetchJobs,
    createJob,
    updateJob,
    updateJobStatus,
    reorderJobs,
    deleteJob,

    // answers
    fetchAnswers,
    createAnswer,
    updateAnswer,
    deleteAnswer,

    // cover letters
    fetchCoverLetters,
    generateCoverLetter,
    deleteCoverLetter,

    // init
    init,
  }
})
