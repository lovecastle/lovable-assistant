# Secure Authentication Setup - Backend API Approach

## Overview

Instead of exposing your master database credentials in the extension, we'll create a secure backend API that acts as a proxy between the extension and your Supabase database.

## Architecture

```
Extension → Your Backend API → Your Supabase (Master DB)
                              ↓
                              User's Supabase (Personal Data)
```

## Step 1: Create Backend API

### 1.1 Setup Backend (Node.js/Vercel/Netlify)

Create a simple backend API that handles authentication and template management:

```javascript
// api/auth.js (Vercel function example)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key (backend only)
)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { action, ...data } = req.body

    switch (action) {
      case 'register':
        return await handleRegister(data, res)
      case 'login':
        return await handleLogin(data, res)
      case 'getTemplates':
        return await handleGetTemplates(data, res)
      // ... other actions
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function handleRegister({ email, password, displayName }, res) {
  const { user, session, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName }
    }
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ user, session })
}
```

### 1.2 Environment Variables

```bash
# .env (backend only - never in extension)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
JWT_SECRET=your-jwt-secret
```

## Step 2: Update Extension to Use API

### 2.1 Update AuthService

```javascript
// background/auth-service.js
export class AuthService {
  constructor() {
    this.apiUrl = 'https://your-api-domain.vercel.app/api' // Your deployed API
    this.currentUser = null
    this.currentSession = null
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.apiUrl}/${endpoint}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(options.body || {})
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  async register(email, password, displayName) {
    const result = await this.makeRequest('auth', {
      body: {
        action: 'register',
        email,
        password,
        displayName
      }
    })

    if (result.session) {
      await this.setSession(result.session)
    }

    return result
  }

  async signIn(email, password) {
    const result = await this.makeRequest('auth', {
      body: {
        action: 'login',
        email,
        password
      }
    })

    if (result.session) {
      await this.setSession(result.session)
    }

    return result
  }

  async getSystemPromptTemplates() {
    return this.makeRequest('templates', {
      body: {
        action: 'getTemplates',
        userId: this.currentUser?.id
      }
    })
  }
}
```

### 2.2 Configuration in Extension

Add only your API URL to the extension:

```javascript
// In manifest.json, add your API domain to permissions
"permissions": [
  "storage",
  "activeTab",
  "scripting",
  "https://your-api-domain.vercel.app/*"
]

// In background/service-worker.js
chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.sync.set({
    apiUrl: 'https://your-api-domain.vercel.app/api'
  })
})
```

## Step 3: Deploy Backend API

### 3.1 Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# In your backend folder
vercel --prod

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add JWT_SECRET
```

### 3.2 Alternative: Netlify Functions

```javascript
// netlify/functions/auth.js
exports.handler = async (event, context) => {
  // Same logic as Vercel function
}
```

## Step 4: Enhanced Security Features

### 4.1 Rate Limiting

```javascript
// Add to your API
const rateLimit = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 100

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  const limit = rateLimit.get(ip)
  if (now > limit.resetTime) {
    limit.count = 1
    limit.resetTime = now + windowMs
    return true
  }

  if (limit.count >= maxRequests) {
    return false
  }

  limit.count++
  return true
}
```

### 4.2 JWT Token Validation

```javascript
// Validate session tokens
import jwt from 'jsonwebtoken'

function validateSession(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header')
  }

  const token = authHeader.slice(7)
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  return decoded
}
```

### 4.3 Input Validation

```javascript
import Joi from 'joi'

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  displayName: Joi.string().min(2).max(50).required()
})

function validateInput(data, schema) {
  const { error, value } = schema.validate(data)
  if (error) {
    throw new Error(error.details[0].message)
  }
  return value
}
```

## Step 5: Advanced Security Considerations

### 5.1 Extension ID Validation

```javascript
// Validate requests come from your extension
function validateExtensionOrigin(req) {
  const origin = req.headers.origin
  const extensionId = 'your-extension-id'
  
  if (origin !== `chrome-extension://${extensionId}`) {
    throw new Error('Unauthorized origin')
  }
}
```

### 5.2 Database Security (Supabase)

```sql
-- Create API-only user with limited permissions
CREATE USER api_user WITH PASSWORD 'secure-password';

-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO api_user;
GRANT SELECT ON system_prompt_templates TO api_user;

-- Revoke unnecessary permissions
REVOKE ALL ON auth.users FROM api_user;
```

## Step 6: Configuration Management

### 6.1 Environment-based Configuration

```javascript
// config.js
const config = {
  development: {
    apiUrl: 'http://localhost:3000/api'
  },
  production: {
    apiUrl: 'https://your-api-domain.vercel.app/api'
  }
}

export default config[process.env.NODE_ENV || 'production']
```

### 6.2 Feature Flags

```javascript
// Control features remotely
async function getFeatureFlags(userId) {
  return this.makeRequest('features', {
    body: { action: 'getFlags', userId }
  })
}
```

## Benefits of This Approach

### ✅ Security Benefits:
- **No database credentials** in extension code
- **Server-side validation** and rate limiting
- **Controlled API surface** - only expose needed functions
- **Audit logging** on server side
- **Easy to revoke access** if needed

### ✅ Scalability Benefits:
- **Caching** system templates on server
- **Analytics** and usage tracking
- **A/B testing** capabilities
- **Billing integration** server-side only

### ✅ Maintenance Benefits:
- **Centralized logic** for auth and templates
- **Easy updates** without extension updates
- **Better error handling** and logging
- **Backup and monitoring** capabilities

## Cost Considerations

### Free Tier Options:
- **Vercel**: 100 GB-hours/month free
- **Netlify**: 125K requests/month free
- **Railway**: $5/month for basic plan
- **Render**: Free tier available

For a Chrome extension, these should be more than sufficient initially.

## Migration from Direct DB Access

If you've already implemented direct DB access:

1. **Deploy the API** first
2. **Update extension** to use API endpoints
3. **Test thoroughly** with both approaches
4. **Remove direct DB** credentials from extension
5. **Publish updated** extension

This approach is much more secure and scalable for a production Chrome extension with user authentication!