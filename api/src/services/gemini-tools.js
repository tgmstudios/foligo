/**
 * Gemini Function Calling Tool Definitions
 * These define the structured functions the AI can call during conversations
 */

/**
 * AI Session Tools - Used during conversational content gathering
 * 
 * SIMPLIFIED: Only 2 tools for a cleaner conversation flow
 */
const AI_SESSION_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'signalContentReadyForGeneration',
        description: 'Call this function when ALL necessary information has been gathered and you are ready to hand off to the writing AI. This signals the end of the conversation phase. ONLY call this when you have sufficient details for high-quality content generation. At this point, you will determine the content type based on everything discussed.',
        parameters: {
          type: 'OBJECT',
          properties: {
            summary: {
              type: 'STRING',
              description: 'A comprehensive summary of ALL information gathered from the conversation. Include every relevant detail: names, dates, technologies, achievements, links, timelines, responsibilities, etc. This summary will be used by the writing AI to generate the final content, so be thorough and specific.'
            },
            contentType: {
              type: 'STRING',
              description: 'The content type determined from the conversation. PROJECT = something they built. EXPERIENCE = job/education/certification. BLOG = article/tutorial.',
              enum: ['PROJECT', 'EXPERIENCE', 'BLOG']
            }
          },
          required: ['summary', 'contentType']
        }
      },
      {
        name: 'signalEditReadyForGeneration',
        description: 'Call this function when you understand what changes the user wants to make to existing content. Use this in EDIT mode only.',
        parameters: {
          type: 'OBJECT',
          properties: {
            summary: {
              type: 'STRING',
              description: 'A brief summary of the conversation and what the user wants to change'
            },
            changes: {
              type: 'STRING',
              description: 'Clear, specific description of the requested changes. Be detailed about what should be added, removed, or modified.'
            }
          },
          required: ['summary', 'changes']
        }
      },
      {
        name: 'fetchExistingPost',
        description: 'Call this function when the user wants to edit or reference a specific post from their portfolio. Use the post ID from the context provided in the system prompt.',
        parameters: {
          type: 'OBJECT',
          properties: {
            postId: {
              type: 'STRING',
              description: 'The UUID of the post to fetch (from the portfolio context)'
            },
            postTitle: {
              type: 'STRING',
              description: 'The title of the post being fetched (for user feedback)'
            }
          },
          required: ['postId', 'postTitle']
        }
      }
    ]
  }
];

module.exports = {
  AI_SESSION_TOOLS
};

