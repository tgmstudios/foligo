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

function createExtensionAgentServerTools(prisma, userId, aiManager) {
  const { web_search, pull_page, get_resume, get_cover_letter, get_goapply_profile, get_saved_answers, save_answers } = createJobAssistantTools(prisma, userId);

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
};

module.exports = { createExtensionAgentServerTools, CLIENT_AGENT_TOOL_DEFS };
