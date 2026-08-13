# Graph Report - .  (2026-08-13)

## Corpus Check
- 418 files · ~382,559 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2283 nodes · 5168 edges · 125 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 1651 · contains: 1467 · ON_BRANCH: 536 · imports_from: 423 · PARENT_OF: 350 · imports: 322 · calls: 260 · method: 66 · references: 55 · re_exports: 12 · uses: 6 · inherits: 3 · accesses: 1 · built_with: 1 · connects_to: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · entry_point: 1 · generates: 1 · handles: 1 · implemented_by: 1 · implements: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · serves: 1 · tracks: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 418 · Candidates: 544
- Excluded: 7 untracked · 121002 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `14c05ec`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `prisma` - 51 edges
2. `GeminiService` - 28 edges
3. `cache` - 25 edges
4. `AIManager` - 17 edges
5. `authorizeProjectAccess()` - 16 edges
6. `handleAgentEvent()` - 13 edges
7. `SiteApiService` - 12 edges
8. `addStatusChip()` - 10 edges
9. `setAgentBusy()` - 9 edges
10. `refreshAccountStatus()` - 9 edges

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

### Community 85 - "Community 85"
Cohesion: 0.50
Nodes (7): users, projects, project_access, content, assets, site_config, ai_analysis

### Community 50 - "Community 50"
Cohesion: 0.31
Nodes (13): content_links, content_tags, content_meta, content_blocks, skills, experience_roles, _ProjectSkills, _ContentTags (+5 more)

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (5): content, sso_providers, ai_models, sso_providers, 2d62706 fix(api): stop gitignoring prisma migrations, causing prod schema drift

### Community 112 - "Community 112"
Cohesion: 0.83
Nodes (3): media, users, projects

### Community 96 - "Community 96"
Cohesion: 0.53
Nodes (5): post_order, resume_chat_sessions, projects, content, users

### Community 113 - "Community 113"
Cohesion: 1.00
Nodes (3): resume_templates, resume_history, users

### Community 86 - "Community 86"
Cohesion: 0.46
Nodes (7): job_applications, user_profiles, saved_answers, cover_letters, generated_emails, api_tokens, users

### Community 97 - "Community 97"
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

### Community 105 - "Community 105"
Cohesion: 0.40
Nodes (4): 0a28c02 feat(api): extend schema for cover letters, job categories/tags, and templates, 797a98f feat(api): support resume templates and defaults, 81226ce feat(api): add Job Assistant chat agent and Cover Letter document endpoints, 8495907 feat(api): stream AI Content Creator sessions with reasoning and tool activity

### Community 116 - "Community 116"
Cohesion: 0.83
Nodes (3): _JobSavedAnswers, job_applications, saved_answers

### Community 118 - "Community 118"
Cohesion: 1.00
Nodes (2): user_integrations, users

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (24): analytics_properties, analytics_events, voice_providers, projects, express, { Prisma }, { authorizeProjectAccess }, {
  MAX_BATCH_SIZE,
  hash,
  createWriteKey,
  normalizeOrigin,
  originAllowed,
  normalizeEvent,
} (+16 more)

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (16): platform_settings, { tool }, { z }, { createWebSearchTool }, { createPullPageTool }, createCoverLetterEditorTools(), { tool }, { z } (+8 more)

### Community 106 - "Community 106"
Cohesion: 0.50
Nodes (3): ai_chat_sessions, users, 8bbadc1 Add persistent AI chat sessions and analytics updates

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (21): resume_score_results, resume_documents, express, { body, query, validationResult }, { prisma }, router, allowedScopes, { prisma } (+13 more)

### Community 107 - "Community 107"
Cohesion: 0.50
Nodes (3): AgentController, 1de7813 feat(goapply): capture role descriptions, job categories, and side-panel job workspace, c8cf150 fix(extension): stop job tracking from overwriting unrelated cards

### Community 69 - "Community 69"
Cohesion: 0.18
Nodes (7): { PrismaClient }, prisma, { PrismaClient }, bcrypt, prisma, bcryptjs, client

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (77): express, path, cors, helmet, morgan, rateLimit, swaggerUi, swaggerJsdoc (+69 more)

### Community 76 - "Community 76"
Cohesion: 0.20
Nodes (8): 26637c3 refactor(api): split projects.js into projects-crud/site-config (Phase 3), 32b07a0 refactor(api): wire index.js mounts to the split route files, 680a2a2 refactor(api): split gemini.js into composable gemini/* modules, 761be74 chore(api): sync pnpm-lock.yaml after removing @google/generative-ai, ab5032d refactor(api): split admin.js into admin-users/projects/content/stats (Phase 2), afe8523 refactor(api): split content.js into content-crud/order/chat (Phase 5), d7f3158 refactor(api): split goapply.js into 5 focused route files (Phase 6), e752149 refactor(api): extract shared pagination/search/access utilities (Phase 1)

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (30): jwt, crypto, { prisma }, authenticateToken(), requireAdmin(), express, { prisma }, { requireAdmin } (+22 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (35): authorizeProjectAccess(), { validationResult }, handleValidation(), express, { body }, { prisma }, { cache }, { authorizeProjectAccess } (+27 more)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (28): TEMPLATE_STYLES, TEMPLATE_CONFIGS, TemplateSelector, siteApi, 054d6d6 proper .env, 654efd6 use markdown renderer, 69c514a Basic site loading, 8e1a210 Merge branch 'main' of https://github.com/tgmstudios/foligo (+20 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (15): express, { body, validationResult }, { prisma }, { requireAdmin }, { encrypt }, { ensureBootstrapModels, getProviderConfig, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES }, { KNOWN_MODELS }, { catalogModelsFor } (+7 more)

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (32): express, { body, query }, { prisma }, { cache }, { requireAdmin }, { handleValidation }, { paginate, buildPaginationResponse }, { buildSearchWhere } (+24 more)

### Community 30 - "Community 30"
Cohesion: 0.09
Nodes (18): express, { body, validationResult }, { prisma }, { requireAdmin }, { encrypt, decrypt }, https, http, router (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.08
Nodes (19): express, { body, validationResult }, multer, mammoth, pdfParseModule, { prisma }, { cache }, { authorizeProjectAccess, authenticateToken } (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (37): express, router, ai, { authenticateToken }, { prisma }, {
  createExtensionAgentServerTools,
  CLIENT_AGENT_TOOL_DEFS,
  getExtensionAgentCapabilities,
}, { flattenToolMessages }, { setupSSE } (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (66): express, router, geminiService, { prisma }, { cache }, express, { body, validationResult }, { prisma } (+58 more)

### Community 68 - "Community 68"
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

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (59): express, { body, validationResult }, multer, { prisma }, { cache }, ai, { createContentEditorTools }, { createGithubTools } (+51 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (27): express, { body }, { prisma }, { cache }, { authorizeProjectAccess }, { handleValidation }, githubService, { CONTENT_INCLUDE, getContentWithAccess, invalidateContentCache } (+19 more)

### Community 25 - "Community 25"
Cohesion: 0.10
Nodes (22): express, { body, validationResult }, { prisma }, { cache }, { authorizeProjectAccess }, { findSimilarPostPairs }, router, { TfIdf } (+14 more)

### Community 101 - "Community 101"
Cohesion: 0.40
Nodes (5): express, request, { prisma }, router, app()

### Community 32 - "Community 32"
Cohesion: 0.11
Nodes (15): express, { prisma }, router, PROFILE_PASSTHROUGH_FIELDS, PROFILE_URL_FIELDS, EXPERIENCE_INCLUDE, PROFILE_INCLUDE, pickPrimary() (+7 more)

### Community 36 - "Community 36"
Cohesion: 0.13
Nodes (16): express, multer, { v4: uuidv4 }, path, { body, validationResult }, { prisma }, { uploadFile, deleteFile, getFileUrl, minioClient, BUCKET_NAME }, { authenticateToken, authorizeProjectAccess } (+8 more)

### Community 111 - "Community 111"
Cohesion: 0.40
Nodes (4): express, router, { PrismaClient }, prisma

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (32): express, { body, validationResult }, multer, path, { prisma }, ai, latexCompiler, { createResumeEditorTools } (+24 more)

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (19): ai, { GeminiAPIError }, createAiClient(), { prisma }, { createAILogger }, { GENERATION_CONFIG }, { createAiClient }, { stripMarkdown, extractHashtags } (+11 more)

### Community 59 - "Community 59"
Cohesion: 0.18
Nodes (9): ai, { GeminiAPIError }, { GENERATION_CONFIG }, {
  extractStructuredData,
  extractStructuredDataUniversal,
  buildMetadataFromStructuredData,
  extractTitleFromConversation
}, { shouldCreateMultiplePosts, generateMultiplePosts }, {
  createContentCreateTools,
  createContentEditTools
}, { buildConversationalSystemPrompt }, buildInitialMessage() (+1 more)

### Community 54 - "Community 54"
Cohesion: 0.17
Nodes (10): handleFunctionCall(), { GeminiAPIError }, { AI_RESUME_CHATBOT_TOOLS }, { createGithubTools }, { buildResumeChatbotSystemPrompt }, { GENERATION_CONFIG }, { handleFunctionCall }, buildContextString() (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (15): GENERATION_CONFIG, SYSTEM_INSTRUCTIONS, { utilityPrompts }, { GENERATION_CONFIG }, { cleanGeneratedContent }, extractStructuredData(), extractStructuredDataUniversal(), buildMetadataFromStructuredData() (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (1): GeminiService

### Community 81 - "Community 81"
Cohesion: 0.25
Nodes (6): { utilityPrompts }, { GENERATION_CONFIG }, shouldCreateMultiplePosts(), generateMultiplePosts(), fallbackQuestions, utilityPrompts

### Community 117 - "Community 117"
Cohesion: 0.50
Nodes (2): ai, AIService

### Community 28 - "Community 28"
Cohesion: 0.12
Nodes (8): aim, 933e05e AI Fixes, deepseek support, AI Merged into goapply, c371019 More AI Repairs, ded6ded Agentic editor and PDF Latex support, 7aa68eb Agentic editor and PDF Latex support, 8dcf942 AI Fixes, deepseek support, AI Merged into goapply, bde1fd9 More AI Repairs, for

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (12): { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { createProvider, listProviders, isProviderConfigured, listAvailableModels, SAFETY_SETTINGS }, { resolveModel, listModelSelections, ensureBootstrapModels, getDisabledProviderTypes }, { createAILogger }, { resolveModel, listModelSelections, ensureBootstrapModels }, { createProvider, listProviders, isProviderConfigured, SAFETY_SETTINGS }, { createProvider, listProviders }, { resolveModel, ensureBootstrapModels } (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.24
Nodes (2): buildProviderOptions(), AIManager

### Community 92 - "Community 92"
Cohesion: 0.29
Nodes (5): { streamText, stepCountIs }, { createProvider, isProviderConfigured }, { resolveModel, listModelSelections }, manager, isProviderConfigured()

### Community 46 - "Community 46"
Cohesion: 0.21
Nodes (15): { prisma }, { encrypt, decrypt }, { refreshTokens, chatgptAccountIdFromIdToken }, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES, ensureBootstrapModels(), refreshOAuthTokenIfNeeded(), getProviderConfig() (+7 more)

### Community 44 - "Community 44"
Cohesion: 0.14
Nodes (16): { createGoogleGenerativeAI }, { createAnthropic }, { createOpenAICompatible }, { createOpenAI }, { catalogModelsFor }, PRESETS, OPENAI_COMPATIBLE_LABEL, DISCOVERABLE_TYPES (+8 more)

### Community 67 - "Community 67"
Cohesion: 0.22
Nodes (8): { tool }, { z }, AI_RESUME_CHATBOT_TOOLS, { createGithubTools }, { createPullPageTool }, _coreFoligoBaseTools(), createContentCreateTools(), createContentEditTools()

### Community 82 - "Community 82"
Cohesion: 0.47
Nodes (8): { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), projectGenerationPrompt(), experienceGenerationPrompt(), blogGenerationPrompt(), skillGenerationPrompt(), editGenerationPrompt()

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (16): { tool }, { z }, { prisma }, { cache }, { CONTENT_INCLUDE, invalidateContentCache }, { snapshotContentRevision, buildContentFieldUpdate }, { matchOrCreateSkills, matchOrCreateTags }, { createWebSearchTool } (+8 more)

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (11): GeminiError, GeminiConfigError, GeminiAPIError, GeminiParseError, GeminiValidationError, { GeminiAPIError }, RETRY_CONFIG, isRetryableError() (+3 more)

### Community 88 - "Community 88"
Cohesion: 0.25
Nodes (7): winston, customFormat, consoleTransport, fileTransport, errorFileTransport, logger, createAILogger()

### Community 100 - "Community 100"
Cohesion: 0.33
Nodes (4): fs, path, vm, REQUIRED_TOOLS

### Community 110 - "Community 110"
Cohesion: 0.40
Nodes (3): fs, path, vm

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (24): { Octokit }, { spawn }, os, path, { prisma }, { decrypt }, CLONE_TTL_MS, MAX_REPO_SIZE_KB (+16 more)

### Community 47 - "Community 47"
Cohesion: 0.14
Nodes (10): { tool }, { z }, { projectAccessWhere }, { createWebSearchTool }, { createPullPageTool }, optionalText, jobAssistantTool(), profileSchema (+2 more)

### Community 73 - "Community 73"
Cohesion: 0.24
Nodes (9): { spawn }, os, path, crypto, { PDFDocument }, sanitizeMetadata(), parseLatexErrors(), compile() (+1 more)

### Community 79 - "Community 79"
Cohesion: 0.36
Nodes (8): net, isPrivateIp(), assertPublicUrl(), readLimitedBody(), htmlToText(), pullPage(), createPullPageTool(), {
  htmlToText,
  isPrivateIp,
  pullPage,
  createPullPageTool,
}

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (8): crypto, MERMAID_THEME_VARIABLES, router, 48d46c3 SSO support, 5944c16 Refactored the content editor to use the new Editor Studio. Refactored admin dashboard, 2f0b6d3 SSO support, ae8be0a Refactored the content editor to use the new Editor Studio. Refactored admin dashboard, crypto

### Community 91 - "Community 91"
Cohesion: 0.36
Nodes (4): environmentMetadata(), sendEvent(), trackPageView(), onNav()

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (3): useCommandPaletteStore, c3c0c55 LATEX Editor, f883c97 LATEX Editor

### Community 60 - "Community 60"
Cohesion: 0.20
Nodes (4): 089f74b Refresh AI-edited posts and experience roles, 19d3d7b Update portable graphify artifacts, 9fde3b9 Refresh views after AI content changes, cf26e1d feat(ai): extend AI Content Creator to GoApply and add current-page awareness

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (2): declaration, 2533f8f feat(editor-studio): rich compile errors + LaTeX/markdown linting

### Community 55 - "Community 55"
Cohesion: 0.26
Nodes (2): 97e0c8d A lot of new stuff, 3f7125f A lot of new stuff

### Community 48 - "Community 48"
Cohesion: 0.15
Nodes (8): ToolActivity, AgenticChatMessage, AgenticChatCallbacks, QueuedChatMessage, 09d09b4 feat(ai): add attachment support across editors, raise agent token budgets, 1463ae4 feat(ai): give AI Content Creator full portfolio control, d082103 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat, a446f43 feat(dashboard): rebuild Job Assistant as a session workspace on shared agentic chat

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (25): Window, 1596c73 Voice mode, 16a008d Dark mode, 245df8e Merge branch 'main' of https://github.com/tgmstudios/foligo, 27c2bf1 feat: add analytics and content similarity, 29df55c AI Multistep, 2b50442 Merge branch 'main' of https://github.com/tgmstudios/foligo, 81238cb Dashboard improvements (+17 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (13): toast, api, aiApi, Media, MediaListResponse, e966c80 New AI resume generator and site-wide touch ups, f0d2a2e media library changes, 2437013 media library changes (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.13
Nodes (5): 02cf9b1 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply, c6e4132 Add custom textarea scrollbar to chat sidebar; stop job form closing on backdrop click, 2736250 feat(dashboard): support resume templates and defaults in the Resume Gallery, 49075f5 feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, e428e58 feat(dashboard): add job categories/tags, search/sort, and address/phone inputs to GoApply

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (1): e289d25 feat(goapply): cross-reference resumes in editor agents, add New Resume dialog

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (5): 648453e feat(studio): add draggable resizing for editor/preview split and chat sidebar, bbb2aec feat(goapply): show and filter by linked job category on resumes and cover letters, 347793b refactor(dashboard): always sync Content Studio preview scroll with editor, 532eb3c fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat, ee19071 fix(api): clean up cover letter PDFs on delete, describe LaTeX to the assistant

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (43): withErrorToast(), syncEntityInState(), syncNestedEntityInState(), ActivityItem, LinkableExperienceCategory, GoApplyProfile, GoApplyJob, JobStatus (+35 more)

### Community 51 - "Community 51"
Cohesion: 0.23
Nodes (9): CoverLetterDocument, useCoverLetterDocuments(), documentsApi, coverLetterAdapter, resumeAdapter, adapters, registerAdapter(), 343deb8 feat(dashboard): add Cover Letter Studio with PDF compile and revision history (+1 more)

### Community 78 - "Community 78"
Cohesion: 0.29
Nodes (7): ResumeDocumentSummary, ResumeDocument, ResumeDocumentRevisionSummary, ResumeDocumentRevisionDetail, useResumeDocuments(), documentsApi, ca272cd feat(dashboard): support resume templates and defaults in the Resume Gallery

### Community 57 - "Community 57"
Cohesion: 0.21
Nodes (11): app, pinia, authStore, User, LoginCredentials, RegisterData, useAuthStore, index_css (+3 more)

### Community 62 - "Community 62"
Cohesion: 0.23
Nodes (4): goapplyRoutes, 46be3c0 feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 2fe136f feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, vue_router

### Community 63 - "Community 63"
Cohesion: 0.21
Nodes (8): StudioDocumentSummary, StudioSaveKind, StudioSaveResult, StudioMetaFieldSchema, StudioRevisionSummary, StudioRevisionDetail, StudioQuickAction, EditorStudioAdapter

### Community 99 - "Community 99"
Cohesion: 0.53
Nodes (5): parsePreference(), readPreferenceCookie(), writePreferenceCookie(), clearPreferenceCookie(), 53cc332 Improve AI chats and persist GoApply filters

### Community 80 - "Community 80"
Cohesion: 0.20
Nodes (1): config

### Community 29 - "Community 29"
Cohesion: 0.10
Nodes (18): 0c55f26 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 15c176e fix: OpenCode reasoning model support + route collision fix, 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b34879 fix: load api.js in popup context so account connect UI works, 2e0b15f feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 4df342b fix: device linking — use dashboard auth directly + exchange 202 for pending, 7641985 fix: reasoning model detection + auto-double token budget, 782c5fd fix: prevent router redirect loop on page load (+10 more)

### Community 70 - "Community 70"
Cohesion: 0.20
Nodes (3): 0c8130c fix(ci): suppress Rancher deployment response bodies (#2), 14c05ec refactor(goapply): use heroicons for job action icons, move link button, f75adbc feat(goapply): add job posting links

### Community 71 - "Community 71"
Cohesion: 0.18
Nodes (2): 3725b15 Move old content, 9030aa4 Move old content

### Community 64 - "Community 64"
Cohesion: 0.29
Nodes (10): cacheCapturedImage(), gifFrameStore, gifRecordingGroups, restoreGifRecordingGroups(), setGifRecording(), addGifFrame(), recordGifFrame(), ensureOffscreenDocument() (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (21): GoApplyAPI, Banners, Boards, Consent, Detector, Filler, Finder, Tracker (+13 more)

### Community 124 - "Community 124"
Cohesion: 1.00
Nodes (1): CDP

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (32): getOwnTabId(), broadcastToSidePanel(), broadcastTurnCompletion(), clearPendingSubmission(), recordConfirmedSubmission(), recoverPendingSubmission(), armSubmitWatcher(), previewDocument() (+24 more)

### Community 89 - "Community 89"
Cohesion: 0.36
Nodes (6): FRAME_DELAY_MS, actionLabel(), drawRoundedRect(), drawOverlays(), blobToDataUrl(), encodeGif()

### Community 83 - "Community 83"
Cohesion: 0.36
Nodes (7): categories, renderCategories(), showCatMsg(), saveCategories(), loadCategories(), loadEnvForm(), toggleCustomFields()

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (65): effectiveJob(), syncTrackingControlState(), resumeOptionLabel(), refreshResumeSelector(), refreshJobTracking(), ensureProfile(), categoriesFromProfile(), refreshCategorySelect() (+57 more)

### Community 102 - "Community 102"
Cohesion: 0.67
Nodes (5): parseOS(), parseBrowser(), detectDeviceType(), send(), trackPageView()

### Community 66 - "Community 66"
Cohesion: 0.17
Nodes (1): SiteApiService

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (53): 00d5f02 feat(goapply): truncate kanban notes, add search filter to cover letters & resumes, enhance badges, 046ebb7 fix(api): retry Tectonic bundle warmup, 0498826 tsc, 063e407 feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 07ab9dc fixed, 09d0f94 compiler: switch from tectonic (XeTeX) to LuaLaTeX, 0b81330 refactor(api): rename session-flow.js → ai-session.js, 0fa26e1 ci: speed up ARM64 API builds (+45 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (61): 036dc3f fix(dashboard): build canvas from source in Alpine, b0436f7 Graphify artifacts, b46fb17 Merge branch 'main' of https://github.com/tgmstudios/foligo, b935cd0 Swift App, bb1b131 Fix App Icon, c788336 Basic Project Dashboard, main, a423a5a basic folder structure (+53 more)

### Community 98 - "Community 98"
Cohesion: 0.33
Nodes (6): 07e29da fix: use PATCH instead of GET/PUT for deploy (Rancher API compat), 0ba8b30 revert: remove CI env var injection — envs stay in K8s, 382a89d feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 484f1c9 fix: use correct Rancher cluster ID (c-lx99g, not c-jxhnr), 8a74801 fix: install openssl for Prisma engine in API Dockerfile, 975505b fix: pin deployment to SHA-tagged image, not :latest

### Community 75 - "Community 75"
Cohesion: 0.20
Nodes (10): 0928aff fix: CI pushes latest tag, deploy uses Bearer auth with imagePullPolicy Always, 0ec3246 fix: load api.js in popup context so account connect UI works, 27cec51 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2db115c fix: add -k flag for Rancher self-signed cert, 5a86c30 fix: device linking — use dashboard auth directly + exchange 202 for pending, 5e4fc4c fix: link-device page - no duplicate API call, Foligo colors, no auth required, postMessage bridge, 87a6081 fix(ci): use K8s native API path instead of broken Steve API PATCH, 98533b9 fix: deploy script with proper bash syntax, pre-computed timestamp, no nested date (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.17
Nodes (12): 106b076 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 18fcd65 fix: monorepo Dockerfiles + pnpm build scripts approval, 21baf7e fix: copy root package.json into Docker build context, 35d3be7 fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 649349e feat: model-agnostic AI layer + signup gate, 8456f34 switch to pnpm, b8a8c43 Enhance README with new features and setup details, c5bbbd8 fix: Dockerfile monorepo context for pnpm-lock.yaml (+4 more)

### Community 93 - "Community 93"
Cohesion: 0.29
Nodes (7): 19d43b2 fix(api): clean up cover letter PDFs on delete, describe LaTeX to the assistant, 3bfa0fc chore: add graphify skill config and project instructions, 6fbbcc1 fix(dashboard): make the Studio preview toggle reachable on mobile, add collapsible chat, aaf93a6 chore: sync graphify code-graph snapshot, b0924e1 refactor(dashboard): always sync Content Studio preview scroll with editor, cd8b3b4 fix(dashboard): hide the status badge on the portfolios list view, f429a54 feat(api): add cover letter editor tools and portfolio context service

### Community 77 - "Community 77"
Cohesion: 0.20
Nodes (10): 2bb9ac8 Fix empty chat history crash and remove hardcoded Gemini for function calling, 388a0fe ci: switch to self-hosted ARC runners (tgmstudios-runners), 3f4e737 chore: remove .graphify artifacts, 47b83e8 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 625607f feat: add TurboRepo with remote cache for faster CI builds, 754c4ba Fix AIManager fallback chain with real health checks, 7fb656d fix: prevent router redirect loop on page load, a3002b1 fix: move /jobs/reorder route before /jobs/:id (+2 more)

### Community 108 - "Community 108"
Cohesion: 0.40
Nodes (5): 2f601fd fix, 8d9085b good ai, b30b552 Good for prod, c90a3b3 new dockers, f0b4be0 remove old code

### Community 109 - "Community 109"
Cohesion: 0.40
Nodes (5): 5ca5e2a added bad site, 5cf7190 Final Changes, a03c122 Merge branch 'main' of https://github.com/tgmstudios/foligo, e450278 final, e57bb9b pushing demo site

### Community 87 - "Community 87"
Cohesion: 0.25
Nodes (8): 02f5b3e fix: move jobs/reorder route before jobs/:id, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2b2b612 chore: remove .graphify artifacts, 391098a feat: add TurboRepo with remote cache for faster CI builds, 577f1c6 ci: switch to self-hosted ARC runners (tgmstudios-runners), 5f2a237 Fix AIManager fallback chain with real health checks, 91c072c Add graphify knowledge graph and AGENTS.md, e52477f Fix empty chat history crash and remove hardcoded Gemini for function calling

### Community 125 - "Community 125"
Cohesion: 1.00
Nodes (1): docxtemplater

### Community 126 - "Community 126"
Cohesion: 1.00
Nodes (1): generative_ai

### Community 127 - "Community 127"
Cohesion: 1.00
Nodes (1): http

### Community 128 - "Community 128"
Cohesion: 1.00
Nodes (1): https

### Community 129 - "Community 129"
Cohesion: 1.00
Nodes (1): mammoth

### Community 130 - "Community 130"
Cohesion: 1.00
Nodes (1): minio

### Community 131 - "Community 131"
Cohesion: 1.00
Nodes (1): openid_client

### Community 132 - "Community 132"
Cohesion: 1.00
Nodes (1): pdf_parse

### Community 133 - "Community 133"
Cohesion: 1.00
Nodes (1): pizzip

### Community 134 - "Community 134"
Cohesion: 1.00
Nodes (1): redis

### Community 135 - "Community 135"
Cohesion: 1.00
Nodes (1): uuid

### Community 136 - "Community 136"
Cohesion: 1.00
Nodes (1): winston

### Community 94 - "Community 94"
Cohesion: 0.29
Nodes (7): AI Integration, Google Gemini AI, ElevenLabs Voice, Resume Generator, Voice Webhook, AI Function Calling, Resume Chatbot

### Community 72 - "Community 72"
Cohesion: 0.18
Nodes (11): Portfolio Generation, Content Blocks, Static Site Generator, Subdomain Routing, Markdown Editor, iOS SwiftUI App, Content Revisions, Portfolio Templates (+3 more)

### Community 121 - "Community 121"
Cohesion: 1.00
Nodes (2): JWT Authentication, SSO/OAuth Authentication

### Community 119 - "Community 119"
Cohesion: 1.00
Nodes (2): Job Tracker (GoApply), Chrome Extension (GoApply)

### Community 120 - "Community 120"
Cohesion: 1.00
Nodes (2): MinIO Media Storage, Docker Deployment

### Community 123 - "Community 123"
Cohesion: 1.00
Nodes (2): Redis Caching, Rate Limiting

### Community 122 - "Community 122"
Cohesion: 1.00
Nodes (2): Prisma ORM, PostgreSQL Database

## Knowledge Gaps
- **721 isolated node(s):** `content_links`, `sso_providers`, `ai_models`, `voice_providers`, `platform_settings` (+716 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 118`** (2 nodes): `user_integrations`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (2 nodes): `ai`, `AIService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `buildProviderOptions()`, `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `declaration`, `2533f8f feat(editor-studio): rich compile errors + LaTeX/markdown linting`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `97e0c8d A lot of new stuff`, `3f7125f A lot of new stuff`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `e289d25 feat(goapply): cross-reference resumes in editor agents, add New Resume dialog`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (2 nodes): `3725b15 Move old content`, `9030aa4 Move old content`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (1 nodes): `CDP`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (1 nodes): `docxtemplater`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `generative_ai`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (1 nodes): `http`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `https`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (1 nodes): `mammoth`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `minio`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `openid_client`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `pdf_parse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 133`** (1 nodes): `pizzip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 134`** (1 nodes): `redis`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (1 nodes): `uuid`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (1 nodes): `winston`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 121`** (2 nodes): `JWT Authentication`, `SSO/OAuth Authentication`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (2 nodes): `Job Tracker (GoApply)`, `Chrome Extension (GoApply)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (2 nodes): `MinIO Media Storage`, `Docker Deployment`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (2 nodes): `Redis Caching`, `Rate Limiting`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 122`** (2 nodes): `Prisma ORM`, `PostgreSQL Database`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `Community 1` to `Community 34`, `Community 14`, `Community 16`, `Community 30`, `Community 26`, `Community 15`, `Community 8`, `Community 46`, `Community 27`, `Community 68`, `Community 3`, `Community 19`, `Community 25`, `Community 12`, `Community 35`, `Community 23`, `Community 101`, `Community 32`, `Community 13`, `Community 36`, `Community 18`, `Community 2`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `GeminiService` connect `Community 21` to `Community 27`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 37` to `Community 53`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `content_links`, `sso_providers`, `ai_models` to the rest of the system?**
  _721 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 45` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 18` be split into smaller, more focused modules?**
  _Cohesion score 0.10752688172043011 - nodes in this community are weakly interconnected._
- **Should `Community 31` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._