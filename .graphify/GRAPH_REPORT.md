# Graph Report - .  (2026-07-10)

## Corpus Check
- label mode - file stats not available

## Summary
- 844 nodes · 1080 edges · 54 communities detected
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: contains: 465 · imports_from: 284 · imports: 106 · method: 102 · calls: 81 · uses: 7 · implements: 6 · connects_to: 4 · handles: 3 · serves: 3 · entry_point: 2 · manages: 2 · accesses: 1 · built_with: 1 · configures: 1 · consumes: 1 · deployed_with: 1 · edits: 1 · enables: 1 · generates: 1 · implemented_by: 1 · includes: 1 · orchestrates: 1 · related_to: 1 · routes: 1 · tracks: 1 · ui_for: 1


## Graph Freshness
- Built from Git commit: `0c55f26`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `GeminiService` - 27 edges
2. `prisma` - 25 edges
3. `express` - 25 edges
4. `cache` - 19 edges
5. `express_validator` - 17 edges
6. `authorizeProjectAccess()` - 13 edges
7. `SiteApiService` - 12 edges
8. `OpenAICompatibleProvider` - 11 edges
9. `AIManager` - 10 edges
10. `AnthropicProvider` - 10 edges

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

### Community 0 - "Content Generation Prompts"
Cohesion: 0.05
Nodes (53): blogGenerationPrompt(), { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), editGenerationPrompt(), experienceGenerationPrompt(), projectGenerationPrompt(), skillGenerationPrompt() (+45 more)

### Community 1 - "Express App Bootstrap & Middleware"
Cohesion: 0.04
Nodes (54): cors, express_rate_limit, helmet, api/src/routes/tokens.js, morgan, additionalCorsOrigins, adminRoutes, adminSsoRoutes (+46 more)

### Community 2 - "Resume & File Services"
Cohesion: 0.05
Nodes (33): Resume Chatbot, Resume Generator, docxtemplater, fs, multer, path, pizzip, plugin_vue (+25 more)

### Community 3 - "AI Provider Manager"
Cohesion: 0.07
Nodes (18): aim, AIManager, { createGeminiLogger }, { createProvider, listProviders }, Google Gemini AI, generative_ai, BaseProvider, BaseProvider (+10 more)

### Community 4 - "AI Content & Voice Integration"
Cohesion: 0.06
Nodes (24): AI Integration, ElevenLabs Voice, AI Function Calling, Voice Webhook, mammoth, pdf_parse, { authorizeProjectAccess, authenticateToken }, { body, validationResult } (+16 more)

### Community 5 - "Core Concepts & Architecture"
Cohesion: 0.07
Nodes (22): bcryptjs, client, Content Blocks, Content Revisions, Express REST API, iOS SwiftUI App, Markdown Editor, Nuxt.js SSR (+14 more)

### Community 6 - "Gemini Service Core"
Cohesion: 0.14
Nodes (1): GeminiService

### Community 7 - "Dashboard Admin Views"
Cohesion: 0.08
Nodes (1): router

### Community 8 - "Media Upload & MinIO Storage"
Cohesion: 0.11
Nodes (20): Docker Deployment, MinIO Media Storage, minio, { authenticateToken, authorizeProjectAccess }, { body, validationResult }, express, multer, path (+12 more)

### Community 9 - "Authentication & GoApply Auth"
Cohesion: 0.12
Nodes (17): Chrome Extension (GoApply), Job Tracker (GoApply), jsonwebtoken, authenticateToken(), crypto, jwt, { prisma }, ai (+9 more)

### Community 10 - "Resume Composable Hooks"
Cohesion: 0.16
Nodes (7): axios, ResumeData, aiApi, api, toast, vue, vue_toastification

### Community 11 - "Admin SSO & Encryption"
Cohesion: 0.15
Nodes (13): http, https, { body, validationResult }, { encrypt, decrypt }, express, http, https, { prisma } (+5 more)

### Community 12 - "SSO/OAuth Authentication Flow"
Cohesion: 0.14
Nodes (10): JWT Authentication, SSO/OAuth Authentication, openid_client, configCache, {
  discovery,
  randomState,
  randomNonce,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  fetchUserInfo,
  ClientSecretPost
}, express, jwt, { prisma } (+2 more)

### Community 13 - "Redis Caching & Rate Limiting"
Cohesion: 0.15
Nodes (11): Rate Limiting, Redis Caching, redis, { body, validationResult }, { cache }, express, { prisma }, router (+3 more)

### Community 14 - "Project Store Types"
Cohesion: 0.14
Nodes (13): Content, ContentBlock, ContentLink, ContentMeta, ContentTag, CreateProjectData, ExperienceRole, Project (+5 more)

### Community 15 - "Site API Service"
Cohesion: 0.14
Nodes (2): siteApi, SiteApiService

### Community 16 - "Dashboard App Shell"
Cohesion: 0.18
Nodes (10): dashboard/src/assets/css/main.css, index_css, pinia, app, authStore, pinia, LoginCredentials, RegisterData (+2 more)

### Community 17 - "Prisma ORM & Database"
Cohesion: 0.20
Nodes (9): PostgreSQL Database, Prisma ORM, { cache }, express, { prisma }, router, connectDatabase(), prisma (+1 more)

### Community 18 - "Extension Popup Logic"
Cohesion: 0.30
Nodes (10): checkAuth(), checkPage(), COLORS, loadAIProviders(), setStatus(), showAuthedState(), showDeviceCodeUI(), showDisconnectedState() (+2 more)

### Community 19 - "GoApply Store"
Cohesion: 0.17
Nodes (11): CoverLetter, GoApplyJob, GoApplyProfile, JOB_STATUSES, JobFormData, JobStatus, KANBAN_COLUMNS, SavedAnswer (+3 more)

### Community 20 - "Auth Route & JWT"
Cohesion: 0.18
Nodes (10): crypto, { authenticateToken }, bcrypt, { body, validationResult }, { cache }, crypto, express, jwt (+2 more)

### Community 21 - "OpenAI-Compatible Provider"
Cohesion: 0.27
Nodes (1): OpenAICompatibleProvider

### Community 22 - "Media API Service"
Cohesion: 0.18
Nodes (2): Media, MediaListResponse

### Community 23 - "Dashboard Utilities"
Cohesion: 0.18
Nodes (2): config, formatContentType()

### Community 24 - "GoApply Router & Views"
Cohesion: 0.20
Nodes (2): goapplyRoutes, vue_router

### Community 26 - "Anthropic Provider"
Cohesion: 0.33
Nodes (1): AnthropicProvider

### Community 27 - "Gemini Provider"
Cohesion: 0.33
Nodes (1): GeminiProvider

### Community 28 - "Template Selector Service"
Cohesion: 0.22
Nodes (3): TEMPLATE_CONFIGS, TEMPLATE_STYLES, TemplateSelector

### Community 29 - "Revisions Route"
Cohesion: 0.25
Nodes (7): express_validator, { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 30 - "Skills Route"
Cohesion: 0.25
Nodes (7): express, { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 32 - "Projects Route"
Cohesion: 0.25
Nodes (7): authorizeProjectAccess(), { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 33 - "Admin Route"
Cohesion: 0.25
Nodes (7): requireAdmin(), { body, validationResult, query }, { cache }, express, { prisma }, { requireAdmin }, router

### Community 34 - "Content Links Route"
Cohesion: 0.25
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 35 - "Content Blocks Route"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 36 - "Content Meta Route"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 37 - "Content Tags Route"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 38 - "Content Route"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 39 - "Experience Roles Route"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 40 - "Project Access Route"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 41 - "Markdown Renderer"
Cohesion: 0.33
Nodes (1): marked

### Community 43 - "Extension Main Entry"
Cohesion: 0.60
Nodes (3): start(), startup(), tryActivate()

### Community 49 - "Nuxt Config"
Cohesion: 1.00
Nodes (1): config

### Community 51 - "GoApply API Client"
Cohesion: 1.00
Nodes (1): GoApplyAPI

### Community 52 - "Extension Banners"
Cohesion: 1.00
Nodes (1): Banners

### Community 53 - "Extension Boards"
Cohesion: 1.00
Nodes (1): Boards

### Community 54 - "Extension Consent"
Cohesion: 1.00
Nodes (1): Consent

### Community 55 - "Extension Detector"
Cohesion: 1.00
Nodes (1): Detector

### Community 56 - "Extension Filler"
Cohesion: 1.00
Nodes (1): Filler

### Community 57 - "Extension Finder"
Cohesion: 1.00
Nodes (1): Finder

### Community 58 - "Extension Tracker"
Cohesion: 1.00
Nodes (1): Tracker

### Community 59 - "Extension Tutorial"
Cohesion: 1.00
Nodes (1): Tutorial

### Community 60 - "Extension UI"
Cohesion: 1.00
Nodes (1): UI

### Community 63 - "Resume Chatbot View"
Cohesion: 1.00
Nodes (1): for

### Community 64 - "Vite Env Types"
Cohesion: 1.00
Nodes (1): Window

## Knowledge Gaps
- **335 isolated node(s):** `{ PrismaClient }`, `prisma`, `express`, `cors`, `helmet` (+330 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Gemini Service Core`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Admin Views`** (1 nodes): `router`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Site API Service`** (2 nodes): `siteApi`, `SiteApiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `OpenAI-Compatible Provider`** (1 nodes): `OpenAICompatibleProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Media API Service`** (2 nodes): `Media`, `MediaListResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Utilities`** (2 nodes): `config`, `formatContentType()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `GoApply Router & Views`** (2 nodes): `goapplyRoutes`, `vue_router`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Anthropic Provider`** (1 nodes): `AnthropicProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Gemini Provider`** (1 nodes): `GeminiProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Markdown Renderer`** (1 nodes): `marked`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Nuxt Config`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `GoApply API Client`** (1 nodes): `GoApplyAPI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Banners`** (1 nodes): `Banners`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Boards`** (1 nodes): `Boards`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Consent`** (1 nodes): `Consent`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Detector`** (1 nodes): `Detector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Filler`** (1 nodes): `Filler`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Finder`** (1 nodes): `Finder`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Tracker`** (1 nodes): `Tracker`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Tutorial`** (1 nodes): `Tutorial`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension UI`** (1 nodes): `UI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Resume Chatbot View`** (1 nodes): `for`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Env Types`** (1 nodes): `Window`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GeminiService` connect `Gemini Service Core` to `Content Generation Prompts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `express` connect `Skills Route` to `Admin Route`, `Admin SSO & Encryption`, `AI Content & Voice Integration`, `Authentication & GoApply Auth`, `Auth Route & JWT`, `Content Route`, `Content Blocks Route`, `Content Links Route`, `Content Meta Route`, `Content Tags Route`, `Experience Roles Route`, `Media Upload & MinIO Storage`, `Project Access Route`, `Projects Route`, `Prisma ORM & Database`, `Resume & File Services`, `Revisions Route`, `Core Concepts & Architecture`, `SSO/OAuth Authentication Flow`, `Redis Caching & Rate Limiting`, `Express App Bootstrap & Middleware`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `Google Gemini AI` connect `AI Provider Manager` to `AI Content & Voice Integration`, `Content Generation Prompts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `{ PrismaClient }`, `prisma`, `express` to the rest of the system?**
  _335 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Content Generation Prompts` be split into smaller, more focused modules?**
  _Cohesion score 0.051587301587301584 - nodes in this community are weakly interconnected._
- **Should `Express App Bootstrap & Middleware` be split into smaller, more focused modules?**
  _Cohesion score 0.03571428571428571 - nodes in this community are weakly interconnected._
- **Should `Resume & File Services` be split into smaller, more focused modules?**
  _Cohesion score 0.04931972789115646 - nodes in this community are weakly interconnected._