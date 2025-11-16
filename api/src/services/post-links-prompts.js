/**
 * Post Links Generation Prompts
 * Prompts for AI-powered post linking using the flash model
 */

/**
 * Build the current date/time block for context
 */
const buildDateTimeContext = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  return `<current_datetime>
  Date: ${dateStr}
  Time: ${timeStr}
</current_datetime>`;
};

/**
 * POST LINKS Generation Prompt
 * Uses flash model to intelligently link posts together
 * Includes excerpts, skills, and tags for better linking decisions
 */
const postLinksGenerationPrompt = (posts) => {
  // Format posts with ID, title, excerpt, skills, and tags
  const postsList = posts.map((post, idx) => {
    const excerpt = post.excerpt ? post.excerpt.substring(0, 200).replace(/\n/g, ' ') : '';
    const skills = post.linkedSkills && post.linkedSkills.length > 0 
      ? post.linkedSkills.map(s => s.name).join(', ')
      : 'none';
    const tags = post.tags && post.tags.length > 0
      ? post.tags.map(t => t.name).join(', ')
      : 'none';
    
    return `${idx + 1}. ${post.id}|${post.title}|${post.contentType}
   Excerpt: ${excerpt || 'No excerpt'}
   Skills: ${skills}
   Tags: ${tags}`;
  }).join('\n\n');
  
  return `Link related posts. JSON only:

${postsList}

Link types: related, parent, child, sequential, complementary, prerequisite, follow-up

Return format:
{"links":[{"sourceId":"id","targetId":"id","linkType":"related","reason":"why"}]}

Rules:
- Only link posts with clear relationships
- sourceId !== targetId
- No duplicates
- Return [] if no links found

JSON:`;
};

module.exports = {
  postLinksGenerationPrompt
};

