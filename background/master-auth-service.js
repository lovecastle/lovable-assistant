// Master Database Authentication Service
// Handles authentication with the central Supabase master database

export class MasterAuthService {
  constructor() {
    // Master database configuration
    this.masterDbUrl = 'https://dwbrjztmskvzpyufwxnt.supabase.co';
    this.masterDbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3YnJqenRtc2t2enB5dWZ3eG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTkyNTAsImV4cCI6MjA2MzU5NTI1MH0.t5qo1CEePXCxfdFRaVABMqR0TOX9DHIbHXb7Z8zFq1Q'; // anon key
    this.currentUser = null;
    this.userProfile = null;
    this.sessionToken = null;
  }


  // Register new user with Supabase Auth
  async register(email, password, displayName = null) {
    try {
      console.log('🔐 Registering user with Supabase Auth...');

      // Register user with Supabase Auth
      const authResponse = await fetch(`${this.masterDbUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': this.masterDbKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password,
          data: {
            display_name: displayName || email
          }
        })
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({ msg: 'Unknown error' }));
        console.error('❌ Auth registration failed:', errorData);
        
        // Handle specific auth errors
        if (authResponse.status === 500 && errorData.msg?.includes('Database error')) {
          throw new Error('Supabase Authentication needs configuration: 1) Disable email confirmation 2) Set signup URL 3) Configure templates. Please set up Auth in your Supabase dashboard.');
        }
        
        throw new Error(errorData.msg || `Registration failed: ${authResponse.status}`);
      }

      const authData = await authResponse.json();
      console.log('✅ Auth user created:', authData);

      if (authData.user) {
        // Create user profile
        const profileResponse = await fetch(`${this.masterDbUrl}/rest/v1/user_profiles`, {
          method: 'POST',
          headers: this.getSupabaseHeaders(false, true),
          body: JSON.stringify({
            auth_user_id: authData.user.id,
            role: 'user'
          })
        });

        if (!profileResponse.ok) {
          console.error('❌ Profile creation failed, but user was created in Auth');
          // Don't fail the registration since the user was created in Auth
        }

        return {
          success: true,
          user: authData.user,
          session: authData.session,
          message: 'Registration successful! You can now sign in.'
        };
      } else {
        throw new Error('User registration succeeded but no user data returned');
      }

    } catch (error) {
      console.error('❌ Registration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Login user with Supabase Auth
  async login(email, password) {
    try {
      console.log('🔐 Logging in user with Supabase Auth...');

      // Login with Supabase Auth
      const authResponse = await fetch(`${this.masterDbUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': this.masterDbKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({ msg: 'Unknown error' }));
        console.error('❌ Auth login failed:', errorData);
        
        if (authResponse.status === 400) {
          throw new Error('Invalid email or password');
        }
        
        throw new Error(errorData.msg || 'Login failed');
      }

      const authData = await authResponse.json();
      console.log('✅ User logged in successfully:', authData.user.email);

      this.currentUser = authData.user;
      this.sessionToken = authData.access_token;

      // Fetch user profile
      await this.fetchUserProfile();
      
      // Update last login
      await this.updateLastLogin();

      return {
        success: true,
        user: this.getUserInfo(),
        profile: this.userProfile,
        session: authData
      };

    } catch (error) {
      console.error('❌ Login failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Logout user
  async logout() {
    try {
      console.log('🔐 Logging out user...');

      if (this.sessionToken) {
        const response = await fetch(`${this.masterDbUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'apikey': this.masterDbKey,
            'Authorization': `Bearer ${this.sessionToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn('⚠️ Logout request failed, but clearing local session');
        }
      }

      this.currentUser = null;
      this.userProfile = null;
      this.sessionToken = null;

      console.log('✅ User logged out successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Clear local session even if remote logout fails
      this.currentUser = null;
      this.userProfile = null;
      this.sessionToken = null;
      return { success: true };
    }
  }

  // Get current session
  async getCurrentSession() {
    try {
      // Check if we have a stored session
      if (this.sessionToken) {
        // Verify session with Supabase Auth
        const response = await fetch(`${this.masterDbUrl}/auth/v1/user`, {
          headers: {
            'apikey': this.masterDbKey,
            'Authorization': `Bearer ${this.sessionToken}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          this.currentUser = userData;
          await this.fetchUserProfile();
          return { user: this.currentUser };
        } else {
          // Session expired or invalid, clear it
          this.currentUser = null;
          this.userProfile = null;
          this.sessionToken = null;
          return null;
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Failed to get session:', error);
      return null;
    }
  }

  // Fetch user profile from master database
  async fetchUserProfile() {
    try {
      if (!this.currentUser) return null;

      const response = await fetch(`${this.masterDbUrl}/rest/v1/user_profiles?auth_user_id=eq.${this.currentUser.id}`, {
        headers: {
          'apikey': this.masterDbKey,
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch user profile:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.length === 0) {
        console.error('❌ No user profile found');
        return null;
      }

      this.userProfile = data[0];
      console.log('✅ User profile fetched:', data[0].role);
      return data[0];

    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      return null;
    }
  }

  // Update last login timestamp
  async updateLastLogin() {
    try {
      if (!this.currentUser || !this.userProfile) return;

      const response = await fetch(`${this.masterDbUrl}/rest/v1/user_profiles?id=eq.${this.userProfile.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.masterDbKey,
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          last_login: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('❌ Failed to update last login:', response.status);
      }

    } catch (error) {
      console.error('❌ Error updating last login:', error);
    }
  }

  // Get system prompt templates
  async getSystemTemplates() {
    try {
      // Build query based on user permissions
      let url = `${this.masterDbUrl}/rest/v1/system_prompt_templates?is_public=eq.true&order=category.asc`;

      // If user has premium access, also get premium templates
      if (this.userProfile?.subscription_status === 'premium' || 
          this.userProfile?.subscription_status === 'enterprise' ||
          this.userProfile?.role === 'administrator') {
        url = `${this.masterDbUrl}/rest/v1/system_prompt_templates?or=(is_public.eq.true,is_premium.eq.true)&order=category.asc`;
      }

      const response = await fetch(url, {
        headers: {
          'apikey': this.masterDbKey,
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch system templates:', response.status);
        return [];
      }

      const data = await response.json();
      console.log(`✅ Fetched ${data.length} system templates`);
      return data;

    } catch (error) {
      console.error('❌ Error fetching system templates:', error);
      return [];
    }
  }

  // Update user database configuration
  async updateUserDatabaseConfig(databaseUrl, databaseKey) {
    try {
      if (!this.userProfile) {
        throw new Error('User not logged in');
      }

      const response = await fetch(`${this.masterDbUrl}/rest/v1/user_profiles?id=eq.${this.userProfile.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.masterDbKey,
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_database_url: databaseUrl,
          user_database_key: databaseKey,
          user_database_configured: true,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Failed to update user database config:', error);
        throw new Error(error);
      }

      // Update local profile
      this.userProfile.user_database_url = databaseUrl;
      this.userProfile.user_database_key = databaseKey;
      this.userProfile.user_database_configured = true;

      console.log('✅ User database configuration updated');
      return { success: true };

    } catch (error) {
      console.error('❌ Error updating user database config:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Log user action for audit
  async logUserAction(action, resourceType = null, resourceId = null, details = {}) {
    try {
      if (!this.userProfile) return;

      const response = await fetch(`${this.masterDbUrl}/rest/v1/user_audit_log`, {
        method: 'POST',
        headers: {
          'apikey': this.masterDbKey,
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userProfile.id,
          action: action,
          resource_type: resourceType,
          resource_id: resourceId,
          details: details,
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('❌ Failed to log user action:', response.status);
      }

    } catch (error) {
      console.error('❌ Error logging user action:', error);
    }
  }

  // Track usage analytics
  async trackUsage(eventType, eventData = {}) {
    try {
      if (!this.userProfile) return;

      const response = await fetch(`${this.masterDbUrl}/rest/v1/usage_analytics`, {
        method: 'POST',
        headers: {
          'apikey': this.masterDbKey,
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userProfile.id,
          event_type: eventType,
          event_data: eventData,
          timestamp: new Date().toISOString(),
          extension_version: chrome.runtime.getManifest().version
        })
      });

      if (!response.ok) {
        console.error('❌ Failed to track usage:', response.status);
      }

    } catch (error) {
      console.error('❌ Error tracking usage:', error);
    }
  }

  // Check if user is administrator
  isAdmin() {
    return this.userProfile?.role === 'administrator';
  }

  // Check if user has premium access
  hasPremiumAccess() {
    return this.userProfile?.subscription_status === 'premium' || 
           this.userProfile?.subscription_status === 'enterprise' ||
           this.isAdmin();
  }

  // Get user info for display
  getUserInfo() {
    if (!this.currentUser || !this.userProfile) return null;

    return {
      email: this.currentUser.email,
      role: this.userProfile.role,
      subscriptionStatus: this.userProfile.subscription_status,
      databaseConfigured: this.userProfile.user_database_configured,
      isActive: this.userProfile.is_active,
      lastLogin: this.userProfile.last_login,
      createdAt: this.userProfile.created_at
    };
  }
}