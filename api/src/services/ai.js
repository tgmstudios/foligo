const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }

  /**
   * Generate resume content tailored to a job description
   * @param {Object} params - Parameters for resume generation
   * @param {string} params.jobDescription - The job description to tailor to
   * @param {Object} params.userProfile - User profile information
   * @param {Array} params.projects - Selected projects to include
   * @param {string} params.size - Resume size: 'small', 'medium', or 'large'
   * @returns {Promise<Object>} Generated resume data in JSON format
   */
  async generateResumeContent({ jobDescription, userProfile, projects, size = 'medium' }) {
    const sizeInstructions = {
      small: 'Keep descriptions brief and concise (1-2 sentences per project).',
      medium: 'Provide moderate detail (2-3 sentences per project).',
      large: 'Provide comprehensive detail (3-5 sentences per project with specific achievements and technologies).'
    };

    const projectsText = projects.map(p => {
      return `- ${p.title || p.name || 'Untitled Project'}: ${p.description || 'No description'}`;
    }).join('\n');

    const prompt = `You are a professional resume writer. Generate a tailored resume in JSON format based on the following information:

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

Generate a JSON object with the following structure:
{
  "summary": "A professional summary tailored to the job description (${size === 'small' ? '2-3 sentences' : size === 'medium' ? '3-4 sentences' : '4-5 sentences'})",
  "projects": [
    {
      "title": "Project title",
      "description": "Project description tailored to the job (${size === 'small' ? '1-2 sentences' : size === 'medium' ? '2-3 sentences' : '3-5 sentences'})",
      "tech": "Technologies used (comma-separated)"
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Tailor all content to match the job description requirements
- Highlight relevant skills and technologies
- Use professional language
- Ensure the JSON is valid and parseable`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean up the response - remove markdown code blocks if present
      text = text.trim();
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      // Parse JSON
      const resumeData = JSON.parse(text);

      // Validate structure
      if (!resumeData.summary || !Array.isArray(resumeData.projects)) {
        throw new Error('Invalid resume data structure');
      }

      return resumeData;
    } catch (error) {
      console.error('Error generating resume content:', error);
      if (error.message.includes('JSON')) {
        throw new Error('Failed to parse AI response as JSON');
      }
      throw new Error('Failed to generate resume content: ' + error.message);
    }
  }
}

module.exports = new AIService();

