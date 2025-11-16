/// <reference types="vite/client" />

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}

interface Window {
  ENV?: {
    VITE_API_URL?: string
    VITE_APP_NAME?: string
    VITE_APP_VERSION?: string
    NODE_ENV?: string
  }
}

