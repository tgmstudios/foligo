/**
 * AI Function Calling Tool Definitions — model-agnostic.
 * Defined once with zod via the `ai` SDK's tool() helper; every provider
 * (Gemini, OpenAI-compatible, Anthropic, ...) converts these to its own
 * native tool-call format internally, so no per-provider schema work is needed here.
 */
const { tool } = require('ai');
const { z } = require('zod');

/**
 * Tools for AI content sessions (PROJECT/BLOG/EXPERIENCE) – CREATE mode.
 * - signalContentReadyForGeneration
 * - fetchExistingPost
 */
const AI_CONTENT_CREATE_TOOLS = {
  signalContentReadyForGeneration: tool({
    description: 'Call this function when ALL necessary information has been gathered and you are ready to hand off to the writing AI. This signals the end of the conversation phase. ONLY call this when you have sufficient details for high-quality content generation. At this point, you will determine the content type based on everything discussed.',
    inputSchema: z.object({
      summary: z.string().describe('A comprehensive summary of ALL information gathered from the conversation. Include every relevant detail: names, dates, technologies, achievements, links, timelines, responsibilities, etc. This summary will be used by the writing AI to generate the final content, so be thorough and specific.'),
      contentType: z.enum(['PROJECT', 'EXPERIENCE', 'BLOG']).describe('The content type determined from the conversation. PROJECT = something they built. EXPERIENCE = job/education/certification. BLOG = article/tutorial.'),
    }),
  }),
  fetchExistingPost: tool({
    description: 'Call this function when the user wants to reference a specific post from their portfolio during content creation. Use the post ID from the context provided in the system prompt.',
    inputSchema: z.object({
      postId: z.string().describe('The UUID of the post to fetch (from the portfolio context)'),
      postTitle: z.string().describe('The title of the post being fetched (for user feedback)'),
    }),
  }),
};

/**
 * Tools for AI content sessions – EDIT mode.
 * - signalEditReadyForGeneration
 * - fetchExistingPost
 */
const AI_CONTENT_EDIT_TOOLS = {
  signalEditReadyForGeneration: tool({
    description: 'Call this function when you understand what changes the user wants to make to existing content. Use this in EDIT mode only.',
    inputSchema: z.object({
      summary: z.string().describe('A brief summary of the conversation and what the user wants to change'),
      changes: z.string().describe('Clear, specific description of the requested changes. Be detailed about what should be added, removed, or modified.'),
    }),
  }),
  fetchExistingPost: tool({
    description: 'Call this function when the user wants to edit or reference a specific post from their portfolio. Use the post ID from the context provided in the system prompt.',
    inputSchema: z.object({
      postId: z.string().describe('The UUID of the post to fetch (from the portfolio context)'),
      postTitle: z.string().describe('The title of the post being fetched (for user feedback)'),
    }),
  }),
};

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
    description: 'Call this when the user explicitly asks you to generate a resume in a specific layout/format and you have gathered ALL the information needed. This function creates a saved resume draft (in the resume generator history) from the conversation WITHOUT using any additional AI on the server. You MUST fully populate all text fields (no placeholders like "TBD" or "fill in").',
    inputSchema: z.object({
      name: z.string().describe('A short descriptive name for this resume draft (e.g. "Senior Backend Engineer - Stripe", "Two-column FAANG template for Staff role").'),
      layoutStyle: z.string().describe('High-level layout style requested by the user (e.g. "single_column", "two_column_modern", "compact_bullet_heavy", "academic"). This will be stored with the draft so the user can pick a matching template later.'),
      resumeSize: z.enum(['small', 'medium', 'large']).describe('Overall length/density of the resume: small (lean), medium (default), or large (very detailed).'),
      jobDescription: z.string().describe('The job description or target role this resume is tailored for. Include it verbatim or as provided by the user.'),
      contentItemIds: z.array(z.string()).describe('Optional IDs of portfolio content items (projects/experiences) that this resume is based on. Use IDs from the portfolio context if the user referenced specific items.').optional(),
      templateId: z.string().describe('Optional existing resume template ID to associate with this draft, if the user picked a specific template from their library.').optional(),
      resumeData: z.object({
        summary: z.string().describe('Executive summary at the top of the resume, already tailored to the job.'),
        education: z.array(z.object({
          institution: z.string(),
          degree: z.string(),
          details: z.string().optional(),
          date: z.string().optional(),
          enabled: z.boolean().describe('Whether to show this entry by default.').optional(),
        })).describe('Education section entries.').optional(),
        experience: z.array(z.object({
          company: z.string(),
          location: z.string().optional(),
          description: z.string().optional(),
          enabled: z.boolean().describe('Whether to show this company block by default.').optional(),
          roles: z.array(z.object({
            title: z.string(),
            dateRange: z.string(),
            enabled: z.boolean().describe('Whether to show this role block by default.').optional(),
            bullets: z.array(z.string()).describe('Bullet points describing impact/responsibilities, already written in final resume-ready form.'),
          })).describe('Roles/positions held at this company.'),
        })).describe('Work / experience section entries.').optional(),
        projects: z.array(z.object({
          title: z.string(),
          enabled: z.boolean().describe('Whether to show this project by default.').optional(),
          bullets: z.array(z.string()).describe('Bullet points describing the project, technologies, and impact.'),
        })).describe('Projects section entries.').optional(),
        proficiencies: z.array(z.object({
          category: z.string(),
          enabled: z.boolean().describe('Whether to show this category by default.').optional(),
          skills: z.array(z.string()).describe('Individual skills in this category.'),
        })).describe('Grouped skills / proficiencies section.').optional(),
        honors: z.array(z.string()).describe('Honors / awards / leadership bullet lines.').optional(),
        layoutStyle: z.string().describe('Echo of layout style to make it easy for the editor to know how this resume was intended to look.').optional(),
      }).describe('The fully structured resume content that will be used by the resume generator. You MUST completely fill in all text fields here; the server will NOT call any AI to modify it.'),
    }),
  }),
};

module.exports = {
  AI_CONTENT_CREATE_TOOLS,
  AI_CONTENT_EDIT_TOOLS,
  AI_RESUME_CHATBOT_TOOLS
};
