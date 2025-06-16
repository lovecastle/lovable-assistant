-- Database Migration for Multi-User Support
-- This migration updates the Lovable Assistant database schema to support multiple users
-- with private data access and subscription licensing

-- 1. Update user_preferences table to properly support user settings
ALTER TABLE user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_pkey;

ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Update primary key to id instead of user_id
ALTER TABLE user_preferences 
ADD PRIMARY KEY (id);

-- Create unique index on user_id for backwards compatibility
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 2. Update prompt_templates table to support user-specific templates
ALTER TABLE prompt_templates
ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default',
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);

-- 3. Add user_id to all existing tables for data isolation
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

ALTER TABLE assistant_conversations 
ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_id ON assistant_conversations(user_id);

ALTER TABLE project_manager 
ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_project_manager_user_id ON project_manager(user_id);

ALTER TABLE conversation_embeddings 
ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_user_id ON conversation_embeddings(user_id);

-- 4. Create new table for UI preferences (localStorage migrations)
CREATE TABLE IF NOT EXISTS user_ui_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_user_ui_preferences_user_id ON user_ui_preferences(user_id);

-- 5. Create new table for AI model preferences
CREATE TABLE IF NOT EXISTS user_ai_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  ai_provider TEXT DEFAULT 'claude',
  claude_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  openai_model TEXT DEFAULT 'gpt-4o',
  gemini_model TEXT DEFAULT 'gemini-1.5-pro-latest',
  custom_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_user_id ON user_ai_preferences(user_id);

-- 6. Create table for user sessions (for multi-device access)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions(device_id);

-- 7. Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prompt_templates_updated_at ON prompt_templates;
CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_ui_preferences_updated_at ON user_ui_preferences;
CREATE TRIGGER update_user_ui_preferences_updated_at
  BEFORE UPDATE ON user_ui_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_ai_preferences_updated_at ON user_ai_preferences;
CREATE TRIGGER update_user_ai_preferences_updated_at
  BEFORE UPDATE ON user_ai_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Row Level Security (RLS) policies for user data isolation
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_manager ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ui_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
-- Note: You'll need to implement authentication to use these properly
-- For now, we'll create basic policies that can be enhanced later

-- Example RLS policy for conversations (repeat for other tables)
CREATE POLICY conversations_isolation ON conversations
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY assistant_conversations_isolation ON assistant_conversations
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY project_manager_isolation ON project_manager
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;