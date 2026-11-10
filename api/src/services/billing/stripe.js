const Stripe = require('stripe');
const { prisma } = require('../core/database');
const { userLock } = require('../ai/usage');

// Plans come from BILLING_PLANS (JSON array):
// [{"key":"pro","name":"Pro","priceId":"price_...","monthlyRequests":2000,"monthlyTokens":5000000,"monthlyCostUsd":20}]
// Null/omitted limits mean no cap. An optional plan with key "free" (no priceId) is applied
// when a subscription ends; without it, ended subscribers return to unlimited server usage.
const ACTIVE = new Set(['active', 'trialing', 'past_due']);

function getPlans() {
  try {
    const plans = JSON.parse(process.env.BILLING_PLANS || '[]');
    return Array.isArray(plans) ? plans.filter(plan => plan && typeof plan.key === 'string') : [];
  } catch { return []; }
}
const findPlan = key => getPlans().find(plan => plan.key === key) || null;
const planByPrice = priceId => getPlans().find(plan => plan.priceId === priceId) || null;
const publicPlan = ({ key, name, monthlyRequests = null, monthlyTokens = null, monthlyCostUsd = null }) => ({ key, name: name || key, monthlyRequests, monthlyTokens, monthlyCostUsd });

let client;
function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error('Stripe is not configured'); error.status = 503; throw error;
  }
  return client || (client = new Stripe(process.env.STRIPE_SECRET_KEY));
}
const billingEnabled = () => !!process.env.STRIPE_SECRET_KEY;

async function applyPolicy(tx, userId, plan) {
  const limits = plan
    ? { unlimited: false, monthlyRequests: plan.monthlyRequests ?? null, monthlyTokens: plan.monthlyTokens ?? null, monthlyCostUsd: plan.monthlyCostUsd ?? null }
    : { unlimited: true, monthlyRequests: null, monthlyTokens: null, monthlyCostUsd: null };
  await userLock(tx, userId);
  await tx.userAiUsagePolicy.upsert({ where: { userId }, create: { userId, ...limits }, update: limits });
}

async function getOrCreateCustomer(user) {
  const existing = await prisma.userSubscription.findUnique({ where: { userId: user.id } });
  if (existing) return existing.stripeCustomerId;
  const customer = await stripe().customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } }, { idempotencyKey: `customer:${user.id}` });
  // Stripe creates the customer before the unique userId row exists. If two
  // requests race, the upsert's readback may contain the winning customer's ID.
  const row = await prisma.userSubscription.upsert({
    where: { userId: user.id }, create: { userId: user.id, stripeCustomerId: customer.id }, update: {},
  });
  return row.stripeCustomerId;
}

// Mirror a Stripe subscription into our tables and the user's AI policy.
async function syncSubscription(subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const row = await prisma.userSubscription.findUnique({ where: { stripeCustomerId: customerId } });
  if (!row) return;
  // Ignore events for a subscription we've since replaced.
  if (row.stripeSubscriptionId && row.stripeSubscriptionId !== subscription.id && ACTIVE.has(subscription.status) === false) return;
  const item = subscription.items?.data?.[0];
  const plan = planByPrice(item?.price?.id);
  const active = ACTIVE.has(subscription.status) && !!plan;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  await prisma.$transaction(async tx => {
    await tx.userSubscription.update({ where: { userId: row.userId }, data: {
      stripeSubscriptionId: subscription.id, planKey: plan?.key ?? null, status: subscription.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
    } });
    await applyPolicy(tx, row.userId, active ? plan : findPlan('free'));
  });
}

async function handleEvent(event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return syncSubscription(event.data.object);
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode !== 'subscription' || !session.subscription) return;
      const id = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
      return syncSubscription(await stripe().subscriptions.retrieve(id));
    }
    default: return;
  }
}

// Idempotent: the event row is written in the same transaction scope as processing
// only after success, so a failed handler is retried by Stripe.
async function processWebhook(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) { const error = new Error('Webhook secret not configured'); error.status = 503; throw error; }
  const event = stripe().webhooks.constructEvent(rawBody, signature, secret);
  if (await prisma.stripeEvent.findUnique({ where: { id: event.id } })) return event;
  await handleEvent(event);
  await prisma.stripeEvent.upsert({ where: { id: event.id }, create: { id: event.id, type: event.type }, update: {} });
  return event;
}

module.exports = { getPlans, findPlan, publicPlan, billingEnabled, stripe, getOrCreateCustomer, syncSubscription, processWebhook };
