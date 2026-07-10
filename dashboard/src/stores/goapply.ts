import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import api, { aiApi } from '@/services/api'

// ── Types ──────────────────────────────────────────────────────────────

export interface GoApplyProfile {
  id?: string
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  portfolio: string
  skills: string[]
}

export interface GoApplyJob {
  id: string
  company: string
  position: string
  url: string
  notes: string
  status: JobStatus
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
  category: string
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
  status: JobStatus
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
    try {
      isSaving.value = true
      // Backend uses PUT /api/goapply/profile (upsert)
      const { data: result } = await api.put('/goapply/profile', data)
      profile.value = result
      toast.success('Profile saved')
      return result
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save profile')
      throw err
    } finally {
      isSaving.value = false
    }
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
    try {
      isSaving.value = true
      const { data } = await api.post('/goapply/jobs', form)
      jobs.value.unshift(data)
      toast.success('Job created')
      return data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create job')
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function updateJob(id: string, form: Partial<JobFormData>) {
    try {
      isSaving.value = true
      const { data } = await api.put(`/goapply/jobs/${id}`, form)
      const idx = jobs.value.findIndex((j) => j.id === id)
      if (idx !== -1) jobs.value[idx] = data
      toast.success('Job updated')
      return data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update job')
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function updateJobStatus(id: string, status: JobStatus) {
    return updateJob(id, { status } as any)
  }

  async function deleteJob(id: string) {
    try {
      await api.delete(`/goapply/jobs/${id}`)
      jobs.value = jobs.value.filter((j) => j.id !== id)
      toast.success('Job deleted')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete job')
      throw err
    }
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

  async function createAnswer(form: { question: string; answer: string; category: string }) {
    try {
      isSaving.value = true
      const { data } = await api.post('/goapply/answers', form)
      answers.value.unshift(data)
      toast.success('Answer saved')
      return data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save answer')
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function updateAnswer(id: string, form: { question: string; answer: string; category: string }) {
    try {
      isSaving.value = true
      const { data } = await api.put(`/goapply/answers/${id}`, form)
      const idx = answers.value.findIndex((a) => a.id === id)
      if (idx !== -1) answers.value[idx] = data
      toast.success('Answer updated')
      return data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update answer')
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deleteAnswer(id: string) {
    try {
      await api.delete(`/goapply/answers/${id}`)
      answers.value = answers.value.filter((a) => a.id !== id)
      toast.success('Answer deleted')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete answer')
      throw err
    }
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
    try {
      isGenerating.value = true
      const { data } = await aiApi.post('/ai/cover-letter', {
        jobId,
        jobDescription,
      })
      if (data) {
        coverLetters.value.unshift(data)
        toast.success('Cover letter generated')
      }
      return data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate cover letter')
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  async function deleteCoverLetter(id: string) {
    try {
      await api.delete(`/goapply/cover-letters/${id}`)
      coverLetters.value = coverLetters.value.filter((c) => c.id !== id)
      toast.success('Cover letter deleted')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete cover letter')
      throw err
    }
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

    // jobs
    fetchJobs,
    createJob,
    updateJob,
    updateJobStatus,
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
