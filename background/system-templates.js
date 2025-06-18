// System Prompt Templates - Built into Extension
// These templates are available to all users without requiring a master database

export const SYSTEM_TEMPLATES = [
  {
    id: 'code-review-helper',
    name: 'Code Review Helper',
    description: 'Helps with code review and suggestions',
    template_content: `Please review this code and provide suggestions for improvement:

{code}

Focus on:
- Code quality and best practices
- Performance optimizations
- Security considerations
- Readability and maintainability`,
    category: 'coding',
    is_system: true,
    version: '1.0.0'
  },
  {
    id: 'bug-fix-assistant',
    name: 'Bug Fix Assistant',
    description: 'Assists with debugging and fixing issues',
    template_content: `I'm encountering this error/issue:

{error}

In this code:
{code}

Can you help me identify the problem and suggest a fix?`,
    category: 'debugging',
    is_system: true,
    version: '1.0.0'
  },
  {
    id: 'feature-planning',
    name: 'Feature Planning',
    description: 'Helps plan new features and functionality',
    template_content: `I want to implement the following feature:

{feature_description}

Can you help me:
1. Break down the requirements
2. Suggest the technical approach
3. Identify potential challenges
4. Recommend best practices`,
    category: 'planning',
    is_system: true,
    version: '1.0.0'
  },
  {
    id: 'ui-ux-review',
    name: 'UI/UX Review',
    description: 'Provides feedback on user interface and experience',
    template_content: `Please review this UI/UX design:

{design_description}

Provide feedback on:
- User experience flow
- Accessibility considerations
- Visual design principles
- Mobile responsiveness`,
    category: 'design',
    is_system: true,
    version: '1.0.0'
  },
  {
    id: 'api-integration',
    name: 'API Integration Helper',
    description: 'Assists with API integration and troubleshooting',
    template_content: `I need help with this API integration:

API: {api_name}
Endpoint: {endpoint}
Method: {method}

Issue/Question:
{issue_description}

Expected behavior:
{expected_behavior}

Current result:
{current_result}

Can you help me troubleshoot and implement this correctly?`,
    category: 'integration',
    is_system: true,
    version: '1.0.0'
  },
  {
    id: 'performance-optimization',
    name: 'Performance Optimization',
    description: 'Helps identify and fix performance issues',
    template_content: `I'm experiencing performance issues with:

{component_or_feature}

Current performance metrics:
{current_metrics}

Specific issues:
- {issue_1}
- {issue_2}
- {issue_3}

Can you help me identify bottlenecks and suggest optimizations?`,
    category: 'optimization',
    is_system: true,
    version: '1.0.0'
  },
  {
    id: 'database-design',
    name: 'Database Design Helper',
    description: 'Assists with database schema design and optimization',
    template_content: `I need help designing a database for:

{project_description}

Requirements:
- {requirement_1}
- {requirement_2}
- {requirement_3}

Current considerations:
{current_thoughts}

Can you help me design an efficient database schema and suggest best practices?`,
    category: 'database',
    is_system: true,
    version: '1.0.0'
  },
  {
    id: 'testing-strategy',
    name: 'Testing Strategy',
    description: 'Helps create comprehensive testing plans',
    template_content: `I need to create tests for:

{feature_or_component}

Requirements:
{requirements}

Current implementation:
{implementation_details}

Can you help me create a comprehensive testing strategy including:
- Unit tests
- Integration tests
- Edge cases to consider
- Testing tools recommendations`,
    category: 'testing',
    is_system: true,
    version: '1.0.0'
  }
];

export function getSystemTemplates() {
  return SYSTEM_TEMPLATES;
}

export function getSystemTemplate(id) {
  return SYSTEM_TEMPLATES.find(template => template.id === id);
}

export function getSystemTemplatesByCategory(category) {
  return SYSTEM_TEMPLATES.filter(template => template.category === category);
}

export function getSystemTemplateCategories() {
  const categories = [...new Set(SYSTEM_TEMPLATES.map(template => template.category))];
  return categories.sort();
}

// Function to fetch latest templates from a remote source (optional)
export async function fetchLatestSystemTemplates() {
  try {
    // This could point to a simple JSON file hosted on your domain
    // const response = await fetch('https://your-domain.com/api/system-templates.json');
    // const templates = await response.json();
    
    // For now, return built-in templates
    console.log('📥 Using built-in system templates');
    return SYSTEM_TEMPLATES;
  } catch (error) {
    console.log('📥 Using built-in templates (fetch failed):', error.message);
    return SYSTEM_TEMPLATES;
  }
}

// Template versioning and updates
export function checkTemplateUpdates(userTemplates) {
  const updates = [];
  
  SYSTEM_TEMPLATES.forEach(systemTemplate => {
    const userTemplate = userTemplates.find(t => t.id === systemTemplate.id);
    
    if (!userTemplate) {
      updates.push({
        type: 'new',
        template: systemTemplate
      });
    } else if (userTemplate.version !== systemTemplate.version) {
      updates.push({
        type: 'updated',
        template: systemTemplate,
        oldVersion: userTemplate.version,
        newVersion: systemTemplate.version
      });
    }
  });
  
  return updates;
}