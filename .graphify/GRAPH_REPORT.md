# Graph Report - .  (2026-07-20)

## Corpus Check
- 410 files · ~367,050 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2131 nodes · 4654 edges · 126 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 1579 · contains: 1337 · imports_from: 420 · PARENT_OF: 335 · ON_BRANCH: 323 · imports: 316 · calls: 186 · method: 65 · references: 55 · re_exports: 12 · uses: 6 · inherits: 3 · accesses: 1 · built_with: 1 · connects_to: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · entry_point: 1 · generates: 1 · handles: 1 · implemented_by: 1 · implements: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · serves: 1 · tracks: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 410 · Candidates: 536
- Excluded: 0 untracked · 122029 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `09d09b4`
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

### Community 82 - "Community 82"
Cohesion: 0.50
Nodes (7): users, projects, project_access, content, assets, site_config, ai_analysis

### Community 46 - "Community 46"
Cohesion: 0.31
Nodes (13): content_links, content_tags, content_meta, content_blocks, skills, experience_roles, _ProjectSkills, _ContentTags (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.13
Nodes (5): content, sso_providers, ai_models, sso_providers, 2d62706 fix(api): stop gitignoring prisma migrations, causing prod schema drift

### Community 112 - "Community 112"
Cohesion: 0.83
Nodes (3): media, users, projects

### Community 95 - "Community 95"
Cohesion: 0.53
Nodes (5): post_order, resume_chat_sessions, projects, content, users

### Community 113 - "Community 113"
Cohesion: 1.00
Nodes (3): resume_templates, resume_history, users

### Community 83 - "Community 83"
Cohesion: 0.46
Nodes (7): job_applications, user_profiles, saved_answers, cover_letters, generated_emails, api_tokens, users

### Community 96 - "Community 96"
Cohesion: 0.53
Nodes (5): resume_documents, resume_document_revisions, resume_history, users, job_applications

### Community 104 - "Community 104"
Cohesion: 0.80
Nodes (4): _ProfileLinkedJobs, _ProfileLinkedEducation, content, user_profiles

### Community 114 - "Community 114"
Cohesion: 0.83
Nodes (3): _ProfileLinkedSkills, user_profiles, skills

### Community 115 - "Community 115"
Cohesion: 0.83
Nodes (3): cover_letter_revisions, cover_letters, job_applications

### Community 84 - "Community 84"
Cohesion: 0.25
Nodes (7): 2d86eff feat(api): support resume templates and defaults, 3b51962 fix(api): retry Tectonic bundle warmup, 46c2570 fix(api): configure Tectonic CA certificates, aa92713 feat(api): add Job Assistant chat agent and Cover Letter document endpoints, bada62e fix(ci): don't fail api build when Tectonic bundle warmup can't reach host, c7ff091 feat(api): extend schema for cover letters, job categories/tags, and templates, ee60e4a feat(api): stream AI Content Creator sessions with reasoning and tool activity

### Community 116 - "Community 116"
Cohesion: 0.83
Nodes (3): _JobSavedAnswers, job_applications, saved_answers

### Community 119 - "Community 119"
Cohesion: 1.00
Nodes (2): user_integrations, users

### Community 105 - "Community 105"
Cohesion: 0.60
Nodes (4): analytics_properties, analytics_events, voice_providers, projects

### Community 97 - "Community 97"
Cohesion: 0.33
Nodes (5): 2d971a7 feat(analytics): add hosted tracking script and dashboard embed snippet, 4945047 feat(analytics): add geolocation (city/region) and time-on-page (duration) tracking, 4b53f7d feat(analytics): add fingerprinting, device tracking, user flow, and return visitor metrics, a2c260b fix: handle stale PDF paths after server restart, a75b95c feat(sites): add analytics tracking plugin with fingerprinting and flow tracking

### Community 117 - "Community 117"
Cohesion: 0.50
Nodes (2): platform_settings, f0b501b feat: add web_search tool to all Foligo agents + admin settings

### Community 106 - "Community 106"
Cohesion: 0.50
Nodes (3): ai_chat_sessions, users, 8bbadc1 Add persistent AI chat sessions and analytics updates

### Community 120 - "Community 120"
Cohesion: 1.00
Nodes (2): resume_score_results, resume_documents

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (10): { PrismaClient }, prisma, crypto, MERMAID_THEME_VARIABLES, router, 48d46c3 SSO support, 5944c16 Refactored the content editor to use the new Editor Studio. Refactored admin dashboard, 2f0b6d3 SSO support (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (77): express, path, cors, helmet, morgan, rateLimit, swaggerUi, swaggerJsdoc (+69 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (34): express, { body, query }, { prisma }, { cache }, { requireAdmin }, { handleValidation }, { paginate, buildPaginationResponse }, { buildSearchWhere } (+26 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (30): jwt, crypto, { prisma }, authenticateToken(), requireAdmin(), express, { prisma }, { requireAdmin } (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (49): authorizeProjectAccess(), { validationResult }, handleValidation(), express, { body }, { prisma }, { cache }, { authorizeProjectAccess } (+41 more)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (32): TEMPLATE_STYLES, TEMPLATE_CONFIGS, siteApi, 054d6d6 proper .env, 07ab9dc fixed, 64bc1e2 fix sites, 654efd6 use markdown renderer, 69c514a Basic site loading (+24 more)

### Community 52 - "Community 52"
Cohesion: 0.15
Nodes (9): express, { body, validationResult }, { prisma }, { requireAdmin }, { encrypt }, { ensureBootstrapModels, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES }, ai, router (+1 more)

### Community 68 - "Community 68"
Cohesion: 0.20
Nodes (9): express, { body, validationResult }, { prisma }, { requireAdmin }, { encrypt, decrypt }, https, http, router (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (17): express, { body, validationResult }, multer, mammoth, pdfParseModule, { prisma }, { cache }, { authorizeProjectAccess, authenticateToken } (+9 more)

### Community 85 - "Community 85"
Cohesion: 0.25
Nodes (5): express, { body, query, validationResult }, { prisma }, router, allowedScopes

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (39): express, router, ai, { authenticateToken }, { prisma }, {
  createExtensionAgentServerTools,
  CLIENT_AGENT_TOOL_DEFS,
  getExtensionAgentCapabilities,
}, { flattenToolMessages }, { setupSSE } (+31 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (55): express, router, geminiService, { prisma }, { cache }, express, { body, validationResult }, { prisma } (+47 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (18): express, { Prisma }, { authorizeProjectAccess }, {
  MAX_BATCH_SIZE,
  hash,
  createWriteKey,
  normalizeOrigin,
  originAllowed,
  normalizeEvent,
}, publicRouter, router, decodeGeoHeader(), getRequestLocation() (+10 more)

### Community 61 - "Community 61"
Cohesion: 0.18
Nodes (8): express, crypto, { prisma }, { encrypt }, { authenticateToken }, githubService, router, stateStore

### Community 62 - "Community 62"
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
Nodes (62): express, { body, validationResult }, multer, { prisma }, { cache }, ai, { createContentEditorTools }, { createGithubTools } (+54 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (45): express, { body }, { prisma }, { cache }, { authorizeProjectAccess }, { handleValidation }, githubService, { CONTENT_INCLUDE, getContentWithAccess, invalidateContentCache } (+37 more)

### Community 22 - "Community 22"
Cohesion: 0.10
Nodes (22): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, { findSimilarPostPairs }, router, { TfIdf } (+14 more)

### Community 49 - "Community 49"
Cohesion: 0.16
Nodes (10): express, { prisma }, router, PROFILE_PASSTHROUGH_FIELDS, PROFILE_URL_FIELDS, EXPERIENCE_INCLUDE, PROFILE_INCLUDE, pickPrimary() (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.13
Nodes (16): express, multer, { v4: uuidv4 }, path, { body, validationResult }, { prisma }, { uploadFile, deleteFile, getFileUrl, minioClient, BUCKET_NAME }, { authenticateToken, authorizeProjectAccess } (+8 more)

### Community 110 - "Community 110"
Cohesion: 0.40
Nodes (4): express, router, { PrismaClient }, prisma

### Community 81 - "Community 81"
Cohesion: 0.22
Nodes (8): express, multer, path, fs, { v4: uuidv4 }, router, storage, upload

### Community 72 - "Community 72"
Cohesion: 0.29
Nodes (7): { prisma }, ai, parseEvaluation(), requestEvaluation(), scoreResume(), mockGenerateChat, { parseEvaluation, requestEvaluation }

### Community 17 - "Community 17"
Cohesion: 0.06
Nodes (25): express, { body, validationResult }, multer, path, { prisma }, ai, latexCompiler, { createResumeEditorTools } (+17 more)

### Community 91 - "Community 91"
Cohesion: 0.29
Nodes (5): { PrismaClient }, bcrypt, prisma, bcryptjs, client

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (19): ai, { GeminiAPIError }, createAiClient(), { prisma }, { createAILogger }, { GENERATION_CONFIG }, { createAiClient }, { stripMarkdown, extractHashtags } (+11 more)

### Community 43 - "Community 43"
Cohesion: 0.14
Nodes (13): ai, { GeminiAPIError }, { GENERATION_CONFIG }, {
  extractStructuredData,
  extractStructuredDataUniversal,
  buildMetadataFromStructuredData,
  extractTitleFromConversation
}, { shouldCreateMultiplePosts, generateMultiplePosts }, 6b35074 perf(api): skip heavy content fetch in /ai/create, respond with newContent.id directly, a23def7 fix(api): add universal structured-data extraction fallback for non-Gemini models, bd3abad fix(api): slim /ai/create response to just the content ID (+5 more)

### Community 53 - "Community 53"
Cohesion: 0.17
Nodes (10): handleFunctionCall(), { GeminiAPIError }, { AI_RESUME_CHATBOT_TOOLS }, { createGithubTools }, { buildResumeChatbotSystemPrompt }, { GENERATION_CONFIG }, { handleFunctionCall }, buildContextString() (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (15): GENERATION_CONFIG, SYSTEM_INSTRUCTIONS, { utilityPrompts }, { GENERATION_CONFIG }, { cleanGeneratedContent }, extractStructuredData(), extractStructuredDataUniversal(), buildMetadataFromStructuredData() (+7 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (1): GeminiService

### Community 75 - "Community 75"
Cohesion: 0.25
Nodes (6): { utilityPrompts }, { GENERATION_CONFIG }, shouldCreateMultiplePosts(), generateMultiplePosts(), fallbackQuestions, utilityPrompts

### Community 48 - "Community 48"
Cohesion: 0.14
Nodes (11): ai, AIService, { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { createProvider, listProviders, isProviderConfigured, SAFETY_SETTINGS }, { resolveModel, listModelSelections, ensureBootstrapModels }, { createAILogger }, { createProvider, listProviders }, { resolveModel, ensureBootstrapModels } (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (11): aim, goapplyRoutes, 46be3c0 feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 933e05e AI Fixes, deepseek support, AI Merged into goapply, c371019 More AI Repairs, ded6ded Agentic editor and PDF Latex support, 7aa68eb Agentic editor and PDF Latex support, 8dcf942 AI Fixes, deepseek support, AI Merged into goapply (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.27
Nodes (1): AIManager

### Community 30 - "Community 30"
Cohesion: 0.13
Nodes (16): { streamText, stepCountIs }, { createProvider, isProviderConfigured }, { resolveModel, listModelSelections }, manager, { createGoogleGenerativeAI }, { createAnthropic }, { createOpenAICompatible }, PRESETS (+8 more)

### Community 69 - "Community 69"
Cohesion: 0.27
Nodes (9): { prisma }, { decrypt }, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES, ensureBootstrapModels(), toOverrides(), resolveModel(), listModelSelections() (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.22
Nodes (8): { tool }, { z }, AI_RESUME_CHATBOT_TOOLS, { createGithubTools }, { createPullPageTool }, _coreFoligoBaseTools(), createContentCreateTools(), createContentEditTools()

### Community 79 - "Community 79"
Cohesion: 0.47
Nodes (8): { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), projectGenerationPrompt(), experienceGenerationPrompt(), blogGenerationPrompt(), skillGenerationPrompt(), editGenerationPrompt()

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (11): GeminiError, GeminiConfigError, GeminiAPIError, GeminiParseError, GeminiValidationError, { GeminiAPIError }, RETRY_CONFIG, isRetryableError() (+3 more)

### Community 88 - "Community 88"
Cohesion: 0.25
Nodes (7): winston, customFormat, consoleTransport, fileTransport, errorFileTransport, logger, createAILogger()

### Community 100 - "Community 100"
Cohesion: 0.33
Nodes (4): fs, path, vm, REQUIRED_TOOLS

### Community 109 - "Community 109"
Cohesion: 0.40
Nodes (3): fs, path, vm

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (24): { Octokit }, { spawn }, os, path, { prisma }, { decrypt }, CLONE_TTL_MS, MAX_REPO_SIZE_KB (+16 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (14): { tool }, { z }, { createWebSearchTool }, { createPullPageTool }, createCoverLetterEditorTools(), { tool }, { z }, { createWebSearchTool } (+6 more)

### Community 50 - "Community 50"
Cohesion: 0.15
Nodes (8): { tool }, { z }, { projectAccessWhere }, { createWebSearchTool }, { createPullPageTool }, optionalText, profileSchema, projectAccessWhere()

### Community 67 - "Community 67"
Cohesion: 0.24
Nodes (9): { spawn }, os, path, crypto, { PDFDocument }, sanitizeMetadata(), parseLatexErrors(), compile() (+1 more)

### Community 71 - "Community 71"
Cohesion: 0.36
Nodes (8): net, isPrivateIp(), assertPublicUrl(), readLimitedBody(), htmlToText(), pullPage(), createPullPageTool(), {
  htmlToText,
  isPrivateIp,
  pullPage,
  createPullPageTool,
}

### Community 90 - "Community 90"
Cohesion: 0.36
Nodes (4): environmentMetadata(), sendEvent(), trackPageView(), onNav()

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (3): useCommandPaletteStore, c3c0c55 LATEX Editor, f883c97 LATEX Editor

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (11): 1596c73 Voice mode, 245df8e Merge branch 'main' of https://github.com/tgmstudios/foligo, 27c2bf1 feat: add analytics and content similarity, 8d9085b good ai, b30b552 Good for prod, cf26e1d feat(ai): extend AI Content Creator to GoApply and add current-page awareness, f0b4be0 remove old code, 150821f remove old code (+3 more)

### Community 74 - "Community 74"
Cohesion: 0.22
Nodes (2): declaration, 2533f8f feat(editor-studio): rich compile errors + LaTeX/markdown linting

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (7): 089f74b Refresh AI-edited posts and experience roles, 97e0c8d A lot of new stuff, f81a378 temp, 3f7125f A lot of new stuff, b75351a temp, plugin_vue, vite

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (14): Window, 16a008d Dark mode, 29df55c AI Multistep, 2b50442 Merge branch 'main' of https://github.com/tgmstudios/foligo, 3725b15 Move old content, 81238cb Dashboard improvements, 893cac6 updates, 8b7636e Merge branch 'main' of https://github.com/tgmstudios/foligo (+6 more)

### Community 92 - "Community 92"
Cohesion: 0.29
Nodes (6): e3ac367 social media and better ai chatbot experience, e966c80 New AI resume generator and site-wide touch ups, f0d2a2e media library changes, 2437013 media library changes, baaf15e social media and better ai chatbot experience, c47de3e New AI resume generator and site-wide touch ups

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (6): readPreferenceCookie(), clearPreferenceCookie(), 02cf9b1 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply, d082103 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat, a446f43 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat, e428e58 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply

### Community 63 - "Community 63"
Cohesion: 0.22
Nodes (5): 170fb21 fix: allow empty experience role end dates, 6ac3765 fix: resume scoring timeout - use QUICK model + aiApi (180s timeout), 76096a9 feat: add HackerRank resume scoring to resume studio, b9a78d3 fix(extension): raise agent continuation limit from 20 to 100, ef3bc25 fix: persist AI chats and resume scores

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (14): 19d43b2 fix(api): clean up cover letter PDFs on delete, describe LaTeX to the assistant, 3bfa0fc chore: add graphify skill config and project instructions, 6fbbcc1 fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat, aaf93a6 chore: sync graphify code-graph snapshot, b0924e1 refactor(dashboard): always sync Content Studio preview scroll with editor, cd8b3b4 fix(dashboard): hide the status badge on the portfolios list view, f429a54 feat(api): add cover letter editor tools and portfolio context service, 347793b refactor(dashboard): always sync Content Studio preview scroll with editor (+6 more)

### Community 78 - "Community 78"
Cohesion: 0.22
Nodes (1): 648453e feat(studio): add draggable resizing for editor/preview split and chat sidebar

### Community 99 - "Community 99"
Cohesion: 0.33
Nodes (3): ToolActivity, AgenticChatMessage, AgenticChatCallbacks

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (25): withErrorToast(), syncEntityInState(), syncNestedEntityInState(), SiteConfig, ProjectMember, Content, ContentLink, ContentTag (+17 more)

### Community 108 - "Community 108"
Cohesion: 0.40
Nodes (3): SavedChatSession, ChatSessionScope, c46cdbd feat(studio): add document chat sessions and scoring resilience

### Community 47 - "Community 47"
Cohesion: 0.23
Nodes (9): CoverLetterDocument, useCoverLetterDocuments(), documentsApi, coverLetterAdapter, resumeAdapter, adapters, registerAdapter(), 343deb8 feat(dashboard): add Cover Letter Studio with PDF compile and revision history (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.12
Nodes (5): ActivityItem, useProjectStore, Project, config, formatContentType()

### Community 64 - "Community 64"
Cohesion: 0.25
Nodes (8): ResumeDocumentSummary, ResumeDocument, ResumeDocumentRevisionSummary, ResumeDocumentRevisionDetail, useResumeDocuments(), documentsApi, ca272cd feat(dashboard): support resume templates and defaults in the Resume Gallery, 2736250 feat(dashboard): support resume templates and defaults in the Resume Gallery

### Community 55 - "Community 55"
Cohesion: 0.21
Nodes (11): app, pinia, authStore, User, LoginCredentials, RegisterData, useAuthStore, index_css (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.12
Nodes (6): toast, api, aiApi, Media, MediaListResponse, axios

### Community 44 - "Community 44"
Cohesion: 0.13
Nodes (14): LinkableExperienceCategory, GoApplyProfile, GoApplyJob, JobStatus, SavedAnswer, CoverLetter, JobFormData, JOB_STATUSES (+6 more)

### Community 56 - "Community 56"
Cohesion: 0.21
Nodes (8): StudioDocumentSummary, StudioSaveKind, StudioSaveResult, StudioMetaFieldSchema, StudioRevisionSummary, StudioRevisionDetail, StudioQuickAction, EditorStudioAdapter

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (21): 063e407 feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 1063f67 fix: reasoning model detection + auto-double token budget, 2efaeac feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, 336352a fix: correct logo import in LinkDevice.vue, 59972e4 fix: use default import for api in LinkDevice.vue, 60991ef fix: add canvas build deps for alpine dashboard Dockerfile, c2b335c fix: OpenCode reasoning model support + route collision fix, d4e316e fix: remove double-token for reasoning models (caused 504 timeouts) (+13 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (6): 00d5f02 feat(goapply): truncate kanban notes, add search filter to cover letters & resumes, enhance badges, 19d3d7b Update portable graphify artifacts, 9fde3b9 Refresh views after AI content changes, bbb2aec feat(goapply): show and filter by linked job category on resumes and cover letters, cfb6e19 feat(goapply): add sort and filtering to resume, cover letter, and Q&A tabs, f14f99d fix(goapply): source resume/cover letter category filter from all jobs

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (23): AgentController, GoApplyAPI, Banners, Boards, CDP, Consent, Detector, Filler (+15 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (15): getOwnTabId(), broadcastToSidePanel(), broadcastTurnCompletion(), armSubmitWatcher(), previewDocument(), startup(), tryActivate(), sidePanelRescan() (+7 more)

### Community 118 - "Community 118"
Cohesion: 0.83
Nodes (2): loadEnvForm(), toggleCustomFields()

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (43): syncTrackingControlState(), resumeOptionLabel(), refreshResumeSelector(), refreshJobTracking(), clearMessages(), removeEmptyState(), scrollToBottom(), workspaceIdFor() (+35 more)

### Community 101 - "Community 101"
Cohesion: 0.67
Nodes (5): parseOS(), parseBrowser(), detectDeviceType(), send(), trackPageView()

### Community 102 - "Community 102"
Cohesion: 0.33
Nodes (1): TemplateSelector

### Community 58 - "Community 58"
Cohesion: 0.17
Nodes (1): SiteApiService

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (49): 046ebb7 fix(api): retry Tectonic bundle warmup, 09d0f94 compiler: switch from tectonic (XeTeX) to LuaLaTeX, 0a28c02 feat(api): extend schema for cover letters, job categories/tags, and templates, 0b81330 refactor(api): rename session-flow.js → ai-session.js, 0fa26e1 ci: speed up ARM64 API builds, 1948fd7 fix(ci): don't fail api build when Tectonic bundle warmup can't reach host, 2f601fd fix, 38dc01a fix(dashboard): remove AI studio test animation (+41 more)

### Community 76 - "Community 76"
Cohesion: 0.22
Nodes (9): 0498826 tsc, 2226c00 prod entrypoint, a4cb9ba npm install, ad4b3d9 gitignore, aee3cf5 site fix, b22bcc6 dashboard fix, d65bc7e fix, f47171e downgrade (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (18): 07e29da fix: use PATCH instead of GET/PUT for deploy (Rancher API compat), 0ba8b30 revert: remove CI env var injection — envs stay in K8s, 106b076 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 18fcd65 fix: monorepo Dockerfiles + pnpm build scripts approval, 21baf7e fix: copy root package.json into Docker build context, 35d3be7 fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 382a89d feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 484f1c9 fix: use correct Rancher cluster ID (c-lx99g, not c-jxhnr) (+10 more)

### Community 54 - "Community 54"
Cohesion: 0.15
Nodes (13): 0928aff fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, 0ec3246 fix: load api.js in popup context so account connect UI works, 27cec51 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2db115c fix: add -k flag for Rancher self-signed cert, 3f4e737 chore: remove .graphify artifacts, 47b83e8 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 5a86c30 fix: device linking — use dashboard auth directly + exchange 202 for pending, 5e4fc4c fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge (+5 more)

### Community 98 - "Community 98"
Cohesion: 0.33
Nodes (6): 26637c3 refactor(api): split projects.js into projects-crud/site-config (Phase 3), 32b07a0 refactor(api): wire index.js mounts to the split route files, 761be74 chore(api): sync pnpm-lock.yaml after removing @google/generative-ai, ab5032d refactor(api): split admin.js into admin-users/projects/content/stats (Phase 2), afe8523 refactor(api): split content.js into content-crud/order/chat (Phase 5), d7f3158 refactor(api): split goapply.js into 5 focused route files (Phase 6)

### Community 93 - "Community 93"
Cohesion: 0.29
Nodes (7): 2bb9ac8 Fix empty chat history crash and remove hardcoded Gemini for function calling, 388a0fe ci: switch to self-hosted ARC runners (tgmstudios-runners), 625607f feat: add TurboRepo with remote cache for faster CI builds, 754c4ba Fix AIManager fallback chain with real health checks, a3002b1 fix: move /jobs/reorder route before /jobs/:id, cf181b9 fix: kanban drag-drop uses @add/@update instead of @change, f1a563e Add graphify knowledge graph and AGENTS.md

### Community 107 - "Community 107"
Cohesion: 0.40
Nodes (5): 5ca5e2a added bad site, 5cf7190 Final Changes, a03c122 Merge branch 'main' of https://github.com/tgmstudios/foligo, e450278 final, e57bb9b pushing demo site

### Community 33 - "Community 33"
Cohesion: 0.11
Nodes (18): 0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat, 18576fb fix: Dockerfile monorepo context for pnpm-lock.yaml, 1b5ddea feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 3087038 fix: install openssl for Prisma engine in API Dockerfile, 3c9693e fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 413498b fix: pin deployment to SHA-tagged image, not :latest, 517d7df fix: expand onlyBuiltDependencies to cover all workspace packages (+10 more)

### Community 86 - "Community 86"
Cohesion: 0.25
Nodes (8): 02f5b3e fix: move jobs/reorder route before jobs/:id, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2b2b612 chore: remove .graphify artifacts, 391098a feat: add TurboRepo with remote cache for faster CI builds, 577f1c6 ci: switch to self-hosted ARC runners (tgmstudios-runners), 5f2a237 Fix AIManager fallback chain with real health checks, 91c072c Add graphify knowledge graph and AGENTS.md, e52477f Fix empty chat history crash and remove hardcoded Gemini for function calling

### Community 77 - "Community 77"
Cohesion: 0.22
Nodes (9): 156116a dashboard fix, 3b00f25 fix, 3c7f32e fix, 73e954c npm install, 76b0a6d downgrade, 7e80672 prod entrypoint, b8bcbcf site fix, c188ac8 gitignore (+1 more)

### Community 87 - "Community 87"
Cohesion: 0.25
Nodes (8): 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b34879 fix: load api.js in popup context so account connect UI works, 9cff0d3 fix: add -k flag for Rancher self-signed cert, ba00164 fix: use -u basic auth instead of Bearer for Rancher API, c1c1833 fix(ci): use K8s native API path instead of broken Steve API PATCH, ccd62cc fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge, f645d9c fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, fd79a40 fix: deploy script with proper bash syntax, pre-computed timestamp, no nested date

### Community 126 - "Community 126"
Cohesion: 1.00
Nodes (1): docxtemplater

### Community 127 - "Community 127"
Cohesion: 1.00
Nodes (1): generative_ai

### Community 128 - "Community 128"
Cohesion: 1.00
Nodes (1): http

### Community 129 - "Community 129"
Cohesion: 1.00
Nodes (1): https

### Community 130 - "Community 130"
Cohesion: 1.00
Nodes (1): mammoth

### Community 131 - "Community 131"
Cohesion: 1.00
Nodes (1): minio

### Community 132 - "Community 132"
Cohesion: 1.00
Nodes (1): openid_client

### Community 133 - "Community 133"
Cohesion: 1.00
Nodes (1): pdf_parse

### Community 134 - "Community 134"
Cohesion: 1.00
Nodes (1): pizzip

### Community 135 - "Community 135"
Cohesion: 1.00
Nodes (1): redis

### Community 136 - "Community 136"
Cohesion: 1.00
Nodes (1): uuid

### Community 137 - "Community 137"
Cohesion: 1.00
Nodes (1): winston

### Community 94 - "Community 94"
Cohesion: 0.29
Nodes (7): AI Integration, Google Gemini AI, ElevenLabs Voice, Resume Generator, Voice Webhook, AI Function Calling, Resume Chatbot

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (11): Portfolio Generation, Content Blocks, Static Site Generator, Subdomain Routing, Markdown Editor, iOS SwiftUI App, Content Revisions, Portfolio Templates (+3 more)

### Community 123 - "Community 123"
Cohesion: 1.00
Nodes (2): JWT Authentication, SSO/OAuth Authentication

### Community 121 - "Community 121"
Cohesion: 1.00
Nodes (2): Job Tracker (GoApply), Chrome Extension (GoApply)

### Community 122 - "Community 122"
Cohesion: 1.00
Nodes (2): MinIO Media Storage, Docker Deployment

### Community 125 - "Community 125"
Cohesion: 1.00
Nodes (2): Redis Caching, Rate Limiting

### Community 124 - "Community 124"
Cohesion: 1.00
Nodes (2): Prisma ORM, PostgreSQL Database

## Knowledge Gaps
- **688 isolated node(s):** `content_links`, `sso_providers`, `ai_models`, `voice_providers`, `platform_settings` (+683 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 119`** (2 nodes): `user_integrations`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (2 nodes): `platform_settings`, `f0b501b feat: add web_search tool to all Foligo agents + admin settings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (2 nodes): `resume_score_results`, `resume_documents`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (2 nodes): `declaration`, `2533f8f feat(editor-studio): rich compile errors + LaTeX/markdown linting`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `648453e feat(studio): add draggable resizing for editor/preview split and chat sidebar`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (2 nodes): `loadEnvForm()`, `toggleCustomFields()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 102`** (1 nodes): `TemplateSelector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `docxtemplater`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (1 nodes): `generative_ai`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `http`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (1 nodes): `https`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `mammoth`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `minio`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `openid_client`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 133`** (1 nodes): `pdf_parse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 134`** (1 nodes): `pizzip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (1 nodes): `redis`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (1 nodes): `uuid`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (1 nodes): `winston`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (2 nodes): `JWT Authentication`, `SSO/OAuth Authentication`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 121`** (2 nodes): `Job Tracker (GoApply)`, `Chrome Extension (GoApply)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 122`** (2 nodes): `MinIO Media Storage`, `Docker Deployment`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (2 nodes): `Redis Caching`, `Rate Limiting`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (2 nodes): `Prisma ORM`, `PostgreSQL Database`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `Community 3` to `Community 52`, `Community 9`, `Community 11`, `Community 68`, `Community 25`, `Community 85`, `Community 7`, `Community 69`, `Community 23`, `Community 61`, `Community 62`, `Community 2`, `Community 5`, `Community 22`, `Community 4`, `Community 21`, `Community 49`, `Community 31`, `Community 81`, `Community 26`, `Community 17`, `Community 72`, `Community 1`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `GeminiService` connect `Community 19` to `Community 23`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 42` to `Community 48`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `content_links`, `sso_providers`, `ai_models` to the rest of the system?**
  _688 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 41` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 15` be split into smaller, more focused modules?**
  _Cohesion score 0.14112903225806453 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.025 - nodes in this community are weakly interconnected._