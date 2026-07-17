# Graph Report - .  (2026-07-17)

## Corpus Check
- 392 files · ~342,766 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1989 nodes · 4334 edges · 119 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 1520 · contains: 1210 · imports_from: 401 · PARENT_OF: 327 · ON_BRANCH: 315 · imports: 289 · calls: 114 · method: 65 · references: 54 · re_exports: 12 · uses: 6 · inherits: 3 · accesses: 1 · built_with: 1 · connects_to: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · entry_point: 1 · generates: 1 · handles: 1 · implemented_by: 1 · implements: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · serves: 1 · tracks: 1 · ui_for: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 392 · Candidates: 517
- Excluded: 4 untracked · 122018 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `170fb21`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `prisma` - 47 edges
2. `GeminiService` - 28 edges
3. `cache` - 23 edges
4. `authorizeProjectAccess()` - 16 edges
5. `AIManager` - 16 edges
6. `SiteApiService` - 12 edges
7. `authenticateToken()` - 8 edges
8. `requireAdmin()` - 8 edges
9. `handleValidation()` - 8 edges
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

### Community 79 - "Community 79"
Cohesion: 0.50
Nodes (7): users, projects, project_access, content, assets, site_config, ai_analysis

### Community 49 - "Community 49"
Cohesion: 0.31
Nodes (13): content_links, content_tags, content_meta, content_blocks, skills, experience_roles, _ProjectSkills, _ContentTags (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.13
Nodes (5): content, sso_providers, ai_models, sso_providers, 2d62706 fix(api): stop gitignoring prisma migrations, causing prod schema drift

### Community 103 - "Community 103"
Cohesion: 0.83
Nodes (3): media, users, projects

### Community 93 - "Community 93"
Cohesion: 0.53
Nodes (5): post_order, resume_chat_sessions, projects, content, users

### Community 104 - "Community 104"
Cohesion: 1.00
Nodes (3): resume_templates, resume_history, users

### Community 80 - "Community 80"
Cohesion: 0.46
Nodes (7): job_applications, user_profiles, saved_answers, cover_letters, generated_emails, api_tokens, users

### Community 94 - "Community 94"
Cohesion: 0.53
Nodes (5): resume_documents, resume_document_revisions, resume_history, users, job_applications

### Community 99 - "Community 99"
Cohesion: 0.80
Nodes (4): _ProfileLinkedJobs, _ProfileLinkedEducation, content, user_profiles

### Community 105 - "Community 105"
Cohesion: 0.83
Nodes (3): _ProfileLinkedSkills, user_profiles, skills

### Community 106 - "Community 106"
Cohesion: 0.83
Nodes (3): cover_letter_revisions, cover_letters, job_applications

### Community 81 - "Community 81"
Cohesion: 0.25
Nodes (7): 2d86eff feat(api): support resume templates and defaults, 3b51962 fix(api): retry Tectonic bundle warmup, 46c2570 fix(api): configure Tectonic CA certificates, aa92713 feat(api): add Job Assistant chat agent and Cover Letter document endpoints, bada62e fix(ci): don't fail api build when Tectonic bundle warmup can't reach host, c7ff091 feat(api): extend schema for cover letters, job categories/tags, and templates, ee60e4a feat(api): stream AI Content Creator sessions with reasoning and tool activity

### Community 107 - "Community 107"
Cohesion: 0.83
Nodes (3): _JobSavedAnswers, job_applications, saved_answers

### Community 109 - "Community 109"
Cohesion: 1.00
Nodes (2): user_integrations, users

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (24): analytics_properties, analytics_events, voice_providers, projects, express, { Prisma }, { authorizeProjectAccess }, {
  MAX_BATCH_SIZE,
  hash,
  createWriteKey,
  normalizeOrigin,
  originAllowed,
  normalizeEvent,
} (+16 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (9): platform_settings, { PrismaClient }, prisma, crypto, router, 48d46c3 SSO support, f0b501b feat: add web_search tool to all Foligo agents + admin settings, 2f0b6d3 SSO support (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.10
Nodes (8): ai_chat_sessions, users, ToolActivity, AgenticChatMessage, AgenticChatCallbacks, 8bbadc1 Add persistent AI chat sessions and analytics updates, d082103 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat, a446f43 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (77): express, path, cors, helmet, morgan, rateLimit, swaggerUi, swaggerJsdoc (+69 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (23): authorizeProjectAccess(), { validationResult }, handleValidation(), express, { body }, { prisma }, { cache }, { authorizeProjectAccess } (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (31): jwt, crypto, { prisma }, requireAdmin(), express, { prisma }, { requireAdmin }, router (+23 more)

### Community 56 - "Community 56"
Cohesion: 0.21
Nodes (11): authenticateToken(), express, router, ai, { authenticateToken }, { prisma }, { generateCoverLetter, generateCustomAnswer }, buildCoverLetterPrompt() (+3 more)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (32): TEMPLATE_STYLES, TEMPLATE_CONFIGS, siteApi, 054d6d6 proper .env, 07ab9dc fixed, 64bc1e2 fix sites, 654efd6 use markdown renderer, 69c514a Basic site loading (+24 more)

### Community 55 - "Community 55"
Cohesion: 0.15
Nodes (9): express, { body, validationResult }, { prisma }, { requireAdmin }, { encrypt }, { ensureBootstrapModels, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES }, ai, router (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (31): express, { body, query }, { prisma }, { cache }, { requireAdmin }, { handleValidation }, { paginate, buildPaginationResponse }, { buildSearchWhere } (+23 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (20): express, { body, validationResult }, multer, mammoth, pdfParseModule, { prisma }, { cache }, { authorizeProjectAccess, authenticateToken } (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (20): express, { body, query, validationResult }, { prisma }, router, allowedScopes, { prisma }, ai, parseEvaluation() (+12 more)

### Community 43 - "Community 43"
Cohesion: 0.17
Nodes (15): express, router, ai, { authenticateToken }, { prisma }, { createExtensionAgentServerTools, CLIENT_AGENT_TOOL_DEFS }, { flattenToolMessages }, { setupSSE } (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (41): express, router, geminiService, { prisma }, { cache }, express, { body, validationResult }, { prisma } (+33 more)

### Community 70 - "Community 70"
Cohesion: 0.20
Nodes (9): express, bcrypt, jwt, crypto, { body, validationResult }, { prisma }, { cache }, { authenticateToken } (+1 more)

### Community 67 - "Community 67"
Cohesion: 0.18
Nodes (7): express, {
  discovery,
  randomState,
  randomNonce,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  fetchUserInfo,
  ClientSecretPost
}, { prisma }, jwt, router, sessionStore, configCache

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (50): express, { body, validationResult }, { prisma }, { cache }, ai, { createContentEditorTools }, { createGithubTools }, { setupSSE } (+42 more)

### Community 28 - "Community 28"
Cohesion: 0.10
Nodes (21): express, { body }, { prisma }, { cache }, { authorizeProjectAccess }, { handleValidation }, githubService, { CONTENT_INCLUDE, getContentWithAccess, invalidateContentCache } (+13 more)

### Community 23 - "Community 23"
Cohesion: 0.10
Nodes (22): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, { findSimilarPostPairs }, router, { TfIdf } (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (33): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router, express, { body, validationResult } (+25 more)

### Community 92 - "Community 92"
Cohesion: 0.29
Nodes (6): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, router

### Community 52 - "Community 52"
Cohesion: 0.16
Nodes (10): express, { prisma }, router, PROFILE_PASSTHROUGH_FIELDS, PROFILE_URL_FIELDS, EXPERIENCE_INCLUDE, PROFILE_INCLUDE, pickPrimary() (+2 more)

### Community 32 - "Community 32"
Cohesion: 0.13
Nodes (16): express, multer, { v4: uuidv4 }, path, { body, validationResult }, { prisma }, { uploadFile, deleteFile, getFileUrl, minioClient, BUCKET_NAME }, { authenticateToken, authorizeProjectAccess } (+8 more)

### Community 102 - "Community 102"
Cohesion: 0.40
Nodes (4): express, router, { PrismaClient }, prisma

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (23): express, { body, validationResult }, path, { prisma }, ai, latexCompiler, { createResumeEditorTools }, { createGithubTools } (+15 more)

### Community 88 - "Community 88"
Cohesion: 0.29
Nodes (5): { PrismaClient }, bcrypt, prisma, bcryptjs, client

### Community 21 - "Community 21"
Cohesion: 0.10
Nodes (22): ai, { GeminiAPIError }, createAiClient(), { prisma }, { createAILogger }, { GENERATION_CONFIG }, { createAiClient }, { stripMarkdown, extractHashtags } (+14 more)

### Community 29 - "Community 29"
Cohesion: 0.16
Nodes (17): ai, { GeminiAPIError }, {
  createContentCreateTools,
  createContentEditTools
}, { buildConversationalSystemPrompt }, { GENERATION_CONFIG }, {
  extractStructuredData,
  extractStructuredDataUniversal,
  buildMetadataFromStructuredData,
  extractTitleFromConversation
}, { shouldCreateMultiplePosts, generateMultiplePosts }, buildInitialMessage() (+9 more)

### Community 57 - "Community 57"
Cohesion: 0.17
Nodes (10): handleFunctionCall(), { GeminiAPIError }, { AI_RESUME_CHATBOT_TOOLS }, { createGithubTools }, { buildResumeChatbotSystemPrompt }, { GENERATION_CONFIG }, { handleFunctionCall }, buildContextString() (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.16
Nodes (14): GENERATION_CONFIG, SYSTEM_INSTRUCTIONS, { utilityPrompts }, { GENERATION_CONFIG }, { cleanGeneratedContent }, extractStructuredData(), extractStructuredDataUniversal(), buildMetadataFromStructuredData() (+6 more)

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (1): GeminiService

### Community 46 - "Community 46"
Cohesion: 0.15
Nodes (13): { utilityPrompts }, { GENERATION_CONFIG }, shouldCreateMultiplePosts(), generateMultiplePosts(), { buildContextString, getCurrentDateTime }, buildConversationalSystemPrompt(), buildEditModePrompt(), getCurrentDateTime() (+5 more)

### Community 51 - "Community 51"
Cohesion: 0.14
Nodes (11): ai, AIService, { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { createProvider, listProviders, isProviderConfigured, SAFETY_SETTINGS }, { resolveModel, listModelSelections, ensureBootstrapModels }, { createAILogger }, { createProvider, listProviders }, { resolveModel, ensureBootstrapModels } (+3 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (11): aim, goapplyRoutes, 46be3c0 feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 933e05e AI Fixes, deepseek support, AI Merged into goapply, c371019 More AI Repairs, ded6ded Agentic editor and PDF Latex support, 7aa68eb Agentic editor and PDF Latex support, 8dcf942 AI Fixes, deepseek support, AI Merged into goapply (+3 more)

### Community 44 - "Community 44"
Cohesion: 0.27
Nodes (1): AIManager

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (14): { streamText, stepCountIs }, { createProvider, isProviderConfigured }, { resolveModel, listModelSelections }, manager, { prisma }, { decrypt }, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES (+6 more)

### Community 95 - "Community 95"
Cohesion: 0.40
Nodes (2): flattenToolMessages(), { flattenToolMessages }

### Community 64 - "Community 64"
Cohesion: 0.21
Nodes (11): { createGoogleGenerativeAI }, { createAnthropic }, { createOpenAICompatible }, PRESETS, OPENAI_COMPATIBLE_LABEL, SAFETY_SETTINGS, createProvider(), listProviders() (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.22
Nodes (8): { tool }, { z }, { createGithubTools }, { createPullPageTool }, _coreFoligoBaseTools(), createContentCreateTools(), createContentEditTools(), AI_RESUME_CHATBOT_TOOLS

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (11): GeminiError, GeminiConfigError, GeminiAPIError, GeminiParseError, GeminiValidationError, { GeminiAPIError }, RETRY_CONFIG, isRetryableError() (+3 more)

### Community 84 - "Community 84"
Cohesion: 0.25
Nodes (7): winston, customFormat, consoleTransport, fileTransport, errorFileTransport, logger, createAILogger()

### Community 76 - "Community 76"
Cohesion: 0.25
Nodes (8): { tool }, { z }, { createJobAssistantTools, jobAssistantTool }, { generateCoverLetter, generateCustomAnswer }, createExtensionAgentServerTools(), CLIENT_AGENT_TOOL_DEFS, jobAssistantTool(), createJobAssistantTools()

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (24): { Octokit }, { spawn }, os, path, { prisma }, { decrypt }, CLONE_TTL_MS, MAX_REPO_SIZE_KB (+16 more)

### Community 77 - "Community 77"
Cohesion: 0.28
Nodes (8): path, mammoth, pdfParseModule, TEXT_MIME_TYPES, extractPdf(), extractAttachmentText(), prepareAttachments(), buildModelMessage()

### Community 71 - "Community 71"
Cohesion: 0.24
Nodes (8): { tool }, { z }, { createWebSearchTool }, { createPullPageTool }, createCoverLetterEditorTools(), getPrisma(), webSearch(), createWebSearchTool()

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (8): { tool }, { z }, { projectAccessWhere }, { createWebSearchTool }, { createPullPageTool }, optionalText, profileSchema, projectAccessWhere()

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (9): { spawn }, os, path, crypto, parseLatexErrors(), compile(), runLuaLatex(), declaration (+1 more)

### Community 72 - "Community 72"
Cohesion: 0.36
Nodes (8): net, isPrivateIp(), assertPublicUrl(), readLimitedBody(), htmlToText(), pullPage(), createPullPageTool(), {
  htmlToText,
  isPrivateIp,
  pullPage,
  createPullPageTool,
}

### Community 97 - "Community 97"
Cohesion: 0.33
Nodes (5): { tool }, { z }, { createWebSearchTool }, { createPullPageTool }, createResumeEditorTools()

### Community 86 - "Community 86"
Cohesion: 0.36
Nodes (4): environmentMetadata(), sendEvent(), trackPageView(), onNav()

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (3): useCommandPaletteStore, c3c0c55 LATEX Editor, f883c97 LATEX Editor

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (5): MERMAID_THEME_VARIABLES, 3725b15 Move old content, 5944c16 Refactored the content editor to use the new Editor Studio. Refactored admin dashboard, 9030aa4 Move old content, ae8be0a Refactored the content editor to use the new Editor Studio. Refactored admin dashboard

### Community 31 - "Community 31"
Cohesion: 0.26
Nodes (6): 97e0c8d A lot of new stuff, f81a378 temp, 3f7125f A lot of new stuff, b75351a temp, plugin_vue, vite

### Community 25 - "Community 25"
Cohesion: 0.28
Nodes (11): Window, 16a008d Dark mode, 29df55c AI Multistep, 2b50442 Merge branch 'main' of https://github.com/tgmstudios/foligo, 893cac6 updates, 8b7636e Merge branch 'main' of https://github.com/tgmstudios/foligo, 8fa9517 initial api and dash, 9c1c8f0 markdown cooking (+3 more)

### Community 89 - "Community 89"
Cohesion: 0.29
Nodes (6): e3ac367 social media and better ai chatbot experience, e966c80 New AI resume generator and site-wide touch ups, f0d2a2e media library changes, 2437013 media library changes, baaf15e social media and better ai chatbot experience, c47de3e New AI resume generator and site-wide touch ups

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (6): readPreferenceCookie(), clearPreferenceCookie(), 02cf9b1 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply, ca272cd feat(dashboard): support resume templates and defaults in the Resume Gallery, 2736250 feat(dashboard): support resume templates and defaults in the Resume Gallery, e428e58 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply

### Community 36 - "Community 36"
Cohesion: 0.11
Nodes (14): 19d43b2 fix(api): clean up cover letter PDFs on delete, describe LaTeX to the assistant, 3bfa0fc chore: add graphify skill config and project instructions, 6fbbcc1 fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat, aaf93a6 chore: sync graphify code-graph snapshot, b0924e1 refactor(dashboard): always sync Content Studio preview scroll with editor, cd8b3b4 fix(dashboard): hide the status badge on the portfolios list view, f429a54 feat(api): add cover letter editor tools and portfolio context service, 347793b refactor(dashboard): always sync Content Studio preview scroll with editor (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (25): withErrorToast(), syncEntityInState(), syncNestedEntityInState(), SiteConfig, ProjectMember, Content, ContentLink, ContentTag (+17 more)

### Community 50 - "Community 50"
Cohesion: 0.23
Nodes (9): CoverLetterDocument, useCoverLetterDocuments(), documentsApi, coverLetterAdapter, resumeAdapter, adapters, registerAdapter(), 343deb8 feat(dashboard): add Cover Letter Studio with PDF compile and revision history (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (5): ActivityItem, useProjectStore, Project, config, formatContentType()

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (14): ResumeDocumentSummary, ResumeDocument, ResumeDocumentRevisionSummary, ResumeDocumentRevisionDetail, useResumeDocuments(), documentsApi, StudioDocumentSummary, StudioSaveKind (+6 more)

### Community 59 - "Community 59"
Cohesion: 0.23
Nodes (11): 1596c73 Voice mode, 245df8e Merge branch 'main' of https://github.com/tgmstudios/foligo, 27c2bf1 feat: add analytics and content similarity, 81238cb Dashboard improvements, 8d9085b good ai, b30b552 Good for prod, f0b4be0 remove old code, 150821f remove old code (+3 more)

### Community 61 - "Community 61"
Cohesion: 0.21
Nodes (11): app, pinia, authStore, User, LoginCredentials, RegisterData, useAuthStore, index_css (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (6): toast, api, aiApi, Media, MediaListResponse, axios

### Community 48 - "Community 48"
Cohesion: 0.13
Nodes (14): LinkableExperienceCategory, GoApplyProfile, GoApplyJob, JobStatus, SavedAnswer, CoverLetter, JobFormData, JOB_STATUSES (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (21): 063e407 feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 1063f67 fix: reasoning model detection + auto-double token budget, 2efaeac feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, 336352a fix: correct logo import in LinkDevice.vue, 59972e4 fix: use default import for api in LinkDevice.vue, 60991ef fix: add canvas build deps for alpine dashboard Dockerfile, c2b335c fix: OpenCode reasoning model support + route collision fix, d4e316e fix: remove double-token for reasoning models (caused 504 timeouts) (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (5): 00d5f02 feat(goapply): truncate kanban notes, add search filter to cover letters & resumes, enhance badges, 648453e feat(studio): add draggable resizing for editor/preview split and chat sidebar, bbb2aec feat(goapply): show and filter by linked job category on resumes and cover letters, cfb6e19 feat(goapply): add sort and filtering to resume, cover letter, and Q&A tabs, f14f99d fix(goapply): source resume/cover letter category filter from all jobs

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (6): ChatPanel, Filler, Finder, 8142523 feat: add extension AI agent workflow, c34468d fix: make arm64 document builds reliable, 2f47ee3 fix: make arm64 document builds reliable

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (15): GoApplyAPI, Banners, Boards, Consent, Detector, Tracker, Tutorial, UI (+7 more)

### Community 62 - "Community 62"
Cohesion: 0.26
Nodes (8): armSubmitWatcher(), previewDocument(), forceAIRescan(), startup(), tryActivate(), runManualAIRescan(), start(), blobToDataUrl()

### Community 108 - "Community 108"
Cohesion: 0.83
Nodes (2): loadEnvForm(), toggleCustomFields()

### Community 60 - "Community 60"
Cohesion: 0.28
Nodes (10): setStatus(), checkPage(), COLORS, checkAuth(), showAuthedState(), showDisconnectedState(), showDeviceCodeUI(), startPolling() (+2 more)

### Community 75 - "Community 75"
Cohesion: 0.36
Nodes (8): parseOS(), parseBrowser(), detectDeviceType(), send(), trackPageView(), 2d971a7 feat(analytics): add hosted tracking script and dashboard embed snippet, a2c260b fix: handle stale PDF paths after server restart, a75b95c feat(sites): add analytics tracking plugin with fingerprinting and flow tracking

### Community 98 - "Community 98"
Cohesion: 0.33
Nodes (1): TemplateSelector

### Community 65 - "Community 65"
Cohesion: 0.17
Nodes (1): SiteApiService

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (48): 046ebb7 fix(api): retry Tectonic bundle warmup, 0498826 tsc, 09d0f94 compiler: switch from tectonic (XeTeX) to LuaLaTeX, 0a28c02 feat(api): extend schema for cover letters, job categories/tags, and templates, 0fa26e1 ci: speed up ARM64 API builds, 1948fd7 fix(ci): don't fail api build when Tectonic bundle warmup can't reach host, 2226c00 prod entrypoint, 2f601fd fix (+40 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (18): 07e29da fix: use PATCH instead of GET/PUT for deploy (Rancher API compat), 0ba8b30 revert: remove CI env var injection — envs stay in K8s, 106b076 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 18fcd65 fix: monorepo Dockerfiles + pnpm build scripts approval, 21baf7e fix: copy root package.json into Docker build context, 35d3be7 fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 382a89d feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 484f1c9 fix: use correct Rancher cluster ID (c-lx99g, not c-jxhnr) (+10 more)

### Community 58 - "Community 58"
Cohesion: 0.15
Nodes (13): 0928aff fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, 0ec3246 fix: load api.js in popup context so account connect UI works, 27cec51 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2db115c fix: add -k flag for Rancher self-signed cert, 3f4e737 chore: remove .graphify artifacts, 47b83e8 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 5a86c30 fix: device linking — use dashboard auth directly + exchange 202 for pending, 5e4fc4c fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge (+5 more)

### Community 96 - "Community 96"
Cohesion: 0.33
Nodes (6): 26637c3 refactor(api): split projects.js into projects-crud/site-config (Phase 3), 32b07a0 refactor(api): wire index.js mounts to the split route files, 761be74 chore(api): sync pnpm-lock.yaml after removing @google/generative-ai, ab5032d refactor(api): split admin.js into admin-users/projects/content/stats (Phase 2), afe8523 refactor(api): split content.js into content-crud/order/chat (Phase 5), d7f3158 refactor(api): split goapply.js into 5 focused route files (Phase 6)

### Community 90 - "Community 90"
Cohesion: 0.29
Nodes (7): 2bb9ac8 Fix empty chat history crash and remove hardcoded Gemini for function calling, 388a0fe ci: switch to self-hosted ARC runners (tgmstudios-runners), 625607f feat: add TurboRepo with remote cache for faster CI builds, 754c4ba Fix AIManager fallback chain with real health checks, a3002b1 fix: move /jobs/reorder route before /jobs/:id, cf181b9 fix: kanban drag-drop uses @add/@update instead of @change, f1a563e Add graphify knowledge graph and AGENTS.md

### Community 101 - "Community 101"
Cohesion: 0.40
Nodes (5): 5ca5e2a added bad site, 5cf7190 Final Changes, a03c122 Merge branch 'main' of https://github.com/tgmstudios/foligo, e450278 final, e57bb9b pushing demo site

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (18): 0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat, 18576fb fix: Dockerfile monorepo context for pnpm-lock.yaml, 1b5ddea feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 3087038 fix: install openssl for Prisma engine in API Dockerfile, 3c9693e fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 413498b fix: pin deployment to SHA-tagged image, not :latest, 517d7df fix: expand onlyBuiltDependencies to cover all workspace packages (+10 more)

### Community 82 - "Community 82"
Cohesion: 0.25
Nodes (8): 02f5b3e fix: move jobs/reorder route before jobs/:id, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2b2b612 chore: remove .graphify artifacts, 391098a feat: add TurboRepo with remote cache for faster CI builds, 577f1c6 ci: switch to self-hosted ARC runners (tgmstudios-runners), 5f2a237 Fix AIManager fallback chain with real health checks, 91c072c Add graphify knowledge graph and AGENTS.md, e52477f Fix empty chat history crash and remove hardcoded Gemini for function calling

### Community 74 - "Community 74"
Cohesion: 0.22
Nodes (9): 156116a dashboard fix, 3b00f25 fix, 3c7f32e fix, 73e954c npm install, 76b0a6d downgrade, 7e80672 prod entrypoint, b8bcbcf site fix, c188ac8 gitignore (+1 more)

### Community 83 - "Community 83"
Cohesion: 0.25
Nodes (8): 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b34879 fix: load api.js in popup context so account connect UI works, 9cff0d3 fix: add -k flag for Rancher self-signed cert, ba00164 fix: use -u basic auth instead of Bearer for Rancher API, c1c1833 fix(ci): use K8s native API path instead of broken Steve API PATCH, ccd62cc fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge, f645d9c fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, fd79a40 fix: deploy script with proper bash syntax, pre-computed timestamp, no nested date

### Community 100 - "Community 100"
Cohesion: 0.40
Nodes (5): 404f746 Final Changes, 8ad0083 final, ab25160 Merge branch 'main' of https://github.com/tgmstudios/foligo, c038a1b added bad site, dec7f43 pushing demo site

### Community 115 - "Community 115"
Cohesion: 1.00
Nodes (1): docxtemplater

### Community 116 - "Community 116"
Cohesion: 1.00
Nodes (1): generative_ai

### Community 117 - "Community 117"
Cohesion: 1.00
Nodes (1): http

### Community 118 - "Community 118"
Cohesion: 1.00
Nodes (1): https

### Community 119 - "Community 119"
Cohesion: 1.00
Nodes (1): mammoth

### Community 120 - "Community 120"
Cohesion: 1.00
Nodes (1): minio

### Community 121 - "Community 121"
Cohesion: 1.00
Nodes (1): openid_client

### Community 122 - "Community 122"
Cohesion: 1.00
Nodes (1): pdf_parse

### Community 123 - "Community 123"
Cohesion: 1.00
Nodes (1): pizzip

### Community 124 - "Community 124"
Cohesion: 1.00
Nodes (1): redis

### Community 125 - "Community 125"
Cohesion: 1.00
Nodes (1): uuid

### Community 126 - "Community 126"
Cohesion: 1.00
Nodes (1): winston

### Community 91 - "Community 91"
Cohesion: 0.29
Nodes (7): AI Integration, Google Gemini AI, ElevenLabs Voice, Resume Generator, Voice Webhook, AI Function Calling, Resume Chatbot

### Community 68 - "Community 68"
Cohesion: 0.18
Nodes (11): Portfolio Generation, Content Blocks, Static Site Generator, Subdomain Routing, Markdown Editor, iOS SwiftUI App, Content Revisions, Portfolio Templates (+3 more)

### Community 112 - "Community 112"
Cohesion: 1.00
Nodes (2): JWT Authentication, SSO/OAuth Authentication

### Community 110 - "Community 110"
Cohesion: 1.00
Nodes (2): Job Tracker (GoApply), Chrome Extension (GoApply)

### Community 111 - "Community 111"
Cohesion: 1.00
Nodes (2): MinIO Media Storage, Docker Deployment

### Community 114 - "Community 114"
Cohesion: 1.00
Nodes (2): Redis Caching, Rate Limiting

### Community 113 - "Community 113"
Cohesion: 1.00
Nodes (2): Prisma ORM, PostgreSQL Database

## Knowledge Gaps
- **639 isolated node(s):** `content_links`, `sso_providers`, `ai_models`, `voice_providers`, `platform_settings` (+634 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 109`** (2 nodes): `user_integrations`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 95`** (2 nodes): `flattenToolMessages()`, `{ flattenToolMessages }`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (2 nodes): `loadEnvForm()`, `toggleCustomFields()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (1 nodes): `TemplateSelector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (1 nodes): `docxtemplater`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (1 nodes): `generative_ai`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (1 nodes): `http`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (1 nodes): `https`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (1 nodes): `mammoth`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (1 nodes): `minio`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 121`** (1 nodes): `openid_client`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 122`** (1 nodes): `pdf_parse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (1 nodes): `pizzip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (1 nodes): `redis`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (1 nodes): `uuid`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `winston`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (2 nodes): `JWT Authentication`, `SSO/OAuth Authentication`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (2 nodes): `Job Tracker (GoApply)`, `Chrome Extension (GoApply)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (2 nodes): `MinIO Media Storage`, `Docker Deployment`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (2 nodes): `Redis Caching`, `Rate Limiting`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (2 nodes): `Prisma ORM`, `PostgreSQL Database`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GeminiService` connect `Community 17` to `Community 21`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `prisma` connect `Community 3` to `Community 55`, `Community 9`, `Community 7`, `Community 24`, `Community 56`, `Community 12`, `Community 43`, `Community 39`, `Community 21`, `Community 70`, `Community 67`, `Community 2`, `Community 28`, `Community 23`, `Community 6`, `Community 92`, `Community 19`, `Community 52`, `Community 32`, `Community 14`, `Community 13`, `Community 16`, `Community 1`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 44` to `Community 51`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `content_links`, `sso_providers`, `ai_models` to the rest of the system?**
  _639 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 41` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 13` be split into smaller, more focused modules?**
  _Cohesion score 0.10752688172043011 - nodes in this community are weakly interconnected._
- **Should `Community 27` be split into smaller, more focused modules?**
  _Cohesion score 0.09782608695652174 - nodes in this community are weakly interconnected._