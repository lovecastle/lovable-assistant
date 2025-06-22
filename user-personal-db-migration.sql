-- =====================================================
-- Lovable Assistant - Personal Database Migration
-- =====================================================
-- This script sets up a complete personal database for new users
-- Run this in your Supabase SQL Editor to create all necessary tables,
-- insert default data, and configure security policies
-- 
-- Version: 1.0
-- Created: 2025-06-22
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- TABLE CREATION
-- =====================================================

-- Create prompt_templates table
-- Stores reusable prompt templates for different scenarios
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  shortcut TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL DEFAULT 'default',
  is_custom BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create user_preferences table
-- Stores user settings, API keys, and configuration
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  desktop_notification BOOLEAN DEFAULT FALSE,
  tab_rename BOOLEAN DEFAULT FALSE,
  auto_switch BOOLEAN DEFAULT FALSE,
  anthropic_api_key TEXT,
  anthropic_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  openai_api_key TEXT,
  openai_model TEXT DEFAULT 'gpt-4o',
  google_api_key TEXT,
  google_model TEXT DEFAULT 'gemini-1.5-pro-latest',
  supabase_id TEXT,
  supabase_anon_key TEXT
);

-- Create project_manager table
-- Stores project information and knowledge base
CREATE TABLE IF NOT EXISTS project_manager (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  project_url TEXT NOT NULL,
  description TEXT DEFAULT '',
  knowledge TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL DEFAULT 'default',
  CONSTRAINT project_manager_description_length CHECK (char_length(description) <= 150)
);

-- Create conversations table
-- Main table for storing Lovable.dev chat conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT,
  user_message TEXT NOT NULL,
  lovable_response TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_context JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  effectiveness_score INTEGER CHECK (effectiveness_score >= 1 AND effectiveness_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_message_id TEXT,
  lovable_message_id TEXT,
  message_group_id TEXT,
  auto_capture BOOLEAN DEFAULT FALSE,
  user_id TEXT NOT NULL DEFAULT 'default'
);

-- Create assistant_conversations table
-- Stores conversations with the AI assistant
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  metadata JSONB DEFAULT '{}',
  user_id TEXT NOT NULL DEFAULT 'default'
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lovable_message_id ON conversations(lovable_message_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING gin(tags);

-- Assistant conversations indexes
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_project_id ON assistant_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_created_at ON assistant_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_id ON assistant_conversations(user_id);

-- Project manager indexes
CREATE INDEX IF NOT EXISTS idx_project_manager_project_id ON project_manager(project_id);
CREATE INDEX IF NOT EXISTS idx_project_manager_user_id ON project_manager(user_id);

-- Prompt templates indexes
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_active ON prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_shortcut ON prompt_templates(shortcut);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_prompt_templates_updated_at 
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_manager_updated_at 
    BEFORE UPDATE ON project_manager
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assistant_conversations_updated_at 
    BEFORE UPDATE ON assistant_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE COMMENTS
-- =====================================================

-- Add comments to tables and columns for documentation
COMMENT ON TABLE project_manager IS 'Stores project settings and knowledge base for Lovable Assistant Project Manager';
COMMENT ON COLUMN project_manager.project_id IS 'Unique identifier from Lovable.dev project URL';
COMMENT ON COLUMN project_manager.description IS 'Short project description (max 150 characters)';
COMMENT ON COLUMN project_manager.knowledge IS 'Project-specific documentation, guidelines, and instructions';

COMMENT ON TABLE conversations IS 'Main table storing Lovable.dev chat conversations for analysis and reference';
COMMENT ON COLUMN conversations.effectiveness_score IS 'User-rated effectiveness score from 1-10';
COMMENT ON COLUMN conversations.auto_capture IS 'Whether this conversation was automatically captured';

COMMENT ON TABLE assistant_conversations IS 'Conversations between user and AI assistant within the extension';
COMMENT ON TABLE prompt_templates IS 'Reusable prompt templates categorized by use case';
COMMENT ON TABLE user_preferences IS 'User settings, API keys, and extension configuration';

-- =====================================================
-- DEFAULT DATA INSERTION
-- =====================================================

-- Insert default prompt templates
INSERT INTO prompt_templates (id, category, name, template, shortcut, created_at, updated_at, user_id, is_custom, is_active) VALUES
('fddfbc63-dd19-4e44-87a1-c64b56f85ad5','Design','UI Change','Make only visual updates—do not impact functionality or logic in any way. Fully understand how the current UI integrates with the app, ensuring logic, state management, and APIs remain untouched. Test thoroughly to confirm the app behaves exactly as before. Stop if there''s any doubt about unintended effects.','ui_change','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('2f06fc0c-129b-4329-aa81-a871c009c581','Error Debugging','Major Errors','This is the final attempt to fix this issue. Stop all changes and methodically re-examine the entire flow—auth, Supabase, Stripe, state management, and redirects—from the ground up. Map out what''s breaking and why, test everything in isolation, and do not proceed without absolute certainty.','major_errors','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('75de0d16-3c85-4618-ae6b-a6cf82ca8e08','Error Debugging','Clean up Console Logs','Carefully remove unnecessary `console.log` statements without affecting functionality or design. Review each log to ensure it''s non-critical, and document any that need alternative handling. Proceed methodically, testing thoroughly to confirm the app remains intact. Pause if uncertain about any log''s purpose.','clean_logs','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('8f12db0f-a14a-4cb9-a2fe-d336637f80a7','Error Debugging','Critical Errors','The issue remains unresolved and requires a serious, thorough analysis. Step back and examine the code deeply—trace the entire flow, inspect logs, and analyze all dependencies without editing anything. Identify the exact root cause with complete certainty before proposing or making any changes. No assumptions or quick fixes—only precise, evidence-based insights. Do not edit any code yet.','critical_errors','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('d80ff077-3134-4572-baa1-5d763cd59d63','Error Debugging','Extreme Errors','This issue remains unresolved, and we need to **stop and rethink the entire approach**. Do not edit any code. Instead, conduct a deep, methodical analysis of the system. Map out the full flow, trace every interaction, log, and dependency step by step. Document exactly what is supposed to happen, what is actually happening, and where the disconnect occurs. Provide a detailed report explaining the root cause with clear evidence. If there are gaps, uncertainties, or edge cases, highlight them for discussion. Until you can identify the **precise, proven source of the issue**, do not propose or touch any fixes. This requires total focus, no guesses, and no shortcuts.','extreme_errors','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('de43df99-ab08-46ce-95da-09b40ff79db3','Refactoring','Refactoring After Request Made by Lovable','Refactor this file without changing the UI or functionality—everything must behave and look exactly the same. Focus on improving code structure and maintainability only. Document the current functionality, ensure testing is in place, and proceed incrementally with no risks or regressions. Stop if unsure.','refactor_lovable','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('258355fc-4559-4343-889d-0ec5e31a119b','Using another LLM','Generate Comprehensive Explanation','Generate a comprehensive and detailed explanation of the issue, including all relevant context, code snippets, error messages, logs, and dependencies involved. Clearly describe the expected behavior, the actual behavior, and any steps to reproduce the issue. Highlight potential causes or areas of concern based on your analysis. Ensure the information is structured and thorough enough to be copied and pasted into another system for further troubleshooting and debugging. Include any insights or observations that could help pinpoint the root cause. Focus on clarity and completeness to ensure the issue is easy to understand and address. Do not edit any code yet.','explain_for_llm','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('837d5696-f154-400c-aa97-f643300953f1','Editing Features','Fragile Update','This update is highly sensitive and demands extreme precision. Thoroughly analyze all dependencies and impacts before making changes, and test methodically to ensure nothing breaks. Avoid shortcuts or assumptions—pause and seek clarification if uncertain. Accuracy is essential.','fragile_update','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('69db6d7d-e4a0-483f-9f68-290b525aa302','Design','Optimize for Mobile','Optimize the app for mobile without changing its design or functionality. Analyze the layout and responsiveness to identify necessary adjustments for smaller screens and touch interactions. Outline a detailed plan before editing any code, and test thoroughly across devices to ensure the app behaves exactly as it does now. Pause and propose solutions if unsure.','mobile_optimize','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('09907eb4-c9f8-4f25-8d3a-8d107c916336','Editing Features','Modifying an Existing Feature','Make changes to the feature without impacting core functionality, other features, or flows. Analyze its behavior and dependencies to understand risks, and communicate any concerns before proceeding. Test thoroughly to confirm no regressions or unintended effects, and flag any out-of-scope changes for review. Work with precision—pause if uncertain.','modify_feature','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('45769d6c-b179-483e-b667-2912a19b4f65','Error Debugging','Minor Errors','The same error persists. Do not make any code changes yet—investigate thoroughly to find the exact root cause. Analyze logs, flow, and dependencies deeply, and propose solutions only once you fully understand the issue.','minor_errors','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('ff6bdd9a-02c4-4ae3-9946-cd4d0fad54c3','Error Debugging','Persistent Errors','The error is still unresolved. Stop and identify the exact root cause with 100% certainty—no guesses or assumptions. Analyze every aspect of the flow and dependencies in detail, and ensure full understanding before making any changes.','persistent_errors','2025-06-03 20:37:29.2889+00','2025-06-15 17:12:26.479115+00','default',true,false),
('539405ac-83e3-44a3-bdce-77e8a73f67f4','Editing Features','Fragile Update','This update is highly sensitive and demands extreme precision. Thoroughly analyze all dependencies and impacts before making changes, and test methodically to ensure nothing breaks. Avoid shortcuts or assumptions—pause and seek clarification if uncertain. Accuracy is essential.','fragile_update','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true),
('47e3b212-ce87-4bdf-b7dc-3ff326e5411a','Error Debugging','Major Errors','This is the final attempt to fix this issue. Stop all changes and methodically re-examine the entire flow—auth, Supabase, Stripe, state management, and redirects—from the ground up. Map out what''s breaking and why, test everything in isolation, and do not proceed without absolute certainty.','major_errors','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true),
('feb9ab21-e7cd-458d-8ea6-d4b1d8c86382','Error Debugging','Minor Errors','The same error persists. Do not make any code changes yet—investigate thoroughly to find the exact root cause. Analyze logs, flow, and dependencies deeply, and propose solutions only once you fully understand the issue.','minor_errors','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true),
('f2e378bb-143f-49aa-bda7-f11f5333e9fa','Error Debugging','Persistent Errors','The error is still unresolved. Stop and identify the exact root cause with 100% certainty—no guesses or assumptions. Analyze every aspect of the flow and dependencies in detail, and ensure full understanding before making any changes.','persistent_errors','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true),
('8906fc63-2c64-4582-97c8-51e4fbf7019b','Error Debugging','Clean up Console Logs','Carefully remove unnecessary `console.log` statements without affecting functionality or design. Review each log to ensure it''s non-critical, and document any that need alternative handling. Proceed methodically, testing thoroughly to confirm the app remains intact. Pause if uncertain about any log''s purpose.','clean_logs','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true),
('547b940b-e39e-4dd2-9580-8ba7c45fdf9c','Error Debugging','Critical Errors','The issue remains unresolved and requires a serious, thorough analysis. Step back and examine the code deeply—trace the entire flow, inspect logs, and analyze all dependencies without editing anything. Identify the exact root cause with complete certainty before proposing or making any changes. No assumptions or quick fixes—only precise, evidence-based insights. Do not edit any code yet.','critical_errors','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true),
('cef0a1f4-2858-46a6-bd39-24c4f6fd11db','Error Debugging','Extreme Errors','This issue remains unresolved, and we need to **stop and rethink the entire approach**. Do not edit any code. Instead, conduct a deep, methodical analysis of the system. Map out the full flow, trace every interaction, log, and dependency step by step. Document exactly what is supposed to happen, what is actually happening, and where the disconnect occurs. Provide a detailed report explaining the root cause with clear evidence. If there are gaps, uncertainties, or edge cases, highlight them for discussion. Until you can identify the **precise, proven source of the issue**, do not propose or touch any fixes. This requires total focus, no guesses, and no shortcuts.','extreme_errors','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true),
('dcc108f6-2b08-43a3-a687-16c0be746e16','Refactoring','Refactoring After Request Made by Lovable','Refactor this file without changing the UI or functionality—everything must behave and look exactly the same. Focus on improving code structure and maintainability only. Document the current functionality, ensure testing is in place, and proceed incrementally with no risks or regressions. Stop if unsure.','refactor_lovable','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true),
('843eee47-1a1a-4276-a32d-5a30c14d4280','Using another LLM','Generate Comprehensive Explanation','Generate a comprehensive and detailed explanation of the issue, including all relevant context, code snippets, error messages, logs, and dependencies involved. Clearly describe the expected behavior, the actual behavior, and any steps to reproduce the issue. Highlight potential causes or areas of concern based on your analysis. Ensure the information is structured and thorough enough to be copied and pasted into another system for further troubleshooting and debugging. Include any insights or observations that could help pinpoint the root cause. Focus on clarity and completeness to ensure the issue is easy to understand and address. Do not edit any code yet.','explain_for_llm','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true),
('4f2b048f-1340-45e7-8fa3-569425f60f61','Design','UI Change','Make only visual updates—do not impact functionality or logic in any way. Fully understand how the current UI integrates with the app, ensuring logic, state management, and APIs remain untouched. Test thoroughly to confirm the app behaves exactly as before. Stop if there''s any doubt about unintended effects.','ui_change','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true),
('81940e96-5eec-49bc-8978-4c7118f6bed0','Design','Optimize for Mobile','Optimize the app for mobile without changing its design or functionality. Analyze the layout and responsiveness to identify necessary adjustments for smaller screens and touch interactions. Outline a detailed plan before editing any code, and test thoroughly across devices to ensure the app behaves exactly as it does now. Pause and propose solutions if unsure.','mobile_optimize','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true),
('872cb446-cb1e-4153-b2df-586997b6773a','Editing Features','Modifying an Existing Feature','Make changes to the feature without impacting core functionality, other features, or flows. Analyze its behavior and dependencies to understand risks, and communicate any concerns before proceeding. Test thoroughly to confirm no regressions or unintended effects, and flag any out-of-scope changes for review. Work with precision—pause if uncertain.','modify_feature','2025-06-15 17:12:26.443+00','2025-06-15 17:12:26.443+00','default',true,true);

ON CONFLICT (shortcut) DO NOTHING;

-- Insert default user preferences
INSERT INTO user_preferences (user_id, settings) VALUES 
('default', '{
  "auto_capture": true,
  "notification_enabled": false,
  "theme": "light",
  "language": "en",
  "max_conversations": 1000,
  "sync_interval": 300000,
  "debug_mode": false
}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_manager ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all access for personal database)
-- In a personal database, the user has full access to their own data

-- Prompt templates policies
DROP POLICY IF EXISTS "Personal access to prompt_templates" ON prompt_templates;
CREATE POLICY "Personal access to prompt_templates" ON prompt_templates
  FOR ALL USING (true);

-- User preferences policies
DROP POLICY IF EXISTS "Personal access to user_preferences" ON user_preferences;
CREATE POLICY "Personal access to user_preferences" ON user_preferences
  FOR ALL USING (true);

-- Project manager policies
DROP POLICY IF EXISTS "Personal access to project_manager" ON project_manager;
CREATE POLICY "Personal access to project_manager" ON project_manager
  FOR ALL USING (true);

-- Conversations policies
DROP POLICY IF EXISTS "Personal access to conversations" ON conversations;
CREATE POLICY "Personal access to conversations" ON conversations
  FOR ALL USING (true);

-- Assistant conversations policies
DROP POLICY IF EXISTS "Personal access to assistant_conversations" ON assistant_conversations;
CREATE POLICY "Personal access to assistant_conversations" ON assistant_conversations
  FOR ALL USING (true);

-- =====================================================
-- ADDITIONAL USEFUL FUNCTIONS
-- =====================================================

-- Function to get conversation statistics
CREATE OR REPLACE FUNCTION get_conversation_stats()
RETURNS TABLE (
  total_conversations bigint,
  projects_count bigint,
  avg_effectiveness_score numeric,
  last_conversation_date timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM conversations) as total_conversations,
    (SELECT COUNT(DISTINCT project_id) FROM conversations WHERE project_id IS NOT NULL) as projects_count,
    (SELECT AVG(effectiveness_score) FROM conversations WHERE effectiveness_score IS NOT NULL) as avg_effectiveness_score,
    (SELECT MAX(created_at) FROM conversations) as last_conversation_date;
END;
$$ LANGUAGE plpgsql;

-- Function to search conversations by text
CREATE OR REPLACE FUNCTION search_conversations(search_text text)
RETURNS TABLE (
  id uuid,
  project_id text,
  user_message text,
  lovable_response text,
  created_at timestamp with time zone,
  relevance_score real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.project_id,
    c.user_message,
    c.lovable_response,
    c.created_at,
    (
      similarity(c.user_message, search_text) + 
      COALESCE(similarity(c.lovable_response, search_text), 0)
    ) / 2 as relevance_score
  FROM conversations c
  WHERE 
    c.user_message ILIKE '%' || search_text || '%' OR
    c.lovable_response ILIKE '%' || search_text || '%' OR
    similarity(c.user_message, search_text) > 0.1 OR
    similarity(c.lovable_response, search_text) > 0.1
  ORDER BY relevance_score DESC, c.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to clean up old conversations (keep last 1000)
CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH old_conversations AS (
    SELECT id FROM conversations 
    ORDER BY created_at DESC 
    OFFSET 1000
  )
  DELETE FROM conversations 
  WHERE id IN (SELECT id FROM old_conversations);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SUCCESS MESSAGE AND FINAL SETUP
-- =====================================================

-- Create a view for easy conversation analysis
CREATE OR REPLACE VIEW conversation_summary AS
SELECT 
  project_id,
  COUNT(*) as conversation_count,
  AVG(effectiveness_score) as avg_effectiveness,
  MAX(created_at) as last_activity,
  COUNT(DISTINCT DATE(created_at)) as active_days
FROM conversations 
WHERE project_id IS NOT NULL
GROUP BY project_id
ORDER BY conversation_count DESC;

-- Final success message
DO $$ 
BEGIN 
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Lovable Assistant Personal Database Setup Complete!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  ✓ prompt_templates (with % default templates)', (SELECT COUNT(*) FROM prompt_templates);
  RAISE NOTICE '  ✓ user_preferences (with default settings)';
  RAISE NOTICE '  ✓ project_manager (ready for project data)';
  RAISE NOTICE '  ✓ conversations (ready for chat history)';
  RAISE NOTICE '  ✓ assistant_conversations (ready for AI chats)';
  RAISE NOTICE '';
  RAISE NOTICE 'Configured:';
  RAISE NOTICE '  ✓ Performance indexes';
  RAISE NOTICE '  ✓ Automatic timestamp updates';
  RAISE NOTICE '  ✓ Row Level Security policies';
  RAISE NOTICE '  ✓ Search and utility functions';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Configure your Chrome extension with this database';
  RAISE NOTICE '  2. Add your API keys via the extension popup';
  RAISE NOTICE '  3. Start using Lovable.dev - conversations will be auto-captured!';
  RAISE NOTICE '=====================================================';
END $$;