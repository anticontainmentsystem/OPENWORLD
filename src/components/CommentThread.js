/**
 * Comment Thread Component
 * Displays comments on a post and allows adding new comments with attachments
 */
import { commentsAPI } from '../services/github-data.js';
import { auth, fetchUserRepos, formatRelativeTime } from '../services/auth.js';
import { CodeEditor, LANGUAGES, createCodeBlock } from './code-editor.js';
import { GithubBrowser } from './GithubBrowser.js';

export class CommentThread {
  constructor(container, post, options = {}) {
    this.container = container;
    this.post = post;
    this.comments = Array.isArray(post.comments) ? post.comments : [];
    this.onCommentAdded = options.onCommentAdded || (() => {});
    
    // Attachment state
    this.currentAttachment = null;
    this.codeEditor = null;
    this.ghBrowser = null;
    this.userRepos = [];
    this.replyTo = null; // { id, username }
    
    this.render();
    this.bindEvents();
  }

  render() {
    const user = auth.getUser();
    
    // Sort logic (if needed) - current simplistic
    const topLevelComments = this.comments.filter(c => !c.parentId);
    
    const commentsHtml = topLevelComments.length > 0 
      ? topLevelComments.map(c => this.renderCommentChain(c)).join('')
      : '<p class="text-dim text-center" style="padding: var(--sp-3);">No comments yet</p>';

    this.container.innerHTML = `
      <div class="comment-thread">
        <div class="comment-thread__header">
          <span>💬 ${this.comments.length} Comment${this.comments.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="comment-thread__list" id="commentList">
          ${commentsHtml}
        </div>
        ${user ? `
          <div class="comment-thread__composer-wrap">
            <div id="replyingToBadge" class="replying-to-badge" style="display: none;">
              <span>Replying to <strong id="replyingToName"></strong></span>
              <button class="replying-to-close" id="cancelReply">×</button>
            </div>
            <div class="comment-thread__composer">
              <img src="${user.avatar}" alt="${user.username}" class="comment-thread__avatar">
              <div class="comment-thread__input-wrap">
                <input type="text" class="comment-thread__input" id="commentInput" placeholder="Add a comment..." maxlength="500">
                <button class="comment-thread__attach" id="attachBtn" title="Attach code or repo">📎</button>
              </div>
              <button class="btn btn--primary btn--sm" id="submitComment">Post</button>
            </div>
            <div class="comment-thread__attachments" id="attachPanel" style="display: none;">
              <div class="attach-tabs">
                <button class="attach-tab attach-tab--active" data-tab="code">💻 Code</button>
                <button class="attach-tab" data-tab="repo">📦 Repo</button>
              </div>
              <div class="attach-content" id="attachContent">
                <!-- Code Editor or Repo Browser will be injected here -->
              </div>
              <div class="attach-preview" id="attachPreview" style="display: none;">
                <!-- Preview of selected attachment -->
              </div>
            </div>
          </div>
        ` : `
          <div class="comment-thread__login">
            <button class="btn btn--outline btn--sm" id="loginToComment">Sign in to comment</button>
          </div>
        `}
      </div>
    `;
  }

  renderCommentChain(comment) {
    let html = this.renderComment(comment);
    
    // Find replies
    const replies = this.comments.filter(c => c.parentId === comment.id);
    if (replies.length > 0) {
      html += `<div class="comment-replies">`;
      html += replies.map(r => this.renderCommentChain(r)).join(''); // Recursive for deep nesting
      html += `</div>`;
    }
    return html;
  }

  renderComment(comment) {
    return `
      <div class="comment-item" data-comment-id="${comment.id}">
        <a href="/pillars/community/profile.html?user=${comment.username}" class="comment-item__avatar-link">
          <img src="${comment.userAvatar}" alt="${comment.username}" class="comment-item__avatar">
        </a>
        <div class="comment-item__body">
          <div class="comment-item__header">
            <a href="/pillars/community/profile.html?user=${comment.username}" class="comment-item__name">${comment.userName || comment.username}</a>
            <span class="comment-item__time">${formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p class="comment-item__content">${this.escapeHtml(comment.content)}</p>
          ${comment.attachments ? this.renderAttachments(comment.attachments) : ''}
          <div class="comment-actions">
            <button class="comment-action" data-reply-id="${comment.id}" data-reply-username="${comment.username}">Reply</button>
          </div>
        </div>
      </div>
    `;
  }

  renderAttachments(attachments) {
    if (!attachments) return '';
    
    let html = '';
    
    if (attachments.repo) {
      html += `
        <a href="${attachments.repo.url}" target="_blank" class="comment-attachment comment-attachment--repo">
          📦 ${attachments.repo.name}
        </a>
      `;
    }
    
    if (attachments.code) {
      html += `
        <div class="comment-attachment comment-attachment--code">
          <span class="code-lang">${attachments.code.language}</span>
          <pre><code>${this.escapeHtml(attachments.code.code.substring(0, 200))}${attachments.code.code.length > 200 ? '...' : ''}</code></pre>
        </div>
      `;
    }
    
    return html;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  bindEvents() {
    const input = this.container.querySelector('#commentInput');
    const submitBtn = this.container.querySelector('#submitComment');
    const loginBtn = this.container.querySelector('#loginToComment');
    const attachBtn = this.container.querySelector('#attachBtn');
    const attachPanel = this.container.querySelector('#attachPanel');

    if (submitBtn && input) {
      submitBtn.onclick = () => this.handleSubmit(input);
      input.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSubmit(input);
        }
      };
    }

    if (loginBtn) {
      loginBtn.onclick = () => auth.login();
    }

    // Attachment panel toggle
    if (attachBtn && attachPanel) {
      attachBtn.onclick = async () => {
        const isVisible = attachPanel.style.display !== 'none';
        attachPanel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
          // Initialize code editor by default
          this.showCodeTab();
        }
      };
    }

    // Tab switching
    this.container.querySelectorAll('.attach-tab').forEach(tab => {
      tab.onclick = () => {
        this.container.querySelectorAll('.attach-tab').forEach(t => t.classList.remove('attach-tab--active'));
        tab.classList.add('attach-tab--active');
        
        if (tab.dataset.tab === 'code') {
          this.showCodeTab();
        } else if (tab.dataset.tab === 'repo') {
          this.showRepoTab();
        }
      };
    });
    
    // Reply actions (delegation)
    const list = this.container.querySelector('#commentList');
    if (list) {
      list.onclick = (e) => {
        const btn = e.target.closest('[data-reply-id]');
        if (btn) {
          const id = btn.dataset.replyId;
          const username = btn.dataset.replyUsername;
          this.initiateReply(id, username);
        }
      };
    }
    
    // Cancel reply
    const cancelReply = this.container.querySelector('#cancelReply');
    if (cancelReply) {
      cancelReply.onclick = () => this.cancelReply();
    }
  }
  
  initiateReply(id, username) {
    this.replyTo = { id, username };
    const badge = this.container.querySelector('#replyingToBadge');
    const nameEl = this.container.querySelector('#replyingToName');
    const input = this.container.querySelector('#commentInput');
    
    if (badge && nameEl && input) {
      badge.style.display = 'flex';
      nameEl.textContent = `@${username}`;
      input.placeholder = `Replying to @${username}...`;
      input.focus();
    }
  }
  
  cancelReply() {
    this.replyTo = null;
    const badge = this.container.querySelector('#replyingToBadge');
    const input = this.container.querySelector('#commentInput');
    
    if (badge && input) {
      badge.style.display = 'none';
      input.placeholder = 'Add a comment...';
    }
  }

  showCodeTab() {
    const content = this.container.querySelector('#attachContent');
    content.innerHTML = `
      <div class="comment-code-wrap">
        <div class="comment-code-header">
          <select id="codeLang" class="comment-code-lang">
            ${LANGUAGES.map(lang => 
              `<option value="${lang.id}">${lang.name}</option>`
            ).join('')}
          </select>
          <button class="btn btn--sm" id="addCodeBtn">Add Code</button>
        </div>
        <div id="codeEditorMount" style="min-height: 100px;"></div>
      </div>
    `;

    const mount = content.querySelector('#codeEditorMount');
    this.codeEditor = new CodeEditor(mount, { minHeight: 100 });
    
    content.querySelector('#addCodeBtn').onclick = () => {
      const code = this.codeEditor.getValue();
      const lang = content.querySelector('#codeLang').value;
      
      if (code.trim()) {
        this.currentAttachment = {
          code: { code, language: lang }
        };
        this.showPreview();
      }
    };
  }

  async showRepoTab() {
    const content = this.container.querySelector('#attachContent');
    content.innerHTML = '<div class="text-dim text-center">Loading repos...</div>';
    
    // Load user repos if not loaded
    if (this.userRepos.length === 0) {
      this.userRepos = await fetchUserRepos();
    }
    
    content.innerHTML = '<div id="repoBrowserMount"></div>';
    const mount = content.querySelector('#repoBrowserMount');
    
    this.ghBrowser = new GithubBrowser(mount, this.userRepos, (selected) => {
      if (selected.type === 'repo') {
        this.currentAttachment = {
          repo: {
            name: selected.name,
            url: selected.html_url || `https://github.com/${selected.full_name}`,
            description: selected.description
          }
        };
        this.showPreview();
      }
    });
  }

  showPreview() {
    const preview = this.container.querySelector('#attachPreview');
    if (!this.currentAttachment) {
      preview.style.display = 'none';
      return;
    }

    let html = '<div class="attach-preview-content">';
    
    if (this.currentAttachment.code) {
      html += `
        <div class="attach-preview-item">
          <span class="code-lang">${this.currentAttachment.code.language}</span>
          <code>${this.escapeHtml(this.currentAttachment.code.code.substring(0, 50))}...</code>
          <button class="btn btn--sm btn--danger" id="removeAttach">✕</button>
        </div>
      `;
    }
    
    if (this.currentAttachment.repo) {
      html += `
        <div class="attach-preview-item">
          <span>📦 ${this.currentAttachment.repo.name}</span>
          <button class="btn btn--sm btn--danger" id="removeAttach">✕</button>
        </div>
      `;
    }
    
    html += '</div>';
    preview.innerHTML = html;
    preview.style.display = 'block';
    
    // Hide attachment panel, show preview
    this.container.querySelector('#attachPanel').style.display = 'none';
    
    preview.querySelector('#removeAttach').onclick = () => {
      this.currentAttachment = null;
      preview.style.display = 'none';
    };
  }

  handleSubmit(input) {
    const content = input.value.trim();
    if (!content && !this.currentAttachment) return;

    const token = auth.getAccessToken();
    if (!token) {
      auth.login();
      return;
    }

    const submitBtn = this.container.querySelector('#submitComment');
    submitBtn.disabled = true;
    submitBtn.textContent = '...';

    commentsAPI.add(
      this.post.id, 
      content, 
      this.currentAttachment, 
      token,
      this.replyTo ? this.replyTo.id : null
    ).then(newComment => {
      // Add to local list
      this.comments.push(newComment);
      
      // Re-render
      // Re-render full list to handle nesting
      this.render();
      this.bindEvents(); // Rebind since we nuked HTML
      
      // Update header count
      const header = this.container.querySelector('.comment-thread__header span');
      header.textContent = `💬 ${this.comments.length} Comment${this.comments.length !== 1 ? 's' : ''}`;
      
      // Clear input and attachment
      input.value = '';
      this.currentAttachment = null;
      this.container.querySelector('#attachPreview').style.display = 'none';
      this.closeAttachment(); // Close panel if open
      
      // Callback
      this.onCommentAdded(newComment);
    }).catch(error => {
      alert(error.message || 'Failed to add comment');
    }).finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post';
    });
  }

  closeAttachment() {
    const attachPanel = this.container.querySelector('#attachPanel');
    if (attachPanel) {
      attachPanel.style.display = 'none';
    }
  }
}

