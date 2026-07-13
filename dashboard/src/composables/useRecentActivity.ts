import { computed, type Ref } from 'vue'
import { formatContentType } from '@/utils'
import type { Project } from '@/types/project'

export interface ActivityItem {
  type: string
  title: string
  description: string
  timestamp: Date
  color: string
  icon: string
}

const PROJECT_ICON =
  'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'

const CONTENT_ICON =
  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'

/**
 * Builds a mixed activity feed (project + content events) from a list of
 * projects. Extracted from stores/projects.ts's `recentActivity` getter.
 */
export function useRecentActivity(projects: Ref<Project[]>) {
  const recentActivity = computed<ActivityItem[]>(() => {
    const activities: ActivityItem[] = []

    projects.value.forEach((project) => {
      // Project activities
      activities.push({
        type: 'project',
        title: project.name,
        description: 'Project ' + (project.isPublished ? 'published' : 'updated'),
        timestamp: new Date(project.updatedAt),
        color: 'blue',
        icon: PROJECT_ICON
      })

      // Content activities - filter out revisions
      if (project.content) {
        project.content.forEach((content) => {
          // Only include real posts, not revisions
          if (content.status !== 'REVISION' && !content.revisionOf) {
            activities.push({
              type: 'content',
              title: content.title,
              description: formatContentType(content.type) + ' created in ' + project.name,
              timestamp: new Date(content.updatedAt),
              color: 'green',
              icon: CONTENT_ICON
            })
          }
        })
      }
    })

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
  })

  return { recentActivity }
}
