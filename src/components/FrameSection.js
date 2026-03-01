/**
 * FrameSection Component
 * Renders section content within a frame detail page
 * Supports: discussion, resources, faq
 */
import { frameThreadsAPI, frameResourcesAPI } from '../services/frames-data.js';
import { auth } from '../services/auth.js';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export class FrameSection {
  constructor(container, section, frameId, options = {}) {
    this.container = container;
    this.section = section;
    this.frameId = frameId;
    this.isCreator = options.isCreator || false;
    this.onUpdate = options.onUpdate || (() => {});
    this.expandedThread = null;

    this.render();
  }

  render() {
    const s = this.section;
    const user = auth.getUser();

    if (s.type === 'discussion') {
      this.renderDiscussion(s, user);
    } else if (s.type === 'resources') {
      this.renderResources(s, user);
    } else if (s.type === 'faq') {
      this.renderFaq(s, user);
    }
  }

  // ── Discussion ──

  renderDiscussion(section, user) {
    const threads = (section.threads || []).filter(t => !t.deleted);
    const pinned = threads.filter(t => t.pinned);
    const unpinned = threads.filter(t => !t.pinned);
    const sorted = [...pinned, ...unpinned];

    this.container.innerHTML = `
      <div class="frame-section frame-section--discussion">
        <div class="frame-section__header">
          <h3>${escapeHtml(section.title)}</h3>
          <span class="frame-section__count">${threads.length} thread${threads.length !== 1 ? 's' : ''}</span>
        </div>
        ${user ? `
          <div class="frame-section__composer">
            <input type="text" class="form-input" id="newThreadTitle_${section.id}" placeholder="Start a new thread..." maxlength="150">
            <textarea class="form-input form-textarea" id="newThreadContent_${section.id}" placeholder="What's on your mind?" rows="2" maxlength="5000" style="display: none;"></textarea>
            <button class="btn btn--primary btn--sm" id="postThread_${section.id}" style="display: none;">Post Thread</button>
          </div>
        ` : ''}
        <div class="frame-section__list" id="threadList_${section.id}">
          ${sorted.length > 0 ? sorted.map(t => this.renderThread(t, section.id)).join('') : '<p class="text-dim text-sm">No threads yet. Start the conversation.</p>'}
        </div>
      </div>
    `;

    this.bindDiscussionEvents(section, user);
  }

  renderThread(thread, sectionId) {
    const replyCount = (thread.replies || []).filter(r => !r.deleted).length;
    const isExpanded = this.expandedThread === thread.id;

    return `
      <div class="thread-item${thread.pinned ? ' thread-item--pinned' : ''}${thread.locked ? ' thread-item--locked' : ''}" data-thread-id="${thread.id}" data-section-id="${sectionId}">
        <div class="thread-item__main" data-toggle-thread="${thread.id}">
          <div class="thread-item__header">
            ${thread.pinned ? '<span class="thread-badge thread-badge--pin">📌</span>' : ''}
            ${thread.locked ? '<span class="thread-badge thread-badge--lock">🔒</span>' : ''}
            <img src="${thread.authorAvatar}" alt="${thread.authorUsername}" class="thread-item__avatar">
            <strong class="thread-item__author">${escapeHtml(thread.authorUsername)}</strong>
            <span class="thread-item__time">${timeAgo(thread.createdAt)}</span>
          </div>
          <h4 class="thread-item__title">${escapeHtml(thread.title)}</h4>
          <p class="thread-item__preview">${escapeHtml(thread.content.substring(0, 200))}${thread.content.length > 200 ? '...' : ''}</p>
          <span class="thread-item__replies">${replyCount} repl${replyCount !== 1 ? 'ies' : 'y'}</span>
        </div>
        ${isExpanded ? this.renderExpandedThread(thread, sectionId) : ''}
      </div>
    `;
  }

  renderExpandedThread(thread, sectionId) {
    const user = auth.getUser();
    const replies = (thread.replies || []).filter(r => !r.deleted);

    return `
      <div class="thread-expanded">
        <div class="thread-expanded__content">${escapeHtml(thread.content)}</div>
        ${this.isCreator ? `
          <div class="thread-expanded__actions">
            <button class="btn btn--sm btn--outline" data-action="pin" data-thread-id="${thread.id}" data-section-id="${sectionId}">${thread.pinned ? 'Unpin' : 'Pin'}</button>
            <button class="btn btn--sm btn--outline" data-action="lock" data-thread-id="${thread.id}" data-section-id="${sectionId}">${thread.locked ? 'Unlock' : 'Lock'}</button>
            <button class="btn btn--sm btn--danger" data-action="delete-thread" data-thread-id="${thread.id}" data-section-id="${sectionId}">Delete</button>
          </div>
        ` : ''}
        <div class="thread-replies">
          ${replies.map(r => `
            <div class="reply-item" data-reply-id="${r.id}">
              <img src="${r.authorAvatar}" alt="${r.authorUsername}" class="reply-item__avatar">
              <div class="reply-item__body">
                <div class="reply-item__header">
                  <strong>${escapeHtml(r.authorUsername)}</strong>
                  <span class="reply-item__time">${timeAgo(r.createdAt)}</span>
                </div>
                <p>${escapeHtml(r.content)}</p>
              </div>
            </div>
          `).join('')}
        </div>
        ${user && !thread.locked ? `
          <div class="thread-reply-composer">
            <input type="text" class="form-input" id="replyInput_${thread.id}" placeholder="Write a reply..." maxlength="3000">
            <button class="btn btn--primary btn--sm" id="replyBtn_${thread.id}">Reply</button>
          </div>
        ` : ''}
        ${thread.locked ? '<p class="text-dim text-sm">This thread is locked.</p>' : ''}
      </div>
    `;
  }

  bindDiscussionEvents(section, user) {
    // Show content textarea on title focus
    const titleInput = this.container.querySelector(`#newThreadTitle_${section.id}`);
    const contentInput = this.container.querySelector(`#newThreadContent_${section.id}`);
    const postBtn = this.container.querySelector(`#postThread_${section.id}`);

    if (titleInput) {
      titleInput.onfocus = () => {
        contentInput.style.display = 'block';
        postBtn.style.display = 'inline-flex';
      };
    }

    // Post thread
    if (postBtn) {
      postBtn.onclick = () => this.handleCreateThread(section.id);
    }

    // Thread toggles and actions (delegation)
    this.container.addEventListener('click', (e) => {
      // Toggle thread expand
      const toggle = e.target.closest('[data-toggle-thread]');
      if (toggle) {
        const threadId = toggle.dataset.toggleThread;
        this.expandedThread = this.expandedThread === threadId ? null : threadId;
        this.render();
        return;
      }

      // Creator actions
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const threadId = actionBtn.dataset.threadId;
        const sId = actionBtn.dataset.sectionId;

        if (action === 'pin') this.handlePin(sId, threadId);
        else if (action === 'lock') this.handleLock(sId, threadId);
        else if (action === 'delete-thread') this.handleDeleteThread(sId, threadId);
        return;
      }

      // Reply button
      const replyBtn = e.target.closest('[id^="replyBtn_"]');
      if (replyBtn) {
        const threadId = replyBtn.id.replace('replyBtn_', '');
        this.handleReply(section.id, threadId);
      }
    });
  }

  async handleCreateThread(sectionId) {
    const titleEl = this.container.querySelector(`#newThreadTitle_${sectionId}`);
    const contentEl = this.container.querySelector(`#newThreadContent_${sectionId}`);
    const title = titleEl.value.trim();
    const content = contentEl.value.trim();

    if (!title || title.length < 2) return;
    if (!content || content.length < 1) return;

    try {
      const result = await frameThreadsAPI.create(this.frameId, sectionId, title, content);
      this.section.threads.unshift(result.thread);
      this.render();
      this.onUpdate();
    } catch (err) {
      alert(err.message);
    }
  }

  async handleReply(sectionId, threadId) {
    const input = this.container.querySelector(`#replyInput_${threadId}`);
    const content = input?.value.trim();
    if (!content) return;

    try {
      const result = await frameThreadsAPI.reply(this.frameId, sectionId, threadId, content);
      const thread = this.section.threads.find(t => t.id === threadId);
      if (thread) {
        if (!thread.replies) thread.replies = [];
        thread.replies.push(result.reply);
      }
      this.render();
      this.onUpdate();
    } catch (err) {
      alert(err.message);
    }
  }

  async handlePin(sectionId, threadId) {
    try {
      const result = await frameThreadsAPI.pin(this.frameId, sectionId, threadId);
      const thread = this.section.threads.find(t => t.id === threadId);
      if (thread) thread.pinned = result.pinned;
      this.render();
    } catch (err) {
      alert(err.message);
    }
  }

  async handleLock(sectionId, threadId) {
    try {
      const result = await frameThreadsAPI.lock(this.frameId, sectionId, threadId);
      const thread = this.section.threads.find(t => t.id === threadId);
      if (thread) thread.locked = result.locked;
      this.render();
    } catch (err) {
      alert(err.message);
    }
  }

  async handleDeleteThread(sectionId, threadId) {
    if (!confirm('Delete this thread?')) return;
    try {
      await frameThreadsAPI.deleteThread(this.frameId, sectionId, threadId);
      const thread = this.section.threads.find(t => t.id === threadId);
      if (thread) thread.deleted = true;
      this.expandedThread = null;
      this.render();
      this.onUpdate();
    } catch (err) {
      alert(err.message);
    }
  }

  // ── Resources ──

  renderResources(section, user) {
    const resources = (section.resources || []).filter(r => !r.deleted);

    this.container.innerHTML = `
      <div class="frame-section frame-section--resources">
        <div class="frame-section__header">
          <h3>${escapeHtml(section.title)}</h3>
          <span class="frame-section__count">${resources.length} resource${resources.length !== 1 ? 's' : ''}</span>
        </div>
        ${user ? `
          <div class="frame-section__composer resource-composer">
            <input type="text" class="form-input" id="resTitle_${section.id}" placeholder="Resource title" maxlength="150">
            <input type="url" class="form-input" id="resUrl_${section.id}" placeholder="https://...">
            <input type="text" class="form-input" id="resDesc_${section.id}" placeholder="Short description (optional)" maxlength="300">
            <button class="btn btn--primary btn--sm" id="addRes_${section.id}">Add Resource</button>
          </div>
        ` : ''}
        <div class="frame-section__list">
          ${resources.length > 0 ? resources.map(r => `
            <div class="resource-item">
              <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" class="resource-item__link">
                <strong>${escapeHtml(r.title)}</strong>
                ${r.description ? `<p class="resource-item__desc">${escapeHtml(r.description)}</p>` : ''}
              </a>
              <div class="resource-item__meta">
                <span>by ${escapeHtml(r.addedBy)}</span>
                <span>${timeAgo(r.addedAt)}</span>
                ${this.isCreator || (user && String(user.id) === String(r.addedById)) ? `<button class="btn btn--sm btn--danger" data-remove-resource="${r.id}" data-section-id="${section.id}">×</button>` : ''}
              </div>
            </div>
          `).join('') : '<p class="text-dim text-sm">No resources yet. Share something useful.</p>'}
        </div>
      </div>
    `;

    this.bindResourceEvents(section);
  }

  bindResourceEvents(section) {
    const addBtn = this.container.querySelector(`#addRes_${section.id}`);
    if (addBtn) {
      addBtn.onclick = () => this.handleAddResource(section.id);
    }

    this.container.querySelectorAll('[data-remove-resource]').forEach(btn => {
      btn.onclick = () => this.handleRemoveResource(btn.dataset.sectionId, btn.dataset.removeResource);
    });
  }

  async handleAddResource(sectionId) {
    const title = this.container.querySelector(`#resTitle_${sectionId}`).value.trim();
    const url = this.container.querySelector(`#resUrl_${sectionId}`).value.trim();
    const description = this.container.querySelector(`#resDesc_${sectionId}`).value.trim();

    if (!title || !url) return;

    try {
      const result = await frameResourcesAPI.addResource(this.frameId, sectionId, title, url, description);
      if (!this.section.resources) this.section.resources = [];
      this.section.resources.push(result.resource);
      this.render();
      this.onUpdate();
    } catch (err) {
      alert(err.message);
    }
  }

  async handleRemoveResource(sectionId, itemId) {
    if (!confirm('Remove this resource?')) return;
    try {
      await frameResourcesAPI.removeResource(this.frameId, sectionId, itemId);
      const res = this.section.resources?.find(r => r.id === itemId);
      if (res) res.deleted = true;
      this.render();
    } catch (err) {
      alert(err.message);
    }
  }

  // ── FAQ ──

  renderFaq(section, user) {
    const items = (section.items || []).filter(f => !f.deleted);

    this.container.innerHTML = `
      <div class="frame-section frame-section--faq">
        <div class="frame-section__header">
          <h3>${escapeHtml(section.title)}</h3>
          <span class="frame-section__count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
        </div>
        ${user ? `
          <div class="frame-section__composer faq-composer">
            <input type="text" class="form-input" id="faqQ_${section.id}" placeholder="Question?" maxlength="300">
            <textarea class="form-input form-textarea" id="faqA_${section.id}" placeholder="Answer" rows="2" maxlength="3000"></textarea>
            <button class="btn btn--primary btn--sm" id="addFaq_${section.id}">Add FAQ</button>
          </div>
        ` : ''}
        <div class="frame-section__list">
          ${items.length > 0 ? items.map(f => `
            <details class="faq-item">
              <summary class="faq-item__question">
                <span>${escapeHtml(f.question)}</span>
                ${this.isCreator || (user && String(user.id) === String(f.addedById)) ? `<button class="btn btn--sm btn--danger faq-remove" data-remove-faq="${f.id}" data-section-id="${section.id}">×</button>` : ''}
              </summary>
              <div class="faq-item__answer">
                <p>${escapeHtml(f.answer)}</p>
                <span class="faq-item__meta">by ${escapeHtml(f.addedBy)} · ${timeAgo(f.addedAt)}</span>
              </div>
            </details>
          `).join('') : '<p class="text-dim text-sm">No FAQ items yet.</p>'}
        </div>
      </div>
    `;

    this.bindFaqEvents(section);
  }

  bindFaqEvents(section) {
    const addBtn = this.container.querySelector(`#addFaq_${section.id}`);
    if (addBtn) {
      addBtn.onclick = () => this.handleAddFaq(section.id);
    }

    this.container.querySelectorAll('[data-remove-faq]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.handleRemoveFaq(btn.dataset.sectionId, btn.dataset.removeFaq);
      };
    });
  }

  async handleAddFaq(sectionId) {
    const question = this.container.querySelector(`#faqQ_${sectionId}`).value.trim();
    const answer = this.container.querySelector(`#faqA_${sectionId}`).value.trim();

    if (!question || !answer) return;

    try {
      const result = await frameResourcesAPI.addFaq(this.frameId, sectionId, question, answer);
      if (!this.section.items) this.section.items = [];
      this.section.items.push(result.faq);
      this.render();
      this.onUpdate();
    } catch (err) {
      alert(err.message);
    }
  }

  async handleRemoveFaq(sectionId, itemId) {
    if (!confirm('Remove this FAQ item?')) return;
    try {
      await frameResourcesAPI.removeFaq(this.frameId, sectionId, itemId);
      const faq = this.section.items?.find(f => f.id === itemId);
      if (faq) faq.deleted = true;
      this.render();
    } catch (err) {
      alert(err.message);
    }
  }
}
