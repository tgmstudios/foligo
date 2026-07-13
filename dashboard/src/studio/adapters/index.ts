import { registerAdapter } from '@/studio/registry'
import { resumeAdapter } from '@/studio/adapters/resume'
import { coverLetterAdapter } from '@/studio/adapters/cover-letter'

registerAdapter(resumeAdapter)
registerAdapter(coverLetterAdapter)
