import { useProjectStore } from '@/stores/projects'
import { formatContentType } from '@/utils'
import type { CommandPaletteSource } from '@/components/shared/CommandPalette.vue'

/** The two search sources every dashboard page + the Editor Studio share:
 *  projects and their content, filtered client-side over already-loaded data
 *  (same approach the old inline DashboardLayout search used). */
export function useDashboardSearchSources(): CommandPaletteSource[] {
  const projectStore = useProjectStore()

  return [
    {
      id: 'projects',
      label: 'Projects',
      async search(q) {
        const query = q.toLowerCase()
        return projectStore.projects
          .filter((project) =>
            project.name.toLowerCase().includes(query) ||
            (project.description && project.description.toLowerCase().includes(query))
          )
          .map((project) => ({
            id: project.id,
            type: 'project',
            title: project.name,
            subtitle: project.description || 'No description',
            route: `/portfolios/${project.id}`,
          }))
      },
    },
    {
      id: 'content',
      label: 'Content',
      async search(q) {
        const query = q.toLowerCase()
        const results: Array<{ id: string; type: string; title: string; subtitle: string; route: string }> = []
        for (const project of projectStore.projects) {
          for (const content of project.content || []) {
            if (
              content.title.toLowerCase().includes(query) ||
              content.excerpt?.toLowerCase().includes(query) ||
              content.content.toLowerCase().includes(query)
            ) {
              results.push({
                id: content.id,
                type: 'post',
                title: content.title,
                subtitle: `${formatContentType(content.type)} in ${project.name}`,
                route: `/portfolios/${project.id}/content/${content.id}/edit`,
              })
            }
          }
        }
        return results
      },
    },
  ]
}
