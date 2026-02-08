/**
 * Comment Thread Component
 * Displays comments on a post and allows adding new comments
 */
import { commentsAPI } from '../services/github-data.js';
import { auth, formatRelativeTime } from '../services/auth.js';

export class CommentThread {
  constructor(container, post, options = {}) {
    this.container = container;
    this.post = post;
    this.comments = post.comments || [];
    this.onCommentAdded = options.onCommentAdded || (() => {});
    this.render();
    this.bindEvents();
  }

  render() {
    const user = auth.getUser();
    const commentsHtml = this.comments.length > 0 
      ? this.comments.map(c => this.renderComment(c)).join('')
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
          <div class="comment-thread__composer">
            <img src="${user.avatar}" alt="${user.username}" class="comment-thread__avatar">
            <div class="comment-thread__input-wrap">
              <input type="text" class="comment-thread__input" id="commentInput" placeholder="Add a comment..." maxlength="500">
              <button class="comment-thread__attach" id="attachBtn" title="Attach code or repo">📎</button>
            </div>
            <button class="btn btn--primary btn--sm" id="submitComment">Post</button>
          </div>
          <div class="comment-thread__attachments" id="attachPanel" style="display: none;">
            <small class="text-dim">Attachments coming soon!</small>
          </div>
        ` : `
          <div class="comment-thread__login">
            <button class="btn btn--outline btn--sm" id="loginToComment">Sign in to comment</button>
          </div>
        `}
      </div>
    `;
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
  }

  async handleSubmit(input) {
    const content = input.value.trim();
    if (!content) return;

    const token = auth.getAccessToken();
    if (!token) {
      auth.login();
      return;
    }

    const submitBtn = this.container.querySelector('#submitComment');
    submitBtn.disabled = true;
    submitBtn.textContent = '...';

    try {
      const newComment = await commentsAPI.add(this.post.id, content, null, token);
      
      // Add to local list
      this.comments.push(newComment);
      
      // Re-render
      const list = this.container.querySelector('#commentList');
      const emptyMsg = list.querySelector('.text-dim');
      if (emptyMsg) emptyMsg.remove();
      
      list.insertAdjacentHTML('beforeend', this.renderComment(newComment));
      
      // Update header count
      const header = this.container.querySelector('.comment-thread__header span');
      header.textContent = `💬 ${this.comments.length} Comment${this.comments.length !== 1 ? 's' : ''}`;
      
      // Clear input
      input.value = '';
      
      // Callback
      this.onCommentAdded(newComment);
      
    } catch (error) {
      alert(error.message || 'Failed to add comment');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post';
    }
  }
}
