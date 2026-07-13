// ── Project & Content domain types ──────────────────────────────────────
// Extracted from stores/projects.ts so they can be imported without pulling
// in the Pinia store itself. stores/projects.ts re-exports these for
// backwards compatibility with existing `import { X } from '@/stores/projects'`
// call sites.

export interface Project {
  id: string
  name: string
  description?: string
  ownerId: string
  subdomain?: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  owner?: {
    id: string
    name: string
    email: string
  }
  members?: ProjectMember[]
  content?: Content[]
  siteConfig?: SiteConfig
  _count?: {
    content: number
    members: number
    media: number
  }
}

export interface SiteConfig {
  id: string
  projectId: string
  siteName?: string
  siteDescription?: string
  profileName?: string
  profileBio?: string
  profileImage?: string
  socialLinks?: {
    twitter?: string
    github?: string
    linkedin?: string
    instagram?: string
  } | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  indexLayout: string
  archiveLayout: string
  singleLayout: string
  metaTitle?: string
  metaDescription?: string
  favicon?: string
  layoutConfig?: any
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: 'ADMIN' | 'EDITOR' | 'VIEWER'
  user: {
    id: string
    name: string
    email: string
  }
}

export interface Content {
  id: string
  projectId: string
  type: 'PROJECT' | 'BLOG' | 'EXPERIENCE' | 'SKILL'
  contentType: string
  title: string
  slug?: string
  excerpt?: string
  content: string // Markdown content
  metadata?: any // Additional metadata (deprecated, use meta instead)
  order: number
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'REVISION'
  revisionOf?: string
  revisionNumber?: number
  revisedAt?: string
  createdAt: string
  updatedAt: string
  projectName?: string

  // Project-specific fields
  startDate?: string
  endDate?: string
  isOngoing?: boolean
  featuredImage?: string
  projectLinks?: {
    github?: string
    devpost?: string
    other?: string[]
  }
  contributors?: string[]

  // Experience-specific fields
  experienceCategory?: 'JOB' | 'EDUCATION' | 'CERTIFICATION'
  location?: string
  locationType?: 'REMOTE' | 'HYBRID' | 'ONSITE'

  // Relationships
  tags?: ContentTag[]
  meta?: ContentMeta[]
  blocks?: ContentBlock[]
  roles?: ExperienceRole[]
  linkedProjects?: Project[]
  linkedSkills?: Skill[]
  linkedExperiences?: Content[]
  linkedBlogs?: Content[]
  revisions?: Content[]
  parentContent?: Content
}

export interface ContentLink {
  id: string
  sourceId: string
  targetId: string
  sourceType: 'content' | 'project'
  targetType: 'content' | 'project'
  linkType: string
  createdAt: string
  updatedAt: string
}

export interface ContentTag {
  id: string
  name: string
  category?: string
  createdAt: string
  updatedAt: string
}

export interface ContentMeta {
  id: string
  key: string
  value: string
  contentType?: string
  contentId?: string
  projectId?: string
  createdAt: string
  updatedAt: string
}

export interface ContentBlock {
  id: string
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CODE' | 'LINK' | 'EMBED' | 'GALLERY' | 'QUOTE' | 'CUSTOM'
  content: string
  order: number
  contentId: string
  createdAt: string
  updatedAt: string
}

export interface Skill {
  id: string
  name: string
  category?: string
  createdAt: string
  updatedAt: string
}

export interface ExperienceRole {
  id: string
  contentId: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  createdAt: string
  updatedAt: string
  skills?: Skill[]
}

export interface CreateProjectData {
  name: string
  description?: string
  subdomain?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  subdomain?: string
}
