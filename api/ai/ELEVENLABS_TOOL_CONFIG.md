# ElevenLabs Tool Configuration

## Update Your Agent Tool Configuration

Go to your ElevenLabs agent (https://elevenlabs.io/app/talk-to?agent_id=agent_1301k8emq0nzfwmbyta7254adhpv) and update the `process_portfolio_entry` tool with these settings:

### Tool Configuration:

```json
{
  "type": "webhook",
  "name": "process_portfolio_entry",
  "description": "Generates and creates portfolio content using the Foligo API.",
  "disable_interruptions": true,
  "force_pre_tool_speech": "auto",
  "execution_mode": "post_tool_speech",
  "response_timeout_secs": 30,
  "api_schema": {
    "url": "https://api.foligo.tech/api/ai/voice-webhook",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Send the summary and context to generate portfolio content",
      "properties": [
        {
          "id": "summary",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Complete summary synthesized from the conversation about the user's project or experience.",
          "required": true
        },
        {
          "id": "projectId",
          "type": "string",
          "value_type": "dynamic_variable",
          "description": "The project ID to create content in",
          "dynamic_variable": "user_project_id",
          "required": true
        },
        {
          "id": "contentType",
          "type": "string",
          "value_type": "dynamic_variable",
          "description": "The type of content to create",
          "dynamic_variable": "content_type",
          "required": false
        }
      ],
      "required": true
    },
    "request_headers": [
      {
        "type": "value",
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "dynamic_variables": {
    "dynamic_variable_placeholders": {
      "user_project_id": "123e4567-e89b-12d3-a456-426614174000",
      "content_type": "BLOG"
    }
  }
}
```

## Key Changes:

1. **URL**: Changed from `/api/projects/{projectId}/content/ai-generate` to `/api/ai/voice-webhook`
2. **Removed Path Params**: No more `{projectId}` in URL
3. **Removed Auth**: This endpoint is now public (no authentication required)
4. **Simplified Structure**: Summary, projectId, and contentType all in body
5. **Removed Authorization Header**: No bearer token needed

**Note**: The `/api/ai/voice-webhook` route is now public and placed before the authenticated `/api/ai` routes in `api/src/index.js` to allow ElevenLabs to call it without authentication.

## How It Works:

1. Widget passes `user_project_id` and `content_type` as dynamic variables
2. Agent collects summary from conversation
3. Agent calls webhook with: `{summary, projectId, contentType}`
4. Webhook generates content and returns it
5. Frontend receives and displays the content

