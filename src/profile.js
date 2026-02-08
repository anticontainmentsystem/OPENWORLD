/**
 * OpenWorld Profile Page Logic
 * Handles profile data rendering and interactions
 */

import { auth } from './services/auth.js';
import { mockUsers, getUserById, formatRelativeTime } from './data/mock-data.js';

// DOM Elements
const userBadge = document.getElementById('userBadge');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileUsername = document.getElementById('profileUsername');
const profileBio = document.getElementById('profileBio');
const profileLocation = document.getElementById('profileLocation');
const profileWebsite = document.getElementById('profileWebsite');
const profileJoined = document.getElementById('profileJoined');
const repoGrid = document.getElementById('repoGrid');
const followBtn = document.getElementById('followBtn');
const githubLink = document.getElementById('githubLink');

// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  loadProfile();
  setupTabs();
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTH HANDLING (same as feed.js)
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
  
  const trigger = document.getElementById('userBadgeTrigger');
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    userBadge.classList.toggle('user-badge--open');
  });
  
  document.addEventListener('click', () => {
    userBadge.classList.remove('user-badge--open');
  });
  
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
  
  document.getElementById('navLoginBtn').addEventListener('click', async () => {
    await auth.login();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE LOADING
// ═══════════════════════════════════════════════════════════════════════════

function loadProfile() {
  // Get user - either from URL or current user
  let user;
  
  if (userId) {
    user = getUserById(userId);
  } else {
    // Show current user's profile or default
    user = auth.getUser() || mockUsers[0];
  }
  
  if (!user) {
    user = mockUsers[0]; // Fallback to first mock user
  }
  
  // Update page title
  document.title = `${user.name} — OpenWorld`;
  
  // Populate profile header
  profileAvatar.src = user.avatar;
  profileAvatar.alt = user.name;
  profileName.textContent = user.name;
  profileUsername.textContent = `@${user.username}`;
  profileBio.textContent = user.bio || 'No bio yet.';
  
  // Meta info
  if (user.location) {
    profileLocation.querySelector('span').textContent = user.location;
    profileLocation.style.display = 'flex';
  } else {
    profileLocation.style.display = 'none';
  }
  
  if (user.website) {
    profileWebsite.textContent = user.website.replace('https://', '');
    profileWebsite.href = user.website;
  } else {
    profileWebsite.parentElement.style.display = 'none';
  }
  
  profileJoined.textContent = new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  
  // Stats
  document.getElementById('statFollowers').textContent = user.followers?.toLocaleString() || '0';
  document.getElementById('statFollowing').textContent = user.following?.toLocaleString() || '0';
  document.getElementById('statRepos').textContent = user.repos?.length || '0';
  
  // GitHub link
  if (user.github) {
    githubLink.href = `https://github.com/${user.github}`;
  }
  
  // Check if viewing own profile
  const currentUser = auth.getUser();
  if (currentUser && (user.id === currentUser.id || user.id === 'usr_current')) {
    followBtn.textContent = 'Edit Profile';
    followBtn.addEventListener('click', () => {
      alert('Profile editing coming soon!');
    });
  } else {
    // Follow button
    followBtn.addEventListener('click', () => {
      if (followBtn.textContent === 'Follow') {
        followBtn.textContent = 'Following';
        followBtn.classList.remove('ow-btn--primary');
      } else {
        followBtn.textContent = 'Follow';
        followBtn.classList.add('ow-btn--primary');
      }
    });
  }
  
  // Render repos
  renderRepos(user.repos || []);
}

function renderRepos(repos) {
  if (repos.length === 0) {
    repoGrid.innerHTML = `
      <p style="color: var(--ow-text-muted); grid-column: 1 / -1; text-align: center; padding: var(--ow-space-xl);">
        No public repositories yet.
      </p>
    `;
    return;
  }
  
  repoGrid.innerHTML = repos.map(repo => {
    const langClass = repo.language?.toLowerCase().replace(/[^a-z]/g, '') || 'javascript';
    return `
      <a href="https://github.com/${repo.name}" class="repo-card" target="_blank" rel="noopener">
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
          <span>⭐ ${repo.stars?.toLocaleString() || 0}</span>
        </div>
      </a>
    `;
  }).join('');
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
      // Update active tab
      tabs.forEach(t => t.classList.remove('profile-tab--active'));
      tab.classList.add('profile-tab--active');
      
      // Show corresponding section
      const tabName = tab.dataset.tab;
      Object.entries(sections).forEach(([name, section]) => {
        section.style.display = name === tabName ? 'block' : 'none';
      });
    });
  });
}

// Console signature
console.log('%c◈ OpenWorld Profile', 'color: #4d96ff; font-size: 16px; font-weight: bold;');
