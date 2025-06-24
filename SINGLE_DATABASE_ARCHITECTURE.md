# Single Database Architecture

## Overview
The Lovable Assistant extension now uses **only one centralized Supabase database** for all data synchronization and user management.

## Database Configuration

### Master Database (Only Database)
- **Project ID**: `dwbrjztmskvzpyufwxnt`
- **URL**: `https://dwbrjztmskvzpyufwxnt.supabase.co`
- **Usage**: All user data, preferences, templates, conversations, and authentication

## Data Architecture

### User Isolation
- All tables use `user_id` column for Row Level Security (RLS)
- Users only see and modify their own data
- Authentication handled via Supabase Auth with session tokens

### Tables Structure
```sql
-- User authentication and profiles
user_profiles (user_id, email, role, subscription_status, etc.)

-- User-specific data
user_preferences (user_id, notifications, tab_rename, auto_switch, auto_expand)
prompt_templates (user_id, template_id, category, name, content, is_system_template)
conversations (user_id, project_id, user_message, lovable_response, etc.)
project_manager (user_id, project_id, project_name, ownership_status, etc.)
assistant_conversations (user_id, conversation_id, messages, etc.)

-- System-wide data
system_prompt_templates (global templates available to all users)
```

## Authentication Flow
1. Users register/login via popup interface
2. Master authentication service manages session tokens
3. Session tokens used for all database requests
4. RLS policies ensure data isolation between users

## Key Features
- ✅ Centralized data management
- ✅ Row Level Security for data isolation
- ✅ Session-based authentication
- ✅ Real-time sync across all user devices
- ✅ System-wide templates with user customization
- ✅ Audit logging and user management

## Benefits
- **Simplified Architecture**: One database to manage
- **Better Security**: Centralized RLS policies
- **Easier Maintenance**: Single schema and migration path
- **Cost Effective**: Shared infrastructure
- **Better Analytics**: Centralized user data and usage patterns

## Migration Status
- ✅ Removed user database configuration methods
- ✅ Updated all handlers to use session tokens
- ✅ Cleaned up references to personal databases
- ✅ Implemented proper authentication flow
- ✅ All features working with single database

## Important Notes
- All database requests must include proper session token authentication
- Row Level Security ensures users only access their own data
- System templates are shared across all users
- User preferences and custom templates are user-specific