# Local Storage Migration Report

This report details all instances of local storage usage in the Lovable Assistant Chrome Extension that need to be migrated to the database for multi-user support.

## Summary

The extension uses three types of local storage:
1. **localStorage** - Browser's localStorage API (used in content scripts)
2. **chrome.storage.sync** - Chrome's synchronized storage API (used in background scripts and popup)
3. **sessionStorage** - Not used (confirmed by search)

## Detailed Findings

### 1. localStorage Usage (Content Scripts)

#### File: `content_scripts/utilities-manager.js`

| Line | Key | Purpose | Data Type | Function |
|------|-----|---------|-----------|----------|
| 263 | `lovable-auto-expand` | Auto-expand input area on new lines | Boolean | `setupToggleSwitch()` |
| 299 | `lovable-auto-expand` | Load saved toggle state | Boolean | `loadUtilitiesSettings()` |
| 571 | `lovable-auto-expand` | Check if auto-expand is enabled | Boolean | `setupInputAutoExpansion()` |
| 906 | `lovable-prompt-templates` | Store prompt templates | JSON Array | `loadPromptTemplates()` |
| 1110 | `lovable-prompt-templates` | Remove templates on reset | - | `resetPromptTemplates()` |
| 1268 | `lovable-prompt-templates` | Save current templates | JSON Array | `saveCurrentTemplates()` |
| 1277 | `lovable-prompt-templates` | Get current templates | JSON Array | `getCurrentTemplates()` |
| 1305 | `lovable-prompt-templates` | Save templates after edit | JSON Array | `saveTemplatesAndReload()` |
| 1320 | `lovable-prompt-templates` | Load templates into menu | JSON Array | `loadTemplatesIntoMenu()` |
| 1423-1426 | Multiple keys | Reset utility settings | - | `resetUtilitiesSettings()` |
| 1436 | `lovable-auto-expand` | Export settings | Boolean | `exportUtilitiesSettings()` |

#### File: `content_scripts/status-monitor.js`

| Line | Key | Purpose | Data Type | Function |
|------|-----|---------|-----------|----------|
| 33 | `lovable-tab-rename` | Enable tab renaming when working | Boolean | `initializeWorkingStatusMonitor()` |
| 172 | `lovable-auto-switch` | Auto-switch back to tab when done | Boolean | `handleTabRename()` |

#### File: `content_scripts/chat-interface.js`

No localStorage usage found in this file.

### 2. chrome.storage.sync Usage (Background Scripts & Popup)

#### File: `background/service-worker.js`

| Line | Key | Purpose | Data Type | Function |
|------|-----|---------|-----------|----------|
| 14 | `firstInstall` | Track if extension was just installed | Boolean | Installation handler |
| 221 | `supabaseUrl`, `supabaseKey` | Database credentials | String | `testConnection()` |
| 473 | `supabaseUrl`, `supabaseKey` | Database credentials | String | Multiple DB functions |
| 665 | `notificationsEnabled` | Notification settings | Boolean | `getNotificationSettings()` |
| 697 | `notificationsEnabled` | Update notification settings | Boolean | `updateNotificationSettings()` |
| 710-719 | Multiple AI keys & settings | AI provider configuration | String/Boolean | `testConnection()` |
| 828 | `notificationsEnabled` | Check notification settings | Boolean | `startWorkingStatusMonitor()` |

#### File: `background/ai-api.js`

| Line | Key | Purpose | Data Type | Function |
|------|-----|---------|-----------|----------|
| 40-53 | Multiple AI provider settings | AI configuration (provider, keys, models) | String | `handleAIRequest()` |
| 94 | `claudeApiKey` | Claude API key | String | `generateTitle()` |

#### File: `background/database-sync.js`

| Line | Key | Purpose | Data Type | Function |
|------|-----|---------|-----------|----------|
| 12 | `supabaseUrl`, `supabaseKey` | Database credentials | String | `syncProjects()` |

#### File: `popup/popup.js`

| Line | Key | Purpose | Data Type | Function |
|------|-----|---------|-----------|----------|
| 34-47 | Multiple settings | Load all configuration | Mixed | Page load |

#### File: `content_scripts/utilities-manager.js` (chrome.storage.sync usage)

| Line | Key | Purpose | Data Type | Function |
|------|-----|---------|-----------|----------|
| 441 | `aiProvider` | Save selected AI provider | String | `setupAPIProviderSelection()` |
| 493 | Multiple settings | Save all API configuration | Mixed | `autoSaveConfiguration()` |
| 619 | `aiProvider` | Set provider to Claude | String | `setupAPIConfiguration()` |
| 649 | `aiProvider` | Set provider to Gemini | String | `setupAPIConfiguration()` |
| 696-699 | Multiple settings | Load all API settings | Mixed | `loadAPISettings()` |

## Data Categories

### 1. User Preferences (Per-User Settings)
These should remain in local storage or be migrated to user-specific database records:
- `lovable-auto-expand` - UI preference
- `lovable-tab-rename` - UI preference  
- `lovable-auto-switch` - UI preference
- `notificationsEnabled` - Notification preference

### 2. API Credentials (User-Specific)
These are sensitive and should remain in chrome.storage.sync for security:
- `claudeApiKey`
- `openaiApiKey`
- `geminiApiKey`
- `supabaseUrl`
- `supabaseKey`

### 3. Application Data (Should be in Database)
These should be migrated to the database for multi-user support:
- `lovable-prompt-templates` - User's custom prompt templates
- `aiProvider` - Selected AI provider
- `claudeModel`, `openaiModel`, `geminiModel` - Model selections
- `supabaseProjectId` - Database project ID

### 4. System Flags (Can Stay Local)
- `firstInstall` - Extension installation flag

## Migration Strategy

### Phase 1: Database Schema Update
Create new tables for user-specific data:
```sql
-- User preferences table
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, preference_key)
);

-- Prompt templates table
CREATE TABLE user_prompt_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  templates JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id)
);

-- AI provider preferences
CREATE TABLE user_ai_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT,
  claude_model TEXT,
  openai_model TEXT,
  gemini_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id)
);
```

### Phase 2: Service Worker Updates
Add new message handlers for database operations:
- `getUserPreference` / `setUserPreference`
- `getPromptTemplates` / `savePromptTemplates`
- `getAIPreferences` / `saveAIPreferences`

### Phase 3: Content Script Updates
Replace localStorage calls with message passing to service worker:
- Utilities settings
- Prompt templates
- Tab management preferences

### Phase 4: Migration Logic
Add logic to migrate existing localStorage data to database on first run after update.

## Priority Items for Migration

1. **Prompt Templates** (HIGH) - Currently stored as large JSON in localStorage
2. **AI Model Preferences** (MEDIUM) - Should sync across devices
3. **UI Preferences** (LOW) - Can remain local but would benefit from syncing

## Security Considerations

- API keys should remain in chrome.storage.sync (encrypted by Chrome)
- User IDs need to be implemented for multi-user support
- Consider encryption for sensitive preferences in database