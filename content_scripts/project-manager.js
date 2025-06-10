// ===========================
// PROJECT MANAGER - EXTRACTED MODULE
// ===========================
// This section handles all project management functionality including:
// - Project detection and auto-save (NEW FEATURE)
// - Project list display and management
// - Project settings interface
// - Database integration for project data
// - Debug and testing utilities
// 
// Key Feature: Auto-save functionality that saves project info on page load
// without requiring user to click "Save Settings" button

// Create ProjectManager class that will be mixed into LovableDetector
window.ProjectManager = {
  showProjectManager() {
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
            padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;
          ">← Back to Welcome</button>
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
    this.loadProjectsList();
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
            padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;
          ">← Back to Projects</button>
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
    try {
      console.log('🔍 Loading projects list...');
      
      const currentProject = await this.getCurrentProject();
      console.log('🔍 Current project detected:', currentProject);
      
      const savedProjects = await this.getSavedProjects();
      console.log('🔍 Saved projects from database:', savedProjects);
      
      const projectListElement = document.getElementById('project-list');
      if (!projectListElement) {
        console.warn('❌ Project list element not found');
        return;
      }
      
      projectListElement.innerHTML = '';
      
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
              No projects found. ${currentProject ? 'Current project detected but not in database.' : 'Not on a Lovable project page or project not detected.'}
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
      console.error('❌ Error loading projects list:', error);
      
      // Show error state
      const projectListElement = document.getElementById('project-list');
      if (projectListElement) {
        projectListElement.innerHTML = `
          <div style="
            background: #fed7d7; border: 1px solid #f56565; border-radius: 8px; padding: 20px;
            text-align: center; color: #c53030;
          ">
            <p style="margin: 0; font-size: 14px;">
              Error loading projects: ${error.message}
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
        ${isCurrent ? '<div style="background: #48bb78; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: 500;">Current</div>' : ''}
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
        const response = await this.safeSendMessage({
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
        try {
          const projectManagerData = {
            project_id: projectId,
            project_name: projectName,
            project_url: currentUrl,
            description: currentProject.description,
            knowledge: currentProject.knowledge
          };
          
          const saveResponse = await this.safeSendMessage({
            action: 'saveProjectManager',
            data: projectManagerData
          });
          
          if (saveResponse?.success) {
            console.log('✅ Project information auto-saved successfully');
          } else {
            console.warn('⚠️ Failed to auto-save project information:', saveResponse?.error);
          }
        } catch (error) {
          console.warn('⚠️ Error auto-saving project information:', error);
        }
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
   * AUTO-SAVE PROJECT INFORMATION
   * 
   * Automatically saves project name and URL to database when page loads.
   * This is triggered 2 seconds after page detection to ensure page is fully loaded.
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
      console.log('🚀 Auto-saving project information on page load...');
      const currentProject = await this.getCurrentProject();
      
      if (currentProject) {
        console.log('✅ Project information auto-saved on page load:', currentProject.name);
      } else {
        console.log('❌ No project information found to auto-save');
      }
    } catch (error) {
      console.warn('⚠️ Error during auto-save on page load:', error);
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

  async getSavedProjects() {
    try {
      console.log('🔍 Fetching all saved projects from database...');
      const response = await this.safeSendMessage({
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
      
      const response = await this.safeSendMessage({
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
      
      const response = await this.safeSendMessage({
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
    
    const info = `
      Current URL: ${currentUrl}
      URL Match: ${urlMatch ? urlMatch[1] : 'No match'}
      Page Title: ${projectTitle}
      Project Name: ${this.getProjectNameFromTitle()}
    `;
    
    console.log('🔧 Debug URL Info:', info);
    alert(info);
  },
  
  async testDatabaseTable() {
    try {
      console.log('🔧 Testing database table access...');
      
      // Test getAllProjectManagers
      const response = await this.safeSendMessage({
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