/**
 * GoApply extension page-filling agent.
 * One streaming endpoint, mode-differentiated (rescan / field / chat),
 * reusing the same ai.streamChat SSE pattern as routes/goapply.js's
 * assistant chat endpoints. Stateless — the client resends the full
 * message history each turn (see agent-controller.js), so there is
 * nothing to persist server-side.
 */
const express = require('express');
const router = express.Router();
const ai = require('../../services/ai/manager');
const { authenticateToken } = require('../../middleware/auth');
const { prisma } = require('../../services/core/database');
const { createExtensionAgentServerTools, CLIENT_AGENT_TOOL_DEFS } = require('../../services/extension/extension-agent-tools');
const { flattenToolMessages } = require('../../services/ai/message-history');
const { setupSSE } = require('../../utils/sse');

const NEVER_SUBMIT_RULE = `HARD RULE — never violate this: you may highlight the application's final Submit/Apply button with find_submit_button, but you must NEVER click it, and click_element will refuse any element that looks like a final submit action. The user always reviews and submits the application themselves. If asked to submit the application, politely refuse and explain that you can prepare everything but the user must click submit.`;

function formatFields(fields) {
  if (!fields?.length) return 'No fields have been detected yet — use rescan_page first.';
  return fields.map((f) => `- [${f.ref}] ${f.fieldName}${f.method ? ` (${f.method})` : ''}${f.hasValue ? ' — already has a value' : ''}${f.labelText ? `: "${f.labelText}"` : ''}`).join('\n');
}

function formatNavCandidates(navCandidates) {
  if (!navCandidates?.length) return 'None detected.';
  return navCandidates.map((n) => `- [${n.ref}] "${n.label}"`).join('\n');
}

function buildContextBlock(context) {
  const { url, title, jobInfo, fields, navCandidates } = context || {};
  return `PAGE: ${title || url || 'unknown'}${title && url ? ` — ${url}` : ''}${jobInfo?.company ? ` — ${jobInfo.company}${jobInfo.jobTitle ? ` (${jobInfo.jobTitle})` : ''}` : ''}

DETECTED FIELDS:
${formatFields(fields)}

NAVIGATION CANDIDATES (Next/Continue-style buttons; never the final submit):
${formatNavCandidates(navCandidates)}`;
}

function buildRescanSystemPrompt(context) {
  return `You are GoApply's in-browser application-filling agent, evaluating a job application page end to end.

${NEVER_SUBMIT_RULE}

For fields you can confidently resolve from the user's resume/profile/saved answers, prefer one set_field_values call with confidence "high". For dynamic dropdowns and autocomplete-select controls, inspect and select one control at a time because many sites reuse a single portaled option menu for every dropdown. Call inspect_field_control with a useful query if you do not know the exact available label, then call select_field_option. The inspector's options belong only to that field; optionsTruncated means you should query rather than assume an option is absent. Do not stop after inspecting controls: continue to select each answerable option in the same task. Use set_checkbox_state for agreement/consent checkboxes. A field is filled only when the tool result says applied=true; never describe a blank retainedValue as successful. For a field you can only guess at, use confidence "low" with a short reason — the user will review it. For a field you genuinely cannot answer on the user's behalf (e.g. it requires a decision only they can make), call flag_field_uncertain instead of guessing.

Use get_goapply_profile, get_resume, get_cover_letter, and get_saved_answers as needed to find real values before answering — do not fabricate personal facts. Call each retrieval tool at most once per task and reuse its result from the conversation history instead of loading the same resume/profile repeatedly. For cover-letter or open-ended essay questions, call generate_cover_letter or generate_custom_answer to draft the text, then set_field_value to write it in.

If this looks like a multi-step application and you've addressed everything resolvable on this page, you may click_element on a navigation candidate (never the submit button) and then rescan_page to continue on the next page. Stop and call find_submit_button once you believe the application is complete.

${buildContextBlock(context)}`;
}

function buildFieldSystemPrompt(context) {
  return `You are GoApply's in-browser application-filling agent, resolving a single field.

${NEVER_SUBMIT_RULE}

Focus only on the field referenced as "${context?.targetFieldRef}" in the field list below — do not touch any other field or navigate the page. Use get_goapply_profile, get_resume, get_cover_letter, get_saved_answers, generate_cover_letter, or generate_custom_answer as needed to find or draft the right value. Inspect the field when its control type or options are unknown. For a dropdown/autocomplete use select_field_option, supplying a search query during inspection when useful. For a checkbox use set_checkbox_state. For other controls use set_field_value (confidence "high" if you're confident, "low" with a reason otherwise), or flag_field_uncertain if you cannot answer on the user's behalf. A write only succeeded when applied=true.

${buildContextBlock(context)}`;
}

function buildChatSystemPrompt(context) {
  return `You are GoApply's in-browser application assistant, chatting with the user about the job application open in their browser.

${NEVER_SUBMIT_RULE}

You can answer questions, and when the user asks you to fill, redo, or navigate the application you may use set_field_value, set_field_values, inspect_field_control, select_field_option, set_checkbox_state, flag_field_uncertain, click_element, rescan_page, and find_submit_button, plus get_goapply_profile/get_resume/get_cover_letter/get_saved_answers/generate_cover_letter/generate_custom_answer to find or draft real content. When asked to fill the page, keep working until every answerable blank field is filled and every genuinely unanswerable field is explicitly flagged; do not stop after scanning, loading profile data, or inspecting controls. Call each profile/resume/answer retrieval tool at most once per task and reuse results already present in the conversation. Inspect and select dynamic dropdowns one at a time because the page may reuse one portaled options menu. Treat a write as successful only when applied=true; for text/select controls retainedValue must also be nonblank. If a tool returns applied=false, use its note/options to retry rather than claiming completion. Use save_answer only when the user explicitly asks or approves saving a reusable answer. Never fabricate personal facts the user hasn't provided.

${buildContextBlock(context)}`;
}

const SYSTEM_PROMPT_BUILDERS = {
  rescan: buildRescanSystemPrompt,
  field: buildFieldSystemPrompt,
  chat: buildChatSystemPrompt,
};

router.post('/turn', authenticateToken, async (req, res) => {
  const { mode, messages, context, provider } = req.body;
  const buildSystemPrompt = SYSTEM_PROMPT_BUILDERS[mode];
  if (!buildSystemPrompt) return res.status(400).json({ error: 'Validation Error', message: 'mode must be one of rescan, field, chat.' });
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'Validation Error', message: 'messages must be a non-empty array.' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Provider-side tools such as cover-letter generation can be quiet for
  // longer than extension workers/proxies tolerate. A real SSE event keeps
  // every hop alive; clients deliberately ignore its payload.
  const heartbeat = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) sendSse(res, { type: 'heartbeat' });
  }, 10000);
  res.on('close', () => clearInterval(heartbeat));

  const tools = {
    ...createExtensionAgentServerTools(prisma, req.user.id, ai),
    ...CLIENT_AGENT_TOOL_DEFS,
  };

  try {
    const providerMessages = flattenToolMessages(messages);
    for await (const part of ai.streamChat(providerMessages, {
      systemInstruction: buildSystemPrompt(context), tools, maxSteps: 40,
      provider, modelType: 'QUICK', externalToolLoop: true,
    })) {
      if (part.type === 'text-delta') sendSse(res, { type: 'text-delta', text: part.text });
      else if (part.type === 'reasoning-delta') sendSse(res, { type: 'reasoning-delta', text: part.text });
      else if (part.type === 'tool-call') sendSse(res, { type: 'tool-call', toolCallId: part.toolCallId, toolName: part.toolName, input: part.input });
      else if (part.type === 'tool-result') sendSse(res, { type: 'tool-result', toolCallId: part.toolCallId, toolName: part.toolName, output: part.output });
      else if (part.type === 'tool-error') sendSse(res, { type: 'tool-error', toolCallId: part.toolCallId, toolName: part.toolName, error: part.error?.message || String(part.error) });
      else if (part.type === 'error') sendSse(res, { type: 'error', message: part.error?.message || String(part.error) });
    }
  } catch (error) {
    sendSse(res, { type: 'error', message: error.message || 'Agent request failed.' });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

module.exports = router;
