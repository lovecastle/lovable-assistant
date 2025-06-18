-- User-Owned Database Schema for Lovable Assistant
-- This schema is designed to be run in each user's own Supabase project
-- No special privileges required - works with standard user permissions

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User settings table (replaces the need for user profiles)
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Extension settings
  auto_capture BOOLEAN DEFAULT TRUE,
  enhance_prompts BOOLEAN DEFAULT TRUE,
  show_notifications BOOLEAN DEFAULT TRUE,
  tab_rename BOOLEAN DEFAULT TRUE,
  
  -- AI Provider settings
  ai_provider TEXT DEFAULT 'claude' CHECK (ai_provider IN ('claude', 'openai', 'gemini')),
  claude_api_key TEXT,
  openai_api_key TEXT,
  gemini_api_key TEXT,
  
  -- UI preferences
  ui_preferences JSONB DEFAULT '{}',
  
  -- User info (since this is their own database)
  user_name TEXT,
  user_email TEXT,
  
  -- Extension metadata
  extension_version TEXT DEFAULT '1.0.0',
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom prompt templates table
CREATE TABLE IF NOT EXISTS custom_prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL,
  category TEXT DEFAULT 'custom',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE
);

-- Project managers table (existing structure, keeping for compatibility)
CREATE TABLE IF NOT EXISTS project_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  project_url TEXT NOT NULL,
  description TEXT DEFAULT '',
  knowledge TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (existing structure, keeping for compatibility)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL,
  conversation_data JSONB NOT NULL,
  project_context JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  auto_capture BOOLEAN DEFAULT FALSE,
  lovable_message_id TEXT,
  user_id TEXT DEFAULT 'user'
);

-- AI preferences table (existing structure, keeping for compatibility)
CREATE TABLE IF NOT EXISTS ai_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT DEFAULT 'user',
  ai_provider TEXT DEFAULT 'claude',
  claude_api_key TEXT,
  openai_api_key TEXT,
  gemini_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UI preferences table (existing structure, keeping for compatibility)
CREATE TABLE IF NOT EXISTS ui_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT DEFAULT 'user',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification settings table (existing structure, keeping for compatibility)
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT DEFAULT 'user',
  desktop_notifications BOOLEAN DEFAULT TRUE,
  tab_rename BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_templates_category ON custom_prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_custom_templates_created_at ON custom_prompt_templates(created_at);
CREATE INDEX IF NOT EXISTS idx_project_managers_project_id ON project_managers(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_lovable_message_id ON conversations(lovable_message_id);

-- Enable Row Level Security (optional - since user owns the database)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all access (since it's the user's own database)
-- These policies essentially allow everything, but RLS is enabled for future flexibility

CREATE POLICY "Allow all access to user_settings" ON user_settings FOR ALL USING (true);
CREATE POLICY "Allow all access to custom_templates" ON custom_prompt_templates FOR ALL USING (true);
CREATE POLICY "Allow all access to project_managers" ON project_managers FOR ALL USING (true);
CREATE POLICY "Allow all access to conversations" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all access to ai_preferences" ON ai_preferences FOR ALL USING (true);
CREATE POLICY "Allow all access to ui_preferences" ON ui_preferences FOR ALL USING (true);
CREATE POLICY "Allow all access to notification_settings" ON notification_settings FOR ALL USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_templates_updated_at
  BEFORE UPDATE ON custom_prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_managers_updated_at
  BEFORE UPDATE ON project_managers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_preferences_updated_at
  BEFORE UPDATE ON ai_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ui_preferences_updated_at
  BEFORE UPDATE ON ui_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default user settings row
INSERT INTO user_settings (id) 
SELECT uuid_generate_v4() 
WHERE NOT EXISTS (SELECT 1 FROM user_settings);

-- Insert default AI preferences
INSERT INTO ai_preferences (user_id, ai_provider) 
SELECT 'user', 'claude'
WHERE NOT EXISTS (SELECT 1 FROM ai_preferences WHERE user_id = 'user');

-- Insert default UI preferences
INSERT INTO ui_preferences (user_id, preferences) 
SELECT 'user', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ui_preferences WHERE user_id = 'user');

-- Insert default notification settings
INSERT INTO notification_settings (user_id, desktop_notifications, tab_rename) 
SELECT 'user', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM notification_settings WHERE user_id = 'user');

-- Insert some helpful default custom templates
INSERT INTO custom_prompt_templates (name, description, template_content, category) 
SELECT * FROM (VALUES
  ('Quick Bug Fix', 'Template for reporting and fixing bugs', 
   E'I found this issue:\n\n{issue_description}\n\nSteps to reproduce:\n1. {step_1}\n2. {step_2}\n3. {step_3}\n\nExpected: {expected_behavior}\nActual: {actual_behavior}\n\nCan you help me fix this?', 
   'debugging'),
  
  ('Feature Request', 'Template for new feature requests', 
   E'I would like to add this feature:\n\n{feature_description}\n\nUse case:\n{use_case}\n\nAcceptance criteria:\n- {criteria_1}\n- {criteria_2}\n- {criteria_3}\n\nPlease help me implement this.', 
   'planning'),
  
  ('Code Review', 'Template for code review requests', 
   E'Please review this code:\n\n```{language}\n{code}\n```\n\nSpecific areas to focus on:\n- {focus_area_1}\n- {focus_area_2}\n- {focus_area_3}\n\nAny suggestions for improvement?', 
   'review'),
   
  ('Performance Issue', 'Template for performance optimization', 
   E'I\'m experiencing performance issues with:\n\n{component}\n\nCurrent behavior:\n{current_behavior}\n\nPerformance metrics:\n{metrics}\n\nCan you help me identify bottlenecks and optimize this?', 
   'optimization'),
   
  ('API Integration', 'Template for API integration help', 
   E'I need help integrating this API:\n\nAPI: {api_name}\nEndpoint: {endpoint}\nMethod: {method}\n\nIssue: {issue}\n\nExpected: {expected}\nActual: {actual}\n\nCan you help me troubleshoot this integration?', 
   'integration')
) AS t(name, description, template_content, category)
WHERE NOT EXISTS (SELECT 1 FROM custom_prompt_templates WHERE name = t.name);

-- Create a view for easy access to all user data (optional)
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM project_managers) as total_projects,
  (SELECT COUNT(*) FROM conversations) as total_conversations,
  (SELECT COUNT(*) FROM custom_prompt_templates) as custom_templates,
  (SELECT ai_provider FROM ai_preferences WHERE user_id = 'user' LIMIT 1) as current_ai_provider,
  (SELECT auto_capture FROM user_settings LIMIT 1) as auto_capture_enabled,
  (SELECT show_notifications FROM user_settings LIMIT 1) as notifications_enabled;

-- Grant permissions (these should work in user's own database)
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Lovable Assistant database schema created successfully!';
  RAISE NOTICE 'Tables created: user_settings, custom_prompt_templates, project_managers, conversations, ai_preferences, ui_preferences, notification_settings';
  RAISE NOTICE 'Default data inserted. Your extension is ready to use!';
END $$;