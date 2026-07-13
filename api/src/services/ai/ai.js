/**
 * AI Service — model-agnostic resume content generation.
 * Thin wrapper around AIManager for backward compatibility.
 */
const ai = require('./manager');

class AIService {
  /**
   * Generate resume content tailored to a job description.
   * Delegates to the model-agnostic AIManager.
   */
  async generateResumeContent({ jobDescription, userProfile, projects, size = 'medium' }, provider = null) {
    const sizeInstructions = {
      small: 'Keep descriptions brief and concise (1-2 sentences per project).',
      medium: 'Provide moderate detail (2-3 sentences per project).',
      large: 'Provide comprehensive detail (3-5 sentences per project with specific achievements and technologies).'
    };

    const projectsText = projects.map(p =>
      `- ${p.title || p.name || 'Untitled Project'}: ${p.description || 'No description'}`
    ).join('\n');

    const prompt = `You are a professional resume writer. Generate a tailored resume in JSON format.

JOB DESCRIPTION:
${jobDescription}

USER PROFILE:
Name: ${userProfile.name || 'Not provided'}
Email: ${userProfile.email || 'Not provided'}
${userProfile.bio ? `Bio: ${userProfile.bio}` : ''}
${userProfile.skills ? `Skills: ${userProfile.skills.join(', ')}` : ''}

SELECTED PROJECTS:
${projectsText}

RESUME SIZE: ${size}
${sizeInstructions[size]}

Return JSON:
{
  "summary": "Professional summary (${size === 'small' ? '2-3' : size === 'medium' ? '3-4' : '4-5'} sentences)",
  "projects": [{ "title": "...", "description": "...", "tech": "..." }]
}

Return ONLY valid JSON, no markdown, no code blocks.`;

    try {
      let { text } = await ai.generateText(prompt, { temperature: 0.5, maxTokens: 4096, provider });

      text = text.trim();
      if (text.startsWith('```json')) text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      else if (text.startsWith('```')) text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');

      const resumeData = JSON.parse(text);
      if (!resumeData.summary || !Array.isArray(resumeData.projects)) {
        throw new Error('Invalid resume data structure');
      }
      return resumeData;
    } catch (error) {
      console.error('Error generating resume content:', error);
      if (error.message.includes('JSON')) throw new Error('Failed to parse AI response as JSON');
      throw new Error('Failed to generate resume content: ' + error.message);
    }
  }
}

module.exports = new AIService();
