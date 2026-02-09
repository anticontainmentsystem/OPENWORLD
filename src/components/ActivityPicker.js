/**
 * ActivityPicker.js
 * Select GitHub activities (Commits, Issues, PRs) to attach to posts.
 */

import { auth } from '../services/auth.js';
import { usersAPI } from '../services/github-data.js';
import { formatRelativeTime } from '../services/auth.js';

export class ActivityPicker {
  constructor(container, options = {}) {
    this.container = container;
    this.onSelect = options.onSelect || (() => {});
    this.onClose = options.onClose || (() => {});
    this.mode = 'all'; // all, commits, issues, prs
    
    this.events = [];
    this.loading = false;
    
    this.init();
  }

  async init() {
    this.render();
    this.loadEvents();
  }

  async loadEvents() {
    this.loading = true;
    this.renderContent();
    
    try {
      const user = auth.getUser();
      if (!user) throw new Error('Not logged in');
      
      this.events = await usersAPI.getEvents(user.username, user.accessToken);
    } catch (e) {
      console.error('Failed to load events:', e);
      this.events = [];
    } finally {
      this.loading = false;
      this.renderContent();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="gh-browser" style="position: relative; top: auto; left: auto; right: auto; width: 600px; max-width: 90%; margin: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <header class="gh-browser__header">
          <div class="gh-browser__title">
            <span>Select Activity</span>
          </div>
          <div class="gh-browser__actions">
             <div class="gh-browser__tabs">
               <button class="gh-browser__tab gh-browser__tab--active" data-tab="all">All</button>
               <button class="gh-browser__tab" data-tab="PushEvent">Commits</button>
               <button class="gh-browser__tab" data-tab="IssuesEvent">Issues</button>
               <button class="gh-browser__tab" data-tab="PullRequestEvent">PRs</button>
             </div>
             <button class="gh-browser__close">×</button>
          </div>
        </header>

        <div class="gh-browser__content">
          <!-- Content goes here -->
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderContent() {
    const contentEl = this.container.querySelector('.gh-browser__content');
    if (!contentEl) return;

    if (this.loading) {
      contentEl.innerHTML = '<div class="gh-browser__loading">Loading activity...</div>';
      return;
    }

    if (this.events.length === 0) {
      contentEl.innerHTML = '<div class="gh-browser__empty">No recent activity found.</div>';
      return;
    }

    // Filter
    const filtered = this.mode === 'all' 
      ? this.events.filter(e => ['PushEvent', 'IssuesEvent', 'PullRequestEvent'].includes(e.type))
      : this.events.filter(e => e.type === this.mode);

    if (filtered.length === 0) {
      contentEl.innerHTML = '<div class="gh-browser__empty">No matching activity found.</div>';
      return;
    }

    contentEl.innerHTML = filtered.map(e => this.renderEventItem(e)).join('');
    
    this.bindContentEvents();
  }

  renderEventItem(e) {
    let icon = '📝';
    let title = 'Activity';
    let desc = '';
    let action = 'Select';
    let payloadData = null;

    if (e.type === 'PushEvent') {
       icon = '📝';
       title = `Pushed to ${e.repo.name}`;
       const commits = e.payload.commits || [];
       const count = commits.length;
       desc = `${count} commit${count===1?'':'s'}: ${commits[0]?.message || 'No message'}`;
       payloadData = {
           type: 'commit',
           repo: e.repo,
           commit: commits[0] || {}, 
           head: e.payload.head
       };
    } else if (e.type === 'IssuesEvent') {
       icon = '🐛';
       title = `${e.payload.action} issue in ${e.repo.name}`;
       desc = `#${e.payload.issue.number}: ${e.payload.issue.title}`;
       payloadData = {
           type: 'issue',
           repo: e.repo,
           issue: e.payload.issue
       };
    } else if (e.type === 'PullRequestEvent') {
       icon = '🔀';
       title = `${e.payload.action} PR in ${e.repo.name}`;
       desc = `#${e.payload.pull_request.number}: ${e.payload.pull_request.title}`;
       payloadData = {
           type: 'pr',
           repo: e.repo,
           pr: e.payload.pull_request
       };
    }

    return `
      <div class="gh-item" data-payload='${JSON.stringify(payloadData).replace(/'/g, "&#39;")}'>
        <div class="gh-item__icon">${icon}</div>
        <div class="gh-item__details">
          <div class="gh-item__name">${title}</div>
          <div class="gh-item__desc">${desc}</div>
          <div class="gh-item__meta text-dim text-xs">${formatRelativeTime(e.created_at)}</div>
        </div>
        <div class="gh-item__actions">
          <button class="gh-btn gh-btn--sm gh-btn--primary" data-action="select">${action}</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const container = this.container.querySelector('.gh-browser');
    
    // Close
    container.querySelector('.gh-browser__close').addEventListener('click', () => this.onClose());

    // Tabs
    const tabs = container.querySelectorAll('.gh-browser__tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('gh-browser__tab--active'));
        e.target.classList.add('gh-browser__tab--active');
        this.mode = e.target.dataset.tab;
        this.renderContent();
      });
    });
  }

  bindContentEvents() {
    this.container.querySelectorAll('.gh-btn[data-action="select"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.gh-item');
        try {
           const payload = JSON.parse(item.dataset.payload.replace(/&#39;/g, "'"));
           this.onSelect(payload);
        } catch(err) {
           console.error('Selection error', err);
        }
      });
    });
  }
}
