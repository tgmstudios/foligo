const { tool } = require('ai');
const { z } = require('zod');

const interactionInstructions = `INTERVIEWS AND VISUAL EVIDENCE:
Use ask_user to present a real question card with 2–6 concrete choices, or a multiple-select poll. Other/custom answers and skipping are always available. Ask focused questions about audience, angle, personal contribution, results, and tone; build on known facts instead of asking the user to repeat the post.
Use request_screenshots when visual evidence would help. Explain exactly which screen to capture and why. Suggest relevant dashboard ideas (specific metrics, charts, filters, layout, and what story they support) grounded in the post. Never invent metrics or claim a dashboard or screenshot exists.
After either interaction tool, STOP this turn and wait for the user's next message. Tool success only means the card is displayed, not that the user answered.
For a rewrite, first read the entire existing post, then run a fresh conversational interview using question cards and follow-ups. Preserve the original while interviewing. Once enough context is collected, summarize the intended direction and ask whether to write the full replacement; write only after the user asks to proceed. Preserve factual details and useful links unless the user corrects them.`;

function createInteractionTools() {
  return {
    ask_user: tool({
      description: 'Display a quiz question or poll with choices and a custom Other answer. Stop and wait for the user after calling.',
      inputSchema: z.object({
        question: z.string().min(1).max(1000),
        options: z.array(z.string().min(1).max(300)).min(2).max(6),
        multiple: z.boolean().describe('True for a poll that accepts multiple selections; false for one choice.'),
      }),
      execute: async (input) => ({ kind: 'question', ...input, waitingForUser: true }),
    }),
    request_screenshots: tool({
      description: 'Ask for screenshots with a specific capture checklist and purpose. Stop and wait for upload or skip.',
      inputSchema: z.object({
        question: z.string().min(1).max(1000).describe('What to capture and how it will improve the post.'),
      }),
      execute: async (input) => ({ kind: 'screenshots', ...input, waitingForUser: true }),
    }),
  };
}
module.exports = { createInteractionTools, interactionInstructions };
