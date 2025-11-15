import api from './api'
import type { AxiosProgressEvent } from 'axios'

export interface Media {
  id: string
  userId: string
  projectId: string | null
  filename: string
  mimeType: string
  size: number
  objectName: string
  publicUrl: string
  altText: string | null
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
  }
  project?: {
    id: string
    name: string
  }
}

export interface MediaListResponse {
  media: Media[]
  total: number
  limit: number
  offset: number
}

// Upload media file
export async function uploadMedia(
  file: File,
  projectId?: string,
  altText?: string,
  onProgress?: (progress: number) => void
): Promise<Media> {
  const formData = new FormData()
  formData.append('file', file)
  if (altText) {
    formData.append('altText', altText)
  }

  const endpoint = projectId 
    ? `/projects/${projectId}/media`
    : '/media'

  const response = await api.post<Media>(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent: AxiosProgressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    }
  })

  return response.data
}

// List media files
export async function listMedia(params?: {
  projectId?: string
  mimeType?: string
  limit?: number
  offset?: number
}): Promise<MediaListResponse> {
  const endpoint = params?.projectId
    ? `/projects/${params.projectId}/media`
    : '/media'

  const response = await api.get<MediaListResponse>(endpoint, {
    params: {
      mimeType: params?.mimeType,
      limit: params?.limit || 50,
      offset: params?.offset || 0
    }
  })

  return response.data
}

// Get media by ID
export async function getMedia(id: string): Promise<Media> {
  const response = await api.get<Media>(`/media/${id}`)
  return response.data
}

// Update media metadata
export async function updateMedia(id: string, data: { altText?: string }): Promise<Media> {
  const response = await api.put<Media>(`/media/${id}`, data)
  return response.data
}

// Delete media
export async function deleteMedia(id: string): Promise<void> {
  await api.delete(`/media/${id}`)
}

// Check if file is an image
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

// Check if file is a video
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

