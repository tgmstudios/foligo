# Graph Report - .  (2026-07-12)

## Corpus Check
- 61 files · ~75,244 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 556 nodes · 888 edges · 39 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 346 · PARENT_OF: 122 · ON_BRANCH: 115 · imports_from: 114 · imports: 98 · calls: 49 · method: 44


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 61 · Candidates: 73
- Excluded: 3 untracked · 102 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `9030aa4`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `GeminiService` - 27 edges
2. `prisma` - 25 edges
3. `cache` - 19 edges
4. `authorizeProjectAccess()` - 13 edges
5. `AIManager` - 13 edges
6. `authenticateToken()` - 7 edges
7. `buildDateTimeContext()` - 6 edges
8. `buildSourceOfTruth()` - 5 edges
9. `GeminiAPIError` - 4 edges
10. `buildContextString()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 23 → community 5_
- `0541f93 cors fix` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 12 → community 5_
- `0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat` --PARENT_OF--> `3c9693e fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles`  [EXTRACTED]
  git → git  _Bridges community 12 → community 23_
- `150821f remove old code` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 13 → community 5_
- `156116a dashboard fix` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 19 → community 5_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (47): blogGenerationPrompt(), { buildContextString }, buildDateTimeContext(), buildSourceOfTruth(), editGenerationPrompt(), experienceGenerationPrompt(), projectGenerationPrompt(), skillGenerationPrompt() (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (48): additionalCorsOrigins, adminAiModelRoutes, adminRoutes, adminSsoRoutes, aiContentRoutes, aiProviderRoutes, allowedOrigins, app (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (22): aim, { createAILogger }, { createProvider, listProviders }, { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs }, { resolveModel }, { SAFETY_SETTINGS }, { createAnthropic }, { createGoogleGenerativeAI } (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (19): ai, { body, validationResult }, { createResumeEditorTools }, express, latexCompiler, path, PDF_STORAGE_DIR, { prisma } (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (1): GeminiService

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (25): main, 02f5b3e fix: move /jobs/reorder route before /jobs/:id, 0c55f26 feat: kanban drag-drop save + edit buttons + mobile + referredBy + API tokens + link-device theme, 1ab15d2 fix: kanban drag-drop uses @add/@update instead of @change, 2130f77 fix: revert deploy to working basic-auth pattern, add :latest + force pull, 2b2b612 chore: remove .graphify artifacts, 391098a feat: add TurboRepo with remote cache for faster CI builds, 4df342b fix: device linking — use dashboard auth directly + exchange 202 for pending (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (16): { authenticateToken, authorizeProjectAccess }, { body, validationResult }, express, multer, path, { prisma }, router, upload (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (11): { authorizeProjectAccess, authenticateToken }, { body, validationResult }, { cache }, express, geminiService, mammoth, multer, pdfParseModule (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (13): { body, validationResult }, { cache }, express, { prisma }, router, { cache }, express, geminiService (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (12): { authenticateToken }, { cache }, computeDerivedFields(), EXPERIENCE_INCLUDE, express, jwt, pickPrimary(), { prisma } (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (14): 15c176e fix: OpenCode reasoning model support + route collision fix, 241e6c0 fix: kanban drag-save with local reactive columns + add extension to repo, 2b34879 fix: load api.js in popup context so account connect UI works, 2e0b15f feat: expose reasoning alongside AI output + switch to deepseek-v4-pro, 2fe136f feat: GoApply — kanban, jobs, device auth, dashboard pages, extension login, 3087038 fix: install openssl for Prisma engine in API Dockerfile, 49075f5 feat: move GoApply to AI Assistants sidebar + fix kanban drag-save + markdown notes, 646d8ac fix: use PATCH instead of GET/PUT for deploy (Rancher API compat) (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.26
Nodes (1): AIManager

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (13): 0541f93 cors fix, 0692194 fix: add onlyBuiltDependencies to .npmrc for pnpm 10+ compat, 18576fb fix: Dockerfile monorepo context for pnpm-lock.yaml, 2437013 media library changes, 40fd685 other options, 78f04b9 new readme, a3400e5 Enhance README with new features and setup details, b6526e1 feat: model-agnostic AI layer + signup gate (+5 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (13): 150821f remove old code, 2f0b6d3 SSO support, 3358248 fix, 3b00f25 fix, 3f7125f A lot of new stuff, 4286262 good ai, b75351a temp, c188ac8 gitignore (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (11): { body, validationResult }, { encrypt, decrypt }, express, http, https, { prisma }, { requireAdmin }, router (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.21
Nodes (12): 16d2394 final, 27047d5 readme, 404f746 Final Changes, 5345604 Fix App Icon, 8393c63 Merge branch 'main' of https://github.com/tgmstudios/foligo, 8ad0083 final, 957db5a Merge branch 'main' of https://github.com/tgmstudios/foligo, ab25160 Merge branch 'main' of https://github.com/tgmstudios/foligo (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (10): crypto, jwt, { prisma }, requireAdmin(), { body, validationResult, query }, { cache }, express, { prisma } (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (11): 1596c73 Voice mode, 16a008d Dark mode, 245df8e Merge branch 'main' of https://github.com/tgmstudios/foligo, 29df55c AI Multistep, 40faf8f Script and Start html files, 69c514a Basic site loading, 81238cb Dashboard improvements, b935cd0 Swift App (+3 more)

### Community 18 - "Community 18"
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

### Community 19 - "Community 19"
Cohesion: 0.20
Nodes (10): 156116a dashboard fix, 2457110 fixed, 3c7f32e fix, 73e954c npm install, 76b0a6d downgrade, 7e80672 prod entrypoint, 8a75c5b new api stuff, 9e83a1d fix sites (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (9): { authenticateToken }, bcrypt, { body, validationResult }, { cache }, crypto, express, jwt, { prisma } (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (8): ai, { authorizeProjectAccess }, { body, validationResult }, { cache }, { createContentEditorTools }, express, { prisma }, router

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (7): { cache }, express, { prisma }, router, connectDatabase(), prisma, { PrismaClient }

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (9): 0210da7 fix: use --no-frozen-lockfile to allow pnpm to resolve build scripts, 1b5ddea feat: auto-inject AI env vars (OpenCode + fallback chain) on deploy, 3c9693e fix: set PNPM_IGNORED_BUILDS='' in all Dockerfiles, 413498b fix: pin deployment to SHA-tagged image, not :latest, 517d7df fix: expand onlyBuiltDependencies to cover all workspace packages, 8c303a1 revert: remove CI env var injection — envs stay in K8s, c8125cb fix: add all needed build deps to pnpm.onlyBuiltDependencies, f0e9169 fix: copy root package.json into Docker build context (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.28
Nodes (9): 485c30b test, 893cac6 updates, 8b7636e Merge branch 'main' of https://github.com/tgmstudios/foligo, 8fa9517 initial api and dash, 9c1c8f0 markdown cooking, a423a5a basic folder structure, d4b0a64 tes, e0f2932 trial addition 1 (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (8): express, fs, multer, path, router, storage, upload, { v4: uuidv4 }

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (7): authorizeProjectAccess(), { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (6): { authorizeProjectAccess }, { body, validationResult }, { cache }, express, { prisma }, router

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (5): authenticateToken(), ai, { authenticateToken }, express, router

### Community 36 - "Community 36"
Cohesion: 0.40
Nodes (4): express, prisma, { PrismaClient }, router

### Community 37 - "Community 37"
Cohesion: 0.40
Nodes (3): bcrypt, prisma, { PrismaClient }

### Community 38 - "Community 38"
Cohesion: 0.50
Nodes (2): prisma, { PrismaClient }

## Knowledge Gaps
- **262 isolated node(s):** `{ PrismaClient }`, `prisma`, `express`, `cors`, `helmet` (+257 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 4`** (1 nodes): `GeminiService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (1 nodes): `AIManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `prisma`, `{ PrismaClient }`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GeminiService` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `prisma` connect `Community 22` to `Community 16`, `Community 14`, `Community 7`, `Community 20`, `Community 21`, `Community 28`, `Community 27`, `Community 29`, `Community 30`, `Community 31`, `Community 9`, `Community 6`, `Community 32`, `Community 33`, `Community 3`, `Community 34`, `Community 26`, `Community 18`, `Community 25`, `Community 8`, `Community 1`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `AIManager` connect `Community 11` to `Community 2`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `{ PrismaClient }`, `prisma`, `express` to the rest of the system?**
  _262 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05245901639344262 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07936507936507936 - nodes in this community are weakly interconnected._