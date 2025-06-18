# User Authentication System Setup

This guide will help you set up the user authentication system for the Lovable Assistant extension using Supabase as the master database.

## Overview

The authentication system uses a **two-database approach**:

1. **Master Database** (Your Supabase): Handles user authentication, system templates, billing, and authorization
2. **User Databases** (User's own Supabase): Stores personal data like projects, conversations, and settings

## Step 1: Set Up Master Database

### 1.1 Create Supabase Project (Master)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your **Project URL** and **anon/public API key**
3. Go to **SQL Editor** in your Supabase dashboard

### 1.2 Run Database Schema

Copy and paste the entire content of `database-user-auth-schema.sql` into the SQL Editor and execute it.

**IMPORTANT**: Before running the SQL, update the admin email in the `create_user_profile()` function:

```sql
-- Find this line in the SQL file:
WHEN NEW.email = 'your-admin-email@example.com' THEN 'administrator'

-- Replace with your actual email:
WHEN NEW.email = 'your-actual-email@gmail.com' THEN 'administrator'
```

### 1.3 Configure Authentication

1. Go to **Authentication** > **Settings** in Supabase dashboard
2. Enable **Email** provider
3. Configure **Site URL** to your extension's origin (if needed)
4. Set up **Email Templates** (optional)

## Step 2: Configure Extension with Master Database

### 2.1 Add Master Database Configuration

The extension needs to know about your master database. Add these new storage keys:

```javascript
// Add to chrome.storage.sync
await chrome.storage.sync.set({
  // Existing keys...
  masterSupabaseUrl: 'https://your-project.supabase.co',
  masterSupabaseKey: 'your-anon-key-here'
});
```

### 2.2 Update Extension Settings UI

Add master database configuration to the extension settings (you may want to add this to the popup or settings page):

```html
<!-- Master Database Configuration -->
<div class="settings-section">
  <h3>Master Database (Authentication)</h3>
  <input type="text" id="master-supabase-url" placeholder="Master Supabase URL">
  <input type="password" id="master-supabase-key" placeholder="Master API Key">
  <button id="save-master-config">Save Master Config</button>
</div>
```

## Step 3: Test Authentication

### 3.1 Register Admin User

1. Load the extension
2. Click the extension icon
3. You should see the login/register form
4. Register with the email you specified as admin in the SQL
5. You should see "ADMIN" badge in the popup

### 3.2 Verify Database

Check your Supabase dashboard:
- **Authentication** > **Users**: Should show your registered user
- **Table Editor** > **user_profiles**: Should show your profile with `role = 'administrator'`

## Step 4: System Prompt Templates

### 4.1 Default Templates

The SQL script creates 4 default system prompt templates:
- Code Review Helper
- Bug Fix Assistant  
- Feature Planning
- UI/UX Review

### 4.2 Managing Templates (Admin Only)

As an administrator, you can:
- View all templates (public and private)
- Create new system templates
- Edit existing templates
- Set templates as premium/public

Regular users can only see public templates.

## Step 5: User Flow

### 5.1 New User Registration

1. User installs extension
2. Opens popup, sees login/register form
3. Registers account (creates entry in master database)
4. Gets assigned "user" role automatically
5. Can now access system prompt templates and sync features

### 5.2 Data Separation

- **Master Database**: User profiles, authentication, system templates, billing
- **User Database**: Personal projects, conversations, AI settings, custom templates

## Step 6: Security Considerations

### 6.1 Row Level Security (RLS)

The schema includes RLS policies that ensure:
- Users can only see their own data
- Admins have elevated permissions
- Public templates are visible to all authenticated users

### 6.2 API Keys

- Master database API key should be the **anon/public** key
- Users still need their own Supabase project for personal data
- Never expose service_role keys in the extension

## Step 7: Future Enhancements

### 7.1 Billing Integration

The schema includes fields for Stripe integration:
- `stripe_customer_id`
- `subscription_id` 
- `subscription_expires_at`
- `subscription_status`

### 7.2 Usage Analytics

The `user_audit_log` table tracks user actions for:
- Feature usage analytics
- Security monitoring
- Billing/usage tracking

## Troubleshooting

### Common Issues

1. **"Master database configuration not found"**
   - Ensure `masterSupabaseUrl` and `masterSupabaseKey` are set in chrome.storage.sync

2. **"Only administrators can create templates"**
   - Check that your email matches the one in the `create_user_profile()` function
   - Verify your user profile has `role = 'administrator'`

3. **Authentication fails**
   - Check Supabase Auth settings
   - Verify API key permissions
   - Check browser console for detailed errors

### SQL to Check Admin Status

```sql
-- Check if user is admin
SELECT email, role FROM user_profiles 
WHERE email = 'your-email@example.com';

-- Manually set user as admin (if needed)
UPDATE user_profiles 
SET role = 'administrator' 
WHERE email = 'your-email@example.com';
```

## Testing Checklist

- [ ] Master database schema created successfully
- [ ] Admin email configured in SQL function
- [ ] Extension can connect to master database
- [ ] User registration works
- [ ] Admin user shows "ADMIN" badge
- [ ] System prompt templates are visible
- [ ] User roles are enforced correctly
- [ ] Session management works (sign out/in)

## Next Steps

Once authentication is working:

1. **Integrate with existing features**: Update utilities manager to sync system templates
2. **Add billing system**: Integrate Stripe for premium features  
3. **Enhanced admin panel**: Create admin interface for user/template management
4. **Analytics dashboard**: Track usage and feature adoption

The authentication system is now ready to support the multi-user architecture you requested!