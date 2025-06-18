# User-Owned Database Setup

## Overview

This approach eliminates the need for a master database with hardcoded credentials. Each user sets up their own Supabase project and the extension connects to their personal database.

## Architecture

```
Extension → User's Own Supabase Project → User's Personal Data
```

## Benefits

- ✅ **No hardcoded credentials** in extension
- ✅ **Users own their data** completely
- ✅ **Privacy-focused** - no central data collection
- ✅ **Zero hosting costs** for you
- ✅ **GDPR compliant** by design
- ✅ **Scalable** - no database limits on your end

## Step 1: Update Database Schema for User Setup

### 1.1 User Database Schema

Create a simplified schema that each user will set up in their own Supabase project:

```sql
-- User's Personal Database Schema
-- This goes in EACH USER'S Supabase project

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User settings table (replaces user_profiles)
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
  
  -- Custom prompt templates
  custom_templates JSONB DEFAULT '[]'
);

-- Projects table (existing)
-- Keep existing project management tables...

-- Conversations table (existing)  
-- Keep existing conversation tables...

-- Custom prompt templates table
CREATE TABLE IF NOT EXISTS custom_prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL,
  category TEXT DEFAULT 'custom',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_templates_category ON custom_prompt_templates(category);

-- Enable RLS (optional, since user owns the database)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_prompt_templates ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all access (since it's user's own database)
CREATE POLICY "Allow all access to user_settings" ON user_settings FOR ALL USING (true);
CREATE POLICY "Allow all access to custom_templates" ON custom_prompt_templates FOR ALL USING (true);

-- Insert default settings
INSERT INTO user_settings (id) VALUES (uuid_generate_v4())
ON CONFLICT DO NOTHING;

-- Insert default custom templates
INSERT INTO custom_prompt_templates (name, description, template_content, category) VALUES
('Quick Bug Fix', 'Template for reporting and fixing bugs', 'I found this issue:\n\n{issue_description}\n\nSteps to reproduce:\n1. {step_1}\n2. {step_2}\n3. {step_3}\n\nExpected: {expected_behavior}\nActual: {actual_behavior}\n\nCan you help me fix this?', 'debugging'),
('Feature Request', 'Template for new feature requests', 'I would like to add this feature:\n\n{feature_description}\n\nUse case:\n{use_case}\n\nAcceptance criteria:\n- {criteria_1}\n- {criteria_2}\n- {criteria_3}\n\nPlease help me implement this.', 'planning'),
('Code Review', 'Template for code review requests', 'Please review this code:\n\n```{language}\n{code}\n```\n\nSpecific areas to focus on:\n- {focus_area_1}\n- {focus_area_2}\n- {focus_area_3}\n\nAny suggestions for improvement?', 'review');

-- Functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_templates_updated_at
  BEFORE UPDATE ON custom_prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Step 2: Update Extension for User Database Setup

### 2.1 Database Setup UI

Update the popup to guide users through database setup:

```html
<!-- Add to popup.html -->
<div id="database-setup" style="display: none;">
  <div class="info-box">
    <h3>🏗️ Database Setup</h3>
    <p style="font-size: 13px; color: #4a5568; margin-bottom: 12px;">
      Lovable Assistant stores your data in your own private Supabase database. This ensures complete privacy and data ownership.
    </p>
    
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 12px; margin-bottom: 16px; font-size: 12px; color: #0369a1;">
      <strong>✨ Why your own database?</strong><br>
      • Complete data privacy and ownership<br>
      • No central data collection<br>
      • Free Supabase tier (up to 500MB)<br>
      • Full control over your information
    </div>
    
    <div style="margin-bottom: 12px;">
      <label style="display: block; font-size: 13px; font-weight: 600; color: #1a202c; margin-bottom: 6px;">
        Supabase Project URL
      </label>
      <input type="url" id="user-supabase-url" placeholder="https://your-project.supabase.co" style="
        width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
        font-size: 14px; box-sizing: border-box;
      ">
    </div>
    
    <div style="margin-bottom: 16px;">
      <label style="display: block; font-size: 13px; font-weight: 600; color: #1a202c; margin-bottom: 6px;">
        API Key (anon/public)
      </label>
      <input type="password" id="user-supabase-key" placeholder="Your anon key" style="
        width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
        font-size: 14px; box-sizing: border-box;
      ">
    </div>
    
    <div style="display: flex; gap: 8px;">
      <button id="setup-database" class="btn" style="flex: 1;">
        🔗 Connect Database
      </button>
      <button id="show-setup-guide" class="btn btn-secondary" style="flex: 1;">
        📖 Setup Guide
      </button>
    </div>
    
    <div id="database-error" style="display: none; background: #fed7d7; color: #c53030; padding: 8px 12px; border-radius: 6px; font-size: 13px; margin-top: 8px;"></div>
  </div>
  
  <div id="setup-guide" style="display: none; margin-top: 16px;" class="info-box">
    <h4 style="margin: 0 0 12px 0; color: #1a202c; font-size: 14px;">📖 Quick Setup Guide</h4>
    <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #4a5568; line-height: 1.6;">
      <li>Go to <a href="https://supabase.com" target="_blank" style="color: #667eea;">supabase.com</a> and create account</li>
      <li>Create a new project (free tier works perfectly)</li>
      <li>Go to Settings → API in your project</li>
      <li>Copy the "Project URL" and "anon public" key</li>
      <li>Paste them above and click "Connect Database"</li>
      <li>Extension will automatically set up the required tables</li>
    </ol>
    <div style="margin-top: 12px; padding: 8px; background: #f0f9ff; border-radius: 4px; font-size: 11px; color: #0369a1;">
      💡 Your database credentials are stored locally and never shared
    </div>
  </div>
</div>
```

### 2.2 Database Setup Logic

```javascript
// Add to popup.js
async function checkDatabaseSetup() {
  const { userSupabaseUrl, userSupabaseKey } = await chrome.storage.sync.get(['userSupabaseUrl', 'userSupabaseKey']);
  
  if (!userSupabaseUrl || !userSupabaseKey) {
    showDatabaseSetup();
    return false;
  }
  
  return true;
}

function showDatabaseSetup() {
  document.getElementById('database-setup').style.display = 'block';
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('quick-access-info').style.display = 'none';
}

function hideDatabaseSetup() {
  document.getElementById('database-setup').style.display = 'none';
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('quick-access-info').style.display = 'block';
}

// Setup event listeners
document.getElementById('setup-database').addEventListener('click', async () => {
  const url = document.getElementById('user-supabase-url').value.trim();
  const key = document.getElementById('user-supabase-key').value.trim();
  
  if (!url || !key) {
    showDatabaseError('Please enter both URL and API key');
    return;
  }
  
  if (!url.includes('supabase.co')) {
    showDatabaseError('Please enter a valid Supabase URL');
    return;
  }
  
  try {
    // Test the connection
    await testDatabaseConnection(url, key);
    
    // Save configuration
    await chrome.storage.sync.set({
      userSupabaseUrl: url,
      userSupabaseKey: key
    });
    
    // Initialize database schema
    await initializeDatabaseSchema();
    
    hideDatabaseSetup();
    await initializeApp();
    
  } catch (error) {
    showDatabaseError('Connection failed: ' + error.message);
  }
});

document.getElementById('show-setup-guide').addEventListener('click', () => {
  const guide = document.getElementById('setup-guide');
  guide.style.display = guide.style.display === 'none' ? 'block' : 'none';
});

async function testDatabaseConnection(url, key) {
  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      'apikey': key,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Invalid credentials or network error');
  }
}

async function initializeDatabaseSchema() {
  const response = await chrome.runtime.sendMessage({
    action: 'initializeUserDatabase'
  });
  
  if (!response?.success) {
    throw new Error(response?.error || 'Failed to initialize database');
  }
}

function showDatabaseError(message) {
  const errorDiv = document.getElementById('database-error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

// Update main initialization
document.addEventListener('DOMContentLoaded', async () => {
  const isDatabaseSetup = await checkDatabaseSetup();
  
  if (isDatabaseSetup) {
    await initializeApp();
  }
});

async function initializeApp() {
  checkConnectionStatus();
  setupEventListeners();
}
```

## Step 3: Update Background Service Worker

### 3.1 Remove Master Database Dependencies

```javascript
// background/service-worker.js
// Remove AuthService import and initialization
// Update to use user's database only

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'initializeUserDatabase':
      handleInitializeUserDatabase().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    case 'testUserDatabaseConnection':
      handleTestUserDatabaseConnection().then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    // Keep existing handlers for user data operations...
  }
  
  return true;
});

async function handleInitializeUserDatabase() {
  try {
    const { userSupabaseUrl, userSupabaseKey } = await chrome.storage.sync.get(['userSupabaseUrl', 'userSupabaseKey']);
    
    if (!userSupabaseUrl || !userSupabaseKey) {
      throw new Error('User database not configured');
    }
    
    // Initialize the database schema
    const schemaSQL = `
      -- Copy the user database schema here
      -- This will create the required tables in user's database
    `;
    
    // Execute schema setup
    const response = await fetch(`${userSupabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': userSupabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql: schemaSQL })
    });
    
    if (!response.ok) {
      throw new Error('Failed to initialize database schema');
    }
    
    console.log('✅ User database initialized successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error initializing user database:', error);
    return { success: false, error: error.message };
  }
}
```

## Step 4: System Templates Distribution

### 4.1 Built-in Templates

Since there's no master database, include system templates directly in the extension:

```javascript
// background/system-templates.js
export const SYSTEM_TEMPLATES = [
  {
    id: 'code-review-helper',
    name: 'Code Review Helper',
    description: 'Helps with code review and suggestions',
    template_content: `Please review this code and provide suggestions for improvement:

{code}

Focus on:
- Code quality and best practices
- Performance optimizations  
- Security considerations
- Readability and maintainability`,
    category: 'coding',
    is_system: true,
    version: '1.0.0'
  },
  {
    id: 'bug-fix-assistant',
    name: 'Bug Fix Assistant', 
    description: 'Assists with debugging and fixing issues',
    template_content: `I'm encountering this error/issue:

{error}

In this code:
{code}

Can you help me identify the problem and suggest a fix?`,
    category: 'debugging',
    is_system: true,
    version: '1.0.0'
  },
  {
    id: 'feature-planning',
    name: 'Feature Planning',
    description: 'Helps plan new features and functionality', 
    template_content: `I want to implement the following feature:

{feature_description}

Can you help me:
1. Break down the requirements
2. Suggest the technical approach
3. Identify potential challenges
4. Recommend best practices`,
    category: 'planning',
    is_system: true,
    version: '1.0.0'
  },
  {
    id: 'ui-ux-review',
    name: 'UI/UX Review',
    description: 'Provides feedback on user interface and experience',
    template_content: `Please review this UI/UX design:

{design_description}

Provide feedback on:
- User experience flow
- Accessibility considerations
- Visual design principles
- Mobile responsiveness`,
    category: 'design',
    is_system: true,
    version: '1.0.0'
  }
];

export function getSystemTemplates() {
  return SYSTEM_TEMPLATES;
}

export function getSystemTemplate(id) {
  return SYSTEM_TEMPLATES.find(template => template.id === id);
}
```

### 4.2 Template Updates

For template updates, use extension updates or a simple JSON endpoint:

```javascript
// Optional: Fetch latest templates from a simple JSON endpoint
async function fetchLatestSystemTemplates() {
  try {
    const response = await fetch('https://your-domain.com/api/system-templates.json');
    const templates = await response.json();
    
    // Cache templates locally
    await chrome.storage.local.set({ systemTemplates: templates });
    
    return templates;
  } catch (error) {
    console.log('Using built-in templates');
    return SYSTEM_TEMPLATES;
  }
}
```

## Step 5: User Onboarding Flow

### 5.1 Welcome Screen

```javascript
// Show setup wizard for new users
function showWelcomeWizard() {
  // Step 1: Welcome
  // Step 2: Create Supabase account guide  
  // Step 3: Database connection
  // Step 4: AI provider setup
  // Step 5: Ready to use!
}
```

## Benefits of This Approach

### ✅ **Privacy & Ownership**
- Users own their data completely
- No central data collection or monitoring
- GDPR compliant by design

### ✅ **Security**  
- No hardcoded credentials in extension
- Each user has isolated database
- No cross-user data access possible

### ✅ **Scalability**
- No database limits on your end
- Users pay for their own usage
- Zero infrastructure costs for you

### ✅ **Trust**
- Transparent data handling
- Users can export/backup anytime
- No vendor lock-in

This approach positions your extension as a privacy-first, user-owned solution - which is increasingly valuable in today's market!