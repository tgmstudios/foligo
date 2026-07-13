/**
 * Social media post generation (LinkedIn / X) for a piece of content.
 */
const { GeminiAPIError } = require('../core/errors');
const { stripMarkdown, extractHashtags } = require('./text-cleanup');

/**
 * Generate social media post (LinkedIn or X/Twitter) for content
 * Creates platform-appropriate post with links to foligo site and project links
 * @param {string} platform - 'linkedin' or 'x'
 */
async function generateSocialPost(contentData, projectData, platform = 'linkedin', { aiText, logger }) {
  logger.info('Generating social post', {
    contentId: contentData.id,
    contentType: contentData.type,
    projectId: projectData.id,
    platform
  });

  try {
    // Build the foligo link
    const foligoLink = `https://${projectData.subdomain}.foligo.tech/${contentData.slug || contentData.id}`;

    // Build project links section
    const projectLinks = [];
    if (contentData.projectLinks?.github) {
      projectLinks.push(`GitHub: ${contentData.projectLinks.github}`);
    }
    if (contentData.projectLinks?.devpost) {
      projectLinks.push(`Devpost: ${contentData.projectLinks.devpost}`);
    }
    if (contentData.projectLinks?.other && contentData.projectLinks.other.length > 0) {
      contentData.projectLinks.other.forEach(link => {
        if (link) projectLinks.push(link);
      });
    }
    const linksText = projectLinks.length > 0 ? `\n\nLinks:\n${projectLinks.join('\n')}` : '';

    // Build platform-specific prompts
    let prompt;
    if (platform === 'linkedin') {
      prompt = `Generate a professional LinkedIn post for the following content.

Content Title: ${contentData.title}
Content Type: ${contentData.type}
Excerpt: ${contentData.excerpt || 'No excerpt provided'}
Content Preview: ${(contentData.content || '').substring(0, 1500)}

Foligo Link: ${foligoLink}${linksText}

LinkedIn Post Requirements:
- Professional, engaging tone that resonates with LinkedIn's professional audience
- 2-3 well-structured paragraphs (approximately 200-500 words)
- Start with a hook that captures attention
- Include specific details, achievements, or insights from the content
- Use storytelling elements when appropriate
- Include 3-5 relevant hashtags at the end (mix of broad and niche tags)
- IMPORTANT: Naturally incorporate the foligo link (${foligoLink}) within the post text itself, not just at the end. For example: "Check out the full details here: ${foligoLink}" or "Learn more: ${foligoLink}" or weave it into a sentence naturally
- Include project links (GitHub, Devpost, etc.) if available, but integrate them naturally
- Use professional language but remain authentic and personable
- Encourage engagement (questions, comments, shares)
- Format with proper line breaks for readability
- IMPORTANT: Use plain text only - NO markdown formatting (no **bold**, no # headers, no *italics*, no [links](url), no code blocks, no lists with - or *). Write in plain text that will display correctly on LinkedIn.
- CRITICAL: ALWAYS write complete, finished thoughts. Every sentence must be complete. Every paragraph must be complete. The post must end with proper punctuation (period, exclamation, or question mark). NEVER cut off mid-sentence or mid-thought. If you're describing something, finish describing it completely before ending.

Return only the LinkedIn post text (no JSON, no quotes, no markdown, just plain text post content). Make sure the foligo link is naturally integrated within the post:`;
    } else {
      prompt = `Generate a concise X (Twitter) post for the following content.

Content Title: ${contentData.title}
Content Type: ${contentData.type}
Excerpt: ${contentData.excerpt || 'No excerpt provided'}
Content Preview: ${(contentData.content || '').substring(0, 800)}

Foligo Link: ${foligoLink}${linksText}

X/Twitter Post Requirements:
- Concise, punchy, and engaging tone typical of X/Twitter
- Keep it concise but complete - X supports longer posts now, but aim for 200-500 characters for best engagement
- Start with a hook or interesting statement
- Use emojis sparingly (1-2 max) to add personality
- Be conversational and authentic
- Include 2-3 relevant hashtags
- IMPORTANT: Naturally incorporate the foligo link (${foligoLink}) within the post text itself, not just at the end. For example: "Check it out: ${foligoLink}" or weave it into the message naturally. Only include the link ONCE.
- Make it shareable and engaging
- Use line breaks strategically for readability
- Consider using a question or call-to-action to encourage engagement
- IMPORTANT: Use plain text only - NO markdown formatting (no **bold**, no # headers, no *italics*, no [links](url), no code blocks). Write in plain text that will display correctly on X/Twitter.
- CRITICAL: ALWAYS write complete, finished thoughts. Every sentence must be complete. The post must end with proper punctuation (period, exclamation, or question mark). NEVER cut off mid-sentence or mid-thought.

Return only the X post text (no JSON, no quotes, no markdown, just plain text post content). Make sure the foligo link is naturally integrated within the post and only appears once:`;
    }

    const generationConfig = {
      temperature: platform === 'linkedin' ? 0.7 : 0.8, // Slightly more creative for X
      topK: 40,
      topP: 0.95,
      maxOutputTokens: platform === 'linkedin' ? 2048 : 1024 // Increased tokens to prevent truncation
    };

    const responseText = await aiText(prompt, {
      temperature: generationConfig.temperature,
      maxTokens: generationConfig.maxOutputTokens,
      context: `Generate ${platform} post`,
    });

    // Clean up the response (remove any JSON formatting if present)
    let post = responseText.trim();

    logger.info('Raw AI response for social post', {
      platform,
      responseLength: post.length,
      responsePreview: post.substring(0, 300)
    });

    // Remove JSON wrapper if present
    const jsonMatch = post.match(/\{[\s\S]*"post"[\s\S]*:[\s\S]*"([^"]+)"[\s\S]*\}/);
    if (jsonMatch) {
      post = jsonMatch[1];
    } else {
      // Remove quotes if wrapped
      post = post.replace(/^["']|["']$/g, '');
    }

    // Strip markdown formatting and convert to plain text
    const beforeStrip = post.trim();
    post = stripMarkdown(post);

    // If stripping markdown removed everything or made it too short, use the original
    if (!post || post.trim().length < 10) {
      logger.warn('Markdown stripping removed too much content, using original', {
        beforeLength: beforeStrip.length,
        afterLength: post ? post.length : 0
      });
      post = beforeStrip;
    }

    // Check if post appears to be cut off mid-sentence (ends without proper punctuation)
    const trimmedPost = post.trim();
    const lastChar = trimmedPost[trimmedPost.length - 1];
    const properEndings = ['.', '!', '?', ':', ';'];
    const endsWithLink = trimmedPost.endsWith(foligoLink);
    const endsWithHashtag = /#\w+\s*$/.test(trimmedPost);

    // If post doesn't end with proper punctuation and doesn't end with link/hashtag, it might be truncated
    if (!properEndings.includes(lastChar) && !endsWithLink && !endsWithHashtag && trimmedPost.length > 50) {
      logger.warn('Post appears to be cut off mid-sentence, attempting to complete', {
        postLength: trimmedPost.length,
        lastChars: trimmedPost.substring(trimmedPost.length - 50)
      });

      // Try to find a natural break point (last sentence boundary before the end)
      const lastPeriod = trimmedPost.lastIndexOf('.');
      const lastExclamation = trimmedPost.lastIndexOf('!');
      const lastQuestion = trimmedPost.lastIndexOf('?');
      const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

      // If we found a sentence end within the last 200 characters, truncate there
      if (lastSentenceEnd > trimmedPost.length - 200 && lastSentenceEnd > 0) {
        post = trimmedPost.substring(0, lastSentenceEnd + 1).trim();
        logger.info('Truncated post at last complete sentence', {
          originalLength: trimmedPost.length,
          newLength: post.length
        });
      } else {
        // If no good break point, try to complete the thought with a simple ending
        // Only do this if the post is reasonably long (at least 100 chars)
        if (trimmedPost.length > 100) {
          // Find the last word boundary
          const lastSpace = trimmedPost.lastIndexOf(' ');
          if (lastSpace > trimmedPost.length * 0.8) {
            // If we're close to the end, just truncate at word boundary
            post = trimmedPost.substring(0, lastSpace).trim() + '.';
            logger.info('Completed truncated post at word boundary', {
              originalLength: trimmedPost.length,
              newLength: post.length
            });
          }
        }
      }
    }

    // Check if link is already included in the post
    const hasLink = post.includes(foligoLink);

    // Validate we have actual content (not just whitespace or the link)
    const contentWithoutLink = post.replace(new RegExp(foligoLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').trim();
    if (!contentWithoutLink || contentWithoutLink.length < 10) {
      logger.warn('Generated post appears empty, creating fallback', {
        postLength: post.length,
        contentWithoutLinkLength: contentWithoutLink.length,
        originalResponse: responseText.substring(0, 200)
      });

      // Create a fallback post based on content
      const title = contentData.title || 'My project';
      const excerpt = contentData.excerpt || '';

      if (platform === 'x') {
        // Create a concise X post with integrated link
        let baseText = '';
        if (excerpt && excerpt.length > 0) {
          const cleanExcerpt = excerpt.replace(/\n/g, ' ').substring(0, 100);
          baseText = `${title}: ${cleanExcerpt} Check it out: ${foligoLink}`;
        } else {
          baseText = `Just shipped: ${title}! ${foligoLink}`;
        }

        // Add hashtags
        const hashtags = extractHashtags(contentData);
        const hashtagText = hashtags.length > 0 ? ` ${hashtags.slice(0, 2).join(' ')}` : '';

        post = baseText + hashtagText;

        // Ensure it fits - truncate at word boundary if needed
        if (post.length > 280) {
          const maxLength = 280 - hashtagText.length;
          let truncated = baseText.substring(0, maxLength);
          // Find last space to avoid cutting words
          const lastSpace = truncated.lastIndexOf(' ');
          if (lastSpace > maxLength * 0.7) { // Only use if we're not losing too much
            truncated = truncated.substring(0, lastSpace);
          }
          post = truncated + '... ' + hashtagText;
        }
      } else {
        // Create a LinkedIn post with integrated link
        const cleanExcerpt = excerpt ? excerpt.replace(/\n/g, ' ').substring(0, 200) : 'Check out my latest project!';
        post = `Excited to share: ${title}\n\n${cleanExcerpt}\n\nLearn more: ${foligoLink}`;
      }
    } else if (!hasLink) {
      // Link not included, add it naturally
      if (platform === 'x') {
        // For X, add it inline before hashtags if possible
        const hashtagMatch = post.match(/#\w+/g);
        if (hashtagMatch && hashtagMatch.length > 0) {
          const lastHashtagIndex = post.lastIndexOf(hashtagMatch[hashtagMatch.length - 1]);
          const beforeHashtags = post.substring(0, lastHashtagIndex).trim();
          const hashtags = post.substring(lastHashtagIndex);
          post = `${beforeHashtags} ${foligoLink} ${hashtags}`;
        } else {
          post = `${post} ${foligoLink}`;
        }
      } else {
        // For LinkedIn, add it naturally at the end
        post = `${post}\n\nLearn more: ${foligoLink}`;
      }
    }

    // Remove duplicate links if they exist (shouldn't happen, but safety check)
    const linkRegex = new RegExp(foligoLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const linkMatches = post.match(linkRegex);
    if (linkMatches && linkMatches.length > 1) {
      // Keep only the first occurrence, remove duplicates
      const firstLinkIndex = post.indexOf(foligoLink);
      const beforeFirstLink = post.substring(0, firstLinkIndex + foligoLink.length);
      const afterFirstLink = post.substring(firstLinkIndex + foligoLink.length);
      // Remove all other occurrences of the link
      const cleanedAfter = afterFirstLink.replace(linkRegex, '').trim();
      post = (beforeFirstLink + ' ' + cleanedAfter).trim().replace(/\s+/g, ' ');
      logger.info('Removed duplicate links from post', {
        duplicatesRemoved: linkMatches.length - 1,
        finalLength: post.length
      });
    }

    // For X, we don't strictly limit to 280 anymore (X supports longer posts)
    // But we'll still try to keep it reasonable (under 1000 chars for best engagement)
    // Only truncate if it's extremely long
    if (platform === 'x' && post.length > 1000) {
      // Check if link is in the post
      const linkIndex = post.indexOf(foligoLink);
      const hasLinkInPost = linkIndex !== -1;

      if (hasLinkInPost) {
        // Link is already included, truncate content before it
        const beforeLink = post.substring(0, linkIndex).trim();
        const afterLink = post.substring(linkIndex + foligoLink.length).trim();

        // Truncate to ~800 chars total
        const maxContentLength = 800 - foligoLink.length - afterLink.length - 10;

        if (maxContentLength > 50) {
          // Truncate before link at sentence boundary
          let truncated = beforeLink.substring(0, maxContentLength);
          const lastPeriod = truncated.lastIndexOf('.');
          const lastExclamation = truncated.lastIndexOf('!');
          const lastQuestion = truncated.lastIndexOf('?');

          // Prefer sentence boundaries
          const sentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
          if (sentenceEnd > maxContentLength * 0.5) {
            truncated = truncated.substring(0, sentenceEnd + 1);
          } else {
            // Fall back to word boundary
            const lastSpace = truncated.lastIndexOf(' ');
            if (lastSpace > maxContentLength * 0.7) {
              truncated = truncated.substring(0, lastSpace);
            }
          }

          post = `${truncated} ${foligoLink} ${afterLink}`.trim();
        } else {
          // Not enough space, put link at end
          const maxContent = 800 - foligoLink.length - 5;
          let truncated = (beforeLink + ' ' + afterLink).substring(0, maxContent);
          const lastSpace = truncated.lastIndexOf(' ');
          if (lastSpace > maxContent * 0.7) {
            truncated = truncated.substring(0, lastSpace);
          }
          post = `${truncated}... ${foligoLink}`;
        }
      } else {
        // No link yet, truncate at sentence boundary
        const maxLength = 750; // Reserve space for link
        let truncated = post.substring(0, maxLength);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastExclamation = truncated.lastIndexOf('!');
        const lastQuestion = truncated.lastIndexOf('?');

        // Prefer sentence boundaries
        const sentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
        if (sentenceEnd > maxLength * 0.5) {
          truncated = truncated.substring(0, sentenceEnd + 1);
        } else {
          // Fall back to word boundary
          const lastSpace = truncated.lastIndexOf(' ');
          if (lastSpace > maxLength * 0.7) {
            truncated = truncated.substring(0, lastSpace);
          }
        }

        post = `${truncated}... ${foligoLink}`;
      }
    }

    logger.info('Social post generated', {
      platform,
      postLength: post.length
    });

    return { post, platform };

  } catch (error) {
    logger.error('Social posts generation error', {
      error: error.message,
      stack: error.stack
    });
    throw new GeminiAPIError(`Failed to generate social posts: ${error.message}`, error);
  }
}

module.exports = { generateSocialPost };
