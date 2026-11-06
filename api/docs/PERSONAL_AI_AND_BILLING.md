# Personal AI connections and server billing

## Activate

1. Set a stable `ENCRYPTION_KEY` on every API worker. Existing encryption keys must be retained across restarts and deployments. Personal credential writes return 503 if it is missing.
2. Apply migrations with `pnpm --filter foligo-api run db:migrate:deploy` and regenerate Prisma with `pnpm --filter foligo-api run db:generate` during deployment.
3. In **User Settings → Your AI connections**, save a personal provider key and model ID. Supported providers are OpenAI, Anthropic, Gemini, OpenCode, and Codex (OpenAI Responses API).
4. In **Admin → AI Providers → Model billing rates**, enter USD per million input, output, cache-read, and cache-write tokens. Output rates include reasoning. All four values are required to price a model; zero represents a free category. Rates are configuration, not live provider price discovery.
5. In **Admin → Users → [user] → Server AI billing and limits**, set monthly requests, tokens, and/or estimated spend, or enable **Unlimited server AI usage**. Empty caps are unlimited; zero blocks calls. Existing users default to unlimited usage of their granted models. Model grants remain required for all server-funded models.

## Credential selection

Selections prefixed with `personal:` belong exclusively to the authenticated user. Personal connections do not require server model grants. Each user can save one connection/model per provider and enable or disable it. QUICK/LONG controls ordering, rather than restricting the connection to one task type.

With no explicit selection, enabled personal connections are preferred, ordered by task preference. Fallback stays within personal connections if any are enabled. It never switches from a failed personal call to server credentials. An explicit server model selection uses server credentials and allowance; an explicit personal selection uses only that connection. To return to automatic server selection, disable all personal connections.

Personal connections reset endpoints and headers to official provider defaults and never merge administrator credentials or environment connection overrides. Custom URLs/headers are intentionally absent from this initial personal-connection interface. Saved key fields are write-only; settings responses contain connection metadata only. Deleting a connection or saving its settings also cancels any pending subscription login. Personal credentials are resolved afresh for every operation; they do not enter the shared provider cache.

## Subscription linking availability

The existing Codex device-code implementation can be enabled for supported local/open-source deployments with `AI_PERSONAL_CODEX_DEVICE_AUTH=true`. It is off by default. Pending login state is encrypted in PostgreSQL and bound to the authenticated user; polls are throttled and serialized across workers. Rotating refresh tokens are refreshed under a database lock, and refresh failures require reconnecting instead of switching credentials. Disconnect removes local tokens; users can also revoke the connection from ChatGPT settings.

Do not enable this legacy device-code flow on a hosted/commercial deployment. OpenAI's current documentation says hosted services need an approved Sign in with ChatGPT integration; this implementation does not provision that partnership or claim that identity-only OAuth grants subscription inference. The newer open-source direct flow is a separate integration and is not implemented here.

- [OpenAI app-server authentication deployment restrictions](https://learn.chatgpt.com/docs/app-server#auth-endpoints)
- [Sign in with ChatGPT client availability](https://developers.openai.com/siwc/request-client-id)
- [ChatGPT usage and revocation controls](https://chatgpt.com/settings/usage)

Claude subscription login is unavailable in this app: Anthropic prohibits third-party apps collecting or routing requests using Claude subscription credentials. Use an Anthropic API key with separate provider billing.

- [Anthropic authentication and credential use](https://code.claude.com/docs/en/legal-and-compliance#authentication-and-credential-use)

## Metering and limits

The model boundary records one ledger event per provider attempt, including SDK retries and individual tool-loop steps. User-initiated generation and streaming through AIManager are metered; internal/admin calls without a user identity and non-language-model services (such as ElevenLabs voice) are outside this ledger. Personal calls are recorded with source PERSONAL and no server cost. No prompts, completions, keys, or raw provider payloads are stored in the ledger.

Server admission is serialized per user using PostgreSQL advisory transaction locks. Before dispatch, the ledger reserves a request, estimated prompt tokens (serialized UTF-8 bytes plus overhead), and requested output tokens (8192 if unspecified). Cost reservations use the largest configured input/cache rate until actual cache use is known. Concurrent requests include outstanding reservations in quota checks. Periods are UTC calendar months; attempts belong to the month they started, even if they finish after rollover.

These are admission limits, not guaranteed exact upstream spend ceilings. Providers tokenize differently, multimodal input is not reliably estimable from text, and provider-managed tools can consume extra tokens or fees. Actual reported usage can exceed a reservation; subsequent calls are blocked once the allowance is exhausted. Set corresponding provider-side budgets when a strict financial ceiling is needed.

Terminal provider usage replaces reservations with input/output/cache/reasoning counts, without double-counting cache or reasoning tokens. Costs use a rate snapshot saved with each event. A model without rates remains unpriced, not free. Spending-limited users cannot call unpriced models or continue a month with unpriced prior server events. Unlimited users and request/token-only policies can use unpriced models.

Failures, interruptions, missing usage, and cancellations retain estimated reservations with status UNKNOWN; in-flight events are RESERVED. They never automatically expire or release allowance, including after a worker crash. These statuses need operator review against upstream records before invoicing. Pricing is an estimate and does not include provider-specific non-token fees, tiers, or taxes. This feature records and exports billing data; it does not charge cards or issue invoices.

Admin usage views include historical month selection, event pagination, and full-month JSON export with rate snapshots. Personal user settings show the current server allowance and usage. REST routes are under `/api/ai/personal` and administrator-only `/api/admin/ai-billing`.
