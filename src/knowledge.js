/**
 * Knowledge Portal — Listing Page
 * Browse, search, filter, and create frames
 */
import { auth } from './services/auth.js';
import { framesAPI } from './services/frames-data.js';
import { FrameCard } from './components/FrameCard.js';
import { CreateFrameModal } from './components/CreateFrameModal.js';

// DOM Elements
const userBadge = document.getElementById('userBadge');
const framesGrid = document.getElementById('framesGrid');
const searchInput = document.getElementById('knowledgeSearch');
const categoryTabs = document.getElementById('categoryTabs');
const createBtn = document.getElementById('createFrameBtn');
const frameCount = document.getElementById('frameCount');

// State
let allFrames = [];
let activeCategory = 'all';
let searchQuery = '';
let searchTimeout = null;

// Initialize
function init() {
  initAuth();
  loadFrames();
  setupEventListeners();
}

function initAuth() {
  auth.subscribe(user => {
    if (user) {
      userBadge.innerHTML = `
        <div class="user-badge__trigger">
          <img src="${user.avatar}" class="user-badge__avatar" style="width:28px;height:28px;border-radius:50%;">
          <span style="font-size:0.85rem;">${user.username}</span>
        </div>
      `;
    } else {
      userBadge.innerHTML = `<button id="loginBtn" class="btn btn--primary btn--sm">Sign In</button>`;
      document.getElementById('loginBtn')?.addEventListener('click', () => auth.login());
    }
  });
  auth.getUser();
}

async function loadFrames() {
  framesGrid.innerHTML = '<p class="text-dim" style="padding: var(--sp-4);">Loading frames...</p>';

  try {
    const filters = {};
    if (activeCategory !== 'all') filters.category = activeCategory;
    if (searchQuery) filters.search = searchQuery;

    allFrames = await framesAPI.getAll(filters);
    renderFrames();
  } catch (err) {
    framesGrid.innerHTML = `<p class="text-dim" style="padding: var(--sp-4);">Failed to load frames.</p>`;
    console.error('[Knowledge] Load error:', err);
  }
}

function renderFrames() {
  framesGrid.innerHTML = '';

  if (allFrames.length === 0) {
    framesGrid.innerHTML = `
      <div class="frames-empty">
        <div class="frames-empty__icon">📡</div>
        <p>No frames yet${activeCategory !== 'all' ? ` in ${activeCategory}` : ''}${searchQuery ? ` matching "${searchQuery}"` : ''}.</p>
        <p style="margin-top: var(--sp-1);">Be the first to create one.</p>
      </div>
    `;
    if (frameCount) frameCount.textContent = '0 frames';
    return;
  }

  allFrames.forEach(frame => {
    const card = new FrameCard(frame);
    framesGrid.appendChild(card.render());
  });

  if (frameCount) frameCount.textContent = `${allFrames.length} frame${allFrames.length !== 1 ? 's' : ''}`;
}

function setupEventListeners() {
  // Search with debounce
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = searchInput.value.trim();
        loadFrames();
      }, 400);
    });
  }

  // Category tabs
  if (categoryTabs) {
    categoryTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.category-tab');
      if (!tab) return;

      categoryTabs.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.category || 'all';
      loadFrames();
    });
  }

  // Create frame
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const modal = new CreateFrameModal({
        onCreated: (result) => {
          // Prepend the new frame to the list
          if (result.frame) {
            allFrames.unshift(result.frame);
            renderFrames();
          }
        }
      });
      modal.open();
    });
  }
}

// Run
init();
