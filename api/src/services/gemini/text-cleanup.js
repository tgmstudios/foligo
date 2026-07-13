/**
 * Pure text-cleanup helpers used across the gemini/* content flows.
 * No external dependencies — safe to import directly wherever needed.
 */

/**
 * Strip markdown formatting and convert to plain text.
 * Converts markdown elements to their plain text equivalents.
 */
function stripMarkdown(text) {
  if (!text) return text;

  let cleaned = text;

  // Remove code blocks (```code```) - but preserve the content
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    // Extract code content, remove the backticks
    return match.replace(/```/g, '').trim();
  });

  // Remove inline code (`code`) - preserve the content
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // Remove headers (# Header -> Header) - preserve the text
  cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, '$1');

  // Remove bold (**text** or __text__ -> text) - preserve the text
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');

  // Remove italic (*text* or _text_ -> text) - preserve the text
  // Be careful not to remove single asterisks that are part of the text
  cleaned = cleaned.replace(/\*([^*\n]+)\*/g, '$1');
  cleaned = cleaned.replace(/_([^_\n]+)_/g, '$1');

  // Remove links ([text](url) -> text) - preserve the link text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove images ![alt](url) -> alt - preserve alt text
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Convert list items (- item or * item -> item) - preserve the item text
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+(.+)$/gm, '$1');
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+(.+)$/gm, '$1');

  // Remove horizontal rules (--- or ***) - remove entirely
  cleaned = cleaned.replace(/^[\s]*[-*]{3,}[\s]*$/gm, '');

  // Remove blockquotes (> text -> text) - preserve the text
  cleaned = cleaned.replace(/^>\s+(.+)$/gm, '$1');

  // Clean up multiple newlines (max 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Extract relevant hashtags from content data.
 */
function extractHashtags(contentData) {
  const hashtags = [];

  // Extract from tags if available
  if (contentData.tags && Array.isArray(contentData.tags)) {
    contentData.tags.forEach(tag => {
      if (tag.name) {
        const hashtag = '#' + tag.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        if (hashtag.length > 1 && hashtag.length < 20) {
          hashtags.push(hashtag);
        }
      }
    });
  }

  // Extract from skills if available
  if (contentData.linkedSkills && Array.isArray(contentData.linkedSkills)) {
    contentData.linkedSkills.forEach(skill => {
      if (skill.name) {
        const hashtag = '#' + skill.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        if (hashtag.length > 1 && hashtag.length < 20 && !hashtags.includes(hashtag)) {
          hashtags.push(hashtag);
        }
      }
    });
  }

  return hashtags;
}

/**
 * Clean generated content: strip intro filler, stray headings, and leftover
 * structured_data / JSON artifacts from a raw LLM response.
 */
function cleanGeneratedContent(content) {
  // Remove header metadata patterns
  content = content.replace(/^By\s+[^•]+•\s*[^•]+•\s*[^\n]+\n?/i, '').trim();

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
    /^\*\*\*/g,
    /^---$/gm
  ];

  for (const pattern of introPatterns) {
    content = content.replace(pattern, '');
  }

  // Remove any stray # title headings at the start
  content = content.replace(/^#\s+.+$/m, '').trim();

  // Remove any leftover closing structured_data tags and JSON blocks
  content = content.replace(/<\/structured_data>\s*/g, '');
  content = content.replace(/```json\s*\{[\s\S]*?\}\s*```/g, '');

  // Unescape markdown characters that were escaped unnecessarily
  content = content.replace(/\\([.,!?'";:\-\(\)\[\]{}])/g, '$1');

  return content;
}

module.exports = {
  stripMarkdown,
  extractHashtags,
  cleanGeneratedContent
};
