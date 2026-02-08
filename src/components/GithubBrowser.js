/**
 * GithubBrowser.js
 * A premium, compact browser for GitHub Repos, Files, and Forks.
 * Replaces the simple repo picker with Deep Linking capabilities.
 */

import { auth } from '../services/auth.js';
import { reposAPI } from '../services/github-data.js';

export class GithubBrowser {
  constructor(container, userRepos = [], onSelect = () => {}, onClose = () => {}) {
    // Handle both new argument style and legacy options object
    if (container && container.constructor === Object && !container.nodeType) {
      const options = container;
      this.container = options.container;
      this.userRepos = options.userRepos || [];
      this.onSelect = options.onSelect || (() => {});
      this.onClose = options.onClose || (() => {});
    } else {
      this.container = container;
      this.userRepos = userRepos;
      this.onSelect = onSelect;
      this.onClose = onClose;
    }

    if (!this.container) {
      console.error('[GithubBrowser] No container provided!');
      return;
    }
    
    // State
    this.mode = 'repos'; // 'repos', 'files', 'forks'
    this.currentRepo = null;
    this.currentPath = '';
    this.history = []; // format: { repo, path, mode }
    
    this.render();
  }

  render() {
    if (!this.container) return;

    // Determine content based on mode
    let content = '';
    let headerTitle = 'Select Repository';
    let backButton = '';

    if (this.history.length > 0) {
      backButton = `<button class="gh-browser__back">← Back</button>`;
    }

    if (this.mode === 'repos') {
      content = this.renderRepoList();
      headerTitle = 'My Repositories';
    } else if (this.mode === 'files') {
      content = '<div class="gh-browser__loading">Loading files...</div>';
      // Safe check for owner to avoid error
      let owner = 'unknown';
      if (this.currentRepo && this.currentRepo.owner) {
        owner = this.currentRepo.owner.login || this.currentRepo.owner;
      }
      headerTitle = `${owner}/${this.currentRepo ? this.currentRepo.name : '...'}`;
      if (this.currentPath) headerTitle += `/${this.currentPath}`;
    } else if (this.mode === 'forks') {
      content = '<div class="gh-browser__loading">Loading forks...</div>';
      headerTitle = `Forks of ${this.currentRepo ? this.currentRepo.name : '...'}`;
    }

    this.container.innerHTML = `
      <div class="gh-browser">
        <header class="gh-browser__header">
          <div class="gh-browser__title">
            ${backButton}
            <span>${headerTitle}</span>
          </div>
          <div class="gh-browser__actions">
             ${this.mode === 'repos' ? `
               <div class="gh-browser__tabs">
                 <button class="gh-browser__tab gh-browser__tab--active" data-tab="my">My Repos</button>
                 <button class="gh-browser__tab" data-tab="search">Search</button>
               </div>
             ` : ''}
             <button class="gh-browser__close">×</button>
          </div>
        </header>

        ${this.mode === 'repos' ? `
           <div class="gh-browser__search-bar" style="display:none;">
             <input type="text" placeholder="Search GitHub..." class="gh-browser__input">
           </div>
        ` : ''}

        <div class="gh-browser__content">
          ${content}
        </div>
      </div>
    `;

    this.bindEvents();
    
    // Fetch async content if needed
    if (this.mode === 'files' && this.currentRepo) this.loadFiles();
    if (this.mode === 'forks' && this.currentRepo) this.loadForks();
  }

  renderRepoList() {
    if (this.userRepos.length === 0) return '<div class="gh-browser__empty">No repositories found.</div>';
    
    return this.userRepos.map(repo => {
      const ownerName = typeof repo.owner === 'string' ? repo.owner : repo.owner?.login || '';
      return `
        <div class="gh-item" data-repo-json='${JSON.stringify(repo).replace(/'/g, "&#39;")}'>
          <div class="gh-item__info">
            <span class="gh-item__icon">📦</span>
            <span class="gh-item__name">${repo.name}</span>
          </div>
          <div class="gh-item__desc">${repo.description ? repo.description.substring(0, 60) + '...' : ''}</div>
          <div class="gh-item__actions">
            <button class="gh-btn" data-action="browse">📂 Browse</button>
            <button class="gh-btn gh-btn--primary" data-action="select">Attach</button>
          </div>
        </div>
      `;
    }).join('');
  }

  async loadFiles() {
    const contentEl = this.container.querySelector('.gh-browser__content');
    const token = auth.getUser()?.accessToken;
    
    if (!token) {
      contentEl.innerHTML = '<div class="gh-browser__error">Authentication required</div>';
      return;
    }

    // Handle owner as string or object
    const ownerName = typeof this.currentRepo.owner === 'string' 
      ? this.currentRepo.owner 
      : this.currentRepo.owner?.login || this.currentRepo.full_name?.split('/')[0];
    
    if (!ownerName) {
      contentEl.innerHTML = '<div class="gh-browser__error">Unable to determine repository owner</div>';
      return;
    }

    const items = await reposAPI.getContents(
      ownerName, 
      this.currentRepo.name, 
      this.currentPath, 
      token
    );

    if (!Array.isArray(items)) {
       contentEl.innerHTML = '<div class="gh-browser__error">Failed to load contents</div>';
       return;
    }

    // Sort: Folders first
    items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'dir' ? -1 : 1;
    });

    contentEl.innerHTML = items.map(item => `
      <div class="gh-item" data-item='${JSON.stringify(item).replace(/'/g, "&#39;")}' data-type="${item.type}">
        <div class="gh-item__icon">${item.type === 'dir' ? '📁' : '📄'}</div>
        <div class="gh-item__details">
          <div class="gh-item__name">${item.name}</div>
        </div>
        <div class="gh-item__actions">
          ${item.type === 'dir' 
            ? `<button class="gh-btn gh-btn--sm" data-action="dive">Open</button>` 
            : `<button class="gh-btn gh-btn--sm gh-btn--primary" data-action="select-file">Select</button>`
          }
        </div>
      </div>
    `).join('');
    
    this.bindContentEvents();
  }

  async loadForks() {
    const contentEl = this.container.querySelector('.gh-browser__content');
    const token = auth.getUser()?.accessToken;
    
    if (!token) {
      contentEl.innerHTML = '<div class="gh-browser__error">Authentication required</div>';
      return;
    }

    const ownerName = typeof this.currentRepo.owner === 'string' 
      ? this.currentRepo.owner 
      : this.currentRepo.owner?.login || this.currentRepo.full_name?.split('/')[0];

    const forks = await reposAPI.getForks(
      ownerName, 
      this.currentRepo.name, 
      token
    );

    if (forks.length === 0) {
       contentEl.innerHTML = '<div class="gh-browser__empty">No forks found.</div>';
       return;
    }

    contentEl.innerHTML = forks.map(fork => `
      <div class="gh-item" data-repo-json='${JSON.stringify(fork).replace(/'/g, "&#39;")}' style="opacity: 0.8;">
        <div class="gh-item__icon">🍴</div>
        <div class="gh-item__details">
          <div class="gh-item__name">${fork.owner} / ${fork.name}</div>
          <div class="gh-item__desc">Updated ${new Date(fork.updated_at).toLocaleDateString()}</div>
        </div>
        <div class="gh-item__actions">
          <button class="gh-btn gh-btn--sm" data-action="browse">📂 Browse</button>
        </div>
      </div>
    `).join('');
    
    // Bind events so we can browse the fork too!
    this.bindContentEvents();
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
        
        const isSearch = e.target.dataset.tab === 'search';
        const searchBar = container.querySelector('.gh-browser__search-bar');
        const contentEl = container.querySelector('.gh-browser__content');
        
        searchBar.style.display = isSearch ? 'block' : 'none';
        
        if (isSearch) {
          contentEl.innerHTML = '<div class="gh-browser__empty">Type to search...</div>';
          searchBar.querySelector('input').focus();
        } else {
          contentEl.innerHTML = this.renderRepoList();
          this.bindContentEvents(); 
        }
      });
    });

    // Search Input
    let searchTimeout;
    const searchInput = container.querySelector('.gh-browser__input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        const contentEl = container.querySelector('.gh-browser__content');
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
          contentEl.innerHTML = '<div class="gh-browser__empty">Type at least 2 characters...</div>';
          return;
        }
        
        contentEl.innerHTML = '<div class="gh-browser__loading">Searching...</div>';
        
        searchTimeout = setTimeout(async () => {
          const token = auth.getUser()?.accessToken;
          const results = await reposAPI.search(query, token);
          
          if (results.length === 0) {
            contentEl.innerHTML = '<div class="gh-browser__empty">No repositories found.</div>';
          } else {
            // Render results using the same render function but maybe passing the list?
            // Since renderRepoList uses this.userRepos, we should make it accept a list.
            // For now, I'll essentially inline the render logic or temporarily override userRepos? 
            // Better: create a helper renderItems(list)
            
            contentEl.innerHTML = results.map(repo => `
              <div class="gh-item" data-repo-json='${JSON.stringify(repo).replace(/'/g, "&#39;")}'>
                <div class="gh-item__icon">📦</div>
                <div class="gh-item__details">
                  <div class="gh-item__name">${repo.name}</div>
                  <div class="gh-item__desc">${repo.owner.login} • ${repo.stars} ⭐</div>
                </div>
                <div class="gh-item__actions">
                  <button class="gh-btn gh-btn--sm" data-action="browse">📂 Browse</button>
                  <button class="gh-btn gh-btn--sm gh-btn--primary" data-action="select">Attach</button>
                </div>
              </div>
            `).join('');
            
            this.bindContentEvents();
          }
        }, 500);
      });
    }

    // Back
    const backBtn = container.querySelector('.gh-browser__back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.goBack());
    }
    
    this.bindContentEvents();
  }

  bindContentEvents() {
    this.container.querySelectorAll('.gh-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Find the closest button or if the item itself was clicked
        const btn = e.target.closest('.gh-btn');
        const action = btn ? btn.dataset.action : null;
        
        if (!action) return;
        
        // Proper JSON parse with error handling
        let repoData = null;
        let fileData = null;
        
        try {
            if (item.dataset.repoJson) {
                // Handle both single and double quote replacements if needed
                repoData = JSON.parse(item.dataset.repoJson.replace(/&#39;/g, "'"));
            }
            if (item.dataset.item) {
                fileData = JSON.parse(item.dataset.item.replace(/&#39;/g, "'"));
            }
        } catch (err) {
            console.error('Error parsing data attributes:', err);
            return;
        }

        if (action === 'select') {
          // Add owner if missing (sometimes just string)
          if (repoData) {
              if (typeof repoData.owner === 'string') {
                  repoData.owner = { login: repoData.owner };
              } else if (!repoData.owner && repoData.full_name) {
                  repoData.owner = { login: repoData.full_name.split('/')[0] };
              }
          }
          this.onSelect({ type: 'repo', data: repoData });
        } else if (action === 'browse') {
          // Ensure we have a valid repo object before navigating
          if (repoData) {
             if (!repoData.owner) {
                 if (repoData.full_name) {
                     repoData.owner = { login: repoData.full_name.split('/')[0] };
                 } else {
                     repoData.owner = { login: 'unknown' }; 
                 }
             } else if (typeof repoData.owner === 'string') {
                 repoData.owner = { login: repoData.owner };
             }
             this.navigateTo(repoData, '', 'files');
          }
        } else if (action === 'dive') {
          this.navigateTo(this.currentRepo, fileData.path, 'files');
        } else if (action === 'select-file') {
          this.onSelect({ type: 'file', repo: this.currentRepo, data: fileData });
        }
      });
    });
  }

  navigateTo(repo, path, mode) {
    this.history.push({ 
      repo: this.currentRepo, 
      path: this.currentPath, 
      mode: this.mode 
    });
    
    this.currentRepo = repo;
    this.currentPath = path;
    this.mode = mode;
    this.render();
  }

  goBack() {
    const prevState = this.history.pop();
    if (prevState) {
      this.currentRepo = prevState.repo;
      this.currentPath = prevState.path;
      this.mode = prevState.mode;
      this.render();
    }
  }
}
