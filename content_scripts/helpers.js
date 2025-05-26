// Shared Helper Functions for Lovable Assistant
// These utilities are used across multiple components

class LovableHelpers {
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static formatMessage(content) {
    return content
      .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre style="background: #f8fafc; border: 1px solid #c9cfd7; border-radius: 8px; padding: 10px; margin: 16px 0; overflow-x: auto; font-family: 'SF Mono', Monaco, monospace; font-size: 13px; line-height: 1.5; color: #1a202c;"><code>${LovableHelpers.escapeHtml(code.trim())}</code></pre>`;
      })
      .replace(/`([^`\n]+)`/g, '<code style="background: #f1f5f9; color: #d63384; padding: 3px 6px; border-radius: 4px; font-family: \'SF Mono\', Monaco, monospace; font-size: 0.9em;">$1</code>')
      .replace(/^### (.*$)/gm, '<h3 style="font-size: 18px; font-weight: 600; margin: 20px 0 8px 0; color: #1a202c;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 20px; font-weight: 600; margin: 24px 0 12px 0; color: #1a202c;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 24px; font-weight: 700; margin: 24px 0 16px 0; color: #1a202c;">$1</h1>')
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong style="font-weight: 600;"><em style="font-style: italic;">$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
      .replace(/~~(.*?)~~/g, '<del style="text-decoration: line-through; color: #718096;">$1</del>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #3182ce; text-decoration: underline;">$1</a>')
      .replace(/^> (.*$)/gm, '<blockquote style="border-left: 4px solid #3182ce; margin: 16px 0; padding: 12px 20px; background: #f7fafc; font-style: italic; color: #4a5568; border-radius: 0 6px 6px 0;">$1</blockquote>')
      .replace(/^---+$/gm, '<hr style="border: none; border-top: 2px solid #c9cfd7; margin: 24px 0;">')
      .replace(/^[-*+] (.+)$/gm, '<li style="margin: 6px 0; padding-left: 8px;">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li style="margin: 6px 0; padding-left: 8px;">$1</li>')
      .replace(/(<li[^>]*>.*?<\/li>(?:\s*<li[^>]*>.*?<\/li>)*)/gs, '<ul style="margin: 12px 0; padding-left: 24px; list-style-type: disc; color: #2d3748;">$1</ul>')
      .replace(/\n\s*\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(?!<[^>]+>)(.+?)(?=<|$)/gm, '<p style="margin: 12px 0; line-height: 1.6;">$1</p>')
      .replace(/<p[^>]*>\s*<\/p>/g, '');
  }

  static formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  static extractProjectId(url = window.location.href) {
    if (!url) return null;
    const match = url.match(/\/projects\/([^\/\?]+)/);
    return match ? match[1] : null;
  }
  static extractProjectName() {
    // Try to get project name from the page
    const nameElement = document.querySelector('p.hidden.truncate.text-sm.font-medium.md\\:block');
    if (nameElement && nameElement.textContent.trim()) {
      return nameElement.textContent.trim();
    }
    
    // Fallback: try other common selectors
    const fallbackSelectors = [
      'h1[data-testid="project-name"]',
      '.project-name',
      'h1',
      'title'
    ];
    
    for (const selector of fallbackSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const text = element.textContent.trim();
        if (text !== 'Lovable' && text.length > 0) {
          return text;
        }
      }
    }
    
    return LovableHelpers.extractProjectId() || 'Unknown Project';
  }

  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static async safeSendMessage(message) {
    try {
      console.log('🔍 Helper: Sending message to background:', {
        action: message.action,
        dataId: message.data?.id,
        dataKeys: message.data ? Object.keys(message.data) : []
      });
      
      const response = await chrome.runtime.sendMessage(message);
      
      console.log('🔍 Helper: Received response from background:', {
        success: response?.success,
        error: response?.error,
        hasData: !!response?.data
      });
      
      return response;
    } catch (error) {
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.warn('⚠️ Extension context invalidated - background communication unavailable');
        return { success: false, error: 'Extension context invalidated' };
      }
      
      if (error.message && error.message.includes('receiving end does not exist')) {
        console.warn('⚠️ Background script not available');
        return { success: false, error: 'Background script not available' };
      }
      
      console.error('❌ Chrome runtime message error:', error);
      return { success: false, error: error.message };
    }
  }
  static extractProjectName() {
    // Try to get project name from the page
    const nameElement = document.querySelector('p.hidden.truncate.text-sm.font-medium.md\\:block');
    if (nameElement && nameElement.textContent.trim()) {
      return nameElement.textContent.trim();
    }
    
    // Fallback: try other common selectors
    const fallbackSelectors = [
      'h1[data-testid="project-name"]',
      '.project-name',
      'h1',
      'title'
    ];
    
    for (const selector of fallbackSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const text = element.textContent.trim();
        if (text !== 'Lovable' && text.length > 0) {
          return text;
        }
      }
    }
    
    return LovableHelpers.extractProjectId() || 'Unknown Project';
  }

  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  static async safeSendMessage(message) {
    try {
      const response = await chrome.runtime.sendMessage(message);
      return response;
    } catch (error) {
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.warn('⚠️ Extension context invalidated');
        return { success: false, error: 'Extension context invalidated' };
      }
      
      if (error.message && error.message.includes('receiving end does not exist')) {
        console.warn('⚠️ Background script not available');
        return { success: false, error: 'Background script not available' };
      }
      
      console.error('❌ Chrome runtime message error:', error);
      return { success: false, error: error.message };
    }
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  static makeDraggable(dialogEl, dragHandle) {
    if (!dialogEl || !dragHandle) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    dragHandle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      if (e.target.id === 'close-btn') return;
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      let newTop = dialogEl.offsetTop - pos2;
      let newLeft = dialogEl.offsetLeft - pos1;
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - dialogEl.offsetHeight));
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - dialogEl.offsetWidth));
      dialogEl.style.top = newTop + "px";
      dialogEl.style.left = newLeft + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
  static addScrollbarStyles() {
    if (!document.getElementById('chat-styles')) {
      const style = document.createElement('style');
      style.id = 'chat-styles';
      style.textContent = `
        #lovable-assistant-dialog *::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        #lovable-assistant-dialog *::-webkit-scrollbar-track {
          background: transparent;
        }
        #lovable-assistant-dialog *::-webkit-scrollbar-thumb {
          background: rgba(203, 213, 224, 0.6);
          border-radius: 2px;
        }
        #lovable-assistant-dialog *::-webkit-scrollbar-thumb:hover {
          background: rgba(160, 174, 192, 0.8);
        }
        @keyframes pulse { 0%, 60%, 100% { opacity: 0.4; transform: scale(1); } 30% { opacity: 1; transform: scale(1.2); } }
      `;
      document.head.appendChild(style);
    }
  }
}

// Make helpers globally available
window.LovableHelpers = LovableHelpers;

console.log('✅ Lovable Helpers loaded');
