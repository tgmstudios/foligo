/**
 * Tool set for the agentic LaTeX cover letter editor.
 * Each tool's `execute` closes over a shared mutable `doc` box so edits
 * apply immediately and are visible to subsequent tool calls within the
 * same agent run (the `ai` SDK drives the multi-step loop; see
 * AIManager.streamChat).
 */
const { tool } = require('ai');
const { z } = require('zod');

/**
 * @param {{ content: string }} doc - mutable box holding the current LaTeX source
 * @param {(postId: string) => Promise<object|null>} fetchPost - resolves a portfolio content item by id
 */
function createCoverLetterEditorTools(doc, fetchPost) {
  return {
    write_cover_letter: tool({
      description: 'Replace the ENTIRE cover letter document with new LaTeX source. Use this for the first draft, or for large restructures where a targeted edit would be unwieldy. Always produce a complete, valid, compilable .tex document (including \\documentclass and \\begin{document}...\\end{document}).',
      inputSchema: z.object({
        latex: z.string().describe('The complete new LaTeX source for the cover letter.'),
      }),
      execute: async ({ latex }) => {
        doc.content = latex;
        return 'Document replaced.';
      },
    }),

    edit_cover_letter_section: tool({
      description: 'Make a targeted edit by replacing one exact, unique occurrence of existing LaTeX text with new text. Prefer this over write_cover_letter for small changes (wording, a paragraph, a detail). `search` must match the current document exactly and appear exactly once — quote it verbatim, whitespace included.',
      inputSchema: z.object({
        search: z.string().describe('The exact existing text to find (must be unique in the document).'),
        replace: z.string().describe('The text to replace it with.'),
      }),
      execute: async ({ search, replace }) => {
        const occurrences = doc.content.split(search).length - 1;
        if (occurrences === 0) {
          return `Edit failed: the search text was not found verbatim in the document. Re-check whitespace/formatting and try again, or use write_cover_letter.`;
        }
        if (occurrences > 1) {
          return `Edit failed: the search text matches ${occurrences} times. Include more surrounding context so it uniquely identifies one location.`;
        }
        doc.content = doc.content.replace(search, replace);
        return 'Edit applied.';
      },
    }),

    fetch_portfolio_item: tool({
      description: 'Fetch the full details (description, metadata) of a portfolio project/experience item by its ID, when you need more detail than the excerpt already in context to write an accurate cover letter paragraph.',
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

module.exports = { createCoverLetterEditorTools };
