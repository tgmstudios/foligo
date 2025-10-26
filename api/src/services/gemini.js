const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY not found in environment variables');
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    // Using gemini-flash-latest for clarifying questions
    this.flashModel = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    // Using gemini-2.5-pro for writeup/generation
    this.proModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  }

  async generateContent(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const generationConfig = {
        temperature: options.temperature || 0.7,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
        maxOutputTokens: options.maxOutputTokens || 2048,
      };

      const result = await this.flashModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async generateBlogPost(topic, details = {}) {
    const prompt = this.buildBlogPrompt(topic, details);
    return this.generateContent(prompt, { temperature: 0.8 });
  }

  async generateProjectDescription(projectName, technologies = [], features = []) {
    const prompt = this.buildProjectPrompt(projectName, technologies, features);
    return this.generateContent(prompt, { temperature: 0.7 });
  }

  async generateExperienceDescription(company, position, duration, responsibilities = []) {
    const prompt = this.buildExperiencePrompt(company, position, duration, responsibilities);
    return this.generateContent(prompt, { temperature: 0.6 });
  }

  async chatWithUser(messages) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Build a conversational prompt
      const systemPrompt = `You are a helpful content creation assistant. You're having a conversation with a user to help them create better content. Be conversational, helpful, and ask follow-up questions when needed. Keep responses concise but informative.`;
      
      // Format messages for Gemini
      const formattedMessages = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      ];

      const result = await this.flashModel.generateContent({
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw new Error(`Failed to chat: ${error.message}`);
    }
  }

  async generateContentFromAnswers(contentType, topic, answers, questions, chatHistory = []) {
    const prompts = {
      'BLOG': `Write a comprehensive blog post based on the following information:

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
      
      'PROJECT': `Write a detailed project description based on the following information:

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
      
      'EXPERIENCE': `Write a professional work experience description based on the following information:

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
    };

    const prompt = prompts[contentType] || prompts['BLOG'];
    return this.generateContent(prompt, { temperature: 0.8 });
  }

  buildBlogPrompt(topic, details) {
    const { targetAudience = 'general audience', tone = 'professional', length = 'medium' } = details;
    
    return `Write a comprehensive blog post about "${topic}" for ${targetAudience}.

Requirements:
- Tone: ${tone}
- Length: ${length} (approximately ${this.getWordCount(length)} words)
- Include an engaging introduction
- Use clear headings and subheadings
- Provide practical insights or actionable advice
- End with a compelling conclusion
- Format in Markdown

Additional context: ${details.context || 'No additional context provided'}

Please write the blog post now:`;
  }

  buildProjectPrompt(projectName, technologies, features) {
    return `Write a detailed project description for "${projectName}".

Project Details:
- Technologies used: ${technologies.join(', ') || 'Not specified'}
- Key features: ${features.join(', ') || 'Not specified'}

Requirements:
- Write in a professional tone
- Highlight the technical aspects and challenges solved
- Include the value proposition and impact
- Mention the technologies and their role in the project
- Format in Markdown with clear sections

Please write the project description now:`;
  }

  buildExperiencePrompt(company, position, duration, responsibilities) {
    return `Write a professional work experience description for the position of ${position} at ${company}.

Experience Details:
- Duration: ${duration || 'Not specified'}
- Key responsibilities: ${responsibilities.join(', ') || 'Not specified'}

Requirements:
- Write in a professional tone
- Highlight achievements and impact
- Focus on quantifiable results where possible
- Include relevant technical skills and tools used
- Format in Markdown

Please write the experience description now:`;
  }

  getWordCount(length) {
    const counts = {
      'short': '300-500',
      'medium': '800-1200',
      'long': '1500-2500'
    };
    return counts[length] || '800-1200';
  }

  async generateClarifyingQuestions(contentType, initialInfo = {}) {
    const prompts = {
      'BLOG': `You are a content creation assistant helping to create a blog post. Here's what I know so far: ${JSON.stringify(initialInfo)}. 

Generate exactly 4 clarifying questions to help create better blog content. Focus on:
- Target audience and their knowledge level
- Specific angle or perspective to take
- Key points and structure
- Tone and style preferences

IMPORTANT: Return ONLY a valid JSON array of strings. No other text. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`,
      
      'PROJECT': `You are a content creation assistant helping to create a project description. Here's what I know so far: ${JSON.stringify(initialInfo)}.

Generate exactly 4 clarifying questions to help create a comprehensive project description. Focus on:
- Technical challenges solved
- Key features and functionality
- Technologies and tools used
- Impact and results achieved

IMPORTANT: Return ONLY a valid JSON array of strings. No other text. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`,
      
      'EXPERIENCE': `You are a content creation assistant helping to create a work experience description. Here's what I know so far: ${JSON.stringify(initialInfo)}.

Generate exactly 4 clarifying questions to help create a detailed experience description. Focus on:
- Key responsibilities and achievements
- Technologies and tools used
- Quantifiable results and impact
- Skills developed or utilized

IMPORTANT: Return ONLY a valid JSON array of strings. No other text. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`
    };

    const prompt = prompts[contentType] || prompts['BLOG'];
    
    try {
      const response = await this.generateContent(prompt, { temperature: 0.3 });
      
      // Clean the response to extract JSON
      let cleanedResponse = response.trim();
      
      // Remove any markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Try to find JSON array in the response
      const jsonMatch = cleanedResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      const questions = JSON.parse(cleanedResponse);
      
      // Validate that it's an array of strings
      if (Array.isArray(questions) && questions.every(q => typeof q === 'string')) {
        return questions;
      } else {
        throw new Error('Invalid format');
      }
    } catch (error) {
      console.error('Failed to parse clarifying questions:', error);
      
      // Fallback questions based on content type
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
      
      return fallbackQuestions[contentType] || fallbackQuestions['BLOG'];
    }
  }

  async askNextQuestion(contentType, currentInfo, chatHistory, questionNumber, maxQuestions) {
    const prompts = {
      'BLOG': `You are a content creation assistant helping to create a blog post. Here's the current information about the blog:

Current Blog Info: ${JSON.stringify(currentInfo)}

Chat History: ${JSON.stringify(chatHistory)}

This is question ${questionNumber} of ${maxQuestions}. Based on the conversation so far and the current blog information, ask ONE specific, helpful question to gather more information for creating better blog content.

Focus on:
- Target audience and their knowledge level
- Specific angle or perspective to take
- Key points and structure
- Tone and style preferences

Ask a natural, conversational question that builds on what you already know. Don't repeat information you already have.`,
      
      'PROJECT': `You are a content creation assistant helping to create a project description. Here's the current information about the project:

Current Project Info: ${JSON.stringify(currentInfo)}

Chat History: ${JSON.stringify(chatHistory)}

This is question ${questionNumber} of ${maxQuestions}. Based on the conversation so far and the current project information, ask ONE specific, helpful question to gather more information for creating a better project description.

Focus on:
- Technical challenges solved
- Key features and functionality
- Technologies and tools used
- Impact and results achieved

Ask a natural, conversational question that builds on what you already know. Don't repeat information you already have.`,
      
      'EXPERIENCE': `You are a content creation assistant helping to create a work experience description. Here's the current information about the experience:

Current Experience Info: ${JSON.stringify(currentInfo)}

Chat History: ${JSON.stringify(chatHistory)}

This is question ${questionNumber} of ${maxQuestions}. Based on the conversation so far and the current experience information, ask ONE specific, helpful question to gather more information for creating a better experience description.

Focus on:
- Key responsibilities and achievements
- Technologies and tools used
- Quantifiable results and impact
- Skills developed or utilized

Ask a natural, conversational question that builds on what you already know. Don't repeat information you already have.`
    };

    const prompt = prompts[contentType] || prompts['BLOG'];
    
    try {
      const response = await this.generateContent(prompt, { temperature: 0.7 });
      return response.trim();
    } catch (error) {
      console.error('Failed to generate question:', error);
      
      // Fallback questions based on content type and question number
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
      
      const questions = fallbackQuestions[contentType] || fallbackQuestions['BLOG'];
      return questions[questionNumber - 1] || questions[questions.length - 1];
    }
  }

  // New method for multi-step AI session - handles clarifying questions and completion detection
  async handleAISession(mode, contentType, initialInfo, chatHistory) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const isEditMode = mode === 'edit';
      const prompts = {
        'create': `You are a helpful content creation assistant. The user wants to create a new ${contentType} post.
        
${initialInfo ? `Initial Information Provided:
${JSON.stringify(initialInfo, null, 2)}` : ''}

${isEditMode ? '' : `Start by asking basic questions about:
1. What should the title be?
2. What kind of post is this (blog post, project description, experience, etc.)?
3. What is this about in brief?

Then ask clarifying questions to better understand what the user wants to create.`}

${isEditMode ? `The user is editing an existing ${contentType}. Current content details:
${JSON.stringify(initialInfo, null, 2)}

Ask what they want to edit or focus more on in their existing content.` : ''}

CRITICAL INSTRUCTIONS:
- Use plain text ONLY - NO markdown formatting, NO code blocks, NO special characters
- Write naturally and conversationally as if speaking
- After you've gathered enough information (typically 3-6 questions), you MUST indicate you're done by responding with a JSON block in this exact format:
{"done": true, "summary": "Brief summary of what was discussed"}

You can keep asking questions until you have enough information. Be conversational and helpful.`,

        'edit': `You are a helpful content editing assistant. The user is editing an existing ${contentType}.
        
Existing Content Information:
${JSON.stringify(initialInfo, null, 2)}

${chatHistory.length > 0 ? `Conversation History:
${JSON.stringify(chatHistory.map(m => `${m.role}: ${m.content}`), null, 2)}` : ''}

Ask what the user wants to edit or focus more on. After you understand what needs to be changed, you MUST indicate you're done by responding with a JSON block in this exact format:
{"done": true, "summary": "Brief summary of what needs to be changed/added", "changes": "Description of what should be changed or added"}

CRITICAL INSTRUCTIONS:
- Use plain text ONLY - NO markdown formatting, NO code blocks, NO special characters
- Write naturally and conversationally as if speaking

Be conversational and helpful.`
      };

      const systemPrompt = prompts[mode] || prompts['create'];
      
      // Build conversation history with system prompt
      const formattedMessages = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...chatHistory.slice(-10).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      ];

      const result = await this.flashModel.generateContent({
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });

      const response = await result.response;
      const responseText = response.text();
      
      // Check if the AI is done asking questions
      const doneRegex = /{"done"\s*:\s*true[^}]*}/;
      const doneMatch = responseText.match(doneRegex);
      
      if (doneMatch) {
        try {
          const doneInfo = JSON.parse(doneMatch[0]);
          return {
            message: responseText,
            done: true,
            summary: doneInfo.summary,
            changes: doneInfo.changes || null
          };
        } catch (e) {
          // If JSON parse fails, assume we're done based on the presence of the pattern
          return {
            message: responseText,
            done: true,
            summary: 'Conversation complete'
          };
        }
      }
      
      return {
        message: responseText,
        done: false
      };
    } catch (error) {
      console.error('AI session error:', error);
      throw new Error(`Failed to handle AI session: ${error.message}`);
    }
  }

  // New method for final content generation using pro model
  async generateFinalContent(mode, contentType, chatHistory, currentContent, changes) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompts = {
        'create': `You are a professional content writer. Based on the following conversation, create a comprehensive ${contentType}.

Conversation History:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n\n')}

CRITICAL INSTRUCTIONS:
- RETURN ONLY THE MARKDOWN CONTENT - NO introductory text, NO preamble, NO explanations
- Start directly with the content (typically with "# Title")
- Do NOT include phrases like "Of course", "Here is", or any explanations
- Format using Markdown
- Include proper headings and sections
- Make it professional and tailored to the user's needs
- Include a compelling title as the first heading (#)

Begin the content now:`,
        
        'edit': `You are a professional content editor. The user wants to edit their existing ${contentType}.

Current Content:
${currentContent}

Requested Changes:
${changes}

Conversation Context:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n\n')}

CRITICAL INSTRUCTIONS:
- RETURN ONLY THE MARKDOWN CONTENT - NO introductory text, NO preamble, NO explanations
- Start directly with the edited content
- Do NOT include phrases like "Of course", "Here is", or any explanations
- Edit the existing content based on the requested changes
- Maintain the original structure and style
- Incorporate the changes naturally
- Format using Markdown
- Keep the improvements from the conversation

Begin the edited content now:`
      };

      const prompt = prompts[mode] || prompts['create'];

      const result = await this.proModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      const response = await result.response;
      let content = response.text();
      
      // Clean up the content to remove any introductory text
      // Remove common intro phrases
      const introPatterns = [
        /^Of course\.[^\n]*\n/i,
        /^Here is[^\n]*\n/i,
        /^Sure\.[^\n]*\n/i,
        /^Certainly\.[^\n]*\n/i,
        /^Alright\.[^\n]*\n/i,
        /^I'll[^\n]*\n/i,
        /^I'll create[^\n]*\n/i,
        /^Here's[^\n]*\n/i,
        /^\*\*\*/g, // Remove asterisk dividers
        /^---$/gm // Remove markdown dividers at start
      ];
      
      for (const pattern of introPatterns) {
        content = content.replace(pattern, '');
      }
      
      content = content.trim();
      
      // Extract title from the first heading
      let title = 'Untitled';
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
        // Clean up common title issues
        title = title.replace(/^["']|["']$/g, ''); // Remove quotes
      }
      
      return { content, title };
    } catch (error) {
      console.error('Content generation error:', error);
      throw new Error(`Failed to generate final content: ${error.message}`);
    }
  }
}

module.exports = new GeminiService();
