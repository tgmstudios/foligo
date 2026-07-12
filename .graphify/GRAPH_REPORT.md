# Graph Report - .  (2026-07-12)

## Corpus Check
- 272 files · ~267,243 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1050 nodes · 2143 edges · 64 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 743 · contains: 587 · imports_from: 279 · PARENT_OF: 122 · imports: 120 · ON_BRANCH: 115 · calls: 69 · method: 65 · uses: 7 · connects_to: 4 · implements: 4 · handles: 3 · inherits: 3 · serves: 3 · entry_point: 2 · manages: 2 · accesses: 1 · built_with: 1 · configures: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · generates: 1 · implemented_by: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · routes: 1 · tracks: 1 · ui_for: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 272 · Candidates: 332
- Excluded: 80 untracked · 113044 ignored · 1 sensitive · 4 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `9030aa4`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `GeminiService` - 27 edges
2. `prisma` - 26 edges
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

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (8): { PrismaClient }, prisma, express, router, { PrismaClient }, prisma, client, express

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (56): express, cors, helmet, morgan, rateLimit, swaggerUi, swaggerJsdoc, authRoutes (+48 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (16): jwt, crypto, { prisma }, authenticateToken(), requireAdmin(), express, { body, validationResult, query }, { prisma } (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (14): authorizeProjectAccess(), express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router, express (+6 more)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (45): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, ai, { createContentEditorTools }, router (+37 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (14): express, { body, validationResult }, { prisma }, { requireAdmin }, { encrypt, decrypt }, https, http, router (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (14): express, { body, validationResult }, multer, mammoth, pdfParseModule, { prisma }, { cache }, { authorizeProjectAccess, authenticateToken } (+6 more)

### Community 40 - "Community 40"
Cohesion: 0.20
Nodes (9): express, bcrypt, jwt, crypto, { body, validationResult }, { prisma }, { cache }, { authenticateToken } (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (16): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router, express, { body, validationResult } (+8 more)

### Community 49 - "Community 49"
Cohesion: 0.25
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 52 - "Community 52"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (25): express, jwt, { prisma }, { cache }, { authenticateToken }, router, PROFILE_PASSTHROUGH_FIELDS, EXPERIENCE_INCLUDE (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (22): express, multer, { v4: uuidv4 }, path, { body, validationResult }, { prisma }, { uploadFile, deleteFile, getFileUrl, minioClient, BUCKET_NAME }, { authenticateToken, authorizeProjectAccess } (+14 more)

### Community 55 - "Community 55"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (17): express, { body, validationResult }, path, { prisma }, ai, latexCompiler, { createResumeEditorTools }, router (+9 more)

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (10): express, router, geminiService, { prisma }, { cache }, { PrismaClient }, prisma, connectDatabase() (+2 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (9): ai, AIService, AI Integration, Google Gemini AI, ElevenLabs Voice, Resume Generator, Voice Webhook, AI Function Calling (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.20
Nodes (8): aim, { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { createProvider, listProviders }, { resolveModel, ensureBootstrapModels }, { createAILogger }, { SAFETY_SETTINGS }, { resolveModel }, { createGeminiLogger }

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (1): AIManager

### Community 35 - "Community 35"
Cohesion: 0.24
Nodes (10): { createGoogleGenerativeAI }, { createAnthropic }, { createOpenAICompatible }, PRESETS, OPENAI_COMPATIBLE_LABEL, createProvider(), listProviders(), GeminiProvider (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.47
Nodes (8): { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), projectGenerationPrompt(), experienceGenerationPrompt(), blogGenerationPrompt(), skillGenerationPrompt(), editGenerationPrompt()

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (12): { buildContextString, getCurrentDateTime }, buildConversationalSystemPrompt(), buildEditModePrompt(), { tool }, { z }, AI_CONTENT_CREATE_TOOLS, AI_CONTENT_EDIT_TOOLS, AI_RESUME_CHATBOT_TOOLS (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.25
Nodes (5): GeminiError, GeminiConfigError, GeminiAPIError, GeminiParseError, GeminiValidationError

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (18): { HarmBlockThreshold, HarmCategory }, MODEL_CONFIG, GENERATION_CONFIG, SAFETY_SETTINGS, SYSTEM_INSTRUCTIONS, RETRY_CONFIG, { createAILogger }, { fallbackQuestions, utilityPrompts } (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (1): GeminiService

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (6): { spawn }, os, path, crypto, compile(), runTectonic()

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (9): winston, customFormat, consoleTransport, fileTransport, errorFileTransport, logger, createAILogger(), createGeminiLogger() (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (9): Minio, minioClient, ensureBucket(), uploadFile(), deleteFile(), getFileUrl(), minio, MinIO Media Storage (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.29
Nodes (3): { buildContextString }, buildResumeChatbotSystemPrompt(), e23aa71 Good for prod

### Community 57 - "Community 57"
Cohesion: 0.43
Nodes (6): { GeminiAPIError }, { RETRY_CONFIG }, isRetryableError(), calculateDelay(), sleep(), retryWithBackoff()

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (12): documentsApi, resumeAdapter, adapters, registerAdapter(), StudioDocumentSummary, StudioSaveKind, StudioSaveResult, StudioMetaFieldSchema (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.20
Nodes (8): 0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat, 18576fb fix: Dockerfile monorepo context for pnpm-lock.yaml, 2437013 media library changes, 78f04b9 new readme, a3400e5 Enhance README with new features and setup details, b6526e1 feat: model-agnostic AI layer + signup gate, b8c2cc4 fix: monorepo Dockerfiles + pnpm build scripts approval, f572f42 switch to pnpm

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (2): useCommandPaletteStore, f883c97 LATEX Editor

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (3): ToolActivity, AgenticChatMessage, AgenticChatCallbacks

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (13): Project, SiteConfig, ProjectMember, Content, ContentLink, ContentTag, ContentMeta, ContentBlock (+5 more)

### Community 59 - "Community 59"
Cohesion: 0.47
Nodes (5): ResumeDocumentSummary, ResumeDocument, ResumeDocumentRevisionSummary, ResumeDocumentRevisionDetail, useResumeDocuments()

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (7): goapplyRoutes, for, 7aa68eb Agentic editor and PDF Latex support, 8dcf942 AI Fixes, deepseek support, AI Merged into goapply, 9030aa4 Move old content, bde1fd9 More AI Repairs, vue_router

### Community 26 - "Community 26"
Cohesion: 0.21
Nodes (11): app, pinia, authStore, User, LoginCredentials, RegisterData, useAuthStore, index_css (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.29
Nodes (4): toast, api, aiApi, axios

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (2): Media, MediaListResponse

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (13): LinkableExperienceCategory, GoApplyProfile, GoApplyJob, JobStatus, SavedAnswer, CoverLetter, JobFormData, JOB_STATUSES (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (1): config

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (7): 0c55f26 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 2fe136f feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 4df342b fix: device linking — use dashboard auth directly + exchange 202 for pending, 8726fb0 fix: use default import for api in LinkDevice.vue, b76ca3c fix(ci): use strategic-merge-patch+json to preserve env vars, d2a255c fix: correct logo import in LinkDevice.vue, e660a95 fix: add canvas build deps for alpine dashboard Dockerfile

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (5): 15c176e fix: OpenCode reasoning model support + route collision fix, 2e0b15f feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 49075f5 feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, 7641985 fix: reasoning model detection + auto-double token budget, c935419 fix: remove double-token for reasoning models (caused 504 timeouts)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (9): GoApplyAPI, Banners, Boards, Consent, Detector, Tutorial, UI, 241e6c0 fix: kanban drag-save with local reactive columns + add extension to repo (+1 more)

### Community 70 - "Community 70"
Cohesion: 1.00
Nodes (1): Filler

### Community 71 - "Community 71"
Cohesion: 1.00
Nodes (1): Finder

### Community 64 - "Community 64"
Cohesion: 0.60
Nodes (3): startup(), tryActivate(), start()

### Community 72 - "Community 72"
Cohesion: 1.00
Nodes (1): Tracker

### Community 68 - "Community 68"
Cohesion: 0.83
Nodes (2): loadEnvForm(), toggleCustomFields()

### Community 25 - "Community 25"
Cohesion: 0.28
Nodes (10): setStatus(), checkPage(), COLORS, checkAuth(), showAuthedState(), showDisconnectedState(), showDeviceCodeUI(), startPolling() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (14): TEMPLATE_STYLES, TEMPLATE_CONFIGS, siteApi, 16d2394 final, 69c514a Basic site loading, 8393c63 Merge branch 'main' of https://github.com/tgmstudios/foligo, c5eb237 WEBSITE, d4b0a64 tes (+6 more)

### Community 63 - "Community 63"
Cohesion: 0.50
Nodes (4): 0541f93 cors fix, 2457110 fixed, 8a75c5b new api stuff, 9e83a1d fix sites

### Community 60 - "Community 60"
Cohesion: 0.33
Nodes (1): TemplateSelector

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (1): SiteApiService

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (11): 0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 1b5ddea feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 3087038 fix: install openssl for Prisma engine in API Dockerfile, 3c9693e fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 413498b fix: pin deployment to SHA-tagged image, not :latest, 517d7df fix: expand onlyBuiltDependencies to cover all workspace packages, 646d8ac fix: use PATCH instead of GET/PUT for deploy (Rancher API compat), 8c303a1 revert: remove CI env var injection — envs stay in K8s (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (8): 02f5b3e fix: move /jobs/reorder route before /jobs/:id, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2b2b612 chore: remove .graphify artifacts, 391098a feat: add TurboRepo with remote cache for faster CI builds, 577f1c6 ci: switch to self-hosted ARC runners (tgmstudios-runners), 5f2a237 Fix AIManager fallback chain with real health checks, 91c072c Add graphify knowledge graph and AGENTS.md, e52477f Fix empty chat history crash and remove hardcoded Gemini for function calling

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (26): 156116a dashboard fix, 3358248 fix, 3b00f25 fix, 3c7f32e fix, 404f746 Final Changes, 40fd685 other options, 485c30b test, 5345604 Fix App Icon (+18 more)

### Community 47 - "Community 47"
Cohesion: 0.25
Nodes (8): 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b34879 fix: load api.js in popup context so account connect UI works, 9cff0d3 fix: add -k flag for Rancher self-signed cert, ba00164 fix: use -u basic auth instead of Bearer for Rancher API, c1c1833 fix(ci): use K8s native API path instead of broken Steve API PATCH, ccd62cc fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge, f645d9c fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, fd79a40 fix: deploy script with proper bash syntax, pre-computed timestamp, no nested date

### Community 73 - "Community 73"
Cohesion: 1.00
Nodes (1): docxtemplater

### Community 74 - "Community 74"
Cohesion: 1.00
Nodes (1): pizzip

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (11): Portfolio Generation, Content Blocks, Static Site Generator, Subdomain Routing, Markdown Editor, iOS SwiftUI App, Content Revisions, Portfolio Templates (+3 more)

## Knowledge Gaps
- **364 isolated node(s):** `{ PrismaClient }`, `prisma`, `express`, `cors`, `helmet` (+359 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 21`** (1 nodes): `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (2 nodes): `useCommandPaletteStore`, `f883c97 LATEX Editor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `Media`, `MediaListResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `Filler`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `Finder`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `Tracker`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (2 nodes): `loadEnvForm()`, `toggleCustomFields()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `TemplateSelector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `docxtemplater`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `pizzip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GeminiService` connect `Community 4` to `Community 12`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 21` to `Community 38`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `SiteApiService` connect `Community 29` to `Community 1`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `{ PrismaClient }`, `prisma`, `express` to the rest of the system?**
  _364 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.034482758620689655 - nodes in this community are weakly interconnected._
- **Should `Community 13` be split into smaller, more focused modules?**
  _Cohesion score 0.11695906432748537 - nodes in this community are weakly interconnected._
- **Should `Community 18` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._