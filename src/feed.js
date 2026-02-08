/**
 * OpenWorld Feed
 * Real post creation with GitHub repo attachment and code blocks
 */

import { auth, posts, fetchUserRepos, formatRelativeTime } from './services/auth.js';
import { CodeEditor, LANGUAGES, createCodeBlock } from './components/code-editor.js';
import { CommentThread } from './components/CommentThread.js';

// Add comment styles
const commentStyles = document.createElement('link');
commentStyles.rel = 'stylesheet';
commentStyles.href = '/src/styles/comment.css';
document.head.appendChild(commentStyles);

// DOM Elements
const userBadge = document.getElementById('userBadge');
const composer = document.getElementById('composer');
const loginPrompt = document.getElementById('loginPrompt');
const feedPosts = document.getElementById('feedPosts');
const suggestions = document.getElementById('suggestions');
const userStats = document.getElementById('userStats');

let userRepos = [];
let selectedRepo = null;
let selectedCode = null; // { code: string, language: string }
let codeEditor = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  await loadAndRenderPosts();
  setupEventListeners();
});

async function loadAndRenderPosts() {
  feedPosts.innerHTML = `
    <div class="card" style="text-align: center; padding: var(--sp-5);">
      <div style="font-size: 1.5rem; margin-bottom: var(--sp-2);">⏳</div>
      <p class="text-dim">Loading posts...</p>
    </div>
  `;
  
  await posts.loadPosts();
  renderPosts();
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH HANDLING
// ═══════════════════════════════════════════════════════════════════════════

function initAuth() {
  auth.subscribe(updateAuthUI);
  updateAuthUI(auth.getUser());
}

async function updateAuthUI(user) {
  if (user) {
    renderUserBadge(user);
    composer.style.display = 'block';
    loginPrompt.style.display = 'none';
    userStats.style.display = 'block';
    
    document.getElementById('composerAvatar').src = user.avatar;
    document.getElementById('statFollowing').textContent = user.following || 0;
    document.getElementById('statPosts').textContent = posts.getPostsByUser(user.id).length;
    
    // Load repos for picker
    userRepos = await fetchUserRepos();
    if (userRepos.length === 0 && user.repos) {
      userRepos = user.repos;
    }
    renderSuggestions(user);
  } else {
    renderLoginButton();
    composer.style.display = 'none';
    loginPrompt.style.display = 'block';
    userStats.style.display = 'none';
    renderSuggestions(null);
  }
}

function renderUserBadge(user) {
  userBadge.innerHTML = `
    <button class="user-badge__trigger" id="userBadgeTrigger">
      <img src="${user.avatar}" alt="${user.name}" class="user-badge__avatar">
      <span class="user-badge__name">${user.username}</span>
    </button>
    <div class="user-badge__dropdown">
      <div class="user-badge__dropdown-header">
        <div class="user-badge__dropdown-name">${user.name}</div>
        <div class="user-badge__dropdown-username">@${user.username}</div>
      </div>
      <ul class="user-badge__dropdown-menu">
        <li><a href="/pillars/community/profile.html" class="user-badge__dropdown-item">👤 Profile</a></li>
        <li><a href="/pillars/community/profile.html?edit=1" class="user-badge__dropdown-item">✏️ Edit Profile</a></li>
        <li class="user-badge__dropdown-divider"></li>
        <li><button class="user-badge__dropdown-item" id="logoutBtn">Sign Out</button></li>
      </ul>
    </div>
  `;
  
  document.getElementById('userBadgeTrigger').addEventListener('click', (e) => {
    e.stopPropagation();
    userBadge.classList.toggle('user-badge--open');
  });
  
  document.addEventListener('click', () => userBadge.classList.remove('user-badge--open'));
  document.getElementById('logoutBtn').addEventListener('click', () => auth.logout());
}

function renderLoginButton() {
  userBadge.innerHTML = `
    <button class="user-badge__login" id="navLoginBtn">
      <svg class="github-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Sign In
    </button>
  `;
  
  document.getElementById('navLoginBtn').addEventListener('click', () => auth.login());
}

// ═══════════════════════════════════════════════════════════════════════════
// POST RENDERING
// ═══════════════════════════════════════════════════════════════════════════

function renderPosts() {
  const allPosts = posts.getPosts();
  
  if (allPosts.length === 0) {
    feedPosts.innerHTML = `
      <div class="card" style="text-align: center; padding: var(--sp-5);">
        <div style="font-size: 2rem; margin-bottom: var(--sp-2);">🌐</div>
        <h3 style="margin-bottom: var(--sp-1);">No posts yet</h3>
        <p class="text-dim">Be the first to share what you're building.</p>
      </div>
    `;
    return;
  }
  
  feedPosts.innerHTML = allPosts.map(post => renderPostCard(post)).join('');
}

function renderPostCard(post) {
  const typeLabels = {
    release: '🚀 Release',
    experiment: '🧪 Experiment',
    tutorial: '📚 Tutorial',
    commit: '💻 Commit',
    milestone: '🎯 Milestone',
    teaser: '👀 Teaser',
    thought: '💭 Thought'
  };
  
  const repoHtml = post.repo ? `
    <a href="${post.repo.url}" target="_blank" rel="noopener" class="post-card__repo">
      📦 ${post.repo.name}
    </a>
  ` : '';
  
  const codeHtml = post.code ? `
    <div class="code-block" data-post-code>
      <div class="code-block__header">
        <span class="code-block__language">${LANGUAGES.find(l => l.id === post.code.language)?.name || post.code.language}</span>
        <button class="code-block__copy" title="Copy code" data-code="${encodeURIComponent(post.code.code)}">📋</button>
      </div>
      <pre class="code-block__body"><code>${escapeHtml(post.code.code)}</code></pre>
    </div>
  ` : '';
  
  // Media rendering (image/video/gif)
  let mediaHtml = '';
  if (post.media && post.media.url) {
    const mediaUrl = post.media.url.startsWith('github://') 
      ? convertGitHubUrl(post.media.url)
      : post.media.url;
    
    if (post.media.type === 'video') {
      mediaHtml = `
        <div class="post-card__media post-card__media--video">
          <video controls preload="metadata" playsinline>
            <source src="${escapeHtml(mediaUrl)}" type="video/mp4">
            Your browser does not support video playback.
          </video>
        </div>
      `;
    } else {
      // image or gif
      mediaHtml = `
        <div class="post-card__media">
          <img src="${escapeHtml(mediaUrl)}" alt="Post media" loading="lazy" onclick="this.classList.toggle('expanded')">
        </div>
      `;
    }
  }
  
  const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0);
  const currentUser = auth.getUser();
  const isOwner = currentUser && post.userId === currentUser.id;
  
  // Modular structure: Text → Media → Attachments (code, repo)
  return `
    <article class="post-card" data-post-id="${post.id}">
      <header class="post-card__header">
        <a href="/pillars/community/profile.html?user=${post.username}" class="post-card__avatar-link">
          <img src="${post.userAvatar}" alt="${post.userName}" class="post-card__avatar">
        </a>
        <div class="post-card__meta">
          <div class="post-card__author">
            <a href="/pillars/community/profile.html?user=${post.username}" class="post-card__name">${post.userName}</a>
            <a href="/pillars/community/profile.html?user=${post.username}" class="post-card__username">@${post.username}</a>
          </div>
          <div class="post-card__time">${formatRelativeTime(post.createdAt)}</div>
        </div>
        ${post.type ? `<span class="post-card__type post-card__type--${post.type}">${typeLabels[post.type] || post.type}</span>` : ''}
      </header>
      
      ${post.content ? `<div class="post-card__content">${escapeHtml(post.content)}</div>` : ''}
      
      ${mediaHtml}
      
      ${codeHtml}
      
      ${repoHtml}
      
      <footer class="post-card__actions">
        <button class="post-card__action" data-action="react" data-post-id="${post.id}">
          🔥 <span>${totalReactions}</span>
        </button>
        <button class="post-card__action" data-action="comment" data-post-id="${post.id}">
          💬 <span>${Array.isArray(post.comments) ? post.comments.length : 0}</span>
        </button>
        ${isOwner ? `<button class="post-card__action" data-action="delete" data-post-id="${post.id}">🗑️</button>` : ''}
      </footer>
      <div class="post-card__comments" id="comments-${post.id}" style="display: none;"></div>
    </article>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Convert github:// URL to raw GitHub content URL
 * Format: github://owner/repo/path/to/file.ext
 */
function convertGitHubUrl(githubUrl) {
  if (!githubUrl.startsWith('github://')) return githubUrl;
  const path = githubUrl.replace('github://', '');
  const parts = path.split('/');
  if (parts.length < 3) return githubUrl;
  const owner = parts[0];
  const repo = parts[1];
  const filePath = parts.slice(2).join('/');
  return `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════

function renderSuggestions(currentUser) {
  if (!currentUser) {
    suggestions.innerHTML = `
      <p class="text-dim" style="font-size: 0.85rem;">Sign in to see suggestions</p>
    `;
    return;
  }
  
  suggestions.innerHTML = `
    <p class="text-dim" style="font-size: 0.85rem;">You're the first creator here! 🎉</p>
    <p class="text-dim" style="font-size: 0.8rem; margin-top: var(--sp-2);">Share a post to get started.</p>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// REPO PICKER (GithubBrowser)
// ═══════════════════════════════════════════════════════════════════════════

import { GithubBrowser } from './components/GithubBrowser.js';
let browserInstance = null;

function showRepoPicker() {
  const existingBrowser = document.querySelector('.gh-browser');
  if (existingBrowser) {
    existingBrowser.remove();
    return;
  }
  
  // Container for the browser
  const browserContainer = document.createElement('div');
  composer.style.position = 'relative';
  composer.appendChild(browserContainer);
  
  browserInstance = new GithubBrowser({
    container: browserContainer,
    userRepos: userRepos,
    onClose: () => {
      browserContainer.remove();
      browserInstance = null;
    },
    onSelect: (result) => {
      // Result: { type: 'repo' | 'file', data: ... }
      if (result.type === 'repo') {
        selectedRepo = result.data;
        updateSelectedRepo();
      } else if (result.type === 'file') {
        // Deep linking: attach file
        selectedRepo = result.repo; // Ensure repo is associated
        selectedCode = { 
          code: `(File: ${result.data.path})`, // Placeholder or we could fetch content
          language: result.data.name.split('.').pop(),
          path: result.data.path,
          url: result.data.html_url
        };
        updateSelectedRepo(); // Show repo
        updateSelectedCode(); // Show file
      }
      
      browserContainer.remove();
      browserInstance = null;
    }
  });
}



function updateSelectedRepo() {
  let container = document.getElementById('selectedRepoContainer');
  
  if (selectedRepo) {
    if (!container) {
      container = document.createElement('div');
      container.id = 'selectedRepoContainer';
      container.style.marginTop = 'var(--sp-2)';
      composer.querySelector('.composer__header').after(container);
    }
    
    container.innerHTML = `
      <div class="selected-repo">
        📦 ${selectedRepo.name}
        <button class="selected-repo__remove" id="removeSelectedRepo">×</button>
      </div>
    `;
    
    document.getElementById('removeSelectedRepo').addEventListener('click', () => {
      selectedRepo = null;
      container.remove();
    });
  } else if (container) {
    container.remove();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CODE EDITOR
// ═══════════════════════════════════════════════════════════════════════════

function showCodeEditor() {
  // Remove existing modal
  document.getElementById('codeEditorModal')?.remove();
  
  const modal = document.createElement('div');
  modal.id = 'codeEditorModal';
  modal.className = 'code-editor-modal';
  modal.innerHTML = `
    <div class="code-editor-modal__content">
      <div class="code-editor-modal__header">
        <span class="code-editor-modal__title">💻 Add Code</span>
        <select class="code-editor-modal__lang" id="codeLangSelect">
          ${LANGUAGES.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
        </select>
        <button class="code-editor-modal__close" id="closeCodeEditor">×</button>
      </div>
      <div class="code-editor-modal__body" id="codeEditorContainer"></div>
      <div class="code-editor-modal__footer">
        <button class="btn" id="cancelCode">Cancel</button>
        <button class="btn btn--primary" id="insertCode">Insert Code</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Initialize Monaco editor
  const container = document.getElementById('codeEditorContainer');
  codeEditor = new CodeEditor(container, {
    language: 'javascript',
    value: selectedCode?.code || ''
  });
  
  // Set initial language if editing
  if (selectedCode?.language) {
    document.getElementById('codeLangSelect').value = selectedCode.language;
    codeEditor.setLanguage(selectedCode.language);
  }
  
  // Language change
  document.getElementById('codeLangSelect').addEventListener('change', (e) => {
    codeEditor.setLanguage(e.target.value);
  });
  
  // Close handlers
  const closeModal = () => {
    codeEditor?.dispose();
    codeEditor = null;
    modal.remove();
  };
  
  document.getElementById('closeCodeEditor').addEventListener('click', closeModal);
  document.getElementById('cancelCode').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Insert code
  document.getElementById('insertCode').addEventListener('click', () => {
    const code = codeEditor.getValue().trim();
    const language = document.getElementById('codeLangSelect').value;
    
    if (code) {
      selectedCode = { code, language };
      updateSelectedCode();
    }
    closeModal();
  });
  
  // Focus editor
  setTimeout(() => codeEditor.focus(), 100);
}

function updateSelectedCode() {
  let container = document.getElementById('selectedCodeContainer');
  
  if (selectedCode) {
    if (!container) {
      container = document.createElement('div');
      container.id = 'selectedCodeContainer';
      const repoContainer = document.getElementById('selectedRepoContainer');
      if (repoContainer) {
        repoContainer.after(container);
      } else {
        composer.querySelector('.composer__header').after(container);
      }
    }
    
    const langName = LANGUAGES.find(l => l.id === selectedCode.language)?.name || selectedCode.language;
    const preview = selectedCode.code.split('\n')[0].substring(0, 40) + (selectedCode.code.length > 40 ? '...' : '');
    
    container.innerHTML = `
      <div class="selected-code">
        <span class="selected-code__icon">💻</span>
        <div class="selected-code__info">
          <div class="selected-code__lang">${langName}</div>
          <div class="selected-code__preview">${escapeHtml(preview)}</div>
        </div>
        <div class="selected-code__actions">
          <button class="selected-code__btn" id="editCode" title="Edit">✏️</button>
          <button class="selected-code__btn" id="removeCode" title="Remove">×</button>
        </div>
      </div>
    `;
    
    document.getElementById('editCode').addEventListener('click', showCodeEditor);
    document.getElementById('removeCode').addEventListener('click', () => {
      selectedCode = null;
      container.remove();
    });
  } else if (container) {
    container.remove();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

function setupEventListeners() {
  // Login prompt button
  document.getElementById('loginPromptBtn')?.addEventListener('click', () => auth.login());
  
  // Post button
  document.getElementById('postBtn')?.addEventListener('click', handlePost);
  
  // Composer tools
  const tools = document.querySelectorAll('.composer__tool');
  tools[0]?.addEventListener('click', showRepoPicker); // Repo picker
  tools[1]?.addEventListener('click', showCodeEditor); // Code editor
  
  // Tab switching
  document.querySelectorAll('.feed-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('feed-tab--active'));
      e.target.classList.add('feed-tab--active');
    });
  });
  
  // Post actions (delegate)
  feedPosts.addEventListener('click', handlePostActions);
  
  // Load more
  document.getElementById('loadMoreBtn')?.addEventListener('click', (btn) => {
    btn.target.textContent = 'No more posts';
    btn.target.disabled = true;
  });
}

function handlePostActions(e) {
  // Copy code button
  const copyBtn = e.target.closest('.code-block__copy');
  if (copyBtn) {
    const code = decodeURIComponent(copyBtn.dataset.code);
    navigator.clipboard.writeText(code).then(() => {
      copyBtn.textContent = '✓';
      setTimeout(() => copyBtn.textContent = '📋', 1500);
    });
    return;
  }
  
  const action = e.target.closest('.post-card__action');
  if (!action) return;
  
  const actionType = action.dataset.action;
  const postId = action.dataset.postId;
  
  if (actionType === 'react' && postId) {
    const updatedPost = posts.reactToPost(postId, 'fire');
    if (updatedPost) {
      const countEl = action.querySelector('span');
      const total = Object.values(updatedPost.reactions).reduce((a, b) => a + b, 0);
      countEl.textContent = total;
      action.classList.add('post-card__action--active');
    }
  }
  
  if (actionType === 'delete' && postId) {
    if (confirm('Delete this post?')) {
      posts.deletePost(postId);
      renderPosts();
      updatePostCount();
    }
  }
  
  // Comment toggle
  if (actionType === 'comment' && postId) {
    const container = document.getElementById(`comments-${postId}`);
    if (!container) return;
    
    const isVisible = container.style.display !== 'none';
    container.style.display = isVisible ? 'none' : 'block';
    
    // Initialize CommentThread if not already
    if (!isVisible && !container.dataset.initialized) {
      const post = posts.getPosts().find(p => p.id === postId);
      if (post) {
        new CommentThread(container, post, {
          onCommentAdded: (newComment) => {
            // Update the button count
            const btn = document.querySelector(`[data-action="comment"][data-post-id="${postId}"] span`);
            const currentCount = parseInt(btn.textContent) || 0;
            btn.textContent = currentCount + 1;
          }
        });
        container.dataset.initialized = 'true';
      }
    }
  }
}

async function handlePost() {
  const input = document.getElementById('composerInput');
  const postBtn = document.getElementById('postBtn');
  const content = input.value.trim();
  
  if (!content && !selectedCode) {
    input.focus();
    return;
  }
  
  // Show loading state
  postBtn.disabled = true;
  postBtn.textContent = 'Posting...';
  
  // Determine post type
  let type = 'thought';
  if (selectedRepo) type = 'release';
  else if (selectedCode) type = 'commit';
  
  try {
    const newPost = await posts.createPost({
      content,
      type,
      repo: selectedRepo,
      code: selectedCode
    });
    
    // Add to top of feed
    feedPosts.insertAdjacentHTML('afterbegin', renderPostCard(newPost));
    
    // Remove loading/empty state if present
    const loadingOrEmpty = feedPosts.querySelector('.card');
    if (loadingOrEmpty && (loadingOrEmpty.textContent.includes('No posts') || loadingOrEmpty.textContent.includes('Loading'))) {
      loadingOrEmpty.remove();
    }
    
    // Clear inputs
    input.value = '';
    selectedRepo = null;
    selectedCode = null;
    document.getElementById('selectedRepoContainer')?.remove();
    document.getElementById('selectedCodeContainer')?.remove();
    
    updatePostCount();
  } catch (error) {
    console.error('[Feed] Post error:', error);
    alert('Failed to post: ' + error.message);
  } finally {
    postBtn.disabled = false;
    postBtn.textContent = 'Post';
  }
}

function updatePostCount() {
  const user = auth.getUser();
  if (user) {
    document.getElementById('statPosts').textContent = posts.getPostsByUser(user.id).length;
  }
}

// Console signature
console.log('%c◈ OpenWorld Community', 'color: #b87333; font-size: 16px; font-weight: bold;');
