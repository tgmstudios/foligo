const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');

/**
 * @swagger
 * /api/ai/voice-webhook:
 *   post:
 *     summary: Receive summary from ElevenLabs voice agent and generate content
 *     description: Public webhook endpoint called by ElevenLabs voice agent to generate portfolio content from voice conversation summary
 *     tags: [AI Content Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - summary
 *               - projectId
 *             properties:
 *               summary:
 *                 type: string
 *                 description: Complete summary synthesized from the voice conversation
 *                 example: "Built a voice-first AI portfolio assistant at HackPSU..."
 *               projectId:
 *                 type: string
 *                 description: UUID of the project to create content in
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               contentType:
 *                 type: string
 *                 enum: [BLOG, PROJECT, EXPERIENCE]
 *                 default: BLOG
 *                 description: Type of content to generate
 *     responses:
 *       200:
 *         description: Content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 content:
 *                   type: string
 *                   description: Generated markdown content
 *                 title:
 *                   type: string
 *                   description: Extracted title from content
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     mode:
 *                       type: string
 *                       example: "create"
 *                     contentType:
 *                       type: string
 *                       example: "BLOG"
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     wordCount:
 *                       type: number
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation Error"
 *                 message:
 *                   type: string
 *                   example: "summary and projectId are required"
 *       500:
 *         description: Content generation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Content Generation Failed"
 *                 message:
 *                   type: string
 *                   example: "Unable to generate content from voice input"
 */
router.post('/', async (req, res) => {
  try {
    const { summary, projectId, contentType = 'BLOG' } = req.body;
    
    if (!summary || !projectId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'summary and projectId are required'
      });
    }
    
    // Generate content using Gemini
    const result = await geminiService.generateFinalContent(
      'create',
      contentType,
      [
        { role: 'user', content: `Create a portfolio piece based on this summary: ${summary}` }
      ],
      '',
      summary
    );
    
    // Generate slug from title
    const contentSlug = result.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    // Check if slug is unique
    let uniqueSlug = contentSlug;
    const existingContent = await prisma.content.findFirst({
      where: { slug: contentSlug }
    });
    if (existingContent) {
      uniqueSlug = `${contentSlug}-${Date.now()}`;
    }
    
    // Get the next order number
    const lastContent = await prisma.content.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    const contentOrder = lastContent ? lastContent.order + 1 : 0;
    
    // Create excerpt from content
    const excerpt = result.content.substring(0, 200) + '...';
    
    // Create content in database
    const newContent = await prisma.content.create({
      data: {
        projectId,
        type: contentType,
        contentType,
        title: result.title,
        slug: uniqueSlug,
        excerpt,
        content: result.content,
        metadata: {
          aiGenerated: true,
          generatedAt: new Date().toISOString(),
          source: 'voice-webhook',
          summary
        },
        order: contentOrder,
        status: 'DRAFT'
      }
    });
    
    // Clear project cache
    await cache.del(`project:${projectId}`);
    await cache.delPattern(`project:${projectId}:content*`);
    
    res.json({
      success: true,
      content: result.content,
      title: result.title,
      id: newContent.id,
      metadata: {
        mode: 'create',
        contentType,
        generatedAt: new Date().toISOString(),
        wordCount: result.content.split(' ').length
      }
    });
  } catch (error) {
    console.error('Voice webhook error:', error);
    res.status(500).json({
      error: 'Content Generation Failed',
      message: error.message || 'Unable to generate content from voice input'
    });
  }
});

module.exports = router;

