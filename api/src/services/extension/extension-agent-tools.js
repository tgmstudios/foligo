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
    // The job-assistant descriptions of these two read tools point at
    // save_resume/save_cover_letter, which are not registered in the
    // extension tool set — re-describe them so the model is never steered
    // toward a tool it cannot call here.
    get_resume: {
      ...get_resume,
      description: 'Load the full LaTeX content and job description of ONE of the user\'s Foligo resumes, by id (see list_foligo_documents for the catalog). Read-only — resumes cannot be created or edited from the extension.',
    },
    get_cover_letter: {
      ...get_cover_letter,
      description: 'Load the full LaTeX source of ONE of the user\'s saved Foligo cover letters, by id (see list_foligo_documents for the catalog). Read-only — saved letters cannot be created or edited from the extension; use generate_cover_letter to draft new text for the current page instead.',
    },
    get_goapply_profile,
    get_saved_answers,
    save_answer: jobAssistantTool({
      description: 'Save ONE reusable application question-and-answer pair to the user\'s GoApply saved-answers library, ONLY after the user explicitly asks or approves saving it — never save silently as a side effect of filling a form. Omit `answerId` to create a new saved answer, include it to overwrite an existing owned one. Not for writing an answer into the current page\'s form field — use set_field_value for that.',
      inputSchema: z.object({
        answerId: z.string().optional().describe('Omit to create a new saved answer. Include the id of an existing owned answer to overwrite it.'),
        question: z.string().min(1),
        answer: z.string().min(1),
        category: z.string().nullable().optional(),
        jobId: z.string().optional().describe('Optional id of a tracked job application to attach this answer to.'),
      }),
      execute: async ({ answerId, question, answer, category, jobId }) => save_answers.execute({
        answers: [{ answerId, question, answer, category, ...(jobId ? { jobIds: [jobId] } : {}) }],
      }, {}),
    }),
    generate_cover_letter: jobAssistantTool({
      description: 'Draft a NEW tailored cover letter for the job on the current page, from scratch via the LLM. Returns only text — it does NOT write anything to the page or save anything. After calling this, write the returned text into the page\'s cover-letter field yourself with set_field_value (field-detection toolkit) or form_input (general browser toolkit). Not for loading an existing saved cover letter — use get_cover_letter for that.',
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
      description: 'Draft a NEW answer to an open-ended application question (an essay question, "why do you want to work here", etc), from scratch via the LLM. Returns only text — it does NOT write anything to the page or save anything. After calling this, write the returned text into the page\'s field yourself with set_field_value (field-detection toolkit) or form_input (general browser toolkit); use save_answer separately if the user wants it kept for reuse. Not for reusing an answer the user already saved — check get_saved_answers first.',
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
  // ── FIELD-DETECTION TOOLKIT ──
  // For filling out a job-application FORM the extension has already
  // detected. These tools all take a `fieldRef`/`elementRef` from the
  // detected field/nav list already in context, or from a rescan_page
  // result — never from inspect_page/read_page (those return a different
  // kind of `ref`, for the separate GENERAL BROWSER TOOLKIT further down,
  // used for pages/actions outside form-detection, e.g. a Continue button
  // that isn't a recognized field).
  set_field_value: tool({
    description: 'FIELD-DETECTION TOOLKIT. Write a value into ONE detected form field, identified by its fieldRef (from the field list already in context, or from a rescan_page result — not from inspect_page/read_page/find, which return a different `ref` for the general browser toolkit). For filling multiple known fields at once, prefer set_field_values instead of calling this repeatedly. Mark confidence "low" for a best-effort guess so the extension flags it for the user to review.',
    inputSchema: z.object({
      fieldRef: z.string().describe('The field identifier from the detected field list or a rescan_page result.'),
      value: z.string(),
      confidence: z.enum(['high', 'low']),
      reason: z.string().optional().describe('Why this value was chosen, or why confidence is low. Shown to the user.'),
    }),
  }),
  set_field_values: tool({
    description: 'FIELD-DETECTION TOOLKIT. Fill several detected form fields in ONE deterministic browser operation, each identified by its fieldRef. PREFERRED over multiple set_field_value calls whenever two or more values are already known — fewer round trips, one atomic operation.',
    inputSchema: z.object({
      fields: z.array(z.object({
        fieldRef: z.string().describe('The field identifier from the detected field list or a rescan_page result.'),
        value: z.string(),
        confidence: z.enum(['high', 'low']),
        reason: z.string().optional(),
      })).min(1).max(20),
    }),
  }),
  inspect_field_control: tool({
    description: 'FIELD-DETECTION TOOLKIT. Inspect ONE detected field\'s current retained value, control type, and currently available dropdown options. Call this BEFORE select_field_option whenever you\'re guessing at a dynamic-select option label rather than one you already know verbatim — dynamic dropdowns (e.g. school, degree) load their options asynchronously and often don\'t match a naive guess.',
    inputSchema: z.object({
      fieldRef: z.string().describe('The field identifier from the detected field list or a rescan_page result.'),
      open: z.boolean().optional().default(true),
      query: z.string().optional().describe('Optional search text for an async dropdown such as school or degree.'),
    }),
  }),
  select_field_option: tool({
    description: 'FIELD-DETECTION TOOLKIT. Select and verify an option in a detected native or dynamic dropdown field. The result is only reported successful when the page actually retains the selected label — treat a failed result as the option not being available yet, and use inspect_field_control to see current options before retrying.',
    inputSchema: z.object({
      fieldRef: z.string().describe('The field identifier from the detected field list or a rescan_page result.'),
      value: z.string(),
      confidence: z.enum(['high', 'low']).optional().default('high'),
      reason: z.string().optional(),
    }),
  }),
  set_checkbox_state: tool({
    description: 'FIELD-DETECTION TOOLKIT. Check or uncheck a detected checkbox field and verify its actual resulting checked state. Use this for consent/agreement controls instead of set_field_value, which writes text and is not for checkboxes.',
    inputSchema: z.object({
      fieldRef: z.string().describe('The field identifier from the detected field list or a rescan_page result.'),
      checked: z.boolean(),
      confidence: z.enum(['high', 'low']).optional().default('high'),
      reason: z.string().optional(),
    }),
  }),
  flag_field_uncertain: tool({
    description: 'FIELD-DETECTION TOOLKIT. Flag ONE detected field for the user to review manually, WITHOUT writing any value into it — use this instead of guessing when you cannot answer a question on the user\'s behalf (e.g. a personal/legal question). This is the safe fallback when set_field_value/select_field_option/set_checkbox_state would otherwise require a guess you are not confident in.',
    inputSchema: z.object({
      fieldRef: z.string().describe('The field identifier from the detected field list or a rescan_page result.'),
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
    description: 'Attach one specifically selected Foligo resume or cover letter PDF to a detected upload field, identified by its fieldRef (field-detection toolkit). You MUST call list_foligo_documents first and pass the chosen documentId — never call this with a guessed or remembered id, and never claim a document was attached unless the result confirms `applied: true`.',
    inputSchema: z.object({
      fieldRef: z.string().describe('The upload field identifier from the detected field list or a rescan_page result.'),
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
    description: 'FIELD-DETECTION TOOLKIT. Click a navigation element (e.g. "Next" or "Continue" on a multi-step application) identified by its elementRef from the navCandidates list already in context — not from inspect_page/read_page/find. Refused if the element is not a known navigation candidate. This can NEVER be used to click a final Submit/Apply button — use find_submit_button to point the user at it instead; the user always submits themselves. After it navigates with expectation "next-page", call wait_for_element then rescan_page before acting further — do not assume the new step is already loaded.',
    inputSchema: z.object({
      elementRef: z.string().describe('The navigation element identifier from the navCandidates list.'),
      expectation: z.enum(['next-page', 'same-page']),
    }),
  }),
  find_submit_button: tool({
    description: 'FIELD-DETECTION TOOLKIT. Locate and highlight the final Submit/Apply button on the page for the user\'s attention. This ONLY highlights the button — it never clicks it, and no tool in this toolkit will click a final submit action. The user always submits the application themselves.',
    inputSchema: z.object({}),
  }),
  rescan_page: tool({
    description: 'FIELD-DETECTION TOOLKIT. Re-detect form fields and navigation candidates on the current page and return a fresh field/nav list to continue working from. Call this after click_element navigates, or after filling several fields, since the previously-detected fieldRef/elementRef values can go stale.',
    inputSchema: z.object({}),
  }),
  wait_for_element: tool({
    description: 'FIELD-DETECTION TOOLKIT. Wait (up to a bounded timeout) for a multi-step wizard\'s next page to actually be ready after click_element navigated with expectation "next-page" — async transitions do not always finish by the time click_element returns. Call this, then rescan_page, rather than assuming the next step is immediately present.',
    inputSchema: z.object({
      elementRef: z.string().optional().describe('A navCandidates ref expected to appear on the new step, if known.'),
      timeoutMs: z.number().int().min(200).max(8000).optional().default(4000),
    }),
  }),
  read_page_text: tool({
    description: 'FIELD-DETECTION TOOLKIT. Read a bounded plain-text snapshot of the page\'s currently visible content, to confirm which wizard step you landed on or to find context not present in the field/nav list (e.g. instructions, an error banner). Text only, no element refs — for that, this toolkit\'s field/nav list already in context (refreshed via rescan_page) is what you act on, not this tool.',
    inputSchema: z.object({
      maxChars: z.number().int().min(200).max(4000).optional().default(2000),
    }),
  }),

  // ── GENERAL BROWSER TOOLKIT ──
  // For pages/actions the field-detection toolkit above doesn't cover (a
  // non-application page, or a control the field detector didn't recognize).
  // These tools return/consume their own `ref`, produced by inspect_page or
  // read_page — never mix a fieldRef/elementRef from the toolkit above into
  // these, or vice versa.
  inspect_page: tool({
    description: 'GENERAL BROWSER TOOLKIT. Inspect the current page: returns visible interactive elements with stable `ref`s plus a bounded text snapshot, in one call. This is the usual FIRST call on a page outside the field-detection toolkit, before form_input/click_page_element/type_in_page_element — those consume the `ref`s this returns.',
    inputSchema: z.object({
      maxElements: z.number().int().min(10).max(200).optional().default(80),
      maxTextChars: z.number().int().min(200).max(12000).optional().default(6000),
      tabId: z.number().int().optional(),
    }),
  }),
  read_page: tool({
    description: 'GENERAL BROWSER TOOLKIT. Read the current page as a structured, deeper accessibility-style tree with stable element `ref`s than inspect_page provides — use when inspect_page\'s flat list isn\'t enough (e.g. you need `ref_id` to drill into one subtree, or a specific `depth`). Use filter "interactive" for controls only, or "all" to include visible text containers.',
    inputSchema: z.object({
      filter: z.enum(['interactive', 'all']).optional().default('all'),
      depth: z.number().int().min(1).max(30).optional().default(15),
      ref_id: z.string().optional().describe('A ref from a prior read_page/inspect_page call to drill into that element\'s subtree.'),
      max_chars: z.number().int().min(200).max(50000).optional().default(50000),
      tabId: z.number().int().optional(),
    }),
  }),
  find: tool({
    description: 'GENERAL BROWSER TOOLKIT. Search the current page for elements matching a purpose or text description (e.g. "the email field", "submit button") and return matching `ref`s. Use this instead of inspect_page/read_page when you know what you\'re looking for by description and want to skip scanning the full element list yourself.',
    inputSchema: z.object({
      query: z.string().min(1),
      tabId: z.number().int().optional(),
    }),
  }),
  form_input: tool({
    description: 'GENERAL BROWSER TOOLKIT. Set a text, checkbox, radio, or select value on ONE element, identified by a `ref` returned by read_page, find, or inspect_page (not a fieldRef from the field-detection toolkit). Prefer this over the lower-level computer tool for form fields — it targets the element directly instead of simulating coordinates.',
    inputSchema: z.object({
      ref: z.string().describe('An element ref from a prior read_page/find/inspect_page call.'),
      value: z.union([z.string(), z.boolean(), z.number()]),
      tabId: z.number().int().optional(),
    }),
  }),
  get_page_text: tool({
    description: 'GENERAL BROWSER TOOLKIT. Extract a bounded raw text snapshot from the current page — text only, no element refs. Use this for reading page content (e.g. a job description) when you don\'t need to interact with anything; use inspect_page/read_page instead when you need refs to act on.',
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
    description: 'GENERAL BROWSER TOOLKIT. LAST-RESORT low-level browser control, simulating physical mouse/keyboard input (raw clicks, drags, key presses, scrolling by pixel, screenshots). Prefer the higher-level form_input/click_page_element/type_in_page_element/scroll_page tools when they apply — they target elements directly by `ref` and are more reliable; fall back to this only for actions those can\'t express (drag, precise coordinates, key chords, taking a screenshot). Call action "screenshot" or inspect the page first to obtain coordinates before clicking/dragging by (x, y).',
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
    description: 'GENERAL BROWSER TOOLKIT. Execute two or more PREDICTABLE browser actions sequentially in one round trip (e.g. click → type → key, or several independent form writes) instead of separate tool calls — use this whenever you can predict multiple safe steps ahead. Each entry\'s `name` must be another tool\'s exact name (e.g. "click_page_element", "form_input") and `input` its exact input shape. Runs in order and stops at the first failed action. Cannot be nested (do not put "browser_batch" inside its own actions list). Re-inspect the page after this if a later, unplanned action depends on its result.',
    inputSchema: z.object({
      actions: z.array(z.object({
        name: z.string().min(1).describe('The exact name of another tool to run, e.g. "click_page_element".'),
        input: z.record(z.string(), z.unknown()).describe('The exact input object that tool normally takes.'),
      })).min(1).max(25),
    }),
  }),
  click_page_element: tool({
    description: 'GENERAL BROWSER TOOLKIT. Click ONE visible interactive element, identified by the elementRef returned by inspect_page (not a fieldRef/elementRef from the field-detection toolkit\'s field/nav list). On job application pages, final Submit/Apply actions are refused and must be completed by the user.',
    inputSchema: z.object({
      elementRef: z.string().describe('An element ref from a prior inspect_page call.'),
      tabId: z.number().int().optional(),
    }),
  }),
  type_in_page_element: tool({
    description: 'GENERAL BROWSER TOOLKIT. Focus a text-capable element identified by the elementRef returned by inspect_page, replace its current value, and type the supplied text. Prefer form_input for setting a value on a known field; use this when you specifically need to simulate typing (e.g. to trigger a page\'s keystroke-driven autocomplete).',
    inputSchema: z.object({
      elementRef: z.string().describe('An element ref from a prior inspect_page call.'),
      text: z.string().max(20000),
      tabId: z.number().int().optional(),
    }),
  }),
  scroll_page: tool({
    description: 'GENERAL BROWSER TOOLKIT. Scroll the current page, or one scrollable element identified by the elementRef returned by inspect_page.',
    inputSchema: z.object({
      direction: z.enum(['up', 'down', 'left', 'right']),
      amount: z.enum(['small', 'medium', 'large', 'page']).optional().default('medium'),
      elementRef: z.string().optional().describe('An element ref from a prior inspect_page call. Omit to scroll the whole page.'),
      tabId: z.number().int().optional(),
    }),
  }),
  navigate_browser: tool({
    description: 'GENERAL BROWSER TOOLKIT. Navigate the current tab to an http(s) URL, or go back, forward, or reload.',
    inputSchema: z.object({
      action: z.enum(['url', 'back', 'forward', 'reload']),
      url: z.string().url().optional(),
      tabId: z.number().int().optional(),
    }),
  }),
  // get_tabs/create_tab/close_tab and tabs_context_mcp/tabs_create_mcp/
  // tabs_close_mcp are BOTH present at once and do the exact same three
  // operations under different names (kept for compatibility with older
  // tool-list versions). They are functionally interchangeable — pick one
  // name per operation and don't call both for the same thing. Prefer the
  // tabs_*_mcp names; that's the naming this agent's own instructions use.
  get_tabs: tool({
    description: 'List browser tabs in the current window, including active status, title, URL, and group id. Does the same thing as tabs_context_mcp (prefer that name) — don\'t call both for one lookup.',
    inputSchema: z.object({}),
  }),
  tabs_context_mcp: tool({
    description: 'List the tabs in this GoApply browser workspace and identify the active tab. Preferred over the equivalent get_tabs.',
    inputSchema: z.object({}),
  }),
  create_tab: tool({
    description: 'Open an http(s) URL in a new browser tab. Does the same thing as tabs_create_mcp (prefer that name) — don\'t call both for one tab.',
    inputSchema: z.object({
      url: z.string().url(),
      active: z.boolean().optional().default(true),
    }),
  }),
  tabs_create_mcp: tool({
    description: 'Create a new tab inside this GoApply workspace. Preferred over the equivalent create_tab.',
    inputSchema: z.object({
      url: z.string().url(),
      active: z.boolean().optional().default(true),
    }),
  }),
  activate_tab: tool({
    description: 'Activate (switch to) a tab, identified by the tabId from a prior get_tabs/tabs_context_mcp call.',
    inputSchema: z.object({ tabId: z.number().int().describe('A tabId from a prior get_tabs/tabs_context_mcp call.') }),
  }),
  close_tab: tool({
    description: 'Close a tab, identified by the tabId from a prior get_tabs/tabs_context_mcp call. Refuses to close the last normal browser tab. Does the same thing as tabs_close_mcp (prefer that name) — don\'t call both for one tab.',
    inputSchema: z.object({ tabId: z.number().int().describe('A tabId from a prior get_tabs/tabs_context_mcp call.') }),
  }),
  tabs_close_mcp: tool({
    description: 'Close a tab in this GoApply workspace, identified by the tabId from a prior get_tabs/tabs_context_mcp call. Preferred over the equivalent close_tab.',
    inputSchema: z.object({ tabId: z.number().int().describe('A tabId from a prior get_tabs/tabs_context_mcp call.') }),
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
  gif_creator: tool({
    description: 'Record the browser session as an animated GIF and export it, scoped to the current GoApply tab group. Flow: call action "start_recording", then immediately take_screenshot to capture the initial state as the first frame; subsequent browser actions (clicks, typing, scrolls, navigation) are captured automatically. Before "stop_recording", take_screenshot again to capture the final state. Then "export" with either download:true (save the .gif) or a coordinate [x,y] to drag-and-drop the GIF onto a page upload/drop target. Use "clear" to discard frames. Exported GIFs include click indicators, drag paths, action labels, a progress bar, and a watermark unless disabled via options.',
    inputSchema: z.object({
      action: z.enum(['start_recording', 'stop_recording', 'export', 'clear']),
      tabId: z.number().int().optional().describe('Tab identifying which workspace group this applies to.'),
      coordinate: z.array(z.number()).length(2).optional().describe('Viewport [x, y] for drag-and-drop upload. Required for export unless download is true.'),
      download: z.boolean().optional().describe('If true, download the GIF instead of drag-dropping it. Export only.'),
      filename: z.string().max(240).optional().describe('Optional filename for the exported GIF. Export only.'),
      options: z.object({
        showClickIndicators: z.boolean().optional(),
        showDragPaths: z.boolean().optional(),
        showActionLabels: z.boolean().optional(),
        showProgressBar: z.boolean().optional(),
        showWatermark: z.boolean().optional(),
        quality: z.number().int().min(1).max(30).optional().describe('GIF quality, 1-30 (lower is higher quality). Default 10.'),
      }).optional().describe('Optional GIF overlay/quality options for export.'),
    }),
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
      'session-gif-recording',
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
