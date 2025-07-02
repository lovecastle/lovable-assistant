# AI Proxy Edge Function

This Supabase Edge Function provides secure access to the Gemini AI API for the Lovable Assistant Chrome Extension.

## Security Features

- **API Key Protection**: The Gemini API key is stored as a Supabase secret, not in the extension code
- **User Authentication**: Only authenticated users can access the AI API
- **JWT Verification**: Each request is verified using Supabase authentication
- **Audit Logging**: All AI requests are logged for security monitoring
- **CORS Protection**: Proper CORS headers for secure cross-origin requests

## Setup Instructions

### 1. Deploy the Edge Function

```bash
# From the project root, deploy the function
supabase functions deploy ai-proxy
```

### 2. Set Environment Variables

Set the following secrets in your Supabase project:

```bash
# Set the Gemini API key as a secret
supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key_here

# The following are automatically available in Edge Functions:
# SUPABASE_URL - Your project URL
# SUPABASE_SERVICE_ROLE_KEY - Service role key for server-side operations
```

### 3. Enable the Function

Make sure the function is enabled and accessible via:
```
https://your-project-id.supabase.co/functions/v1/ai-proxy
```

## Function Endpoints

### POST /ai-proxy

Makes an authenticated AI request.

**Headers:**
- `Authorization: Bearer <jwt_token>` - User's Supabase JWT token
- `Content-Type: application/json`
- `apikey: <anon_key>` - Supabase anon key

**Request Body:**
```json
{
  "prompt": "Your AI prompt here"
}
```

**Response:**
```json
{
  "success": true,
  "data": "AI response text"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security Benefits

1. **No Exposed API Keys**: The Gemini API key is never exposed in the browser or extension code
2. **User Verification**: Only authenticated Supabase users can make requests
3. **Rate Limiting**: Can be easily extended with rate limiting per user
4. **Audit Trail**: All requests are logged with user IDs
5. **Centralized Control**: Easy to monitor, rate limit, or revoke access

## Usage in Extension

The extension automatically uses this secure proxy when users are signed in. No additional configuration is required on the client side.