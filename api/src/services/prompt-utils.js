/**
 * Prompt Utilities
 * Helper functions and utilities used across all prompt types
 */

/**
 * Get current date and time formatted for prompts
 */
const getCurrentDateTime = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short'
  });
};

/**
 * Build context string from user/project data
 */
const buildContextString = (context) => {
  let contextString = '';
  
  if (context.user) {
    contextString += `User: ${context.user.name} (${context.user.email})\n`;
  }
  
  if (context.project) {
    contextString += `Portfolio: ${context.project.name}`;
    if (context.project.description) {
      contextString += ` - ${context.project.description}`;
    }
    if (context.project.siteConfig?.profileBio) {
      contextString += `\nBio: ${context.project.siteConfig.profileBio}`;
    }
    contextString += '\n';
  }
  
  // Add last 10 posts per type
  if (context.postsByType) {
    const postTypes = ['BLOG', 'PROJECT', 'EXPERIENCE'];
    for (const postType of postTypes) {
      const posts = context.postsByType[postType] || [];
      if (posts.length > 0) {
        contextString += `\nLast 10 ${postType} Posts:\n`;
        posts.forEach((post, idx) => {
          contextString += `${idx + 1}. [ID: ${post.id}] ${post.title}`;
          if (post.excerpt) {
            contextString += ` - ${post.excerpt.substring(0, 100)}`;
          }
          contextString += '\n';
        });
      }
    }
  }
  
  // Add all skills and categories
  if (context.skills && context.skills.length > 0) {
    contextString += `\nAll Skills:\n`;
    const skillsByCategory = {};
    context.skills.forEach(skill => {
      const category = skill.category || 'Uncategorized';
      if (!skillsByCategory[category]) {
        skillsByCategory[category] = [];
      }
      skillsByCategory[category].push(skill.name);
    });
    Object.entries(skillsByCategory).forEach(([category, skillNames]) => {
      contextString += `- ${category}: ${skillNames.join(', ')}\n`;
    });
  }
  
  if (context.categories && context.categories.length > 0) {
    contextString += `\nAll Categories: ${context.categories.join(', ')}\n`;
  }
  
  if (context.existingContent && context.existingContent.length > 0) {
    contextString += `\nExisting Content (${context.existingContent.length} posts):\n`;
    context.existingContent.slice(0, 20).forEach((content, idx) => {
      contextString += `${idx + 1}. [${content.type}] ${content.title}`;
      if (content.excerpt) {
        contextString += ` - ${content.excerpt.substring(0, 100)}`;
      }
      contextString += '\n';
    });
  }
  
  return contextString;
};

/**
 * Fallback questions when AI generation fails
 */
const fallbackQuestions = {
  'BLOG': [
    "What is the main topic or focus of your blog post?",
    "Who is your target audience and what's their knowledge level?",
    "What key points or insights do you want to cover?",
    "What tone and style would you prefer (professional, casual, technical)?"
  ],
  'PROJECT': [
    "What problem does this project solve or what need does it address?",
    "What technologies and tools did you use in this project?",
    "What are the key features and functionality of this project?",
    "What impact or results did this project achieve?"
  ],
  'EXPERIENCE': [
    "What was your main role and key responsibilities in this position?",
    "What technologies, tools, or skills did you use or develop?",
    "What were your main achievements or accomplishments?",
    "What impact did your work have on the company or project?"
  ],
  'SKILL': [
    "What is this skill or technology?",
    "What is your proficiency level with it?",
    "Where have you applied this skill?",
    "What related technologies do you use with it?"
  ]
};

/**
 * Utility prompts for extracting information from conversations
 */
const utilityPrompts = {
  // Extract title from conversation
  extractTitle: (contentType, conversationText) => `Based on this conversation about a ${contentType}, generate a concise, compelling title. Return ONLY the title text, nothing else.

Conversation:
${conversationText}

Guidelines:
- For PROJECT: Focus on the project name or what it does (e.g., "Task Manager App", "Portfolio Website Generator")
- For EXPERIENCE: Use format "[Position] at [Company]" or "[Degree] in [Field]" (e.g., "Software Developer at Telaeris", "Bachelor's in Computer Science")
- For BLOG: Create an engaging title that captures the main topic (e.g., "Building Scalable APIs with Node.js")
- For SKILL: Use the skill/technology name (e.g., "React", "Machine Learning")
- Keep it under 60 characters
- Make it clear and specific

Return ONLY the title text, no quotes, no formatting, no explanations.`,

  // Infer content type
  inferContentType: (conversationText, infoText) => `Analyze this conversation and determine what type of portfolio content the user wants to create. Return ONLY one word: PROJECT, BLOG, EXPERIENCE, or SKILL.

Conversation:
${conversationText}
${infoText ? `\nInitial Info: ${infoText}` : ''}

CRITICAL CLASSIFICATION RULES:
- EXPERIENCE: Job roles, responsibilities, work at a company, internship, employment, education, degree, certification, university, school
  * Key indicators: "worked at", "role at", "position", "responsibilities", "job", "employed", "intern", "studied at", "degree from"
  * User describes THEIR work/role at an organization
  
- PROJECT: Building/creating something technical, software, app, website, hackathon project, side project
  * Key indicators: "built", "created", "developed", "project", "app", "website", "GitHub", "features", "deployed"
  * User describes something they MADE/BUILT
  
- BLOG: Writing an article, tutorial, story, or sharing insights/experiences in written form
  * Key indicators: "write about", "article", "blog post", "tutorial", "share my experience with", "want to write"
  * User wants to WRITE ABOUT something, not describe their role
  
- SKILL: Describing a technology, tool, programming language, or skill itself
  * Key indicators: "skill", "technology", "programming language", "tool", "proficiency"

DISAMBIGUATION:
- "My experience at [Company]" with role descriptions → EXPERIENCE (not BLOG)
- "I want to write about my time at [Company]" → Could be BLOG if focused on storytelling
- "Software Developer at [Company]" with responsibilities → EXPERIENCE
- "Built an app that..." → PROJECT

Return ONLY the word (PROJECT, BLOG, EXPERIENCE, or SKILL), nothing else.`,

  // Extract metadata prompts
  extractMetadata: {
    'PROJECT': (conversationText) => `Extract structured metadata from the following conversation about a PROJECT. Return ONLY a valid JSON object with these fields (use null for missing values):
{
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "isOngoing": true/false,
  "featuredImage": "URL or null",
  "projectLinks": {
    "github": "URL or null",
    "devpost": "URL or null",
    "other": ["URL1", "URL2"] or []
  },
  "contributors": ["Name1", "Name2"] or []
}

Conversation:
${conversationText}

Return ONLY the JSON object, no other text.`,
    
    'EXPERIENCE': (conversationText) => `Extract structured metadata from the following conversation about an EXPERIENCE. Return ONLY a valid JSON object with these fields (use null for missing values):
{
  "experienceCategory": "JOB" or "EDUCATION" or "CERTIFICATION" or null,
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "isOngoing": true/false,
  "location": "City, State or null",
  "locationType": "REMOTE" or "HYBRID" or "ONSITE" or null,
  "roles": [
    {
      "title": "Role title (e.g., Software Engineer, Senior Developer)",
      "description": "Role description or null",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD or null",
      "isCurrent": true/false,
      "skills": ["Skill name 1", "Skill name 2"] or []
    }
  ] or []
}

IMPORTANT: If the user mentions multiple roles or positions at the same company/institution, extract them as separate role objects in the roles array. Each role should have its own title, dates, and skills.

Conversation:
${conversationText}

Return ONLY the JSON object, no other text.`,
    
    'SKILL': (conversationText) => `Extract structured metadata from the following conversation about a SKILL. Return ONLY a valid JSON object with these fields (use null for missing values):
{
  "categoryTag": "Category name or null"
}

Conversation:
${conversationText}

Return ONLY the JSON object, no other text.`,
    
    'BLOG': (conversationText) => `Extract structured metadata from the following conversation about a BLOG post. Return ONLY a valid JSON object (can be empty {}):
{}

Conversation:
${conversationText}

Return ONLY the JSON object, no other text.`
  },

  // Multiple posts check
  shouldCreateMultiplePosts: (conversationText, primaryType) => `Based on this conversation, determine if the user wants to create multiple linked posts (e.g., a project + blog post, or project + skills).

Conversation:
${conversationText}

Primary type: ${primaryType}

Return ONLY "yes" or "no". Return "yes" if the user wants to create multiple posts that should be linked together (e.g., a project with related blog post, or project with skills). Return "no" if they only want one post.`,

  // Generate multiple posts
  generateMultiplePosts: (conversationText) => `Based on this conversation, determine what additional posts should be created and linked to the primary post.

Conversation:
${conversationText}

Return ONLY a JSON array of post types that should be created. Example: ["BLOG", "SKILL"] or ["PROJECT"] or [].
Only return post types if the user explicitly wants them or if they naturally complement the primary post.
Return an empty array [] if only one post is needed.`
};

module.exports = {
  getCurrentDateTime,
  buildContextString,
  fallbackQuestions,
  utilityPrompts
};

