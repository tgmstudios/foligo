/**
 * Tool set for the agentic Markdown content editor (Editor Studio's "content"
 * adapter). Mirrors resume-editor-tools.js's shape: tools close over a shared
 * mutable `doc` box so edits apply immediately and are visible to later tool
 * calls within the same agent run.
 */
const { tool } = require('ai');
const { z } = require('zod');

/**
 * @param {{ content: string }} doc - mutable box holding the current Markdown source
 */
function createContentEditorTools(doc) {
  return {
    write_content: tool({
      description: 'Replace the ENTIRE content body with new Markdown. Use this for a first draft or a large restructure where a targeted edit would be unwieldy.',
      inputSchema: z.object({
        markdown: z.string().describe('The complete new Markdown source for the content body.'),
      }),
      execute: async ({ markdown }) => {
        doc.content = markdown;
        return 'Content replaced.';
      },
    }),

    edit_content_section: tool({
      description: 'Make a targeted edit by replacing one exact, unique occurrence of existing Markdown text with new text. Prefer this over write_content for small changes. `search` must match the current content exactly and appear exactly once — quote it verbatim, whitespace included.',
      inputSchema: z.object({
        search: z.string().describe('The exact existing text to find (must be unique in the content).'),
        replace: z.string().describe('The text to replace it with.'),
      }),
      execute: async ({ search, replace }) => {
        const occurrences = doc.content.split(search).length - 1;
        if (occurrences === 0) {
          return `Edit failed: the search text was not found verbatim in the content. Re-check whitespace/formatting and try again, or use write_content.`;
        }
        if (occurrences > 1) {
          return `Edit failed: the search text matches ${occurrences} times. Include more surrounding context so it uniquely identifies one location.`;
        }
        doc.content = doc.content.replace(search, replace);
        return 'Edit applied.';
      },
    }),
  };
}

module.exports = { createContentEditorTools };
