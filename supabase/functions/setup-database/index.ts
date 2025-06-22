import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('🔧 Setting up Lovable Assistant database schema...')
    
    // Execute the complete migration SQL
    const migrationSQL = `
      -- Enable required extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";

      -- Create prompt_templates table
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

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_lovable_message_id ON conversations(lovable_message_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
      CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING gin(tags);

      CREATE INDEX IF NOT EXISTS idx_assistant_conversations_project_id ON assistant_conversations(project_id);
      CREATE INDEX IF NOT EXISTS idx_assistant_conversations_created_at ON assistant_conversations(created_at);
      CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_id ON assistant_conversations(user_id);

      CREATE INDEX IF NOT EXISTS idx_project_manager_project_id ON project_manager(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_manager_user_id ON project_manager(user_id);

      CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
      CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
      CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_active ON prompt_templates(is_active);
      CREATE INDEX IF NOT EXISTS idx_prompt_templates_shortcut ON prompt_templates(shortcut);

      CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

      -- Create updated_at trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create triggers for updated_at columns
      DROP TRIGGER IF EXISTS update_prompt_templates_updated_at ON prompt_templates;
      CREATE TRIGGER update_prompt_templates_updated_at 
          BEFORE UPDATE ON prompt_templates
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
      CREATE TRIGGER update_user_preferences_updated_at 
          BEFORE UPDATE ON user_preferences
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_project_manager_updated_at ON project_manager;
      CREATE TRIGGER update_project_manager_updated_at 
          BEFORE UPDATE ON project_manager
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
      CREATE TRIGGER update_conversations_updated_at 
          BEFORE UPDATE ON conversations
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_assistant_conversations_updated_at ON assistant_conversations;
      CREATE TRIGGER update_assistant_conversations_updated_at 
          BEFORE UPDATE ON assistant_conversations
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      -- Disable RLS for personal database (easier setup)
      ALTER TABLE prompt_templates DISABLE ROW LEVEL SECURITY;
      ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
      ALTER TABLE project_manager DISABLE ROW LEVEL SECURITY;
      ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
      ALTER TABLE assistant_conversations DISABLE ROW LEVEL SECURITY;

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

      -- Insert default prompt templates
      INSERT INTO prompt_templates (category, name, template, shortcut, is_custom, is_active) VALUES
      ('Error Debugging', 'Minor Errors', 'The same error persists. Do not make any code changes yet—investigate thoroughly to find the exact root cause. Analyze logs, flow, and dependencies deeply, and propose solutions only once you fully understand the issue.', 'minor_errors', true, true),
      ('Error Debugging', 'Major Errors', 'This is the final attempt to fix this issue. Stop all changes and methodically re-examine the entire flow—auth, Supabase, Stripe, state management, and redirects—from the ground up. Map out what''s breaking and why, test everything in isolation, and do not proceed without absolute certainty.', 'major_errors', true, true),
      ('Design', 'UI Change', 'Make only visual updates—do not impact functionality or logic in any way. Fully understand how the current UI integrates with the app, ensuring logic, state management, and APIs remain untouched. Test thoroughly to confirm the app behaves exactly as before. Stop if there''s any doubt about unintended effects.', 'ui_change', true, true),
      ('Editing Features', 'Fragile Update', 'This update is highly sensitive and demands extreme precision. Thoroughly analyze all dependencies and impacts before making changes, and test methodically to ensure nothing breaks. Avoid shortcuts or assumptions—pause and seek clarification if uncertain. Accuracy is essential.', 'fragile_update', true, true)
      ON CONFLICT (shortcut) DO NOTHING;
    `

    // Execute the migration using direct SQL
    const { error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    })

    if (error) {
      console.error('Migration error:', error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Database schema setup completed successfully')

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Lovable Assistant database setup completed successfully!'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Setup error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})