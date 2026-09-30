# Per-user AI Model Access Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Restrict Foligo AI usage to models that an administrator has explicitly granted to each user, while retaining model credentials exclusively in administrator-managed configuration.

**Architecture:** Add a `UserAiModelGrant` join table between `User` and `AiModel`. Centralize authorization in the AI model resolver and pass the authenticated `userId` through every AI route/service path. Admins manage grants on the existing user-detail screen; user model selectors continue to consume `/api/ai/providers`, now filtered by grants.

**Tech Stack:** Express, Prisma/PostgreSQL, Jest, Vue 3/TypeScript, AI SDK.

---

### Task 1: Persist user-to-model grants and resolve only eligible models

**Objective:** Add the grant relation and make model resolution capable of producing only a user's authorized model candidates.

**Files:**
- Modify: `api/prisma/schema.prisma`
- Create: `api/prisma/migrations/<timestamp>_add_user_ai_model_grants/migration.sql`
- Modify: `api/src/services/ai/model-config.js`
- Create: `api/src/services/ai/model-config.test.js`

**Acceptance:** Explicit selections require a granted, enabled model; default and fallback candidates are restricted to the user's enabled grants; admin credential data remains solely in model/provider configuration.

### Task 2: Make AIManager request routing user-scoped

**Objective:** Require a trusted `userId` for user-facing model selection, including default and retry paths.

**Files:**
- Modify: `api/src/services/ai/manager.js`
- Modify: `api/src/services/ai/manager.test.js`

**Acceptance:** No environment/global fallback can bypass grants for a user request; explicit ungranted selections fail without fallback; admin-only provider testing remains trusted and separate.

### Task 3: Pass user identity through all authenticated AI call paths

**Objective:** Ensure every authenticated generation, streaming, and legacy session path supplies `req.user.id` to AIManager.

**Files:**
- Modify AI routes/services discovered by repository search, including `api/src/routes/ai/ai-providers.js`, `ai-content.js`, `extension-agent.js`, `resume.js`, `resume-scoring.js`, `content/content-chat.js`, `goapply/*`, and `services/ai-session/*`.
- Modify/add focused route tests.

**Acceptance:** User model lists are filtered; user generation calls return stable `403` authorization errors for no grant/ungranted selection; public voice generation is disabled until a trusted user mapping exists.

### Task 4: Add admin grant-management API

**Objective:** Allow admins to inspect and atomically replace an individual user's grants.

**Files:**
- Modify: `api/src/routes/admin/admin-users.js`
- Create: `api/src/routes/admin/admin-users.test.js`

**Acceptance:** `GET /api/admin/users/:id` returns safe grant metadata; `PUT /api/admin/users/:id/ai-model-grants` validates and transactionally replaces grants; non-admin access is denied.

### Task 5: Add user-detail grant controls

**Objective:** Let admins select models for a user without exposing credentials.

**Files:**
- Modify: `dashboard/src/views/admin/AdminUserDetailView.vue`

**Acceptance:** The page shows admin-visible model choices grouped by QUICK/LONG, marks unavailable models, persists explicit grant selections, and reloads saved server state.

### Task 6: Verify integration and review

**Objective:** Run API tests/lint and dashboard type/build checks, then perform independent spec and code-quality review.

**Commands:**
- `pnpm --filter './api' test -- --runInBand`
- `pnpm --filter './api' run lint`
- `pnpm --filter './dashboard' run type-check`
- `pnpm --filter './dashboard' run build`

**Acceptance:** All new tests pass, no new lint/type/build failures, no credentials are returned to user-facing APIs, and no untrusted path can select ungranted/global models.
