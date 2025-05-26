-- Simple Database Migration for Lovable Assistant
-- Run this in your Supabase SQL Editor

-- Add new columns (will be ignored if they already exist)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS user_message_id TEXT,
ADD COLUMN IF NOT EXISTS lovable_message_id TEXT,
ADD COLUMN IF NOT EXISTS message_group_id TEXT,
ADD COLUMN IF NOT EXISTS auto_capture BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_lovable_message_id ON conversations(lovable_message_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_message_id ON conversations(user_message_id);
CREATE INDEX IF NOT EXISTS idx_conversations_auto_capture ON conversations(auto_capture);

-- Show current table structure to verify
\d conversations;

-- Optional: Check if migration worked
SELECT 
  COUNT(*) as total_conversations,
  COUNT(user_message_id) as with_user_message_id,
  COUNT(lovable_message_id) as with_lovable_message_id,
  COUNT(CASE WHEN auto_capture = true THEN 1 END) as auto_captured
FROM conversations;
