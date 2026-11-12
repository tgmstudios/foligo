export const MAX_CHAT_ATTACHMENTS = 5

export function appendAttachments(current: File[], incoming: File[]): File[] {
  return [...current, ...incoming].slice(0, MAX_CHAT_ATTACHMENTS)
}
