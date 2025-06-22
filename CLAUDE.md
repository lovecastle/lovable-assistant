# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension (Manifest V3) for Lovable.dev that enhances the development experience by capturing conversations, providing AI-powered suggestions, and managing project context. The extension integrates with Claude API and Supabase for intelligent assistance and cloud storage.

## Key Architecture

### Extension Components
- **Service Worker** (`background/service-worker.js`): Central message routing, API calls, and database operations
- **Content Scripts**: Injected into Lovable.dev pages
  - `lovable-detector.js`: Main detector that manages UI injection and conversation monitoring
  - `conversation-capture-simple.js`: Captures chat messages with performance optimizations
  - `ui-injector.js`: Injects the assistant dialog interface
- **Popup** (`popup/`): Configuration interface for API keys and settings

### Data Flow
1. Content scripts detect Lovable.dev project pages
2. Conversation capture monitors chat messages with 5-second scan cooldown
3. Messages are processed and stored in Supabase via service worker
4. Assistant dialog provides AI-powered features via Claude API

## Development Commands

### Loading the Extension
```bash
# No build process - load directly in Chrome
1. Open chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the lovable-assistant folder
```

### Testing and Debugging
```javascript
// In browser console on Lovable.dev project page:

// Check conversation capture status
window.conversationCapture.debugInfo()

// View captured messages
window.conversationCapture.detectedMessages

// Toggle verbose logging
window.conversationCapture.setVerbose(true/false)

// Adjust scan frequency (ms)
window.conversationCapture.setScanCooldown(5000)

// Test scan manually
window.conversationCapture.testScan()
```

### Database Setup
The extension automatically sets up the database schema when users configure their Supabase credentials. No manual SQL execution required - the extension handles:
- Table creation (conversations, prompt_templates, user_preferences, project_manager, assistant_conversations)
- Index creation for performance
- Row Level Security policies
- Default data insertion (prompt templates, user preferences)
- Trigger setup for automatic timestamp updates

The setup is handled by `setupDatabaseSchema()` function in `background/service-worker.js`.

## Important Context

### Performance Optimizations
- Conversation scanning has a 5-second cooldown to prevent console flooding
- Duplicate detection tracks processed message IDs
- Default logging is concise; use verbose mode for debugging
- Status updates occur every 60 seconds

### Recent Development Focus
- Improved chat container detection with multiple strategies
- Removed notification system for cleaner operation
- Enhanced error handling and logging controls
- Fixed conversation history sorting (newest first)

### Key URLs and Permissions
- Target pages: `https://lovable.dev/projects/*`
- API endpoints: `https://api.anthropic.com/*`, `https://*.supabase.co/*`
- Required permissions: storage, activeTab, scripting

### Testing Considerations
- No automated test framework - use manual testing
- Test conversation capture on actual Lovable.dev project pages
- Verify API connections via popup "Test Connection" button
- Check console for error messages and capture logs

## Common Development Tasks

### Adding New Features
1. For UI changes, modify `content_scripts/lovable-detector.js`
2. For API functionality, update `background/service-worker.js`
3. For data model changes, create new SQL migration file
4. Test thoroughly on Lovable.dev project pages

### Debugging Issues
1. Check browser console for errors
2. Use `window.conversationCapture.setVerbose(true)` for detailed logs
3. Verify API keys in popup configuration
4. Check Supabase logs for database errors

### Code Conventions
- Use vanilla JavaScript (no build process)
- Follow existing patterns for message passing between components
- Keep console logging minimal in production mode
- Document exposed window methods for debugging