import api from '@/services/api'
import type { Content } from '@/stores/projects'

/**
 * Authenticated content for one project (includes DRAFT/HIDDEN, excludes revision rows).
 * Never use GET /projects/:id/content here: that route is the anonymous public feed, which is
 * PUBLISHED-only and 404s for unpublished projects.
 */
export async function fetchProjectContent(projectId: string): Promise<Content[]> {
  const response = await api.get('/projects')
  const data = response.data || {}
  const all = [...(data.ownedProjects || []), ...(data.memberProjects || [])]
  const project = all.find((p: { id: string }) => p.id === projectId)
  return Array.isArray(project?.content) ? project.content : []
}
