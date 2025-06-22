# Lovable.dev Conversation Capture Chrome Extension

A Chrome extension that captures and organizes your development conversations on Lovable.dev, providing conversation history, project management, and data export capabilities.

## 🚀 Features

### Core Functionality
- **Conversation Capture**: Automatically captures and saves all conversations with Lovable.dev
- **Full-Text Search**: Search through your conversation history with powerful text search
- **Project Management**: Organize and track project information, descriptions, and context
- **Conversation History**: Browse, filter, and export your development conversations
- **Clean Interface**: Unobtrusive dialog that integrates seamlessly with Lovable.dev

### Development Workflow
- **Automatic Capture**: Conversations are saved automatically as you work
- **Project Organization**: Maintain project-specific information and knowledge base
- **Data Export**: Export conversations and project data for backup or analysis
- **Search & Filter**: Find specific conversations by project, date, or content

### Data Management
- **Secure Cloud Storage**: All data stored in secure Supabase database
- **User Authentication**: Secure login with personal data isolation
- **Export/Import**: Full data portability and backup capabilities
- **Privacy-Focused**: Your conversations are stored securely and privately

## 📋 Prerequisites

Before using the extension, you'll need:

1. **User Account**: Register for free through the extension interface
2. **Chrome Browser**: Version 88 or higher

## 🛠️ Installation

### Step 1: Download the Extension
1. Download or clone this repository
2. Extract the files if downloaded as ZIP

### Step 2: Install the Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension folder
4. The extension icon should appear in your toolbar

### Step 3: Register Your Account
1. Click the extension icon in your Chrome toolbar
2. Click "Register" to create a new account
3. Enter your email, password, and display name
4. After registration, sign in with your credentials

## 🎯 Usage

### Getting Started
1. Navigate to any Lovable.dev project page (`https://lovable.dev/projects/*`)
2. The extension will automatically detect the page and begin conversation capture
3. All your conversations with Lovable.dev will be automatically saved

### Using the Extension
- **Conversation History**: Browse and search through your past conversations
- **Project Manager**: Organize project information and context
- **Settings**: Configure conversation capture preferences
- **Export/Import**: Backup and restore your conversation data

### Key Features
- **Automatic Capture**: All conversations are saved automatically as you work
- **Search**: Find specific conversations by content, project, or date
- **Project Management**: Add descriptions and context to your projects
- **Keyboard Shortcuts**: Press `Escape` to close dialogs

### Quick Actions
- **🔍 Search History**: Find relevant past conversations
- **📁 Project Manager**: Organize and manage your project information
- **📊 Export Data**: Download your conversation data
- **⚙️ Settings**: Configure capture preferences

## ⚙️ Configuration Options

### Capture Settings
- **Auto-capture conversations**: Automatically save all chat interactions (enabled by default)
- **Scan frequency**: How often to check for new messages (default: 5 seconds)
- **Debug logging**: Enable detailed console logging for troubleshooting

### Storage Preferences
- **Max conversations**: Limit stored conversations per project (default: 1000)
- **Auto-cleanup**: Automatically remove old conversations after specified time
- **Export format**: Choose between JSON, CSV, or text format for exports

### Interface Options
- **Keyboard shortcuts**: Enable hotkeys for quick actions
- **Theme**: Choose between light and dark interface themes
- **Notification preferences**: Configure capture status notifications
## 🗄️ Database Schema

The extension uses the following Supabase tables:

### `conversations`
Stores all chat interactions with metadata:
```sql
- id (UUID): Unique conversation identifier
- user_id (UUID): User who owns the conversation
- project_id (TEXT): Lovable.dev project ID
- user_message (TEXT): Your message to Lovable.dev
- lovable_response (TEXT): Lovable.dev's response
- timestamp (TIMESTAMP): When the conversation occurred
- project_context (JSONB): Project metadata and context
- tags (TEXT[]): User-defined categorization tags
```

### `projects`
Tracks project information and metadata:
```sql
- id (TEXT): Project identifier from Lovable.dev
- user_id (UUID): User who owns the project
- name (TEXT): Project display name
- description (TEXT): User-provided project description
- tech_stack (JSONB): Technologies and frameworks used
- current_state (JSONB): Project status and progress
- created_at (TIMESTAMP): When project was first captured
- last_updated (TIMESTAMP): Last conversation activity
```

### `users`
User authentication and profile management:
```sql
- id (UUID): Unique user identifier
- email (TEXT): User email address
- display_name (TEXT): User display name
- created_at (TIMESTAMP): Account creation time
- last_login (TIMESTAMP): Last login time
```

## 🔧 Development

### File Structure
```
lovable-assistant/
├── manifest.json              # Extension configuration
├── background/
│   ├── service-worker.js      # Main background script
│   └── database-sync.js      # Supabase integration
├── content_scripts/
│   ├── lovable-detector.js   # Page detection and UI injection
│   ├── conversation-capture-simple.js # Message monitoring
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

1. **Install Extension**: Load as unpacked extension in Chrome
2. **Create Account**: Register through the extension popup
3. **Visit Lovable.dev**: Navigate to any project page to start capturing conversations
4. **Access Features**: Use the extension dialog to browse history and manage projects

## 🔧 Troubleshooting

### Common Issues

**Extension not detecting Lovable.dev pages:**
- Ensure you're on a project page (`https://lovable.dev/projects/*`)
- Refresh the page and wait a few seconds
- Check that the extension is enabled in `chrome://extensions/`

**Conversations not being captured:**
- Verify you're logged in to your account
- Check browser console for error messages
- Ensure conversation capture is enabled in settings
- Try manually refreshing the page

**Search not working:**
- Check that conversations have been saved to your account
- Verify you're searching in the correct project
- Try different search terms or clear the search filter

**Data not syncing:**
- Check your internet connection
- Verify your account login status
- Check browser console for sync errors
- Try logging out and back in

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

*This extension is not officially affiliated with Lovable.dev.*