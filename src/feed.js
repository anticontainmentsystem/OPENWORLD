/**
 * OpenWorld Feed
 * Real post creation with GitHub repo attachment and code blocks
 */

import { auth, posts, fetchUserRepos, formatRelativeTime } from './services/auth.js';
import { GithubBrowser } from './components/GithubBrowser.js';
import { CodeEditor, LANGUAGES } from './components/code-editor.js';
import { ActivityPicker } from './components/ActivityPicker.js';
import { MediaPicker } from './components/MediaPicker.js';
import { CommentThread } from './components/CommentThread.js';
import { renderPostCard, escapeHtml } from './components/PostCard.js';

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
let selectedActivity = null;

// Edit Mode State
let isEditing = false;
let editingPostId = null;

function startEditing(post) {
  isEditing = true;
  editingPostId = post.id;
  
  // 1. Populate Composer
  const composerInput = document.getElementById('composerInput');
  if (composerInput) {
      composerInput.value = post.content || '';
      composerInput.focus();
  }
  
  // 2. Load Attachments
  selectedRepo = post.repo;
  selectedCode = post.code;
  selectedActivity = post.activity;
  selectedMedia = post.media;
  
  // 3. Update Previews
  updateSelectedRepo();
  updateSelectedCode();
  updateSelectedActivity();
  updateSelectedMedia();
  
  // 4. Update UI to "Edit Mode"
  const postBtn = document.getElementById('postBtn');
  if (postBtn) {
      postBtn.textContent = 'Save Changes';
      postBtn.classList.add('btn--moss'); // Visual cue
  }
  
  // Add Cancel Button if not exists
  let cancelBtn = document.getElementById('cancelEditBtn');
  if (!cancelBtn) {
      cancelBtn = document.createElement('button');
      cancelBtn.id = 'cancelEditBtn';
      cancelBtn.className = 'btn btn--text';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.marginRight = '8px';
      cancelBtn.addEventListener('click', cancelEditing);
      postBtn.parentNode.insertBefore(cancelBtn, postBtn);
  }
  
  // Scroll to composer
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEditing() {
  isEditing = false;
  editingPostId = null;
  
  // Clear Composer
  const composerInput = document.getElementById('composerInput');
  if (composerInput) composerInput.value = '';
  
  // Clear Attachments
  selectedRepo = null;
  selectedCode = null;
  selectedActivity = null;
  selectedMedia = null;
  
  updateSelectedRepo();
  updateSelectedCode();
  updateSelectedActivity();
  updateSelectedMedia();
  
  // Reset UI
  const postBtn = document.getElementById('postBtn');
  if (postBtn) {
      postBtn.textContent = 'Post';
      postBtn.classList.remove('btn--moss');
  }
  
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.remove();
}
let selectedMedia = null; // { type: 'image'|'video', url: string }
let codeEditor = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  await loadAndRenderPosts();
  setupEventListeners();
  
  // Start real-time updates (polling every 4s)
  posts.startPolling(4000);
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
  // Update stats now that posts are loaded
  updateAuthUI(auth.getUser());
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
    const statFollowing = document.getElementById('statFollowing');
    if (statFollowing) statFollowing.textContent = user.following || 0;
    
    const statPosts = document.getElementById('statPosts');
    if (statPosts) statPosts.textContent = posts.getPostsByUser(user.id).length;
    
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
      <span class="notification-badge-external" id="externalNotifBadge" style="display: none">0</span>
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



// ═══════════════════════════════════════════════════════════════════════════
// POST RENDERING
// ═══════════════════════════════════════════════════════════════════════════

function renderPosts() {
  const allPosts = posts.getPosts();
  // Filter out deleted posts for the main feed, UNLESS we are in a special "Trash" mode
  // For now, let's show deleted posts as "Deleted" placeholders if the user is the owner
  // so they can restore them.
  const currentUser = auth.getUser();
  
  // Show active posts, OR deleted posts if owned by current user (Trash view)
  const displayPosts = allPosts.filter(p => {
    if (!p.deleted) return true;
    if (currentUser && String(p.userId) === String(currentUser.id)) return true;
    return false;
  });
  
  if (displayPosts.length === 0) {
    feedPosts.innerHTML = `
      <div class="card" style="text-align: center; padding: var(--sp-5);">
        <div style="font-size: 2rem; margin-bottom: var(--sp-2);">🌐</div>
        <h3 style="margin-bottom: var(--sp-1);">No posts yet</h3>
        <p class="text-dim">Be the first to share what you're building.</p>
      </div>
    `;
    return;
  }
  
  feedPosts.innerHTML = displayPosts.map(post => renderPostCard(post)).join('');
}



// ... (renderPosts uses imported renderPostCard)

// Removed inline renderPostCard, escapeHtml, convertGitHubUrl

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


function updateSelectedActivity() {
  let container = document.getElementById('selectedActivityContainer');
  
  if (selectedActivity) {
    if (!container) {
      container = document.createElement('div');
      container.id = 'selectedActivityContainer';
      
      const codeContainer = document.getElementById('selectedCodeContainer');
      const repoContainer = document.getElementById('selectedRepoContainer');
      
      if (codeContainer) codeContainer.after(container);
      else if (repoContainer) repoContainer.after(container);
      else composer.querySelector('.composer__header').after(container);
    }
    
    let icon = '📝';
    let title = 'Activity';
    
    if (selectedActivity.type === 'commit') {
        icon = '📝';
        title = `Commit on ${selectedActivity.repo.name}`;
    } else if (selectedActivity.type === 'issue') {
        icon = '🐛';
        title = `Issue #${selectedActivity.issue.number}`;
    } else if (selectedActivity.type === 'pr') {
        icon = '🔀';
        title = `PR #${selectedActivity.pr.number}`;
    }
    
    container.innerHTML = `
      <div class="selected-repo" style="border-color: var(--accent);">
        ${icon} ${title}
        <button class="selected-repo__remove" id="removeSelectedActivity">×</button>
      </div>
    `;
    
    document.getElementById('removeSelectedActivity').addEventListener('click', () => {
      selectedActivity = null;
      container.remove();
    });
  } else if (container) {
    container.remove();
  }
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

const showActivityPicker = () => {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  document.body.appendChild(modal);
  
  new ActivityPicker(modal, {
    onSelect: (activity) => {
      selectedActivity = activity;
      modal.remove();
      updateSelectedActivity();
    },
    onClose: () => modal.remove()
  });
};

function setupEventListeners() {
  // Post button
  document.getElementById('postBtn')?.addEventListener('click', handlePost);
  
  // Composer tools
  const tools = document.querySelectorAll('.composer__tool');
  tools[0]?.addEventListener('click', showRepoPicker);
  tools[1]?.addEventListener('click', showCodeEditor);
  tools[2]?.addEventListener('click', showActivityPicker); // Activity picker
  tools[3]?.addEventListener('click', showMediaInput);
  
  // Load more editor
  
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

async function handlePostActions(e) {
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
    const updatedPost = await posts.reactToPost(postId, 'fire');
    if (updatedPost) {
      const countEl = action.querySelector('span');
      const total = Object.values(updatedPost.reactions || { fire: 0 }).reduce((a, b) => a + b, 0);
      countEl.textContent = total;
      
      // Toggle active state based on response
      if (updatedPost.hasReacted) {
        action.classList.add('post-card__action--active');
      } else {
        action.classList.remove('post-card__action--active');
      }
    }
  }
  
  if (actionType === 'delete' && postId) {
    if (confirm('Trash this post? You can restore it later.')) {
      await posts.deletePost(postId);
      renderPosts();
      updatePostCount();
    }
  }

  if (actionType === 'restore' && postId) {
    if (confirm('Restore this post?')) {
      await posts.restorePost(postId);
      renderPosts();
      updatePostCount();
    }
  }

  if (actionType === 'edit' && postId) {
     const post = posts.getPosts().find(p => p.id === postId);
     if (post) {
        startEditing(post);
     }
  }

  if (actionType === 'history' && postId) {
     const post = posts.getPosts().find(p => p.id === postId);
     if (post && post.versions) {
        const historyText = post.versions.map(v => 
          `[${new Date(v.timestamp).toLocaleTimeString()}] ${v.content}`
        ).join('\n---\n');
        alert(`Edit History:\n\n${historyText}\n\n(Current: ${post.content})`);
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

function removeAttachment() {
  selectedRepo = null;
  selectedCode = null;
  selectedActivity = null;
  selectedMedia = null;
  
  updateSelectedRepo();
  updateSelectedCode();
  updateSelectedActivity();
  updateSelectedMedia();
}

function showMediaInput() {
  const modal = document.createElement('div');
  document.body.appendChild(modal);
  
  new MediaPicker(modal, {
    onSelect: (media) => {
      selectedMedia = media;
      modal.remove();
      updateSelectedMedia();
    },
    onClose: () => modal.remove()
  });
}

function updateSelectedMedia() {
  let container = document.getElementById('selectedMediaContainer');
  
  if (selectedMedia) {
    if (!container) {
      container = document.createElement('div');
      container.id = 'selectedMediaContainer';
      
      // Insert after other attachments if they exist, or after header
      const lastAttachment = document.getElementById('selectedActivityContainer') || document.getElementById('selectedCodeContainer') || document.getElementById('selectedRepoContainer');
      const header = composer.querySelector('.composer__header');
      
      if (lastAttachment) lastAttachment.after(container);
      else header.after(container);
    }
    
    const icon = selectedMedia.type === 'video' ? '🎥' : '🖼️';
    container.innerHTML = `
      <div class="selected-code">
        <div style="font-size: 1.5rem; margin-right: 12px;">${icon}</div>
        <div class="selected-code__info">
          <div class="selected-code__lang">${selectedMedia.type.toUpperCase()}</div>
          <div class="selected-code__preview" style="font-family: var(--font-sans);">${escapeHtml(selectedMedia.url)}</div>
        </div>
        <div class="selected-code__actions">
          <button class="selected-code__btn" id="removeMedia" title="Remove">×</button>
        </div>
      </div>
    `;
    
    document.getElementById('removeMedia').addEventListener('click', () => {
      selectedMedia = null;
      container.remove();
    });
  } else if (container) {
    container.remove();
  }
}

async function handlePost() {
  const input = document.getElementById('composerInput');
  const postBtn = document.getElementById('postBtn');
  const content = input.value.trim();
  
  if (!content && !selectedRepo && !selectedCode && !selectedMedia) return;
  
  const type = selectedRepo || selectedCode ? 'project' : 'thought';
  
  // Disable button
  const btn = document.getElementById('postBtn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = isEditing ? 'Saving...' : 'Posting...';
  
  try {
    // Construct post data
    const newPost = {
      content,
      type,
      repo: selectedRepo,
      code: selectedCode ? {
        language: selectedCode.language,
        code: selectedCode.value,
        name: selectedCode.name
      } : null,
      media: selectedMedia
    };

    if (isEditing) {
       await posts.edit(editingPostId, newPost);
       isEditing = false;
       editingPostId = null;
       const titleEl = document.querySelector('.composer__title');
       if (titleEl) titleEl.textContent = 'New Post';
       input.value = ''; // Input is cleared in cancelEditing, but ensuring here
       
       // Remove "Cancel" button if exists
       const cancelBtn = document.querySelector('.composer__cancel');
       if (cancelBtn) cancelBtn.remove();
       
    } else {
       await posts.create(newPost);
    }

    // Reset Composer
    input.value = '';
    removeAttachment();
    // Render immediately (optimistic update handled by store/API)
    renderPosts();


    
    // Cooldown
    let cooldown = 4;
    postBtn.disabled = true;
    postBtn.textContent = `Wait ${cooldown}s`;
    
    const interval = setInterval(() => {
      cooldown--;
      if (cooldown <= 0) {
        clearInterval(interval);
        postBtn.disabled = false;
        postBtn.textContent = 'Post';
      } else {
        postBtn.textContent = `Wait ${cooldown}s`;
      }
    }, 1000);
    
  } catch (error) {
    console.error('[Feed] Post error:', error);
    alert('Failed to post: ' + error.message);
    postBtn.disabled = false;
    postBtn.textContent = 'Post';
  }
}


