# Multi-Step AI Implementation

## Overview

This implementation provides a multi-step AI content creation and editing process using two different Gemini models:

- **gemini-2.0-flash-exp**: Used for clarifying questions and interactive conversation (faster, more efficient)
- **gemini-2.0-flash-thinking-exp**: Used for final content generation (more powerful, better quality)

## Architecture

### Modular Design

The implementation is modular and designed to support future voice mode integration:

1. **AI Session Service** (`api/src/services/gemini.js`)
   - `handleAISession()`: Manages interactive Q&A sessions
   - `generateFinalContent()`: Generates final content using the pro model
   - Supports both 'create' and 'edit' modes
   - Uses JSON blocks to detect when AI is done asking questions

2. **API Endpoints** (`api/src/routes/ai-content.js`)
   - `POST /api/ai/session`: Handles multi-step conversation
   - `POST /api/ai/generate`: Generates final content

3. **Frontend Components**
   - `DashboardLayout.vue`: AI Content Creator button (top bar)
   - `ContentEditorView.vue`: Edit mode integration
   - `AIContentCreatorModal.vue`: Standalone modal for create mode

### Two AI Modes

#### 1. Create Mode
- Triggered from top bar AI button (replaces notifications)
- Requires project selection
- **Voice/Text Selection**: User chooses between text or voice interaction
- Starts with basic questions:
  - What should the title be?
  - What kind of post is this?
  - What is this about in brief?
- Then asks clarifying questions
- Generates new content using pro model

#### 2. Edit Mode
- Triggered from content editor's AI assistant
- **Voice/Text Selection**: User chooses between text or voice interaction
- Uses existing post information:
  - Title, content, tags, metadata
- Asks what user wants to edit or focus on
- Generates edited content using pro model

#### Interaction Modes

Both create and edit modes now prompt users to choose their preferred interaction method:

- **Text Mode**: Traditional typing interface (fully functional)
- **Voice Mode**: Spoken interaction (UI prepared, coming soon)

The voice mode UI is complete but shows a "coming soon" message, preparing the interface for future voice integration.

### Flow

1. **Clarifying Questions Phase** (Flash Model)
   - AI asks questions until it has enough information
   - Indicates completion with JSON block: `{"done": true, "summary": "..."}`
   - For edit mode, also includes: `"changes": "..."`

2. **Content Generation Phase** (Pro Model)
   - Receives entire chat history
   - Generates comprehensive content
   - Returns final markdown content

### Future Voice Mode Support

The architecture is designed to support voice mode:

1. **Modular AI Methods**: `handleAISession()` can accept different input types
2. **Flexible Chat History**: Works with text, can be extended to support voice transcripts
3. **Separate Voice Handler**: Can be added as a wrapper that:
   - Captures audio input
   - Converts to text (or sends audio directly)
   - Feeds into existing AI session pipeline
   - Returns response as text or audio

```javascript
// Future voice integration example
async handleVoiceAISession(mode, contentType, audioInput, chatHistory) {
  // 1. Convert audio to text (or use multimodal model)
  const transcript = await convertAudioToText(audioInput);
  
  // 2. Use existing handleAISession with transcript
  const result = await this.handleAISession(mode, contentType, {}, [
    ...chatHistory,
    { role: 'user', content: transcript }
  ]);
  
  // 3. Convert response to audio if needed
  return await convertTextToAudio(result);
}
```

## API Usage

### Session Endpoint

```javascript
POST /api/ai/session
{
  "mode": "create", // or "edit"
  "contentType": "BLOG", // or "PROJECT", "EXPERIENCE"
  "initialInfo": {}, // optional, object with existing content info
  "chatHistory": [] // array of {role: "user"|"assistant", content: "..."}
}

// Response
{
  "message": "What would you like to focus on?",
  "done": false // true when AI indicates it's done asking questions
}
```

### Generation Endpoint

```javascript
POST /api/ai/generate
{
  "mode": "create", // or "edit"
  "contentType": "BLOG",
  "chatHistory": [...], // full conversation
  "currentContent": "...", // for edit mode
  "changes": "..." // for edit mode
}

// Response
{
  "content": "# Generated Markdown Content...",
  "metadata": {
    "mode": "create",
    "contentType": "BLOG",
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "wordCount": 1234
  }
}
```

## Testing

To test the implementation:

1. **Create Mode**
   - Click AI button in top bar (requires project selection)
   - Answer initial questions
   - AI asks clarifying questions
   - AI generates content

2. **Edit Mode**
   - Open existing content for editing
   - Click "Start AI Assistant" in content editor
   - Answer questions about what to edit
   - AI generates edited content

## Key Files Modified

- `api/src/services/gemini.js`: Added multi-step methods
- `api/src/routes/ai-content.js`: Added new endpoints
- `dashboard/src/layouts/DashboardLayout.vue`: Added AI button
- `dashboard/src/views/content/ContentEditorView.vue`: Integrated edit mode
- `dashboard/src/components/AIContentCreatorModal.vue`: New modal component

## Notes

- The AI indicates it's done by including a JSON block in its response
- Both modes use the same endpoint structure for consistency
- The implementation is designed to be extensible for voice mode
- Error handling includes fallback questions/messages
