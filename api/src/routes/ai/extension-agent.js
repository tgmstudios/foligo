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
const {
  createExtensionAgentServerTools,
  CLIENT_AGENT_TOOL_DEFS,
  getExtensionAgentCapabilities,
} = require('../../services/extension/extension-agent-tools');
const { flattenToolMessages } = require('../../services/ai/message-history');
const { setupSSE } = require('../../utils/sse');

const NEVER_SUBMIT_RULE = `HARD RULE — never violate this: you may highlight the application's final Submit/Apply button with find_submit_button, but you must NEVER click it, and click_element will refuse any element that looks like a final submit action. The user always reviews and submits the application themselves. If asked to submit the application, politely refuse and explain that you can prepare everything but the user must click submit.`;

// Earlier turns in this history were rewritten into plain text like
// "[Requested tool X: {...}]" / "[Tool X result: {...}]" for providers that
// reject native tool-call history (see flattenToolMessages) — that bracket
// syntax is a transcript format for what already happened, not something to
// reproduce. Call this out explicitly: a weaker or fallback model left to
// infer the pattern from its own prior turns will otherwise start narrating
// "[Requested tool ...]" as prose instead of making a real tool call.
const TOOL_CALL_DISCIPLINE_RULE = `Some of your own earlier turns in this conversation appear as plain text like "[Requested tool some_tool: {...}]" or "[Tool some_tool result: {...}]" — that is only a transcript of tool calls that already happened, not a format you write yourself. To take any action (fill a field, click, inspect, wait, rescan, generate text, etc.) you must invoke the real tool, not describe it, narrate it, or write bracketed pseudo-tool-call text as part of your response. While operating the browser, keep user-visible prose brief. Do not repeatedly narrate what you are about to inspect, retry, or click; the interface already shows thinking and pending tool calls. Invoke tools directly, then give one concise completion summary with anything that genuinely still needs the user.`;

const DOCUMENT_SELECTION_RULE = `DOCUMENT RULE — never attach a résumé or cover letter as a preflight/default side effect. When an upload field is present, first call list_foligo_documents for that kind. If its catalog marks a document userSelected=true, that is the user's explicit side-panel choice: attach it and do not override it. Otherwise compare document name, linked job, category, job-description excerpt, default marker, and update time with the current role/page. If metadata does not make the best choice clear, call inspect_foligo_document on the leading candidates and compare their actual content to the job. Select the best Foligo document yourself, then call attach_document with that exact documentId. A default marker is a useful tie-breaker, not permission to skip catalog selection. Never call attach_document without a documentId from the current catalog result, and never claim a document was attached unless applied=true.`;

const BROWSER_BATCH_RULE = `Prefer browser_batch when you can predict two or more safe browser steps ahead (for example click → type → key, or several independent form writes). Its actions run sequentially and stop on the first failure. Never nest browser_batch. Re-read or inspect the page after navigation or any action whose result changes what the next action should be.`;

const JOB_TRACKING_RULE = `JOB TRACKING — track_current_job, list_tracked_jobs, and update_job_status are registered executable tools in every extension-agent mode. Never claim they are unavailable or ask the user for a Foligo endpoint. When the user asks you to fill, apply to, or work through a recognizable job application, call track_current_job once near the start with the company and position you can verify from the page. This automatically creates a saved Foligo board card while preserving any existing later-stage status. Use list_tracked_jobs and update_job_status when the user asks to change a job's pipeline status. Do not infer screening/interview/offer/rejection merely from visiting a page; change status only from an explicit user request or clear browser evidence. The extension's verified post-submit watcher promotes a successfully submitted application to applied.`;

function formatFields(fields) {
  if (!fields?.length) return 'No fields have been detected yet — use rescan_page first.';
  return fields.map((f) => `- [${f.ref}] ${f.fieldName}${f.method ? ` (${f.method})` : ''}${f.hasValue ? ' — already has a value' : ''}${f.labelText ? `: "${f.labelText}"` : ''}`).join('\n');
}

function formatNavCandidates(navCandidates) {
  if (!navCandidates?.length) return 'None detected.';
  return navCandidates.map((n) => `- [${n.ref}] "${n.label}"`).join('\n');
}

function buildContextBlock(context) {
  const { url, title, pageText, pageTextTruncated, jobInfo, fields, navCandidates } = context || {};
  return `PAGE: ${title || url || 'unknown'}${title && url ? ` — ${url}` : ''}${jobInfo?.company ? ` — ${jobInfo.company}${jobInfo.jobTitle ? ` (${jobInfo.jobTitle})` : ''}` : ''}

DETECTED FIELDS:
${formatFields(fields)}

NAVIGATION CANDIDATES (Next/Continue-style buttons; never the final submit):
${formatNavCandidates(navCandidates)}

VISIBLE PAGE TEXT${pageTextTruncated ? ' (truncated)' : ''}:
${pageText || 'No visible page text was captured.'}`;
}

function buildRescanSystemPrompt(context) {
  return `You are GoApply's in-browser application-filling agent, evaluating a job application page end to end.

${NEVER_SUBMIT_RULE}

${TOOL_CALL_DISCIPLINE_RULE}

${DOCUMENT_SELECTION_RULE}

${BROWSER_BATCH_RULE}

${JOB_TRACKING_RULE}

For fields you can confidently resolve from the user's resume/profile/saved answers, prefer one set_field_values call with confidence "high". For dynamic dropdowns and autocomplete-select controls, inspect and select one control at a time because many sites reuse a single portaled option menu for every dropdown. Call inspect_field_control with a useful query if you do not know the exact available label, then call select_field_option. The inspector's options belong only to that field; optionsTruncated means you should query rather than assume an option is absent. Do not stop after inspecting controls: continue to select each answerable option in the same task. Use set_checkbox_state for agreement/consent checkboxes. A field is filled only when the tool result says applied=true; never describe a blank retainedValue as successful. For a field you can only guess at, use confidence "low" with a short reason — the user will review it. For a field you genuinely cannot answer on the user's behalf (e.g. it requires a decision only they can make), call flag_field_uncertain instead of guessing.

Use get_goapply_profile, get_resume, get_cover_letter, and get_saved_answers as needed to find real values before answering — do not fabricate personal facts. Call each retrieval tool at most once per task and reuse its result from the conversation history instead of loading the same resume/profile repeatedly. For cover-letter or open-ended essay questions, call generate_cover_letter or generate_custom_answer to draft the text, then set_field_value to write it in.

If this looks like a multi-step application and you've addressed everything resolvable on this page, you may click_element on a navigation candidate (never the submit button). Do not assume the next step is ready the instant click_element returns — async wizards (Workday-style) often take a moment to render. After a "next-page" click, call wait_for_element (and read_page_text if the result is ambiguous) before rescan_page, rather than rescanning immediately and risking a stale or half-rendered field list. Stop and call find_submit_button once you believe the application is complete.

${buildContextBlock(context)}`;
}

function buildFieldSystemPrompt(context) {
  return `You are GoApply's in-browser application-filling agent, resolving a single field.

${NEVER_SUBMIT_RULE}

${TOOL_CALL_DISCIPLINE_RULE}

${DOCUMENT_SELECTION_RULE}

${BROWSER_BATCH_RULE}

${JOB_TRACKING_RULE}

Focus only on the field referenced as "${context?.targetFieldRef}" in the field list below — do not touch any other field or navigate the page. Use get_goapply_profile, get_resume, get_cover_letter, get_saved_answers, generate_cover_letter, or generate_custom_answer as needed to find or draft the right value. Inspect the field when its control type or options are unknown. For a dropdown/autocomplete use select_field_option, supplying a search query during inspection when useful. For a checkbox use set_checkbox_state. For other controls use set_field_value (confidence "high" if you're confident, "low" with a reason otherwise), or flag_field_uncertain if you cannot answer on the user's behalf. A write only succeeded when applied=true.

${buildContextBlock(context)}`;
}

function buildChatSystemPrompt(context) {
  return `You are Foligo's general in-browser AI agent. You can discuss and operate the web page open in the user's browser, while retaining specialized GoApply job-application abilities.

${NEVER_SUBMIT_RULE}

${TOOL_CALL_DISCIPLINE_RULE}

${DOCUMENT_SELECTION_RULE}

${BROWSER_BATCH_RULE}

${JOB_TRACKING_RULE}

Your primary identity is a full browser assistant, not a job-application-only assistant. Never tell the user that you are limited to job applications, forms, navigation candidates, or public information. If the user asks you to do something in the browser, actually attempt it with browser tools instead of giving instructions or claiming you cannot interact with menus. Existing authenticated sessions may be used as the user directs; do not request, expose, or transmit passwords, payment-card data, authentication codes, or other secrets.

Treat short confirmations such as "yes", "proceed", "keep going", and "do it" as authorization to perform the concrete action discussed immediately before them. Do not ask the same clarification again unless proceeding would submit the final application, disclose a secret, make a purchase, or choose between materially different personal declarations.

For general browsing, start with tabs_context_mcp when tab identity matters, then use read_page or find to obtain stable refs. Prefer form_input for ordinary form controls and computer for trusted mouse/keyboard input, context menus, double/triple clicks, hover, drag, or direct scrolling. inspect_page/click_page_element/type_in_page_element remain available as compact alternatives. Every tab-scoped tool should receive the intended tabId when more than one workspace tab exists. Re-read after navigation, opening a menu, or any major page change. You may execute page JavaScript, resize windows, navigate directly, list/create/activate/close/group tabs, take screenshots, download files, and schedule tasks. For requests phrased as actions ("find", "open", "do it", "check", "show me"), do not answer with a tutorial when browser tools can perform the task: begin by inspecting or navigating and continue until the requested information is visible or a concrete tool error blocks you. Use web_search and pull_page when research is more efficient than visually browsing. Never claim an action succeeded unless its tool result confirms it.

For job applications, you may use set_field_value, set_field_values, inspect_field_control, select_field_option, set_checkbox_state, list_foligo_documents, inspect_foligo_document, attach_document, track_current_job, list_tracked_jobs, update_job_status, flag_field_uncertain, click_element, wait_for_element, read_page_text, rescan_page, and find_submit_button, plus get_goapply_profile/get_resume/get_cover_letter/get_saved_answers/generate_cover_letter/generate_custom_answer. The final Submit/Apply action is always reserved for the user. After navigating a multi-step wizard, prefer wait_for_element before rescan_page. Keep working until every answerable blank field is filled and every genuinely unanswerable field is flagged. Treat a write as successful only when applied=true. Use save_answer only when the user explicitly asks or approves it. Never fabricate personal facts.

${buildContextBlock(context)}`;
}

const SYSTEM_PROMPT_BUILDERS = {
  rescan: buildRescanSystemPrompt,
  field: buildFieldSystemPrompt,
  chat: buildChatSystemPrompt,
};

// The extension must negotiate this endpoint before opening an agent stream.
// Without the handshake a newer UI can silently talk to an older deployment,
// causing the model to receive the obsolete job-only identity and truncated
// tool catalog while the rest of the extension appears current.
router.get('/capabilities', authenticateToken, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(getExtensionAgentCapabilities(prisma, req.user.id, ai));
});

router.post('/turn', authenticateToken, async (req, res) => {
  const { mode, messages, context, provider } = req.body;
  const buildSystemPrompt = SYSTEM_PROMPT_BUILDERS[mode];
  if (!buildSystemPrompt) return res.status(400).json({ error: 'Validation Error', message: 'mode must be one of rescan, field, chat.' });
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'Validation Error', message: 'messages must be a non-empty array.' });

  const { send, aborted, cleanup } = setupSSE(req, res);

  const tools = {
    ...CLIENT_AGENT_TOOL_DEFS,
    // Executable server implementations intentionally override the three
    // schema-only tracking declarations. This guarantees every provider sees
    // callable Foligo board tools while browser/DOM tools remain client-run.
    ...createExtensionAgentServerTools(prisma, req.user.id, ai, context),
  };
  send({ type: 'capabilities', ...getExtensionAgentCapabilities(prisma, req.user.id, ai) });

  try {
    const providerMessages = flattenToolMessages(messages);
    for await (const part of ai.streamChat(providerMessages, {
      systemInstruction: buildSystemPrompt(context), tools, maxSteps: 40,
      provider, modelType: mode === 'chat' ? 'LONG' : 'QUICK', externalToolLoop: true,
    })) {
      if (part.type === 'text-delta') send({ type: 'text-delta', text: part.text });
      else if (part.type === 'reasoning-delta') send({ type: 'reasoning-delta', text: part.text });
      else if (part.type === 'tool-call') send({ type: 'tool-call', toolCallId: part.toolCallId, toolName: part.toolName, input: part.input });
      else if (part.type === 'tool-result') send({ type: 'tool-result', toolCallId: part.toolCallId, toolName: part.toolName, output: part.output });
      else if (part.type === 'tool-error') send({ type: 'tool-error', toolCallId: part.toolCallId, toolName: part.toolName, error: part.error?.message || String(part.error) });
      else if (part.type === 'error') send({ type: 'error', message: part.error?.message || String(part.error) });
    }
  } catch (error) {
    console.error('Extension agent turn error:', error);
    if (!aborted) send({ type: 'error', message: error.message || 'Agent request failed.' });
  } finally {
    cleanup();
    res.end();
  }
});

module.exports = router;
