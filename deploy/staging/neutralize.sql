-- Staging neutralization applied after every restore. Retains users/content/settings; removes live external credentials.
-- Each statement is idempotent. Delta is documented in docs (STAGING.md).
BEGIN;
UPDATE ai_models SET "apiKey" = NULL, headers = NULL, enabled = false;
UPDATE ai_provider_configs SET "apiKey" = NULL, headers = NULL, "oauthRefreshToken" = NULL, "oauthExpiresAt" = NULL, "oauthAccountId" = NULL, enabled = false;
UPDATE voice_providers SET "apiKey" = NULL, enabled = false;
UPDATE sso_providers SET enabled = false, "clientSecret" = 'neutralized-staging';
UPDATE user_integrations SET "accessToken" = 'neutralized-staging', status = 'revoked', scopes = '{}';
DELETE FROM api_tokens;            -- prod bearer-token hashes must not authenticate against staging
DELETE FROM platform_settings WHERE key = 'searxng_url';
UPDATE platform_settings SET value = 'false' WHERE key = 'allow_public_signups';
COMMIT;
