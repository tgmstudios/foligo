# AI Architecture: Function Calling & Consolidated Prompts

## Overview

This document describes the modern, production-grade AI architecture implemented for the portfolio content generation system. The architecture uses **Gemini's Function Calling** (also known as Tool Calling) for structured, reliable responses instead of fragile JSON parsing.

---

## Key Improvements

### 1. **Consolidated System Prompt**

**Before:** Multiple long prompts scattered across the codebase, requiring updates in many places.

**After:** A single, powerful system prompt (`buildConversationalSystemPrompt`) that defines:
- AI persona and goals
- Clear thinking process
- Content type classification rules
- Available tools
- Critical rules and constraints
- Few-shot examples

**Benefits:**
- ✅ Single source of truth for AI behavior
- ✅ Easy to update and maintain
- ✅ Consistent behavior across all interactions
- ✅ Clear documentation of AI capabilities

### 2. **Function Calling Instead of Regex Parsing**

**Before:** Asking the AI to return JSON strings like `{"done": true, ...}` and parsing with regex.

```javascript
// OLD: Fragile regex-based parsing
const doneRegex = /{"done"\s*:\s*true[^}]*}/;
const doneMatch = responseText.match(doneRegex);
```

**After:** Using Gemini's structured Function Calling API.

```javascript
// NEW: Structured, guaranteed-valid responses
const functionCalls = response.functionCalls();
if (functionCalls && functionCalls.length > 0) {
  return await this._handleFunctionCall(functionCalls[0], contentType);
}
```

**Benefits:**
- ✅ **No parsing errors** - API returns structured objects
- ✅ **Type safety** - Parameters are validated by the model
- ✅ **Clear intent** - Functions explicitly declare what they do
- ✅ **Extensible** - Easy to add new capabilities

---

## Architecture Components

### 1. Tool Definitions (`gemini-tools.js`)

Defines the "functions" the AI can call during conversations:

```javascript
{
  name: 'signalContentReadyForGeneration',
  description: 'Call when ALL information is gathered',
  parameters: {
    type: 'OBJECT',
    properties: {
      summary: { type: 'STRING', description: '...' },
      contentType: { type: 'STRING', enum: ['PROJECT', 'EXPERIENCE', 'BLOG', 'SKILL'] }
    },
    required: ['summary', 'contentType']
  }
}
```

**Available Tools:**
- `signalContentReadyForGeneration` - Ends conversation, triggers content generation
- `signalEditReadyForGeneration` - Ends edit session with change summary
- `updateContentType` - Corrects content type during conversation
- `fetchExistingPost` - Retrieves existing post for editing

### 2. System Prompts (`system-prompts.js`)

A single, comprehensive prompt that turns the AI into an "agent" with clear objectives.

**Structure:**
```
### PERSONA ###
- Who the AI is and what it does

### PRIMARY DIRECTIVE ###
- The main goal

### CURRENT CONTEXT ###
- User portfolio data
- Existing posts
- Skills and categories

### CONTENT TYPE GUIDE ###
- How to classify content
- Disambiguation rules

### YOUR THINKING PROCESS ###
- Step-by-step reasoning framework
- Completion criteria

### AVAILABLE TOOLS ###
- What tools can be called and when

### CRITICAL RULES ###
- MUST DO / NEVER DO guidelines

### FEW-SHOT EXAMPLES ###
- Example conversations showing correct behavior
```

### 3. Session Handler (`gemini.js`)

The refactored `handleAISession` method:

```javascript
async handleAISession(mode, contentType, initialInfo, chatHistory, context = {}) {
  // 1. Build consolidated system prompt
  const systemPrompt = buildConversationalSystemPrompt(mode, contentType, initialInfo, context);
  
  // 2. Initialize model with system prompt AND tools
  const sessionModel = this.genAI.getGenerativeModel({
    model: MODEL_CONFIG.FLASH,
    systemInstruction: systemPrompt,
    tools: AI_SESSION_TOOLS,  // ← The key addition
    safetySettings: SAFETY_SETTINGS
  });
  
  // 3. Start chat with history
  const chat = sessionModel.startChat({ history: [...], generationConfig: {...} });
  
  // 4. Send message
  const result = await chat.sendMessage(lastUserMessage);
  const response = result.response;
  
  // 5. Check for function calls (structured responses)
  const functionCalls = response.functionCalls();
  if (functionCalls && functionCalls.length > 0) {
    return await this._handleFunctionCall(functionCalls[0], contentType);
  }
  
  // 6. Otherwise, it's a conversational question
  return {
    message: response.text(),
    done: false,
    contentType: contentType
  };
}
```

---

## How It Works: Conversation Flow

### Create Mode Example

1. **User starts conversation:**
   ```
   User: "I want to add my Google internship"
   ```

2. **AI analyzes with structured thinking:**
   - Checks content type → Should be EXPERIENCE
   - Evaluates completeness → Missing details
   - Decides action → Ask clarifying question

3. **AI asks questions (text response):**
   ```
   AI: "Great! What was your role title at Google?"
   ```

4. **User provides more info:**
   ```
   User: "I was a Software Engineering Intern from June to August 2024"
   ```

5. **AI continues gathering:**
   ```
   AI: "Nice! What were your main responsibilities?"
   ```

6. **User completes information:**
   ```
   User: "I built a dashboard using React and worked on the backend API with Python"
   ```

7. **AI signals completion (function call):**
   ```javascript
   functionCall: {
     name: 'signalContentReadyForGeneration',
     args: {
       contentType: 'EXPERIENCE',
       summary: 'Google Software Engineering Internship, June-August 2024. Built dashboard with React, worked on backend API with Python. Main responsibilities include...'
     }
   }
   ```

8. **Backend receives structured response:**
   ```javascript
   {
     done: true,
     summary: "...",
     contentType: "EXPERIENCE",
     message: "Perfect! I have everything I need."
   }
   ```

### Content Type Correction Example

1. **User says "blog" but describes a job:**
   ```
   User: "I want to write a blog about my time at Microsoft as a PM"
   ```

2. **AI detects mismatch and calls function:**
   ```javascript
   functionCall: {
     name: 'updateContentType',
     args: {
       newContentType: 'EXPERIENCE',
       reason: 'User is describing their job role and responsibilities, not writing an article'
     }
   }
   ```

3. **Backend adjusts and continues:**
   ```javascript
   {
     done: false,
     contentType: 'EXPERIENCE',
     message: "Understood. Let me adjust - we'll create this as experience content instead. What was your role and where did you work?"
   }
   ```

---

## Prompt Engineering Best Practices Applied

### 1. Clear Delimiters and Structure

We use `###` headers and `---` separators to create visual hierarchy:

```
### PERSONA ###
...

### PRIMARY DIRECTIVE ###
...

---

### CRITICAL RULES ###
```

This helps the model distinguish between instructions, data, and context.

### 2. Chain of Thought Reasoning

The prompt explicitly tells the AI *how to think*:

```
### YOUR THINKING PROCESS ###

Before each response, mentally follow these steps:

1. **Analyze & Understand:** What information is the user providing?
2. **Check for Goal Completion:** Do I have enough information?
3. **Consult Tools:** Should I call a tool right now?
4. **Ask the Next Best Question:** What's the most important missing piece?
```

This dramatically improves decision quality.

### 3. Few-Shot Examples

We include example conversations showing correct behavior:

```
**Example 1: Content Type Correction**

User: "I'd like to write about my internship at Google."

AI Internal Thought: The user said "write about" but they're describing a job. This is EXPERIENCE, not BLOG.

AI (calls updateContentType):
- newContentType: "EXPERIENCE"
- reason: "User is describing their role, not writing an article"
```

This teaches the model when and why to use specific tools.

### 4. Positive & Negative Constraints

Clear rules about what the AI MUST and MUST NEVER do:

```
**MUST DO:**
- You MUST call signalContentReadyForGeneration to end successfully
- You MUST ask only ONE question per message

**NEVER EVER:**
- NEVER write the final markdown yourself
- NEVER use markdown in conversational responses
```

---

## Why This is Better

| Aspect | Old Approach | New Approach |
|--------|-------------|--------------|
| **Reliability** | JSON parsing can fail with malformed strings | API guarantees valid structured objects |
| **Maintainability** | Update prompts in multiple places | Single system prompt |
| **Clarity** | Guess AI intent from text | Explicit function calls declare intent |
| **Extensibility** | Add new regex patterns | Add new tool definitions |
| **Error Handling** | Try/catch JSON.parse() | No parsing needed |
| **Type Safety** | Manual validation | Parameters validated by model |

---

## Adding New Capabilities

Want to add a new feature? Here's how:

### 1. Define the Tool

Add to `gemini-tools.js`:

```javascript
{
  name: 'suggestRelatedContent',
  description: 'Suggest related portfolio pieces that could be created',
  parameters: {
    type: 'OBJECT',
    properties: {
      relatedTypes: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Array of suggested content types'
      }
    },
    required: ['relatedTypes']
  }
}
```

### 2. Update System Prompt

Tell the AI about the new tool in `system-prompts.js`:

```javascript
### AVAILABLE TOOLS ###
...
- `suggestRelatedContent`: After completing a project, suggest a blog post about it
```

### 3. Handle the Function Call

Add a case in `gemini.js`:

```javascript
case 'suggestRelatedContent':
  return {
    done: false,
    suggestions: args.relatedTypes,
    message: "I noticed you could also create...",
    contentType: currentContentType
  };
```

That's it! No regex, no manual parsing, just structured additions.

---

## Performance Considerations

### Token Efficiency

The consolidated prompt is large (~2-3K tokens) but only sent once per conversation. Subsequent turns only include:
- User message
- AI response
- Function call (if any)

This is more efficient than re-sending multiple separate prompts.

### Model Choice

- **Flash Model** (`gemini-2.0-flash`): For conversations (fast, cheap)
- **Pro Model** (`gemini-2.5-pro`): For final content generation (high quality)

Function Calling works with both models.

---

## Testing & Validation

### Unit Testing Function Handlers

```javascript
describe('handleFunctionCall', () => {
  it('should handle signalContentReadyForGeneration', async () => {
    const result = await service._handleFunctionCall({
      name: 'signalContentReadyForGeneration',
      args: { summary: 'Test', contentType: 'PROJECT' }
    }, 'PROJECT');
    
    expect(result.done).toBe(true);
    expect(result.contentType).toBe('PROJECT');
  });
});
```

### Integration Testing

Test full conversation flows:
1. Start session
2. Provide information
3. Verify function calls
4. Check final output

---

## Migration Notes

### Backward Compatibility

The API endpoints (`/api/ai/session`, `/api/ai/generate`) remain unchanged. Only the internal implementation changed.

### Rollback Plan

If issues arise, the old regex-based methods are commented out (not deleted) and can be restored by:
1. Removing `tools: AI_SESSION_TOOLS` from model initialization
2. Calling `_parseSessionResponse` instead of checking `functionCalls()`

---

## Future Enhancements

With this architecture, we can easily add:

1. **Skill & Tag Suggestions** - AI suggests relevant skills during conversation
2. **Content Linking** - AI suggests linking related posts
3. **Validation** - AI validates URLs, dates, formats before completion
4. **Multi-turn Refinement** - AI asks user to confirm extracted details
5. **Context-Aware Suggestions** - "I see you have 3 projects with React, want to create a skill page for it?"

All by simply adding new function declarations and updating the system prompt.

---

## References

- [Gemini Function Calling Documentation](https://ai.google.dev/docs/function_calling)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [System Prompt Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)

---

## Summary

This refactoring transforms the AI system from a fragile text-parsing approach to a robust, structured Function Calling architecture. The key benefits are:

1. ✅ **Reliability** - No more JSON parsing errors
2. ✅ **Maintainability** - Single system prompt to manage
3. ✅ **Clarity** - Explicit function calls show AI intent
4. ✅ **Extensibility** - Easy to add new capabilities
5. ✅ **Production-Ready** - Industry best practices applied

The system is now ready for scale and future enhancements! 🚀

