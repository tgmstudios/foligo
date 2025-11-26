const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AI_SESSION_TOOLS } = require('./gemini-tools');

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
   * @param {Array} params.allContent - All content items with titles/excerpts
   * @param {Array} params.selectedContentIds - Selected content IDs (optional)
   * @param {string} params.size - Resume size: 'small', 'medium', or 'large'
   * @param {Function} params.fetchPostHandler - Handler for fetching full post content
   * @returns {Promise<Object>} Generated resume data in JSON format
   */
  async generateResumeContent({ jobDescription, userProfile, allContent = [], selectedContentIds = [], size = 'medium' }, fetchPostHandler = null) {
    const sizeInstructions = {
      small: 'Keep descriptions brief and concise (1-2 sentences per project).',
      medium: 'Provide moderate detail (2-3 sentences per project).',
      large: 'Provide comprehensive detail (3-5 sentences per project with specific achievements and technologies).'
    };

    // Build content context with titles and excerpts (like resume chatbot)
    let portfolioContext = '';
    if (allContent && allContent.length > 0) {
      portfolioContext = '\n### AVAILABLE PORTFOLIO CONTENT ###\n';
      portfolioContext += 'You have access to the following content. Use fetchExistingPost tool to get full details when needed.\n\n';
      
      allContent.forEach((post, idx) => {
        portfolioContext += `${idx + 1}. [ID: ${post.id}] ${post.title || 'Untitled'}`;
        if (post.excerpt) {
          portfolioContext += `\n   Excerpt: ${post.excerpt}`;
        }
        portfolioContext += `\n   Type: ${post.contentType || 'UNKNOWN'}\n`;
      });
      
      if (selectedContentIds.length > 0) {
        portfolioContext += `\nNOTE: The user has selected these specific items (IDs: ${selectedContentIds.join(', ')}). Prioritize these, but you can also use other relevant content.\n`;
      }
    }

    const prompt = `You are a professional resume writer. Generate a tailored resume in JSON format based on the following information:

JOB DESCRIPTION:
${jobDescription}

USER PROFILE:
Name: ${userProfile.name || 'Not provided'}
Email: ${userProfile.email || 'Not provided'}
${userProfile.bio ? `Bio: ${userProfile.bio}` : ''}
${userProfile.skills ? `Skills: ${userProfile.skills.join(', ')}` : ''}

${portfolioContext || 'No portfolio content available. Generate relevant projects based on the job description and user profile.'}

### INSTRUCTIONS ###
${selectedContentIds.length > 0 
  ? `- The user has selected specific content items (IDs: ${selectedContentIds.join(', ')}). Prioritize these in your resume.
- Use the fetchExistingPost tool to get full details of any content you want to include.
- Transform each selected item into a professional resume entry.
- You may also include other relevant content from the portfolio if it strengthens the resume.`
  : `- Review all available portfolio content and select the most relevant items for this job.
- Use the fetchExistingPost tool to get full details of content you want to include.
- Transform selected items into professional resume entries.
- If no content is relevant, generate appropriate projects based on the job description.`}
- Tailor all descriptions to match the job description requirements
- Keep original project titles and core information
- You may reword and enhance descriptions, but base them on actual content
- Use fetchExistingPost tool when you need full content details (not just excerpt)

RESUME SIZE: ${size}
${sizeInstructions[size]}

Generate a JSON object with the following structure:
{
  "summary": "Executive summary tailored to the job description (${size === 'small' ? '2-3 sentences' : size === 'medium' ? '3-4 sentences' : '4-5 sentences'})",
  "education": [
    {
      "institution": "University name",
      "degree": "Degree and field of study",
      "details": "Additional details like minors, GPA, honors",
      "date": "Graduation date or expected date"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "location": "City, State",
      "description": "Brief company description",
      "roles": [
        {
          "title": "Job title",
          "dateRange": "Start date – End date",
          "bullets": [
            "Bullet point describing achievement or responsibility",
            "Another bullet point"
          ]
        }
      ]
    }
  ],
  "projects": [
    {
      "title": "Project title",
      "bullets": [
        "Bullet point describing the project",
        "Another bullet point about technologies or achievements"
      ]
    }
  ],
  "proficiencies": [
    {
      "category": "Category name",
      "skills": ["Skill 1", "Skill 2", "Skill 3"]
    }
  ],
  "honors": [
    "Honor or award 1",
    "Honor or award 2"
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Tailor all content to match the job description requirements
- Highlight relevant skills and technologies
- Use professional language
- Ensure the JSON is valid and parseable
${selectedContentIds.length > 0 ? '- Prioritize the selected content items, but you can also use other relevant portfolio content.' : '- Select the most relevant portfolio content, or generate appropriate projects if none match.'}
- Include projects that showcase skills mentioned in the job description
- For experience section: Extract company names, job titles, dates, and achievements from the user's content items
- For education: Include if mentioned in user profile or content
- For proficiencies: Organize technical skills by category (e.g., "Cloud & Infrastructure", "Programming & Backend", "Frontend & Mobile")
- For honors: Include any awards, recognitions, or leadership roles mentioned
- Use bullet points (arrays) for achievements, responsibilities, and project descriptions
- Maintain professional formatting with clear, concise bullet points`;

    try {
      // Use model with tool support if fetchPostHandler is provided
      const model = fetchPostHandler 
        ? this.genAI.getGenerativeModel({ 
            model: 'gemini-flash-latest',
            tools: AI_SESSION_TOOLS
          })
        : this.model;

      let text;
      let fetchedPosts = new Map(); // Cache fetched posts
      
      // Use chat for tool calling support if handler provided, otherwise simple generation
      if (fetchPostHandler) {
        const chat = model.startChat();
        let response = await chat.sendMessage(prompt);
        
        // Handle function calls (fetchExistingPost)
        let maxIterations = 5; // Prevent infinite loops
        while (maxIterations-- > 0) {
          const functionCalls = response.response.functionCalls();
          if (!functionCalls || functionCalls.length === 0) break;
          
          const functionCall = functionCalls[0];
          if (functionCall.name === 'fetchExistingPost' && fetchPostHandler) {
            const postId = functionCall.args.postId;
            if (!fetchedPosts.has(postId)) {
              const post = await fetchPostHandler(postId);
              if (post) {
                fetchedPosts.set(postId, post);
                // Continue conversation with fetched post
                response = await chat.sendMessage(
                  `Here is the full content of "${post.title}":\n\n${post.content || post.excerpt || 'No content available'}`
                );
              } else {
                response = await chat.sendMessage(`Post with ID ${postId} not found. Continue generating the resume.`);
              }
            } else {
              // Already fetched, continue
              response = await chat.sendMessage('You already have this post. Continue generating the resume in JSON format.');
            }
          } else {
            break;
          }
        }
        
        text = response.response.text();
      } else {
        // Simple generation without tool calls
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
      }
      
      // Clean up the response - remove markdown code blocks if present
      text = text.trim();
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Parse JSON
      const resumeData = JSON.parse(text);

      // Validate structure - ensure required fields exist
      if (!resumeData.summary) {
        throw new Error('Invalid resume data structure: missing summary');
      }
      
      // Ensure arrays exist even if empty
      if (!Array.isArray(resumeData.projects)) resumeData.projects = [];
      if (!Array.isArray(resumeData.education)) resumeData.education = [];
      if (!Array.isArray(resumeData.experience)) resumeData.experience = [];
      if (!Array.isArray(resumeData.honors)) resumeData.honors = [];
      if (!Array.isArray(resumeData.proficiencies)) {
        // Convert object format to array format if needed
        if (resumeData.proficiencies && typeof resumeData.proficiencies === 'object') {
          resumeData.proficiencies = Object.entries(resumeData.proficiencies).map(([category, skills]) => ({
            category,
            skills: Array.isArray(skills) ? skills : []
          }));
        } else {
          resumeData.proficiencies = [];
        }
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

  /**
   * Generate improved/edited text for a resume item using AI
   * @param {Object} params - Parameters for text generation
   * @param {string} params.originalText - The original text to improve
   * @param {string} params.jobDescription - The job description to tailor to
   * @param {string} params.context - Additional context (e.g., project title, tech stack)
   * @param {string} params.size - Resume size: 'small', 'medium', or 'large'
   * @returns {Promise<string>} Improved text
   */
  async improveResumeText({ originalText, jobDescription, context = '', size = 'medium' }) {
    const sizeInstructions = {
      small: 'Keep it brief and concise (1-2 sentences).',
      medium: 'Provide moderate detail (2-3 sentences).',
      large: 'Provide comprehensive detail (3-5 sentences with specific achievements).'
    };

    const prompt = `You are a professional resume writer. Improve and tailor the following resume text to match the job description.

JOB DESCRIPTION:
${jobDescription}

${context ? `CONTEXT:\n${context}\n` : ''}

ORIGINAL TEXT:
${originalText}

RESUME SIZE: ${size}
${sizeInstructions[size]}

Generate an improved version of the text that:
- Better matches the job description requirements
- Highlights relevant skills and achievements
- Uses professional language
- Is tailored to the position

Return ONLY the improved text, no explanations, no markdown formatting.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Clean up any markdown formatting
      if (text.startsWith('```')) {
        text = text.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
      }

      return text;
    } catch (error) {
      console.error('Error improving resume text:', error);
      throw new Error('Failed to improve resume text: ' + error.message);
    }
  }
}

module.exports = new AIService();

