// Environment variables
export const config = {
  API_URL: import.meta.env.VITE_API_URL || '/api',
  APP_NAME: 'Foligo Dashboard',
  VERSION: '1.0.0'
}

// Utility functions
export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

export const formatDateTime = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export const truncateText = (text: string, length: number = 100) => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

export const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Format content types for display
export const formatContentType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'PROJECT': 'Project',
    'BLOG': 'Blog',
    'EXPERIENCE': 'Experience',
    'SKILL': 'Skill',
    'CONTENT': 'Content'
  }
  return typeMap[type] || type
}

// Format content status for display
export const formatContentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'DRAFT': 'Draft',
    'PUBLISHED': 'Published',
    'HIDDEN': 'Hidden',
    'REVISION': 'Revision'
  }
  return statusMap[status] || status
}

// Format link types for display
export const formatLinkType = (linkType: string): string => {
  const linkTypeMap: Record<string, string> = {
    'related': 'Related',
    'parent': 'Parent',
    'child': 'Child',
    'sibling': 'Sibling'
  }
  return linkTypeMap[linkType.toLowerCase()] || linkType
}