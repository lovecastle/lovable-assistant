-- Database Schema Update for Lovable Assistant Chrome Extension
-- Run these commands in your Supabase SQL editor to add new columns

-- Add new columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS user_message_id TEXT,
ADD COLUMN IF NOT EXISTS lovable_message_id TEXT,
ADD COLUMN IF NOT EXISTS message_group_id TEXT,
ADD COLUMN IF NOT EXISTS auto_capture BOOLEAN DEFAULT FALSE;

-- Create index for duplicate checking on lovable_message_id
CREATE INDEX IF NOT EXISTS idx_conversations_lovable_message_id ON conversations(lovable_message_id);

-- Create index for user_message_id for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_message_id ON conversations(user_message_id);

-- Create index for message_group_id
CREATE INDEX IF NOT EXISTS idx_conversations_message_group_id ON conversations(message_group_id);

-- Create index for auto_capture filtering
CREATE INDEX IF NOT EXISTS idx_conversations_auto_capture ON conversations(auto_capture);

-- Optional: Add unique constraint to prevent duplicate lovable_message_id per project
-- Uncomment this if you want to enforce uniqueness at database level
-- ALTER TABLE conversations 
-- ADD CONSTRAINT unique_lovable_message_per_project UNIQUE (project_id, lovable_message_id);

-- Update existing records to extract data from project_context (if any exist)
UPDATE conversations 
SET 
  user_message_id = project_context->>'userId',
  lovable_message_id = project_context->>'lovableId', 
  message_group_id = project_context->>'messageGroupId',
  auto_capture = COALESCE((project_context->>'autoCapture')::boolean, false)
WHERE project_context IS NOT NULL 
  AND (user_message_id IS NULL OR lovable_message_id IS NULL);

-- Verify the update
SELECT 
  COUNT(*) as total_conversations,
  COUNT(user_message_id) as with_user_message_id,
  COUNT(lovable_message_id) as with_lovable_message_id,
  COUNT(CASE WHEN auto_capture = true THEN 1 END) as auto_captured,
  COUNT(CASE WHEN auto_capture = false THEN 1 END) as manually_scraped
FROM conversations;
