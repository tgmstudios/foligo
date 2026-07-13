/**
 * AI Function Calling Tool Definitions — model-agnostic.
 * Defined once with zod via the `ai` SDK's tool() helper; every provider
 * (Gemini, OpenAI-compatible, Anthropic, ...) converts these to its own
 * native tool-call format internally, so no per-provider schema work is needed here.
 *
 * Tool sets are factory functions. Callers supply { userId, sessionKey }
 * so per-user/per-session tools (e.g. GitHub repo browsing) can be merged in.
 *
 * All tools now include `execute` handlers so the ai SDK can drive a
 * multi-step tool-calling loop (maxSteps > 1) — the same pattern used by
 * the content editor, resume editor, and every other agentic chat in Foligo.
 */
const { tool } = require('ai');
const { z } = require('zod');
const { createGithubTools } = require('../github/github-tools');

/**
 * Core Foligo tools — mode-agnostic.  These always have execute handlers so
 * the SDK can drive the full tool-calling loop without external interception.
 *
 * `fetchPost` is an optional async callback(postId) → post object | null.
 * When provided, fetchExistingPost resolves the full post body inline.
 */
function _coreFoligoBaseTools({ fetchPost } = {}) {
  return {
    signalContentReadyForGeneration: tool({
      description:
        'Call this function when ALL necessary information has been gathered and you are ready to hand off to the writing AI. This signals the end of the conversation phase. ONLY call this when you have sufficient details for high-quality content generation.',
      inputSchema: z.object({
        summary: z.string().describe('A comprehensive summary of ALL information gathered from the conversation.'),
        contentType: z.enum(['PROJECT', 'EXPERIENCE', 'BLOG']).describe('The content type determined from the conversation.'),
      }),
      execute: async (args) => ({
        _action: 'contentReady',
        summary: args.summary,
        contentType: args.contentType,
      }),
    }),

    signalEditReadyForGeneration: tool({
      description:
        'Call this function when you understand what changes the user wants to make to existing content. Use this in EDIT mode only.',
      inputSchema: z.object({
        summary: z.string().describe('A brief summary of the conversation and what the user wants to change.'),
        changes: z.string().describe('Clear, specific description of the requested changes.'),
      }),
      execute: async (args) => ({
        _action: 'editReady',
        summary: args.summary,
        changes: args.changes,
      }),
    }),

    fetchExistingPost: tool({
      description:
        'Call this function when the user wants to reference or edit a specific post from their portfolio. Use the post ID from the context provided in the system prompt.',
      inputSchema: z.object({
        postId: z.string().describe('The UUID of the post to fetch (from the portfolio context).'),
        postTitle: z.string().describe('The title of the post being fetched (for user feedback).'),
      }),
      execute: async (args) => {
        if (fetchPost) {
          try {
            const post = await fetchPost(args.postId);
            if (post) {
              return {
                _action: 'postFetched',
                id: post.id,
                title: post.title,
                contentType: post.contentType,
                content: post.content,
              };
            }
          } catch (_) { /* fall through to marker */ }
        }
        return { _action: 'fetchPost', postId: args.postId, postTitle: args.postTitle };
      },
    }),
  };
}

/**
 * Factory: tools for AI content sessions (PROJECT/BLOG/EXPERIENCE) – CREATE mode.
 * Merges Foligo's conversational tools with GitHub repo-browsing tools
 * when GitHub is connected for this user.
 *
 * @param {{ userId: string, sessionKey: string, fetchPost?: (postId: string) => Promise<object|null> }} params
 * @returns {object} merged tool set
 */
function createContentCreateTools({ userId, sessionKey, fetchPost }) {
  const core = _coreFoligoBaseTools({ fetchPost });
  let github = {};
  try {
    github = createGithubTools({ userId, sessionKey });
  } catch (_) {
    // GitHub tools are optional — only available when the user has connected their GitHub account
  }
  return { ...core, ...github };
}

/**
 * Factory: tools for AI content sessions – EDIT mode.
 * Same tool set as create mode (signalEditReadyForGeneration + signalContentReadyForGeneration both present).
 */
function createContentEditTools({ userId, sessionKey, fetchPost }) {
  const core = _coreFoligoBaseTools({ fetchPost });
  let github = {};
  try {
    github = createGithubTools({ userId, sessionKey });
  } catch (_) {
    // GitHub tools are optional
  }
  return { ...core, ...github };
}

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
  createContentCreateTools,
  createContentEditTools,
  // Backward-compat aliases for code still using the old constant names
  get AI_CONTENT_CREATE_TOOLS() { throw new Error('AI_CONTENT_CREATE_TOOLS is now createContentCreateTools({ userId, sessionKey })'); },
  get AI_CONTENT_EDIT_TOOLS() { throw new Error('AI_CONTENT_EDIT_TOOLS is now createContentEditTools({ userId, sessionKey })'); },
  AI_RESUME_CHATBOT_TOOLS
};
