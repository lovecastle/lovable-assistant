# Prompt Templates Column Name Fix

## 🐛 Problem Identified

The prompt templates functionality was failing with database errors:
- `column prompt_templates.template_order does not exist`
- `Could not find the 'template_content' column of 'prompt_templates'`

## 🔍 Root Cause

**Mismatch between code expectations and actual database schema:**

### Code Expected:
- `template_content` column
- `template_order` column

### Actual Database Schema:
- `template` column (not `template_content`)
- No `template_order` column (using `name` for ordering)

## ✅ Solution Applied

### 1. Updated Database Queries

**Before:**
```javascript
// Wrong column names
`prompt_templates?user_id=eq.${userId}&is_active=eq.true&order=category,template_order`
template_content: template.template
```

**After:**
```javascript
// Correct column names
`prompt_templates?user_id=eq.${userId}&is_active=eq.true&order=category,name`
template: template.template
```

### 2. Fixed Column Mapping

**Files Updated:**
- `background/database-sync.js`
- `content_scripts/utilities-manager.js`
- `background/service-worker.js`

**Changes Made:**
- Replaced `template_content` with `template`
- Replaced `template_order` with ordering by `name`
- Updated all template data mapping functions

### 3. Database Schema Alignment

**Actual Table Structure:**
```sql
prompt_templates:
├── id (UUID) - Primary key
├── category (TEXT) - Template category
├── name (TEXT) - Template name
├── template (TEXT) - Template content ✅
├── shortcut (TEXT) - Keyboard shortcut
├── user_id (TEXT) - User identification
├── is_custom (BOOLEAN) - Custom template flag
├── is_active (BOOLEAN) - Active status
├── created_at (TIMESTAMP) - Creation time
└── updated_at (TIMESTAMP) - Last update
```

## 🔧 Technical Changes

### database-sync.js:
- `getPromptTemplates()` - Fixed ordering and column references
- `saveAllPromptTemplates()` - Updated template mapping
- Removed references to non-existent `template_order` column

### utilities-manager.js:
- `loadPromptTemplates()` - Fixed template data conversion
- `getCurrentTemplates()` - Updated column mapping
- `loadTemplatesIntoMenu()` - Fixed database format conversion

### service-worker.js:
- `handleSaveAllPromptTemplates()` - Updated template data format

## 🎯 Expected Results

After this fix:
- ✅ Prompt templates should load from database successfully
- ✅ Template saving should work without column errors
- ✅ Template management UI should function properly
- ✅ Default templates should be created for new users

## 🧪 Testing

1. **Load Templates:** Open Utilities page → Should show prompt templates
2. **Edit Templates:** Modify a template → Should save to database
3. **Reset Templates:** Click reset → Should restore defaults
4. **Custom Templates:** Add new template → Should persist in database

The prompt templates functionality should now work correctly with the database!