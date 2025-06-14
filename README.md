# Lovable.dev Assistant Chrome Extension

A powerful Chrome extension that enhances your development experience on Lovable.dev by providing intelligent prompt assistance, conversation management, and AI-powered suggestions.

## 🚀 Features

### Core Functionality
- **Conversation Memory & Search**: Automatically saves all conversations with Lovable.dev with full-text and semantic search
- **Intelligent Project Understanding**: Analyzes project context and generates relevant suggestions
- **Prompt Enhancement**: AI-powered prompt improvements for better development outcomes
- **Feature Suggestions**: Context-aware recommendations based on your current project
- **Draggable Chat Interface**: Clean, resizable dialog that doesn't interfere with your workflow

### Smart Assistance
- **Real-time Prompt Analysis**: Get suggestions as you type
- **Historical Context**: Learn from past successful interactions
- **Code Pattern Recognition**: Identify and suggest relevant code snippets
- **Tech Stack Awareness**: Tailored advice based on your project's technology

### Data Management
- **Secure Storage**: Encrypted API keys and secure data handling
- **Export/Import**: Full data portability
- **Conversation Analytics**: Track effectiveness and improvement over time
- **Automatic Cleanup**: Configurable data retention policies

## 📋 Prerequisites

Before installing the extension, you'll need:

1. **Claude API Key**: Get one from [Anthropic Console](https://console.anthropic.com)
2. **Supabase Project**: Create a free project at [Supabase](https://supabase.com)
3. **Chrome Browser**: Version 88 or higher

## 🛠️ Installation

### Step 1: Download the Extension
1. Download or clone this repository
2. Extract the files if downloaded as ZIP

### Step 2: Set Up Supabase Database
1. Create a new Supabase project
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `database-setup.sql`
4. Run the script to create all necessary tables and functions
5. Note your project URL and anon key from the project settings
### Step 3: Install the Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension folder
4. The extension icon should appear in your toolbar

### Step 4: Configure the Extension
1. Click the extension icon in your Chrome toolbar
2. Enter your Claude API key
3. Enter your Supabase project URL (e.g., `https://your-project.supabase.co`)
4. Enter your Supabase anon key
5. Click "Save Configuration"
6. Click "Test Connection" to verify setup

## 🎯 Usage

### Getting Started
1. Navigate to any Lovable.dev project page (`https://lovable.dev/projects/*`)
2. The extension will automatically detect the page and begin monitoring
3. Start typing in the chat input to see the assistant dialog appear

### Using the Assistant Dialog
- **Chat View**: Ask questions and get AI-powered responses
- **Search View**: Find past conversations using keywords or semantic search
- **Settings**: Configure preferences and API settings

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter`: Enhance the current prompt
- `Ctrl/Cmd + K`: Open conversation search
- `Escape`: Close the assistant dialog

### Quick Actions
- **🔍 Search History**: Find relevant past conversations
- **⚡ Enhance Prompt**: Improve your current prompt with AI suggestions
- **💡 Suggest Features**: Get AI-generated feature ideas for your project
- **⚙️ Settings**: Configure the extension

## ⚙️ Configuration Options

### API Settings
- **Claude API Key**: Your Anthropic API key for AI responses
- **Supabase URL**: Your Supabase project URL
- **Supabase Key**: Your Supabase anon/public API key

### Preferences
- **Auto-capture conversations**: Automatically save all chat interactions
- **Auto-enhance prompts**: Show enhancement suggestions as you type
- **Show feature suggestions**: Display AI-generated project improvements
- **Enable keyboard shortcuts**: Use hotkeys for quick actions

### Advanced Options
- **Max Conversations**: Limit stored conversations (default: 1000)
- **Sync Interval**: How often to sync with Supabase (default: 5 minutes)
- **Debug Mode**: Enable detailed logging for troubleshooting
## 🗄️ Database Schema

The extension uses the following Supabase tables:

### `conversations`
Stores all chat interactions with metadata:
```sql
- id (UUID): Unique conversation identifier
- project_id (TEXT): Lovable.dev project ID
- user_message (TEXT): Your message
- lovable_response (TEXT): Lovable.dev's response
- timestamp (TIMESTAMP): When the conversation occurred
- project_context (JSONB): Project metadata
- tags (TEXT[]): Categorization tags
- effectiveness_score (INTEGER): AI-rated effectiveness (1-10)
```

### `projects`
Tracks project information:
```sql
- id (TEXT): Project identifier
- name (TEXT): Project name
- tech_stack (JSONB): Technologies used
- current_state (JSONB): Project status
- last_updated (TIMESTAMP): Last activity
```

### `conversation_embeddings`
Enables semantic search:
```sql
- id (UUID): Unique embedding identifier
- conversation_id (UUID): Reference to conversation
- embedding (FLOAT[]): Vector representation
- content (TEXT): Original text content
- created_at (TIMESTAMP): Creation time
```

## 🔧 Development

### File Structure
```
lovable-assistant/
├── manifest.json              # Extension configuration
├── background/
│   ├── service-worker.js      # Main background script
│   ├── ai-api.js             # Multi-provider AI API integration
│   └── database-sync.js      # Supabase integration
├── content_scripts/
│   ├── lovable-detector.js   # Page detection
│   ├── conversation-capture.js # Message monitoring
│   └── ui-injector.js        # Dialog interface
├── popup/
│   ├── popup.html            # Extension popup
│   ├── popup.css             # Popup styles
│   └── popup.js              # Popup functionality
├── assets/
│   ├── icons/                # Extension icons
│   └── styles/
│       └── content.css       # Injected styles
├── database-setup.sql        # Supabase schema
└── README.md                 # Documentation
```
## 🚀 Quick Start

1. **Install Dependencies**: No additional dependencies needed
2. **Load Extension**: Load as unpacked extension in Chrome
3. **Configure APIs**: Add your Claude and Supabase credentials
4. **Visit Lovable.dev**: Navigate to any project page to start using

## 🔧 Troubleshooting

### Common Issues

**Extension not detecting Lovable.dev pages:**
- Ensure you're on a project page (`https://lovable.dev/projects/*`)
- Refresh the page and wait a few seconds
- Check that the extension is enabled in `chrome://extensions/`

**Connection test failing:**
- Verify your Claude API key is correct and active
- Check Supabase URL format (should include `https://` and end with `.supabase.co`)
- Ensure Supabase anon key has proper permissions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check this README for common solutions

### Reporting Issues
When reporting bugs, please include:
- Chrome version
- Extension version
- Steps to reproduce
- Console error messages
- Screenshots if relevant

---

**Made with ❤️ for the Lovable.dev community**

*This extension is not officially affiliated with Lovable.dev or Anthropic.*