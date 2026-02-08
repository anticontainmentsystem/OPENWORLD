/**
 * OpenWorld Profile Page
 * Profile viewing and editing
 */

import { auth, posts, formatRelativeTime } from './services/auth.js';

// Get URL params
const urlParams = new URLSearchParams(window.location.search);
const requestedUser = urlParams.get('user');
const isEditMode = urlParams.get('edit') === '1';

// DOM Elements
const userBadge = document.getElementById('userBadge');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileUsername = document.getElementById('profileUsername');
const profileBio = document.getElementById('profileBio');
const profileLocation = document.getElementById('profileLocation');
const profileJoined = document.getElementById('profileJoined');
const repoGrid = document.getElementById('repoGrid');
const followBtn = document.getElementById('followBtn');
const githubLink = document.getElementById('githubLink');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  loadProfile();
  setupTabs();
  
  if (isEditMode) {
    enableEditMode();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════

function initAuth() {
  auth.subscribe(updateAuthUI);
  updateAuthUI(auth.getUser());
}

function updateAuthUI(user) {
  if (user) {
    renderUserBadge(user);
  } else {
    renderLoginButton();
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
        <li><a href="/pillars/community/" class="user-badge__dropdown-item">🌐 Community</a></li>
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
  document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.logout();
    window.location.href = '/';
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
  
  document.getElementById('navLoginBtn').addEventListener('click', () => auth.login());
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════════════════

function loadProfile() {
  const currentUser = auth.getUser();
  
  // Determine which user to show
  let user;
  if (requestedUser && currentUser?.username !== requestedUser) {
    // Viewing someone else's profile - would need API lookup
    // For now, show empty state
    document.querySelector('.profile-header').innerHTML = `
      <div class="profile-header__inner" style="text-align: center;">
        <p class="text-dim">User @${requestedUser} not found</p>
        <a href="/pillars/community/" class="btn" style="margin-top: var(--sp-3);">Back to Feed</a>
      </div>
    `;
    document.querySelector('.profile-content').innerHTML = '';
    return;
  } else if (currentUser) {
    user = currentUser;
  } else {
    // Not logged in
    document.querySelector('.profile-header').innerHTML = `
      <div class="profile-header__inner" style="text-align: center;">
        <p class="text-dim" style="margin-bottom: var(--sp-3);">Sign in to view your profile</p>
        <button class="btn btn--primary" id="profileLoginBtn">
          <svg class="github-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Sign in with GitHub
        </button>
      </div>
    `;
    document.querySelector('.profile-content').innerHTML = '';
    document.getElementById('profileLoginBtn')?.addEventListener('click', () => auth.login());
    return;
  }
  
  // Populate profile
  document.title = `${user.name} — OpenWorld`;
  
  profileAvatar.src = user.avatar;
  profileAvatar.alt = user.name;
  profileName.textContent = user.name;
  profileUsername.textContent = `@${user.username}`;
  profileBio.textContent = user.bio || 'No bio yet';
  
  if (user.location) {
    profileLocation.querySelector('span').textContent = user.location;
    profileLocation.style.display = 'flex';
  } else {
    profileLocation.style.display = 'none';
  }
  
  profileJoined.textContent = new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  
  document.getElementById('statFollowers').textContent = (user.followers || 0).toLocaleString();
  document.getElementById('statFollowing').textContent = (user.following || 0).toLocaleString();
  document.getElementById('statRepos').textContent = (user.repos?.length || 0);
  
  githubLink.href = `https://github.com/${user.github || user.username}`;
  
  // Follow button becomes Edit Profile for own profile
  followBtn.textContent = 'Edit Profile';
  followBtn.addEventListener('click', () => {
    window.location.href = '/pillars/community/profile.html?edit=1';
  });
  
  // Render repos
  renderRepos(user.repos || []);
  
  // Render user's posts
  renderUserPosts(user.id);
}

function renderRepos(repos) {
  if (repos.length === 0) {
    repoGrid.innerHTML = `<p class="text-dim">No public repositories</p>`;
    return;
  }
  
  repoGrid.innerHTML = repos.map(repo => {
    const langClass = repo.language?.toLowerCase().replace(/[^a-z]/g, '') || 'unknown';
    return `
      <a href="${repo.url}" class="repo-card" target="_blank" rel="noopener">
        <div class="repo-card__header">
          <span class="repo-card__icon">📦</span>
          <span class="repo-card__name">${repo.name}</span>
        </div>
        <p class="repo-card__desc">${repo.description || 'No description'}</p>
        <div class="repo-card__footer">
          <span class="repo-card__lang">
            <span class="repo-card__lang-dot repo-card__lang-dot--${langClass}"></span>
            ${repo.language || 'Unknown'}
          </span>
          <span>⭐ ${(repo.stars || 0).toLocaleString()}</span>
        </div>
      </a>
    `;
  }).join('');
}

function renderUserPosts(userId) {
  const userPosts = posts.getPostsByUser(userId);
  const postsContainer = document.getElementById('userPosts');
  
  if (userPosts.length === 0) {
    postsContainer.innerHTML = `<p class="text-dim" style="text-align: center;">No posts yet</p>`;
    return;
  }
  
  postsContainer.innerHTML = userPosts.map(post => `
    <div class="card" style="margin-bottom: var(--sp-2);">
      <p>${post.content}</p>
      ${post.repo ? `<a href="${post.repo.url}" class="post-card__repo" style="margin-top: var(--sp-2);">📦 ${post.repo.name}</a>` : ''}
      <p class="text-muted" style="font-size: 0.75rem; margin-top: var(--sp-2);">${formatRelativeTime(post.createdAt)}</p>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// EDIT MODE
// ═══════════════════════════════════════════════════════════════════════════

function enableEditMode() {
  const user = auth.getUser();
  if (!user) return;
  
  // Add edit styles
  const style = document.createElement('style');
  style.textContent = `
    .editable {
      border: 1px dashed var(--copper-500) !important;
      padding: var(--sp-1) var(--sp-2) !important;
      border-radius: var(--radius);
      cursor: text;
    }
    .editable:focus {
      outline: none;
      background: var(--surface);
    }
    .edit-actions {
      display: flex;
      gap: var(--sp-2);
      margin-top: var(--sp-3);
    }
  `;
  document.head.appendChild(style);
  
  // Make fields editable
  profileName.contentEditable = true;
  profileName.classList.add('editable');
  
  profileBio.contentEditable = true;
  profileBio.classList.add('editable');
  
  // Change button to Save
  followBtn.textContent = 'Save Changes';
  followBtn.onclick = saveProfile;
  
  // Add cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => window.location.href = '/pillars/community/profile.html';
  followBtn.parentElement.appendChild(cancelBtn);
}

function saveProfile() {
  const newName = profileName.textContent.trim();
  const newBio = profileBio.textContent.trim();
  
  auth.updateProfile({
    name: newName,
    bio: newBio
  });
  
  window.location.href = '/pillars/community/profile.html';
}

// ═══════════════════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════════════════

function setupTabs() {
  const tabs = document.querySelectorAll('.profile-tab');
  const sections = {
    repos: document.getElementById('reposSection'),
    activity: document.getElementById('activitySection'),
    posts: document.getElementById('postsSection')
  };
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('profile-tab--active'));
      tab.classList.add('profile-tab--active');
      
      const tabName = tab.dataset.tab;
      Object.entries(sections).forEach(([name, section]) => {
        if (section) section.style.display = name === tabName ? 'block' : 'none';
      });
    });
  });
}

console.log('%c◈ OpenWorld Profile', 'color: #b87333; font-size: 16px;');
