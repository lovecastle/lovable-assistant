// Popup Script for Lovable Assistant Chrome Extension
let currentProject = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check connection status on load
  checkConnectionStatus();
  
  // Load current project info
  await loadCurrentProject();
  
  // Navigation event listeners
  setupNavigation();
  
  // Open settings button
  document.getElementById('open-settings').addEventListener('click', async () => {
    // Get the active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on a Lovable.dev project page
    if (activeTab.url && activeTab.url.includes('lovable.dev/projects/')) {
      // Send message to content script to open settings
      chrome.tabs.sendMessage(activeTab.id, { 
        action: 'openAssistantSettings' 
      });
      window.close();
    } else {
      // Show message that user needs to be on Lovable.dev
      updateStatus('Please navigate to a Lovable.dev project page first', true);
    }
  });
  
  // Check connection button
  document.getElementById('check-connection').addEventListener('click', async () => {
    updateStatus('Checking connection...', false);
    await checkConnectionStatus();
  });
  
  // Project Manager button
  document.getElementById('project-manager').addEventListener('click', () => {
    showPage('project-manager-page');
    loadProjectList();
  });
  
  // Save project settings button
  document.getElementById('save-project-settings').addEventListener('click', async () => {
    await saveProjectSettings();
  });
});

async function checkConnectionStatus() {
  try {
    // Check if API keys are configured
    const config = await chrome.storage.sync.get([
      'aiProvider', 'claudeApiKey', 'openaiApiKey', 'geminiApiKey', 
      'supabaseProjectId', 'supabaseKey'
    ]);
    
    const provider = config.aiProvider || 'claude';
    let hasApiKey = false;
    
    switch (provider) {
      case 'claude':
        hasApiKey = !!config.claudeApiKey;
        break;
      case 'openai':
        hasApiKey = !!config.openaiApiKey;
        break;
      case 'gemini':
        hasApiKey = !!config.geminiApiKey;
        break;
    }
    
    if (!hasApiKey || !config.supabaseProjectId || !config.supabaseKey) {
      updateStatus('API keys not configured', true);
      return;
    }
    
    // Test the connection
    const response = await chrome.runtime.sendMessage({ action: 'testConnection' });
    
    if (response && response.success) {
      const providerName = provider === 'claude' ? 'Claude' : provider === 'openai' ? 'OpenAI' : 'Gemini';
      updateStatus(`Connected with ${providerName}`, false);
    } else {
      updateStatus('Connection failed', true);
    }
  } catch (error) {
    updateStatus('Error checking connection', true);
  }
}

function updateStatus(text, isError) {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  
  statusDot.className = 'status-dot' + (isError ? ' error' : '');
  statusText.textContent = text;
}

// Navigation functions
function setupNavigation() {
  document.getElementById('back-to-main').addEventListener('click', () => {
    showPage('main-page');
  });
  
  document.getElementById('back-to-projects').addEventListener('click', () => {
    showPage('project-manager-page');
  });
}

function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show selected page
  document.getElementById(pageId).classList.add('active');
}

// Project management functions
async function loadCurrentProject() {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (activeTab.url && activeTab.url.includes('lovable.dev/projects/')) {
      const urlMatch = activeTab.url.match(/lovable\.dev\/projects\/([^/?]+)/);
      if (urlMatch) {
        const projectId = urlMatch[1];
        currentProject = {
          id: projectId,
          name: await getProjectNameFromTab(activeTab),
          url: activeTab.url,
          description: '',
          knowledge: ''
        };
        
        // Load saved project data if it exists
        const savedProjects = await chrome.storage.local.get('lovable_projects');
        if (savedProjects.lovable_projects && savedProjects.lovable_projects[projectId]) {
          Object.assign(currentProject, savedProjects.lovable_projects[projectId]);
        }
      }
    }
  } catch (error) {
    console.error('Error loading current project:', error);
  }
}

async function getProjectNameFromTab(tab) {
  try {
    // Extract project name from page title or URL
    if (tab.title && tab.title.includes('Lovable')) {
      const titleMatch = tab.title.match(/(.+?)\s*[-|]\s*Lovable/);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
    }
    
    // Fallback to project ID from URL
    const urlMatch = tab.url.match(/lovable\.dev\/projects\/([^/?]+)/);
    return urlMatch ? urlMatch[1] : 'Unknown Project';
  } catch (error) {
    return 'Unknown Project';
  }
}

async function loadProjectList() {
  try {
    const savedProjects = await chrome.storage.local.get('lovable_projects');
    const projects = savedProjects.lovable_projects || {};
    
    const projectListElement = document.getElementById('project-list');
    projectListElement.innerHTML = '';
    
    // Add current project first if it exists
    if (currentProject) {
      const currentProjectElement = createProjectElement(currentProject, true);
      projectListElement.appendChild(currentProjectElement);
    }
    
    // Add other projects
    Object.values(projects).forEach(project => {
      if (!currentProject || project.id !== currentProject.id) {
        const projectElement = createProjectElement(project, false);
        projectListElement.appendChild(projectElement);
      }
    });
    
    // If no projects, show empty state
    if (projectListElement.children.length === 0) {
      projectListElement.innerHTML = `
        <div class="info-box">
          <p>No projects found. Visit Lovable.dev project pages to start tracking projects.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading project list:', error);
  }
}

function createProjectElement(project, isCurrent) {
  const projectDiv = document.createElement('div');
  projectDiv.className = `project-item${isCurrent ? ' current' : ''}`;
  
  projectDiv.innerHTML = `
    <div class="project-header">
      <div class="platform-logo">L</div>
      <div class="project-name">${project.name}</div>
      ${isCurrent ? '<div class="current-badge">Current</div>' : ''}
    </div>
    <div class="project-url">${project.url}</div>
    <div class="project-description">${project.description || 'No description provided'}</div>
  `;
  
  projectDiv.addEventListener('click', () => {
    if (isCurrent) {
      // Open project settings for current project
      showProjectSettings(project);
    } else {
      // Open project in new tab
      chrome.tabs.create({ url: project.url });
    }
  });
  
  return projectDiv;
}

function showProjectSettings(project) {
  // Populate form with project data
  document.getElementById('project-name').value = project.name;
  document.getElementById('project-url').value = project.url;
  document.getElementById('project-description').value = project.description || '';
  document.getElementById('project-knowledge').value = project.knowledge || '';
  
  showPage('project-settings-page');
}

async function saveProjectSettings() {
  if (!currentProject) {
    updateStatus('No current project to save', true);
    return;
  }
  
  try {
    // Get form values
    const description = document.getElementById('project-description').value;
    const knowledge = document.getElementById('project-knowledge').value;
    
    // Update current project
    currentProject.description = description;
    currentProject.knowledge = knowledge;
    
    // Save to storage
    const savedProjects = await chrome.storage.local.get('lovable_projects');
    const projects = savedProjects.lovable_projects || {};
    projects[currentProject.id] = currentProject;
    
    await chrome.storage.local.set({ lovable_projects: projects });
    
    // Show success message
    updateStatus('Project settings saved successfully', false);
    
    // Go back to project manager after a short delay
    setTimeout(() => {
      showPage('project-manager-page');
      loadProjectList();
    }, 1500);
  } catch (error) {
    console.error('Error saving project settings:', error);
    updateStatus('Error saving project settings', true);
  }
}