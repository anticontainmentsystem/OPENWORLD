/**
 * OpenWorld Code Editor Component
 * Monaco-based code editor for posts
 */

import * as monaco from 'monaco-editor';

// Configure Monaco workers
self.MonacoEnvironment = {
  getWorker: function (workerId, label) {
    if (label === 'json') {
      return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url), { type: 'module' });
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url), { type: 'module' });
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new Worker(new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url), { type: 'module' });
    }
    if (label === 'typescript' || label === 'javascript') {
      return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url), { type: 'module' });
    }
    return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url), { type: 'module' });
  }
};

// Popular languages with display names
export const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'csharp', name: 'C#' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'php', name: 'PHP' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'scss', name: 'SCSS' },
  { id: 'json', name: 'JSON' },
  { id: 'yaml', name: 'YAML' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'sql', name: 'SQL' },
  { id: 'shell', name: 'Shell/Bash' },
  { id: 'powershell', name: 'PowerShell' },
  { id: 'dockerfile', name: 'Dockerfile' },
  { id: 'plaintext', name: 'Plain Text' }
];

/**
 * Code Editor Component
 */
export class CodeEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      language: 'javascript',
      theme: 'openworld-dark',
      ...options
    };
    this.editor = null;
    this.init();
  }

  init() {
    // Define custom theme
    monaco.editor.defineTheme('openworld-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'function', foreground: 'DCDCAA' }
      ],
      colors: {
        'editor.background': '#1a1a18',
        'editor.foreground': '#f5f5f0',
        'editor.lineHighlightBackground': '#2a2a28',
        'editor.selectionBackground': '#3a3a38',
        'editorCursor.foreground': '#b87333',
        'editorLineNumber.foreground': '#666',
        'editorLineNumber.activeForeground': '#b87333'
      }
    });

    // Create editor
    this.editor = monaco.editor.create(this.container, {
      value: this.options.value || '',
      language: this.options.language,
      theme: 'openworld-dark',
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      padding: { top: 12, bottom: 12 },
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8
      }
    });
  }

  getValue() {
    return this.editor?.getValue() || '';
  }

  setValue(value) {
    this.editor?.setValue(value);
  }

  setLanguage(languageId) {
    if (this.editor) {
      monaco.editor.setModelLanguage(this.editor.getModel(), languageId);
    }
  }

  getLanguage() {
    return this.editor?.getModel()?.getLanguageId() || 'plaintext';
  }

  dispose() {
    this.editor?.dispose();
  }

  focus() {
    this.editor?.focus();
  }
}

/**
 * Create a code block for display (read-only, syntax highlighted)
 */
export function createCodeBlock(code, language = 'plaintext') {
  const container = document.createElement('div');
  container.className = 'code-block';
  container.dataset.language = language;
  
  const header = document.createElement('div');
  header.className = 'code-block__header';
  header.innerHTML = `
    <span class="code-block__language">${LANGUAGES.find(l => l.id === language)?.name || language}</span>
    <button class="code-block__copy" title="Copy code">📋</button>
  `;
  
  const body = document.createElement('div');
  body.className = 'code-block__body';
  
  container.appendChild(header);
  container.appendChild(body);
  
  // Use Monaco for syntax highlighting (read-only)
  monaco.editor.create(body, {
    value: code,
    language: language,
    theme: 'openworld-dark',
    readOnly: true,
    minimap: { enabled: false },
    fontSize: 12,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    lineNumbers: 'off',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    padding: { top: 8, bottom: 8 },
    scrollbar: { vertical: 'hidden', horizontal: 'auto' },
    renderLineHighlight: 'none',
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    contextmenu: false,
    folding: false,
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 0
  });
  
  // Copy button
  header.querySelector('.code-block__copy').addEventListener('click', async () => {
    await navigator.clipboard.writeText(code);
    const btn = header.querySelector('.code-block__copy');
    btn.textContent = '✓';
    setTimeout(() => btn.textContent = '📋', 1500);
  });
  
  return container;
}
