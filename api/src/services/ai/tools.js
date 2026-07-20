/**
 * AI Function Calling Tool Definitions — model-agnostic.
 * Defined once with zod via the `ai` SDK's tool() helper; every provider
 * (Gemini, OpenAI-compatible, Anthropic, ...) converts these to its own
 * native tool-call format internally, so no per-provider schema work is needed here.
 */
const { tool } = require('ai');
const { z } = require('zod');

/**
 * Tools for the resume chatbot only.
 * - fetchExistingPost (to pull full portfolio content)
 * - createStructuredResumeDraft (to save a fully-populated resume draft for the generator)
 */
const AI_RESUME_CHATBOT_TOOLS = {
  fetchExistingPost: tool({
    description: 'Call this function when you want to pull full details of a portfolio item to reference in resume guidance or resume drafting. Use the post ID from the provided portfolio context.',
    inputSchema: z.object({
      postId: z.string().describe('The UUID of the post to fetch (from the portfolio context)'),
      postTitle: z.string().describe('The title of the post being fetched (for user feedback)'),
    }),
  }),
  createStructuredResumeDraft: tool({
    description: 'Call this when the user explicitly asks you to generate a resume and you have gathered ALL the information needed. This creates a saved resume document (opened in the agentic LaTeX resume editor) from the conversation WITHOUT using any additional AI on the server. You MUST produce a complete, valid, compilable LaTeX document — no placeholders like "TBD" or "fill in".',
    inputSchema: z.object({
      name: z.string().describe('A short descriptive name for this resume draft (e.g. "Senior Backend Engineer - Stripe").'),
      jobDescription: z.string().describe('The job description or target role this resume is tailored for. Include it verbatim or as provided by the user.'),
      resumeContent: z.string().describe('The complete LaTeX source for the resume (including \\documentclass and \\begin{document}...\\end{document}), fully populated from the conversation. This is the exact content that will be opened in the resume editor.'),
    }),
  }),
};

module.exports = {
  AI_RESUME_CHATBOT_TOOLS
};
