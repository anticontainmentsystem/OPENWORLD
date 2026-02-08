/**
 * OpenWorld Feed Logic
 * Handles post rendering, user interactions, and auth state
 */

import { auth } from './services/auth.js';
import { mockUsers, mockPosts, getUserById, formatRelativeTime } from './data/mock-data.js';

// DOM Elements
const userBadge = document.getElementById('userBadge');
const composer = document.getElementById('composer');
const loginPrompt = document.getElementById('loginPrompt');
const feedPosts = document.getElementById('feedPosts');
const suggestions = document.getElementById('suggestions');
const userStats = document.getElementById('userStats');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  renderPosts();
  renderSuggestions();
  setupEventListeners();
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTH HANDLING
// ═══════════════════════════════════════════════════════════════════════════

function initAuth() {
  // Subscribe to auth changes
  auth.subscribe(updateAuthUI);
  // Initial render
  updateAuthUI(auth.getUser());
}

function updateAuthUI(user) {
  if (user) {
    // Logged in state
    renderUserBadge(user);
    composer.style.display = 'block';
    loginPrompt.style.display = 'none';
    userStats.style.display = 'block';
    
    // Update composer avatar
    document.getElementById('composerAvatar').src = user.avatar;
    document.getElementById('statFollowing').textContent = user.following;
  } else {
    // Logged out state
    renderLoginButton();
    composer.style.display = 'none';
    loginPrompt.style.display = 'block';
    userStats.style.display = 'none';
  }
}

function renderUserBadge(user) {
  userBadge.innerHTML = `
    <button class="user-badge__trigger" id="userBadgeTrigger">
      <img src="${user.avatar}" alt="${user.name}" class="user-badge__avatar">
      <span class="user-badge__name">${user.username}</span>
      <span class="user-badge__chevron">▼</span>
    </button>
    <div class="user-badge__dropdown">
      <div class="user-badge__dropdown-header">
        <div class="user-badge__dropdown-name">${user.name}</div>
        <div class="user-badge__dropdown-username">@${user.username}</div>
      </div>
      <ul class="user-badge__dropdown-menu">
        <li><a href="/pillars/community/profile.html" class="user-badge__dropdown-item">👤 Your Profile</a></li>
        <li><a href="/pillars/community/settings.html" class="user-badge__dropdown-item">⚙️ Settings</a></li>
        <li class="user-badge__dropdown-divider"></li>
        <li><button class="user-badge__dropdown-item user-badge__dropdown-item--danger" id="logoutBtn">🚪 Sign Out</button></li>
      </ul>
    </div>
  `;
  
  // Toggle dropdown
  const trigger = document.getElementById('userBadgeTrigger');
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    userBadge.classList.toggle('user-badge--open');
  });
  
  // Close on outside click
  document.addEventListener('click', () => {
    userBadge.classList.remove('user-badge--open');
  });
  
  // Logout handler
  document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.logout();
  });
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
  
  document.getElementById('navLoginBtn').addEventListener('click', handleLogin);
}

async function handleLogin() {
  const btn = document.querySelector('.user-badge__login') || document.getElementById('loginPromptBtn');
  if (btn) {
    btn.textContent = 'Signing in...';
    btn.disabled = true;
  }
  
  await auth.login();
}

// ═══════════════════════════════════════════════════════════════════════════
// POST RENDERING
// ═══════════════════════════════════════════════════════════════════════════

function renderPosts() {
  feedPosts.innerHTML = mockPosts.map(post => renderPostCard(post)).join('');
}

function renderPostCard(post) {
  const user = getUserById(post.userId);
  if (!user) return '';
  
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
      <span class="post-card__repo-icon">📦</span>
      ${post.repo.name}
    </a>
  ` : '';
  
  const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0);
  
  return `
    <article class="post-card" data-post-id="${post.id}">
      <header class="post-card__header">
        <img src="${user.avatar}" alt="${user.name}" class="post-card__avatar" data-user-id="${user.id}">
        <div class="post-card__meta">
          <div class="post-card__author">
            <span class="post-card__name" data-user-id="${user.id}">${user.name}</span>
            <span class="post-card__username">@${user.username}</span>
          </div>
          <div class="post-card__time">${formatRelativeTime(post.createdAt)}</div>
        </div>
        ${post.type ? `<span class="post-card__type post-card__type--${post.type}">${typeLabels[post.type] || post.type}</span>` : ''}
      </header>
      
      <div class="post-card__content">${post.content}</div>
      
      ${repoHtml}
      
      <footer class="post-card__actions">
        <button class="post-card__action" data-action="react">
          🔥 <span>${totalReactions}</span>
        </button>
        <button class="post-card__action" data-action="comment">
          💬 <span>${post.comments}</span>
        </button>
        <button class="post-card__action" data-action="share">
          🔗 Share
        </button>
        <button class="post-card__action" data-action="bookmark">
          🔖 Save
        </button>
      </footer>
    </article>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════

function renderSuggestions() {
  const suggestedUsers = mockUsers.slice(0, 4);
  
  suggestions.innerHTML = suggestedUsers.map(user => `
    <div class="suggestion-item">
      <img src="${user.avatar}" alt="${user.name}" class="suggestion-item__avatar">
      <div class="suggestion-item__info">
        <div class="suggestion-item__name">${user.name}</div>
        <div class="suggestion-item__username">@${user.username}</div>
      </div>
      <button class="ow-btn suggestion-item__follow" data-user-id="${user.id}">Follow</button>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

function setupEventListeners() {
  // Login prompt button
  const loginPromptBtn = document.getElementById('loginPromptBtn');
  if (loginPromptBtn) {
    loginPromptBtn.addEventListener('click', handleLogin);
  }
  
  // Post button
  const postBtn = document.getElementById('postBtn');
  if (postBtn) {
    postBtn.addEventListener('click', handlePost);
  }
  
  // Tab switching
  document.querySelectorAll('.feed-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('feed-tab--active'));
      e.target.classList.add('feed-tab--active');
    });
  });
  
  // Follow buttons
  suggestions.addEventListener('click', (e) => {
    if (e.target.classList.contains('suggestion-item__follow')) {
      const btn = e.target;
      if (btn.textContent === 'Follow') {
        btn.textContent = 'Following';
        btn.style.background = 'var(--ow-elevated)';
        btn.style.borderColor = 'var(--ow-text-muted)';
        btn.style.color = 'var(--ow-text-secondary)';
      } else {
        btn.textContent = 'Follow';
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
      }
    }
  });
  
  // Post action buttons
  feedPosts.addEventListener('click', (e) => {
    const action = e.target.closest('.post-card__action');
    if (action) {
      const actionType = action.dataset.action;
      if (actionType === 'react') {
        action.classList.toggle('post-card__action--active');
        const countEl = action.querySelector('span');
        const count = parseInt(countEl.textContent);
        countEl.textContent = action.classList.contains('post-card__action--active') ? count + 1 : count - 1;
      }
    }
    
    // User profile click
    const userElement = e.target.closest('[data-user-id]');
    if (userElement && userElement.dataset.userId) {
      window.location.href = `/pillars/community/profile.html?id=${userElement.dataset.userId}`;
    }
  });
  
  // Load more
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadMoreBtn.textContent = 'Loading...';
      setTimeout(() => {
        loadMoreBtn.textContent = 'No more posts';
        loadMoreBtn.disabled = true;
      }, 1000);
    });
  }
}

function handlePost() {
  const input = document.getElementById('composerInput');
  const content = input.value.trim();
  
  if (!content) return;
  
  const user = auth.getUser();
  if (!user) return;
  
  // Create new post
  const newPost = {
    id: 'post_' + Date.now(),
    userId: user.id,
    content: content,
    type: 'thought',
    reactions: { fire: 0, heart: 0 },
    comments: 0,
    createdAt: new Date().toISOString()
  };
  
  // Add user to mock data temporarily
  mockUsers.push(user);
  mockPosts.unshift(newPost);
  
  // Re-render
  feedPosts.innerHTML = renderPostCard(newPost) + feedPosts.innerHTML;
  
  // Clear input
  input.value = '';
  
  // Update stats
  const statPosts = document.getElementById('statPosts');
  statPosts.textContent = parseInt(statPosts.textContent) + 1;
}

// Console signature
console.log(`
%c◈ OpenWorld Community
%cLive creation feed

Build in public. Share your journey.
`, 
'color: #4d96ff; font-size: 20px; font-weight: bold;',
'color: #a0a0b5; font-size: 12px;'
);
