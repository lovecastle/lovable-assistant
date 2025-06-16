// Enhanced Markdown Formatter for Claude-like formatting
class MarkdownFormatter {
  static format(content) {
    return content
      // Code blocks with language syntax highlighting
      .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        return `<code${lang ? ` class="language-${lang}"` : ''}>${MarkdownFormatter.escapeHtml(code.trim())}</code>`;
      })
      
      // Inline code
      .replace(/`([^`\n]+)`/g, '<code style="background: #f1f5f9; color: #d63384; padding: 3px 6px; border-radius: 4px; font-family: \'SF Mono\', Monaco, monospace; font-size: 0.9em;">$1</code>')
      
      // Headers
      .replace(/^### (.*$)/gm, '<h3 style="font-size: 18px; font-weight: 600; margin: 12px 0 4px 0; color: #1a202c; border-bottom: 1px solid #c9cfd7; padding-bottom: 4px;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 20px; font-weight: 600; margin: 16px 0 8px 0; color: #1a202c; border-bottom: 2px solid #c9cfd7; padding-bottom: 6px;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 24px; font-weight: 700; margin: 20px 0 12px 0; color: #1a202c; border-bottom: 3px solid #3182ce; padding-bottom: 8px;">$1</h1>')
      
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
          margin: 8px 0;
          padding: 8px 16px;
          background: #f7fafc;
          font-style: italic;
          color: #4a5568;
          border-radius: 0 6px 6px 0;
        ">${content}</blockquote>`;
      })
      
      // Horizontal rules
      .replace(/^---+$/gm, '<hr style="border: none; border-top: 2px solid #c9cfd7; margin: 8px 0; border-radius: 1px;">')
      
      // Lists
      .replace(/^(\s*)[-*+] (.+)$/gm, '<li style="margin: 4px 0;">$2</li>')
      .replace(/^(\s*)(\d+)\. (.+)$/gm, '<li style="margin: 4px 0;">$3</li>')
      
      // Line breaks and paragraphs
      .replace(/\n\s*\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(?!<[^>]+>)(.+?)(?=<|$)/gm, '<p>$1</p>')
      .replace(/<p>\s*<\/p>/g, ''); // Remove empty paragraphs
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}