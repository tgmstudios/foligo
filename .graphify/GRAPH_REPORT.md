# Graph Report - .  (2026-07-13)

## Corpus Check
- 309 files · ~305,568 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1317 nodes · 2627 edges · 80 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 858 · contains: 796 · imports_from: 324 · imports: 164 · PARENT_OF: 148 · ON_BRANCH: 141 · calls: 87 · method: 66 · uses: 7 · connects_to: 4 · implements: 4 · handles: 3 · inherits: 3 · serves: 3 · entry_point: 2 · manages: 2 · accesses: 1 · built_with: 1 · configures: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · generates: 1 · implemented_by: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · routes: 1 · tracks: 1 · ui_for: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 309 · Candidates: 434
- Excluded: 5 untracked · 121211 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `3cfbedb`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `prisma` - 30 edges
2. `GeminiService` - 28 edges
3. `express` - 25 edges
4. `cache` - 19 edges
5. `express_validator` - 17 edges
6. `authorizeProjectAccess()` - 14 edges
7. `AIManager` - 14 edges
8. `SiteApiService` - 12 edges
9. `AI Integration` - 9 edges
10. `findSimilarPostPairs()` - 8 edges

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

### Community 81 - "Community 81"
Cohesion: 0.40
Nodes (4): 3b51962 fix(api): retry Tectonic bundle warmup, 46c2570 fix(api): configure Tectonic CA certificates, bada62e fix(ci): don't fail api build when Tectonic bundle warmup can't reach host, c7ff091 feat(api): extend schema for cover letters, job categories/tags, and templates

### Community 88 - "Community 88"
Cohesion: 0.50
Nodes (2): { PrismaClient }, prisma

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (56): express, cors, helmet, morgan, rateLimit, swaggerUi, swaggerJsdoc, authRoutes (+48 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (20): jwt, crypto, { prisma }, authenticateToken(), express, router, ai, { authenticateToken } (+12 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (13): authorizeProjectAccess(), express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router, express (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (30): requireAdmin(), express, { body, validationResult }, { prisma }, { requireAdmin }, { encrypt }, { ensureBootstrapModels, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES }, ai (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (15): Window, 1596c73 Voice mode, 16a008d Dark mode, 245df8e Merge branch 'main' of https://github.com/tgmstudios/foligo, 29df55c AI Multistep, 81238cb Dashboard improvements, 893cac6 updates, 8b7636e Merge branch 'main' of https://github.com/tgmstudios/foligo (+7 more)

### Community 72 - "Community 72"
Cohesion: 0.29
Nodes (6): express, { body, validationResult, query }, { prisma }, { cache }, { requireAdmin }, router

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (14): express, { body, validationResult }, multer, mammoth, pdfParseModule, { prisma }, { cache }, { authorizeProjectAccess, authenticateToken } (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.19
Nodes (14): express, { Prisma }, { authorizeProjectAccess }, {
  MAX_BATCH_SIZE,
  hash,
  createWriteKey,
  normalizeOrigin,
  originAllowed,
  normalizeEvent,
}, publicRouter, router, crypto, hash() (+6 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (11): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router, redis, connectRedis() (+3 more)

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (7): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, { findSimilarPostPairs }, router

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (20): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, ai, { createContentEditorTools }, { createGithubTools } (+12 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (12): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router, express, { body, validationResult } (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (24): express, jwt, multer, path, { prisma }, { cache }, { authenticateToken }, ai (+16 more)

### Community 94 - "Community 94"
Cohesion: 0.67
Nodes (3): pickPrimary(), computeDerivedFields(), serializeProfile()

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (31): express, multer, { v4: uuidv4 }, path, { body, validationResult }, { prisma }, { uploadFile, deleteFile, getFileUrl, minioClient, BUCKET_NAME }, { authenticateToken, authorizeProjectAccess } (+23 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (10): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router, { PrismaClient }, connectDatabase() (+2 more)

### Community 74 - "Community 74"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (21): express, { body, validationResult }, path, { prisma }, ai, latexCompiler, { createResumeEditorTools }, { createGithubTools } (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (8): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router, 3f7125f A lot of new stuff, b75351a temp

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (11): express, router, { PrismaClient }, prisma, express, router, geminiService, { prisma } (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (11): express, {
  discovery,
  randomState,
  randomNonce,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  fetchUserInfo,
  ClientSecretPost
}, { prisma }, jwt, router, sessionStore, configCache, jsonwebtoken (+3 more)

### Community 76 - "Community 76"
Cohesion: 0.33
Nodes (4): { PrismaClient }, bcrypt, prisma, bcryptjs

### Community 59 - "Community 59"
Cohesion: 0.28
Nodes (8): path, mammoth, pdfParseModule, TEXT_MIME_TYPES, extractPdf(), extractAttachmentText(), prepareAttachments(), buildModelMessage()

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (8): ai, AIService, { tool }, { z }, AI_CONTENT_CREATE_TOOLS, AI_CONTENT_EDIT_TOOLS, AI_RESUME_CHATBOT_TOOLS, c47de3e New AI resume generator and site-wide touch ups

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (6): aim, goapplyRoutes, 7aa68eb Agentic editor and PDF Latex support, bde1fd9 More AI Repairs, for, vue_router

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (16): { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { createProvider, listProviders }, { resolveModel, ensureBootstrapModels }, { createAILogger }, { SAFETY_SETTINGS }, winston, customFormat, consoleTransport (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (1): AIManager

### Community 47 - "Community 47"
Cohesion: 0.24
Nodes (10): { createGoogleGenerativeAI }, { createAnthropic }, { createOpenAICompatible }, PRESETS, OPENAI_COMPATIBLE_LABEL, createProvider(), listProviders(), GeminiProvider (+2 more)

### Community 60 - "Community 60"
Cohesion: 0.47
Nodes (8): { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), projectGenerationPrompt(), experienceGenerationPrompt(), blogGenerationPrompt(), skillGenerationPrompt(), editGenerationPrompt()

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (27): { buildContextString, getCurrentDateTime }, buildConversationalSystemPrompt(), buildEditModePrompt(), { HarmBlockThreshold, HarmCategory }, MODEL_CONFIG, GENERATION_CONFIG, SAFETY_SETTINGS, SYSTEM_INSTRUCTIONS (+19 more)

### Community 89 - "Community 89"
Cohesion: 0.50
Nodes (3): { tool }, { z }, createCoverLetterEditorTools()

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (12): GeminiError, GeminiConfigError, GeminiAPIError, GeminiParseError, GeminiValidationError, RETRY_CONFIG, { GeminiAPIError }, { RETRY_CONFIG } (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (1): GeminiService

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (6): { tool }, { z }, optionalText, jobAssistantTool(), profileSchema, createJobAssistantTools()

### Community 75 - "Community 75"
Cohesion: 0.33
Nodes (6): { spawn }, os, path, crypto, compile(), runTectonic()

### Community 90 - "Community 90"
Cohesion: 0.50
Nodes (3): { prisma }, fetchPortfolioItem(), getPortfolioContext()

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (14): { TfIdf }, { WordTokenizer }, PorterStemmer, { words: englishStopWords }, stopWords, tokenizer, normalizeText(), tokenize() (+6 more)

### Community 86 - "Community 86"
Cohesion: 0.50
Nodes (2): { findSimilarPostPairs }, 743a9d0 feat: add analytics and content similarity

### Community 36 - "Community 36"
Cohesion: 0.23
Nodes (6): ResumeDocumentSummary, ResumeDocument, ResumeDocumentRevisionSummary, ResumeDocumentRevisionDetail, useResumeDocuments(), documentsApi

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (4): router, 2f0b6d3 SSO support, 782c5fd fix: prevent router redirect loop on page load, ae8be0a Refactored the content editor to use the new Editor Studio. Refactored admin dashboard

### Community 51 - "Community 51"
Cohesion: 0.20
Nodes (8): 0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat, 18576fb fix: Dockerfile monorepo context for pnpm-lock.yaml, 2437013 media library changes, 78f04b9 new readme, a3400e5 Enhance README with new features and setup details, b6526e1 feat: model-agnostic AI layer + signup gate, b8c2cc4 fix: monorepo Dockerfiles + pnpm build scripts approval, f572f42 switch to pnpm

### Community 68 - "Community 68"
Cohesion: 0.29
Nodes (2): 2736250 feat(dashboard): support resume templates and defaults in the Resume Gallery, e428e58 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (2): useCommandPaletteStore, f883c97 LATEX Editor

### Community 56 - "Community 56"
Cohesion: 0.22
Nodes (2): Content, StudioDocumentSummary

### Community 62 - "Community 62"
Cohesion: 0.25
Nodes (4): ToolActivity, AgenticChatMessage, AgenticChatCallbacks, a446f43 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat

### Community 31 - "Community 31"
Cohesion: 0.23
Nodes (8): CoverLetterDocument, useCoverLetterDocuments(), documentsApi, coverLetterAdapter, resumeAdapter, adapters, registerAdapter(), 0c74186 feat(dashboard): add Cover Letter Studio with PDF compile and revision history

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (12): Project, SiteConfig, ProjectMember, ContentLink, ContentTag, ContentMeta, ContentBlock, ExperienceRole (+4 more)

### Community 93 - "Community 93"
Cohesion: 0.67
Nodes (1): MERMAID_THEME_VARIABLES

### Community 35 - "Community 35"
Cohesion: 0.21
Nodes (11): app, pinia, authStore, User, LoginCredentials, RegisterData, useAuthStore, index_css (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (5): toast, api, Media, MediaListResponse, axios

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (14): aiApi, LinkableExperienceCategory, GoApplyProfile, GoApplyJob, JobStatus, SavedAnswer, CoverLetter, JobFormData (+6 more)

### Community 66 - "Community 66"
Cohesion: 0.29
Nodes (7): StudioSaveKind, StudioSaveResult, StudioMetaFieldSchema, StudioRevisionSummary, StudioRevisionDetail, StudioQuickAction, EditorStudioAdapter

### Community 92 - "Community 92"
Cohesion: 0.67
Nodes (2): readPreferenceCookie(), clearPreferenceCookie()

### Community 53 - "Community 53"
Cohesion: 0.20
Nodes (1): config

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (7): 0c55f26 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 2fe136f feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 4df342b fix: device linking — use dashboard auth directly + exchange 202 for pending, 8726fb0 fix: use default import for api in LinkDevice.vue, b76ca3c fix(ci): use strategic-merge-patch+json to preserve env vars, d2a255c fix: correct logo import in LinkDevice.vue, e660a95 fix: add canvas build deps for alpine dashboard Dockerfile

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (1): 532eb3c fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (8): GoApplyAPI, Banners, Filler, Finder, Tracker, UI, 2f47ee3 fix: make arm64 document builds reliable, aa225ca fix(extension): make autofill and job tracking more reliable

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (6): Boards, Consent, Detector, Tutorial, 241e6c0 fix: kanban drag-save with local reactive columns + add extension to repo, 8f85d95 fix: CI auto-deploy with latest tag, kanban drag, AI CMS Gemini fallback, GoApply branding

### Community 63 - "Community 63"
Cohesion: 0.39
Nodes (6): armSubmitWatcher(), previewDocument(), startup(), tryActivate(), start(), blobToDataUrl()

### Community 87 - "Community 87"
Cohesion: 0.83
Nodes (2): loadEnvForm(), toggleCustomFields()

### Community 34 - "Community 34"
Cohesion: 0.28
Nodes (10): setStatus(), checkPage(), COLORS, checkAuth(), showAuthedState(), showDisconnectedState(), showDeviceCodeUI(), startPolling() (+2 more)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (16): TEMPLATE_STYLES, TEMPLATE_CONFIGS, siteApi, 16d2394 final, 5345604 Fix App Icon, 69c514a Basic site loading, 8393c63 Merge branch 'main' of https://github.com/tgmstudios/foligo, c5eb237 WEBSITE (+8 more)

### Community 77 - "Community 77"
Cohesion: 0.40
Nodes (5): 0541f93 cors fix, 2457110 fixed, 8a75c5b new api stuff, 9e83a1d fix sites, f6601e5 use markdown renderer

### Community 79 - "Community 79"
Cohesion: 0.33
Nodes (1): TemplateSelector

### Community 43 - "Community 43"
Cohesion: 0.17
Nodes (1): SiteApiService

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (11): 0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 1b5ddea feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 3087038 fix: install openssl for Prisma engine in API Dockerfile, 3c9693e fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 413498b fix: pin deployment to SHA-tagged image, not :latest, 517d7df fix: expand onlyBuiltDependencies to cover all workspace packages, 646d8ac fix: use PATCH instead of GET/PUT for deploy (Rancher API compat), 8c303a1 revert: remove CI env var injection — envs stay in K8s (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (9): 02f5b3e fix: move /jobs/reorder route before /jobs/:id, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2b2b612 chore: remove .graphify artifacts, 391098a feat: add TurboRepo with remote cache for faster CI builds, 577f1c6 ci: switch to self-hosted ARC runners (tgmstudios-runners), 5f2a237 Fix AIManager fallback chain with real health checks, 8dcf942 AI Fixes, deepseek support, AI Merged into goapply, 91c072c Add graphify knowledge graph and AGENTS.md (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (27): 09f486f fix: install Tectonic on arm64 builds, 156116a dashboard fix, 2d86eff feat(api): support resume templates and defaults, 3358248 fix, 3b00f25 fix, 3c7f32e fix, 40faf8f Script and Start html files, 40fd685 other options (+19 more)

### Community 82 - "Community 82"
Cohesion: 0.40
Nodes (5): 15c176e fix: OpenCode reasoning model support + route collision fix, 2e0b15f feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 49075f5 feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, 7641985 fix: reasoning model detection + auto-double token budget, c935419 fix: remove double-token for reasoning models (caused 504 timeouts)

### Community 61 - "Community 61"
Cohesion: 0.25
Nodes (8): 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b34879 fix: load api.js in popup context so account connect UI works, 9cff0d3 fix: add -k flag for Rancher self-signed cert, ba00164 fix: use -u basic auth instead of Bearer for Rancher API, c1c1833 fix(ci): use K8s native API path instead of broken Steve API PATCH, ccd62cc fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge, f645d9c fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, fd79a40 fix: deploy script with proper bash syntax, pre-computed timestamp, no nested date

### Community 78 - "Community 78"
Cohesion: 0.33
Nodes (6): 347793b refactor(dashboard): always sync Content Studio preview scroll with editor, 3cfbedb chore: add graphify skill config and project instructions, 565f55d fix(dashboard): hide the status badge on the portfolios list view, 58c6fc2 chore: sync graphify code-graph snapshot, d366f21 feat(api): add cover letter editor tools and portfolio context service, ee19071 fix(api): clean up cover letter PDFs on delete, describe LaTeX to the assistant

### Community 83 - "Community 83"
Cohesion: 0.40
Nodes (5): 404f746 Final Changes, 8ad0083 final, ab25160 Merge branch 'main' of https://github.com/tgmstudios/foligo, c038a1b added bad site, dec7f43 pushing demo site

### Community 97 - "Community 97"
Cohesion: 1.00
Nodes (1): docxtemplater

### Community 98 - "Community 98"
Cohesion: 1.00
Nodes (1): pizzip

### Community 69 - "Community 69"
Cohesion: 0.29
Nodes (7): AI Integration, Google Gemini AI, ElevenLabs Voice, Resume Generator, Voice Webhook, AI Function Calling, Resume Chatbot

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (11): Portfolio Generation, Content Blocks, Static Site Generator, Subdomain Routing, Markdown Editor, iOS SwiftUI App, Content Revisions, Portfolio Templates (+3 more)

### Community 96 - "Community 96"
Cohesion: 1.00
Nodes (2): Job Tracker (GoApply), Chrome Extension (GoApply)

## Knowledge Gaps
- **427 isolated node(s):** `{ PrismaClient }`, `prisma`, `express`, `cors`, `helmet` (+422 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 88`** (2 nodes): `{ PrismaClient }`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (2 nodes): `{ findSimilarPostPairs }`, `743a9d0 feat: add analytics and content similarity`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (2 nodes): `2736250 feat(dashboard): support resume templates and defaults in the Resume Gallery`, `e428e58 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `useCommandPaletteStore`, `f883c97 LATEX Editor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `Content`, `StudioDocumentSummary`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 93`** (1 nodes): `MERMAID_THEME_VARIABLES`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (2 nodes): `readPreferenceCookie()`, `clearPreferenceCookie()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `532eb3c fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (2 nodes): `loadEnvForm()`, `toggleCustomFields()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `TemplateSelector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 97`** (1 nodes): `docxtemplater`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (1 nodes): `pizzip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (2 nodes): `Job Tracker (GoApply)`, `Chrome Extension (GoApply)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GeminiService` connect `Community 8` to `Community 6`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 28` to `Community 19`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `SiteApiService` connect `Community 43` to `Community 0`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `{ PrismaClient }`, `prisma`, `express` to the rest of the system?**
  _427 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.034482758620689655 - nodes in this community are weakly interconnected._
- **Should `Community 11` be split into smaller, more focused modules?**
  _Cohesion score 0.1067193675889328 - nodes in this community are weakly interconnected._
- **Should `Community 25` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._