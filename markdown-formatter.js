// Enhanced Markdown Formatter for Claude-like formatting
class MarkdownFormatter {
  static format(content) {
    return content
      // Code blocks with language syntax highlighting
      .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre style="
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          overflow-x: auto;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          color: #1a202c;
        "><code${lang ? ` class="language-${lang}"` : ''}>${MarkdownFormatter.escapeHtml(code.trim())}</code></pre>`;
      })
      
      // Inline code
      .replace(/`([^`\n]+)`/g, '<code style="background: #f1f5f9; color: #d63384; padding: 3px 6px; border-radius: 4px; font-family: \'SF Mono\', Monaco, monospace; font-size: 0.9em;">$1</code>')
      
      // Headers
      .replace(/^### (.*$)/gm, '<h3 style="font-size: 18px; font-weight: 600; margin: 20px 0 8px 0; color: #1a202c; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 20px; font-weight: 600; margin: 24px 0 12px 0; color: #1a202c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 24px; font-weight: 700; margin: 24px 0 16px 0; color: #1a202c; border-bottom: 3px solid #3182ce; padding-bottom: 8px;">$1</h1>')
      
      // Bold, italic, and combinations
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong style="font-weight: 600;"><em style="font-style: italic;">$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
      .replace(/__(.*?)__/g, '<strong style="font-weight: 600;">$1</strong>')
      .replace(/_(.*?)_/g, '<em style="font-style: italic;">$1</em>')
      
      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del style="text-decoration: line-through; color: #718096;">$1</del>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #3182ce; text-decoration: underline; cursor: pointer;">$1</a>')
      
      // Blockquotes
      .replace(/^> (.*$)/gm, function(match, content) {
        return `<blockquote style="
          border-left: 4px solid #3182ce;
          margin: 16px 0;
          padding: 12px 20px;
          background: #f7fafc;
          font-style: italic;
          color: #4a5568;
          border-radius: 0 6px 6px 0;
        ">${content}</blockquote>`;
      })
      
      // Horizontal rules
      .replace(/^---+$/gm, '<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 24px 0; border-radius: 1px;">')
      
      // Process lists
      .replace(/^(\s*)[-*+] (.+)$/gm, function(match, indent, item) {
        const level = Math.floor(indent.length / 2);
        return `<li data-level="${level}" style="margin: 6px 0; padding-left: 8px; list-style-type: disc;">${item}</li>`;
      })
      
      .replace(/^(\s*)(\d+)\. (.+)$/gm, function(match, indent, num, item) {
        const level = Math.floor(indent.length / 2);
        return `<li data-level="${level}" data-ordered="true" style="margin: 6px 0; padding-left: 8px;">${item}</li>`;
      });
      
    // Post-process to wrap consecutive list items
    let result = MarkdownFormatter.wrapLists(content);
    
    // Line breaks and paragraphs
    result = result
      .replace(/\n\s*\n/g, '</p><p style="margin: 16px 0; line-height: 1.6; color: #2d3748;">')
      .replace(/\n/g, '<br>')
      .replace(/^(?!<[^>]+>)(.+?)(?=<|$)/gm, '<p style="margin: 16px 0; line-height: 1.6; color: #2d3748;">$1</p>')
      .replace(/<p[^>]*>\s*<\/p>/g, '');
    
    return result;
  }

  static wrapLists(content) {
    // Simple list wrapping - this could be enhanced for nested lists
    return content.replace(/(<li[^>]*>.*?<\/li>(?:\s*<li[^>]*>.*?<\/li>)*)/gs, function(match) {
      const hasOrdered = match.includes('data-ordered="true"');
      const tag = hasOrdered ? 'ol' : 'ul';
      const listStyle = hasOrdered ? 'decimal' : 'disc';
      
      return `<${tag} style="
        margin: 12px 0;
        padding-left: 24px;
        list-style-type: ${listStyle};
        color: #2d3748;
      ">${match}</${tag}>`;
    });
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}