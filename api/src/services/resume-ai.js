/**
 * Resume AI Service — model-agnostic resume generation.
 * Routes through AIManager instead of calling Gemini directly.
 */
const ai = require('./ai/manager');

class ResumeAIService {
  /**
   * Generate resume content tailored to a job description.
   */
  async generateResumeContent(params, fetchPostHandler = null) {
    const { jobDescription, userProfile, allContent = [], selectedContentIds = [], size = 'medium' } = params;

    const sizeInstructions = {
      small: 'Keep descriptions brief and concise (1-2 sentences per project).',
      medium: 'Provide moderate detail (2-3 sentences per project).',
      large: 'Provide comprehensive detail (3-5 sentences per project with specific achievements and technologies).'
    };

    // Build content context with titles and excerpts
    let portfolioContext = '';
    if (allContent && allContent.length > 0) {
      portfolioContext = '\n### AVAILABLE PORTFOLIO CONTENT ###\n';
      portfolioContext += 'You have access to the following content:\n\n';

      allContent.forEach((post, idx) => {
        portfolioContext += `${idx + 1}. [ID: ${post.id}] ${post.title || 'Untitled'}`;
        if (post.excerpt) {
          portfolioContext += `\n   Excerpt: ${post.excerpt}`;
        }
        portfolioContext += `\n   Type: ${post.contentType || 'UNKNOWN'}\n`;
      });

      if (selectedContentIds.length > 0) {
        portfolioContext += `\nNOTE: Prioritize these selected items (IDs: ${selectedContentIds.join(', ')}).\n`;
      }
    }

    const prompt = `You are a professional resume writer. Generate a tailored resume in JSON format.

JOB DESCRIPTION:
${jobDescription}

USER PROFILE:
Name: ${userProfile.name || 'Not provided'}
Email: ${userProfile.email || 'Not provided'}
${userProfile.bio ? `Bio: ${userProfile.bio}` : ''}
${userProfile.skills ? `Skills: ${userProfile.skills.join(', ')}` : ''}

${portfolioContext || 'No portfolio content available.'}

RESUME SIZE: ${size}
${sizeInstructions[size]}

${selectedContentIds.length > 0 
  ? `- Prioritize selected content items (IDs: ${selectedContentIds.join(', ')}).`
  : '- Select the most relevant portfolio content for this job.'}
- Tailor all descriptions to match the job description requirements
- Keep original project titles and core information

Generate a JSON object:
{
  "summary": "Executive summary (${size === 'small' ? '2-3' : size === 'medium' ? '3-4' : '4-5'} sentences)",
  "education": [{ "institution": "...", "degree": "...", "details": "...", "date": "..." }],
  "experience": [{ "company": "...", "location": "...", "description": "...", "roles": [{ "title": "...", "dateRange": "...", "bullets": ["..."] }] }],
  "projects": [{ "title": "...", "bullets": ["..."] }],
  "proficiencies": [{ "category": "...", "skills": ["..."] }],
  "honors": ["..."]
}

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks.`;

    try {
      const provider = params.provider || null; // null = Foligo default
      let { text } = await ai.generateText(prompt, { temperature: 0.5, maxTokens: 8192, provider });

      // Clean up markdown code blocks
      text = text.trim();
      if (text.startsWith('```json')) text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      else if (text.startsWith('```')) text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');

      const resumeData = JSON.parse(text);

      if (!resumeData.summary) throw new Error('Invalid resume data: missing summary');
      if (!Array.isArray(resumeData.projects)) resumeData.projects = [];
      if (!Array.isArray(resumeData.education)) resumeData.education = [];
      if (!Array.isArray(resumeData.experience)) resumeData.experience = [];
      if (!Array.isArray(resumeData.honors)) resumeData.honors = [];
      if (!Array.isArray(resumeData.proficiencies)) {
        if (resumeData.proficiencies && typeof resumeData.proficiencies === 'object') {
          resumeData.proficiencies = Object.entries(resumeData.proficiencies).map(([category, skills]) => ({ category, skills: Array.isArray(skills) ? skills : [] }));
        } else {
          resumeData.proficiencies = [];
        }
      }

      return resumeData;
    } catch (error) {
      console.error('Error generating resume content:', error);
      if (error.message.includes('JSON')) throw new Error('Failed to parse AI response as JSON');
      throw new Error('Failed to generate resume content: ' + error.message);
    }
  }

  /**
   * Improve/rewrite a resume item using AI.
   */
  async improveResumeText({ originalText, jobDescription, context = '', size = 'medium' }) {
    const sizeInstructions = {
      small: 'Keep it brief and concise (1-2 sentences).',
      medium: 'Provide moderate detail (2-3 sentences).',
      large: 'Provide comprehensive detail (3-5 sentences with specific achievements).'
    };

    const prompt = `You are a professional resume writer. Improve this resume text for the job description.

JOB DESCRIPTION:
${jobDescription}

${context ? `CONTEXT:\n${context}\n` : ''}

ORIGINAL TEXT:
${originalText}

RESUME SIZE: ${size}
${sizeInstructions[size]}

Requirements:
- Better match the job description
- Highlight relevant skills and achievements
- Use professional language

Return ONLY the improved text, no markdown, no explanations.`;

    try {
      let { text } = await ai.generateText(prompt, { temperature: 0.5, maxTokens: 1024 });
      text = text.trim();
      if (text.startsWith('```')) text = text.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
      return text;
    } catch (error) {
      console.error('Error improving resume text:', error);
      throw new Error('Failed to improve resume text: ' + error.message);
    }
  }
}

module.exports = new ResumeAIService();
