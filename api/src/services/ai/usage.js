const { prisma } = require('../core/database');

class AiQuotaError extends Error {
  constructor(message, code = 'AI_USAGE_LIMIT_EXCEEDED') {
    super(message); this.code = code;
  }
}

function monthWindow(value = new Date()) {
  const date = new Date(value);
  return {
    start: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)),
    end: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)),
  };
}

const count = value => Number.isFinite(value) && value >= 0 ? Math.ceil(value) : 0;
function normalizeUsage(usage) {
  const inputTokens = count(typeof usage?.inputTokens === 'object' ? usage.inputTokens.total : usage?.inputTokens);
  const outputTokens = count(typeof usage?.outputTokens === 'object' ? usage.outputTokens.total : usage?.outputTokens);
  return {
    inputTokens, outputTokens, totalTokens: inputTokens + outputTokens,
    cacheReadTokens: count(usage?.inputTokens?.cacheRead ?? usage?.inputTokenDetails?.cacheReadTokens),
    cacheWriteTokens: count(usage?.inputTokens?.cacheWrite ?? usage?.inputTokenDetails?.cacheWriteTokens),
    reasoningTokens: count(usage?.outputTokens?.reasoning ?? usage?.outputTokenDetails?.reasoningTokens),
  };
}
function hasUsage(usage) {
  return usage && (Number.isFinite(usage.inputTokens?.total ?? usage.inputTokens) && Number.isFinite(usage.outputTokens?.total ?? usage.outputTokens));
}
function validRates(rates) {
  return rates && ['input', 'output', 'cacheRead', 'cacheWrite'].every(key => typeof rates[key] === 'number' && Number.isFinite(rates[key]) && rates[key] >= 0 && rates[key] <= 1000000);
}
function calculateCost(usage, rates) {
  if (!validRates(rates)) return null;
  const nonCached = Math.max(0, usage.inputTokens - usage.cacheReadTokens - usage.cacheWriteTokens);
  return Number(((nonCached * rates.input + usage.cacheReadTokens * rates.cacheRead + usage.cacheWriteTokens * rates.cacheWrite + usage.outputTokens * rates.output) / 1000000).toFixed(6));
}

async function userLock(tx, userId) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`ai-usage:${userId}`}))`;
}

async function getUsageSummary(userId, date = new Date(), db = prisma) {
  const { start, end } = monthWindow(date);
  const [policy, groups] = await Promise.all([
    db.userAiUsagePolicy.findUnique({ where: { userId } }),
    db.aiUsageEvent.groupBy({
      by: ['source', 'status'], where: { userId, createdAt: { gte: start, lt: end } },
      _count: { _all: true, costUsd: true },
      _sum: { inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheWriteTokens: true, reasoningTokens: true, totalTokens: true, costUsd: true },
    }),
  ]);
  return {
    periodStart: start, periodEnd: end,
    policy: policy || { unlimited: true, monthlyRequests: null, monthlyTokens: null, monthlyCostUsd: null },
    groups: groups.map(group => ({ source: group.source, status: group.status, requests: group._count._all, unpricedRequests: group._count._all - (group._count.costUsd || 0), ...group._sum })),
  };
}

async function reserveUsage(meta, params) {
  // Bytes are a conservative text reservation, not a provider token count.
  const inputEstimate = Buffer.byteLength(JSON.stringify({ prompt: params.prompt, tools: params.tools }), 'utf8') + 256;
  const outputEstimate = count(params.maxOutputTokens) || 8192;
  const reservedTokens = inputEstimate + outputEstimate;
  const rates = validRates(meta.rates) ? meta.rates : null;
  // Reserve at the highest input/cache rate until actual cache usage is known.
  const reservedCost = rates ? Number(((inputEstimate * Math.max(rates.input, rates.cacheRead, rates.cacheWrite) + outputEstimate * rates.output) / 1000000).toFixed(6)) : null;
  return prisma.$transaction(async tx => {
    await userLock(tx, meta.userId);
    const summary = await getUsageSummary(meta.userId, new Date(), tx);
    if (meta.source === 'SERVER' && !summary.policy.unlimited) {
      const server = summary.groups.filter(group => group.source === 'SERVER');
      const requests = server.reduce((n, group) => n + group.requests, 0);
      const tokens = server.reduce((n, group) => n + (group.totalTokens || 0), 0);
      const cost = server.reduce((n, group) => n + Number(group.costUsd || 0), 0);
      const policy = summary.policy;
      if (policy.monthlyRequests !== null && requests + 1 > policy.monthlyRequests) throw new AiQuotaError('Your monthly server AI request limit has been reached. Use a personal connection or contact an administrator.');
      if (policy.monthlyTokens !== null && tokens + reservedTokens > policy.monthlyTokens) throw new AiQuotaError('Insufficient monthly server token allowance for this request. Use a personal connection or request a higher limit.');
      if (policy.monthlyCostUsd !== null) {
        if (reservedCost === null) throw new AiQuotaError('An administrator must configure model billing rates before this model can use a spending allowance.', 'AI_BILLING_RATES_REQUIRED');
        // Unpriced earlier calls cannot silently count as free under a spend cap.
        const unpriced = await tx.aiUsageEvent.count({ where: { userId: meta.userId, source: 'SERVER', createdAt: { gte: summary.periodStart, lt: summary.periodEnd }, costUsd: null } });
        if (unpriced) throw new AiQuotaError('Unpriced server usage requires administrator review before applying a spending allowance.', 'AI_BILLING_RATES_REQUIRED');
        if (cost + reservedCost > Number(policy.monthlyCostUsd)) throw new AiQuotaError('Your monthly server AI spending allowance is insufficient for this request.');
      }
    }
    return tx.aiUsageEvent.create({ data: {
      userId: meta.userId, source: meta.source, selection: meta.selection,
      providerType: meta.providerType, model: meta.model,
      totalTokens: reservedTokens, costUsd: meta.source === 'SERVER' ? reservedCost : null,
      ...(rates ? { rates } : {}),
    } });
  });
}

async function settleUsage(event, usage, status) {
  const known = hasUsage(usage);
  const totals = known ? normalizeUsage(usage) : {};
  await prisma.aiUsageEvent.updateMany({
    where: { id: event.id, status: 'RESERVED' },
    data: {
      status: known ? status : 'UNKNOWN', completedAt: new Date(), ...totals,
      ...(known ? { costUsd: event.source === 'SERVER' ? calculateCost(totals, event.rates) : null } : {}),
    },
  });
}

async function settleSuccessfulUsage(event, usage, status) {
  try {
    await settleUsage(event, usage, status);
  } catch (cause) {
    const error = new Error('AI inference succeeded but usage could not be recorded');
    error.code = 'AI_USAGE_SETTLEMENT_FAILED';
    error.cause = cause;
    throw error;
  }
}

// Wrap the provider boundary so each SDK retry and each tool step is metered.
// No prompts, generated content, or credentials are retained in the ledger.
function meteredModel(model, meta) {
  if (!meta.userId) return model;
  return new Proxy(model, {
    get(target, property) {
      if (!['doGenerate', 'doStream'].includes(property)) return Reflect.get(target, property, target);
      return async params => {
        const event = await reserveUsage(meta, params);
        let result;
        try { result = await target[property](params); }
        catch (error) {
          await settleUsage(event, error.usage, 'FAILED');
          throw error;
        }
        if (property === 'doGenerate') {
          await settleSuccessfulUsage(event, result.usage, 'COMPLETED');
          return result;
        }
        const reader = result.stream.getReader();
        let settled = false;
        const settle = async (usage, status) => {
          if (settled) return;
          await settleUsage(event, usage, status);
          settled = true;
        };
        return { ...result, stream: new ReadableStream({
          async pull(controller) {
            try {
              const { value, done } = await reader.read();
              if (done) { await settle(null, 'UNKNOWN'); controller.close(); return; }
              if (value.type === 'finish') await settle(value.usage, value.finishReason?.unified === 'error' || value.finishReason === 'error' ? 'FAILED' : 'COMPLETED');
              controller.enqueue(value);
            } catch (error) {
              try { await settle(error.usage, 'FAILED'); } catch (settleError) { controller.error(settleError); return; }
              controller.error(error);
            }
          },
          async cancel(reason) {
            try { await reader.cancel(reason); } finally { await settle(null, 'UNKNOWN'); }
          },
        }) };
      };
    },
  });
}

module.exports = { AiQuotaError, monthWindow, normalizeUsage, validRates, calculateCost, getUsageSummary, reserveUsage, settleUsage, meteredModel, userLock };
