import type { Content } from '@/types/project'

export type ContentTypeName = Content['type']

const CONTENT_TYPES: readonly ContentTypeName[] = ['PROJECT', 'BLOG', 'EXPERIENCE', 'SKILL']

// The API's Content model has a `status` enum, not an `isPublished` flag
// (isPublished exists only on Project).
export const isContentPublished = (content: { status?: string }): boolean =>
  content.status === 'PUBLISHED'

export interface NormalizedProjectLinks {
  github: string
  devpost: string
  other: string[]
}

// API returns projectLinks as free-form JSON ({ github, devpost, other[] }) that may be
// null or partial; forms need every key present.
export const normalizeProjectLinks = (
  links?: { github?: string; devpost?: string; other?: string[] } | null,
): NormalizedProjectLinks => ({
  github: links?.github ?? '',
  devpost: links?.devpost ?? '',
  other: links?.other ?? [],
})

// Validate a route param against the known content types (case-insensitive).
export const parseContentType = (value: string): ContentTypeName | null => {
  const upper = value.toUpperCase()
  return (CONTENT_TYPES as readonly string[]).includes(upper) ? (upper as ContentTypeName) : null
}
