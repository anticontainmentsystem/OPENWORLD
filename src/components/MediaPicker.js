/**
 * MediaPicker.js
 * A tabbed interface for selecting media from URL, Repos, or Search.
 */
import { GithubBrowser } from './GithubBrowser.js';
import { auth, fetchUserRepos } from '../services/auth.js';

export class MediaPicker {
  constructor(container, options = {}) {
    this.container = container; 
    this.onSelect = options.onSelect || (() => {});
    this.onClose = options.onClose || (() => {});
    this.userRepos = [];
    
    this.render();
  }

  async render() {
    this.container.innerHTML = `
      <div class="media-picker-modal">
        <div class="media-picker-content">
          <header class="media-picker-header">
            <h3>Add Media</h3>
            <button class="media-picker-close">×</button>
          </header>
          
          <div class="media-picker-tabs">
            <button class="media-tab media-tab--active" data-tab="url">🔗 Link</button>
            <button class="media-tab" data-tab="repos">📦 My Repos</button>
            <button class="media-tab" data-tab="search">🔍 Search</button>
          </div>
          
          <div class="media-picker-body">
            <!-- URL Tab -->
            <div id="media-tab-url" class="media-tab-content" style="display: block;">
              <div class="form-group">
                <label>Media URL (Image, Video, GIF)</label>
                <input type="text" id="mediaUrlInput" placeholder="https://..." class="form-input">
              </div>
              <div class="form-group">
                <label>Type</label>
                <select id="mediaTypeInput" class="form-select">
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="gif">GIF</option>
                </select>
              </div>
              <div id="mediaPreview" class="media-preview-box">
                <span class="text-dim">Preview will appear here...</span>
              </div>
              <button class="btn btn--primary" id="addMediaUrlBtn" disabled>Add Media</button>
            </div>

            <!-- Repos Tab -->
            <div id="media-tab-repos" class="media-tab-content" style="display: none;">
              <div id="repoBrowserMount">Loading...</div>
            </div>

            <!-- Search Tab -->
            <div id="media-tab-search" class="media-tab-content" style="display: none;">
              <div class="text-center text-dim" style="padding: 20px;">
                Use the search tab in the browser to find repositories with media.
              </div>
              <!-- Re-use repo browser mount but switch mode? or separate mount? -->
              <!-- For simplicity, let's just use one browser instance and switch its tabs/mode -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.bindEvents();
  }
  
  bindEvents() {
    const closeBtn = this.container.querySelector('.media-picker-close');
    closeBtn.onclick = () => this.onClose();
    
    // Tabs
    const tabs = this.container.querySelectorAll('.media-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('media-tab--active'));
        tab.classList.add('media-tab--active');
        
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      };
    });
    
    // URL Input Logic
    const urlInput = this.container.querySelector('#mediaUrlInput');
    const typeInput = this.container.querySelector('#mediaTypeInput');
    const previewBox = this.container.querySelector('#mediaPreview');
    const addBtn = this.container.querySelector('#addMediaUrlBtn');
    
    const checkUrl = () => {
      const url = urlInput.value.trim();
      if (!url) {
        addBtn.disabled = true;
        previewBox.innerHTML = '<span class="text-dim">Preview will appear here...</span>';
        return;
      }
      
      const type = typeInput.value;
      addBtn.disabled = false;
      
      if (type === 'image' || type === 'gif') {
        previewBox.innerHTML = `<img src="${url}" style="max-width: 100%; max-height: 200px; border-radius: 4px;">`;
      } else if (type === 'video') {
         previewBox.innerHTML = `<video src="${url}" controls style="max-width: 100%; max-height: 200px; border-radius: 4px;"></video>`;
      }
      
      // Auto-detect type from extension if possible
      if (url.match(/\.(mp4|webm|mov)$/i)) typeInput.value = 'video';
      else if (url.match(/\.(gif)$/i)) typeInput.value = 'gif';
      else if (url.match(/\.(jpg|jpeg|png|webp|svg)$/i)) typeInput.value = 'image';
    };
    
    urlInput.oninput = checkUrl;
    typeInput.onchange = checkUrl;
    
    addBtn.onclick = () => {
      this.onSelect({
        type: typeInput.value,
        url: urlInput.value.trim()
      });
    };
  }
  
  async switchTab(tabName) {
    this.container.querySelectorAll('.media-tab-content').forEach(el => el.style.display = 'none');
    this.container.querySelector(`#media-tab-${tabName === 'search' ? 'repos' : tabName}`).style.display = 'block';
    
    if (tabName === 'repos' || tabName === 'search') {
      const mount = this.container.querySelector('#repoBrowserMount');
      mount.innerHTML = '';
      
      if (this.userRepos.length === 0) {
        this.userRepos = await fetchUserRepos();
      }
      
      // Initialize GithubBrowser
      new GithubBrowser({
        container: mount,
        userRepos: this.userRepos,
        onSelect: (selection) => this.handleRepoSelection(selection),
        onClose: () => {}, // Hide close button inside browser?
        fileFilter: (item) => {
           // Basic media extension filter
           return /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i.test(item.name);
        }
      });
      
      // If search tab, try to trigger search mode in browser?
      // For now, users can click "Search" tab inside the browser component itself.
      // Or we can pre-select the tab.
    }
  }
  
  handleRepoSelection(selection) {
    if (selection.type === 'file') {
      const file = selection.data;
      const repo = selection.repo;
      
      // Construct raw URL (using jsdelivr or raw.githubusercontent)
      // raw.githubusercontent.com/:owner/:repo/:branch/:path
      // We don't have branch easily, assume 'main' or 'master' usually... 
      // safer to use the 'download_url' from API if available?
      
      const rawUrl = file.download_url;
      const type = /\.(mp4|webm|mov)$/i.test(file.name) ? 'video' : /\.(gif)$/i.test(file.name) ? 'gif' : 'image';
      
      this.onSelect({
        type: type,
        url: rawUrl,
        repoRef: {
          owner: repo.owner.login || repo.owner,
          repo: repo.name,
          path: file.path
        }
      });
    }
  }
}
