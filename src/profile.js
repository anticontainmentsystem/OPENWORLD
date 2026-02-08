/**
 * OpenWorld Profile Page
 * Profile viewing and editing
 */

import { auth, posts, formatRelativeTime } from './services/auth.js';
import { usersAPI } from './services/github-data.js';
import { NotificationDropdown } from './components/NotificationDropdown.js';

// Add styles
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/src/styles/notification.css';
document.head.appendChild(link);

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
  const container = document.getElementById('userBadge');
  if(!container) return;

  container.innerHTML = `
    <div id="notificationContainer" style="display:inline-block;"></div>
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
  
  // Init Notification Dropdown
  const notifContainer = container.querySelector('#notificationContainer');
  if(notifContainer) {
     new NotificationDropdown(notifContainer);
  }

  const trigger = document.getElementById('userBadgeTrigger');
  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      userBadge.classList.toggle('user-badge--open');
    });
  }
  
  document.addEventListener('click', () => userBadge.classList.remove('user-badge--open'));
  
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        auth.logout();
        window.location.href = '/';
    });
  }
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

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════════════════

async function loadProfile() {
  const currentUser = auth.getUser();
  let user = null;
  let isOwnProfile = false;

  // Show loading state
  document.querySelector('.profile-content').style.opacity = '0.5';

  try {
    if (requestedUser) {
      // Viewing specific user
      console.log('Loading profile for:', requestedUser);
      // Use token for higher rate limits if available
      const token = auth.getAccessToken();
      user = await usersAPI.get(requestedUser, token);
      isOwnProfile = currentUser && currentUser.username === requestedUser;
    } else if (currentUser) {
      // Viewing own profile (no param)
      console.log('Loading own profile');
      // Fetch fresh data
      const token = auth.getAccessToken();
      user = await usersAPI.get(currentUser.username, token) || currentUser;
      isOwnProfile = true;
    }

    if (!user) {
      // User not found
      document.querySelector('.profile-header').innerHTML = `
        <div class="profile-header__inner" style="text-align: center;">
          <p class="text-dim">User @${requestedUser || 'unknown'} not found</p>
          <a href="/pillars/community/" class="btn" style="margin-top: var(--sp-3);">Back to Feed</a>
        </div>
      `;
      document.querySelector('.profile-content').innerHTML = '';
      return;
    }
    
    // Populate profile
    document.title = `${user.name} — OpenWorld`;
    
    profileAvatar.src = user.avatar;
    profileAvatar.alt = user.name;
    profileName.textContent = user.name;
    profileUsername.textContent = `@${user.username}`;
    profileBio.textContent = user.bio || 'Two-bit hacker from the Sprawl.';
    
    if (user.location) {
      profileLocation.querySelector('span').textContent = user.location;
      profileLocation.style.display = 'flex';
    } else {
      profileLocation.style.display = 'none';
    }
    
    profileJoined.textContent = new Date(user.joinedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    document.getElementById('statFollowers').textContent = (user.followers || 0).toLocaleString();
    document.getElementById('statFollowing').textContent = (user.following || 0).toLocaleString();
    
    // Fetch latest repos if we have a token
    let repos = user.repos || [];
    if (isOwnProfile && auth.getAccessToken()) {
      // TODO: fetch fresh repos
    }
    document.getElementById('statRepos').textContent = repos.length;
    
    githubLink.href = `https://github.com/${user.username}`;
    
    // Setup actions
    if (isOwnProfile) {
      followBtn.textContent = 'Edit Profile';
      followBtn.onclick = () => {
        enableEditMode();
      };
    } else {
      const currentUserData = auth.getUser();
      const isFollowing = currentUserData?.followingList?.includes(user.username);
      
      updateFollowButton(isFollowing);
      
      followBtn.onclick = async () => {
        if (!auth.isLoggedIn()) {
          auth.login();
          return;
        }
        
        const action = followBtn.classList.contains('btn--outline') ? 'follow' : 'unfollow'; // Simple toggle check based on state styles
        // Better: store state implies
        const targetSameState = followBtn.textContent === 'Following'; // If it says Following, we want to Unfollow
        const newAction = targetSameState ? 'unfollow' : 'follow';
        
        // Optimistic UI for button
        followBtn.disabled = true;
        
        try {
          await auth.followUser(user.username, newAction);
          updateFollowButton(newAction === 'follow');
          
          // Update count
          const countParam = document.getElementById('statFollowers');
          let currentCount = parseInt(countParam.textContent.replace(/,/g, '')) || 0;
          countParam.textContent = (newAction === 'follow' ? currentCount + 1 : currentCount - 1).toLocaleString();
          
        } catch (e) {
          alert('Failed to update follow status');
        } finally {
          followBtn.disabled = false;
        }
      };
    }
    
    // Render content
    renderRepos(repos);
    
    // Load and render posts
    await posts.loadPosts();
    renderUserPosts(user.id || user.username);
    
    // Load activity (Placeholder for now until we have an activity feed)
    renderActivity();

  } catch (error) {
    console.error('Error loading profile:', error);
    document.querySelector('.profile-content').innerHTML = `<p class="error">Failed to load profile: ${error.message}</p>`;
  } finally {
    document.querySelector('.profile-content').style.opacity = '1';
  }
}

function updateFollowButton(isFollowing) {
  const btn = document.getElementById('followBtn');
  if (isFollowing) {
    btn.textContent = 'Following';
    btn.classList.add('btn--outline');
    btn.classList.remove('btn--primary');
  } else {
    btn.textContent = 'Follow';
    btn.classList.add('btn--primary');
    btn.classList.remove('btn--outline');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDERERS
// ═══════════════════════════════════════════════════════════════════════════

function renderActivity() {
  const timeline = document.getElementById('activityTimeline');
  // TODO: Build real activity feed from posts/repos
  timeline.innerHTML = `
    <div class="activity-item">
      <div class="activity-item__time">Now</div>
      <div class="activity-item__content">Viewing profile</div>
    </div>
  `;
}

function renderRepos(repos) {
  const user = auth.getUser();
  const pinnedIds = (user?.pinnedRepos || []);
  
  // Separate pinned and unpinned
  const pinnedRepos = repos.filter(r => pinnedIds.includes(r.id || r.name));
  const otherRepos = repos.filter(r => !pinnedIds.includes(r.id || r.name));
  
  const pinnedContainer = document.getElementById('pinnedReposContainer');
  const pinnedGrid = document.getElementById('pinnedRepoGrid');
  const mainGrid = document.getElementById('repoGrid');
  
  // Render Pinned
  if (pinnedRepos.length > 0) {
    pinnedContainer.style.display = 'block';
    pinnedGrid.innerHTML = pinnedRepos.map(repo => renderRepoCard(repo, true)).join('');
  } else {
    pinnedContainer.style.display = 'none';
  }
  
  // Render All/Others
  if (otherRepos.length === 0 && pinnedRepos.length === 0) {
    mainGrid.innerHTML = `<p class="text-dim">No public repositories</p>`;
    return;
  }
  
  mainGrid.innerHTML = otherRepos.map(repo => renderRepoCard(repo, false)).join('');
  
  // Bind actions
  bindRepoActions();
}

function renderRepoCard(repo, isPinned) {
  const langClass = repo.language?.toLowerCase().replace(/[^a-z]/g, '') || 'unknown';
  const isOwner = auth.getUser()?.username === (repo.owner.login || repo.owner);
  // Check if starred (saved)
  const isStarred = (auth.getUser()?.starredRepos || []).some(r => (r.id === repo.id) || (r.name === repo.name));
  
  return `
    <div class="repo-card">
      <a href="${repo.url}" class="repo-card__link" target="_blank" rel="noopener">
        <div class="repo-card__header">
          <span class="repo-card__icon">📦</span>
          <span class="repo-card__name">${repo.name}</span>
        </div>
        <p class="repo-card__desc">${repo.description || 'No description'}</p>
      </a>
      <div class="repo-card__footer">
        <span class="repo-card__lang">
          <span class="repo-card__lang-dot repo-card__lang-dot--${langClass}"></span>
          ${repo.language || 'Unknown'}
        </span>
        <div class="repo-card__actions">
           <span>⭐ ${(repo.stars || 0).toLocaleString()}</span>
           
           <button class="btn btn--icon btn--sm ${isStarred ? 'text-copper' : ''}" 
             data-action="star" 
             data-repo='${JSON.stringify(repo).replace(/'/g, "&#39;")}'
             title="${isStarred ? 'Unstar' : 'Star'}">
             ${isStarred ? '★' : '☆'}
           </button>
           
           ${isOwner ? `
             <button class="btn btn--icon btn--sm ${isPinned ? 'text-copper' : ''}" 
               data-action="pin" 
               data-repo-id="${repo.id || repo.name}"
               title="${isPinned ? 'Unpin' : 'Pin'}">
               ${isPinned ? '📌' : '📍'}
             </button>
           ` : ''}
        </div>
      </div>
    </div>
  `;
}

function bindRepoActions() {
  document.querySelectorAll('[data-action="pin"]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      togglePin(btn.dataset.repoId);
    };
  });
  
  document.querySelectorAll('[data-action="star"]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const repo = JSON.parse(btn.dataset.repo.replace(/&#39;/g, "'"));
      toggleStar(repo);
    };
  });
}

function togglePin(repoId) {
  const user = auth.getUser();
  if (!user) return;
  
  let pinned = user.pinnedRepos || [];
  // Use loose comparison for ID vs Name support
  if (pinned.includes(Number(repoId)) || pinned.includes(String(repoId))) {
    pinned = pinned.filter(p => String(p) !== String(repoId));
  } else {
    pinned.push(repoId);
  }
  
  // Optimistic update
  user.pinnedRepos = pinned;
  // Re-render
  // We need the full repo list... let's assume we can get it from DOM or just reload?
  // Reloading profile is safer to ensure consistency
  auth.updateProfile({ pinnedRepos: pinned });
  window.location.reload(); // Simple reload for now
}

function toggleStar(repo) {
  const user = auth.getUser();
  if (!user) return;
  
  let starred = user.starredRepos || [];
  const exists = starred.find(r => (r.id === repo.id) || (r.name === repo.name));
  
  if (exists) {
    starred = starred.filter(r => (r.id !== repo.id) && (r.name !== repo.name));
  } else {
    starred.push({
      id: repo.id,
      name: repo.name,
      owner: repo.owner,
      description: repo.description,
      language: repo.language,
      stars: repo.stars,
      url: repo.url // Ensure URL is saved
    });
    
    // TRENDING ALGORTHM - Signal the backend
    fetch('/.netlify/functions/track-trending', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.accessToken}` // Assuming auth.getUser() returns object with accessToken
      },
      body: JSON.stringify({
        repo: {
          id: repo.id,
          name: repo.name,
          description: repo.description,
          url: repo.url
        },
        action: 'star'
      })
    }).catch(e => console.warn('Trending signal failed', e));
  }
  
  // Also track unstar?
  if (exists) {
     fetch('/.netlify/functions/track-trending', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.accessToken}`
      },
      body: JSON.stringify({
        repo: { id: repo.id, name: repo.name },
        action: 'unstar'
      })
    }).catch(e => console.warn('Trending signal failed', e));
  }
  
  auth.updateProfile({ starredRepos: starred });
  
  // Update button state immediately
  const btns = document.querySelectorAll(`[data-action="star"]`);
  btns.forEach(b => {
     // Naive check
     if (b.dataset.repo.includes(repo.name)) {
        b.innerHTML = exists ? '☆' : '★';
        b.classList.toggle('text-copper');
     }
  });
  
  // If we are on starred tab, reload
  if (document.querySelector('[data-tab="starred"].profile-tab--active')) {
     renderStarredRepos();
  }
}

function renderStarredRepos() {
  const user = auth.getUser();
  const starred = user?.starredRepos || [];
  const grid = document.getElementById('starredRepoGrid');
  
  if (starred.length === 0) {
    grid.innerHTML = `<p class="text-dim">No starred repositories</p>`;
    return;
  }
  
  grid.innerHTML = starred.map(repo => renderRepoCard(repo, false)).join('');
  bindRepoActions();
}

function renderUserPosts(userIdOrName) {
  const allPosts = posts.getPosts();
  // Filter by userId corresponding to the profile being viewed through userIdOrName
  // Note: userIdOrName can be ID or username. We check both.
  const userPosts = allPosts.filter(p => p.userId === userIdOrName || p.username === userIdOrName);
  
  const postsContainer = document.getElementById('userPosts');
  
  if (userPosts.length === 0) {
    postsContainer.innerHTML = `<p class="text-dim" style="text-align: center; padding: var(--sp-6);">No posts yet.</p>`;
    return;
  }
  
  postsContainer.innerHTML = userPosts.map(post => `
    <div class="post-card">
      <div class="post-card__header">
        <img src="${post.userAvatar || 'https://github.com/identicons/'+post.username+'.png'}" class="post-card__avatar" alt="${post.username}">
        <div class="post-card__meta">
          <span class="post-card__name">${escapeHtml(post.userName || post.username)}</span>
          <span class="post-card__username">@${escapeHtml(post.username)}</span>
          <span class="post-card__time">${formatRelativeTime(post.createdAt)}</span>
        </div>
      </div>
      <div class="post-card__content">${escapeHtml(post.content || '')}</div>
      ${post.code ? `
        <div class="code-block" data-language="${post.code.language}">
          <div class="code-block__header">
            <span class="code-block__language">${post.code.language}</span>
          </div>
          <pre class="code-block__body"><code>${escapeHtml(post.code.code)}</code></pre>
        </div>
      ` : ''}
      ${post.repo ? `
        <a href="${post.repo.url}" class="selected-repo" target="_blank" style="margin-top: var(--sp-2);">
          <span>📦 ${escapeHtml(post.repo.name)}</span>
          ${post.repo.stars ? `<span>⭐ ${post.repo.stars}</span>` : ''}
        </a>
      ` : ''}
      <div class="post-card__actions">
         <span class="text-dim">❤️ ${post.reactions?.fire || 0}</span>
      </div>
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
      background: rgba(255,255,255,0.05);
    }
    .editable:focus {
      outline: none;
      background: var(--surface);
      border-style: solid !important;
    }
    .edit-actions {
      display: flex;
      gap: var(--sp-2);
      margin-top: var(--sp-3);
    }
  `;
  document.head.appendChild(style);
  
  // Make fields editable
  const fields = [profileName, profileBio, profileLocation ? profileLocation.querySelector('span') : null];
  fields.forEach(f => {
    if(f) {
        f.contentEditable = true;
        f.classList.add('editable');
    }
  });
  
  // Change button to Save
  followBtn.textContent = 'Save Changes';
  followBtn.classList.add('btn--primary');
  
  // Remove existing click listeners by cloning
  const newBtn = followBtn.cloneNode(true);
  followBtn.parentNode.replaceChild(newBtn, followBtn);
  
  newBtn.onclick = saveProfile;
  
  // Add cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => window.location.href = '/pillars/community/profile.html';
  newBtn.parentNode.appendChild(cancelBtn);
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
    starred: document.getElementById('starredSection'),
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
      
      if (tabName === 'starred') {
        renderStarredRepos();
      }
    });
  });
}

console.log('%c◈ OpenWorld Profile', 'color: #b87333; font-size: 16px;');
