// Make sure Nuxt's type definitions are available
export {}

// Declare the definePageMeta function globally
declare global {
  const definePageMeta: (meta: {
    title?: string
    description?: string
    layout?: string | false
  }) => void
}