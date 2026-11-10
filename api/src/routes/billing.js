const express = require('express');
const { body } = require('express-validator');
const { prisma } = require('../services/core/database');
const { handleValidation } = require('../middleware/handle-validation');
const billing = require('../services/billing/stripe');
const { getUsageSummary } = require('../services/ai/usage');

const frontend = () => (process.env.FRONTEND_URL || 'https://app.foligo.org').replace(/\/$/, '');
const fail = (res, error, message) => res.status(error.status || 500).json({ error: error.status === 503 ? error.message : message });

// Authenticated routes (mounted behind authenticateToken).
const router = express.Router();

router.get('/plans', async (req, res) => {
  try {
    const subscription = await prisma.userSubscription.findUnique({ where: { userId: req.user.id } });
    res.json({
      enabled: billing.billingEnabled(),
      plans: billing.getPlans().filter(plan => plan.priceId).map(billing.publicPlan),
      subscription: subscription && {
        planKey: subscription.planKey, status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd, cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      usage: await getUsageSummary(req.user.id),
    });
  } catch { res.status(500).json({ error: 'Unable to load billing' }); }
});

router.post('/checkout', [body('planKey').isString().isLength({ min: 1, max: 64 }), body('attemptId').isUUID(), handleValidation], async (req, res) => {
  try {
    const plan = billing.findPlan(req.body.planKey);
    if (!plan?.priceId) return res.status(400).json({ error: 'Unknown plan' });
    const existing = await prisma.userSubscription.findUnique({ where: { userId: req.user.id } });
    if (existing && ['active', 'trialing', 'past_due'].includes(existing.status)) {
      return res.status(409).json({ error: 'You already have a subscription. Use the billing portal to change plans.' });
    }
    const customer = await billing.getOrCreateCustomer(req.user);
    const session = await billing.stripe().checkout.sessions.create({
      mode: 'subscription', customer, line_items: [{ price: plan.priceId, quantity: 1 }],
      client_reference_id: req.user.id, subscription_data: { metadata: { userId: req.user.id } },
      success_url: `${frontend()}/settings?billing=success`, cancel_url: `${frontend()}/settings?billing=cancelled`,
    }, { idempotencyKey: `checkout:${req.user.id}:${plan.priceId}:${req.body.attemptId}` });
    if (session.status && session.status !== 'open') return res.status(409).json({ error: 'This checkout attempt is no longer open. Start a new checkout.' });
    res.json({ url: session.url });
  } catch (error) { fail(res, error, 'Unable to start checkout'); }
});

router.post('/portal', async (req, res) => {
  try {
    const row = await prisma.userSubscription.findUnique({ where: { userId: req.user.id } });
    if (!row) return res.status(404).json({ error: 'No billing account yet' });
    const session = await billing.stripe().billingPortal.sessions.create({ customer: row.stripeCustomerId, return_url: `${frontend()}/settings` });
    res.json({ url: session.url });
  } catch (error) { fail(res, error, 'Unable to open billing portal'); }
});

// Public webhook; must receive the raw body, so index.js mounts it before express.json().
const webhook = express.Router();
webhook.post('/', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).json({ error: 'Missing signature' });
  try {
    await billing.processWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error) {
    if (error.type === 'StripeSignatureVerificationError') return res.status(400).json({ error: 'Invalid signature' });
    console.error('Stripe webhook failed:', error.message);
    res.status(error.status || 500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
module.exports.webhook = webhook;
