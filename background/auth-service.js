// Authentication Service for Lovable Assistant
// Handles user authentication, session management, and user roles

export class AuthService {
  constructor() {
    this.masterSupabaseUrl = null;
    this.masterSupabaseKey = null;
    this.currentUser = null;
    this.currentSession = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    // Get master database configuration from extension storage
    const config = await chrome.storage.sync.get(['masterSupabaseUrl', 'masterSupabaseKey']);
    
    if (!config.masterSupabaseUrl || !config.masterSupabaseKey) {
      throw new Error('Master database configuration not found. Please configure in extension settings.');
    }
    
    this.masterSupabaseUrl = config.masterSupabaseUrl;
    this.masterSupabaseKey = config.masterSupabaseKey;
    
    // Try to restore existing session
    await this.restoreSession();
    
    this.initialized = true;
    console.log('🔐 AuthService initialized');
  }

  async makeAuthRequest(endpoint, options = {}) {
    await this.init();
    
    const url = `${this.masterSupabaseUrl}/auth/v1/${endpoint}`;
    console.log(`🔍 Auth request: ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'apikey': this.masterSupabaseKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const result = await response.json();
    console.log(`🔍 Auth response: ${response.status}`, result);

    if (!response.ok) {
      throw new Error(result.message || result.error_description || 'Authentication failed');
    }

    return result;
  }

  async makeApiRequest(endpoint, options = {}) {
    await this.init();
    
    const url = `${this.masterSupabaseUrl}/rest/v1/${endpoint}`;
    console.log(`🔍 API request: ${options.method || 'GET'} ${endpoint}`);
    
    const headers = {
      'apikey': this.masterSupabaseKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    };

    // Add authorization header if user is authenticated
    if (this.currentSession?.access_token) {
      headers['Authorization'] = `Bearer ${this.currentSession.access_token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    console.log(`🔍 API response: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API request failed: ${response.status}`, errorText);
      throw new Error(`API request failed: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ API response data:`, result);
    return result;
  }

  /**
   * REGISTER NEW USER
   */
  async register(email, password, displayName) {
    try {
      console.log('🔐 Registering new user:', email);
      
      const { user, session } = await this.makeAuthRequest('signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          data: {
            display_name: displayName
          }
        })
      });

      if (session) {
        await this.setSession(session);
        
        // Log the registration
        await this.logUserAction('user_registered', 'user', user.id, {
          email,
          display_name: displayName
        });
      }

      return { user, session };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }

  /**
   * SIGN IN USER
   */
  async signIn(email, password) {
    try {
      console.log('🔐 Signing in user:', email);
      
      const { user, session } = await this.makeAuthRequest('token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      });

      if (session) {
        await this.setSession(session);
        
        // Update last login in user profile
        await this.updateUserProfile(user.id, {
          last_login: new Date().toISOString()
        });
        
        // Log the login
        await this.logUserAction('user_signed_in', 'user', user.id, { email });
      }

      return { user, session };
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      throw error;
    }
  }

  /**
   * SIGN OUT USER
   */
  async signOut() {
    try {
      console.log('🔐 Signing out user');
      
      if (this.currentSession?.access_token) {
        await this.makeAuthRequest('logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.currentSession.access_token}`
          }
        });
      }
      
      // Clear local session data
      await this.clearSession();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      // Clear session anyway
      await this.clearSession();
      throw error;
    }
  }

  /**
   * RESET PASSWORD
   */
  async resetPassword(email) {
    try {
      console.log('🔐 Requesting password reset for:', email);
      
      await this.makeAuthRequest('recover', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw error;
    }
  }

  /**
   * GET CURRENT USER PROFILE
   */
  async getCurrentUserProfile() {
    if (!this.currentUser) {
      return null;
    }

    try {
      const profiles = await this.makeApiRequest(`user_profiles?user_id=eq.${this.currentUser.id}`);
      return profiles && profiles.length > 0 ? profiles[0] : null;
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * UPDATE USER PROFILE
   */
  async updateUserProfile(userId, updates) {
    try {
      const result = await this.makeApiRequest(`user_profiles?user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * GET SYSTEM PROMPT TEMPLATES
   */
  async getSystemPromptTemplates() {
    try {
      const userProfile = await this.getCurrentUserProfile();
      const isAdmin = userProfile?.role === 'administrator';
      
      let query = 'system_prompt_templates?';
      
      if (isAdmin) {
        // Admins can see all templates
        query += 'order=created_at.desc';
      } else {
        // Regular users can only see public templates
        query += 'is_public=eq.true&order=created_at.desc';
      }
      
      const templates = await this.makeApiRequest(query);
      return templates || [];
    } catch (error) {
      console.error('❌ Failed to get system prompt templates:', error);
      return [];
    }
  }

  /**
   * CREATE SYSTEM PROMPT TEMPLATE (Admin only)
   */
  async createSystemPromptTemplate(template) {
    const userProfile = await this.getCurrentUserProfile();
    
    if (userProfile?.role !== 'administrator') {
      throw new Error('Only administrators can create system prompt templates');
    }

    try {
      const result = await this.makeApiRequest('system_prompt_templates', {
        method: 'POST',
        body: JSON.stringify({
          ...template,
          created_by: this.currentUser.id
        })
      });

      await this.logUserAction('template_created', 'system_prompt_template', result[0]?.id, template);
      
      return result[0];
    } catch (error) {
      console.error('❌ Failed to create system prompt template:', error);
      throw error;
    }
  }

  /**
   * UPDATE SYSTEM PROMPT TEMPLATE (Admin only)
   */
  async updateSystemPromptTemplate(templateId, updates) {
    const userProfile = await this.getCurrentUserProfile();
    
    if (userProfile?.role !== 'administrator') {
      throw new Error('Only administrators can update system prompt templates');
    }

    try {
      const result = await this.makeApiRequest(`system_prompt_templates?id=eq.${templateId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      await this.logUserAction('template_updated', 'system_prompt_template', templateId, updates);
      
      return result[0];
    } catch (error) {
      console.error('❌ Failed to update system prompt template:', error);
      throw error;
    }
  }

  /**
   * SESSION MANAGEMENT
   */
  async setSession(session) {
    this.currentSession = session;
    this.currentUser = session.user;
    
    // Store session in extension storage
    await chrome.storage.local.set({
      userSession: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: session.user
      }
    });
    
    console.log('✅ Session set for user:', session.user.email);
  }

  async clearSession() {
    this.currentSession = null;
    this.currentUser = null;
    
    // Clear session from extension storage
    await chrome.storage.local.remove(['userSession']);
    
    console.log('✅ Session cleared');
  }

  async restoreSession() {
    try {
      const { userSession } = await chrome.storage.local.get(['userSession']);
      
      if (!userSession) {
        console.log('ℹ️ No stored session found');
        return null;
      }

      // Check if session is expired
      if (userSession.expires_at && new Date(userSession.expires_at * 1000) <= new Date()) {
        console.log('⚠️ Stored session is expired');
        await this.clearSession();
        return null;
      }

      this.currentSession = userSession;
      this.currentUser = userSession.user;
      
      console.log('✅ Session restored for user:', userSession.user.email);
      return userSession;
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
      await this.clearSession();
      return null;
    }
  }

  /**
   * USER ACTION LOGGING
   */
  async logUserAction(action, resourceType, resourceId, details = {}) {
    try {
      if (!this.currentUser) return;

      await this.makeApiRequest('user_audit_log', {
        method: 'POST',
        body: JSON.stringify({
          user_id: this.currentUser.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          user_agent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('❌ Failed to log user action:', error);
      // Don't throw - logging failures shouldn't break main functionality
    }
  }

  /**
   * UTILITY METHODS
   */
  isAuthenticated() {
    return !!this.currentUser && !!this.currentSession;
  }

  isAdministrator() {
    // This will be checked against the user profile when needed
    return this.getCurrentUserProfile().then(profile => profile?.role === 'administrator');
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getCurrentSession() {
    return this.currentSession;
  }
}