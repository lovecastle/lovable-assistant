// ===========================
// PROJECT MANAGER - EXTRACTED MODULE
// ===========================
// This section handles all project management functionality including:
// - Project detection and auto-save (only for user-owned projects)
// - Project list display and management
// - Project settings interface
// - Database integration for project data
// - Debug and testing utilities
// 
// Key Features:
// - Auto-save functionality that saves project info on page load
// - User ownership detection via Send button presence
// - Only saves projects that belong to the current user

// Create ProjectManager class that will be mixed into LovableDetector
window.ProjectManager = {
  async showProjectManager() {
    // Show loading state immediately
    if (typeof this.showDialogLoading === 'function') {
      this.showDialogLoading('Project Manager');
    }
    
    try {
      // Load the projects data first
      await this.loadProjectsList();
      
      // Then render the UI with the loaded data
      const content = document.getElementById('dialog-content');
      const title = document.getElementById('dialog-title');
      
      if (title) {
        title.textContent = '📁 Project Manager';
      }
      
      if (!content) return;
      
      content.innerHTML = `
        <div style="padding: 20px;">
          <div style="margin-bottom: 20px;">
            <button id="back-to-welcome-btn" style="
              background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
              padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;
              display: inline-flex; align-items: center; justify-content: center;
              min-height: 40px; min-width: 120px; transition: all 0.2s ease;
            " onmouseover="this.style.background='#e2e8f0'; this.style.borderColor='#9ca3af'" 
               onmouseout="this.style.background='#f7fafc'; this.style.borderColor='#c9cfd7'">← Back to Welcome</button>
          </div>
          
          <div id="project-list-container">
            <div style="margin-bottom: 16px;">
              <h3 style="margin: 0 0 12px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
                Your Projects
              </h3>
            </div>
            
            <div id="project-list" style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Projects will be populated here -->
            </div>
          </div>
        </div>
      `;
      
      this.setupBackButton();
      this.renderProjectsList(); // Use a render method that works with pre-loaded data
    } catch (error) {
      console.error('❌ Error loading project manager:', error);
      
      // Check if this is an extension context error
      if (error.message?.includes('Extension context invalidated') || 
          error.message?.includes('runtime ID not available')) {
        this.showExtensionContextError();
      }
      
      // Show error state
      const content = document.getElementById('dialog-content');
      if (content) {
        const isContextError = error.message?.includes('Extension context invalidated') || 
                              error.message?.includes('runtime ID not available');
        
        content.innerHTML = `
          <div style="
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            height: 100%; color: #e53e3e; font-size: 14px; gap: 16px; padding: 20px;
          ">
            <div style="font-size: 24px;">${isContextError ? '⚠️' : '❌'}</div>
            <div>${isContextError ? 'Extension connection lost' : 'Failed to load projects'}</div>
            ${isContextError ? 
              '<button onclick="window.location.reload()" style="background: #f56565; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">Reload Page</button>' :
              '<button onclick="window.lovableDetector.showProjectManager()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">Retry</button>'
            }
          </div>
        `;
      }
    }
  },

  showProjectSettings(project) {
    const content = document.getElementById('dialog-content');
    const title = document.getElementById('dialog-title');
    
    if (title) {
      title.textContent = '⚙️ Project Settings';
    }
    
    if (!content) return;
    
    content.innerHTML = `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px;">
          <button id="back-to-projects-btn" style="
            background: #f7fafc; color: #4a5568; border: 1px solid #c9cfd7;
            padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;
            display: inline-flex; align-items: center; justify-content: center;
            min-height: 40px; min-width: 120px; transition: all 0.2s ease;
          " onmouseover="this.style.background='#e2e8f0'; this.style.borderColor='#9ca3af'" 
             onmouseout="this.style.background='#f7fafc'; this.style.borderColor='#c9cfd7'">← Back to Projects</button>
        </div>
        
        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 12px 0; color: #1a202c; font-size: 14px; font-weight: 600;">
            Project Information
          </h3>
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: #1a202c; margin-bottom: 6px;">
              Project Name
            </label>
            <input type="text" id="project-name" value="${project.name}" disabled style="
              width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; box-sizing: border-box; background: #f7fafc; color: #718096;
            ">
          </div>
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: #1a202c; margin-bottom: 6px;">
              Project URL
            </label>
            <input type="text" id="project-url" value="${project.url}" disabled style="
              width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; box-sizing: border-box; background: #f7fafc; color: #718096;
            ">
          </div>
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: #1a202c; margin-bottom: 6px;">
              Project Description (max 150 characters)
            </label>
            <textarea id="project-description" placeholder="Enter a short description..." maxlength="150" style="
              width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; box-sizing: border-box; height: 60px; resize: vertical;
            ">${project.description || ''}</textarea>
          </div>
        </div>

        <div style="background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 12px 0; color: #1a202c; font-size: 14px; font-weight: 600;">
            Project Knowledge
          </h3>
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: #1a202c; margin-bottom: 6px;">
              Documents & Instructions
            </label>
            <textarea id="project-knowledge" placeholder="Add project-specific documentation, guidelines, and instructions..." style="
              width: 100%; padding: 8px 12px; border: 1px solid #c9cfd7; border-radius: 6px;
              font-size: 14px; box-sizing: border-box; height: 120px; resize: vertical;
            ">${project.knowledge || ''}</textarea>
          </div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button id="save-project-settings" style="
            background: #667eea; color: white; border: none; padding: 10px 16px;
            border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; flex: 1;
          ">💾 Save Settings</button>
        </div>
      </div>
    `;
    
    document.getElementById('back-to-projects-btn').addEventListener('click', () => {
      this.showProjectManager();
    });
    
    document.getElementById('save-project-settings').addEventListener('click', async () => {
      await this.saveProjectSettings(project);
    });
  },

  async loadProjectsList() {
    console.log('🔍 Loading projects list...');
    
    const currentProject = await this.getCurrentProject();
    console.log('🔍 Current project detected:', currentProject);
    
    const savedProjects = await this.getSavedProjects();
    console.log('🔍 Saved projects from database:', savedProjects);
    
    // Store the loaded data for rendering
    this.currentProject = currentProject;
    this.savedProjects = savedProjects;
    
    return { currentProject, savedProjects };
  },

  renderProjectsList() {
    try {
      const projectListElement = document.getElementById('project-list');
      if (!projectListElement) {
        console.warn('❌ Project list element not found');
        return;
      }
      
      projectListElement.innerHTML = '';
      
      const { currentProject, savedProjects } = this;
      
      // Add current project first if it exists
      if (currentProject) {
        console.log('✅ Adding current project to list');
        const currentProjectElement = this.createProjectElement(currentProject, true);
        projectListElement.appendChild(currentProjectElement);
      }
      
      // Add other projects from database
      if (savedProjects && savedProjects.length > 0) {
        console.log(`✅ Adding ${savedProjects.length} saved projects`);
        savedProjects.forEach(project => {
          if (!currentProject || project.project_id !== currentProject.id) {
            // Convert database format to UI format
            const uiProject = {
              id: project.project_id,
              name: project.project_name,
              url: project.project_url,
              description: project.description,
              knowledge: project.knowledge
            };
            const projectElement = this.createProjectElement(uiProject, false);
            projectListElement.appendChild(projectElement);
          }
        });
      }
      
      // If no projects, show empty state with debugging options
      if (projectListElement.children.length === 0) {
        console.log('📭 No projects found, showing empty state');
        
        const emptyStateHTML = `
          <div style="
            background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 20px;
            text-align: center; color: #4a5568;
          ">
            <p style="margin: 0 0 12px 0; font-size: 14px;">
              No user-owned projects found. ${currentProject ? 'Current project detected but not saved yet.' : 'Visit your own Lovable project page to see it here.'}
            </p>
            <p style="margin: 0 0 12px 0; font-size: 12px; color: #718096;">
              Only projects you own (with chat interface) are saved here.
            </p>
            ${currentProject ? `
              <button onclick="window.lovableDetector.debugSaveCurrentProject()" style="
                background: #667eea; color: white; border: none; padding: 8px 16px;
                border-radius: 6px; cursor: pointer; font-size: 13px; margin: 4px;
              ">Save Current Project</button>
              <button onclick="window.lovableDetector.testDatabaseTable()" style="
                background: #48bb78; color: white; border: none; padding: 8px 16px;
                border-radius: 6px; cursor: pointer; font-size: 13px; margin: 4px;
              ">Test Database</button>
              <br>
              <small style="color: #718096;">Project: ${currentProject.name} (${currentProject.id})</small>
            ` : `
              <button onclick="window.lovableDetector.debugCurrentUrl()" style="
                background: #ed8936; color: white; border: none; padding: 8px 16px;
                border-radius: 6px; cursor: pointer; font-size: 13px; margin: 4px;
              ">Debug URL Detection</button>
              <button onclick="window.lovableDetector.testDatabaseTable()" style="
                background: #48bb78; color: white; border: none; padding: 8px 16px;
                border-radius: 6px; cursor: pointer; font-size: 13px; margin: 4px;
              ">Test Database</button>
            `}
          </div>
        `;
        
        projectListElement.innerHTML = emptyStateHTML;
      } else {
        console.log(`✅ Successfully loaded ${projectListElement.children.length} projects`);
      }
    } catch (error) {
      console.error('❌ Error rendering projects list:', error);
      
      // Show error state
      const projectListElement = document.getElementById('project-list');
      if (projectListElement) {
        projectListElement.innerHTML = `
          <div style="
            background: #fed7d7; border: 1px solid #f56565; border-radius: 8px; padding: 20px;
            text-align: center; color: #c53030;
          ">
            <p style="margin: 0; font-size: 14px;">
              Error rendering projects: ${error.message}
            </p>
            <button onclick="window.lovableDetector.showProjectManager()" style="
              margin-top: 8px; padding: 4px 8px; background: #c53030; color: white; 
              border: none; border-radius: 4px; cursor: pointer; font-size: 12px;
            ">Retry</button>
          </div>
        `;
      }
    }
  },

  createProjectElement(project, isCurrent) {
    const projectDiv = document.createElement('div');
    projectDiv.style.cssText = `
      background: white; border: 1px solid #c9cfd7; border-radius: 8px; padding: 12px;
      cursor: pointer; transition: all 0.2s; ${isCurrent ? 'border-color: #667eea; background: #f0f4ff;' : ''}
    `;
    
    projectDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <div style="
          width: 16px; height: 16px; background: #667eea; border-radius: 4px;
          display: flex; align-items: center; justify-content: center; color: white;
          font-size: 10px; font-weight: bold;
        ">L</div>
        <div style="font-weight: 600; color: #1a202c; font-size: 14px; flex: 1;">
          ${project.name}
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          ${isCurrent ? '<div style="background: #48bb78; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: 500;">Current</div>' : ''}
          <button class="delete-project-btn" data-project-id="${project.id}" style="
            background: #f56565; color: white; border: none; padding: 4px 8px;
            border-radius: 4px; cursor: pointer; font-size: 10px;
          " onclick="event.stopPropagation();">Delete</button>
        </div>
      </div>
      <div style="font-size: 11px; color: #667eea; margin-bottom: 4px;">
        ${project.url}
      </div>
      <div style="font-size: 12px; color: #4a5568; line-height: 1.4;">
        ${project.description || 'No description provided'}
      </div>
    `;
    
    projectDiv.addEventListener('click', () => {
      if (isCurrent) {
        this.showProjectSettings(project);
      } else {
        this.safeSendMessage({
          action: 'openTab',
          url: project.url
        }).catch(error => {
          console.warn('Failed to open project tab:', error);
        });
      }
    });
    
    projectDiv.addEventListener('mouseenter', () => {
      if (!isCurrent) {
        projectDiv.style.borderColor = '#667eea';
        projectDiv.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.1)';
      }
    });
    
    projectDiv.addEventListener('mouseleave', () => {
      if (!isCurrent) {
        projectDiv.style.borderColor = '#c9cfd7';
        projectDiv.style.boxShadow = 'none';
      }
    });
    
    // Add delete button event listener
    const deleteBtn = projectDiv.querySelector('.delete-project-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent triggering the project click
        await this.deleteProject(project);
      });
    }
    
    return projectDiv;
  },

  /**
   * GET CURRENT PROJECT WITH AUTO-SAVE
   * 
   * Main method that detects current project and automatically saves to database.
   * This method implements the core auto-save functionality requested.
   * 
   * Process:
   * 1. Extract project ID from URL
   * 2. Get project name from page title
   * 3. Check if project exists in database
   * 4. Auto-save if new project or if name/URL changed
   * 5. Preserve existing description and knowledge
   * 
   * Returns: Project object with current info + saved data from database
   */
  async getCurrentProject() {
    try {
      const currentUrl = window.location.href;
      console.log('🔍 Current URL:', currentUrl);
      
      if (!currentUrl.includes('lovable.dev/projects/')) {
        console.log('❌ Not on a Lovable project page');
        return null;
      }
      
      const urlMatch = currentUrl.match(/lovable\.dev\/projects\/([^/?]+)/);
      console.log('🔍 URL match result:', urlMatch);
      
      if (!urlMatch) {
        console.log('❌ Could not extract project ID from URL');
        return null;
      }
      
      const projectId = urlMatch[1];
      const projectName = this.getProjectNameFromTitle();
      console.log('🔍 Detected project:', { projectId, projectName });
      
      // Check if this is the user's own project by detecting the Send button
      const isUserProject = this.isUserOwnedProject();
      console.log('🔍 Is user-owned project:', isUserProject);
      
      if (!isUserProject) {
        console.log('🚫 Not a user-owned project, skipping auto-save');
        return null;
      }
      
      const currentProject = {
        id: projectId,
        name: projectName,
        url: currentUrl,
        description: '',
        knowledge: ''
      };
      
      // Load saved project data from database if it exists
      let existingProject = null;
      try {
        console.log('🔍 Fetching project data from database...');
        const response = await this.safeSendMessageWithRetry({
          action: 'getProjectManager',
          projectId: projectId
        });
        
        console.log('🔍 Database response:', response);
        
        if (response?.success && response.data) {
          existingProject = response.data;
          currentProject.description = response.data.description || '';
          currentProject.knowledge = response.data.knowledge || '';
          console.log('✅ Loaded project data from database');
        } else {
          console.log('📭 No existing project data in database');
        }
      } catch (error) {
        console.warn('⚠️ Could not load project data from database:', error);
      }
      
      // ========================================
      // AUTO-SAVE LOGIC - Core Feature Implementation
      // ========================================
      // Automatically save project info when:
      // - Project doesn't exist in database yet
      // - Project name has changed 
      // - Project URL has changed
      // This eliminates need for manual "Save Settings" click
      if (!existingProject || 
          existingProject.project_name !== projectName || 
          existingProject.project_url !== currentUrl) {
        
        console.log('💾 Auto-saving project information to database...');
        await this.autoSaveProjectWithRetry({
          project_id: projectId,
          project_name: projectName,
          project_url: currentUrl,
          description: currentProject.description,
          knowledge: currentProject.knowledge
        });
      } else {
        console.log('ℹ️ Project information already exists and is up to date');
      }
      
      console.log('✅ Final current project:', currentProject);
      return currentProject;
    } catch (error) {
      console.error('❌ Error getting current project:', error);
      return null;
    }
  },

  /**
   * AUTO-SAVE PROJECT INFORMATION WITH RETRY
   * 
   * Resilient auto-save method that handles extension context invalidation
   */
  async autoSaveProjectWithRetry(projectManagerData, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add a small delay for subsequent attempts to allow extension to stabilize
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for project auto-save`);
        }
        
        const saveResponse = await this.safeSendMessageWithRetry({
          action: 'saveProjectManager',
          data: projectManagerData
        });
        
        if (saveResponse?.success) {
          console.log('✅ Project information auto-saved successfully');
          return; // Success, exit retry loop
        } else if (saveResponse?.error?.includes('Extension context invalidated')) {
          // Extension context issue - worth retrying
          console.warn(`⚠️ Extension context invalidated on attempt ${attempt}/${maxRetries}`);
          if (attempt === maxRetries) {
            console.warn('⚠️ Failed to auto-save project information after all retries: Extension context persistently invalidated');
            this.showExtensionContextError();
          }
          continue; // Try again
        } else {
          // Other error - don't retry
          console.warn('⚠️ Failed to auto-save project information:', saveResponse?.error);
          return;
        }
      } catch (error) {
        if (error.message?.includes('Extension context invalidated') || 
            error.message?.includes('runtime ID not available')) {
          // Extension context issue - worth retrying
          console.warn(`⚠️ Extension context error on attempt ${attempt}/${maxRetries}:`, error.message);
          if (attempt === maxRetries) {
            console.warn('⚠️ Failed to auto-save project information after all retries: Extension context persistently invalidated');
            this.showExtensionContextError();
          }
          continue; // Try again
        } else {
          // Other error - don't retry
          console.warn('⚠️ Error auto-saving project information:', error);
          return;
        }
      }
    }
  },
  
  /**
   * AUTO-SAVE PROJECT INFORMATION
   * 
   * Automatically saves project name and URL to database when page loads.
   * This is triggered immediately after page detection for instant saving.
   * 
   * Feature: Saves project info without requiring user to click "Save Settings"
   * - Detects project ID from URL
   * - Extracts project name from page title  
   * - Checks if project already exists in database
   * - Only saves if new project or if name/URL has changed
   * - Preserves existing description and knowledge fields
   */
  async autoSaveProjectInfo() {
    try {
      console.log('🚀 Auto-saving project information immediately on page load...');
      
      // Wait a moment for page title to be fully loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentProject = await this.getCurrentProject();
      
      if (currentProject) {
        console.log('✅ Project information auto-saved immediately:', currentProject.name);
        return currentProject;
      } else {
        console.log('❌ No project information found to auto-save');
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Error during immediate auto-save:', error);
      throw error;
    }
  },

  getProjectNameFromTitle() {
    try {
      if (document.title && document.title.includes('Lovable')) {
        const titleMatch = document.title.match(/(.+?)\s*[-|]\s*Lovable/);
        if (titleMatch) {
          return titleMatch[1].trim();
        }
      }
      
      // Fallback to project ID from URL
      const urlMatch = window.location.href.match(/lovable\.dev\/projects\/([^/?]+)/);
      return urlMatch ? urlMatch[1] : 'Unknown Project';
    } catch (error) {
      return 'Unknown Project';
    }
  },

  /**
   * CHECK IF PROJECT IS USER-OWNED
   * 
   * Detects if the current project belongs to the user by checking for the presence
   * of the Send button (similar to how we detect Lovable's working status).
   * 
   * Only user-owned projects have the chat interface with the Send button.
   * Public or other projects don't have this element.
   * 
   * Returns: Boolean indicating if this is a user-owned project
   */
  isUserOwnedProject() {
    try {
      console.log('🔍 Checking if project is user-owned...');
      
      // Method 1: Try the exact XPath provided
      try {
        const xpathResult = document.evaluate(
          '/html/body/div[1]/div/div[2]/main/div/div/div[1]/div/div[2]/form/div[2]/div[2]/div[2]/button',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        
        if (xpathResult.singleNodeValue) {
          console.log('✅ Found Send button via XPath - this is a user-owned project');
          return true;
        }
      } catch (xpathError) {
        console.log('⚠️ XPath evaluation failed:', xpathError.message);
      }
      
      // Method 2: Look for the specific button ID
      const sendButton = document.getElementById('chatinput-send-message-button');
      if (sendButton) {
        console.log('✅ Found Send button via ID - this is a user-owned project');
        return true;
      }
      
      // Method 3: Look for any button with the send message functionality
      const sendButtons = document.querySelectorAll('button[type="submit"]');
      for (const button of sendButtons) {
        if ((button.id && button.id.includes('send-message')) ||
            (button.className && button.className.includes('send')) ||
            (button.innerHTML && button.innerHTML.includes('svg') && 
             button.classList.contains('bg-foreground'))) {
          console.log('✅ Found Send button via query selector - this is a user-owned project');
          return true;
        }
      }
      
      // Method 4: Look for form elements that indicate user interaction capability
      const chatForm = document.querySelector('form');
      const chatInput = document.querySelector('input[type="text"], textarea');
      
      if (chatForm && chatInput) {
        console.log('✅ Found chat form and input - this is a user-owned project');
        return true;
      }
      
      console.log('❌ No Send button or chat interface found - this is not a user-owned project');
      return false;
    } catch (error) {
      console.error('❌ Error checking if project is user-owned:', error);
      // Default to false for safety - don't save if we can't determine ownership
      return false;
    }
  },

  async getSavedProjects() {
    try {
      console.log('🔍 Fetching all saved projects from database...');
      const response = await this.safeSendMessageWithRetry({
        action: 'getAllProjectManagers'
      });
      
      console.log('🔍 All projects database response:', response);
      
      if (response?.success) {
        console.log(`✅ Retrieved ${response.data?.length || 0} saved projects`);
        return response.data || [];
      } else {
        console.error('❌ Failed to get saved projects from database:', response?.error);
        return [];
      }
    } catch (error) {
      console.error('❌ Error getting saved projects:', error);
      return [];
    }
  },

  async saveProjectSettings(project) {
    try {
      const description = document.getElementById('project-description').value;
      const knowledge = document.getElementById('project-knowledge').value;
      
      // Prepare data for database
      const projectManagerData = {
        project_id: project.id,
        project_name: project.name,
        project_url: project.url,
        description: description,
        knowledge: knowledge
      };
      
      const response = await this.safeSendMessageWithRetry({
        action: 'saveProjectManager',
        data: projectManagerData
      });
      
      const saveBtn = document.getElementById('save-project-settings');
      const originalText = saveBtn.textContent;
      
      if (response?.success) {
        // Show success feedback
        saveBtn.textContent = '✅ Saved!';
        saveBtn.style.background = '#48bb78';
        
        // Update local project object
        project.description = description;
        project.knowledge = knowledge;
        
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '#667eea';
          this.showProjectManager();
        }, 1500);
      } else {
        throw new Error(response?.error || 'Failed to save to database');
      }
    } catch (error) {
      console.error('Error saving project settings:', error);
      
      // Show error feedback
      const saveBtn = document.getElementById('save-project-settings');
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '❌ Error';
      saveBtn.style.background = '#f56565';
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '#667eea';
      }, 2000);
    }
  },

  /**
   * DELETE PROJECT
   * 
   * Removes a project from the database with user confirmation.
   * Provides visual feedback during the deletion process.
   */
  async deleteProject(project) {
    try {
      // Extra confirmation for current project
      const currentUrl = window.location.href;
      const isCurrentProject = currentUrl.includes(project.id);
      
      let confirmMessage = `Are you sure you want to delete the project "${project.name}"?\n\nThis action cannot be undone.`;
      
      if (isCurrentProject) {
        confirmMessage += '\n\n⚠️ Note: This is the project you are currently viewing.';
      }
      
      if (!confirm(confirmMessage)) {
        return;
      }
      
      console.log('🗑️ Deleting project:', project.id);
      
      // Send delete request to background script
      const response = await this.safeSendMessageWithRetry({
        action: 'deleteProjectManager',
        projectId: project.id
      });
      
      if (response?.success) {
        console.log('✅ Project deleted successfully');
        
        // Show success notification
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed; top: 20px; right: 20px; z-index: 10002;
            background: #48bb78; color: white; padding: 12px 16px;
            border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 14px; animation: slideIn 0.3s ease-out;
          ">
            ✅ Project "${project.name}" deleted successfully
          </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Refresh the project list to reflect changes
        await this.loadProjectsList();
        this.renderProjectsList();
      } else {
        throw new Error(response?.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.innerHTML = `
        <div style="
          position: fixed; top: 20px; right: 20px; z-index: 10002;
          background: #f56565; color: white; padding: 12px 16px;
          border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 14px;
        ">
          ❌ Failed to delete project: ${error.message}
        </div>
      `;
      
      document.body.appendChild(errorNotification);
      
      // Remove error notification after 5 seconds
      setTimeout(() => {
        errorNotification.style.opacity = '0';
        setTimeout(() => errorNotification.remove(), 300);
      }, 5000);
    }
  },

  /**
   * SHOW EXTENSION CONTEXT ERROR
   * 
   * Shows user-friendly notification when extension context is persistently invalidated.
   */
  showExtensionContextError() {
    // Don't show multiple notifications
    if (document.querySelector('.extension-context-error')) {
      return;
    }
    
    const notification = document.createElement('div');
    notification.className = 'extension-context-error';
    notification.innerHTML = `
      <div style="
        position: fixed; top: 20px; right: 20px; z-index: 10002;
        background: #f56565; color: white; padding: 12px 16px;
        border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px; max-width: 300px;
      ">
        ⚠️ Extension connection lost. Please reload the page to restore functionality.
        <div style="margin-top: 8px;">
          <button onclick="window.location.reload()" style="
            background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);
            padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;
          ">Reload Page</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 15 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 15000);
  },

  // Debug methods for Project Manager
  async debugSaveCurrentProject() {
    try {
      const currentProject = await this.getCurrentProject();
      if (!currentProject) {
        alert('No current project detected');
        return;
      }
      
      const projectManagerData = {
        project_id: currentProject.id,
        project_name: currentProject.name,
        project_url: currentProject.url,
        description: 'Auto-added for debugging',
        knowledge: ''
      };
      
      console.log('🔧 Debug: Saving current project:', projectManagerData);
      
      const response = await this.safeSendMessageWithRetry({
        action: 'saveProjectManager',
        data: projectManagerData
      });
      
      console.log('🔧 Debug: Save response:', response);
      
      if (response?.success) {
        alert('Project saved successfully! Refreshing project list...');
        this.loadProjectsList();
      } else {
        alert('Failed to save project: ' + (response?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('🔧 Debug: Error saving project:', error);
      alert('Error: ' + error.message);
    }
  },
  
  debugCurrentUrl() {
    const currentUrl = window.location.href;
    const urlMatch = currentUrl.match(/lovable\.dev\/projects\/([^/?]+)/);
    const projectTitle = document.title;
    const isUserProject = this.isUserOwnedProject();
    
    const info = `
      Current URL: ${currentUrl}
      URL Match: ${urlMatch ? urlMatch[1] : 'No match'}
      Page Title: ${projectTitle}
      Project Name: ${this.getProjectNameFromTitle()}
      Is User-Owned Project: ${isUserProject ? 'Yes' : 'No'}
      Send Button Found: ${document.getElementById('chatinput-send-message-button') ? 'Yes' : 'No'}
    `;
    
    console.log('🔧 Debug URL Info:', info);
    alert(info);
  },
  
  async testDatabaseTable() {
    try {
      console.log('🔧 Testing database table access...');
      
      // Test getAllProjectManagers
      const response = await this.safeSendMessageWithRetry({
        action: 'getAllProjectManagers'
      });
      
      console.log('🔧 Test response:', response);
      
      if (response?.success) {
        alert(`Database test successful!\nFound ${response.data?.length || 0} projects in database.`);
      } else {
        alert(`Database test failed:\n${response?.error || 'Unknown error'}\n\nCheck console for details.`);
      }
    } catch (error) {
      console.error('🔧 Database test error:', error);
      alert(`Database test error: ${error.message}`);
    }
  }
};