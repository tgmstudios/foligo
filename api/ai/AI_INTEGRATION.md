# Gemini AI Integration for Foligo

This document describes the Gemini AI integration implemented for content creation in the Foligo dashboard and API.

## Features Implemented

### 1. Backend API Integration

#### New API Endpoints
- `POST /api/ai/generate-content` - Generate content using AI
- `POST /api/ai/chat` - Chat with AI for content creation assistance  
- `POST /api/ai/clarifying-questions` - Generate clarifying questions for content creation
- `POST /api/projects/{projectId}/content/ai-generate` - Generate and create content using AI

#### Gemini Service (`api/src/services/gemini.js`)
- Content generation for BLOG, PROJECT, and EXPERIENCE types
- Interactive chat functionality
- Clarifying questions generation
- Configurable AI parameters (temperature, tokens, etc.)

### 2. Frontend Dashboard Integration

#### GeminiChatbot Component (`dashboard/src/components/content/GeminiChatbot.vue`)
- Multi-phase interface: Questions → Chat → Generated Content
- Interactive question answering
- Real-time chat with AI
- Content preview and publishing
- Responsive design with modern UI

#### Updated CreateContentModal
- Added "Use AI Assistant" button
- Integrated GeminiChatbot component
- Seamless workflow from manual to AI-assisted content creation

## Setup Instructions

### 1. Environment Configuration

Add the following to your `.env` file:

```bash
# Gemini AI Configuration
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 2. API Dependencies

The following dependencies are already installed:
- `@google/generative-ai`: ^0.24.1

### 3. Dashboard Dependencies

The following dependencies are already installed:
- `marked`: ^16.4.1 (for markdown rendering)

## Usage Workflow

### 1. Content Creation with AI

1. User clicks "Add New" in the dashboard
2. Fills in basic information (title, content type, etc.)
3. Clicks "Use AI Assistant" button
4. AI generates clarifying questions based on content type
5. User answers questions to provide context
6. AI chatbot opens for interactive refinement
7. User can chat with AI to refine the content
8. AI generates final content
9. User reviews and publishes the content

### 2. Content Types Supported

#### Blog Posts
- AI asks about topic, audience, tone, key points
- Generates engaging blog posts with proper structure
- Includes introduction, headings, and conclusion

#### Project Descriptions  
- AI asks about technologies, features, challenges solved
- Generates technical project descriptions
- Highlights value proposition and impact

#### Experience Descriptions
- AI asks about responsibilities, achievements, technologies
- Generates professional experience descriptions
- Focuses on quantifiable results and skills

## API Integration Details

### Content Generation Request

```javascript
POST /api/ai/generate-content
{
  "contentType": "BLOG",
  "topic": "Web Development Best Practices",
  "details": {
    "targetAudience": "developers",
    "tone": "professional",
    "length": "medium"
  }
}
```

### Chat Request

```javascript
POST /api/ai/chat
{
  "messages": [
    {
      "role": "user",
      "content": "I want to write about React hooks"
    },
    {
      "role": "assistant", 
      "content": "Great topic! What specific aspect of React hooks would you like to focus on?"
    },
    {
      "role": "user",
      "content": "Custom hooks and their benefits"
    }
  ]
}
```

### AI-Generated Content Creation

```javascript
POST /api/projects/{projectId}/content/ai-generate
{
  "contentType": "BLOG",
  "topic": "React Custom Hooks",
  "title": "Mastering React Custom Hooks",
  "details": {
    "targetAudience": "intermediate developers",
    "tone": "educational"
  },
  "isPublished": true
}
```

## Error Handling

The integration includes comprehensive error handling:

- API key validation
- Network error handling
- Rate limiting protection
- Graceful fallbacks for AI failures
- User-friendly error messages

## Security Considerations

- API key stored securely in environment variables
- Authentication required for all AI endpoints
- Project access control enforced
- Rate limiting to prevent abuse
- Input validation and sanitization

## Future Enhancements

Potential improvements for the AI integration:

1. **Content Templates**: Pre-defined templates for different content types
2. **Batch Generation**: Generate multiple content pieces at once
3. **Content Optimization**: AI-powered SEO optimization
4. **Image Generation**: Integration with image generation APIs
5. **Content Analytics**: Track AI-generated content performance
6. **Custom Prompts**: Allow users to define custom AI prompts
7. **Content Variations**: Generate multiple versions of the same content

## Troubleshooting

### Common Issues

1. **"Gemini API key not configured"**
   - Ensure `GEMINI_API_KEY` is set in your `.env` file
   - Restart the API server after adding the key

2. **"Failed to generate content"**
   - Check your internet connection
   - Verify the Gemini API key is valid
   - Check API rate limits

3. **Chat not responding**
   - Ensure the chat messages array is properly formatted
   - Check for network connectivity issues
   - Verify authentication token is valid

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=gemini:*
```

This will provide detailed logs of AI interactions for troubleshooting.
