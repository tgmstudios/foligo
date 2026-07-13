# Graph Report - .  (2026-07-13)

## Corpus Check
- 351 files · ~287,591 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1609 nodes · 3778 edges · 93 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 1508 · contains: 929 · imports_from: 346 · PARENT_OF: 278 · ON_BRANCH: 266 · imports: 182 · calls: 108 · method: 67 · references: 51 · uses: 7 · connects_to: 4 · implements: 4 · handles: 3 · inherits: 3 · serves: 3 · entry_point: 2 · manages: 2 · accesses: 1 · built_with: 1 · configures: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · generates: 1 · implemented_by: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · routes: 1 · tracks: 1 · ui_for: 1


## Input Scope
- Requested: all
- Resolved: all (source: cli)
- Included files: 351 · Candidates: recursive
- Excluded: 0 untracked · 0 ignored · 1 sensitive · 0 missing committed

## Graph Freshness
- Built from Git commit: `6d063eb`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `prisma` - 33 edges
2. `GeminiService` - 28 edges
3. `express` - 25 edges
4. `cache` - 19 edges
5. `express_validator` - 17 edges
6. `authorizeProjectAccess()` - 14 edges
7. `AIManager` - 14 edges
8. `SiteApiService` - 12 edges
9. `authenticateToken()` - 9 edges
10. `AI Integration` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Portfolio Generation` --uses--> `Portfolio Templates`  [INFERRED]
  README.md → sites/README.md
- `Resume Generator` --uses--> `AI Integration`  [INFERRED]
  dashboard/README.md → api/docs/AI_ARCHITECTURE.md
- `Job Tracker (GoApply)` --implemented_by--> `Chrome Extension (GoApply)`  [INFERRED]
  dashboard/README.md → extension/manifest.json
- `Markdown Editor` --edits--> `Content Blocks`  [INFERRED]
  dashboard/README.md → api/docs/API_DOCUMENTATION.md
- `MinIO Media Storage` --deployed_with--> `Docker Deployment`  [INFERRED]
  api/docs/API_DOCUMENTATION.md → README.md

## Communities

### Community 63 - "Community 63"
Cohesion: 0.50
Nodes (7): users, projects, project_access, content, assets, site_config, ai_analysis

### Community 35 - "Community 35"
Cohesion: 0.31
Nodes (13): content_links, content_tags, content_meta, content_blocks, skills, experience_roles, _ProjectSkills, _ContentTags (+5 more)

### Community 98 - "Community 98"
Cohesion: 2.00
Nodes (1): content

### Community 86 - "Community 86"
Cohesion: 0.83
Nodes (3): media, users, projects

### Community 99 - "Community 99"
Cohesion: 1.00
Nodes (1): sso_providers

### Community 74 - "Community 74"
Cohesion: 0.53
Nodes (5): post_order, resume_chat_sessions, projects, content, users

### Community 87 - "Community 87"
Cohesion: 1.00
Nodes (3): resume_templates, resume_history, users

### Community 64 - "Community 64"
Cohesion: 0.46
Nodes (7): job_applications, user_profiles, saved_answers, cover_letters, generated_emails, api_tokens, users

### Community 100 - "Community 100"
Cohesion: 1.00
Nodes (1): ai_models

### Community 75 - "Community 75"
Cohesion: 0.53
Nodes (5): resume_documents, resume_document_revisions, resume_history, users, job_applications

### Community 78 - "Community 78"
Cohesion: 0.80
Nodes (4): _ProfileLinkedJobs, _ProfileLinkedEducation, content, user_profiles

### Community 88 - "Community 88"
Cohesion: 0.83
Nodes (3): _ProfileLinkedSkills, user_profiles, skills

### Community 89 - "Community 89"
Cohesion: 0.83
Nodes (3): cover_letter_revisions, cover_letters, job_applications

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (42): 046ebb7 fix(api): retry Tectonic bundle warmup, 0498826 tsc, 0a28c02 feat(api): extend schema for cover letters, job categories/tags, and templates, 1948fd7 fix(ci): don't fail api build when Tectonic bundle warmup can't reach host, 2226c00 prod entrypoint, 2f601fd fix, 485c30b test, 6d063eb ci: speed up ARM64 frontend builds (+34 more)

### Community 90 - "Community 90"
Cohesion: 0.83
Nodes (3): _JobSavedAnswers, job_applications, saved_answers

### Community 96 - "Community 96"
Cohesion: 1.00
Nodes (2): user_integrations, users

### Community 104 - "Community 104"
Cohesion: 1.00
Nodes (1): sso_providers

### Community 22 - "Community 22"
Cohesion: 0.10
Nodes (16): { PrismaClient }, prisma, express, bcrypt, jwt, crypto, { body, validationResult }, { prisma } (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (59): express, cors, helmet, morgan, rateLimit, swaggerUi, swaggerJsdoc, authRoutes (+51 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (74): jwt, crypto, { prisma }, authorizeProjectAccess(), requireAdmin(), express, { body, validationResult, query }, { prisma } (+66 more)

### Community 44 - "Community 44"
Cohesion: 0.17
Nodes (9): authenticateToken(), express, crypto, { prisma }, { encrypt }, { authenticateToken }, githubService, router (+1 more)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (34): express, router, { PrismaClient }, prisma, TEMPLATE_STYLES, TEMPLATE_CONFIGS, siteApi, 054d6d6 proper .env (+26 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (16): express, { body, validationResult }, { prisma }, { requireAdmin }, { encrypt }, { ensureBootstrapModels, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES }, ai, router (+8 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (14): express, { body, validationResult }, { prisma }, { requireAdmin }, { encrypt, decrypt }, https, http, router (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.10
Nodes (14): express, { body, validationResult }, multer, mammoth, pdfParseModule, { prisma }, { cache }, { authorizeProjectAccess, authenticateToken } (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (35): express, router, ai, { authenticateToken }, { prisma }, { generateCoverLetter, generateCustomAnswer }, express, router (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (38): express, { Prisma }, { authorizeProjectAccess }, {
  MAX_BATCH_SIZE,
  hash,
  createWriteKey,
  normalizeOrigin,
  originAllowed,
  normalizeEvent,
}, publicRouter, router, express, { body, validationResult } (+30 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (25): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, ai, { createContentEditorTools }, { createGithubTools } (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (24): express, jwt, multer, path, { prisma }, { cache }, { authenticateToken }, ai (+16 more)

### Community 97 - "Community 97"
Cohesion: 0.67
Nodes (3): pickPrimary(), computeDerivedFields(), serializeProfile()

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (23): express, multer, { v4: uuidv4 }, path, { body, validationResult }, { prisma }, { uploadFile, deleteFile, getFileUrl, minioClient, BUCKET_NAME }, { authenticateToken, authorizeProjectAccess } (+15 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (23): express, { body, validationResult }, path, { prisma }, ai, latexCompiler, { createResumeEditorTools }, { createGithubTools } (+15 more)

### Community 33 - "Community 33"
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

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (19): express, { body, validationResult }, { prisma }, { cache }, router, Window, 1596c73 Voice mode, 16a008d Dark mode (+11 more)

### Community 62 - "Community 62"
Cohesion: 0.28
Nodes (8): path, mammoth, pdfParseModule, TEXT_MIME_TYPES, extractPdf(), extractAttachmentText(), prepareAttachments(), buildModelMessage()

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (12): ai, AIService, goapplyRoutes, 933e05e AI Fixes, deepseek support, AI Merged into goapply, c371019 More AI Repairs, ded6ded Agentic editor and PDF Latex support, 2fe136f feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 7aa68eb Agentic editor and PDF Latex support (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (28): aim, { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { createProvider, listProviders }, { resolveModel, ensureBootstrapModels }, { createAILogger }, { SAFETY_SETTINGS }, { createGoogleGenerativeAI }, { createAnthropic } (+20 more)

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (1): AIManager

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (12): { tool }, { z }, MERMAID_THEME_VARIABLES, router, 47b83e8 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 48d46c3 SSO support, 5944c16 Refactored the content editor to use the new Editor Studio. Refactored admin dashboard, 7fb656d fix: prevent router redirect loop on page load (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.19
Nodes (19): { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), projectGenerationPrompt(), experienceGenerationPrompt(), blogGenerationPrompt(), skillGenerationPrompt(), editGenerationPrompt() (+11 more)

### Community 93 - "Community 93"
Cohesion: 0.50
Nodes (3): { tool }, { z }, createCoverLetterEditorTools()

### Community 24 - "Community 24"
Cohesion: 0.24
Nodes (6): 97e0c8d A lot of new stuff, f81a378 temp, 3f7125f A lot of new stuff, b75351a temp, plugin_vue, vite

### Community 54 - "Community 54"
Cohesion: 0.20
Nodes (5): GeminiError, GeminiConfigError, GeminiAPIError, GeminiParseError, GeminiValidationError

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (10): { HarmBlockThreshold, HarmCategory }, MODEL_CONFIG, GENERATION_CONFIG, SAFETY_SETTINGS, SYSTEM_INSTRUCTIONS, { buildContextString }, buildResumeChatbotSystemPrompt(), b30b552 Good for prod (+2 more)

### Community 70 - "Community 70"
Cohesion: 0.36
Nodes (7): RETRY_CONFIG, { GeminiAPIError }, { RETRY_CONFIG }, isRetryableError(), calculateDelay(), sleep(), retryWithBackoff()

### Community 26 - "Community 26"
Cohesion: 0.14
Nodes (16): { tool }, { z }, AI_CONTENT_CREATE_TOOLS, AI_CONTENT_EDIT_TOOLS, AI_RESUME_CHATBOT_TOOLS, { createAILogger }, { fallbackQuestions, utilityPrompts }, { MODEL_CONFIG, GENERATION_CONFIG, SAFETY_SETTINGS, SYSTEM_INSTRUCTIONS } (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (1): GeminiService

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (24): { Octokit }, { spawn }, os, path, { prisma }, { decrypt }, CLONE_TTL_MS, MAX_REPO_SIZE_KB (+16 more)

### Community 84 - "Community 84"
Cohesion: 0.40
Nodes (4): { tool }, { z }, githubService, createGithubTools()

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (6): { spawn }, os, path, crypto, compile(), runTectonic()

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (9): Minio, minioClient, ensureBucket(), uploadFile(), deleteFile(), getFileUrl(), minio, MinIO Media Storage (+1 more)

### Community 94 - "Community 94"
Cohesion: 0.50
Nodes (3): { prisma }, fetchPortfolioItem(), getPortfolioContext()

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (3): useCommandPaletteStore, c3c0c55 LATEX Editor, f883c97 LATEX Editor

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (5): ToolActivity, AgenticChatMessage, AgenticChatCallbacks, d082103 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat, a446f43 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (13): 18fcd65 fix: monorepo Dockerfiles + pnpm build scripts approval, 35d3be7 fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 649349e feat: model-agnostic AI layer + signup gate, 8456f34 switch to pnpm, b8a8c43 Enhance README with new features and setup details, c5bbbd8 fix: Dockerfile monorepo context for pnpm-lock.yaml, f0d2a2e media library changes, f9b3c65 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat (+5 more)

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (4): 02cf9b1 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply, ca272cd feat(dashboard): support resume templates and defaults in the Resume Gallery, 2736250 feat(dashboard): support resume templates and defaults in the Resume Gallery, e428e58 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (12): 19d43b2 fix(api): clean up cover letter PDFs on delete, describe LaTeX to the assistant, 3bfa0fc chore: add graphify skill config and project instructions, aaf93a6 chore: sync graphify code-graph snapshot, b0924e1 refactor(dashboard): always sync Content Studio preview scroll with editor, cd8b3b4 fix(dashboard): hide the status badge on the portfolios list view, f429a54 feat(api): add cover letter editor tools and portfolio context service, 347793b refactor(dashboard): always sync Content Studio preview scroll with editor, 3cfbedb chore: add graphify skill config and project instructions (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (2): 6fbbcc1 fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat, 532eb3c fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (16): CoverLetterDocument, useCoverLetterDocuments(), documentsApi, coverLetterAdapter, resumeAdapter, adapters, registerAdapter(), StudioSaveKind (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (12): Project, SiteConfig, ProjectMember, ContentLink, ContentTag, ContentMeta, ContentBlock, ExperienceRole (+4 more)

### Community 60 - "Community 60"
Cohesion: 0.33
Nodes (6): ResumeDocumentSummary, ResumeDocument, ResumeDocumentRevisionSummary, ResumeDocumentRevisionDetail, useResumeDocuments(), documentsApi

### Community 40 - "Community 40"
Cohesion: 0.21
Nodes (11): app, pinia, authStore, User, LoginCredentials, RegisterData, useAuthStore, index_css (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (5): toast, api, Media, MediaListResponse, axios

### Community 34 - "Community 34"
Cohesion: 0.13
Nodes (14): aiApi, LinkableExperienceCategory, GoApplyProfile, GoApplyJob, JobStatus, SavedAnswer, CoverLetter, JobFormData (+6 more)

### Community 82 - "Community 82"
Cohesion: 0.40
Nodes (2): Content, StudioDocumentSummary

### Community 95 - "Community 95"
Cohesion: 0.67
Nodes (2): readPreferenceCookie(), clearPreferenceCookie()

### Community 55 - "Community 55"
Cohesion: 0.20
Nodes (1): config

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (16): 063e407 feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 07e29da fix: use PATCH instead of GET/PUT for deploy (Rancher API compat), 1063f67 fix: reasoning model detection + auto-double token budget, 2efaeac feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, 336352a fix: correct logo import in LinkDevice.vue, 46be3c0 feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 59972e4 fix: use default import for api in LinkDevice.vue, 60991ef fix: add canvas build deps for alpine dashboard Dockerfile (+8 more)

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (2): 49075f5 feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, c935419 fix: remove double-token for reasoning models (caused 504 timeouts)

### Community 59 - "Community 59"
Cohesion: 0.22
Nodes (2): 3725b15 Move old content, 9030aa4 Move old content

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (19): GoApplyAPI, Banners, Boards, Consent, Detector, Filler, Finder, Tracker (+11 more)

### Community 102 - "Community 102"
Cohesion: 1.00
Nodes (1): AgentController

### Community 103 - "Community 103"
Cohesion: 1.00
Nodes (1): ChatPanel

### Community 49 - "Community 49"
Cohesion: 0.25
Nodes (6): armSubmitWatcher(), previewDocument(), startup(), tryActivate(), start(), blobToDataUrl()

### Community 92 - "Community 92"
Cohesion: 0.83
Nodes (2): loadEnvForm(), toggleCustomFields()

### Community 39 - "Community 39"
Cohesion: 0.28
Nodes (10): setStatus(), checkPage(), COLORS, checkAuth(), showAuthedState(), showDisconnectedState(), showDeviceCodeUI(), startPolling() (+2 more)

### Community 76 - "Community 76"
Cohesion: 0.33
Nodes (1): TemplateSelector

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (1): SiteApiService

### Community 51 - "Community 51"
Cohesion: 0.20
Nodes (10): 0928aff fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, 0ec3246 fix: load api.js in popup context so account connect UI works, 27cec51 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2db115c fix: add -k flag for Rancher self-signed cert, 5a86c30 fix: device linking — use dashboard auth directly + exchange 202 for pending, 5e4fc4c fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge, 87a6081 fix(ci): use K8s native API path instead of broken Steve API PATCH, 98533b9 fix: deploy script with proper bash syntax, pre-computed timestamp, no nested date (+2 more)

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (9): 0ba8b30 revert: remove CI env var injection — envs stay in K8s, 106b076 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 21baf7e fix: copy root package.json into Docker build context, 382a89d feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 484f1c9 fix: use correct Rancher cluster ID (c-lx99g, not c-jxhnr), 8a74801 fix: install openssl for Prisma engine in API Dockerfile, 975505b fix: pin deployment to SHA-tagged image, not :latest, ee9fabe fix: expand onlyBuiltDependencies to cover all workspace packages (+1 more)

### Community 67 - "Community 67"
Cohesion: 0.25
Nodes (8): 2bb9ac8 Fix empty chat history crash and remove hardcoded Gemini for function calling, 388a0fe ci: switch to self-hosted ARC runners (tgmstudios-runners), 3f4e737 chore: remove .graphify artifacts, 625607f feat: add TurboRepo with remote cache for faster CI builds, 754c4ba Fix AIManager fallback chain with real health checks, a3002b1 fix: move /jobs/reorder route before /jobs/:id, cf181b9 fix: kanban drag-drop uses @add/@update instead of @change, f1a563e Add graphify knowledge graph and AGENTS.md

### Community 91 - "Community 91"
Cohesion: 0.50
Nodes (4): 3c3a572 ci: optimize arm64 Docker builds, 869e5e3 ci: enable Turbo remote cache scope, cf1c12d fix: install Tectonic on arm64 builds, e852de9 readd workflow

### Community 80 - "Community 80"
Cohesion: 0.40
Nodes (5): 5ca5e2a added bad site, 5cf7190 Final Changes, a03c122 Merge branch 'main' of https://github.com/tgmstudios/foligo, e450278 final, e57bb9b pushing demo site

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (14): 0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat, 18576fb fix: Dockerfile monorepo context for pnpm-lock.yaml, 1b5ddea feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 3087038 fix: install openssl for Prisma engine in API Dockerfile, 3c9693e fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 413498b fix: pin deployment to SHA-tagged image, not :latest, 517d7df fix: expand onlyBuiltDependencies to cover all workspace packages (+6 more)

### Community 65 - "Community 65"
Cohesion: 0.25
Nodes (8): 02f5b3e fix: move jobs/reorder route before jobs/:id, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2b2b612 chore: remove .graphify artifacts, 391098a feat: add TurboRepo with remote cache for faster CI builds, 577f1c6 ci: switch to self-hosted ARC runners (tgmstudios-runners), 5f2a237 Fix AIManager fallback chain with real health checks, 91c072c Add graphify knowledge graph and AGENTS.md, e52477f Fix empty chat history crash and remove hardcoded Gemini for function calling

### Community 66 - "Community 66"
Cohesion: 0.25
Nodes (8): 156116a dashboard fix, 3b00f25 fix, 3c7f32e fix, 73e954c npm install, 76b0a6d downgrade, 7e80672 prod entrypoint, c188ac8 gitignore, eef22fa tsc

### Community 52 - "Community 52"
Cohesion: 0.20
Nodes (10): 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b34879 fix: load api.js in popup context so account connect UI works, 4df342b fix: device linking — use dashboard auth directly + exchange 202 for pending, 9cff0d3 fix: add -k flag for Rancher self-signed cert, b76ca3c fix(ci): use strategic-merge-patch+json to preserve env vars, ba00164 fix: use -u basic auth instead of Bearer for Rancher API, c1c1833 fix(ci): use K8s native API path instead of broken Steve API PATCH, ccd62cc fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge (+2 more)

### Community 79 - "Community 79"
Cohesion: 0.40
Nodes (5): 404f746 Final Changes, 8ad0083 final, ab25160 Merge branch 'main' of https://github.com/tgmstudios/foligo, c038a1b added bad site, dec7f43 pushing demo site

### Community 112 - "Community 112"
Cohesion: 1.00
Nodes (1): docxtemplater

### Community 113 - "Community 113"
Cohesion: 1.00
Nodes (1): pizzip

### Community 81 - "Community 81"
Cohesion: 0.40
Nodes (5): AI Integration, Google Gemini AI, ElevenLabs Voice, Voice Webhook, AI Function Calling

### Community 47 - "Community 47"
Cohesion: 0.18
Nodes (11): Portfolio Generation, Content Blocks, Static Site Generator, Subdomain Routing, Markdown Editor, iOS SwiftUI App, Content Revisions, Portfolio Templates (+3 more)

### Community 101 - "Community 101"
Cohesion: 1.00
Nodes (2): Job Tracker (GoApply), Chrome Extension (GoApply)

## Knowledge Gaps
- **466 isolated node(s):** `content_links`, `sso_providers`, `ai_models`, `sso_providers`, `{ PrismaClient }` (+461 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 98`** (1 nodes): `content`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (1 nodes): `sso_providers`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 100`** (1 nodes): `ai_models`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (2 nodes): `user_integrations`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (1 nodes): `sso_providers`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `6fbbcc1 fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat`, `532eb3c fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (2 nodes): `Content`, `StudioDocumentSummary`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 95`** (2 nodes): `readPreferenceCookie()`, `clearPreferenceCookie()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `49075f5 feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes`, `c935419 fix: remove double-token for reasoning models (caused 504 timeouts)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `3725b15 Move old content`, `9030aa4 Move old content`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 102`** (1 nodes): `AgentController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 103`** (1 nodes): `ChatPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (2 nodes): `loadEnvForm()`, `toggleCustomFields()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `TemplateSelector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (1 nodes): `docxtemplater`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (1 nodes): `pizzip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 101`** (2 nodes): `Job Tracker (GoApply)`, `Chrome Extension (GoApply)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GeminiService` connect `Community 14` to `Community 26`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `prisma` connect `Community 1` to `Community 20`, `Community 30`, `Community 23`, `Community 4`, `Community 3`, `Community 22`, `Community 13`, `Community 44`, `Community 7`, `Community 17`, `Community 12`, `Community 33`, `Community 6`, `Community 15`, `Community 94`, `Community 2`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 36` to `Community 9`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `content_links`, `sso_providers`, `ai_models` to the rest of the system?**
  _466 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.07973421926910298 - nodes in this community are weakly interconnected._
- **Should `Community 22` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03278688524590164 - nodes in this community are weakly interconnected._