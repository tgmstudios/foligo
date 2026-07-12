import { marked } from 'marked'
import mermaid from 'mermaid'

export const MERMAID_THEME_VARIABLES = {
  primaryColor: '#3b82f6',
  primaryTextColor: '#f3f4f6',
  primaryBorderColor: '#60a5fa',
  lineColor: '#9ca3af',
  secondaryColor: '#1f2937',
  tertiaryColor: '#111827',
  background: '#1f2937',
  mainBkgColor: '#1f2937',
  secondBkgColor: '#111827',
  textColor: '#f3f4f6',
  border1: '#374151',
  border2: '#4b5563',
  arrowheadColor: '#60a5fa',
  clusterBkg: '#111827',
  clusterBorder: '#374151',
  defaultLinkColor: '#60a5fa',
  titleColor: '#ffffff',
  edgeLabelBackground: '#1f2937',
  actorBorder: '#374151',
  actorBkg: '#1f2937',
  actorTextColor: '#f3f4f6',
  actorLineColor: '#9ca3af',
  signalColor: '#f3f4f6',
  signalTextColor: '#f3f4f6',
  labelBoxBkgColor: '#111827',
  labelBoxBorderColor: '#374151',
  labelTextColor: '#f3f4f6',
  loopTextColor: '#f3f4f6',
  noteBorderColor: '#374151',
  noteBkgColor: '#111827',
  noteTextColor: '#f3f4f6',
  activationBorderColor: '#60a5fa',
  activationBkgColor: '#1e40af',
  sequenceNumberColor: '#ffffff',
  sectionBkgColor: '#111827',
  altBkgColor: '#1f2937',
  sectionBkgColor2: '#111827',
  excludeBkgColor: '#374151',
  taskBorderColor: '#374151',
  taskBkgColor: '#1f2937',
  taskTextLightColor: '#f3f4f6',
  taskTextColor: '#f3f4f6',
  taskTextDarkColor: '#ffffff',
  taskTextOutsideColor: '#9ca3af',
  taskTextClickableColor: '#60a5fa',
  activeTaskBorderColor: '#60a5fa',
  activeTaskBkgColor: '#1e40af',
  gridColor: '#374151',
  doneTaskBkgColor: '#065f46',
  doneTaskBorderColor: '#10b981',
  critBorderColor: '#ef4444',
  critBkgColor: '#7f1d1d',
}

let configured = false

/** Registers the ```mermaid fenced-block extension on marked's shared/global
 *  instance and initializes mermaid's dark theme. Idempotent — safe to call
 *  from every component that renders markdown (MarkdownEditor, MarkdownPreview),
 *  since `marked` and `mermaid` are both module-level singletons and this only
 *  needs to happen once per page regardless of which component loads first. */
export function configureMarkedForMermaid() {
  if (configured) return
  configured = true

  marked.setOptions({ breaks: true, gfm: true })

  marked.use({
    extensions: [{
      name: 'mermaid',
      level: 'block',
      start(src: string) {
        return src.match(/^```mermaid/)?.index
      },
      tokenizer(src: string) {
        const match = src.match(/^```mermaid\n([\s\S]*?)\n```/)
        if (match) {
          return { type: 'mermaid', raw: match[0], text: match[1].trim() }
        }
        return undefined
      },
      renderer(token: any) {
        return `<div class="mermaid">${token.text}</div>\n`
      },
    }],
  })

  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: MERMAID_THEME_VARIABLES,
  })
}
