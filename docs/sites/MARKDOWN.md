# Sites Markdown

Sites owns `sites/utils/site-markdown.mjs` and `sites/components/SitesMarkdown.vue`. Builder post templates, ordinary builder Text blocks, and legacy public portfolios use this component. Text block inspector fields accept Markdown directly. The builder preview reuses the Sites component, rather than importing Studio’s renderer. The old `markdownRenderer.js` and `builder-markdown.mjs` entry points are compatibility re-exports of the same implementation.

The parser creates its own `Marked` instance and never calls `marked.use()` on the dashboard singleton. HTML is parsed and serialized through an explicit allowlist using parse5, identically during server rendering and in the browser. Styling belongs to the Sites component and follows the public site’s colors.

## Foligo content feature inventory

| Feature | Existing Foligo source | Sites behavior |
| --- | --- | --- |
| Headings, bold, italic, quotes, nested ordered/unordered lists | `dashboard/src/components/studio/InsertMenuFlyout.vue`, `MarkdownCodeEditor.vue` | Semantic HTML and site typography; deterministic heading anchors |
| Strikethrough, task lists, autolinks, reference links, line breaks, horizontal rules | GFM options in `dashboard/src/lib/markdown.ts` and `markdownMermaid.ts` | GFM rendering, disabled task checkboxes, checked URLs |
| Inline code, fenced code, tables | Insert menu and editor insertion methods | Separate inline/block styling, copy buttons, language labels, accessible horizontally scrolling tables with alignment |
| Links, images, attached documents | `ContentStudioView.vue` media selection, `MarkdownCodeEditor.vue` paste handling | Lazy images with alt/title text; HTTP, email, telephone, fragment and relative attachment links |
| Emoji | Insert menu and editor text insertion | Unicode preserved |
| Mermaid flowcharts, timelines and other Mermaid diagram types | `markdownMermaid.ts`, `MarkdownPreview.vue`, AI content-generation prompts | SSR source fallback; lazy client diagrams with strict rendering; malformed diagrams retain readable source and do not break the rest of the post |
| Draw.io diagrams | `ContentStudioView.vue` diagram save, `DrawIOEditor.vue` | Exported PNG displays; companion `drawio` fences are editing metadata and are omitted from visible output |
| Pasted video | `MarkdownCodeEditor.vue` video paste handling | Native responsive video player with controls, safe sources/posters/caption tracks |
| Audio and file uploads | Media library types | Native audio player for authored `<audio>` markup; file links remain downloadable/navigable links |
| Inline/block HTML in Markdown | Marked’s existing HTML support | Allowed formatting such as underline, highlight, sub/superscript, keyboard text, figures and disclosures; event handlers, styles, scripts and arbitrary active markup do not execute |
| Video embed markup | Existing generic embed content capability | YouTube/YouTube Privacy-Enhanced/Vimeo embed URLs only, with sandboxed frames; arbitrary iframe providers are omitted |

Mermaid rendering is client-only. Until enhancement completes (or if it fails), readers can still see the diagram source. Successful diagrams retain a collapsible source disclosure. A queued Sites wrapper applies strict settings during rendering and restores the Mermaid engine’s previous configuration afterward.

## Verification

- `node --test sites/tests/*.mjs`
- Build Sites, then run `PLAYWRIGHT_MODULE=/path/to/playwright node sites/tests/site-markdown.browser.cjs`. This checks builder and legacy public pages using a local mock API and production Sites server, with no database writes.
- `pnpm --filter foligo-sites build`
- `pnpm --filter foligo-dashboard build`

The dashboard Docker build copies the Sites component and utilities. Both packages declare parse5 explicitly, and Turbo includes shared Sites renderer files in its cache inputs.
