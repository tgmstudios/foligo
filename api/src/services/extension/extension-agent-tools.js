/**
 * Tools for the GoApply extension's page-filling agent
 * (routes/extension-agent.js). Two halves:
 *
 *   - createExtensionAgentServerTools: DB-backed tools that execute here on
 *     the server, reusing the job-assistant tool catalog plus the extracted
 *     cover-letter/custom-answer generators so no prompt logic is duplicated.
 *   - CLIENT_AGENT_TOOL_DEFS: DOM tools with no `execute`. The `ai` SDK
 *     therefore cannot run them itself — it emits their tool-call and ends
 *     that step, and the extension's content script (agent-controller.js)
 *     executes them against the live page and resumes the conversation with
 *     the result. That round trip is what lets the agent read/react to a
 *     page it doesn't have direct access to.
 */
const { tool } = require('ai');
const { z } = require('zod');
const { createJobAssistantTools, jobAssistantTool } = require('../goapply/job-assistant-tools');
const { generateCoverLetter, generateCustomAnswer } = require('../goapply/goapply-content-generation');
const JOB_STATUS_SCHEMA = z.enum(['saved', 'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn', 'archived']);
const EXTENSION_AGENT_PROTOCOL_VERSION = 2;
const EXTENSION_AGENT_IDENTITY = 'foligo-browser-agent';
const GENERIC_ATS_PATH_PARTS = new Set([
  '', 'apply', 'application', 'applications', 'job', 'jobs', 'career',
  'careers', 'position', 'positions', 'opening', 'openings', 'search',
  'jobsearch', 'details', 'home',
]);

function normalizeIdentityText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function meaningfulExternalId(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return Boolean(
    normalized
    && !GENERIC_ATS_PATH_PARTS.has(normalized)
    && normalized.length >= 3
    && /[0-9]/.test(normalized),
  );
}

function normalizeTrackedUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:utm_.+|source|src|ref|referrer|tracking|trk|gh_src|lever-source|iis|iisn)$/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    url.searchParams.sort();
    return url.toString().replace(/\/$/, '');
  } catch (error) {
    return String(value || '').replace(/#.*$/, '').replace(/\/$/, '');
  }
}

function deriveTrackedIdentity(value, explicitExternalJobId = '') {
  const canonicalUrl = normalizeTrackedUrl(value);
  try {
    const url = new URL(canonicalUrl);
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    let platform = '';
    let scope = host;
    let externalJobId = meaningfulExternalId(explicitExternalJobId) ? String(explicitExternalJobId).trim() : '';
    if (host.includes('greenhouse.io')) {
      platform = 'greenhouse';
      externalJobId ||= url.pathname.match(/\/jobs\/(\d+)/i)?.[1] || url.searchParams.get('job_id') || '';
      scope = parts[0] || host;
    } else if (host.includes('linkedin.com')) {
      platform = 'linkedin';
      externalJobId ||= url.pathname.match(/\/jobs\/view\/(\d+)/i)?.[1] || '';
    } else if (host.includes('indeed.com')) {
      platform = 'indeed';
      externalJobId ||= url.searchParams.get('jk') || url.searchParams.get('vjk') || '';
    } else if (host.includes('lever.co') || host.includes('ashbyhq.com') || host.includes('smartrecruiters.com')) {
      platform = host.includes('lever.co') ? 'lever' : host.includes('ashbyhq.com') ? 'ashby' : 'smartrecruiters';
      scope = parts[0] || host;
      externalJobId ||= [...parts].reverse().find((part) => meaningfulExternalId(part)) || '';
    } else if (host.includes('myworkdayjobs.com') || host.includes('workday.com')) {
      platform = 'workday';
      externalJobId ||= [...parts].reverse().find((part) => meaningfulExternalId(part)) || '';
    }
    if (!meaningfulExternalId(externalJobId)) externalJobId = '';
    const lastPathPart = String(parts.at(-1) || '').toLowerCase();
    const weakSharedUrl = GENERIC_ATS_PATH_PARTS.has(lastPathPart)
      || (parts.length === 0 && !url.search);
    const strength = platform && externalJobId ? 'strong' : weakSharedUrl ? 'weak' : 'exact';
    const identityKey = strength === 'strong'
      ? `${platform}:${scope.toLowerCase()}:${externalJobId.toLowerCase()}`
      : `url:${canonicalUrl}`;
    return { canonicalUrl, identityKey, strength };
  } catch (error) {
    return { canonicalUrl, identityKey: `url:${canonicalUrl}`, strength: 'weak' };
  }
}

function createExtensionAgentServerTools(prisma, userId, aiManager, context = {}) {
  const { web_search, pull_page, get_resume, get_cover_letter, get_goapply_profile, get_saved_answers, save_answers } = createJobAssistantTools(prisma, userId);
  const contextUrl = context?.jobInfo?.canonicalUrl || context?.url;
  const contextJob = context?.jobInfo || {};

  async function findTrackedJobByUrl(url = contextUrl, metadata = contextJob) {
    const target = deriveTrackedIdentity(url, metadata.externalJobId);
    if (!target.canonicalUrl) return null;
    const company = normalizeIdentityText(metadata.company);
    const position = normalizeIdentityText(metadata.position || metadata.jobTitle);
    const jobs = await prisma.jobApplication.findMany({ where: { userId } });
    return jobs.find((job) => {
      const candidate = deriveTrackedIdentity(job.url);
      const strongIdentityMatches = target.strength === 'strong'
        && candidate.strength === 'strong'
        && candidate.identityKey === target.identityKey;
      if (strongIdentityMatches) return true;
      if (candidate.canonicalUrl !== target.canonicalUrl) return false;
      if (target.strength !== 'weak') return true;
      return Boolean(
        company
        && position
        && normalizeIdentityText(job.company) === company
        && normalizeIdentityText(job.position) === position
      );
    }) || null;
  }

  return {
    web_search,
    pull_page,
    get_resume,
    get_cover_letter,
    get_goapply_profile,
    get_saved_answers,
    save_answer: jobAssistantTool({
      description: 'Save one reusable application question and answer only after the user explicitly asks or approves saving it.',
      inputSchema: z.object({
        answerId: z.string().optional(),
        question: z.string().min(1),
        answer: z.string().min(1),
        category: z.string().nullable().optional(),
        jobId: z.string().optional(),
      }),
      execute: async ({ answerId, question, answer, category, jobId }) => save_answers.execute({
        answers: [{ answerId, question, answer, category, ...(jobId ? { jobIds: [jobId] } : {}) }],
      }, {}),
    }),
    generate_cover_letter: jobAssistantTool({
      description: 'Draft a tailored cover letter for the job on the current page. Use this to produce text for a cover-letter field or textarea, then write it with set_field_value.',
      inputSchema: z.object({
        jobDescription: z.string().min(1),
        company: z.string().min(1),
        role: z.string().min(1),
      }),
      execute: async ({ jobDescription, company, role }) => {
        const result = await generateCoverLetter(aiManager, { jobDescription, company, role });
        return { objectType: 'coverLetterDraft', text: result.text };
      },
    }),
    generate_custom_answer: jobAssistantTool({
      description: 'Draft an answer to an open-ended application question (an essay question, "why do you want to work here", etc). Use this to produce text for a free-text field, then write it with set_field_value.',
      inputSchema: z.object({
        question: z.string().min(1),
        jobDescription: z.string().optional(),
      }),
      execute: async ({ question, jobDescription }) => {
        const result = await generateCustomAnswer(aiManager, { question, jobDescription });
        return { objectType: 'customAnswerDraft', text: result.text };
      },
    }),
    track_current_job: jobAssistantTool({
      description: 'Add the job on the current browser page to the user’s Foligo board. This tool is available in every extension agent mode. Existing cards keep their current pipeline status; use update_job_status for an explicit status change.',
      inputSchema: z.object({
        company: z.string().min(1).max(200).optional(),
        position: z.string().min(1).max(240).optional(),
        url: z.string().url().optional(),
        status: JOB_STATUS_SCHEMA.optional().default('saved'),
        category: z.string().max(120).optional(),
        tags: z.array(z.string().min(1).max(80)).max(25).optional(),
        notes: z.string().max(5000).optional(),
      }),
      execute: async (input) => {
        const company = String(input.company || contextJob.company || '').trim();
        const position = String(input.position || contextJob.jobTitle || contextJob.position || '').trim();
        // The page extractor's declared canonical/requisition URL is more
        // specific than an AI-supplied visible /apply URL.
        const url = normalizeTrackedUrl(contextJob.canonicalUrl || input.url || contextUrl);
        if (!company || !position || !url) {
          return { tracked: false, note: 'Company, position, and current page URL are required.' };
        }
        const existing = await findTrackedJobByUrl(url, { company, position, externalJobId: contextJob.externalJobId });
        if (existing) {
          const metadata = {};
          if (input.company) metadata.company = company;
          if (input.position) metadata.position = position;
          if (input.category !== undefined) metadata.category = input.category;
          if (input.tags !== undefined) metadata.tags = input.tags;
          if (input.notes !== undefined) metadata.notes = input.notes;
          const job = Object.keys(metadata).length
            ? await prisma.jobApplication.update({ where: { id: existing.id }, data: metadata })
            : existing;
          return {
            tracked: true,
            created: false,
            changed: Object.keys(metadata).length > 0,
            job,
            note: 'This URL was already tracked; its existing pipeline status was preserved.',
          };
        }
        const job = await prisma.jobApplication.create({
          data: {
            userId,
            company,
            position,
            url,
            status: input.status,
            category: input.category || null,
            tags: input.tags || [],
            notes: input.notes || null,
            appliedAt: input.status === 'applied' ? new Date() : null,
          },
        });
        return { tracked: true, created: true, changed: false, job };
      },
    }),
    list_tracked_jobs: jobAssistantTool({
      description: 'List or search the user’s Foligo board jobs. This tool is available in every extension agent mode.',
      inputSchema: z.object({
        query: z.string().max(300).optional(),
        status: JOB_STATUS_SCHEMA.optional(),
      }),
      execute: async ({ query, status }) => {
        const jobs = await prisma.jobApplication.findMany({
          where: { userId, ...(status ? { status } : {}) },
          orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        });
        const needle = String(query || '').trim().toLowerCase();
        const matches = jobs.filter((job) => !needle || [
          job.company,
          job.position,
          job.url,
          job.category,
          ...(Array.isArray(job.tags) ? job.tags : []),
        ].filter(Boolean).join(' ').toLowerCase().includes(needle));
        return { jobs: matches.slice(0, 50), total: matches.length, truncated: matches.length > 50 };
      },
    }),
    update_job_status: jobAssistantTool({
      description: 'Move a Foligo board job to the exact requested pipeline status. Use when the user explicitly requests the change or the browser shows clear evidence.',
      inputSchema: z.object({
        jobId: z.string().optional(),
        status: JOB_STATUS_SCHEMA,
        notes: z.string().max(5000).optional(),
      }),
      execute: async ({ jobId, status, notes }) => {
        const job = jobId
          ? await prisma.jobApplication.findFirst({ where: { id: jobId, userId } })
          : await findTrackedJobByUrl();
        if (!job) return { updated: false, note: 'The requested Foligo job was not found.' };
        const updated = await prisma.jobApplication.update({
          where: { id: job.id },
          data: {
            status,
            ...(notes !== undefined ? { notes } : {}),
            ...(status === 'applied' && !job.appliedAt ? { appliedAt: new Date() } : {}),
          },
        });
        return { updated: true, job: updated, previousStatus: job.status, status: updated.status };
      },
    }),
  };
}

// Schema-only tool defs (no `execute`) for the client-side/DOM tools. Kept
// here (not inline in the route) so the client-side agent-controller.js's
// tool list and this schema can be reviewed/changed together.
const CLIENT_AGENT_TOOL_DEFS = {
  set_field_value: tool({
    description: 'Write a value into a detected form field on the page, identified by its fieldRef (from the field list in context, or from a rescan_page result). Mark confidence "low" for a best-effort guess so the extension flags it for the user to review.',
    inputSchema: z.object({
      fieldRef: z.string(),
      value: z.string(),
      confidence: z.enum(['high', 'low']),
      reason: z.string().optional().describe('Why this value was chosen, or why confidence is low. Shown to the user.'),
    }),
  }),
  set_field_values: tool({
    description: 'Fill several detected fields in one deterministic browser operation. Prefer this over many individual set_field_value calls when the values are already known.',
    inputSchema: z.object({
      fields: z.array(z.object({
        fieldRef: z.string(),
        value: z.string(),
        confidence: z.enum(['high', 'low']),
        reason: z.string().optional(),
      })).min(1).max(20),
    }),
  }),
  inspect_field_control: tool({
    description: 'Inspect a detected field, including its current retained value, control type, and currently available dropdown options. Use this before guessing dynamic-select option labels.',
    inputSchema: z.object({
      fieldRef: z.string(),
      open: z.boolean().optional().default(true),
      query: z.string().optional().describe('Optional search text for an async dropdown such as school or degree.'),
    }),
  }),
  select_field_option: tool({
    description: 'Select and verify an option in a native or dynamic dropdown. The result is successful only when the page retains the selected label.',
    inputSchema: z.object({
      fieldRef: z.string(),
      value: z.string(),
      confidence: z.enum(['high', 'low']).optional().default('high'),
      reason: z.string().optional(),
    }),
  }),
  set_checkbox_state: tool({
    description: 'Check or uncheck a detected checkbox and verify its actual checked state. Use this for consent/agreement controls instead of writing text.',
    inputSchema: z.object({
      fieldRef: z.string(),
      checked: z.boolean(),
      confidence: z.enum(['high', 'low']).optional().default('high'),
      reason: z.string().optional(),
    }),
  }),
  flag_field_uncertain: tool({
    description: 'Flag a field for the user to review manually without writing a value into it (e.g. a question you cannot answer on the user\'s behalf).',
    inputSchema: z.object({
      fieldRef: z.string(),
      reason: z.string(),
    }),
  }),
  list_foligo_documents: tool({
    description: 'List the user’s Foligo documents that can be attached. For a resume or cover-letter upload, call this first, compare each document’s name/job metadata with the current role, and deliberately choose one documentId.',
    inputSchema: z.object({
      kind: z.enum(['resume', 'coverLetter']),
    }),
  }),
  inspect_foligo_document: tool({
    description: 'Load the content of one Foligo résumé or cover letter from the catalog. Use this on leading candidates when names and linked-job metadata are not sufficient to choose the best document for the current role.',
    inputSchema: z.object({
      kind: z.enum(['resume', 'coverLetter']),
      documentId: z.string().min(1),
    }),
  }),
  attach_document: tool({
    description: 'Attach one specifically selected Foligo resume or cover letter PDF to a detected upload field. You MUST call list_foligo_documents first and pass the chosen documentId; there is no implicit/default attachment.',
    inputSchema: z.object({
      fieldRef: z.string(),
      kind: z.enum(['resume', 'coverLetter']),
      documentId: z.string().min(1).describe('Exact documentId chosen from the latest list_foligo_documents result.'),
    }),
  }),
  track_current_job: tool({
    description: 'Add the recognizable job on the current page to the user’s Foligo board. Safe to call automatically during application work: an existing job is returned without demoting or changing its pipeline status.',
    inputSchema: z.object({
      company: z.string().min(1).max(200).optional().describe('AI-extracted company when page metadata is incomplete.'),
      position: z.string().min(1).max(240).optional().describe('AI-extracted role title when page metadata is incomplete.'),
      url: z.string().url().optional(),
      status: JOB_STATUS_SCHEMA.optional().default('saved'),
      category: z.string().max(120).optional(),
      tags: z.array(z.string().min(1).max(80)).max(25).optional(),
      notes: z.string().max(5000).optional(),
    }),
  }),
  list_tracked_jobs: tool({
    description: 'List or search the user’s Foligo tracked jobs so a later status update can target the correct jobId.',
    inputSchema: z.object({
      query: z.string().max(300).optional(),
      status: JOB_STATUS_SCHEMA.optional(),
    }),
  }),
  update_job_status: tool({
    description: 'Move a tracked Foligo job to a new pipeline status. Use only when the user explicitly asks or the browser shows clear status evidence; never infer a status change merely because a page was opened.',
    inputSchema: z.object({
      jobId: z.string().optional().describe('From list_tracked_jobs. Omit to target the tracked job matching the current page URL.'),
      status: JOB_STATUS_SCHEMA,
      notes: z.string().max(5000).optional(),
    }),
  }),
  click_element: tool({
    description: 'Click a navigation element (e.g. "Next" or "Continue" on a multi-step application) identified by its elementRef from the navCandidates list. Refused if the element is not a known navigation candidate — this can NEVER be used to click a final Submit/Apply button.',
    inputSchema: z.object({
      elementRef: z.string(),
      expectation: z.enum(['next-page', 'same-page']),
    }),
  }),
  find_submit_button: tool({
    description: 'Locate and highlight the final Submit/Apply button on the page for the user\'s attention. This only highlights the button — it never clicks it. The user always submits the application themselves.',
    inputSchema: z.object({}),
  }),
  rescan_page: tool({
    description: 'Re-detect form fields and navigation candidates on the current page (e.g. after clicking Next/Continue, or after filling several fields). Returns a fresh field/nav list to continue working from.',
    inputSchema: z.object({}),
  }),
  wait_for_element: tool({
    description: 'Wait (up to a bounded timeout) for a multi-step wizard\'s next page to actually be ready after click_element navigated with expectation "next-page" — async transitions do not always finish by the time click_element returns. Prefer this, then rescan_page, over assuming the next step is immediately present.',
    inputSchema: z.object({
      elementRef: z.string().optional().describe('A navCandidates ref expected to appear on the new step, if known.'),
      timeoutMs: z.number().int().min(200).max(8000).optional().default(4000),
    }),
  }),
  read_page_text: tool({
    description: 'Read a bounded plain-text snapshot of the page\'s currently visible content, to confirm which wizard step you landed on or to find context not present in the field/nav list (e.g. instructions, an error banner).',
    inputSchema: z.object({
      maxChars: z.number().int().min(200).max(4000).optional().default(2000),
    }),
  }),
  inspect_page: tool({
    description: 'Inspect the current page as a browser agent. Returns visible interactive elements with stable refs plus a bounded text snapshot. Use this before clicking or typing on a general web page.',
    inputSchema: z.object({
      maxElements: z.number().int().min(10).max(200).optional().default(80),
      maxTextChars: z.number().int().min(200).max(12000).optional().default(6000),
      tabId: z.number().int().optional(),
    }),
  }),
  read_page: tool({
    description: 'Read the current page as a structured accessibility-style list with stable element refs. Use filter "interactive" for controls only, or "all" to include visible text containers.',
    inputSchema: z.object({
      filter: z.enum(['interactive', 'all']).optional().default('all'),
      depth: z.number().int().min(1).max(30).optional().default(15),
      ref_id: z.string().optional(),
      max_chars: z.number().int().min(200).max(50000).optional().default(50000),
      tabId: z.number().int().optional(),
    }),
  }),
  find: tool({
    description: 'Find visible page elements by purpose or text and return matching refs for computer/form_input.',
    inputSchema: z.object({
      query: z.string().min(1),
      tabId: z.number().int().optional(),
    }),
  }),
  form_input: tool({
    description: 'Set a text, checkbox, radio, or select value using an element ref returned by read_page, find, or inspect_page.',
    inputSchema: z.object({
      ref: z.string(),
      value: z.union([z.string(), z.boolean(), z.number()]),
      tabId: z.number().int().optional(),
    }),
  }),
  get_page_text: tool({
    description: 'Extract a bounded raw text snapshot from the current page.',
    inputSchema: z.object({
      max_chars: z.number().int().min(200).max(50000).optional().default(50000),
      tabId: z.number().int().optional(),
    }),
  }),
  javascript_tool: tool({
    description: 'Execute JavaScript in the page main world with top-level await support. Use action javascript_exec.',
    inputSchema: z.object({
      action: z.literal('javascript_exec'),
      text: z.string().min(1).max(50000),
      tabId: z.number().int().optional(),
    }),
  }),
  read_console_messages: tool({
    description: 'Read captured console logs, warnings, errors, and exceptions from a workspace tab. Provide a pattern whenever possible.',
    inputSchema: z.object({
      tabId: z.number().int().optional(),
      pattern: z.string().max(500).optional(),
      level: z.enum(['log', 'debug', 'info', 'warning', 'error']).optional(),
      limit: z.number().int().min(1).max(500).optional().default(100),
      clear: z.boolean().optional().default(false),
    }),
  }),
  read_network_requests: tool({
    description: 'Read captured HTTP network requests from a workspace tab, including method, URL, status, MIME type, and failures.',
    inputSchema: z.object({
      tabId: z.number().int().optional(),
      pattern: z.string().max(500).optional(),
      limit: z.number().int().min(1).max(500).optional().default(100),
      clear: z.boolean().optional().default(false),
    }),
  }),
  upload_image: tool({
    description: 'Upload a previously captured screenshot to a file input or drag-and-drop target. Provide either a page ref or viewport coordinate.',
    inputSchema: z.object({
      imageId: z.string().min(1),
      ref: z.string().optional(),
      coordinate: z.array(z.number()).length(2).optional(),
      tabId: z.number().int().optional(),
    }).refine((value) => Boolean(value.ref) !== Boolean(value.coordinate), {
      message: 'Provide exactly one of ref or coordinate.',
    }),
  }),
  computer: tool({
    description: 'Low-level trusted browser control equivalent to physical mouse/keyboard input. Inspect the page or take a screenshot first to obtain coordinates.',
    inputSchema: z.object({
      action: z.enum(['left_click', 'double_click', 'triple_click', 'right_click', 'mouse_move', 'hover', 'left_click_drag', 'scroll', 'scroll_to', 'type', 'key', 'wait', 'screenshot']),
      x: z.number().optional(), y: z.number().optional(),
      endX: z.number().optional(), endY: z.number().optional(),
      coordinate: z.array(z.number()).length(2).optional(),
      start_coordinate: z.array(z.number()).length(2).optional(),
      deltaX: z.number().optional(), deltaY: z.number().optional(),
      ref: z.string().optional().describe('Element ref returned by inspect_page/read_page. May replace coordinates for click, hover, and scroll_to.'),
      text: z.string().max(20000).optional(),
      key: z.string().min(1).max(100).optional().describe('Key or chord such as Enter, Tab, ArrowDown, CTRL+L, or CMD+A.'),
      modifiers: z.string().max(80).optional().describe('Optional click modifiers such as ctrl+shift or cmd.'),
      duration: z.number().min(0).max(30).optional().describe('Seconds for wait.'),
      repeat: z.number().int().min(1).max(100).optional(),
      tabId: z.number().int().optional(),
    }),
  }),
  browser_batch: tool({
    description: 'Execute predictable browser actions sequentially in one round trip. Each action uses the same input as its standalone tool; processing stops on the first failed action. browser_batch cannot be nested.',
    inputSchema: z.object({
      actions: z.array(z.object({
        name: z.string().min(1),
        input: z.record(z.string(), z.unknown()),
      })).min(1).max(25),
    }),
  }),
  click_page_element: tool({
    description: 'Click a visible interactive element returned by inspect_page. On job application pages, final Submit/Apply actions are refused and must be completed by the user.',
    inputSchema: z.object({
      elementRef: z.string(),
      tabId: z.number().int().optional(),
    }),
  }),
  type_in_page_element: tool({
    description: 'Focus a text-capable element returned by inspect_page, replace its current value, and type the supplied text.',
    inputSchema: z.object({
      elementRef: z.string(),
      text: z.string().max(20000),
      tabId: z.number().int().optional(),
    }),
  }),
  scroll_page: tool({
    description: 'Scroll the current page or a scrollable element returned by inspect_page.',
    inputSchema: z.object({
      direction: z.enum(['up', 'down', 'left', 'right']),
      amount: z.enum(['small', 'medium', 'large', 'page']).optional().default('medium'),
      elementRef: z.string().optional(),
      tabId: z.number().int().optional(),
    }),
  }),
  navigate_browser: tool({
    description: 'Navigate the current tab to an http(s) URL, or go back, forward, or reload.',
    inputSchema: z.object({
      action: z.enum(['url', 'back', 'forward', 'reload']),
      url: z.string().url().optional(),
      tabId: z.number().int().optional(),
    }),
  }),
  get_tabs: tool({
    description: 'List browser tabs in the current window, including active status, title, URL, and group id.',
    inputSchema: z.object({}),
  }),
  tabs_context_mcp: tool({
    description: 'List the tabs in this GoApply browser workspace and identify the active tab.',
    inputSchema: z.object({}),
  }),
  create_tab: tool({
    description: 'Open an http(s) URL in a new browser tab.',
    inputSchema: z.object({
      url: z.string().url(),
      active: z.boolean().optional().default(true),
    }),
  }),
  tabs_create_mcp: tool({
    description: 'Create a new tab inside this GoApply workspace.',
    inputSchema: z.object({
      url: z.string().url(),
      active: z.boolean().optional().default(true),
    }),
  }),
  activate_tab: tool({
    description: 'Activate a tab returned by get_tabs.',
    inputSchema: z.object({ tabId: z.number().int() }),
  }),
  close_tab: tool({
    description: 'Close a tab returned by get_tabs. Refuses to close the last normal browser tab.',
    inputSchema: z.object({ tabId: z.number().int() }),
  }),
  tabs_close_mcp: tool({
    description: 'Close a tab in this GoApply workspace.',
    inputSchema: z.object({ tabId: z.number().int() }),
  }),
  resize_window: tool({
    description: 'Resize the browser window containing a workspace tab.',
    inputSchema: z.object({
      width: z.number().int().min(200).max(7680),
      height: z.number().int().min(200).max(4320),
      tabId: z.number().int().optional(),
    }),
  }),
  take_screenshot: tool({
    description: 'Capture the visible area of the current tab. The result contains a data URL that the side panel can preview.',
    inputSchema: z.object({ tabId: z.number().int().optional() }),
  }),
  group_tabs: tool({
    description: 'Create or update a named Chrome tab group from tab ids returned by get_tabs.',
    inputSchema: z.object({
      tabIds: z.array(z.number().int()).min(1).max(50),
      title: z.string().max(80).optional(),
      color: z.enum(['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange']).optional(),
      collapsed: z.boolean().optional(),
    }),
  }),
  download_file: tool({
    description: 'Download a user-requested http(s) file URL through Chrome. Returns the Chrome download id.',
    inputSchema: z.object({
      url: z.string().url(),
      filename: z.string().max(240).optional(),
    }),
  }),
  schedule_browser_task: tool({
    description: 'Schedule a browser task for later. At the requested time GoApply opens the URL and sends the prompt to its browser agent. Only use when the user explicitly asks to schedule or repeat a task.',
    inputSchema: z.object({
      prompt: z.string().min(1).max(10000),
      url: z.string().url(),
      runAt: z.string().datetime().describe('ISO-8601 date-time for the first run.'),
      repeatMinutes: z.number().int().min(1).max(525600).optional(),
    }),
  }),
  list_scheduled_tasks: tool({
    description: 'List browser tasks scheduled by GoApply.',
    inputSchema: z.object({}),
  }),
  cancel_scheduled_task: tool({
    description: 'Cancel a GoApply browser task by id.',
    inputSchema: z.object({ taskId: z.string() }),
  }),
};

function getExtensionAgentCapabilities(prisma, userId, aiManager) {
  const serverTools = Object.keys(createExtensionAgentServerTools(prisma, userId, aiManager, {}));
  const clientTools = Object.keys(CLIENT_AGENT_TOOL_DEFS).filter((name) => !serverTools.includes(name));
  return {
    agentIdentity: EXTENSION_AGENT_IDENTITY,
    protocolVersion: EXTENSION_AGENT_PROTOCOL_VERSION,
    clientTools,
    serverTools,
    tools: [...new Set([...clientTools, ...serverTools])],
    features: [
      'general-browser-control',
      'trusted-mouse-keyboard',
      'multi-tab-workspaces',
      'job-application-autofill',
      'foligo-document-selection',
      'foligo-job-tracking',
      'interruptible-streaming',
    ],
  };
}

module.exports = {
  createExtensionAgentServerTools,
  CLIENT_AGENT_TOOL_DEFS,
  EXTENSION_AGENT_PROTOCOL_VERSION,
  EXTENSION_AGENT_IDENTITY,
  getExtensionAgentCapabilities,
};
