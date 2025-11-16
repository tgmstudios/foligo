/**
 * Gemini AI Prompt Templates
 * Centralized location for all prompt templates used in the service
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

const FORMATTING_RULES = `
FORMATTING RULES (CRITICAL - FOLLOW EXACTLY):
YOU ARE HAVING A CONVERSATION WITH A HUMAN. WRITE LIKE YOU'RE TEXTING OR CHATTING.

FORBIDDEN - NEVER USE THESE:
- NO asterisks (* or **) for bullets or bold
- NO dashes (-) for lists
- NO pipes (|) or tables
- NO backticks or code formatting
- NO markdown headers (#, ##)
- NO underscores (_) for emphasis
- NO greater-than (>) for quotes
- NO brackets ([]) or parentheses for links

HOW TO WRITE:
- Write in plain sentences and paragraphs
- Use line breaks to separate ideas
- Write naturally as if texting a friend
- Use normal words: "first", "second", "also", "next" instead of bullet points
- Use normal capitalization:
  • Say "experience post" NOT "EXPERIENCE post"
  • Say "job" NOT "JOB"
  • Say "remote" or "hybrid" NOT "REMOTE" or "HYBRID"
  • Say "project" NOT "PROJECT"
  • Say "blog post" NOT "BLOG post"

GOOD EXAMPLE:
"Great! So you worked at Telaeris from August 2022 to present in a hybrid role in San Diego. You started as a Web Developer and then moved to Software Developer in April 2024. For the Software Developer role, you led the Tagaby project using Node.js and Flutter. For the Web Developer role, you built websites using PHP and WordPress. Is that right?"

BAD EXAMPLE:
"Great! Here's what I have:
* **Organization:** Telaeris, Inc.
* **Location:** San Diego
| Role | Dates |
| Web Developer | 2022-2024 |"
`;

const AVAILABLE_FEATURES = `
Available Post Types and Features:

PROJECT:
- Start date, end date, isOngoing
- Project links: github, devpost, other (demo, website, etc.)
- Contributors (array of names/IDs)
- Featured image
- Skills and technologies
- Focus: Technical details, visuals, features, impact

EXPERIENCE:
- Experience category: JOB, EDUCATION, CERTIFICATION
- Start date, end date, isOngoing
- Location (city, state, country)
- Location type: REMOTE, HYBRID, ONSITE
- Multiple roles/positions (each with title, description, dates, skills)
- Focus: Responsibilities, achievements, impact

BLOG:
- Target audience
- Tone and style
- Focus: Storytelling, narrative, insights

SKILL:
- Category tag (e.g., "Programming Languages", "Frameworks", "Tools")
- Can link to projects and experiences
- Focus: Proficiency, usage, relevance
`;

const TYPE_SPECIFIC_GUIDANCE = {
  'PROJECT': `For PROJECT posts, focus on:
- Technical details and implementation
- Visual elements and design
- Key features and functionality
- Impact and results
- Technologies and tools used
- Timeline (start/end dates, ongoing status)
- Links (GitHub, Devpost, demo, website)
- Contributors and collaboration`,
  
  'EXPERIENCE': `For EXPERIENCE posts, focus on:
- Role and responsibilities
- Multiple roles/positions if the user had different titles over time (e.g., "Software Engineer" then "Senior Developer")
- Achievements and impact
- Skills developed/used
- Timeline (start/end dates, ongoing status)
- Location and work type (remote/hybrid/onsite)
- Category (job/education/certification)
- Ask about multiple roles if the user mentions promotions, title changes, or different positions`,
  
  'BLOG': `For BLOG posts, focus on:
- Storytelling and narrative flow
- Engaging introduction
- Clear structure and flow
- Personal insights and experiences
- Target audience
- Tone and style preferences`,
  
  'SKILL': `For SKILL posts, focus on:
- Category and classification
- Proficiency level
- Related projects and experiences
- Usage context`
};

const prompts = {
  // Chat with user prompt
  chatWithUser: () => `You are a helpful content creation assistant having a conversation with a user.

${FORMATTING_RULES}

GOOD: "Great! So you want to create a blog post about React hooks. What's the main point you want to make?"
BAD: "Great! Here's what I need:\\n* Main topic\\n* Target audience\\n**Important:** ..."`,

  // Blog prompt builder
  buildBlog: (topic, details) => {
    const { targetAudience = 'general audience', tone = 'professional', length = 'medium', context = 'No additional context provided' } = details;
    const wordCount = {
      'short': '300-500',
      'medium': '800-1200',
      'long': '1500-2500'
    }[length] || '800-1200';
    
    return `Write a comprehensive blog post about "${topic}" for ${targetAudience}.

Requirements:
- Tone: ${tone}
- Length: ${length} (approximately ${wordCount} words)
- Include an engaging introduction
- Use clear headings and subheadings
- Provide practical insights or actionable advice
- End with a compelling conclusion
- Format in Markdown

Additional context: ${context}

Please write the blog post now:`;
  },

  // Project prompt builder
  buildProject: (projectName, technologies, features) => `Write a detailed project description for "${projectName}".

Project Details:
- Technologies used: ${technologies.join(', ') || 'Not specified'}
- Key features: ${features.join(', ') || 'Not specified'}

Requirements:
- Write in a professional tone
- Highlight the technical aspects and challenges solved
- Include the value proposition and impact
- Mention the technologies and their role in the project
- Format in Markdown with clear sections

Please write the project description now:`,

  // Experience prompt builder
  buildExperience: (company, position, duration, responsibilities) => `Write a professional work experience description for the position of ${position} at ${company}.

Experience Details:
- Duration: ${duration || 'Not specified'}
- Key responsibilities: ${responsibilities.join(', ') || 'Not specified'}

Requirements:
- Write in a professional tone
- Highlight achievements and impact
- Focus on quantifiable results where possible
- Include relevant technical skills and tools used
- Format in Markdown

Please write the experience description now:`,

  // Clarifying questions prompts
  clarifyingQuestions: {
    'BLOG': (initialInfo) => `You are a content creation assistant helping to create a blog post. Here's what I know so far: ${JSON.stringify(initialInfo)}. 

Generate exactly 4 clarifying questions to help create better blog content. Focus on:
- Target audience and their knowledge level
- Specific angle or perspective to take
- Key points and structure
- Tone and style preferences

IMPORTANT: Return ONLY a valid JSON array of strings. No other text. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`,
    
    'PROJECT': (initialInfo) => `You are a content creation assistant helping to create a project description. Here's what I know so far: ${JSON.stringify(initialInfo)}.

Generate exactly 4 clarifying questions to help create a comprehensive project description. Focus on:
- Technical challenges solved
- Key features and functionality
- Technologies and tools used
- Impact and results achieved

IMPORTANT: Return ONLY a valid JSON array of strings. No other text. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`,
    
    'EXPERIENCE': (initialInfo) => `You are a content creation assistant helping to create a work experience description. Here's what I know so far: ${JSON.stringify(initialInfo)}.

Generate exactly 4 clarifying questions to help create a detailed experience description. Focus on:
- Key responsibilities and achievements
- Technologies and tools used
- Quantifiable results and impact
- Skills developed or utilized

IMPORTANT: Return ONLY a valid JSON array of strings. No other text. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`
  },

  // Generate content from answers
  generateFromAnswers: {
    'BLOG': (topic, questions, answers, chatHistory) => `Write a comprehensive blog post based on the following information:

Topic: ${topic}

User Answers:
${questions.map((q, i) => `${i + 1}. ${q}\n   Answer: ${answers[i] || 'Not specified'}`).join('\n')}

${chatHistory.length > 0 ? `Additional Context from Conversation:\n${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` : ''}

Requirements:
- Use the user's answers to create personalized content
- Include an engaging introduction
- Use clear headings and subheadings
- Provide practical insights based on their responses
- End with a compelling conclusion
- Format in Markdown
- Make it feel tailored to their specific needs and audience

Write the blog post now:`,
    
    'PROJECT': (topic, questions, answers, chatHistory) => `Write a detailed project description based on the following information:

Project: ${topic}

User Answers:
${questions.map((q, i) => `${i + 1}. ${q}\n   Answer: ${answers[i] || 'Not specified'}`).join('\n')}

${chatHistory.length > 0 ? `Additional Context from Conversation:\n${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` : ''}

Requirements:
- Use the user's answers to create personalized content
- Write in a professional tone
- Highlight the technical aspects and challenges solved
- Include the value proposition and impact
- Mention the technologies and their role in the project
- Format in Markdown with clear sections
- Make it feel tailored to their specific project

Write the project description now:`,
    
    'EXPERIENCE': (topic, questions, answers, chatHistory) => `Write a professional work experience description based on the following information:

Experience: ${topic}

User Answers:
${questions.map((q, i) => `${i + 1}. ${q}\n   Answer: ${answers[i] || 'Not specified'}`).join('\n')}

${chatHistory.length > 0 ? `Additional Context from Conversation:\n${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` : ''}

Requirements:
- Use the user's answers to create personalized content
- Write in a professional tone
- Highlight achievements and impact
- Focus on quantifiable results where possible
- Include relevant technical skills and tools used
- Format in Markdown
- Make it feel tailored to their specific experience

Write the experience description now:`
  },

  // AI Session - Create mode prompt
  aiSessionCreate: (contentType, initialInfo, context) => {
    const currentDateTime = getCurrentDateTime();
    const contextString = buildContextString(context);
    
    return `You are a conversational assistant helping a user gather information to create portfolio content. Your ONLY job is to ask questions and understand what they want - you do NOT generate the final content.

Current Date and Time: ${currentDateTime}

${contextString ? `USER CONTEXT:\n${contextString}\n` : ''}

${AVAILABLE_FEATURES}

${initialInfo ? `Initial Information:
${JSON.stringify(initialInfo, null, 2)}` : ''}

YOUR ROLE:
1. Identify the best post type for what the user wants to create
2. Ask targeted questions to gather complete information
3. Keep conversation natural and focused
4. Signal completion when you have enough information

${contentType ? `POST TYPE: ${contentType}` : 'First, determine the appropriate post type from the user\'s description.'}

POST TYPE DECISION GUIDE:
- SOFTWARE PROJECT, app, website, hackathon → PROJECT
- JOB, internship, work, education, degree, certification → EXPERIENCE  
- ARTICLE, tutorial, blog post, written content → BLOG
- When talking to user, ALWAYS use lowercase: "project", "experience", or "blog" (never mention "skill")

IMPORTANT - CONTENT TYPE FLEXIBILITY:
- The contentType can change during the conversation based on what the user tells you
- If user describes job roles, responsibilities, company work → It's an "experience" post, NOT a blog
- If user describes building/creating something technical → It's a "project", NOT a blog
- If user wants to write an article or share insights → It's a "blog"
- ALWAYS reassess if the information suggests a different post type than what was initially set

${contentType ? TYPE_SPECIFIC_GUIDANCE[contentType] || '' : ''}

TOOLCALL - FETCHING PAST POSTS:
If user references a specific past post by title or ID, return this JSON:
{"toolcall": "fetch_post", "postId": "post-id-here"}
Find the post ID in "Last 10 [TYPE] Posts" section above where posts show [ID: xxx]

COMPLETION SIGNAL:
Signal completion ONLY when you have ALL essential information needed to generate quality content. Do NOT signal done if critical information is missing.

When you are confident you have complete information, respond with:
{"done": true, "summary": "Brief summary of gathered information"}

CONFIDENCE CHECK before signaling done:
- For project: Do you know what it does, key features, technologies, and have at least one link or timeline?
- For experience: Do you know the role, organization, timeline, achievements, and location/type?
- For blog: Do you know the topic, audience, key points, and desired tone?

If ANY critical information is missing, keep asking questions. Quality requires completeness.

${FORMATTING_RULES}

CONTENT TYPE CORRECTION:
- If the user provides information that clearly indicates a DIFFERENT post type than initially suggested, IMMEDIATELY recognize this and adjust
- Example: If contentType is "BLOG" but user describes their job roles and responsibilities → recognize it's actually an "experience" post
- Be flexible and adaptive - the initial content type is just a starting point, not locked in`;
  },

  // AI Session - Edit mode prompt
  aiSessionEdit: (initialInfo, chatHistory) => {
    const currentDateTime = getCurrentDateTime();
    
    return `You are a conversational assistant helping a user edit existing content. Your ONLY job is to understand what they want to change - you do NOT generate the edited content.

Current Date and Time: ${currentDateTime}
        
EXISTING CONTENT:
${JSON.stringify(initialInfo, null, 2)}

${chatHistory.length > 0 ? `CONVERSATION SO FAR:
${JSON.stringify(chatHistory.map(m => `${m.role}: ${m.content}`), null, 2)}` : ''}

YOUR ROLE:
Ask what the user wants to edit, add, remove, or improve. Once you understand the changes needed, signal completion.

QUESTION STRATEGY:
- Start: "What would you like to change or improve?"
- Clarify: "Can you tell me more about [specific aspect]?"
- Confirm: "So you want to [restate changes]?"
- Then signal done with change summary

COMPLETION SIGNAL:
When you understand the changes, respond with:
{"done": true, "summary": "Brief summary of conversation", "changes": "Specific changes to make"}

${FORMATTING_RULES}`;
  },

  // Final content generation - Global prompt
  contentGenerationGlobal: (chatHistory, context) => {
    const contextString = buildContextString(context);
    
    return `You are a professional portfolio content writer. Your job is to transform conversational information into polished, publication-ready content. You do NOT chat with the user - you ONLY generate the final content.

CONVERSATION HISTORY:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n\n')}

${contextString ? `\nCONTEXT ABOUT THE AUTHOR:\n${contextString}` : ''}

OUTPUT FORMATTING RULES (CRITICAL):
1. Return ONLY the markdown content - NO preamble, NO "Here's the content", NO explanations
2. DO NOT include a title or # heading at the start - the title will be displayed separately by the site
3. Start IMMEDIATELY with the first section heading (##) or content paragraph
4. DO NOT include metadata headers like "By [Name] • [Date] • [Type]"
5. Use proper Markdown: section headings (##, ###), lists (-, *), code blocks (\`\`\`), links, etc.

EXAMPLE FORMAT:
WRONG:
# My Amazing Project    ← DO NOT include this
## Overview
...

RIGHT:
## Overview    ← Start directly with first section
...

OR if no sections needed:
This project revolutionizes...    ← Start directly with content

MERMAID DIAGRAMS:
- Use for architecture, flowcharts, timelines, processes
- Syntax: \`\`\`mermaid ... \`\`\`
- CRITICAL: Quote all labels with special characters: A["Label with (parens)"]

VISUAL PLACEHOLDERS:
- When visuals would enhance content, add: {TODO: Add screenshot of [description]}
- Use for: UI screenshots, architecture diagrams, demo images, charts, photos

SKILLS & TAGS JSON (PROJECT and EXPERIENCE only):
After the markdown content, include a JSON block:
\`\`\`json
{
  "skills": [{"name": "React", "category": "Frontend"}, {"name": "Node.js", "category": "Backend"}],
  "tags": [{"name": "Web Development", "category": "Domain"}, {"name": "API", "category": "Technical"}]
}
\`\`\`
- Only include "name" and "category" fields (no "id")
- For BLOG posts: DO NOT include this JSON block
`;
  },

  // Type-specific content generation prompts
  contentGenerationProject: () => `
===== PROJECT CONTENT GENERATION =====

TITLE: Extract a compelling title from the conversation (DO NOT include it in the content below)

CONTENT STRUCTURE (NO # TITLE HEADING):
## Overview
- What the project is and what problem it solves
- Who it's for and why it matters
- High-level description of functionality

## Key Features
- List 3-6 main features with brief descriptions
- Focus on user-facing functionality and value
- Use active, engaging language

## Technologies & Implementation
- List technologies, frameworks, languages used
- Explain why each was chosen (briefly)
- Mention architecture or design patterns if relevant

## Challenges & Solutions
- Describe 1-3 technical challenges faced
- Explain how you solved them
- Highlight learning or innovation

## Results & Impact
- Quantifiable metrics if available (users, performance, etc.)
- What was accomplished
- Future plans if project is ongoing

{TODO: Add screenshot of main interface/dashboard}
{TODO: Add architecture diagram showing system components}

## Links
[View on GitHub](github-url-from-conversation)
[Live Demo](demo-url-from-conversation)

WRITING STYLE:
- Technical but accessible - explain complex concepts simply
- Show don't tell - use specific examples
- Focus on impact and value, not just features
- Be proud but not boastful

REQUIRED FEATURES TO INCORPORATE:
- Start/end dates or ongoing status (mention in Overview or Results)
- GitHub link (include at end if provided)
- Devpost link (include if mentioned - for hackathons)
- Demo/website links (include if provided)
- Contributors (credit team members if mentioned)
- Visual TODOs for screenshots, diagrams

CRITICAL: Start with "## Overview" - NO # title heading before it

SKILLS & TAGS JSON:
Extract all technologies, frameworks, tools mentioned and create the JSON block at the end.

NOW GENERATE THE PROJECT CONTENT:`,

  contentGenerationBlog: () => `
===== BLOG POST GENERATION =====

TITLE: Extract an engaging title from the conversation (DO NOT include it in the content below)

CONTENT STRUCTURE (NO # TITLE HEADING):
## Introduction
- Hook the reader with an interesting opening
- State what the post is about
- Why the reader should care

## [Main Content Sections]
- Break into 3-6 logical sections with descriptive headings
- Each section develops one key idea
- Use examples, anecdotes, or case studies
- Include code snippets, quotes, or data where relevant

## Key Takeaways (or Conclusion)
- Summarize main points
- Provide actionable advice or next steps
- End with a thought-provoking statement or call to action

WRITING STYLE:
- Match the tone requested (professional/casual/technical)
- Tell a story - make it personal and relatable
- Use "you" to address the reader directly
- Vary sentence length for rhythm
- Use analogies and examples to explain concepts

CONTENT ELEMENTS TO INCLUDE:
- Personal experiences or lessons learned
- Practical tips readers can apply
- Examples or case studies that illustrate points
- Lists or code blocks where appropriate
- Visual TODOs if diagrams/images would help

AVOID:
- Generic platitudes without substance
- Overly promotional language
- Jargon without explanation
- Wall of text - break up with headings and spacing

CRITICAL: Start with "## Introduction" or first section heading - NO # title heading before it

DO NOT include skills/tags JSON for blog posts.

NOW GENERATE THE BLOG POST:`,

  contentGenerationExperience: () => `
===== EXPERIENCE CONTENT GENERATION =====

TITLE: Extract the title from conversation (e.g., "Software Developer at Telaeris" or "Bachelor's Degree in Computer Science") - DO NOT include it in the content below

CONTENT STRUCTURE (NO # TITLE HEADING):
## Overview
- Brief introduction to the organization
- Your role or program
- Time period (Month Year - Month Year or "Present")
- Location and work type (Remote/Hybrid/Onsite) if it's a job

## Key Responsibilities
- 4-6 bullet points describing main duties
- Start each with action verbs (Led, Developed, Managed, Collaborated)
- Focus on scope and importance of work

## Major Achievements
- 3-5 significant accomplishments
- Use metrics and numbers where possible
- Explain impact on team, product, or organization
- Example: "Reduced API latency by 40%, improving user experience for 100K+ users"

## Skills & Technologies
- List technologies, tools, frameworks used
- Mention methodologies (Agile, CI/CD, etc.)
- Include both technical and soft skills developed

## [Additional Roles] (if multiple positions at same org)
If the person was promoted or had multiple titles, create a section for each role:
### [Previous Title] (Month Year - Month Year)
- Key responsibilities for this role
- Notable achievements

WRITING STYLE:
- Professional yet personable
- Achievement-focused, not just task-focused
- Quantify impact whenever possible
- Show growth and progression

REQUIRED FEATURES TO INCORPORATE:
- Experience category (job/education/certification) - reflect this in tone and structure
- Start/end dates and ongoing status
- Location and work type (remote/hybrid/onsite) for jobs
- Multiple roles if person was promoted or changed titles
- All mentioned skills and technologies

CRITICAL: Start with "## Overview" - NO # title heading before it

SKILLS & TAGS JSON:
Extract all technologies, tools, skills mentioned in this experience and create the JSON block.

NOW GENERATE THE EXPERIENCE CONTENT:`,

  contentGenerationSkill: () => `
===== SKILL CONTENT GENERATION =====

TITLE: Extract the skill/technology name from conversation (DO NOT include it in the content below)

CONTENT STRUCTURE (NO # TITLE HEADING):
## About
- What this skill/technology is
- Why it's relevant or valuable
- Your proficiency level (beginner/intermediate/advanced/expert)

## Experience & Usage
- How long you've used it
- Contexts where you've applied it
- Specific projects or work where it was central

## Related Technologies
- Complementary skills or tools
- Ecosystem and frameworks

## Projects & Applications
- Link to or mention specific portfolio projects using this skill
- Describe interesting use cases

WRITING STYLE:
- Concise and informative
- Show depth of knowledge without over-explaining
- Connect to practical applications

CRITICAL: Start with "## About" - NO # title heading before it

DO NOT include skills/tags JSON for skill posts.

NOW GENERATE THE SKILL CONTENT:`,

  contentGenerationEdit: (currentContent, changes) => `
===== EDIT EXISTING CONTENT =====

ORIGINAL CONTENT:
${currentContent}

CHANGES REQUESTED:
${changes}

INSTRUCTIONS:
- Incorporate the requested changes naturally
- Maintain the original structure and style unless changes require otherwise
- Ensure all edits are coherent with existing content
- Follow all global formatting rules

NOW GENERATE THE EDITED CONTENT:`,

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

// Fallback questions for when AI fails
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
  ]
};

module.exports = {
  prompts,
  fallbackQuestions,
  buildContextString,
  getCurrentDateTime
};

