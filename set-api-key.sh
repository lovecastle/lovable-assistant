#!/bin/bash

# Script to set the Gemini API key as a Supabase secret
# Run this script from your terminal

echo "🔑 Setting Gemini API key as Supabase secret..."

# Set the API key using Supabase CLI
npx supabase secrets set --project-ref dwbrjztmskvzpyufwxnt GEMINI_API_KEY=AIzaSyAOVowi8mG3prvCtZGHSzimec4oRNZp3Gs

echo "✅ API key should now be set!"
echo "🔄 The Edge Function will automatically pick up the new environment variable."
echo "🧪 Try using the AI features in the extension again."