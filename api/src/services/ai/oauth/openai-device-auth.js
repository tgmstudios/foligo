/**
 * "Sign in with ChatGPT" — OpenAI's device-code OAuth flow, used by the
 * real Codex CLI (and ported by community tools like opencode's
 * openai-device-auth plugin, and Hermes Agent's `hermes auth add
 * openai-codex`) to authenticate a headless client against a ChatGPT
 * Plus/Pro/Team subscription instead of a plain API key.
 *
 * client_id is the public client id the real Codex CLI itself uses (not a
 * secret — this is a native/public OAuth client using PKCE, the same as any
 * device-code flow). Endpoints and shapes below are taken directly from
 * OpenAI Codex CLI's device_code_auth.rs, as reimplemented in
 * https://github.com/tumf/opencode-openai-device-auth.
 *
 * Flow:
 *   1. requestUserCode()      -> { deviceAuthId, userCode, verificationUrl, interval }
 *      Show the admin `verificationUrl` + `userCode`; they approve in a browser.
 *   2. pollOnce(deviceAuthId, userCode), repeated every `interval` seconds:
 *      - still pending  -> { status: 'pending' }
 *      - approved       -> { status: 'authorized', tokens: { access_token, refresh_token, expires_in } }
 *   3. Once expired, refreshTokens(refreshToken) renews without a new login.
 */

const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const BASE_URL = 'https://auth.openai.com';
const API_BASE_URL = `${BASE_URL}/api/accounts`;
const VERIFICATION_URL = `${BASE_URL}/codex/device`;

/** Start a device-code login. */
async function requestUserCode() {
  const response = await fetch(`${API_BASE_URL}/deviceauth/usercode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const hint = response.status === 404
      ? ' Device-code login must be enabled in ChatGPT security settings (chatgpt.com/settings/security) or by a workspace admin.'
      : '';
    throw new Error(`Failed to start ChatGPT sign-in (${response.status}).${hint}`);
  }
  const data = await response.json();
  const userCode = data.user_code || data.usercode;
  if (!data.device_auth_id || !userCode) throw new Error('Unexpected response starting ChatGPT sign-in.');
  return {
    deviceAuthId: data.device_auth_id,
    userCode,
    verificationUrl: VERIFICATION_URL,
    interval: Number(data.interval) || 5,
  };
}

/**
 * One poll attempt. Callers should re-invoke on `interval` seconds rather
 * than blocking here, so this stays a normal short-lived HTTP request.
 */
async function pollOnce(deviceAuthId, userCode) {
  const response = await fetch(`${API_BASE_URL}/deviceauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ device_auth_id: deviceAuthId, user_code: userCode }),
    signal: AbortSignal.timeout(15000),
  });

  // 403/404 means the admin hasn't approved the code in their browser yet.
  if (response.status === 403 || response.status === 404) return { status: 'pending' };
  if (!response.ok) throw new Error(`ChatGPT sign-in polling failed (${response.status}).`);

  const { authorization_code, code_verifier } = await response.json();
  const tokens = await exchangeCodeForTokens(authorization_code, code_verifier);
  return { status: 'authorized', tokens };
}

async function exchangeCodeForTokens(authorizationCode, codeVerifier) {
  const response = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code: authorizationCode,
      code_verifier: codeVerifier,
      redirect_uri: `${BASE_URL}/deviceauth/callback`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`ChatGPT token exchange failed (${response.status}).`);
  return response.json(); // { access_token, refresh_token, id_token, expires_in }
}

/** Renew an access token using the stored refresh token (standard OAuth refresh_token grant). */
async function refreshTokens(refreshToken) {
  const response = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`ChatGPT token refresh failed (${response.status}).`);
  return response.json(); // { access_token, refresh_token, expires_in, id_token? }
}

/**
 * Pull the ChatGPT account id out of an id_token JWT. Codex's own client
 * (codex-rs/login/src/token_data.rs) parses this from the
 * "https://api.openai.com/auth" claim — needed as the `chatgpt-account-id`
 * header on inference calls made through the ChatGPT backend
 * (chatgpt.com/backend-api/codex), which requires it alongside the bearer
 * token. No signature verification here: the token came straight from
 * auth.openai.com over TLS in the exchange above, so it's already trusted.
 */
function chatgptAccountIdFromIdToken(idToken) {
  if (!idToken) return null;
  try {
    const payload = idToken.split('.')[1];
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims['https://api.openai.com/auth']?.chatgpt_account_id || null;
  } catch {
    return null;
  }
}

module.exports = { requestUserCode, pollOnce, refreshTokens, chatgptAccountIdFromIdToken };
