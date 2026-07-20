/**
 * Tool set for the agentic LaTeX resume editor.
 * Each tool's `execute` closes over a shared mutable `doc` box so edits
 * apply immediately and are visible to subsequent tool calls within the
 * same agent run (the `ai` SDK drives the multi-step loop; see
 * AIManager.streamChat).
 */
const { tool } = require('ai');
const { z } = require('zod');
const { createWebSearchTool } = require('./web-search-tool');
const { createPullPageTool } = require('./pull-page-tool');

/**
 * @param {{ content: string }} doc - mutable box holding the current LaTeX source
 * @param {(postId: string) => Promise<object|null>} fetchPost - resolves a portfolio content item by id
 */
function createResumeEditorTools(doc, fetchPost) {
  const webSearch = createWebSearchTool({ toolFn: tool, z });
  const pullPage = createPullPageTool({ toolFn: tool, z });

  return {
    web_search: webSearch,
    pull_page: pullPage,
    write_resume: tool({
      description: 'WHOLE-DOCUMENT REPLACE for the resume. Overwrites the entire LaTeX source at once — anything not included in `latex` is discarded. Use ONLY for: (a) the first draft, when no document exists yet, or (b) a large restructure touching most of the document. For any small change (wording, one bullet, a date) use edit_resume_section instead — it is safer and shows exactly what changed. `latex` must always be a complete, valid, compilable .tex document (including \\documentclass and \\begin{document}...\\end{document}), never a fragment.',
      inputSchema: z.object({
        latex: z.string().describe('The complete new LaTeX source for the resume, from \\documentclass through \\end{document}. Not a partial snippet.'),
      }),
      execute: async ({ latex }) => {
        doc.content = latex;
        return 'Document replaced. The entire resume now contains exactly the LaTeX source you just wrote.';
      },
    }),

    edit_resume_section: tool({
      description: 'TARGETED EDIT for the resume: finds one exact, unique occurrence of existing LaTeX text and replaces it, leaving the rest of the document untouched. This is the PREFERRED tool for small changes (wording, a bullet, a date) — use write_resume only for a first draft or a large restructure. Before calling this, you must know the CURRENT exact text in the document (from earlier in this conversation or a prior tool result) — `search` is matched verbatim, including whitespace, against the document as it exists right now, not against what you assume it says. It fails loudly (with a reason) if the text isn\'t found or isn\'t unique, so you can retry with more context — it never silently does nothing.',
      inputSchema: z.object({
        search: z.string().describe('The exact existing text to find, copied verbatim (including whitespace) from the current document. Must appear exactly once, so include enough surrounding context to make it unique.'),
        replace: z.string().describe('The new text that will replace `search` in place.'),
      }),
      execute: async ({ search, replace }) => {
        const occurrences = doc.content.split(search).length - 1;
        if (occurrences === 0) {
          return `Edit failed: the search text was not found verbatim in the document. Re-check whitespace/formatting and try again, or use write_resume.`;
        }
        if (occurrences > 1) {
          return `Edit failed: the search text matches ${occurrences} times. Include more surrounding context so it uniquely identifies one location.`;
        }
        doc.content = doc.content.replace(search, replace);
        return `Edit applied: replaced the matched text with "${replace.length > 120 ? `${replace.slice(0, 120)}…` : replace}". The rest of the document is unchanged.`;
      },
    }),

    fetch_portfolio_item: tool({
      description: 'Fetch the full details (description, metadata) of a portfolio project/experience item by its ID, when you need more detail than the excerpt already in context to write an accurate resume bullet.',
      inputSchema: z.object({
        postId: z.string().describe('The UUID of the portfolio content item to fetch.'),
        postTitle: z.string().describe('The title of the item, for logging/feedback.').optional(),
      }),
      execute: async ({ postId }) => {
        const post = await fetchPost(postId);
        if (!post) return `No portfolio item found with id ${postId}.`;
        return JSON.stringify({
          title: post.title,
          contentType: post.contentType,
          content: post.content,
          excerpt: post.excerpt,
        });
      },
    }),
  };
}

module.exports = { createResumeEditorTools };
