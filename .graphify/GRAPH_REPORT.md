# Graph Report - .  (2026-07-25)

## Corpus Check
- 414 files · ~374,541 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2187 nodes · 4799 edges · 128 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 1624 · contains: 1386 · imports_from: 422 · PARENT_OF: 339 · ON_BRANCH: 327 · imports: 317 · calls: 226 · method: 65 · references: 55 · re_exports: 12 · uses: 6 · inherits: 3 · accesses: 1 · built_with: 1 · connects_to: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · entry_point: 1 · generates: 1 · handles: 1 · implemented_by: 1 · implements: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · serves: 1 · tracks: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 414 · Candidates: 540
- Excluded: 0 untracked · 121638 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `53cc332`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `prisma` - 51 edges
2. `GeminiService` - 28 edges
3. `cache` - 25 edges
4. `authorizeProjectAccess()` - 16 edges
5. `AIManager` - 16 edges
6. `handleAgentEvent()` - 13 edges
7. `SiteApiService` - 12 edges
8. `addStatusChip()` - 10 edges
9. `refreshAccountStatus()` - 9 edges
10. `authenticateToken()` - 8 edges

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
Cohesion: 0.05
Nodes (44): bcryptjs, client, 1596c73 Voice mode, 16a008d Dark mode, 2437013 media library changes, 245df8e Merge branch 'main' of https://github.com/tgmstudios/foligo, 27c2bf1 feat: add analytics and content similarity, 29df55c AI Multistep (+36 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (33): 0541f93 cors fix, 054d6d6 proper .env, 07ab9dc fixed, 16d2394 final, 2457110 fixed, 5345604 Fix App Icon, 64bc1e2 fix sites, 654efd6 use markdown renderer (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (77): connectDatabase(), connectRedis(), cors, express_rate_limit, helmet, morgan, additionalCorsOrigins, adminAiModelRoutes (+69 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (61): 0702c3b fix(sse): prevent QUIC/HTTP3 connection drops on long AI responses, 1de7813 feat(goapply): capture role descriptions, job categories, and side-panel job workspace, 3a97bc9 fix(ai): fix undefined sendSse/cleanup crash in all SSE chat routes, 40a5f9c feat: bump all agent maxSteps from 6-8 to 30-40 turns, b5a50cc fix(latex): parse tectonic inline error format + detect microtype/XeTeX conflict, ai, { body, validationResult }, { cache } (+53 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (48): { cache }, express, geminiService, { prisma }, router, 07b32b9 refactor(api): reorganize routes/ into domain subfolders, 4bdce87 refactor(api): reorganize services/ into domain subfolders, { authorizeProjectAccess } (+40 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (58): addMessage(), addStatusChip(), categoriesFromProfile(), clearMessages(), createCoverLetterForCurrentJob(), createResumeForCurrentJob(), docRowHtml(), downloadResume() (+50 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (48): { authorizeProjectAccess }, { body }, { cache }, express, { getContentWithAccess, invalidateContentCache }, { handleValidation }, { prisma }, router (+40 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (50): main, 0498826 tsc, 09d0f94 compiler: switch from tectonic (XeTeX) to LuaLaTeX, 09f486f fix: install Tectonic on arm64 builds, 0b81330 refactor(api): rename session-flow.js → ai-session.js, 0fa26e1 ci: speed up ARM64 API builds, 150821f remove old code, 2226c00 prod entrypoint (+42 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (36): analytics_events, analytics_properties, projects, voice_providers, cleanString(), createWriteKey(), crypto, hash() (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (34): { body, query }, { buildSearchWhere }, { cache }, express, { handleValidation }, { paginate, buildPaginationResponse }, { prisma }, { requireAdmin } (+26 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (31): express, express_validator, fs, fetchPortfolioItem(), getPortfolioContext(), multer, ai, aiService (+23 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (22): 063e407 feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 0c55f26 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 1063f67 fix: reasoning model detection + auto-double token budget, 15c176e fix: OpenCode reasoning model support + route collision fix, 2e0b15f feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 2efaeac feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, 2fe136f feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 336352a fix: correct logo import in LinkDevice.vue (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (27): { authorizeProjectAccess }, { body }, buildContentFieldUpdate(), { cache }, { CONTENT_INCLUDE, getContentWithAccess, invalidateContentCache }, express, githubService, { handleValidation } (+19 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (1): GeminiService

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (25): bb111d8 refactor(dashboard): reorganize projects store, extract types/composables, syncEntityInState(), syncNestedEntityInState(), withErrorToast(), ContentBlock, ContentLink, ContentMeta, ContentTag (+17 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (24): cacheKey(), cleanupAllSessionsForUser(), cleanupSession(), CLONE_TTL_MS, cloneCache, { decrypt }, ensureClone(), getIntegration() (+16 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (11): aim, 46be3c0 feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 7aa68eb Agentic editor and PDF Latex support, 8dcf942 AI Fixes, deepseek support, AI Merged into goapply, 933e05e AI Fixes, deepseek support, AI Merged into goapply, bde1fd9 More AI Repairs, c371019 More AI Repairs, ded6ded Agentic editor and PDF Latex support (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (22): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { findSimilarPostPairs }, { prisma }, router, buildVectors() (+14 more)

### Community 18 - "Community 18"
Cohesion: 0.08
Nodes (19): ai, { authorizeProjectAccess, authenticateToken }, { body, validationResult }, { cache }, { createPortfolioAgentTools }, CURRENT_PAGE_LABELS, express, { findSimilarPostPairs } (+11 more)

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (20): ALLOWED_KEYS, express, { prisma }, { requireAdmin }, router, express, { prisma }, { requireAdmin } (+12 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (19): ai, createAiClient(), { GeminiAPIError }, { createAiClient }, { createAILogger }, { GENERATION_CONFIG }, metadata, multiPost (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (18): ai, { body, validationResult }, { encrypt }, { ensureBootstrapModels, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES }, express, { prisma }, { requireAdmin }, router (+10 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (15): 2f47ee3 fix: make arm64 document builds reliable, 5561a3a feat(api): add GitHub account integration and repo-crawling AI tools, 8142523 feat: add extension AI agent workflow, 87b45fd fix(extension): make autofill and job tracking more reliable, aa225ca fix(extension): make autofill and job tracking more reliable, b964476 feat(extension): rebuild browser agent on a session-scoped side panel, c34468d fix: make arm64 document builds reliable, c8cf150 fix(extension): stop job tracking from overwriting unrelated cards (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (3): c3c0c55 LATEX Editor, f883c97 LATEX Editor, useCommandPaletteStore

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (15): armSubmitWatcher(), blobToDataUrl(), broadcastToSidePanel(), broadcastTurnCompletion(), findAndHighlightSubmit(), forceAIRescan(), getOwnTabId(), previewDocument() (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (15): computeDerivedFields(), EXPERIENCE_INCLUDE, express, pickPrimary(), { prisma }, PROFILE_INCLUDE, PROFILE_PASSTHROUGH_FIELDS, PROFILE_URL_FIELDS (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (15): platform_settings, f0b501b feat: add web_search tool to all Foligo agents + admin settings, createCoverLetterEditorTools(), { createPullPageTool }, { createWebSearchTool }, { tool }, { z }, { createPullPageTool } (+7 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (16): { createProvider, isProviderConfigured }, manager, { resolveModel, listModelSelections }, { streamText, stepCountIs }, AnthropicProvider, { createAnthropic }, { createGoogleGenerativeAI }, { createOpenAICompatible } (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.11
Nodes (7): 19d43b2 fix(api): clean up cover letter PDFs on delete, describe LaTeX to the assistant, 347793b refactor(dashboard): always sync Content Studio preview scroll with editor, 532eb3c fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat, 648453e feat(studio): add draggable resizing for editor/preview split and chat sidebar, 6fbbcc1 fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat, b0924e1 refactor(dashboard): always sync Content Studio preview scroll with editor, ee19071 fix(api): clean up cover letter PDFs on delete, describe LaTeX to the assistant

### Community 29 - "Community 29"
Cohesion: 0.11
Nodes (16): { cache }, { CONTENT_INCLUDE, invalidateContentCache }, { createJobAssistantTools }, createPortfolioAgentTools(), { createPullPageTool }, { createWebSearchTool }, JOB_STATUSES, { matchOrCreateSkills, matchOrCreateTags } (+8 more)

### Community 30 - "Community 30"
Cohesion: 0.13
Nodes (16): deleteFile(), ensureBucket(), getFileUrl(), Minio, minioClient, uploadFile(), { authenticateToken, authorizeProjectAccess }, { body, validationResult } (+8 more)

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (6): axios, aiApi, api, toast, Media, MediaListResponse

### Community 32 - "Community 32"
Cohesion: 0.11
Nodes (18): 0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat, 18576fb fix: Dockerfile monorepo context for pnpm-lock.yaml, 1b5ddea feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 3087038 fix: install openssl for Prisma engine in API Dockerfile, 3c9693e fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 413498b fix: pin deployment to SHA-tagged image, not :latest, 517d7df fix: expand onlyBuiltDependencies to cover all workspace packages (+10 more)

### Community 33 - "Community 33"
Cohesion: 0.11
Nodes (18): 07e29da fix: use PATCH instead of GET/PUT for deploy (Rancher API compat), 0ba8b30 revert: remove CI env var injection — envs stay in K8s, 106b076 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 18fcd65 fix: monorepo Dockerfiles + pnpm build scripts approval, 21baf7e fix: copy root package.json into Docker build context, 35d3be7 fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 382a89d feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 484f1c9 fix: use correct Rancher cluster ID (c-lx99g, not c-jxhnr) (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.12
Nodes (5): ActivityItem, useProjectStore, Project, config, formatContentType()

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (11): GeminiAPIError, GeminiConfigError, GeminiError, GeminiParseError, GeminiValidationError, calculateDelay(), { GeminiAPIError }, isRetryableError() (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (15): CLIENT_AGENT_TOOL_DEFS, createExtensionAgentServerTools(), { createJobAssistantTools, jobAssistantTool }, deriveTrackedIdentity(), { generateCoverLetter, generateCustomAnswer }, GENERIC_ATS_PATH_PARTS, getExtensionAgentCapabilities(), JOB_STATUS_SCHEMA (+7 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (16): ai, { authenticateToken }, buildChatSystemPrompt(), buildContextBlock(), buildFieldSystemPrompt(), buildRescanSystemPrompt(), { createExtensionAgentServerTools, CLIENT_AGENT_TOOL_DEFS }, {
  createExtensionAgentServerTools,
  CLIENT_AGENT_TOOL_DEFS,
  getExtensionAgentCapabilities,
} (+8 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (15): GENERATION_CONFIG, SYSTEM_INSTRUCTIONS, buildMetadataFromStructuredData(), { cleanGeneratedContent }, extractMetadataBasic(), extractMetadataFromConversation(), extractStructuredData(), extractStructuredDataUniversal() (+7 more)

### Community 40 - "Community 40"
Cohesion: 0.13
Nodes (5): content, sso_providers, ai_models, 2d62706 fix(api): stop gitignoring prisma migrations, causing prod schema drift, sso_providers

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (10): ai_chat_sessions, users, 38dc01a fix(dashboard): remove AI studio test animation, 8bbadc1 Add persistent AI chat sessions and analytics updates, a446f43 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat, b611ae7 feat(ai): add pull page tool to content creator, d082103 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat, AgenticChatCallbacks (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.27
Nodes (1): AIManager

### Community 43 - "Community 43"
Cohesion: 0.14
Nodes (13): ai, { buildConversationalSystemPrompt }, buildInitialMessage(), {
  createContentCreateTools,
  createContentEditTools
}, {
  extractStructuredData,
  extractStructuredDataUniversal,
  buildMetadataFromStructuredData,
  extractTitleFromConversation
}, { GeminiAPIError }, { GENERATION_CONFIG }, handleAISession() (+5 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (9): 0c81bd9 fix: CI auto-deploy with latest tag, kanban drag, AI CMS Gemini fallback, GoApply branding, 241e6c0 fix: kanban drag-save with local reactive columns + add extension to repo, 8f85d95 fix: CI auto-deploy with latest tag, kanban drag, AI CMS Gemini fallback, GoApply branding, 9e48065 fix: kanban drag-save with local reactive columns + add extension to repo, Banners, Boards, Consent, Detector (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (14): 046ebb7 fix(api): retry Tectonic bundle warmup, 0a28c02 feat(api): extend schema for cover letters, job categories/tags, and templates, 1948fd7 fix(ci): don't fail api build when Tectonic bundle warmup can't reach host, 2d86eff feat(api): support resume templates and defaults, 3b51962 fix(api): retry Tectonic bundle warmup, 46c2570 fix(api): configure Tectonic CA certificates, 797a98f feat(api): support resume templates and defaults, 7da6b20 fix(api): configure Tectonic CA certificates (+6 more)

### Community 46 - "Community 46"
Cohesion: 0.13
Nodes (2): 00d5f02 feat(goapply): truncate kanban notes, add search filter to cover letters & resumes, enhance badges, f14f99d fix(goapply): source resume/cover letter category filter from all jobs

### Community 47 - "Community 47"
Cohesion: 0.14
Nodes (2): bbb2aec feat(goapply): show and filter by linked job category on resumes and cover letters, cfb6e19 feat(goapply): add sort and filtering to resume, cover letter, and Q&A tabs

### Community 48 - "Community 48"
Cohesion: 0.13
Nodes (14): CoverLetter, GoApplyJob, GoApplyProfile, JOB_STATUSES, JobFormData, JobStatus, KANBAN_COLUMNS, LinkableExperienceCategory (+6 more)

### Community 50 - "Community 50"
Cohesion: 0.31
Nodes (13): content, content_blocks, content_links, content_meta, content_tags, _ContentSkills, _ContentTags, experience_roles (+5 more)

### Community 51 - "Community 51"
Cohesion: 0.23
Nodes (9): 0c74186 feat(dashboard): add Cover Letter Studio with PDF compile and revision history, 343deb8 feat(dashboard): add Cover Letter Studio with PDF compile and revision history, CoverLetterDocument, useCoverLetterDocuments(), coverLetterAdapter, documentsApi, resumeAdapter, adapters (+1 more)

### Community 52 - "Community 52"
Cohesion: 0.14
Nodes (11): ai, AIService, { createAILogger }, { createGeminiLogger }, { createProvider, listProviders }, { createProvider, listProviders, isProviderConfigured, SAFETY_SETTINGS }, { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { resolveModel } (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (9): createJobAssistantTools(), { createPullPageTool }, { createWebSearchTool }, jobAssistantTool(), optionalText, profileSchema, { projectAccessWhere }, { tool } (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.21
Nodes (11): ai, { authenticateToken }, express, { generateCoverLetter, generateCustomAnswer }, { prisma }, router, buildCoverLetterPrompt(), buildCustomAnswerPrompt() (+3 more)

### Community 56 - "Community 56"
Cohesion: 0.17
Nodes (10): handleFunctionCall(), { AI_RESUME_CHATBOT_TOOLS }, { buildResumeChatbotSystemPrompt }, { createGithubTools }, { GeminiAPIError }, { GENERATION_CONFIG }, { handleFunctionCall }, buildContextString() (+2 more)

### Community 57 - "Community 57"
Cohesion: 0.18
Nodes (5): 089f74b Refresh AI-edited posts and experience roles, 09d09b4 feat(ai): add attachment support across editors, raise agent token budgets, 19d3d7b Update portable graphify artifacts, 9fde3b9 Refresh views after AI content changes, cf26e1d feat(ai): extend AI Content Creator to GoApply and add current-page awareness

### Community 58 - "Community 58"
Cohesion: 0.15
Nodes (13): 0928aff fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, 0ec3246 fix: load api.js in popup context so account connect UI works, 27cec51 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2db115c fix: add -k flag for Rancher self-signed cert, 3f4e737 chore: remove .graphify artifacts, 47b83e8 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 5a86c30 fix: device linking — use dashboard auth directly + exchange 202 for pending, 5e4fc4c fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge (+5 more)

### Community 59 - "Community 59"
Cohesion: 0.21
Nodes (11): index_css, pinia, app, authStore, pinia, LoginCredentials, RegisterData, useAuthStore (+3 more)

### Community 61 - "Community 61"
Cohesion: 0.21
Nodes (8): EditorStudioAdapter, StudioDocumentSummary, StudioMetaFieldSchema, StudioQuickAction, StudioRevisionDetail, StudioRevisionSummary, StudioSaveKind, StudioSaveResult

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (10): addGifFrame(), cacheCapturedImage(), ensureAgentTabGroup(), ensureOffscreenDocument(), gifFrameStore, gifRecordingGroups, handleGifCreator(), recordGifFrame() (+2 more)

### Community 64 - "Community 64"
Cohesion: 0.17
Nodes (1): SiteApiService

### Community 65 - "Community 65"
Cohesion: 0.22
Nodes (8): AI_RESUME_CHATBOT_TOOLS, _coreFoligoBaseTools(), createContentCreateTools(), createContentEditTools(), { createGithubTools }, { createPullPageTool }, { tool }, { z }

### Community 66 - "Community 66"
Cohesion: 0.18
Nodes (8): { authenticateToken }, crypto, { encrypt }, express, githubService, { prisma }, router, stateStore

### Community 67 - "Community 67"
Cohesion: 0.18
Nodes (7): configCache, {
  discovery,
  randomState,
  randomNonce,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  fetchUserInfo,
  ClientSecretPost
}, express, jwt, { prisma }, router, sessionStore

### Community 68 - "Community 68"
Cohesion: 0.22
Nodes (5): 170fb21 fix: allow empty experience role end dates, 6ac3765 fix: resume scoring timeout - use QUICK model + aiApi (180s timeout), 76096a9 feat: add HackerRank resume scoring to resume studio, b9a78d3 fix(extension): raise agent continuation limit from 20 to 100, ef3bc25 fix: persist AI chats and resume scores

### Community 69 - "Community 69"
Cohesion: 0.18
Nodes (2): 3725b15 Move old content, 9030aa4 Move old content

### Community 70 - "Community 70"
Cohesion: 0.18
Nodes (11): Content Blocks, Content Revisions, Express REST API, iOS SwiftUI App, Markdown Editor, Nuxt.js SSR, Portfolio Generation, Portfolio Templates (+3 more)

### Community 72 - "Community 72"
Cohesion: 0.24
Nodes (9): compile(), crypto, os, parseLatexErrors(), path, { PDFDocument }, runLuaLatex(), sanitizeMetadata() (+1 more)

### Community 73 - "Community 73"
Cohesion: 0.20
Nodes (9): { body, validationResult }, { encrypt, decrypt }, express, http, https, { prisma }, { requireAdmin }, router (+1 more)

### Community 74 - "Community 74"
Cohesion: 0.20
Nodes (9): { authenticateToken }, bcrypt, { body, validationResult }, { cache }, crypto, express, jwt, { prisma } (+1 more)

### Community 75 - "Community 75"
Cohesion: 0.36
Nodes (8): assertPublicUrl(), createPullPageTool(), htmlToText(), isPrivateIp(), net, pullPage(), readLimitedBody(), {
  htmlToText,
  isPrivateIp,
  pullPage,
  createPullPageTool,
}

### Community 76 - "Community 76"
Cohesion: 0.29
Nodes (7): ai, parseEvaluation(), { prisma }, requestEvaluation(), scoreResume(), mockGenerateChat, { parseEvaluation, requestEvaluation }

### Community 77 - "Community 77"
Cohesion: 0.22
Nodes (2): declaration, 2533f8f feat(editor-studio): rich compile errors + LaTeX/markdown linting

### Community 78 - "Community 78"
Cohesion: 0.25
Nodes (6): generateMultiplePosts(), { GENERATION_CONFIG }, shouldCreateMultiplePosts(), { utilityPrompts }, fallbackQuestions, utilityPrompts

### Community 79 - "Community 79"
Cohesion: 0.25
Nodes (4): 02cf9b1 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply, 2736250 feat(dashboard): support resume templates and defaults in the Resume Gallery, ca272cd feat(dashboard): support resume templates and defaults in the Resume Gallery, e428e58 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply

### Community 80 - "Community 80"
Cohesion: 0.22
Nodes (9): 156116a dashboard fix, 3b00f25 fix, 3c7f32e fix, 73e954c npm install, 76b0a6d downgrade, 7e80672 prod entrypoint, b8bcbcf site fix, c188ac8 gitignore (+1 more)

### Community 81 - "Community 81"
Cohesion: 0.33
Nodes (6): ResumeDocument, ResumeDocumentRevisionDetail, ResumeDocumentRevisionSummary, ResumeDocumentSummary, useResumeDocuments(), documentsApi

### Community 82 - "Community 82"
Cohesion: 0.47
Nodes (8): blogGenerationPrompt(), { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), editGenerationPrompt(), experienceGenerationPrompt(), projectGenerationPrompt(), skillGenerationPrompt()

### Community 83 - "Community 83"
Cohesion: 0.36
Nodes (7): categories, loadCategories(), loadEnvForm(), renderCategories(), saveCategories(), showCatMsg(), toggleCustomFields()

### Community 85 - "Community 85"
Cohesion: 0.50
Nodes (7): ai_analysis, assets, content, project_access, projects, site_config, users

### Community 86 - "Community 86"
Cohesion: 0.46
Nodes (7): api_tokens, cover_letters, generated_emails, job_applications, saved_answers, user_profiles, users

### Community 87 - "Community 87"
Cohesion: 0.25
Nodes (5): allowedScopes, { body, query, validationResult }, express, { prisma }, router

### Community 88 - "Community 88"
Cohesion: 0.25
Nodes (8): 02f5b3e fix: move jobs/reorder route before jobs/:id, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2b2b612 chore: remove .graphify artifacts, 391098a feat: add TurboRepo with remote cache for faster CI builds, 577f1c6 ci: switch to self-hosted ARC runners (tgmstudios-runners), 5f2a237 Fix AIManager fallback chain with real health checks, 91c072c Add graphify knowledge graph and AGENTS.md, e52477f Fix empty chat history crash and remove hardcoded Gemini for function calling

### Community 89 - "Community 89"
Cohesion: 0.25
Nodes (8): 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b34879 fix: load api.js in popup context so account connect UI works, 9cff0d3 fix: add -k flag for Rancher self-signed cert, ba00164 fix: use -u basic auth instead of Bearer for Rancher API, c1c1833 fix(ci): use K8s native API path instead of broken Steve API PATCH, ccd62cc fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge, f645d9c fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, fd79a40 fix: deploy script with proper bash syntax, pre-computed timestamp, no nested date

### Community 90 - "Community 90"
Cohesion: 0.25
Nodes (7): consoleTransport, createAILogger(), customFormat, errorFileTransport, fileTransport, logger, winston

### Community 91 - "Community 91"
Cohesion: 0.36
Nodes (6): actionLabel(), blobToDataUrl(), drawOverlays(), drawRoundedRect(), encodeGif(), FRAME_DELAY_MS

### Community 94 - "Community 94"
Cohesion: 0.29
Nodes (7): 2bb9ac8 Fix empty chat history crash and remove hardcoded Gemini for function calling, 388a0fe ci: switch to self-hosted ARC runners (tgmstudios-runners), 625607f feat: add TurboRepo with remote cache for faster CI builds, 754c4ba Fix AIManager fallback chain with real health checks, a3002b1 fix: move /jobs/reorder route before /jobs/:id, cf181b9 fix: kanban drag-drop uses @add/@update instead of @change, f1a563e Add graphify knowledge graph and AGENTS.md

### Community 95 - "Community 95"
Cohesion: 0.29
Nodes (7): AI Integration, ElevenLabs Voice, AI Function Calling, Google Gemini AI, Resume Chatbot, Resume Generator, Voice Webhook

### Community 97 - "Community 97"
Cohesion: 0.53
Nodes (5): content, post_order, projects, resume_chat_sessions, users

### Community 98 - "Community 98"
Cohesion: 0.53
Nodes (5): job_applications, resume_document_revisions, resume_documents, resume_history, users

### Community 99 - "Community 99"
Cohesion: 0.40
Nodes (2): flattenToolMessages(), { flattenToolMessages }

### Community 100 - "Community 100"
Cohesion: 0.33
Nodes (6): 26637c3 refactor(api): split projects.js into projects-crud/site-config (Phase 3), 32b07a0 refactor(api): wire index.js mounts to the split route files, 761be74 chore(api): sync pnpm-lock.yaml after removing @google/generative-ai, ab5032d refactor(api): split admin.js into admin-users/projects/content/stats (Phase 2), afe8523 refactor(api): split content.js into content-crud/order/chat (Phase 5), d7f3158 refactor(api): split goapply.js into 5 focused route files (Phase 6)

### Community 101 - "Community 101"
Cohesion: 0.33
Nodes (1): 53cc332 Improve AI chats and persist GoApply filters

### Community 102 - "Community 102"
Cohesion: 0.33
Nodes (4): fs, path, REQUIRED_TOOLS, vm

### Community 103 - "Community 103"
Cohesion: 0.40
Nodes (5): app(), express, { prisma }, request, router

### Community 105 - "Community 105"
Cohesion: 0.80
Nodes (4): content, _ProfileLinkedEducation, _ProfileLinkedJobs, user_profiles

### Community 106 - "Community 106"
Cohesion: 0.40
Nodes (5): 404f746 Final Changes, 8ad0083 final, ab25160 Merge branch 'main' of https://github.com/tgmstudios/foligo, c038a1b added bad site, dec7f43 pushing demo site

### Community 107 - "Community 107"
Cohesion: 0.40
Nodes (5): 5ca5e2a added bad site, 5cf7190 Final Changes, a03c122 Merge branch 'main' of https://github.com/tgmstudios/foligo, e450278 final, e57bb9b pushing demo site

### Community 108 - "Community 108"
Cohesion: 0.40
Nodes (3): c46cdbd feat(studio): add document chat sessions and scoring resilience, ChatSessionScope, SavedChatSession

### Community 109 - "Community 109"
Cohesion: 0.40
Nodes (3): fs, path, vm

### Community 110 - "Community 110"
Cohesion: 0.40
Nodes (4): express, prisma, { PrismaClient }, router

### Community 112 - "Community 112"
Cohesion: 0.70
Nodes (4): clearPreferenceCookie(), parsePreference(), readPreferenceCookie(), writePreferenceCookie()

### Community 113 - "Community 113"
Cohesion: 0.83
Nodes (3): media, projects, users

### Community 114 - "Community 114"
Cohesion: 1.00
Nodes (3): resume_history, resume_templates, users

### Community 115 - "Community 115"
Cohesion: 0.83
Nodes (3): _ProfileLinkedSkills, skills, user_profiles

### Community 116 - "Community 116"
Cohesion: 0.83
Nodes (3): cover_letter_revisions, cover_letters, job_applications

### Community 117 - "Community 117"
Cohesion: 0.83
Nodes (3): job_applications, _JobSavedAnswers, saved_answers

### Community 118 - "Community 118"
Cohesion: 0.50
Nodes (1): 1463ae4 feat(ai): give AI Content Creator full portfolio control

### Community 119 - "Community 119"
Cohesion: 0.50
Nodes (4): 3c3a572 ci: optimize arm64 Docker builds, 869e5e3 ci: enable Turbo remote cache scope, cf1c12d fix: install Tectonic on arm64 builds, e852de9 readd workflow

### Community 120 - "Community 120"
Cohesion: 0.50
Nodes (4): 3cfbedb chore: add graphify skill config and project instructions, 565f55d fix(dashboard): hide the status badge on the portfolios list view, 58c6fc2 chore: sync graphify code-graph snapshot, d366f21 feat(api): add cover letter editor tools and portfolio context service

### Community 121 - "Community 121"
Cohesion: 1.00
Nodes (2): user_integrations, users

### Community 122 - "Community 122"
Cohesion: 1.00
Nodes (2): resume_documents, resume_score_results

### Community 123 - "Community 123"
Cohesion: 1.00
Nodes (2): Chrome Extension (GoApply), Job Tracker (GoApply)

### Community 124 - "Community 124"
Cohesion: 1.00
Nodes (2): Docker Deployment, MinIO Media Storage

### Community 125 - "Community 125"
Cohesion: 1.00
Nodes (2): JWT Authentication, SSO/OAuth Authentication

### Community 126 - "Community 126"
Cohesion: 1.00
Nodes (2): PostgreSQL Database, Prisma ORM

### Community 127 - "Community 127"
Cohesion: 1.00
Nodes (2): Rate Limiting, Redis Caching

### Community 128 - "Community 128"
Cohesion: 1.00
Nodes (1): docxtemplater

### Community 129 - "Community 129"
Cohesion: 1.00
Nodes (1): generative_ai

### Community 130 - "Community 130"
Cohesion: 1.00
Nodes (1): http

### Community 131 - "Community 131"
Cohesion: 1.00
Nodes (1): https

### Community 132 - "Community 132"
Cohesion: 1.00
Nodes (1): mammoth

### Community 133 - "Community 133"
Cohesion: 1.00
Nodes (1): minio

### Community 134 - "Community 134"
Cohesion: 1.00
Nodes (1): openid_client

### Community 135 - "Community 135"
Cohesion: 1.00
Nodes (1): pdf_parse

### Community 136 - "Community 136"
Cohesion: 1.00
Nodes (1): pizzip

### Community 137 - "Community 137"
Cohesion: 1.00
Nodes (1): redis

### Community 138 - "Community 138"
Cohesion: 1.00
Nodes (1): uuid

### Community 139 - "Community 139"
Cohesion: 1.00
Nodes (1): winston

## Knowledge Gaps
- **695 isolated node(s):** `content_links`, `sso_providers`, `ai_models`, `voice_providers`, `platform_settings` (+690 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 13`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `00d5f02 feat(goapply): truncate kanban notes, add search filter to cover letters & resumes, enhance badges`, `f14f99d fix(goapply): source resume/cover letter category filter from all jobs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `bbb2aec feat(goapply): show and filter by linked job category on resumes and cover letters`, `cfb6e19 feat(goapply): add sort and filtering to resume, cover letter, and Q&A tabs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (2 nodes): `3725b15 Move old content`, `9030aa4 Move old content`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (2 nodes): `declaration`, `2533f8f feat(editor-studio): rich compile errors + LaTeX/markdown linting`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (2 nodes): `flattenToolMessages()`, `{ flattenToolMessages }`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 101`** (1 nodes): `53cc332 Improve AI chats and persist GoApply filters`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (1 nodes): `1463ae4 feat(ai): give AI Content Creator full portfolio control`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 121`** (2 nodes): `user_integrations`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 122`** (2 nodes): `resume_documents`, `resume_score_results`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (2 nodes): `Chrome Extension (GoApply)`, `Job Tracker (GoApply)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (2 nodes): `Docker Deployment`, `MinIO Media Storage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (2 nodes): `JWT Authentication`, `SSO/OAuth Authentication`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (2 nodes): `PostgreSQL Database`, `Prisma ORM`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (2 nodes): `Rate Limiting`, `Redis Caching`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `docxtemplater`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (1 nodes): `generative_ai`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `http`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `https`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `mammoth`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 133`** (1 nodes): `minio`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 134`** (1 nodes): `openid_client`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (1 nodes): `pdf_parse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (1 nodes): `pizzip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (1 nodes): `redis`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 138`** (1 nodes): `uuid`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (1 nodes): `winston`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `Community 4` to `Community 21`, `Community 9`, `Community 19`, `Community 73`, `Community 18`, `Community 55`, `Community 87`, `Community 38`, `Community 20`, `Community 74`, `Community 66`, `Community 67`, `Community 3`, `Community 12`, `Community 17`, `Community 6`, `Community 29`, `Community 15`, `Community 103`, `Community 25`, `Community 30`, `Community 8`, `Community 10`, `Community 76`, `Community 2`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `GeminiService` connect `Community 13` to `Community 20`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 42` to `Community 52`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `content_links`, `sso_providers`, `ai_models` to the rest of the system?**
  _695 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05067064083457526 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.057996207332490515 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.025 - nodes in this community are weakly interconnected._