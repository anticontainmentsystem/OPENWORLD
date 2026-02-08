/**
 * OpenWorld Feed
 * Real post creation with GitHub repo attachment
 */

import { auth, posts, fetchUserRepos, formatRelativeTime } from './services/auth.js';

// DOM Elements
const userBadge = document.getElementById('userBadge');
const composer = document.getElementById('composer');
const loginPrompt = document.getElementById('loginPrompt');
const feedPosts = document.getElementById('feedPosts');
const suggestions = document.getElementById('suggestions');
const userStats = document.getElementById('userStats');

let userRepos = [];
let selectedRepo = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  renderPosts();
  setupEventListeners();
});

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
  
  const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0);
  const currentUser = auth.getUser();
  const isOwner = currentUser && post.userId === currentUser.id;
  
  return `
    <article class="post-card" data-post-id="${post.id}">
      <header class="post-card__header">
        <img src="${post.userAvatar}" alt="${post.userName}" class="post-card__avatar" data-username="${post.username}">
        <div class="post-card__meta">
          <div class="post-card__author">
            <span class="post-card__name" data-username="${post.username}">${post.userName}</span>
            <span class="post-card__username">@${post.username}</span>
          </div>
          <div class="post-card__time">${formatRelativeTime(post.createdAt)}</div>
        </div>
        ${post.type ? `<span class="post-card__type post-card__type--${post.type}">${typeLabels[post.type] || post.type}</span>` : ''}
      </header>
      
      <div class="post-card__content">${escapeHtml(post.content)}</div>
      
      ${repoHtml}
      
      <footer class="post-card__actions">
        <button class="post-card__action" data-action="react" data-post-id="${post.id}">
          🔥 <span>${totalReactions}</span>
        </button>
        <button class="post-card__action" data-action="comment">
          💬 <span>${post.comments}</span>
        </button>
        ${isOwner ? `<button class="post-card__action" data-action="delete" data-post-id="${post.id}">🗑️</button>` : ''}
      </footer>
    </article>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
// REPO PICKER
// ═══════════════════════════════════════════════════════════════════════════

function showRepoPicker() {
  const existingPicker = document.getElementById('repoPicker');
  if (existingPicker) {
    existingPicker.remove();
    return;
  }
  
  if (userRepos.length === 0) {
    alert('No repositories found. Make sure you have public repos on GitHub.');
    return;
  }
  
  const picker = document.createElement('div');
  picker.id = 'repoPicker';
  picker.className = 'repo-picker';
  picker.innerHTML = `
    <div class="repo-picker__header">
      <span>Select Repository</span>
      <button class="repo-picker__close" id="closeRepoPicker">×</button>
    </div>
    <div class="repo-picker__list">
      ${userRepos.map(repo => `
        <button class="repo-picker__item" data-repo='${JSON.stringify(repo)}'>
          <span class="repo-picker__name">📦 ${repo.name}</span>
          ${repo.description ? `<span class="repo-picker__desc">${repo.description.substring(0, 50)}</span>` : ''}
        </button>
      `).join('')}
    </div>
  `;
  
  // Add styles if not present
  if (!document.getElementById('repoPickerStyles')) {
    const style = document.createElement('style');
    style.id = 'repoPickerStyles';
    style.textContent = `
      .repo-picker {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        margin-top: var(--sp-1);
        max-height: 200px;
        overflow-y: auto;
        z-index: 100;
      }
      .repo-picker__header {
        display: flex;
        justify-content: space-between;
        padding: var(--sp-2);
        border-bottom: 1px solid var(--border);
        font-size: 0.8rem;
        color: var(--text-muted);
      }
      .repo-picker__close {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 1rem;
      }
      .repo-picker__list {
        padding: var(--sp-1);
      }
      .repo-picker__item {
        display: block;
        width: 100%;
        text-align: left;
        padding: var(--sp-2);
        background: none;
        border: none;
        border-radius: var(--radius);
        cursor: pointer;
        font-family: var(--font);
      }
      .repo-picker__item:hover {
        background: var(--border);
      }
      .repo-picker__name {
        display: block;
        font-size: 0.85rem;
        color: var(--copper-500);
        font-family: var(--font-mono);
      }
      .repo-picker__desc {
        display: block;
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 2px;
      }
      .selected-repo {
        display: flex;
        align-items: center;
        gap: var(--sp-1);
        padding: var(--sp-1) var(--sp-2);
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-size: 0.8rem;
        color: var(--copper-500);
        font-family: var(--font-mono);
      }
      .selected-repo__remove {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0 2px;
      }
    `;
    document.head.appendChild(style);
  }
  
  composer.style.position = 'relative';
  composer.appendChild(picker);
  
  // Event listeners
  document.getElementById('closeRepoPicker').addEventListener('click', () => picker.remove());
  
  picker.querySelectorAll('.repo-picker__item').forEach(item => {
    item.addEventListener('click', () => {
      selectedRepo = JSON.parse(item.dataset.repo);
      picker.remove();
      updateSelectedRepo();
    });
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
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

function setupEventListeners() {
  // Login prompt button
  document.getElementById('loginPromptBtn')?.addEventListener('click', () => auth.login());
  
  // Post button
  document.getElementById('postBtn')?.addEventListener('click', handlePost);
  
  // Repo picker
  document.querySelector('.composer__tool')?.addEventListener('click', showRepoPicker);
  
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
  
  // Profile navigation
  const userElement = e.target.closest('[data-username]');
  if (userElement && !action) {
    window.location.href = `/pillars/community/profile.html?user=${userElement.dataset.username}`;
  }
}

function handlePost() {
  const input = document.getElementById('composerInput');
  const content = input.value.trim();
  
  if (!content) {
    input.focus();
    return;
  }
  
  try {
    const newPost = posts.createPost({
      content,
      type: selectedRepo ? 'release' : 'thought',
      repo: selectedRepo
    });
    
    // Add to top of feed
    feedPosts.insertAdjacentHTML('afterbegin', renderPostCard(newPost));
    
    // Remove "no posts" message if present
    const emptyState = feedPosts.querySelector('.card');
    if (emptyState && emptyState.textContent.includes('No posts yet')) {
      emptyState.remove();
    }
    
    // Clear input
    input.value = '';
    selectedRepo = null;
    document.getElementById('selectedRepoContainer')?.remove();
    
    updatePostCount();
  } catch (error) {
    alert(error.message);
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
