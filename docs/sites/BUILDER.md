# Site builder

Open **Sites** in the dashboard, create a site or open an existing one. Existing portfolio templates remain active until a builder document is published. Public sites continue using the existing Nuxt host and subdomain routing; this feature does not require a separate hosting service.

## Access and collaboration

Sites belong to projects. The existing project owner and membership records are authoritative. Viewers read drafts and preview; editors change drafts and upload project media; admins and owners publish/unpublish and manage existing account memberships. Membership grants access immediately, with no email invitation workflow. The owner cannot be removed through membership controls.

Saving uses a project-scoped atomic revision comparison. A stale save or publication returns HTTP 409. The editor preserves the local draft and offers JSON export and reload. There is no live cursor, presence, or simultaneous document merge. Autosave is debounced; save failures leave the draft in memory and warn before navigation. Use export for a durable local backup.

## Editing

Eleven general-purpose block types support drag insertion/reordering, keyboard/touch layer arrows, duplication, deletion, alignment, spacing, and color treatments. Features, galleries and FAQs have editable item lists. Pages have independent names, paths and SEO metadata. Global styles include colors and font families. Desktop/tablet/mobile previews use the same Vue renderer as the public site. Image uploads use the existing project media API; contact blocks use email/action links rather than storing form submissions. Undo/redo retains up to 80 in-session changes. JSON import validates before replacing a draft.

Three starter templates are included. Publication snapshots the saved draft, increments the revision, and retains the last ten publications for restoration to a draft. Restoring and importing do not directly change the live site. Public API responses exclude draft and history data.

## Deployment

Deploy API, dashboard and sites together. Apply the additive migration `20261106230000_site_builder` and regenerate Prisma before starting the updated API. The existing API container entrypoint runs `prisma migrate deploy` and client generation. Existing site data is retained; no backfill is required. Dashboard Docker builds copy the shared public renderer and utility modules from `sites/`.

No production deployment or database migration is performed by local build/tests. Existing CI/container deployment remains the release path.

## Validation

- API: `pnpm --filter foligo-api exec jest --runInBand src/routes/projects/site-builder.test.js src/routes/projects/site-builder-public.test.js src/middleware/auth.authorize-project.test.js`
- Site contracts: `node --test sites/tests/*.mjs`
- Browser: `PLAYWRIGHT_MODULE=/path/to/playwright node dashboard/tests/site-builder.browser.cjs http://127.0.0.1:5173` (mock API; no live database writes)
- Builds: `pnpm --filter foligo-dashboard build` and `pnpm --filter foligo-sites build`

This is a section-based builder. Nested arbitrary layouts, custom code execution, ecommerce, a form submission inbox, custom domain provisioning, and real-time merging are not implemented.

## Content archive and single-post templates

In the editor, open **Pages → Content templates**. Blog posts, projects, experience entries, and skills each have independent **Archive** and **Single post** editors. These templates use the same drag-and-drop canvas, theme, undo/redo, draft/publish flow, and publication history as static pages. Editing a template changes the layout for every published post of that type; it does not change post content.

Archive templates include a dynamic **Post list** block with grid/list layout, pagination (1–48 posts per page), and featured image, excerpt, and date visibility controls. Single templates include dynamic **Post header** and **Post content** blocks; ordinary blocks can be inserted around them. Single templates have a published-post preview selector and use a sample if no published posts exist. Draft and hidden posts are excluded. Post Markdown uses the Sites-owned renderer and HTML allowlist; links, images and media URLs are checked. See [Sites Markdown](MARKDOWN.md) for the complete content feature inventory.

Template URLs are fixed by content type: `/blog`, `/projects`, `/experiences`, `/skills`, and their `/:slug` single-post URLs. Static pages remain separate. If a static page already occupies an archive URL, rename/remove that page before creating the archive template. Existing builder documents receive default public content templates without migration; customized templates are persisted in the same site document. Missing posts and URLs with extra segments return 404s.

SEO title/description fields accept `{{title}}`, `{{excerpt}}`, and `{{siteName}}`. Empty single-post metadata uses the current post’s title/excerpt.

Additional validation:

- Content editor browser flow: `PLAYWRIGHT_MODULE=/path/to/playwright node dashboard/tests/site-builder-content.browser.cjs http://127.0.0.1:5173`
- Public rendering after the Sites build: `node sites/tests/builder-content.ssr.cjs` (starts a local mock API and production Sites server; no database writes)
