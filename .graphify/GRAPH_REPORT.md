# Graph Report - .  (2026-07-20)

## Corpus Check
- 410 files · ~366,586 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2130 nodes · 4630 edges · 122 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 1557 · contains: 1337 · imports_from: 420 · PARENT_OF: 334 · ON_BRANCH: 322 · imports: 316 · calls: 186 · method: 65 · references: 55 · re_exports: 12 · uses: 6 · inherits: 3 · accesses: 1 · built_with: 1 · connects_to: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · entry_point: 1 · generates: 1 · handles: 1 · implemented_by: 1 · implements: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · serves: 1 · tracks: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 410 · Candidates: 536
- Excluded: 0 untracked · 122018 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `089f74b`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `prisma` - 50 edges
2. `GeminiService` - 28 edges
3. `cache` - 25 edges
4. `authorizeProjectAccess()` - 16 edges
5. `AIManager` - 16 edges
6. `handleAgentEvent()` - 13 edges
7. `SiteApiService` - 12 edges
8. `authenticateToken()` - 8 edges
9. `requireAdmin()` - 8 edges
10. `handleValidation()` - 8 edges

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
Nodes (32): 0541f93 cors fix, 054d6d6 proper .env, 07ab9dc fixed, 16d2394 final, 2457110 fixed, 5345604 Fix App Icon, 64bc1e2 fix sites, 654efd6 use markdown renderer (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (77): connectDatabase(), connectRedis(), cors, express_rate_limit, helmet, morgan, additionalCorsOrigins, adminAiModelRoutes (+69 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (62): 0702c3b fix(sse): prevent QUIC/HTTP3 connection drops on long AI responses, 3a97bc9 fix(ai): fix undefined sendSse/cleanup crash in all SSE chat routes, 40a5f9c feat: bump all agent maxSteps from 6-8 to 30-40 turns, b5a50cc fix(latex): parse tectonic inline error format + detect microtype/XeTeX conflict, ai, { body, validationResult }, { cache }, chatUpload (+54 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (50): { cache }, express, geminiService, { prisma }, router, 07b32b9 refactor(api): reorganize routes/ into domain subfolders, 4bdce87 refactor(api): reorganize services/ into domain subfolders, { authorizeProjectAccess } (+42 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (53): { authorizeProjectAccess }, { body }, { cache }, express, { getContentWithAccess, invalidateContentCache }, { handleValidation }, { prisma }, router (+45 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (49): 1463ae4 feat(ai): give AI Content Creator full portfolio control, 19d3d7b Update portable graphify artifacts, 9fde3b9 Refresh views after AI content changes, cf26e1d feat(ai): extend AI Content Creator to GoApply and add current-page awareness, { authorizeProjectAccess }, { body }, buildContentFieldUpdate(), { cache } (+41 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (49): main, 046ebb7 fix(api): retry Tectonic bundle warmup, 09d0f94 compiler: switch from tectonic (XeTeX) to LuaLaTeX, 09f486f fix: install Tectonic on arm64 builds, 0a28c02 feat(api): extend schema for cover letters, job categories/tags, and templates, 0b81330 refactor(api): rename session-flow.js → ai-session.js, 0fa26e1 ci: speed up ARM64 API builds, 1948fd7 fix(ci): don't fail api build when Tectonic bundle warmup can't reach host (+41 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (11): declaration, 2533f8f feat(editor-studio): rich compile errors + LaTeX/markdown linting, compile(), crypto, os, parseLatexErrors(), path, { PDFDocument } (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (37): ai, { authenticateToken }, buildChatSystemPrompt(), buildContextBlock(), buildFieldSystemPrompt(), buildRescanSystemPrompt(), { createExtensionAgentServerTools, CLIENT_AGENT_TOOL_DEFS }, {
  createExtensionAgentServerTools,
  CLIENT_AGENT_TOOL_DEFS,
  getExtensionAgentCapabilities,
} (+29 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (43): addMessage(), addStatusChip(), clearMessages(), escapeHtml(), extractMessageText(), finalizePendingTools(), handleAgentEvent(), hideDeviceCodeUI() (+35 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (34): { body, query }, { buildSearchWhere }, { cache }, express, { handleValidation }, { paginate, buildPaginationResponse }, { prisma }, { requireAdmin } (+26 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (23): 0c81bd9 fix: CI auto-deploy with latest tag, kanban drag, AI CMS Gemini fallback, GoApply branding, 241e6c0 fix: kanban drag-save with local reactive columns + add extension to repo, 2f47ee3 fix: make arm64 document builds reliable, 5561a3a feat(api): add GitHub account integration and repo-crawling AI tools, 8142523 feat: add extension AI agent workflow, 87b45fd fix(extension): make autofill and job tracking more reliable, 8f85d95 fix: CI auto-deploy with latest tag, kanban drag, AI CMS Gemini fallback, GoApply branding, 9e48065 fix: kanban drag-save with local reactive columns + add extension to repo (+15 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (30): ALLOWED_KEYS, express, { prisma }, { requireAdmin }, router, express, { prisma }, { requireAdmin } (+22 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (11): aim, 46be3c0 feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 7aa68eb Agentic editor and PDF Latex support, 8dcf942 AI Fixes, deepseek support, AI Merged into goapply, 933e05e AI Fixes, deepseek support, AI Merged into goapply, bde1fd9 More AI Repairs, c371019 More AI Repairs, ded6ded Agentic editor and PDF Latex support (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (21): 063e407 feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 0c55f26 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 1063f67 fix: reasoning model detection + auto-double token budget, 15c176e fix: OpenCode reasoning model support + route collision fix, 2e0b15f feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 2efaeac feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, 2fe136f feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 336352a fix: correct logo import in LinkDevice.vue (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (6): 02cf9b1 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply, 2736250 feat(dashboard): support resume templates and defaults in the Resume Gallery, ca272cd feat(dashboard): support resume templates and defaults in the Resume Gallery, e428e58 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply, clearPreferenceCookie(), readPreferenceCookie()

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (10): 2f0b6d3 SSO support, 48d46c3 SSO support, 5944c16 Refactored the content editor to use the new Editor Studio. Refactored admin dashboard, ae8be0a Refactored the content editor to use the new Editor Studio. Refactored admin dashboard, crypto, MERMAID_THEME_VARIABLES, router, prisma (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (24): analytics_events, analytics_properties, projects, voice_providers, cleanString(), createWriteKey(), crypto, hash() (+16 more)

### Community 18 - "Community 18"
Cohesion: 0.06
Nodes (25): express, express_validator, fs, multer, path, ai, aiService, { body, validationResult } (+17 more)

### Community 19 - "Community 19"
Cohesion: 0.20
Nodes (14): 16a008d Dark mode, 29df55c AI Multistep, 2b50442 Merge branch 'main' of https://github.com/tgmstudios/foligo, 3725b15 Move old content, 81238cb Dashboard improvements, 893cac6 updates, 8b7636e Merge branch 'main' of https://github.com/tgmstudios/foligo, 8fa9517 initial api and dash (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (4): 00d5f02 feat(goapply): truncate kanban notes, add search filter to cover letters & resumes, enhance badges, bbb2aec feat(goapply): show and filter by linked job category on resumes and cover letters, cfb6e19 feat(goapply): add sort and filtering to resume, cover letter, and Q&A tabs, f14f99d fix(goapply): source resume/cover letter category filter from all jobs

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (1): GeminiService

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (25): bb111d8 refactor(dashboard): reorganize projects store, extract types/composables, syncEntityInState(), syncNestedEntityInState(), withErrorToast(), ContentBlock, ContentLink, ContentMeta, ContentTag (+17 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (24): cacheKey(), cleanupAllSessionsForUser(), cleanupSession(), CLONE_TTL_MS, cloneCache, { decrypt }, ensureClone(), getIntegration() (+16 more)

### Community 24 - "Community 24"
Cohesion: 0.10
Nodes (22): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { findSimilarPostPairs }, { prisma }, router, buildVectors() (+14 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (19): ai, createAiClient(), { GeminiAPIError }, { createAiClient }, { createAILogger }, { GENERATION_CONFIG }, metadata, multiPost (+11 more)

### Community 26 - "Community 26"
Cohesion: 0.09
Nodes (17): ai, { authorizeProjectAccess, authenticateToken }, { body, validationResult }, { cache }, { createPortfolioAgentTools }, CURRENT_PAGE_LABELS, express, { findSimilarPostPairs } (+9 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (3): c3c0c55 LATEX Editor, f883c97 LATEX Editor, useCommandPaletteStore

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (7): 089f74b Refresh AI-edited posts and experience roles, 3f7125f A lot of new stuff, 97e0c8d A lot of new stuff, b75351a temp, f81a378 temp, plugin_vue, vite

### Community 29 - "Community 29"
Cohesion: 0.16
Nodes (15): armSubmitWatcher(), blobToDataUrl(), broadcastToSidePanel(), broadcastTurnCompletion(), findAndHighlightSubmit(), forceAIRescan(), getOwnTabId(), previewDocument() (+7 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (14): ResumeDocument, ResumeDocumentRevisionDetail, ResumeDocumentRevisionSummary, ResumeDocumentSummary, useResumeDocuments(), documentsApi, EditorStudioAdapter, StudioDocumentSummary (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.13
Nodes (16): { createProvider, isProviderConfigured }, manager, { resolveModel, listModelSelections }, { streamText, stepCountIs }, AnthropicProvider, { createAnthropic }, { createGoogleGenerativeAI }, { createOpenAICompatible } (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (10): 150821f remove old code, 1596c73 Voice mode, 245df8e Merge branch 'main' of https://github.com/tgmstudios/foligo, 27c2bf1 feat: add analytics and content similarity, 4286262 good ai, 743a9d0 feat: add analytics and content similarity, 8d9085b good ai, b30b552 Good for prod (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.13
Nodes (16): deleteFile(), ensureBucket(), getFileUrl(), Minio, minioClient, uploadFile(), { authenticateToken, authorizeProjectAccess }, { body, validationResult } (+8 more)

### Community 34 - "Community 34"
Cohesion: 0.12
Nodes (6): axios, aiApi, api, toast, Media, MediaListResponse

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (18): 0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat, 18576fb fix: Dockerfile monorepo context for pnpm-lock.yaml, 1b5ddea feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 3087038 fix: install openssl for Prisma engine in API Dockerfile, 3c9693e fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 413498b fix: pin deployment to SHA-tagged image, not :latest, 517d7df fix: expand onlyBuiltDependencies to cover all workspace packages (+10 more)

### Community 36 - "Community 36"
Cohesion: 0.11
Nodes (18): 07e29da fix: use PATCH instead of GET/PUT for deploy (Rancher API compat), 0ba8b30 revert: remove CI env var injection — envs stay in K8s, 106b076 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 18fcd65 fix: monorepo Dockerfiles + pnpm build scripts approval, 21baf7e fix: copy root package.json into Docker build context, 35d3be7 fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 382a89d feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 484f1c9 fix: use correct Rancher cluster ID (c-lx99g, not c-jxhnr) (+10 more)

### Community 37 - "Community 37"
Cohesion: 0.11
Nodes (14): 19d43b2 fix(api): clean up cover letter PDFs on delete, describe LaTeX to the assistant, 347793b refactor(dashboard): always sync Content Studio preview scroll with editor, 3bfa0fc chore: add graphify skill config and project instructions, 3cfbedb chore: add graphify skill config and project instructions, 532eb3c fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat, 565f55d fix(dashboard): hide the status badge on the portfolios list view, 58c6fc2 chore: sync graphify code-graph snapshot, 6fbbcc1 fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.12
Nodes (5): ActivityItem, useProjectStore, Project, config, formatContentType()

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (11): GeminiAPIError, GeminiConfigError, GeminiError, GeminiParseError, GeminiValidationError, calculateDelay(), { GeminiAPIError }, isRetryableError() (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (15): GENERATION_CONFIG, SYSTEM_INSTRUCTIONS, buildMetadataFromStructuredData(), { cleanGeneratedContent }, extractMetadataBasic(), extractMetadataFromConversation(), extractStructuredData(), extractStructuredDataUniversal() (+7 more)

### Community 42 - "Community 42"
Cohesion: 0.13
Nodes (5): content, sso_providers, ai_models, 2d62706 fix(api): stop gitignoring prisma migrations, causing prod schema drift, sso_providers

### Community 43 - "Community 43"
Cohesion: 0.27
Nodes (1): AIManager

### Community 44 - "Community 44"
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

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (10): createJobAssistantTools(), { createPullPageTool }, { createWebSearchTool }, jobAssistantTool(), optionalText, profileSchema, { projectAccessWhere }, { tool } (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.13
Nodes (14): CoverLetter, GoApplyJob, GoApplyProfile, JOB_STATUSES, JobFormData, JobStatus, KANBAN_COLUMNS, LinkableExperienceCategory (+6 more)

### Community 47 - "Community 47"
Cohesion: 0.31
Nodes (13): content, content_blocks, content_links, content_meta, content_tags, _ContentSkills, _ContentTags, experience_roles (+5 more)

### Community 48 - "Community 48"
Cohesion: 0.18
Nodes (8): ai_chat_sessions, users, 8bbadc1 Add persistent AI chat sessions and analytics updates, a446f43 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat, d082103 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat, AgenticChatCallbacks, AgenticChatMessage, ToolActivity

### Community 49 - "Community 49"
Cohesion: 0.23
Nodes (9): 0c74186 feat(dashboard): add Cover Letter Studio with PDF compile and revision history, 343deb8 feat(dashboard): add Cover Letter Studio with PDF compile and revision history, CoverLetterDocument, useCoverLetterDocuments(), coverLetterAdapter, documentsApi, resumeAdapter, adapters (+1 more)

### Community 50 - "Community 50"
Cohesion: 0.14
Nodes (11): ai, AIService, { createAILogger }, { createGeminiLogger }, { createProvider, listProviders }, { createProvider, listProviders, isProviderConfigured, SAFETY_SETTINGS }, { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { resolveModel } (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.16
Nodes (10): computeDerivedFields(), EXPERIENCE_INCLUDE, express, pickPrimary(), { prisma }, PROFILE_INCLUDE, PROFILE_PASSTHROUGH_FIELDS, PROFILE_URL_FIELDS (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (9): ai, { body, validationResult }, { encrypt }, { ensureBootstrapModels, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES }, express, { prisma }, { requireAdmin }, router (+1 more)

### Community 54 - "Community 54"
Cohesion: 0.17
Nodes (10): handleFunctionCall(), { AI_RESUME_CHATBOT_TOOLS }, { buildResumeChatbotSystemPrompt }, { createGithubTools }, { GeminiAPIError }, { GENERATION_CONFIG }, { handleFunctionCall }, buildContextString() (+2 more)

### Community 55 - "Community 55"
Cohesion: 0.15
Nodes (13): 0928aff fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, 0ec3246 fix: load api.js in popup context so account connect UI works, 27cec51 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2db115c fix: add -k flag for Rancher self-signed cert, 3f4e737 chore: remove .graphify artifacts, 47b83e8 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 5a86c30 fix: device linking — use dashboard auth directly + exchange 202 for pending, 5e4fc4c fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge (+5 more)

### Community 56 - "Community 56"
Cohesion: 0.21
Nodes (11): index_css, pinia, app, authStore, pinia, LoginCredentials, RegisterData, useAuthStore (+3 more)

### Community 58 - "Community 58"
Cohesion: 0.17
Nodes (1): SiteApiService

### Community 60 - "Community 60"
Cohesion: 0.22
Nodes (8): AI_RESUME_CHATBOT_TOOLS, _coreFoligoBaseTools(), createContentCreateTools(), createContentEditTools(), { createGithubTools }, { createPullPageTool }, { tool }, { z }

### Community 61 - "Community 61"
Cohesion: 0.18
Nodes (8): { authenticateToken }, crypto, { encrypt }, express, githubService, { prisma }, router, stateStore

### Community 62 - "Community 62"
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

### Community 63 - "Community 63"
Cohesion: 0.22
Nodes (5): 170fb21 fix: allow empty experience role end dates, 6ac3765 fix: resume scoring timeout - use QUICK model + aiApi (180s timeout), 76096a9 feat: add HackerRank resume scoring to resume studio, b9a78d3 fix(extension): raise agent continuation limit from 20 to 100, ef3bc25 fix: persist AI chats and resume scores

### Community 64 - "Community 64"
Cohesion: 0.24
Nodes (7): 2d971a7 feat(analytics): add hosted tracking script and dashboard embed snippet, a2c260b fix: handle stale PDF paths after server restart, a75b95c feat(sites): add analytics tracking plugin with fingerprinting and flow tracking, environmentMetadata(), onNav(), sendEvent(), trackPageView()

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (11): Content Blocks, Content Revisions, Express REST API, iOS SwiftUI App, Markdown Editor, Nuxt.js SSR, Portfolio Generation, Portfolio Templates (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.20
Nodes (9): { body, validationResult }, { encrypt, decrypt }, express, http, https, { prisma }, { requireAdmin }, router (+1 more)

### Community 67 - "Community 67"
Cohesion: 0.27
Nodes (9): { decrypt }, ensureBootstrapModels(), listModelSelections(), { prisma }, resolveModel(), toOverrides(), VALID_MODEL_TYPES, VALID_PROVIDER_TYPES (+1 more)

### Community 69 - "Community 69"
Cohesion: 0.24
Nodes (8): createCoverLetterEditorTools(), { createPullPageTool }, { createWebSearchTool }, { tool }, { z }, createWebSearchTool(), getPrisma(), webSearch()

### Community 70 - "Community 70"
Cohesion: 0.36
Nodes (8): assertPublicUrl(), createPullPageTool(), htmlToText(), isPrivateIp(), net, pullPage(), readLimitedBody(), {
  htmlToText,
  isPrivateIp,
  pullPage,
  createPullPageTool,
}

### Community 71 - "Community 71"
Cohesion: 0.29
Nodes (7): ai, parseEvaluation(), { prisma }, requestEvaluation(), scoreResume(), mockGenerateChat, { parseEvaluation, requestEvaluation }

### Community 73 - "Community 73"
Cohesion: 0.25
Nodes (6): generateMultiplePosts(), { GENERATION_CONFIG }, shouldCreateMultiplePosts(), { utilityPrompts }, fallbackQuestions, utilityPrompts

### Community 74 - "Community 74"
Cohesion: 0.22
Nodes (9): 0498826 tsc, 2226c00 prod entrypoint, a4cb9ba npm install, ad4b3d9 gitignore, aee3cf5 site fix, b22bcc6 dashboard fix, d65bc7e fix, f47171e downgrade (+1 more)

### Community 75 - "Community 75"
Cohesion: 0.22
Nodes (9): 156116a dashboard fix, 3b00f25 fix, 3c7f32e fix, 73e954c npm install, 76b0a6d downgrade, 7e80672 prod entrypoint, b8bcbcf site fix, c188ac8 gitignore (+1 more)

### Community 76 - "Community 76"
Cohesion: 0.22
Nodes (1): 648453e feat(studio): add draggable resizing for editor/preview split and chat sidebar

### Community 77 - "Community 77"
Cohesion: 0.47
Nodes (8): blogGenerationPrompt(), { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), editGenerationPrompt(), experienceGenerationPrompt(), projectGenerationPrompt(), skillGenerationPrompt()

### Community 79 - "Community 79"
Cohesion: 0.22
Nodes (8): express, fs, multer, path, router, storage, upload, { v4: uuidv4 }

### Community 80 - "Community 80"
Cohesion: 0.50
Nodes (7): ai_analysis, assets, content, project_access, projects, site_config, users

### Community 81 - "Community 81"
Cohesion: 0.46
Nodes (7): api_tokens, cover_letters, generated_emails, job_applications, saved_answers, user_profiles, users

### Community 82 - "Community 82"
Cohesion: 0.25
Nodes (7): 2d86eff feat(api): support resume templates and defaults, 3b51962 fix(api): retry Tectonic bundle warmup, 46c2570 fix(api): configure Tectonic CA certificates, aa92713 feat(api): add Job Assistant chat agent and Cover Letter document endpoints, bada62e fix(ci): don't fail api build when Tectonic bundle warmup can't reach host, c7ff091 feat(api): extend schema for cover letters, job categories/tags, and templates, ee60e4a feat(api): stream AI Content Creator sessions with reasoning and tool activity

### Community 83 - "Community 83"
Cohesion: 0.25
Nodes (5): allowedScopes, { body, query, validationResult }, express, { prisma }, router

### Community 84 - "Community 84"
Cohesion: 0.25
Nodes (8): 02f5b3e fix: move jobs/reorder route before jobs/:id, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2b2b612 chore: remove .graphify artifacts, 391098a feat: add TurboRepo with remote cache for faster CI builds, 577f1c6 ci: switch to self-hosted ARC runners (tgmstudios-runners), 5f2a237 Fix AIManager fallback chain with real health checks, 91c072c Add graphify knowledge graph and AGENTS.md, e52477f Fix empty chat history crash and remove hardcoded Gemini for function calling

### Community 85 - "Community 85"
Cohesion: 0.25
Nodes (8): 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b34879 fix: load api.js in popup context so account connect UI works, 9cff0d3 fix: add -k flag for Rancher self-signed cert, ba00164 fix: use -u basic auth instead of Bearer for Rancher API, c1c1833 fix(ci): use K8s native API path instead of broken Steve API PATCH, ccd62cc fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge, f645d9c fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, fd79a40 fix: deploy script with proper bash syntax, pre-computed timestamp, no nested date

### Community 86 - "Community 86"
Cohesion: 0.25
Nodes (7): consoleTransport, createAILogger(), customFormat, errorFileTransport, fileTransport, logger, winston

### Community 88 - "Community 88"
Cohesion: 0.29
Nodes (5): bcryptjs, client, bcrypt, prisma, { PrismaClient }

### Community 89 - "Community 89"
Cohesion: 0.29
Nodes (6): 2437013 media library changes, baaf15e social media and better ai chatbot experience, c47de3e New AI resume generator and site-wide touch ups, e3ac367 social media and better ai chatbot experience, e966c80 New AI resume generator and site-wide touch ups, f0d2a2e media library changes

### Community 90 - "Community 90"
Cohesion: 0.29
Nodes (7): 2bb9ac8 Fix empty chat history crash and remove hardcoded Gemini for function calling, 388a0fe ci: switch to self-hosted ARC runners (tgmstudios-runners), 625607f feat: add TurboRepo with remote cache for faster CI builds, 754c4ba Fix AIManager fallback chain with real health checks, a3002b1 fix: move /jobs/reorder route before /jobs/:id, cf181b9 fix: kanban drag-drop uses @add/@update instead of @change, f1a563e Add graphify knowledge graph and AGENTS.md

### Community 91 - "Community 91"
Cohesion: 0.29
Nodes (7): AI Integration, ElevenLabs Voice, AI Function Calling, Google Gemini AI, Resume Chatbot, Resume Generator, Voice Webhook

### Community 92 - "Community 92"
Cohesion: 0.53
Nodes (5): content, post_order, projects, resume_chat_sessions, users

### Community 93 - "Community 93"
Cohesion: 0.53
Nodes (5): job_applications, resume_document_revisions, resume_documents, resume_history, users

### Community 94 - "Community 94"
Cohesion: 0.33
Nodes (6): 26637c3 refactor(api): split projects.js into projects-crud/site-config (Phase 3), 32b07a0 refactor(api): wire index.js mounts to the split route files, 761be74 chore(api): sync pnpm-lock.yaml after removing @google/generative-ai, ab5032d refactor(api): split admin.js into admin-users/projects/content/stats (Phase 2), afe8523 refactor(api): split content.js into content-crud/order/chat (Phase 5), d7f3158 refactor(api): split goapply.js into 5 focused route files (Phase 6)

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (4): fs, path, REQUIRED_TOOLS, vm

### Community 96 - "Community 96"
Cohesion: 0.33
Nodes (5): { createPullPageTool }, createResumeEditorTools(), { createWebSearchTool }, { tool }, { z }

### Community 97 - "Community 97"
Cohesion: 0.67
Nodes (5): detectDeviceType(), parseBrowser(), parseOS(), send(), trackPageView()

### Community 98 - "Community 98"
Cohesion: 0.33
Nodes (1): TemplateSelector

### Community 100 - "Community 100"
Cohesion: 0.80
Nodes (4): content, _ProfileLinkedEducation, _ProfileLinkedJobs, user_profiles

### Community 101 - "Community 101"
Cohesion: 0.40
Nodes (5): 5ca5e2a added bad site, 5cf7190 Final Changes, a03c122 Merge branch 'main' of https://github.com/tgmstudios/foligo, e450278 final, e57bb9b pushing demo site

### Community 102 - "Community 102"
Cohesion: 0.40
Nodes (3): c46cdbd feat(studio): add document chat sessions and scoring resilience, ChatSessionScope, SavedChatSession

### Community 103 - "Community 103"
Cohesion: 0.40
Nodes (3): fs, path, vm

### Community 104 - "Community 104"
Cohesion: 0.40
Nodes (4): express, prisma, { PrismaClient }, router

### Community 106 - "Community 106"
Cohesion: 0.83
Nodes (3): media, projects, users

### Community 107 - "Community 107"
Cohesion: 1.00
Nodes (3): resume_history, resume_templates, users

### Community 108 - "Community 108"
Cohesion: 0.83
Nodes (3): _ProfileLinkedSkills, skills, user_profiles

### Community 109 - "Community 109"
Cohesion: 0.83
Nodes (3): cover_letter_revisions, cover_letters, job_applications

### Community 110 - "Community 110"
Cohesion: 0.83
Nodes (3): job_applications, _JobSavedAnswers, saved_answers

### Community 111 - "Community 111"
Cohesion: 0.50
Nodes (2): platform_settings, f0b501b feat: add web_search tool to all Foligo agents + admin settings

### Community 112 - "Community 112"
Cohesion: 0.83
Nodes (2): loadEnvForm(), toggleCustomFields()

### Community 113 - "Community 113"
Cohesion: 1.00
Nodes (2): user_integrations, users

### Community 114 - "Community 114"
Cohesion: 1.00
Nodes (2): resume_documents, resume_score_results

### Community 115 - "Community 115"
Cohesion: 1.00
Nodes (2): Chrome Extension (GoApply), Job Tracker (GoApply)

### Community 116 - "Community 116"
Cohesion: 1.00
Nodes (2): Docker Deployment, MinIO Media Storage

### Community 117 - "Community 117"
Cohesion: 1.00
Nodes (2): JWT Authentication, SSO/OAuth Authentication

### Community 118 - "Community 118"
Cohesion: 1.00
Nodes (2): PostgreSQL Database, Prisma ORM

### Community 119 - "Community 119"
Cohesion: 1.00
Nodes (2): Rate Limiting, Redis Caching

### Community 120 - "Community 120"
Cohesion: 1.00
Nodes (1): docxtemplater

### Community 121 - "Community 121"
Cohesion: 1.00
Nodes (1): generative_ai

### Community 122 - "Community 122"
Cohesion: 1.00
Nodes (1): http

### Community 123 - "Community 123"
Cohesion: 1.00
Nodes (1): https

### Community 124 - "Community 124"
Cohesion: 1.00
Nodes (1): mammoth

### Community 125 - "Community 125"
Cohesion: 1.00
Nodes (1): minio

### Community 126 - "Community 126"
Cohesion: 1.00
Nodes (1): openid_client

### Community 127 - "Community 127"
Cohesion: 1.00
Nodes (1): pdf_parse

### Community 128 - "Community 128"
Cohesion: 1.00
Nodes (1): pizzip

### Community 129 - "Community 129"
Cohesion: 1.00
Nodes (1): redis

### Community 130 - "Community 130"
Cohesion: 1.00
Nodes (1): uuid

### Community 131 - "Community 131"
Cohesion: 1.00
Nodes (1): winston

## Knowledge Gaps
- **688 isolated node(s):** `content_links`, `sso_providers`, `ai_models`, `voice_providers`, `platform_settings` (+683 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 21`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `648453e feat(studio): add draggable resizing for editor/preview split and chat sidebar`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (1 nodes): `TemplateSelector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (2 nodes): `platform_settings`, `f0b501b feat: add web_search tool to all Foligo agents + admin settings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (2 nodes): `loadEnvForm()`, `toggleCustomFields()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (2 nodes): `user_integrations`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (2 nodes): `resume_documents`, `resume_score_results`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (2 nodes): `Chrome Extension (GoApply)`, `Job Tracker (GoApply)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (2 nodes): `Docker Deployment`, `MinIO Media Storage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (2 nodes): `JWT Authentication`, `SSO/OAuth Authentication`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (2 nodes): `PostgreSQL Database`, `Prisma ORM`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (2 nodes): `Rate Limiting`, `Redis Caching`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (1 nodes): `docxtemplater`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 121`** (1 nodes): `generative_ai`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 122`** (1 nodes): `http`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (1 nodes): `https`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (1 nodes): `mammoth`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (1 nodes): `minio`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `openid_client`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (1 nodes): `pdf_parse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `pizzip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (1 nodes): `redis`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `uuid`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `winston`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `Community 3` to `Community 53`, `Community 10`, `Community 12`, `Community 66`, `Community 26`, `Community 83`, `Community 8`, `Community 67`, `Community 25`, `Community 61`, `Community 62`, `Community 2`, `Community 5`, `Community 24`, `Community 4`, `Community 23`, `Community 51`, `Community 33`, `Community 79`, `Community 17`, `Community 18`, `Community 71`, `Community 1`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `GeminiService` connect `Community 21` to `Community 25`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 43` to `Community 50`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `content_links`, `sso_providers`, `ai_models` to the rest of the system?**
  _688 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06365720331511197 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.025 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03614035087719298 - nodes in this community are weakly interconnected._