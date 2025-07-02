# 🚀 Secure AI Deployment Instructions

## ✅ Completed: Edge Function Deployment

The `ai-proxy` Edge Function has been successfully deployed to Supabase project `dwbrjztmskvzpyufwxnt`.

**Function Details:**
- **Name:** ai-proxy
- **Status:** ACTIVE
- **URL:** `https://dwbrjztmskvzpyufwxnt.supabase.co/functions/v1/ai-proxy`
- **Verification:** JWT verification enabled

## 🔑 Required: Set API Key Secret

You need to set the Gemini API key as a Supabase secret. Run this command in your terminal:

```bash
# Set the Gemini API key as a secret
npx supabase secrets set --project-ref dwbrjztmskvzpyufwxnt GEMINI_API_KEY=AIzaSyAOVowi8mG3prvCtZGHSzimec4oRNZp3Gs
```

**Alternative method via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/dwbrjztmskvzpyufwxnt/functions
2. Click on the "ai-proxy" function
3. Go to "Environment Variables" tab
4. Add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyAOVowi8mG3prvCtZGHSzimec4oRNZp3Gs`

## 🔒 Security Features Implemented

✅ **API Key Protection:** Gemini API key stored as Supabase secret
✅ **User Authentication:** Only authenticated users can access AI
✅ **JWT Verification:** Each request verified using Supabase auth
✅ **CORS Protection:** Secure cross-origin headers
✅ **Audit Logging:** All requests logged with user IDs
✅ **No Client Exposure:** API key never sent to browser

## 📡 Extension Updates

The Chrome extension has been updated to:
- ✅ Use secure Edge Function instead of direct API calls
- ✅ Require user authentication for AI features
- ✅ Remove all hardcoded API keys from extension code
- ✅ Maintain same user experience with enhanced security

## 🧪 Testing the Secure Flow

After setting the API key secret:

1. **Reload the extension** in Chrome
2. **Sign in** to the Lovable Assistant
3. **Try AI features** (Translate, Rewrite, Enhance)
4. **Verify security:**
   - Unauthenticated users get "User not authenticated" error
   - All requests go through secure proxy
   - API key never visible in browser/network tabs

## 🎯 Function Endpoint

```
POST https://dwbrjztmskvzpyufwxnt.supabase.co/functions/v1/ai-proxy

Headers:
- Authorization: Bearer <user_jwt_token>
- Content-Type: application/json
- apikey: <supabase_anon_key>

Body:
{
  "prompt": "Your AI prompt here"
}
```

The extension automatically handles all authentication and requests for you!