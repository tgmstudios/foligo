# Gemini Service Refactoring Guide

## Overview

The Gemini service has been comprehensively refactored to improve maintainability, reliability, and production-readiness. This document explains the changes and how to use the refactored service.

## What Changed

### 1. **Custom Error Classes** (`errors.js`)

Previously, the service used generic `Error` objects. Now we have specific error types:

- `GeminiError`: Base error class for all Gemini-related errors
- `GeminiConfigError`: Configuration issues (e.g., missing API key)
- `GeminiAPIError`: API call failures
- `GeminiParseError`: JSON parsing or response validation failures
- `GeminiValidationError`: Input validation errors

**Benefits:**
- Better error handling and debugging
- Easier to catch and handle specific error types
- More informative error messages with context

**Usage:**
```javascript
try {
  await geminiService.generateContent(prompt);
} catch (error) {
  if (error instanceof GeminiConfigError) {
    // Handle configuration errors
  } else if (error instanceof GeminiAPIError) {
    // Handle API errors (can retry)
  }
}
```

### 2. **Externalized Prompts** (`prompts.js`)

All prompt templates have been moved from inline strings to a centralized `prompts.js` file.

**Benefits:**
- Easier to maintain and update prompts
- Prompts can be version controlled separately
- Reduces clutter in main service file
- Easier to A/B test different prompts

**Structure:**
```javascript
const { prompts } = require('./prompts');

// Access prompts
const blogPrompt = prompts.buildBlog(topic, details);
const chatPrompt = prompts.chatWithUser();
```

### 3. **Structured Logging** (`logger.js`)

Replaced `console.log` with Winston structured logger.

**Benefits:**
- Configurable log levels (debug, info, warn, error)
- File rotation for production logs
- Structured log data (JSON format)
- Better debugging and monitoring

**Configuration:**
- Development: Logs to console with colors
- Production: Logs to files (`logs/gemini-service.log`, `logs/gemini-error.log`)
- Log level controlled by `LOG_LEVEL` environment variable

**Usage:**
```javascript
this.logger.info('Operation started', { context: 'value' });
this.logger.error('Operation failed', { error: error.message });
this.logger.debug('Debug info', { data: detailedData });
```

### 4. **Centralized Configuration** (`gemini-config.js`)

All configuration constants are now in one file:

- Model names (`MODEL_CONFIG`)
- Generation configurations (`GENERATION_CONFIG`)
- Safety settings (`SAFETY_SETTINGS`)
- System instructions (`SYSTEM_INSTRUCTIONS`)
- Retry configuration (`RETRY_CONFIG`)

**Benefits:**
- Single source of truth for configuration
- Easy to adjust settings for different environments
- Consistent configuration across the service

**Available Configs:**
```javascript
GENERATION_CONFIG.DEFAULT    // Standard generation
GENERATION_CONFIG.CREATIVE   // Higher creativity (blog posts)
GENERATION_CONFIG.PRECISE    // Lower temperature (metadata)
GENERATION_CONFIG.CHAT       // Conversational
GENERATION_CONFIG.VERY_PRECISE // Very low temp (classification)
GENERATION_CONFIG.SHORT      // Short responses (titles)
```

### 5. **Retry Logic with Exponential Backoff** (`retry.js`)

Added automatic retry for transient failures.

**Benefits:**
- Resilient to temporary network issues
- Handles rate limiting gracefully
- Exponential backoff with jitter prevents thundering herd

**Configuration:**
- Max retries: 3 (configurable)
- Initial delay: 1000ms
- Max delay: 10000ms
- Backoff multiplier: 2

**Retryable Errors:**
- Network errors (ECONNRESET, ETIMEDOUT, etc.)
- HTTP 429 (Too Many Requests)
- HTTP 500, 502, 503, 504 (Server errors)

### 6. **System Instructions**

Models now use the `systemInstruction` feature for better guidance.

**Benefits:**
- More consistent responses
- Better adherence to formatting rules
- Clearer role definition for the AI

**Instructions:**
- Flash Model: Conversational content creation assistant
- Pro Model: Professional content writer
- Chat Model: Plain text conversational assistant

### 7. **Safety Settings**

Explicit safety thresholds are now configured:

- Harassment: BLOCK_ONLY_HIGH
- Hate Speech: BLOCK_ONLY_HIGH
- Sexually Explicit: BLOCK_MEDIUM_AND_ABOVE
- Dangerous Content: BLOCK_ONLY_HIGH

**Benefits:**
- Predictable content filtering
- Appropriate for portfolio content
- Prevents unexpected blocks

### 8. **Refactored Large Methods**

#### `handleAISession` Split Into:
- `_buildSystemPrompt()`: Builds the system prompt based on mode
- `_formatChatHistory()`: Formats messages for API
- `_parseSessionResponse()`: Parses and handles response
- `_checkForToolcall()`: Detects toolcall requests
- `_checkForCompletion()`: Detects completion signals
- `_handleCompletion()`: Handles conversation completion
- `_checkContentTypeCorrection()`: Infers and corrects content type

#### `generateFinalContent` Split Into:
- `_buildContentGenerationPrompt()`: Builds the generation prompt
- `_extractAndCleanContent()`: Extracts skills/tags and cleans content
- `_cleanGeneratedContent()`: Removes unwanted text patterns
- `_getFallbackTitle()`: Provides fallback titles

**Benefits:**
- Easier to test individual components
- Better code organization
- Easier to maintain and extend

### 9. **Fail Fast Constructor**

Constructor now throws an error immediately if API key is missing.

**Before:**
```javascript
if (!this.apiKey) {
  console.warn('API key not configured');
  return; // Service partially initialized
}
```

**After:**
```javascript
if (!this.apiKey) {
  throw new GeminiConfigError('GEMINI_API_KEY not found');
}
```

**Benefits:**
- Immediate feedback on misconfiguration
- Prevents runtime errors later
- Clear error messages

## Migration Guide

### For Developers

1. **Environment Variables**: Ensure `GEMINI_API_KEY` is set (service will throw error if missing)

2. **Error Handling**: Update error handling to use new error classes:
```javascript
try {
  await geminiService.someMethod();
} catch (error) {
  if (error instanceof GeminiAPIError) {
    // Retry or handle API error
  } else if (error instanceof GeminiConfigError) {
    // Fix configuration
  }
}
```

3. **Logging**: Set `LOG_LEVEL` environment variable (`debug`, `info`, `warn`, `error`)

4. **Logs Directory**: Ensure `logs/` directory exists (created automatically)

### Breaking Changes

None! The public API remains the same. All changes are internal improvements.

### New Features

1. **Automatic Retries**: Network failures are automatically retried
2. **Better Logging**: Structured logs with context
3. **Type Safety**: Custom error classes for better error handling

## Performance Improvements

1. **Retry Logic**: Reduces failures from transient errors
2. **Optimized Prompts**: Better organized and more efficient
3. **Logging**: Minimal performance impact with structured logging

## Testing

All existing tests should pass without modification. Additional tests can be added for:

- Custom error classes
- Retry logic
- Prompt generation
- Individual helper methods

## Configuration Reference

### Environment Variables

- `GEMINI_API_KEY` (required): Google Gemini API key
- `LOG_LEVEL` (optional): Logging level (default: `info`)
- `NODE_ENV` (optional): Environment (`production` for file logging)

### Model Configuration

Located in `gemini-config.js`:
- `MODEL_CONFIG.FLASH`: Fast model for questions/chat
- `MODEL_CONFIG.PRO`: High-quality model for content generation

### Generation Configs

Pre-configured settings for different use cases:
- `DEFAULT`: Standard generation (temp: 0.7)
- `CREATIVE`: Blog posts, creative content (temp: 0.8)
- `PRECISE`: Metadata extraction (temp: 0.3)
- `CHAT`: Conversational (temp: 0.7)
- `VERY_PRECISE`: Classification (temp: 0.1)
- `SHORT`: Titles, short responses (temp: 0.3)

## File Structure

```
api/src/services/
├── gemini.js                 # Main service (refactored)
├── gemini-config.js          # Configuration constants
├── prompts.js                # Prompt templates
├── logger.js                 # Winston logger setup
├── retry.js                  # Retry logic with backoff
├── errors.js                 # Custom error classes
└── REFACTORING_GUIDE.md      # This file
```

## Best Practices

1. **Use Structured Logging**: Include context in log messages
```javascript
this.logger.info('Operation', { userId, contentType, duration });
```

2. **Handle Errors Gracefully**: Catch specific error types
```javascript
try {
  // API call
} catch (error) {
  if (error instanceof GeminiAPIError && isRetryable(error)) {
    // Retry handled automatically
  }
}
```

3. **Configure for Environment**: Set appropriate log levels and safety settings

4. **Monitor Logs**: Check `logs/gemini-error.log` for issues in production

## Future Enhancements

Potential improvements for future versions:

1. **Rate Limiting**: Built-in rate limiter for API calls
2. **Caching**: Cache frequent responses
3. **Metrics**: Prometheus/OpenTelemetry metrics
4. **Circuit Breaker**: Prevent cascading failures
5. **A/B Testing**: Framework for testing different prompts
6. **Streaming**: Support for streaming responses
7. **Batch Processing**: Process multiple requests efficiently

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Verify environment variables
3. Check error messages (now more descriptive)
4. Review this guide

## Changelog

### Version 2.0.0 (Current)

- ✅ Custom error classes
- ✅ Externalized prompts
- ✅ Structured logging (Winston)
- ✅ Centralized configuration
- ✅ Retry logic with exponential backoff
- ✅ Fail fast constructor
- ✅ System instructions
- ✅ Safety settings
- ✅ Refactored large methods
- ✅ Comprehensive documentation

### Version 1.0.0 (Previous)

- Basic Gemini API integration
- Content generation methods
- Simple error handling
- Console logging

