# Graph Report - .  (2026-07-12)

## Corpus Check
- 288 files · ~277,690 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1125 nodes · 2291 edges · 70 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 790 · contains: 644 · imports_from: 299 · imports: 134 · PARENT_OF: 126 · ON_BRANCH: 119 · calls: 71 · method: 65 · uses: 7 · connects_to: 4 · implements: 4 · handles: 3 · inherits: 3 · serves: 3 · entry_point: 2 · manages: 2 · accesses: 1 · built_with: 1 · configures: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · generates: 1 · implemented_by: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · routes: 1 · tracks: 1 · ui_for: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 288 · Candidates: 410
- Excluded: 0 untracked · 113064 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `09f486f`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `prisma` - 28 edges
2. `GeminiService` - 27 edges
3. `express` - 25 edges
4. `cache` - 19 edges
5. `express_validator` - 17 edges
6. `AIManager` - 14 edges
7. `authorizeProjectAccess()` - 13 edges
8. `SiteApiService` - 12 edges
9. `AI Integration` - 9 edges
10. `checkAuth()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Portfolio Generation` --uses--> `Portfolio Templates`  [INFERRED]
  README.md → sites/README.md
- `Job Tracker (GoApply)` --implemented_by--> `Chrome Extension (GoApply)`  [INFERRED]
  dashboard/README.md → extension/manifest.json
- `Markdown Editor` --edits--> `Content Blocks`  [INFERRED]
  dashboard/README.md → api/docs/API_DOCUMENTATION.md
- `MinIO Media Storage` --deployed_with--> `Docker Deployment`  [INFERRED]
  api/docs/API_DOCUMENTATION.md → README.md
- `Portfolio Generation` --uses--> `Express REST API`  [INFERRED]
  README.md → api/README.md

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (14): 16d2394 final, 69c514a Basic site loading, 8393c63 Merge branch 'main' of https://github.com/tgmstudios/foligo, c5eb237 WEBSITE, d4b0a64 tes, dfa11ef proper .env, e0f2932 trial addition 1, e51375c devcontainer (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (56): cors, express_rate_limit, helmet, morgan, minio.bucket_name, connectRedis(), additionalCorsOrigins, adminAiModelRoutes (+48 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (12): 1596c73 Voice mode, 16a008d Dark mode, 245df8e Merge branch 'main' of https://github.com/tgmstudios/foligo, 29df55c AI Multistep, 782c5fd fix: prevent router redirect loop on page load, 81238cb Dashboard improvements, 8b7636e Merge branch 'main' of https://github.com/tgmstudios/foligo, 8fa9517 initial api and dash (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (28): 27047d5 readme, baaf15e social media and better ai chatbot experience, Content Blocks, Content Revisions, Express REST API, iOS SwiftUI App, Markdown Editor, Nuxt.js SSR (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (25): Chrome Extension (GoApply), Job Tracker (GoApply), JWT Authentication, SSO/OAuth Authentication, jsonwebtoken, openid_client, { authenticateToken }, { cache } (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (25): 150821f remove old code, 4286262 good ai, { buildContextString, getCurrentDateTime }, buildConversationalSystemPrompt(), buildEditModePrompt(), ai, {
  AI_CONTENT_CREATE_TOOLS,
  AI_CONTENT_EDIT_TOOLS,
  AI_RESUME_CHATBOT_TOOLS
}, { buildConversationalSystemPrompt } (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (1): GeminiService

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (26): main, 09f486f fix: install Tectonic on arm64 builds, 156116a dashboard fix, 3358248 fix, 3b00f25 fix, 3c7f32e fix, 40faf8f Script and Start html files, 40fd685 other options (+18 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (22): fs, multer, path, { authenticateToken, authorizeProjectAccess }, { body, validationResult }, express, multer, path (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (17): ai, aiService, { body, validationResult }, { createResumeEditorTools }, docxService, express, latexCompiler, multer (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (20): crypto, authenticateToken(), crypto, jwt, { prisma }, ai, { authenticateToken }, express (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (11): 241e6c0 fix: kanban drag-save with local reactive columns + add extension to repo, 8f85d95 fix: CI auto-deploy with latest tag, kanban drag, AI CMS Gemini fallback, GoApply branding, GoApplyAPI, Banners, Boards, Consent, Detector, Filler (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (7): 7aa68eb Agentic editor and PDF Latex support, 8dcf942 AI Fixes, deepseek support, AI Merged into goapply, bde1fd9 More AI Repairs, Finder, for, goapplyRoutes, vue_router

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (16): { decrypt }, ensureBootstrapModels(), { prisma }, resolveModel(), toOverrides(), VALID_MODEL_TYPES, VALID_PROVIDER_TYPES, ai (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (6): 3f7125f A lot of new stuff, 893cac6 updates, 9c1c8f0 markdown cooking, b75351a temp, plugin_vue, vite

### Community 15 - "Community 15"
Cohesion: 0.19
Nodes (3): 2f0b6d3 SSO support, ae8be0a Refactored the content editor to use the new Editor Studio. Refactored admin dashboard, router

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (2): f883c97 LATEX Editor, useCommandPaletteStore

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (16): Rate Limiting, Redis Caching, redis, { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma } (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (13): mammoth, pdf_parse, { authorizeProjectAccess, authenticateToken }, { body, validationResult }, { cache }, express, geminiService, mammoth (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (14): http, https, requireAdmin(), { body, validationResult }, { encrypt, decrypt }, express, http, https (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (7): 0c55f26 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 2fe136f feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 4df342b fix: device linking — use dashboard auth directly + exchange 202 for pending, 8726fb0 fix: use default import for api in LinkDevice.vue, b76ca3c fix(ci): use strategic-merge-patch+json to preserve env vars, d2a255c fix: correct logo import in LinkDevice.vue, e660a95 fix: add canvas build deps for alpine dashboard Dockerfile

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (12): ContentBlock, ContentLink, ContentMeta, ContentTag, CreateProjectData, ExperienceRole, Project, ProjectMember (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (13): generative_ai, GENERATION_CONFIG, { HarmBlockThreshold, HarmCategory }, MODEL_CONFIG, RETRY_CONFIG, SAFETY_SETTINGS, SYSTEM_INSTRUCTIONS, calculateDelay() (+5 more)

### Community 23 - "Community 23"
Cohesion: 0.29
Nodes (1): AIManager

### Community 24 - "Community 24"
Cohesion: 0.14
Nodes (13): CoverLetter, GoApplyJob, GoApplyProfile, JOB_STATUSES, JobFormData, JobStatus, KANBAN_COLUMNS, LinkableExperienceCategory (+5 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (9): Content, EditorStudioAdapter, StudioDocumentSummary, StudioMetaFieldSchema, StudioQuickAction, StudioRevisionDetail, StudioRevisionSummary, StudioSaveKind (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.28
Nodes (10): checkAuth(), checkPage(), COLORS, loadAIProviders(), setStatus(), showAuthedState(), showDeviceCodeUI(), showDisconnectedState() (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.21
Nodes (11): index_css, pinia, app, authStore, pinia, LoginCredentials, RegisterData, useAuthStore (+3 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (10): c47de3e New AI resume generator and site-wide touch ups, AI Integration, ElevenLabs Voice, AI Function Calling, Google Gemini AI, Resume Chatbot, Resume Generator, Voice Webhook (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (1): SiteApiService

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (8): client, express, express, prisma, { PrismaClient }, router, prisma, { PrismaClient }

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (11): 0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 1b5ddea feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 3087038 fix: install openssl for Prisma engine in API Dockerfile, 3c9693e fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 413498b fix: pin deployment to SHA-tagged image, not :latest, 517d7df fix: expand onlyBuiltDependencies to cover all workspace packages, 646d8ac fix: use PATCH instead of GET/PUT for deploy (Rancher API compat), 8c303a1 revert: remove CI env var injection — envs stay in K8s (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (9): Docker Deployment, MinIO Media Storage, minio, deleteFile(), ensureBucket(), getFileUrl(), Minio, minioClient (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.24
Nodes (10): AnthropicProvider, { createAnthropic }, { createGoogleGenerativeAI }, { createOpenAICompatible }, createProvider(), GeminiProvider, listProviders(), OPENAI_COMPATIBLE_LABEL (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.25
Nodes (5): GeminiAPIError, GeminiConfigError, GeminiError, GeminiParseError, GeminiValidationError

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (2): Media, MediaListResponse

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (6): ResumeDocument, ResumeDocumentRevisionDetail, ResumeDocumentRevisionSummary, ResumeDocumentSummary, useResumeDocuments(), documentsApi

### Community 40 - "Community 40"
Cohesion: 0.20
Nodes (8): aim, { createAILogger }, { createGeminiLogger }, { createProvider, listProviders }, { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { resolveModel }, { resolveModel, ensureBootstrapModels }, { SAFETY_SETTINGS }

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (8): 0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat, 18576fb fix: Dockerfile monorepo context for pnpm-lock.yaml, 2437013 media library changes, 78f04b9 new readme, a3400e5 Enhance README with new features and setup details, b6526e1 feat: model-agnostic AI layer + signup gate, b8c2cc4 fix: monorepo Dockerfiles + pnpm build scripts approval, f572f42 switch to pnpm

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (9): consoleTransport, createAILogger(), createGeminiLogger(), customFormat, errorFileTransport, fileTransport, logger, winston (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (1): config

### Community 48 - "Community 48"
Cohesion: 0.47
Nodes (8): blogGenerationPrompt(), { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), editGenerationPrompt(), experienceGenerationPrompt(), projectGenerationPrompt(), skillGenerationPrompt()

### Community 49 - "Community 49"
Cohesion: 0.25
Nodes (8): 02f5b3e fix: move jobs/reorder route before jobs/:id, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2b2b612 chore: remove .graphify artifacts, 391098a feat: add TurboRepo with remote cache for faster CI builds, 577f1c6 ci: switch to self-hosted ARC runners (tgmstudios-runners), 5f2a237 Fix AIManager fallback chain with real health checks, 91c072c Add graphify knowledge graph and AGENTS.md, e52477f Fix empty chat history crash and remove hardcoded Gemini for function calling

### Community 50 - "Community 50"
Cohesion: 0.25
Nodes (8): 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b34879 fix: load api.js in popup context so account connect UI works, 9cff0d3 fix: add -k flag for Rancher self-signed cert, ba00164 fix: use -u basic auth instead of Bearer for Rancher API, c1c1833 fix(ci): use K8s native API path instead of broken Steve API PATCH, ccd62cc fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge, f645d9c fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, fd79a40 fix: deploy script with proper bash syntax, pre-computed timestamp, no nested date

### Community 53 - "Community 53"
Cohesion: 0.25
Nodes (7): authorizeProjectAccess(), { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 54 - "Community 54"
Cohesion: 0.25
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 55 - "Community 55"
Cohesion: 0.29
Nodes (4): axios, aiApi, api, toast

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (6): express_validator, { body, validationResult }, { cache }, express, { prisma }, router

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (6): { body, validationResult, query }, { cache }, express, { prisma }, { requireAdmin }, router

### Community 58 - "Community 58"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 59 - "Community 59"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 60 - "Community 60"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 61 - "Community 61"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 64 - "Community 64"
Cohesion: 0.33
Nodes (6): compile(), crypto, os, path, runTectonic(), { spawn }

### Community 65 - "Community 65"
Cohesion: 0.40
Nodes (3): resumeAdapter, adapters, registerAdapter()

### Community 66 - "Community 66"
Cohesion: 0.33
Nodes (4): bcryptjs, bcrypt, prisma, { PrismaClient }

### Community 67 - "Community 67"
Cohesion: 0.33
Nodes (3): AgenticChatCallbacks, AgenticChatMessage, ToolActivity

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (4): PostgreSQL Database, Prisma ORM, connectDatabase(), { PrismaClient }

### Community 69 - "Community 69"
Cohesion: 0.33
Nodes (1): TemplateSelector

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (4): 0541f93 cors fix, 2457110 fixed, 8a75c5b new api stuff, 9e83a1d fix sites

### Community 73 - "Community 73"
Cohesion: 0.40
Nodes (5): 15c176e fix: OpenCode reasoning model support + route collision fix, 2e0b15f feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 49075f5 feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, 7641985 fix: reasoning model detection + auto-double token budget, c935419 fix: remove double-token for reasoning models (caused 504 timeouts)

### Community 74 - "Community 74"
Cohesion: 0.40
Nodes (5): 404f746 Final Changes, 8ad0083 final, ab25160 Merge branch 'main' of https://github.com/tgmstudios/foligo, c038a1b added bad site, dec7f43 pushing demo site

### Community 75 - "Community 75"
Cohesion: 0.60
Nodes (3): start(), startup(), tryActivate()

### Community 79 - "Community 79"
Cohesion: 0.50
Nodes (1): e23aa71 Good for prod

### Community 80 - "Community 80"
Cohesion: 0.83
Nodes (2): loadEnvForm(), toggleCustomFields()

### Community 83 - "Community 83"
Cohesion: 0.67
Nodes (1): MERMAID_THEME_VARIABLES

### Community 85 - "Community 85"
Cohesion: 1.00
Nodes (1): docxtemplater

### Community 86 - "Community 86"
Cohesion: 1.00
Nodes (1): pizzip

## Knowledge Gaps
- **378 isolated node(s):** `{ PrismaClient }`, `prisma`, `express`, `cors`, `helmet` (+373 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 6`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `f883c97 LATEX Editor`, `useCommandPaletteStore`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `Media`, `MediaListResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `TemplateSelector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `e23aa71 Good for prod`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (2 nodes): `loadEnvForm()`, `toggleCustomFields()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `MERMAID_THEME_VARIABLES`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `docxtemplater`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `pizzip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GeminiService` connect `Community 6` to `Community 5`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 23` to `Community 40`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `SiteApiService` connect `Community 31` to `Community 0`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `{ PrismaClient }`, `prisma`, `express` to the rest of the system?**
  _378 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05966386554621849 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.034482758620689655 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06653225806451613 - nodes in this community are weakly interconnected._
