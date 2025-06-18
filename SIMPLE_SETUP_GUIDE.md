# Simple Setup Guide - User-Owned Database

## Quick 5-Minute Setup

### Step 1: Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Choose your organization and name your project (e.g., "lovable-assistant")
4. Set a database password and choose a region
5. Wait for the project to be ready (~2 minutes)

### Step 2: Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire content of `user-database-schema.sql`
3. Paste it into the SQL Editor and click **RUN**
4. You should see a success message: "Lovable Assistant database schema created successfully!"

### Step 3: Get Your Database Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://abc123def.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

### Step 4: Configure the Extension

1. Click the Lovable Assistant extension icon in your browser
2. You'll see the "Database Setup" screen
3. Paste your **Project URL** and **API Key**
4. Click "Connect Database"
5. The extension will test the connection and initialize automatically

### Step 5: You're Ready!

That's it! Your extension is now configured with your own private database. You have:

- ✅ Complete data privacy and ownership
- ✅ All existing extension features
- ✅ 8 built-in system prompt templates
- ✅ Ability to create custom templates
- ✅ Project and conversation tracking

## What You Get

### Your Database Contains:
- **user_settings**: Extension preferences and AI provider settings
- **custom_prompt_templates**: Your personal prompt templates
- **project_managers**: Your Lovable projects
- **conversations**: Your chat history
- **ai_preferences**: AI provider configurations
- **ui_preferences**: Interface customizations
- **notification_settings**: Notification preferences

### Privacy & Security:
- 🔒 **Your data stays in your database** - never shared
- 🔒 **No central server** collecting your information
- 🔒 **You control access** completely
- 🔒 **Free Supabase tier** supports most users (500MB, 50MB database)

## Troubleshooting

### "Connection failed" Error
- Double-check your Project URL includes `https://` and ends with `.supabase.co`
- Make sure you copied the **anon public** key (not the service_role key)
- Verify your Supabase project is fully initialized (green status)

### "Database initialization failed" Error
- Go to your Supabase SQL Editor and run the schema manually
- Check that all tables were created successfully
- Refresh the extension and try again

### Can't Find Settings → API
- In your Supabase dashboard, look for "Settings" in the left sidebar
- Click on "API" under Settings
- The URL and keys are displayed on this page

## Benefits vs. Traditional Extensions

| Traditional Extensions | Lovable Assistant |
|----------------------|-------------------|
| ❌ Data sent to company servers | ✅ Data stays in your database |
| ❌ Privacy concerns | ✅ Complete privacy |
| ❌ Subscription fees | ✅ Free (you pay your own minimal DB costs) |
| ❌ Data lock-in | ✅ Full data portability |
| ❌ Limited customization | ✅ Full database access |

## Advanced Usage

### Backup Your Data
- Go to your Supabase dashboard → Database → Backups
- Download backups anytime
- Export specific tables if needed

### Share Templates (Optional)
- Export custom templates as JSON
- Share with team members
- Import templates from others

### Database Management
- View your data in Supabase dashboard
- Create custom queries and reports
- Set up additional automation if desired

Your Lovable Assistant is now ready with complete privacy and data ownership! 🎉