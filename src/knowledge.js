/**
 * Knowledge Portal — Listing Page
 * Browse, search, filter, and create frames
 */
import { auth } from './services/auth.js';
import { framesAPI } from './services/frames-data.js';
import { FrameCard } from './components/FrameCard.js';
import { CreateFrameModal } from './components/CreateFrameModal.js';
import { renderUserBadge } from './components/UserBadge.js';

// DOM Elements
const userBadge = document.getElementById('userBadge');
const framesGrid = document.getElementById('framesGrid');
const searchInput = document.getElementById('knowledgeSearch');
const categoryTabs = document.getElementById('categoryTabs');
const createBtn = document.getElementById('createFrameBtn');
const heroCreateBtn = document.getElementById('heroCreateBtn');
const ctaCreateBtn = document.getElementById('ctaCreateBtn');
const frameCount = document.getElementById('frameCount');
const categoryCards = document.getElementById('categoryCards');
const statFrames = document.getElementById('statFrames');
const statContributors = document.getElementById('statContributors');

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
  renderUserBadge(userBadge);
}

async function loadFrames() {
  framesGrid.innerHTML = '<p class="text-dim" style="padding: var(--sp-4);">Loading frames...</p>';

  try {
    const filters = {};
    if (activeCategory !== 'all') filters.category = activeCategory;
    if (searchQuery) filters.search = searchQuery;

    allFrames = await framesAPI.getAll(filters);
    updateStats();
    renderFrames();
  } catch (err) {
    framesGrid.innerHTML = `<p class="text-dim" style="padding: var(--sp-4);">Failed to load frames.</p>`;
    console.error('[Knowledge] Load error:', err);
  }
}

function updateStats() {
  if (statFrames) statFrames.textContent = allFrames.length;

  if (statContributors) {
    const uniqueCreators = new Set(allFrames.map(f => f.creatorId));
    statContributors.textContent = uniqueCreators.size;
  }
}

function renderFrames() {
  framesGrid.innerHTML = '';

  if (allFrames.length === 0) {
    const filterLabel = activeCategory !== 'all' ? ` in <strong>${activeCategory}</strong>` : '';
    const searchLabel = searchQuery ? ` matching "<strong>${escapeHtml(searchQuery)}</strong>"` : '';

    framesGrid.innerHTML = `
      <div class="frames-empty">
        <div class="frames-empty__icon">📡</div>
        <h3 class="frames-empty__title">No frames yet${filterLabel || searchLabel ? '' : ' — be the first'}</h3>
        <p class="frames-empty__desc">
          ${filterLabel || searchLabel
            ? `No frames found${filterLabel}${searchLabel}. Try a different filter or create one yourself.`
            : `Frames are living knowledge spaces where communities discuss, share resources, and build understanding together. Start one and see what grows.`
          }
        </p>
        <div class="frames-empty__cta">
          <button class="btn btn--primary" id="emptyCreateBtn">+ Create the First Frame</button>
        </div>
      </div>
    `;

    document.getElementById('emptyCreateBtn')?.addEventListener('click', openCreateModal);
    if (frameCount) frameCount.textContent = '0 frames';
    return;
  }

  allFrames.forEach(frame => {
    const card = new FrameCard(frame);
    framesGrid.appendChild(card.render());
  });

  if (frameCount) frameCount.textContent = `${allFrames.length} frame${allFrames.length !== 1 ? 's' : ''}`;
}

function openCreateModal() {
  const modal = new CreateFrameModal({
    onCreated: (result) => {
      if (result.frame) {
        allFrames.unshift(result.frame);
        updateStats();
        renderFrames();
      }
    }
  });
  modal.open();
}

function selectCategory(category) {
  activeCategory = category;

  // Update tab UI
  if (categoryTabs) {
    categoryTabs.querySelectorAll('.category-tab').forEach(t => {
      t.classList.toggle('active', (t.dataset.category || 'all') === category);
    });
  }

  loadFrames();
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
      selectCategory(tab.dataset.category || 'all');
    });
  }

  // Category cards in showcase section
  if (categoryCards) {
    categoryCards.addEventListener('click', (e) => {
      const card = e.target.closest('.k-cat-card');
      if (!card) return;
      const cat = card.dataset.category;
      if (cat) {
        selectCategory(cat);
        document.getElementById('frames-listing')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // All create buttons
  [createBtn, heroCreateBtn, ctaCreateBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', openCreateModal);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Run
init();
