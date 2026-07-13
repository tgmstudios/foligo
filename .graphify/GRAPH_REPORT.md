# Graph Report - .  (2026-07-13)

## Corpus Check
- 293 files · ~286,539 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1218 nodes · 2439 edges · 68 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 807 · contains: 726 · imports_from: 308 · imports: 151 · PARENT_OF: 132 · ON_BRANCH: 125 · calls: 81 · method: 66 · uses: 7 · connects_to: 4 · implements: 4 · handles: 3 · inherits: 3 · serves: 3 · entry_point: 2 · manages: 2 · accesses: 1 · built_with: 1 · configures: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · generates: 1 · implemented_by: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · routes: 1 · tracks: 1 · ui_for: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 293 · Candidates: 415
- Excluded: 12 untracked · 120672 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `bada62e`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `prisma` - 29 edges
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

### Community 76 - "Community 76"
Cohesion: 0.50
Nodes (2): { PrismaClient }, prisma

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (58): express, cors, helmet, morgan, rateLimit, swaggerUi, swaggerJsdoc, authRoutes (+50 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (20): jwt, crypto, { prisma }, authenticateToken(), express, router, ai, { authenticateToken } (+12 more)

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (7): authorizeProjectAccess(), express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (30): requireAdmin(), express, { body, validationResult }, { prisma }, { requireAdmin }, { encrypt }, { ensureBootstrapModels, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES }, ai (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (15): Window, 1596c73 Voice mode, 16a008d Dark mode, 245df8e Merge branch 'main' of https://github.com/tgmstudios/foligo, 29df55c AI Multistep, 81238cb Dashboard improvements, 893cac6 updates, 8b7636e Merge branch 'main' of https://github.com/tgmstudios/foligo (+7 more)

### Community 60 - "Community 60"
Cohesion: 0.29
Nodes (6): express, { body, validationResult, query }, { prisma }, { cache }, { requireAdmin }, router

### Community 16 - "Community 16"
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

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (10): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router, redis, redis (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (7): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, { findSimilarPostPairs }, router

### Community 61 - "Community 61"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (18): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, ai, { createContentEditorTools }, router (+10 more)

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (32): express, jwt, multer, { prisma }, { cache }, { authenticateToken }, ai, { createJobAssistantTools } (+24 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (22): express, multer, { v4: uuidv4 }, path, { body, validationResult }, { prisma }, { uploadFile, deleteFile, getFileUrl, minioClient, BUCKET_NAME }, { authenticateToken, authorizeProjectAccess } (+14 more)

### Community 64 - "Community 64"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 65 - "Community 65"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (17): express, { body, validationResult }, path, { prisma }, ai, latexCompiler, { createResumeEditorTools }, router (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (12): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router, express, { body, validationResult } (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (11): express, router, { PrismaClient }, prisma, express, router, geminiService, { prisma } (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.33
Nodes (4): { PrismaClient }, bcrypt, prisma, bcryptjs

### Community 40 - "Community 40"
Cohesion: 0.18
Nodes (8): ai, AIService, { tool }, { z }, AI_CONTENT_CREATE_TOOLS, AI_CONTENT_EDIT_TOOLS, AI_RESUME_CHATBOT_TOOLS, c47de3e New AI resume generator and site-wide touch ups

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (6): aim, goapplyRoutes, 7aa68eb Agentic editor and PDF Latex support, bde1fd9 More AI Repairs, for, vue_router

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (16): { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { createProvider, listProviders }, { resolveModel, ensureBootstrapModels }, { createAILogger }, { SAFETY_SETTINGS }, winston, customFormat, consoleTransport (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (1): AIManager

### Community 43 - "Community 43"
Cohesion: 0.24
Nodes (10): { createGoogleGenerativeAI }, { createAnthropic }, { createOpenAICompatible }, PRESETS, OPENAI_COMPATIBLE_LABEL, createProvider(), listProviders(), GeminiProvider (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.47
Nodes (8): { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), projectGenerationPrompt(), experienceGenerationPrompt(), blogGenerationPrompt(), skillGenerationPrompt(), editGenerationPrompt()

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (27): { buildContextString, getCurrentDateTime }, buildConversationalSystemPrompt(), buildEditModePrompt(), { HarmBlockThreshold, HarmCategory }, MODEL_CONFIG, GENERATION_CONFIG, SAFETY_SETTINGS, SYSTEM_INSTRUCTIONS (+19 more)

### Community 71 - "Community 71"
Cohesion: 0.50
Nodes (3): { PrismaClient }, Prisma ORM, PostgreSQL Database

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (12): GeminiError, GeminiConfigError, GeminiAPIError, GeminiParseError, GeminiValidationError, RETRY_CONFIG, { GeminiAPIError }, { RETRY_CONFIG } (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (1): GeminiService

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (9): { spawn }, os, path, crypto, compile(), runTectonic(), Filler, Finder (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (9): Minio, minioClient, ensureBucket(), uploadFile(), deleteFile(), getFileUrl(), minio, MinIO Media Storage (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.20
Nodes (14): { TfIdf }, { WordTokenizer }, PorterStemmer, { words: englishStopWords }, stopWords, tokenizer, normalizeText(), tokenize() (+6 more)

### Community 74 - "Community 74"
Cohesion: 0.50
Nodes (2): { findSimilarPostPairs }, 743a9d0 feat: add analytics and content similarity

### Community 34 - "Community 34"
Cohesion: 0.23
Nodes (6): ResumeDocumentSummary, ResumeDocument, ResumeDocumentRevisionSummary, ResumeDocumentRevisionDetail, useResumeDocuments(), documentsApi

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (3): router, 2f0b6d3 SSO support, ae8be0a Refactored the content editor to use the new Editor Studio. Refactored admin dashboard

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (2): 3f7125f A lot of new stuff, b75351a temp

### Community 46 - "Community 46"
Cohesion: 0.20
Nodes (8): 0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat, 18576fb fix: Dockerfile monorepo context for pnpm-lock.yaml, 2437013 media library changes, 78f04b9 new readme, a3400e5 Enhance README with new features and setup details, b6526e1 feat: model-agnostic AI layer + signup gate, b8c2cc4 fix: monorepo Dockerfiles + pnpm build scripts approval, f572f42 switch to pnpm

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (2): useCommandPaletteStore, f883c97 LATEX Editor

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (2): Content, StudioDocumentSummary

### Community 67 - "Community 67"
Cohesion: 0.33
Nodes (3): ToolActivity, AgenticChatMessage, AgenticChatCallbacks

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (12): Project, SiteConfig, ProjectMember, ContentLink, ContentTag, ContentMeta, ContentBlock, ExperienceRole (+4 more)

### Community 78 - "Community 78"
Cohesion: 0.67
Nodes (1): MERMAID_THEME_VARIABLES

### Community 33 - "Community 33"
Cohesion: 0.21
Nodes (11): app, pinia, authStore, User, LoginCredentials, RegisterData, useAuthStore, index_css (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (5): toast, api, Media, MediaListResponse, axios

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (14): aiApi, LinkableExperienceCategory, GoApplyProfile, GoApplyJob, JobStatus, SavedAnswer, CoverLetter, JobFormData (+6 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (10): resumeAdapter, adapters, registerAdapter(), StudioSaveKind, StudioSaveResult, StudioMetaFieldSchema, StudioRevisionSummary, StudioRevisionDetail (+2 more)

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (1): config

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (8): 0c55f26 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 2fe136f feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 4df342b fix: device linking — use dashboard auth directly + exchange 202 for pending, 782c5fd fix: prevent router redirect loop on page load, 8726fb0 fix: use default import for api in LinkDevice.vue, b76ca3c fix(ci): use strategic-merge-patch+json to preserve env vars, d2a255c fix: correct logo import in LinkDevice.vue, e660a95 fix: add canvas build deps for alpine dashboard Dockerfile

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (5): 15c176e fix: OpenCode reasoning model support + route collision fix, 2e0b15f feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 49075f5 feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, 7641985 fix: reasoning model detection + auto-double token budget, c935419 fix: remove double-token for reasoning models (caused 504 timeouts)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (23): GoApplyAPI, Banners, Boards, Consent, Detector, startup(), tryActivate(), start() (+15 more)

### Community 75 - "Community 75"
Cohesion: 0.83
Nodes (2): loadEnvForm(), toggleCustomFields()

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (16): TEMPLATE_STYLES, TEMPLATE_CONFIGS, siteApi, 16d2394 final, 5345604 Fix App Icon, 69c514a Basic site loading, 8393c63 Merge branch 'main' of https://github.com/tgmstudios/foligo, c5eb237 WEBSITE (+8 more)

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (7): 0541f93 cors fix, 2457110 fixed, 3c7f32e fix, 8a75c5b new api stuff, 9e83a1d fix sites, b8bcbcf site fix, f6601e5 use markdown renderer

### Community 68 - "Community 68"
Cohesion: 0.33
Nodes (1): TemplateSelector

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (1): SiteApiService

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (11): 0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 1b5ddea feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 3087038 fix: install openssl for Prisma engine in API Dockerfile, 3c9693e fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 413498b fix: pin deployment to SHA-tagged image, not :latest, 517d7df fix: expand onlyBuiltDependencies to cover all workspace packages, 646d8ac fix: use PATCH instead of GET/PUT for deploy (Rancher API compat), 8c303a1 revert: remove CI env var injection — envs stay in K8s (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (27): 02f5b3e fix: move /jobs/reorder route before /jobs/:id, 09f486f fix: install Tectonic on arm64 builds, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2b2b612 chore: remove .graphify artifacts, 3358248 fix, 391098a feat: add TurboRepo with remote cache for faster CI builds, 3b51962 fix(api): retry Tectonic bundle warmup, 40faf8f Script and Start html files (+19 more)

### Community 58 - "Community 58"
Cohesion: 0.29
Nodes (7): 156116a dashboard fix, 3b00f25 fix, 73e954c npm install, 76b0a6d downgrade, 7e80672 prod entrypoint, c188ac8 gitignore, eef22fa tsc

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (8): 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b34879 fix: load api.js in popup context so account connect UI works, 9cff0d3 fix: add -k flag for Rancher self-signed cert, ba00164 fix: use -u basic auth instead of Bearer for Rancher API, c1c1833 fix(ci): use K8s native API path instead of broken Steve API PATCH, ccd62cc fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge, f645d9c fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, fd79a40 fix: deploy script with proper bash syntax, pre-computed timestamp, no nested date

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (5): 404f746 Final Changes, 8ad0083 final, ab25160 Merge branch 'main' of https://github.com/tgmstudios/foligo, c038a1b added bad site, dec7f43 pushing demo site

### Community 81 - "Community 81"
Cohesion: 1.00
Nodes (1): docxtemplater

### Community 82 - "Community 82"
Cohesion: 1.00
Nodes (1): pizzip

### Community 59 - "Community 59"
Cohesion: 0.29
Nodes (7): AI Integration, Google Gemini AI, ElevenLabs Voice, Resume Generator, Voice Webhook, AI Function Calling, Resume Chatbot

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (11): Portfolio Generation, Content Blocks, Static Site Generator, Subdomain Routing, Markdown Editor, iOS SwiftUI App, Content Revisions, Portfolio Templates (+3 more)

## Knowledge Gaps
- **401 isolated node(s):** `{ PrismaClient }`, `prisma`, `express`, `cors`, `helmet` (+396 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 76`** (2 nodes): `{ PrismaClient }`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (2 nodes): `{ findSimilarPostPairs }`, `743a9d0 feat: add analytics and content similarity`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `3f7125f A lot of new stuff`, `b75351a temp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `useCommandPaletteStore`, `f883c97 LATEX Editor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `Content`, `StudioDocumentSummary`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `MERMAID_THEME_VARIABLES`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (2 nodes): `loadEnvForm()`, `toggleCustomFields()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `TemplateSelector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (1 nodes): `docxtemplater`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `pizzip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GeminiService` connect `Community 7` to `Community 6`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 27` to `Community 19`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `SiteApiService` connect `Community 38` to `Community 0`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `{ PrismaClient }`, `prisma`, `express` to the rest of the system?**
  _401 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 12` be split into smaller, more focused modules?**
  _Cohesion score 0.1067193675889328 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.07057057057057058 - nodes in this community are weakly interconnected._