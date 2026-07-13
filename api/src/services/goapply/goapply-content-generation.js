/**
 * Reusable GoApply content-generation prompts/calls.
 * Shared by the plain REST endpoints (routes/ai-providers.js) and the
 * extension agent's tool-calls (services/extension-agent-tools.js) so both
 * paths produce identical output from one prompt definition.
 */

function buildCoverLetterPrompt({ jobDescription, company, role }) {
  return `Write a professional cover letter for a ${role} position at ${company}.

Job Description:
${jobDescription}

Requirements:
- Be concise (300-400 words)
- Include specific skills from the job description
- Show enthusiasm for the company
- Professional tone
- Do not fabricate experience — use "[Your experience with X]" placeholders where appropriate
- Format with "Dear Hiring Manager," opening and "Sincerely," closing`;
}

async function generateCoverLetter(ai, { jobDescription, company, role, provider }) {
  const prompt = buildCoverLetterPrompt({ jobDescription, company, role });
  return ai.generateText(prompt, { provider, temperature: 0.7, maxTokens: 4096 });
}

function buildCustomAnswerPrompt({ question, jobDescription }) {
  return `Answer this job application question. Be honest, concise, and professional. Use the job description for context if provided.

JOB DESCRIPTION:
${jobDescription || 'Not provided'}

QUESTION:
${question}

ANSWER (2-4 sentences):`;
}

async function generateCustomAnswer(ai, { question, jobDescription, provider }) {
  const prompt = buildCustomAnswerPrompt({ question, jobDescription });
  return ai.generateText(prompt, { provider, temperature: 0.7, maxTokens: 1024 });
}

module.exports = {
  buildCoverLetterPrompt, generateCoverLetter,
  buildCustomAnswerPrompt, generateCustomAnswer,
};
