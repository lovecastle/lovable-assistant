-- Master Database Schema for Lovable Assistant
-- This runs in YOUR Supabase project (the master/central database)
-- Handles: User authentication, roles, billing, system templates
-- Uses built-in Supabase Authentication system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends Supabase Auth users)
-- This table is automatically populated when users register via Supabase Auth
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('administrator', 'user')),
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Extension-specific settings
  extension_settings JSONB DEFAULT '{}',
  
  -- Billing information
  stripe_customer_id TEXT,
  subscription_id TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- User's personal database connection (they provide this)
  user_database_url TEXT,
  user_database_key TEXT,
  user_database_configured BOOLEAN DEFAULT FALSE
);

-- System prompt templates table (managed by administrators)
CREATE TABLE IF NOT EXISTS system_prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version TEXT DEFAULT '1.0.0',
  usage_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE
);

-- User sessions table for extension authentication
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  extension_version TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- User audit log for tracking actions
CREATE TABLE IF NOT EXISTS user_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extension usage analytics
CREATE TABLE IF NOT EXISTS usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  extension_version TEXT,
  session_id UUID REFERENCES user_sessions(id)
);

-- Billing events table
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  event_type TEXT NOT NULL, -- subscription_created, payment_succeeded, etc.
  stripe_event_id TEXT UNIQUE,
  event_data JSONB DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'processed'
);

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  target_roles TEXT[] DEFAULT ARRAY['administrator'],
  target_users UUID[],
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_system_prompts_public ON system_prompt_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_system_prompts_category ON system_prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_system_prompts_premium ON system_prompt_templates(is_premium);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON user_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_timestamp ON usage_analytics(timestamp);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() AND role = 'administrator'
    )
  );

-- RLS Policies for system_prompt_templates
CREATE POLICY "Public templates visible to all authenticated users" ON system_prompt_templates
  FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');

CREATE POLICY "Premium templates visible to premium users" ON system_prompt_templates
  FOR SELECT USING (
    is_premium = true AND 
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND subscription_status IN ('premium', 'enterprise')
    )
  );

CREATE POLICY "Users can view own templates" ON system_prompt_templates
  FOR SELECT USING (
    created_by IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all templates" ON system_prompt_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() AND role = 'administrator'
    )
  );

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (
    user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL USING (
    user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

-- RLS Policies for user_audit_log
CREATE POLICY "Users can view own audit logs" ON user_audit_log
  FOR SELECT USING (
    user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Admins can view all audit logs" ON user_audit_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() AND role = 'administrator'
    )
  );

-- RLS Policies for usage_analytics
CREATE POLICY "Users can view own analytics" ON usage_analytics
  FOR SELECT USING (
    user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Admins can view all analytics" ON usage_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() AND role = 'administrator'
    )
  );

-- RLS Policies for billing_events
CREATE POLICY "Users can view own billing events" ON billing_events
  FOR SELECT USING (
    user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Admins can view all billing events" ON billing_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() AND role = 'administrator'
    )
  );

-- RLS Policies for feature_flags
CREATE POLICY "All authenticated users can view feature flags" ON feature_flags
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage feature flags" ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() AND role = 'administrator'
    )
  );

-- Function to create user profile when user signs up
-- This will be triggered automatically when a user registers via Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile for the authenticated user
  INSERT INTO user_profiles (auth_user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Log the user creation (using available columns from auth.users)
  INSERT INTO user_audit_log (
    user_id, 
    action, 
    resource_type, 
    resource_id, 
    details
  )
  SELECT 
    up.id,
    'user_created',
    'user_profile',
    up.id::TEXT,
    jsonb_build_object('user_id', NEW.id, 'role', 'user', 'created_at', NEW.created_at)
  FROM user_profiles up 
  WHERE up.auth_user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON system_prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW() OR is_active = FALSE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION user_has_permission(
  check_user_id UUID,
  permission_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_subscription TEXT;
BEGIN
  SELECT role, subscription_status 
  INTO user_role, user_subscription
  FROM user_profiles 
  WHERE auth_user_id = check_user_id;
  
  -- Admins have all permissions
  IF user_role = 'administrator' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permissions
  CASE permission_type
    WHEN 'premium_templates' THEN
      RETURN user_subscription IN ('premium', 'enterprise');
    WHEN 'advanced_features' THEN
      RETURN user_subscription IN ('premium', 'enterprise');
    WHEN 'api_access' THEN
      RETURN user_subscription IN ('premium', 'enterprise');
    ELSE
      RETURN TRUE; -- Basic permissions
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system prompt templates
INSERT INTO system_prompt_templates (name, description, template_content, category, is_public, version) VALUES
('Code Review Helper', 'Helps with code review and suggestions', 
 E'Please review this code and provide suggestions for improvement:\n\n{code}\n\nFocus on:\n- Code quality and best practices\n- Performance optimizations\n- Security considerations\n- Readability and maintainability', 
 'coding', true, '1.0.0'),

('Bug Fix Assistant', 'Assists with debugging and fixing issues', 
 E'I''m encountering this error/issue:\n\n{error}\n\nIn this code:\n{code}\n\nCan you help me identify the problem and suggest a fix?', 
 'debugging', true, '1.0.0'),

('Feature Planning', 'Helps plan new features and functionality', 
 E'I want to implement the following feature:\n\n{feature_description}\n\nCan you help me:\n1. Break down the requirements\n2. Suggest the technical approach\n3. Identify potential challenges\n4. Recommend best practices', 
 'planning', true, '1.0.0'),

('UI/UX Review', 'Provides feedback on user interface and experience', 
 E'Please review this UI/UX design:\n\n{design_description}\n\nProvide feedback on:\n- User experience flow\n- Accessibility considerations\n- Visual design principles\n- Mobile responsiveness', 
 'design', true, '1.0.0'),

('API Integration Helper', 'Assists with API integration and troubleshooting', 
 E'I need help with this API integration:\n\nAPI: {api_name}\nEndpoint: {endpoint}\nMethod: {method}\n\nIssue/Question:\n{issue_description}\n\nExpected behavior:\n{expected_behavior}\n\nCurrent result:\n{current_result}\n\nCan you help me troubleshoot and implement this correctly?', 
 'integration', true, '1.0.0'),

('Database Design Helper', 'Assists with database schema design and optimization', 
 E'I need help designing a database for:\n\n{project_description}\n\nRequirements:\n- {requirement_1}\n- {requirement_2}\n- {requirement_3}\n\nCurrent considerations:\n{current_thoughts}\n\nCan you help me design an efficient database schema and suggest best practices?', 
 'database', true, '1.0.0'),

('Performance Optimization', 'Helps identify and fix performance issues', 
 E'I''m experiencing performance issues with:\n\n{component_or_feature}\n\nCurrent performance metrics:\n{current_metrics}\n\nSpecific issues:\n- {issue_1}\n- {issue_2}\n- {issue_3}\n\nCan you help me identify bottlenecks and suggest optimizations?', 
 'optimization', true, '1.0.0'),

('Security Review', 'Provides security analysis and recommendations', 
 E'Please review this code/system for security vulnerabilities:\n\n{code_or_description}\n\nSpecific concerns:\n- {concern_1}\n- {concern_2}\n- {concern_3}\n\nCan you help me identify security issues and suggest fixes?', 
 'security', true, '1.0.0'),

('Premium AI Prompt Engineering', 'Advanced prompt engineering techniques', 
 E'Help me create an optimized prompt for:\n\n{task_description}\n\nTarget AI: {ai_model}\nContext: {context}\nDesired output: {output_format}\n\nConstraints:\n- {constraint_1}\n- {constraint_2}\n\nPlease provide an engineered prompt that maximizes effectiveness.', 
 'premium', true, true, '1.0.0'),

('Enterprise Code Architecture', 'Enterprise-level architecture planning', 
 E'I need to design enterprise architecture for:\n\n{system_description}\n\nRequirements:\n- Scale: {scale_requirements}\n- Performance: {performance_requirements}\n- Security: {security_requirements}\n- Compliance: {compliance_requirements}\n\nCurrent stack: {current_stack}\n\nPlease provide architectural recommendations and implementation strategy.', 
 'enterprise', true, true, '1.0.0')

ON CONFLICT (name) DO NOTHING;

-- Insert default feature flags
INSERT INTO feature_flags (flag_name, description, is_enabled, target_roles) VALUES
('premium_templates', 'Access to premium prompt templates', true, ARRAY['administrator', 'user']),
('advanced_analytics', 'Advanced usage analytics', false, ARRAY['administrator']),
('beta_features', 'Access to beta features', false, ARRAY['administrator']),
('api_access', 'Direct API access', false, ARRAY['administrator'])
ON CONFLICT (flag_name) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Lovable Assistant Master Database Schema created successfully!';
  RAISE NOTICE 'Ready for user authentication, billing, and system template management.';
  RAISE NOTICE 'Enable Supabase Auth in your dashboard to allow user registration/login.';
  RAISE NOTICE 'Set administrator roles manually in the user_profiles table as needed.';
END $$;