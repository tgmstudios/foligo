/**
 * Structured-data extraction, title/content-type inference, and metadata
 * building for generated content.
 *
 * Functions that call the AI take an explicit `{ aiText, logger }` deps
 * object rather than reaching for `this` — see index.js for how the facade
 * wires these up.
 */
const { utilityPrompts } = require('../content/prompt-utils');
const { GENERATION_CONFIG } = require('./config');
const { cleanGeneratedContent } = require('./text-cleanup');

/**
 * Extract structured_data block and markdown content.
 * Parses the XML-style structured_data tag and returns both parts.
 * Gemini models reliably produce this format; other models may not.
 * Fallback: use extractStructuredDataUniversal() instead.
 */
function extractStructuredData(fullResponse, { logger }) {
  // Look for <structured_data> ... </structured_data> block
  const structuredDataRegex = /<structured_data>\s*([\s\S]*?)\s*<\/structured_data>/;
  const match = fullResponse.match(structuredDataRegex);

  let structuredData = null;
  let markdownContent = fullResponse;

  if (match) {
    try {
      // Parse the JSON inside the structured_data block
      const jsonString = match[1].trim();
      structuredData = JSON.parse(jsonString);

      // Remove the structured_data block from the content
      markdownContent = fullResponse.replace(structuredDataRegex, '').trim();

      logger.debug('Extracted structured data', {
        hasTitle: !!structuredData.title,
        hasExcerpt: !!structuredData.excerpt,
        skillsCount: structuredData.skills?.length || 0,
        tagsCount: structuredData.tags?.length || 0
      });
    } catch (e) {
      logger.warn('Failed to parse structured_data JSON', {
        error: e.message,
        jsonPreview: match[1].substring(0, 200)
      });
    }
  } else {
    logger.warn('No structured_data block found in response');
  }

  // Clean up the markdown content
  markdownContent = cleanGeneratedContent(markdownContent);

  return { markdownContent, structuredData };
}

/**
 * Universal structured-data extraction via a separate AI call.
 * Works with ANY model — sends the generated markdown and conversation
 * context, asks for JSON output.  No XML tags or model-specific formatting
 * required.  Used as fallback when extractStructuredData finds nothing.
 */
async function extractStructuredDataUniversal(contentType, markdownContent, chatHistory, context, { aiText, logger }) {
  logger.info('Running universal structured-data extraction', { contentType, contentLength: markdownContent.length });

  const conversationText = chatHistory.map(m => m.role + ': ' + m.content).join('\n');

  const typeFieldSchemas = {
    PROJECT: `,
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "isOngoing": true or false,
  "featuredImage": "URL or null",
  "projectLinks": {"github": "url or null", "devpost": "url or null", "other": ["url"]},
  "contributors": ["Name"]`,
    EXPERIENCE: `,
  "experienceCategory": "JOB" | "EDUCATION" | "CERTIFICATION",
  "location": "City, State or null",
  "locationType": "REMOTE" | "HYBRID" | "ONSITE" | null,
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "isOngoing": true or false,
  "roles": [{"title": "...", "description": "...", "startDate": "...", "endDate": "...", "isCurrent": false, "skills": [{"name":"...","category":"..."}]}]`,
    BLOG: '',
  };

  const typeExtra = typeFieldSchemas[contentType] || '';

  const prompt = `Extract structured metadata from the following portfolio content. Return ONLY valid JSON — no markdown, no explanation, no code fences.

Content type: ${contentType}

## Conversation Context
${conversationText.substring(0, 2000)}

## Generated Content
${markdownContent.substring(0, 6000)}

## Required JSON schema
{
  "title": "Compelling title for this ${contentType.toLowerCase()} content",
  "excerpt": "1-2 sentence summary for preview cards, max 200 characters"${typeExtra},
  "skills": [{"name": "Skill name", "category": "Category like Frontend/Backend/Database/Language/etc"}],
  "tags": [{"name": "Tag name", "category": "Category like Domain/Feature/Technical/etc"}]
}

Extract ALL skills and technologies mentioned. Categorize each skill (Frontend Framework, Backend Runtime, Database, Language, DevOps, Cloud, Protocol, Library, Tool, etc). Include 3-8 relevant tags with categories (Domain, Feature, Technical, Industry, etc).

Return ONLY the JSON object:`;

  try {
    const result = await aiText(prompt, {
      temperature: 0.3,
      maxTokens: 2048,
      context: 'Extract structured data',
    });

    // Clean up common wrapper issues
    let json = result.trim();
    json = json.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

    // Find the outermost JSON object
    const start = json.indexOf('{');
    const end = json.lastIndexOf('}');
    if (start !== -1 && end > start) {
      json = json.substring(start, end + 1);
    }

    const data = JSON.parse(json);
    logger.info('Universal extraction succeeded', {
      hasTitle: !!data.title,
      skillsCount: data.skills?.length || 0,
      tagsCount: data.tags?.length || 0,
    });
    return data;
  } catch (error) {
    logger.warn('Universal extraction failed, returning empty data', { error: error.message });
    return null;
  }
}

/**
 * Build metadata object from structured data.
 * Maps structured data fields to database schema.
 */
function buildMetadataFromStructuredData(structuredData, contentType) {
  if (!structuredData) {
    return {};
  }

  const metadata = {};

  // PROJECT-specific metadata
  if (contentType === 'PROJECT') {
    if (structuredData.startDate) metadata.startDate = structuredData.startDate;
    if (structuredData.endDate) metadata.endDate = structuredData.endDate;
    if (structuredData.isOngoing !== undefined) metadata.isOngoing = structuredData.isOngoing;
    if (structuredData.featuredImage) metadata.featuredImage = structuredData.featuredImage;
    if (structuredData.projectLinks) metadata.projectLinks = structuredData.projectLinks;
    if (structuredData.contributors) metadata.contributors = structuredData.contributors;
  }

  // EXPERIENCE-specific metadata
  if (contentType === 'EXPERIENCE') {
    if (structuredData.experienceCategory) metadata.experienceCategory = structuredData.experienceCategory;
    if (structuredData.location) metadata.location = structuredData.location;
    if (structuredData.locationType) metadata.locationType = structuredData.locationType;
    if (structuredData.startDate) metadata.startDate = structuredData.startDate;
    if (structuredData.endDate) metadata.endDate = structuredData.endDate;
    if (structuredData.isOngoing !== undefined) metadata.isOngoing = structuredData.isOngoing;
    if (structuredData.roles) metadata.roles = structuredData.roles;
  }

  // Store full structured data for reference
  metadata.aiGenerated = true;
  metadata.generatedAt = new Date().toISOString();

  return metadata;
}

/**
 * Private: Get fallback title
 */
function getFallbackTitle(contentType) {
  const fallbackTitles = {
    'PROJECT': 'Untitled Project',
    'EXPERIENCE': 'Work Experience',
    'BLOG': 'Untitled Post'
  };
  return fallbackTitles[contentType] || 'Untitled';
}

/**
 * Extract title from conversation
 */
async function extractTitleFromConversation(contentType, chatHistory, generatedContent, { aiText, logger }) {
  logger.info('Extracting title', { contentType });

  try {
    const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = utilityPrompts.extractTitle(contentType, conversationText);

    const result = await aiText(prompt, {
      temperature: GENERATION_CONFIG.SHORT.temperature,
      maxTokens: GENERATION_CONFIG.SHORT.maxOutputTokens,
      context: 'Extract title',
    });

    let title = result.trim();

    // Clean up common issues
    title = title.replace(/^["']|["']$/g, ''); // Remove quotes
    title = title.replace(/^#\s*/, ''); // Remove # if present

    logger.info('Title extracted', { title });

    // Fallback if title is too short or empty
    if (!title || title.length < 3) {
      title = getFallbackTitle(contentType);
      logger.warn('Using fallback title', { title });
    }

    return title;
  } catch (error) {
    logger.error('Title extraction error', { error: error.message });
    return getFallbackTitle(contentType);
  }
}

/**
 * Private: Infer content type from keywords (fallback)
 */
function inferContentTypeFromKeywords(conversationText, infoText) {
  const fullText = (conversationText + '\n' + infoText).toLowerCase();

  // Priority 1: Check for clear EXPERIENCE indicators
  const experienceIndicators = /(?:role|position|responsibilities|worked at|employed|job at|intern at|developer at|engineer at|studied at|degree)/i;
  const companyIndicators = /(?:company|organization|corporation|inc\.|llc|university|college|school)/i;

  if (experienceIndicators.test(fullText) && companyIndicators.test(fullText)) {
    return 'EXPERIENCE';
  }

  // Priority 2: Check for PROJECT indicators
  if (/(?:built|created|developed|deployed|launched|implemented).*?(?:project|app|website|application|system|tool)/i.test(fullText) ||
      /(?:project|app|website|application|system).*?(?:built|created|developed|deployed|launched)/i.test(fullText)) {
    return 'PROJECT';
  }

  // Priority 3: Check for generic EXPERIENCE keywords
  if (/(?:job|work|employment|internship|education|degree|university|college|certification)/i.test(fullText)) {
    return 'EXPERIENCE';
  }

  // Priority 4: Check for PROJECT keywords
  if (/(?:github|repo|repository|hackathon|devpost)/i.test(fullText)) {
    return 'PROJECT';
  }

  return 'BLOG';
}

/**
 * Infer content type from conversation
 */
async function inferContentType(chatHistory, initialInfo, { aiText, logger }) {
  logger.info('Inferring content type');

  try {
    const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
    const infoText = initialInfo ? JSON.stringify(initialInfo) : '';

    const prompt = utilityPrompts.inferContentType(conversationText, infoText);

    const result = await aiText(prompt, {
      temperature: GENERATION_CONFIG.VERY_PRECISE.temperature,
      maxTokens: GENERATION_CONFIG.VERY_PRECISE.maxOutputTokens,
      context: 'Infer content type',
    });

    const inferredType = result.trim().toUpperCase();

    logger.info('Content type inferred', { inferredType });

    if (['PROJECT', 'BLOG', 'EXPERIENCE'].includes(inferredType)) {
      return inferredType;
    }

    // Fallback to keyword matching
    const fallbackType = inferContentTypeFromKeywords(conversationText, infoText);
    logger.info('Using fallback content type', { fallbackType });
    return fallbackType;

  } catch (error) {
    logger.error('Content type inference error', { error: error.message });
    return 'BLOG'; // Default fallback
  }
}

/**
 * Basic fallback metadata extraction using regex
 */
function extractMetadataBasic(contentType, chatHistory, generatedContent, { logger }) {
  logger.info('Using basic metadata extraction', { contentType });

  const metadata = {};
  const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n').toLowerCase();
  const fullText = (conversationText + '\n' + generatedContent).toLowerCase();

  if (contentType === 'PROJECT') {
    // Check for ongoing projects
    if (/(?:ongoing|current|still|active|in progress|continuing)/i.test(fullText)) {
      metadata.isOngoing = true;
    }

    // Extract GitHub link
    const githubMatch = fullText.match(/(?:github|repo|repository).*?(https?:\/\/[^\s]+github[^\s]*|github\.com\/[^\s\/]+\/[^\s\/]+)/i);
    if (githubMatch) {
      let githubUrl = githubMatch[1];
      if (!githubUrl.startsWith('http')) {
        githubUrl = 'https://' + githubUrl;
      }
      metadata.projectLinks = { ...metadata.projectLinks, github: githubUrl };
    }

    // Extract Devpost link
    const devpostMatch = fullText.match(/(?:devpost).*?(https?:\/\/[^\s]+devpost[^\s]*|devpost\.com\/[^\s\/]+)/i);
    if (devpostMatch) {
      let devpostUrl = devpostMatch[1];
      if (!devpostUrl.startsWith('http')) {
        devpostUrl = 'https://' + devpostUrl;
      }
      metadata.projectLinks = { ...metadata.projectLinks, devpost: devpostUrl };
    }
  }

  if (contentType === 'EXPERIENCE') {
    // Extract experience category
    if (/(?:job|work|employment|position|role)/i.test(conversationText) && !/(?:education|school|university|degree)/i.test(conversationText)) {
      metadata.experienceCategory = 'JOB';
    } else if (/(?:education|school|university|college|degree|studied|student)/i.test(conversationText)) {
      metadata.experienceCategory = 'EDUCATION';
    } else if (/(?:certification|certificate|license|licensed)/i.test(conversationText)) {
      metadata.experienceCategory = 'CERTIFICATION';
    }

    // Extract location type
    if (/(?:remote|work from home|wfh)/i.test(fullText)) {
      metadata.locationType = 'REMOTE';
    } else if (/(?:hybrid|partially remote|mix)/i.test(fullText)) {
      metadata.locationType = 'HYBRID';
    } else if (/(?:onsite|on-site|in-person|office)/i.test(fullText)) {
      metadata.locationType = 'ONSITE';
    }

    // Check for ongoing
    if (/(?:current|ongoing|still|present)/i.test(fullText)) {
      metadata.isOngoing = true;
    }
  }

  return metadata;
}

/**
 * Extract metadata from conversation
 */
async function extractMetadataFromConversation(contentType, chatHistory, generatedContent, { aiText, logger }) {
  logger.info('Extracting metadata', { contentType });

  try {
    const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');

    const promptGenerator = utilityPrompts.extractMetadata[contentType] || utilityPrompts.extractMetadata['BLOG'];
    const prompt = promptGenerator(conversationText);

    const result = await aiText(prompt, {
      temperature: GENERATION_CONFIG.PRECISE.temperature,
      maxTokens: GENERATION_CONFIG.PRECISE.maxOutputTokens,
      context: 'Extract metadata',
    });

    // Clean and parse response
    let responseText = result.trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const metadata = JSON.parse(jsonMatch[0]);
      logger.info('Metadata extracted', { keys: Object.keys(metadata) });
      return metadata;
    }

    return {};
  } catch (error) {
    logger.error('Metadata extraction error', { error: error.message });
    // Fallback to basic extraction
    return extractMetadataBasic(contentType, chatHistory, generatedContent, { logger });
  }
}

module.exports = {
  extractStructuredData,
  extractStructuredDataUniversal,
  buildMetadataFromStructuredData,
  extractTitleFromConversation,
  getFallbackTitle,
  inferContentType,
  inferContentTypeFromKeywords,
  extractMetadataFromConversation,
  extractMetadataBasic
};
