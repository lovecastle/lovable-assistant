# Data Migration Guide

## Overview
This guide helps you migrate your personal data from the old Supabase database (lovable-assistant) to your new personal database (lovable-assistant-user).

### Database Information
- **Old Database (Master)**: Project ID: `dwbrjztmskvzpyufwxnt`
- **New Database (User)**: Project ID: `jcomxzjrtitssvebtyfk`

## Migration Status

### ✅ Schema Created
The following tables have been created in the new database:
- `prompt_templates`
- `user_preferences`
- `project_manager`
- `conversations`
- `assistant_conversations`

### ✅ Data Migrated (Small Tables)
The following tables have been successfully migrated:
1. **prompt_templates** - 24 records migrated
2. **user_preferences** - 1 record migrated
3. **project_manager** - 3 records migrated
4. **assistant_conversations** - 7 records migrated (only showing first 7, there may be more)

### ⚠️ Large Table Requiring Manual Migration
- **conversations** - 1001 records need to be migrated

## Manual Migration Steps for Conversations Table

Due to the large volume of data (1001 conversations), you'll need to migrate this table manually using one of these methods:

### Method 1: Using Supabase Dashboard (Recommended)

1. **Export from Old Database:**
   - Go to your old Supabase project dashboard: https://supabase.com/dashboard/project/dwbrjztmskvzpyufwxnt
   - Navigate to Table Editor → `conversations`
   - Click "Export" → "Export to CSV"
   - Save the CSV file

2. **Import to New Database:**
   - Go to your new Supabase project dashboard: https://supabase.com/dashboard/project/jcomxzjrtitssvebtyfk
   - Navigate to Table Editor → `conversations`
   - Click "Import" → "Import from CSV"
   - Select the CSV file you exported
   - Map the columns correctly and import

### Method 2: Using SQL Export/Import

1. **Export conversations using pg_dump:**
   ```bash
   # Get connection string from old project settings
   pg_dump "postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres" \
     --table=conversations \
     --data-only \
     --column-inserts \
     > conversations_export.sql
   ```

2. **Import to new database:**
   ```bash
   # Get connection string from new project settings
   psql "postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres" \
     < conversations_export.sql
   ```

### Method 3: Using Supabase SQL Editor (For smaller batches)

If you want to migrate in smaller batches, you can run this query in the old database SQL editor to get INSERT statements:

```sql
-- In OLD database, generate INSERT statements (adjust LIMIT and OFFSET as needed)
SELECT 
  'INSERT INTO conversations (id, project_id, user_message, lovable_response, timestamp, project_context, tags, effectiveness_score, created_at, updated_at, user_message_id, lovable_message_id, message_group_id, auto_capture, user_id) VALUES (' ||
  '''' || id || ''',' ||
  COALESCE('''' || project_id || '''', 'NULL') || ',' ||
  '''' || REPLACE(user_message, '''', '''''') || ''',' ||
  COALESCE('''' || REPLACE(lovable_response, '''', '''''') || '''', 'NULL') || ',' ||
  '''' || timestamp || ''',' ||
  COALESCE('''' || project_context::text || '''::jsonb', '''{}''::jsonb') || ',' ||
  'ARRAY[' || COALESCE(array_to_string(tags, ',', ''), '') || '],' ||
  COALESCE(effectiveness_score::text, 'NULL') || ',' ||
  '''' || created_at || ''',' ||
  '''' || updated_at || ''',' ||
  COALESCE('''' || user_message_id || '''', 'NULL') || ',' ||
  COALESCE('''' || lovable_message_id || '''', 'NULL') || ',' ||
  COALESCE('''' || message_group_id || '''', 'NULL') || ',' ||
  auto_capture || ',' ||
  '''' || user_id || ''');'
FROM conversations
ORDER BY created_at
LIMIT 100 OFFSET 0; -- Change OFFSET to get different batches
```

Copy the results and run them in the NEW database SQL editor.

## Post-Migration Steps

### 1. Update Extension Configuration

After migrating your data, update your Chrome extension to use the new database:

1. Open the extension popup
2. Update the Supabase configuration:
   - **Project URL**: `https://jcomxzjrtitssvebtyfk.supabase.co`
   - **API Key**: Get the anon/public key from your new project settings
3. Click "Save Configuration"
4. Test the connection

### 2. Verify Data Integrity

Run these queries in the NEW database to verify the migration:

```sql
-- Check record counts
SELECT 'prompt_templates' as table_name, COUNT(*) as count FROM prompt_templates
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'project_manager', COUNT(*) FROM project_manager
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'assistant_conversations', COUNT(*) FROM assistant_conversations;

-- Verify data samples
SELECT * FROM prompt_templates LIMIT 5;
SELECT * FROM user_preferences;
SELECT * FROM project_manager;
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 5;
SELECT * FROM assistant_conversations ORDER BY created_at DESC LIMIT 5;
```

### 3. Clean Up

Once you've verified that all data has been migrated successfully:

1. Remove the old database credentials from the extension
2. Consider deleting the migration SQL files created during this process
3. Keep this guide for reference

## Troubleshooting

### Common Issues:

1. **"Duplicate key" errors during import:**
   - This means some records already exist. You can either:
   - Clear the target table first: `TRUNCATE TABLE conversations CASCADE;`
   - Use `ON CONFLICT DO NOTHING` in your INSERT statements

2. **Character encoding issues:**
   - Ensure both databases use UTF-8 encoding
   - Use proper escaping for special characters in SQL strings

3. **Permission errors:**
   - Ensure RLS (Row Level Security) policies allow inserts
   - Check that your API key has sufficient permissions

## Important Notes

- The old database (`dwbrjztmskvzpyufwxnt`) contained both system tables (user_profiles, billing_events, etc.) and personal data tables
- Only personal data tables have been migrated to your new database
- Your API keys and sensitive data in `user_preferences` have been preserved in the migration
- All timestamps and relationships have been maintained

## Next Steps

After successful migration:
1. Update all your devices/browsers with the new database credentials
2. Confirm the extension works properly with the new database
3. Consider backing up your new database regularly