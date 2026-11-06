#!/usr/bin/env node
// Dev helper: forwards Stripe webhooks to the local API with the Stripe CLI and keeps
// STRIPE_WEBHOOK_SECRET in api/.env in sync. Exits quietly when Stripe isn't set up.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const envFile = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envFile });
const key = process.env.STRIPE_SECRET_KEY;
const port = process.env.PORT || 80;
const skip = message => { console.log(`[stripe] ${message}; skipping webhook forwarding.`); process.exit(0); };

if (!key || !key.startsWith('sk_test_')) skip('no sandbox STRIPE_SECRET_KEY in api/.env');
const bin = [process.env.STRIPE_CLI, path.join(os.homedir(), '.local', 'bin', 'stripe'), 'stripe'].filter(Boolean)
  .find(candidate => spawnSync(candidate, ['version'], { stdio: 'ignore' }).status === 0);
if (!bin) skip('Stripe CLI not found (https://docs.stripe.com/stripe-cli)');

const secret = spawnSync(bin, ['listen', '--api-key', key, '--print-secret'], { encoding: 'utf8' }).stdout.trim().split(/\s+/).pop();
if (!/^whsec_/.test(secret || '')) skip('could not get a webhook signing secret');

if (process.env.STRIPE_WEBHOOK_SECRET !== secret) {
  const current = fs.readFileSync(envFile, 'utf8');
  const eol = current.includes('\r\n') ? '\r\n' : '\n';
  const line = `STRIPE_WEBHOOK_SECRET=${secret}`;
  const next = /^#?\s*STRIPE_WEBHOOK_SECRET=.*$/m.test(current)
    ? current.replace(/^#?\s*STRIPE_WEBHOOK_SECRET=.*$/m, line)
    : current.replace(/\s*$/, eol) + line + eol;
  fs.writeFileSync(envFile, next);
  console.log('[stripe] saved STRIPE_WEBHOOK_SECRET to api/.env; restarting API');
  // nodemon only restarts on source changes, so nudge it to reload the new env.
  const entry = path.join(__dirname, '..', 'src', 'index.js');
  const now = new Date(); fs.utimesSync(entry, now, now);
}

const child = spawn(bin, ['listen', '--api-key', key, '--forward-to', `localhost:${port}/api/billing/webhook`,
  '--events', 'checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted'], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
