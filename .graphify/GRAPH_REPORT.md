# Graph Report - .  (2026-07-31)

## Corpus Check
- 418 files · ~376,447 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2219 nodes · 5064 edges · 114 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 1649 · contains: 1406 · ON_BRANCH: 534 · imports_from: 422 · PARENT_OF: 348 · imports: 317 · calls: 230 · method: 65 · references: 55 · re_exports: 12 · uses: 6 · inherits: 3 · accesses: 1 · built_with: 1 · connects_to: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · entry_point: 1 · generates: 1 · handles: 1 · implemented_by: 1 · implements: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · serves: 1 · tracks: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 418 · Candidates: 544
- Excluded: 0 untracked · 120054 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `f75adbc`
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
Cohesion: 0.06
Nodes (28): 0541f93 cors fix, 054d6d6 proper .env, 16d2394 final, 2457110 fixed, 5345604 Fix App Icon, 654efd6 use markdown renderer, 69c514a Basic site loading, 8393c63 Merge branch 'main' of https://github.com/tgmstudios/foligo (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (77): connectDatabase(), connectRedis(), cors, express_rate_limit, helmet, morgan, additionalCorsOrigins, adminAiModelRoutes (+69 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (59): 0702c3b fix(sse): prevent QUIC/HTTP3 connection drops on long AI responses, 3a97bc9 fix(ai): fix undefined sendSse/cleanup crash in all SSE chat routes, 40a5f9c feat: bump all agent maxSteps from 6-8 to 30-40 turns, b5a50cc fix(latex): parse tectonic inline error format + detect microtype/XeTeX conflict, ai, { body, validationResult }, { cache }, chatUpload (+51 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (67): main, 0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat, 09f486f fix: install Tectonic on arm64 builds, 150821f remove old code, 156116a dashboard fix, 15c176e fix: OpenCode reasoning model support + route collision fix, 18576fb fix: Dockerfile monorepo context for pnpm-lock.yaml (+59 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (50): { cache }, express, geminiService, { prisma }, router, 07b32b9 refactor(api): reorganize routes/ into domain subfolders, 4bdce87 refactor(api): reorganize services/ into domain subfolders, { authorizeProjectAccess } (+42 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (58): addMessage(), addStatusChip(), categoriesFromProfile(), clearMessages(), createCoverLetterForCurrentJob(), createResumeForCurrentJob(), docRowHtml(), downloadResume() (+50 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (48): { authorizeProjectAccess }, { body }, { cache }, express, { getContentWithAccess, invalidateContentCache }, { handleValidation }, { prisma }, router (+40 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (53): feat/goapply-workflow-resilience, 00d5f02 feat(goapply): truncate kanban notes, add search filter to cover letters & resumes, enhance badges, 046ebb7 fix(api): retry Tectonic bundle warmup, 0498826 tsc, 063e407 feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 07ab9dc fixed, 09d0f94 compiler: switch from tectonic (XeTeX) to LuaLaTeX, 0b81330 refactor(api): rename session-flow.js → ai-session.js (+45 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (43): bb111d8 refactor(dashboard): reorganize projects store, extract types/composables, syncEntityInState(), syncNestedEntityInState(), withErrorToast(), ActivityItem, CoverLetter, GoApplyJob, GoApplyProfile (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (19): resume_documents, resume_score_results, allowedScopes, { body, query, validationResult }, express, { prisma }, router, 170fb21 fix: allow empty experience role end dates (+11 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (37): ai, { authenticateToken }, buildChatSystemPrompt(), buildContextBlock(), buildFieldSystemPrompt(), buildRescanSystemPrompt(), { createExtensionAgentServerTools, CLIENT_AGENT_TOOL_DEFS }, {
  createExtensionAgentServerTools,
  CLIENT_AGENT_TOOL_DEFS,
  getExtensionAgentCapabilities,
} (+29 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (32): 69a9738 Merge origin/main (PR #1: feat/goapply-workflow-resilience), c593eb9 Merge pull request #1 from tgmstudios/feat/goapply-workflow-resilience, fef94d7 fix(extension): retain application state across confirmation redirects, armSubmitWatcher(), blobToDataUrl(), broadcastToSidePanel(), broadcastTurnCompletion(), clearPendingSubmission() (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (24): 1596c73 Voice mode, 16a008d Dark mode, 245df8e Merge branch 'main' of https://github.com/tgmstudios/foligo, 27047d5 readme, 27c2bf1 feat: add analytics and content similarity, 29df55c AI Multistep, 2b50442 Merge branch 'main' of https://github.com/tgmstudios/foligo, 40faf8f Script and Start html files (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (3): c3c0c55 LATEX Editor, f883c97 LATEX Editor, useCommandPaletteStore

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (32): express, express_validator, fs, fetchPortfolioItem(), getPortfolioContext(), { prisma }, multer, ai (+24 more)

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (32): { body, query }, { buildSearchWhere }, { cache }, express, { handleValidation }, { paginate, buildPaginationResponse }, { prisma }, { requireAdmin } (+24 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (10): 2f0b6d3 SSO support, 48d46c3 SSO support, 5944c16 Refactored the content editor to use the new Editor Studio. Refactored admin dashboard, ae8be0a Refactored the content editor to use the new Editor Studio. Refactored admin dashboard, crypto, MERMAID_THEME_VARIABLES, router, prisma (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (23): 0c74186 feat(dashboard): add Cover Letter Studio with PDF compile and revision history, 343deb8 feat(dashboard): add Cover Letter Studio with PDF compile and revision history, CoverLetterDocument, useCoverLetterDocuments(), ResumeDocument, ResumeDocumentRevisionDetail, ResumeDocumentRevisionSummary, ResumeDocumentSummary (+15 more)

### Community 18 - "Community 18"
Cohesion: 0.06
Nodes (30): ALLOWED_KEYS, express, { prisma }, { requireAdmin }, router, express, { prisma }, { requireAdmin } (+22 more)

### Community 19 - "Community 19"
Cohesion: 0.06
Nodes (7): 036dc3f fix(dashboard): build canvas from source in Alpine, 2fe136f feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 53cc332 Improve AI chats and persist GoApply filters, b0436f7 Graphify artifacts, f75adbc feat(goapply): add job posting links, ChatSessionScope, SavedChatSession

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (24): analytics_events, analytics_properties, projects, voice_providers, cleanString(), createWriteKey(), crypto, hash() (+16 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (20): 0c81bd9 fix: CI auto-deploy with latest tag, kanban drag, AI CMS Gemini fallback, GoApply branding, 241e6c0 fix: kanban drag-save with local reactive columns + add extension to repo, 2f47ee3 fix: make arm64 document builds reliable, 5561a3a feat(api): add GitHub account integration and repo-crawling AI tools, 8142523 feat: add extension AI agent workflow, 87b45fd fix(extension): make autofill and job tracking more reliable, 8f85d95 fix: CI auto-deploy with latest tag, kanban drag, AI CMS Gemini fallback, GoApply branding, 9e48065 fix: kanban drag-save with local reactive columns + add extension to repo (+12 more)

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (27): { authorizeProjectAccess }, { body }, buildContentFieldUpdate(), { cache }, { CONTENT_INCLUDE, getContentWithAccess, invalidateContentCache }, express, githubService, { handleValidation } (+19 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (11): aim, 46be3c0 feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 7aa68eb Agentic editor and PDF Latex support, 8dcf942 AI Fixes, deepseek support, AI Merged into goapply, 933e05e AI Fixes, deepseek support, AI Merged into goapply, bde1fd9 More AI Repairs, c371019 More AI Repairs, ded6ded Agentic editor and PDF Latex support (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (9): 02cf9b1 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply, 2736250 feat(dashboard): support resume templates and defaults in the Resume Gallery, c6e4132 Add custom textarea scrollbar to chat sidebar; stop job form closing on backdrop click, ca272cd feat(dashboard): support resume templates and defaults in the Resume Gallery, e428e58 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply, clearPreferenceCookie(), parsePreference(), readPreferenceCookie() (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.07
Nodes (1): GeminiService

### Community 26 - "Community 26"
Cohesion: 0.08
Nodes (14): axios, 2437013 media library changes, 40fd685 other options, baaf15e social media and better ai chatbot experience, c47de3e New AI resume generator and site-wide touch ups, d348800 migration drift, e3ac367 social media and better ai chatbot experience, e966c80 New AI resume generator and site-wide touch ups (+6 more)

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (24): cacheKey(), cleanupAllSessionsForUser(), cleanupSession(), CLONE_TTL_MS, cloneCache, { decrypt }, ensureClone(), getIntegration() (+16 more)

### Community 28 - "Community 28"
Cohesion: 0.09
Nodes (9): ai_chat_sessions, users, 09d09b4 feat(ai): add attachment support across editors, raise agent token budgets, 8bbadc1 Add persistent AI chat sessions and analytics updates, a446f43 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat, d082103 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat, AgenticChatCallbacks, AgenticChatMessage (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.10
Nodes (22): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { findSimilarPostPairs }, { prisma }, router, buildVectors() (+14 more)

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (19): ai, { authorizeProjectAccess, authenticateToken }, { body, validationResult }, { cache }, { createPortfolioAgentTools }, CURRENT_PAGE_LABELS, express, { findSimilarPostPairs } (+11 more)

### Community 31 - "Community 31"
Cohesion: 0.10
Nodes (17): platform_settings, 2d971a7 feat(analytics): add hosted tracking script and dashboard embed snippet, e289d25 feat(goapply): cross-reference resumes in editor agents, add New Resume dialog, f0b501b feat: add web_search tool to all Foligo agents + admin settings, createCoverLetterEditorTools(), { createPullPageTool }, { createWebSearchTool }, { tool } (+9 more)

### Community 32 - "Community 32"
Cohesion: 0.11
Nodes (19): ai, createAiClient(), { GeminiAPIError }, { createAiClient }, { createAILogger }, { GENERATION_CONFIG }, metadata, multiPost (+11 more)

### Community 33 - "Community 33"
Cohesion: 0.11
Nodes (18): ai, { body, validationResult }, { encrypt }, { ensureBootstrapModels, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES }, express, { prisma }, { requireAdmin }, router (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.09
Nodes (2): 648453e feat(studio): add draggable resizing for editor/preview split and chat sidebar, bbb2aec feat(goapply): show and filter by linked job category on resumes and cover letters

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (15): computeDerivedFields(), EXPERIENCE_INCLUDE, express, pickPrimary(), { prisma }, PROFILE_INCLUDE, PROFILE_PASSTHROUGH_FIELDS, PROFILE_URL_FIELDS (+7 more)

### Community 36 - "Community 36"
Cohesion: 0.12
Nodes (15): 0c55f26 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b34879 fix: load api.js in popup context so account connect UI works, 4df342b fix: device linking — use dashboard auth directly + exchange 202 for pending, 782c5fd fix: prevent router redirect loop on page load, 8726fb0 fix: use default import for api in LinkDevice.vue, 9cff0d3 fix: add -k flag for Rancher self-signed cert, b76ca3c fix(ci): use strategic-merge-patch+json to preserve env vars (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (7): bcryptjs, client, 3f7125f A lot of new stuff, 97e0c8d A lot of new stuff, bcrypt, prisma, { PrismaClient }

### Community 38 - "Community 38"
Cohesion: 0.13
Nodes (16): { createProvider, isProviderConfigured }, manager, { resolveModel, listModelSelections }, { streamText, stepCountIs }, AnthropicProvider, { createAnthropic }, { createGoogleGenerativeAI }, { createOpenAICompatible } (+8 more)

### Community 39 - "Community 39"
Cohesion: 0.11
Nodes (16): { cache }, { CONTENT_INCLUDE, invalidateContentCache }, { createJobAssistantTools }, createPortfolioAgentTools(), { createPullPageTool }, { createWebSearchTool }, JOB_STATUSES, { matchOrCreateSkills, matchOrCreateTags } (+8 more)

### Community 40 - "Community 40"
Cohesion: 0.13
Nodes (16): deleteFile(), ensureBucket(), getFileUrl(), Minio, minioClient, uploadFile(), { authenticateToken, authorizeProjectAccess }, { body, validationResult } (+8 more)

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (11): GeminiAPIError, GeminiConfigError, GeminiError, GeminiParseError, GeminiValidationError, calculateDelay(), { GeminiAPIError }, isRetryableError() (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.15
Nodes (15): GENERATION_CONFIG, SYSTEM_INSTRUCTIONS, buildMetadataFromStructuredData(), { cleanGeneratedContent }, extractMetadataBasic(), extractMetadataFromConversation(), extractStructuredData(), extractStructuredDataUniversal() (+7 more)

### Community 44 - "Community 44"
Cohesion: 0.13
Nodes (5): content, sso_providers, ai_models, 2d62706 fix(api): stop gitignoring prisma migrations, causing prod schema drift, sso_providers

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (1): AIManager

### Community 46 - "Community 46"
Cohesion: 0.14
Nodes (5): 089f74b Refresh AI-edited posts and experience roles, 1463ae4 feat(ai): give AI Content Creator full portfolio control, 19d3d7b Update portable graphify artifacts, 9fde3b9 Refresh views after AI content changes, cf26e1d feat(ai): extend AI Content Creator to GoApply and add current-page awareness

### Community 47 - "Community 47"
Cohesion: 0.14
Nodes (10): createJobAssistantTools(), { createPullPageTool }, { createWebSearchTool }, jobAssistantTool(), optionalText, profileSchema, { projectAccessWhere }, { tool } (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.31
Nodes (13): content, content_blocks, content_links, content_meta, content_tags, _ContentSkills, _ContentTags, experience_roles (+5 more)

### Community 50 - "Community 50"
Cohesion: 0.14
Nodes (11): ai, AIService, { createAILogger }, { createGeminiLogger }, { createProvider, listProviders }, { createProvider, listProviders, isProviderConfigured, SAFETY_SETTINGS }, { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { resolveModel } (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.14
Nodes (9): b964476 feat(extension): rebuild browser agent on a session-scoped side panel, CDP, fs, path, REQUIRED_TOOLS, vm, fs, path (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.17
Nodes (10): handleFunctionCall(), { AI_RESUME_CHATBOT_TOOLS }, { buildResumeChatbotSystemPrompt }, { createGithubTools }, { GeminiAPIError }, { GENERATION_CONFIG }, { handleFunctionCall }, buildContextString() (+2 more)

### Community 54 - "Community 54"
Cohesion: 0.21
Nodes (11): index_css, pinia, app, authStore, pinia, LoginCredentials, RegisterData, useAuthStore (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.18
Nodes (9): ai, { buildConversationalSystemPrompt }, buildInitialMessage(), {
  createContentCreateTools,
  createContentEditTools
}, {
  extractStructuredData,
  extractStructuredDataUniversal,
  buildMetadataFromStructuredData,
  extractTitleFromConversation
}, { GeminiAPIError }, { GENERATION_CONFIG }, handleAISession() (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.17
Nodes (12): 106b076 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 18fcd65 fix: monorepo Dockerfiles + pnpm build scripts approval, 21baf7e fix: copy root package.json into Docker build context, 35d3be7 fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 649349e feat: model-agnostic AI layer + signup gate, 8456f34 switch to pnpm, b8a8c43 Enhance README with new features and setup details, c5bbbd8 fix: Dockerfile monorepo context for pnpm-lock.yaml (+4 more)

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (10): addGifFrame(), cacheCapturedImage(), ensureAgentTabGroup(), ensureOffscreenDocument(), gifFrameStore, gifRecordingGroups, handleGifCreator(), recordGifFrame() (+2 more)

### Community 58 - "Community 58"
Cohesion: 0.17
Nodes (1): SiteApiService

### Community 59 - "Community 59"
Cohesion: 0.22
Nodes (8): AI_RESUME_CHATBOT_TOOLS, _coreFoligoBaseTools(), createContentCreateTools(), createContentEditTools(), { createGithubTools }, { createPullPageTool }, { tool }, { z }

### Community 60 - "Community 60"
Cohesion: 0.18
Nodes (8): { authenticateToken }, crypto, { encrypt }, express, githubService, { prisma }, router, stateStore

### Community 61 - "Community 61"
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

### Community 62 - "Community 62"
Cohesion: 0.18
Nodes (2): 3725b15 Move old content, 9030aa4 Move old content

### Community 63 - "Community 63"
Cohesion: 0.18
Nodes (11): Content Blocks, Content Revisions, Express REST API, iOS SwiftUI App, Markdown Editor, Nuxt.js SSR, Portfolio Generation, Portfolio Templates (+3 more)

### Community 65 - "Community 65"
Cohesion: 0.24
Nodes (9): compile(), crypto, os, parseLatexErrors(), path, { PDFDocument }, runLuaLatex(), sanitizeMetadata() (+1 more)

### Community 66 - "Community 66"
Cohesion: 0.20
Nodes (9): { body, validationResult }, { encrypt, decrypt }, express, http, https, { prisma }, { requireAdmin }, router (+1 more)

### Community 68 - "Community 68"
Cohesion: 0.20
Nodes (10): 0928aff fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, 0ec3246 fix: load api.js in popup context so account connect UI works, 27cec51 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2db115c fix: add -k flag for Rancher self-signed cert, 5a86c30 fix: device linking — use dashboard auth directly + exchange 202 for pending, 5e4fc4c fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge, 87a6081 fix(ci): use K8s native API path instead of broken Steve API PATCH, 98533b9 fix: deploy script with proper bash syntax, pre-computed timestamp, no nested date (+2 more)

### Community 69 - "Community 69"
Cohesion: 0.20
Nodes (8): 26637c3 refactor(api): split projects.js into projects-crud/site-config (Phase 3), 32b07a0 refactor(api): wire index.js mounts to the split route files, 680a2a2 refactor(api): split gemini.js into composable gemini/* modules, 761be74 chore(api): sync pnpm-lock.yaml after removing @google/generative-ai, ab5032d refactor(api): split admin.js into admin-users/projects/content/stats (Phase 2), afe8523 refactor(api): split content.js into content-crud/order/chat (Phase 5), d7f3158 refactor(api): split goapply.js into 5 focused route files (Phase 6), e752149 refactor(api): extract shared pagination/search/access utilities (Phase 1)

### Community 70 - "Community 70"
Cohesion: 0.20
Nodes (10): 2bb9ac8 Fix empty chat history crash and remove hardcoded Gemini for function calling, 388a0fe ci: switch to self-hosted ARC runners (tgmstudios-runners), 3f4e737 chore: remove .graphify artifacts, 47b83e8 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 625607f feat: add TurboRepo with remote cache for faster CI builds, 754c4ba Fix AIManager fallback chain with real health checks, 7fb656d fix: prevent router redirect loop on page load, a3002b1 fix: move /jobs/reorder route before /jobs/:id (+2 more)

### Community 71 - "Community 71"
Cohesion: 0.36
Nodes (8): assertPublicUrl(), createPullPageTool(), htmlToText(), isPrivateIp(), net, pullPage(), readLimitedBody(), {
  htmlToText,
  isPrivateIp,
  pullPage,
  createPullPageTool,
}

### Community 72 - "Community 72"
Cohesion: 0.20
Nodes (1): config

### Community 74 - "Community 74"
Cohesion: 0.22
Nodes (2): declaration, 2533f8f feat(editor-studio): rich compile errors + LaTeX/markdown linting

### Community 75 - "Community 75"
Cohesion: 0.25
Nodes (6): generateMultiplePosts(), { GENERATION_CONFIG }, shouldCreateMultiplePosts(), { utilityPrompts }, fallbackQuestions, utilityPrompts

### Community 76 - "Community 76"
Cohesion: 0.47
Nodes (8): blogGenerationPrompt(), { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), editGenerationPrompt(), experienceGenerationPrompt(), projectGenerationPrompt(), skillGenerationPrompt()

### Community 77 - "Community 77"
Cohesion: 0.36
Nodes (7): categories, loadCategories(), loadEnvForm(), renderCategories(), saveCategories(), showCatMsg(), toggleCustomFields()

### Community 78 - "Community 78"
Cohesion: 0.22
Nodes (8): express, fs, multer, path, router, storage, upload, { v4: uuidv4 }

### Community 79 - "Community 79"
Cohesion: 0.50
Nodes (7): ai_analysis, assets, content, project_access, projects, site_config, users

### Community 80 - "Community 80"
Cohesion: 0.46
Nodes (7): api_tokens, cover_letters, generated_emails, job_applications, saved_answers, user_profiles, users

### Community 81 - "Community 81"
Cohesion: 0.25
Nodes (8): 02f5b3e fix: move jobs/reorder route before jobs/:id, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2b2b612 chore: remove .graphify artifacts, 391098a feat: add TurboRepo with remote cache for faster CI builds, 577f1c6 ci: switch to self-hosted ARC runners (tgmstudios-runners), 5f2a237 Fix AIManager fallback chain with real health checks, 91c072c Add graphify knowledge graph and AGENTS.md, e52477f Fix empty chat history crash and remove hardcoded Gemini for function calling

### Community 82 - "Community 82"
Cohesion: 0.25
Nodes (7): consoleTransport, createAILogger(), customFormat, errorFileTransport, fileTransport, logger, winston

### Community 83 - "Community 83"
Cohesion: 0.36
Nodes (6): actionLabel(), blobToDataUrl(), drawOverlays(), drawRoundedRect(), encodeGif(), FRAME_DELAY_MS

### Community 85 - "Community 85"
Cohesion: 0.36
Nodes (4): environmentMetadata(), onNav(), sendEvent(), trackPageView()

### Community 86 - "Community 86"
Cohesion: 0.29
Nodes (7): 19d43b2 fix(api): clean up cover letter PDFs on delete, describe LaTeX to the assistant, 3bfa0fc chore: add graphify skill config and project instructions, 6fbbcc1 fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat, aaf93a6 chore: sync graphify code-graph snapshot, b0924e1 refactor(dashboard): always sync Content Studio preview scroll with editor, cd8b3b4 fix(dashboard): hide the status badge on the portfolios list view, f429a54 feat(api): add cover letter editor tools and portfolio context service

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (7): AI Integration, ElevenLabs Voice, AI Function Calling, Google Gemini AI, Resume Chatbot, Resume Generator, Voice Webhook

### Community 88 - "Community 88"
Cohesion: 0.53
Nodes (5): content, post_order, projects, resume_chat_sessions, users

### Community 89 - "Community 89"
Cohesion: 0.53
Nodes (5): job_applications, resume_document_revisions, resume_documents, resume_history, users

### Community 90 - "Community 90"
Cohesion: 0.33
Nodes (6): 07e29da fix: use PATCH instead of GET/PUT for deploy (Rancher API compat), 0ba8b30 revert: remove CI env var injection — envs stay in K8s, 382a89d feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 484f1c9 fix: use correct Rancher cluster ID (c-lx99g, not c-jxhnr), 8a74801 fix: install openssl for Prisma engine in API Dockerfile, 975505b fix: pin deployment to SHA-tagged image, not :latest

### Community 91 - "Community 91"
Cohesion: 0.67
Nodes (5): detectDeviceType(), parseBrowser(), parseOS(), send(), trackPageView()

### Community 92 - "Community 92"
Cohesion: 0.80
Nodes (4): content, _ProfileLinkedEducation, _ProfileLinkedJobs, user_profiles

### Community 93 - "Community 93"
Cohesion: 0.40
Nodes (4): 0a28c02 feat(api): extend schema for cover letters, job categories/tags, and templates, 797a98f feat(api): support resume templates and defaults, 81226ce feat(api): add Job Assistant chat agent and Cover Letter document endpoints, 8495907 feat(api): stream AI Content Creator sessions with reasoning and tool activity

### Community 94 - "Community 94"
Cohesion: 0.50
Nodes (3): 1de7813 feat(goapply): capture role descriptions, job categories, and side-panel job workspace, c8cf150 fix(extension): stop job tracking from overwriting unrelated cards, AgentController

### Community 95 - "Community 95"
Cohesion: 0.40
Nodes (5): 2f601fd fix, 8d9085b good ai, b30b552 Good for prod, c90a3b3 new dockers, f0b4be0 remove old code

### Community 96 - "Community 96"
Cohesion: 0.40
Nodes (5): 5ca5e2a added bad site, 5cf7190 Final Changes, a03c122 Merge branch 'main' of https://github.com/tgmstudios/foligo, e450278 final, e57bb9b pushing demo site

### Community 97 - "Community 97"
Cohesion: 0.40
Nodes (4): express, prisma, { PrismaClient }, router

### Community 98 - "Community 98"
Cohesion: 0.83
Nodes (3): media, projects, users

### Community 99 - "Community 99"
Cohesion: 1.00
Nodes (3): resume_history, resume_templates, users

### Community 100 - "Community 100"
Cohesion: 0.83
Nodes (3): _ProfileLinkedSkills, skills, user_profiles

### Community 101 - "Community 101"
Cohesion: 0.83
Nodes (3): cover_letter_revisions, cover_letters, job_applications

### Community 102 - "Community 102"
Cohesion: 0.83
Nodes (3): job_applications, _JobSavedAnswers, saved_answers

### Community 103 - "Community 103"
Cohesion: 1.00
Nodes (2): user_integrations, users

### Community 104 - "Community 104"
Cohesion: 1.00
Nodes (2): Chrome Extension (GoApply), Job Tracker (GoApply)

### Community 105 - "Community 105"
Cohesion: 1.00
Nodes (2): Docker Deployment, MinIO Media Storage

### Community 106 - "Community 106"
Cohesion: 1.00
Nodes (2): JWT Authentication, SSO/OAuth Authentication

### Community 107 - "Community 107"
Cohesion: 1.00
Nodes (2): PostgreSQL Database, Prisma ORM

### Community 108 - "Community 108"
Cohesion: 1.00
Nodes (2): Rate Limiting, Redis Caching

### Community 109 - "Community 109"
Cohesion: 1.00
Nodes (1): docxtemplater

### Community 110 - "Community 110"
Cohesion: 1.00
Nodes (1): generative_ai

### Community 111 - "Community 111"
Cohesion: 1.00
Nodes (1): http

### Community 112 - "Community 112"
Cohesion: 1.00
Nodes (1): https

### Community 113 - "Community 113"
Cohesion: 1.00
Nodes (1): mammoth

### Community 114 - "Community 114"
Cohesion: 1.00
Nodes (1): minio

### Community 115 - "Community 115"
Cohesion: 1.00
Nodes (1): openid_client

### Community 116 - "Community 116"
Cohesion: 1.00
Nodes (1): pdf_parse

### Community 117 - "Community 117"
Cohesion: 1.00
Nodes (1): pizzip

### Community 118 - "Community 118"
Cohesion: 1.00
Nodes (1): redis

### Community 119 - "Community 119"
Cohesion: 1.00
Nodes (1): uuid

### Community 120 - "Community 120"
Cohesion: 1.00
Nodes (1): winston

## Knowledge Gaps
- **706 isolated node(s):** `content_links`, `sso_providers`, `ai_models`, `voice_providers`, `platform_settings` (+701 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 25`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `648453e feat(studio): add draggable resizing for editor/preview split and chat sidebar`, `bbb2aec feat(goapply): show and filter by linked job category on resumes and cover letters`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (2 nodes): `3725b15 Move old content`, `9030aa4 Move old content`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (2 nodes): `declaration`, `2533f8f feat(editor-studio): rich compile errors + LaTeX/markdown linting`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 103`** (2 nodes): `user_integrations`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (2 nodes): `Chrome Extension (GoApply)`, `Job Tracker (GoApply)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 105`** (2 nodes): `Docker Deployment`, `MinIO Media Storage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (2 nodes): `JWT Authentication`, `SSO/OAuth Authentication`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 107`** (2 nodes): `PostgreSQL Database`, `Prisma ORM`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (2 nodes): `Rate Limiting`, `Redis Caching`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 109`** (1 nodes): `docxtemplater`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (1 nodes): `generative_ai`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (1 nodes): `http`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (1 nodes): `https`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (1 nodes): `mammoth`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (1 nodes): `minio`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (1 nodes): `openid_client`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (1 nodes): `pdf_parse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (1 nodes): `pizzip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (1 nodes): `redis`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (1 nodes): `uuid`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (1 nodes): `winston`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `Community 4` to `Community 33`, `Community 15`, `Community 18`, `Community 66`, `Community 30`, `Community 9`, `Community 10`, `Community 32`, `Community 60`, `Community 61`, `Community 2`, `Community 22`, `Community 29`, `Community 6`, `Community 39`, `Community 27`, `Community 35`, `Community 14`, `Community 40`, `Community 78`, `Community 20`, `Community 1`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `GeminiService` connect `Community 25` to `Community 32`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 45` to `Community 50`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `content_links`, `sso_providers`, `ai_models` to the rest of the system?**
  _706 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06213222568362755 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.025 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.037949921752738654 - nodes in this community are weakly interconnected._