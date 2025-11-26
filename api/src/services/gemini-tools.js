/**
 * Gemini Function Calling Tool Definitions
 * These define the structured functions the AI can call during conversations
 */

/**
 * Tools for AI content sessions (PROJECT/BLOG/EXPERIENCE) – CREATE mode.
 * - signalContentReadyForGeneration
 * - fetchExistingPost
 */
const AI_CONTENT_CREATE_TOOLS = [
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
        name: 'fetchExistingPost',
        description: 'Call this function when the user wants to reference a specific post from their portfolio during content creation. Use the post ID from the context provided in the system prompt.',
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

/**
 * Tools for AI content sessions – EDIT mode.
 * - signalEditReadyForGeneration
 * - fetchExistingPost
 */
const AI_CONTENT_EDIT_TOOLS = [
  {
    functionDeclarations: [
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

/**
 * Tools for the resume chatbot only.
 * - fetchExistingPost (to pull full portfolio content)
 * - createStructuredResumeDraft (to save a fully-populated resume draft for the generator)
 */
const AI_RESUME_CHATBOT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'fetchExistingPost',
        description: 'Call this function when you want to pull full details of a portfolio item to reference in resume guidance or resume drafting. Use the post ID from the provided portfolio context.',
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
      },
      {
        name: 'createStructuredResumeDraft',
        description: 'Call this when the user explicitly asks you to generate a resume in a specific layout/format and you have gathered ALL the information needed. This function creates a saved resume draft (in the resume generator history) from the conversation WITHOUT using any additional AI on the server. You MUST fully populate all text fields (no placeholders like "TBD" or "fill in").',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: {
              type: 'STRING',
              description: 'A short descriptive name for this resume draft (e.g. "Senior Backend Engineer - Stripe", "Two-column FAANG template for Staff role").'
            },
            layoutStyle: {
              type: 'STRING',
              description: 'High-level layout style requested by the user (e.g. "single_column", "two_column_modern", "compact_bullet_heavy", "academic"). This will be stored with the draft so the user can pick a matching template later.'
            },
            resumeSize: {
              type: 'STRING',
              description: 'Overall length/density of the resume: small (lean), medium (default), or large (very detailed).',
              enum: ['small', 'medium', 'large']
            },
            jobDescription: {
              type: 'STRING',
              description: 'The job description or target role this resume is tailored for. Include it verbatim or as provided by the user.'
            },
            contentItemIds: {
              type: 'ARRAY',
              description: 'Optional IDs of portfolio content items (projects/experiences) that this resume is based on. Use IDs from the portfolio context if the user referenced specific items.',
              items: {
                type: 'STRING'
              }
            },
            templateId: {
              type: 'STRING',
              description: 'Optional existing resume template ID to associate with this draft, if the user picked a specific template from their library.'
            },
            resumeData: {
              type: 'OBJECT',
              description: 'The fully structured resume content that will be used by the resume generator. You MUST completely fill in all text fields here; the server will NOT call any AI to modify it.',
              properties: {
                summary: {
                  type: 'STRING',
                  description: 'Executive summary at the top of the resume, already tailored to the job.'
                },
                education: {
                  type: 'ARRAY',
                  description: 'Education section entries.',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      institution: { type: 'STRING' },
                      degree: { type: 'STRING' },
                      details: { type: 'STRING' },
                      date: { type: 'STRING' },
                      enabled: {
                        type: 'BOOLEAN',
                        description: 'Whether to show this entry by default.'
                      }
                    },
                    required: ['institution', 'degree']
                  }
                },
                experience: {
                  type: 'ARRAY',
                  description: 'Work / experience section entries.',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      company: { type: 'STRING' },
                      location: { type: 'STRING' },
                      description: { type: 'STRING' },
                      enabled: {
                        type: 'BOOLEAN',
                        description: 'Whether to show this company block by default.'
                      },
                      roles: {
                        type: 'ARRAY',
                        description: 'Roles/positions held at this company.',
                        items: {
                          type: 'OBJECT',
                          properties: {
                            title: { type: 'STRING' },
                            dateRange: { type: 'STRING' },
                            enabled: {
                              type: 'BOOLEAN',
                              description: 'Whether to show this role block by default.'
                            },
                            bullets: {
                              type: 'ARRAY',
                              description: 'Bullet points describing impact/responsibilities, already written in final resume-ready form.',
                              items: { type: 'STRING' }
                            }
                          },
                          required: ['title', 'dateRange', 'bullets']
                        }
                      }
                    },
                    required: ['company', 'roles']
                  }
                },
                projects: {
                  type: 'ARRAY',
                  description: 'Projects section entries.',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      title: { type: 'STRING' },
                      enabled: {
                        type: 'BOOLEAN',
                        description: 'Whether to show this project by default.'
                      },
                      bullets: {
                        type: 'ARRAY',
                        description: 'Bullet points describing the project, technologies, and impact.',
                        items: { type: 'STRING' }
                      }
                    },
                    required: ['title', 'bullets']
                  }
                },
                proficiencies: {
                  type: 'ARRAY',
                  description: 'Grouped skills / proficiencies section.',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      category: { type: 'STRING' },
                      enabled: {
                        type: 'BOOLEAN',
                        description: 'Whether to show this category by default.'
                      },
                      skills: {
                        type: 'ARRAY',
                        description: 'Individual skills in this category.',
                        items: { type: 'STRING' }
                      }
                    },
                    required: ['category', 'skills']
                  }
                },
                honors: {
                  type: 'ARRAY',
                  description: 'Honors / awards / leadership bullet lines.',
                  items: { type: 'STRING' }
                },
                // Extra metadata the layout/editor can use
                layoutStyle: {
                  type: 'STRING',
                  description: 'Echo of layout style to make it easy for the editor to know how this resume was intended to look.'
                }
              },
              required: ['summary']
            }
          },
          required: ['name', 'jobDescription', 'resumeData']
        }
      }
    ]
  }
];

module.exports = {
  AI_CONTENT_CREATE_TOOLS,
  AI_CONTENT_EDIT_TOOLS,
  AI_RESUME_CHATBOT_TOOLS
};

