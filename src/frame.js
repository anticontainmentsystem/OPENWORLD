/**
 * Frame Detail Page
 * Loads and displays a single frame with all its sections
 */
import { auth } from './services/auth.js';
import { framesAPI, frameMembersAPI, frameSectionsAPI } from './services/frames-data.js';
import { FrameSection } from './components/FrameSection.js';

// DOM
const userBadge = document.getElementById('userBadge');
const frameContent = document.getElementById('frameContent');

// State
let frameId = null;
let frameIndex = null;
let frameBody = null;
let currentSectionIdx = 0;
let sectionComponents = [];

// Initialize
function init() {
  const params = new URLSearchParams(window.location.search);
  frameId = params.get('id');

  if (!frameId) {
    frameContent.innerHTML = '<div class="frame-error">No frame ID specified. <a href="/pillars/knowledge/">Back to Knowledge Portal</a></div>';
    return;
  }

  initAuth();
  loadFrame();
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

async function loadFrame() {
  frameContent.innerHTML = '<div class="frame-loading">Loading frame...</div>';

  try {
    frameBody = await framesAPI.get(frameId);

    // Also get the index record for metadata (from the body we have most of it)
    // The body file has sections, members, etc.
    // For header info, we use what's in the body + any extras

    document.title = `${frameBody.id ? '' : ''}Frame — Knowledge Portal — OpenWorld`;
    renderFrame();
  } catch (err) {
    frameContent.innerHTML = `<div class="frame-error">
      <p>Failed to load frame: ${escapeHtml(err.message)}</p>
      <a href="/pillars/knowledge/">Back to Knowledge Portal</a>
    </div>`;
  }
}

function renderFrame() {
  const user = auth.getUser();
  const userId = user ? String(user.id) : null;
  const isCreator = frameBody.members?.some(m => m.role === 'creator' && String(m.userId) === userId);
  const isMember = frameBody.members?.some(m => String(m.userId) === userId);
  const creator = frameBody.members?.find(m => m.role === 'creator');
  const sections = frameBody.sections || [];

  frameContent.innerHTML = `
    <!-- Frame Header -->
    <header class="frame-header" id="frameHeader"></header>

    <!-- Section Tabs -->
    <nav class="sections-nav" id="sectionsNav"></nav>

    <!-- Section Content -->
    <div id="sectionContent"></div>

    <!-- Members -->
    <div class="frame-members" id="frameMembers"></div>

    <!-- Add Section (creator only) -->
    ${isCreator ? '<div id="addSectionArea"></div>' : ''}
  `;

  renderHeader(creator, isCreator, isMember);
  renderSectionTabs(sections);
  renderActiveSection(sections, isCreator);
  renderMembers(isCreator, userId);

  if (isCreator) {
    renderAddSection();
  }
}

function renderHeader(creator, isCreator, isMember) {
  const headerEl = document.getElementById('frameHeader');
  const user = auth.getUser();
  // Try to get info from members or frame body
  const sections = frameBody.sections || [];

  headerEl.innerHTML = `
    <div class="frame-header__top">
      <div class="frame-header__info">
        <h1 class="frame-header__title">${escapeHtml(frameId)}</h1>
      </div>
    </div>
    <div class="frame-header__meta">
      ${creator ? `
        <span class="frame-header__meta-item">
          <img src="${creator.avatar}" class="frame-header__creator-avatar">
          ${escapeHtml(creator.username)}
        </span>
      ` : ''}
      <span class="frame-header__meta-item">${frameBody.members?.length || 0} members</span>
      <span class="frame-header__meta-item">${sections.length} sections</span>
    </div>
    ${user ? `
      <div class="frame-actions">
        ${!isMember ? '<button class="btn btn--secondary btn--sm" id="joinBtn">Join Frame</button>' : ''}
        ${isMember && !isCreator ? '<button class="btn btn--outline btn--sm" id="leaveBtn">Leave</button>' : ''}
        ${isCreator ? '<button class="btn btn--outline btn--sm" id="archiveBtn">Archive</button>' : ''}
      </div>
    ` : ''}
  `;

  // Bind action buttons
  document.getElementById('joinBtn')?.addEventListener('click', handleJoin);
  document.getElementById('leaveBtn')?.addEventListener('click', handleLeave);
  document.getElementById('archiveBtn')?.addEventListener('click', handleArchive);
}

function renderSectionTabs(sections) {
  const nav = document.getElementById('sectionsNav');
  if (sections.length === 0) {
    nav.innerHTML = '<span class="text-dim text-sm">No sections</span>';
    return;
  }

  nav.innerHTML = sections.map((s, i) => `
    <button class="section-tab${i === currentSectionIdx ? ' active' : ''}" data-section-idx="${i}">
      ${s.type === 'discussion' ? '💬' : s.type === 'resources' ? '📎' : '❓'} ${escapeHtml(s.title)}
    </button>
  `).join('');

  nav.addEventListener('click', (e) => {
    const tab = e.target.closest('.section-tab');
    if (!tab) return;
    currentSectionIdx = parseInt(tab.dataset.sectionIdx);
    nav.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderActiveSection(sections, frameBody.members?.some(m => m.role === 'creator' && String(m.userId) === String(auth.getUser()?.id)));
  });
}

function renderActiveSection(sections, isCreator) {
  const container = document.getElementById('sectionContent');
  if (sections.length === 0 || currentSectionIdx >= sections.length) {
    container.innerHTML = '<p class="text-dim text-sm">No sections in this frame yet.</p>';
    return;
  }

  container.innerHTML = '';
  const section = sections[currentSectionIdx];
  new FrameSection(container, section, frameId, {
    isCreator,
    onUpdate: () => {
      // Frame body has been mutated in-place by the component
    }
  });
}

function renderMembers(isCreator, userId) {
  const container = document.getElementById('frameMembers');
  const members = frameBody.members || [];

  container.innerHTML = `
    <h3>Members (${members.length})</h3>
    <div class="members-list">
      ${members.map(m => `
        <div class="member-chip">
          <img src="${m.avatar}" class="member-chip__avatar">
          <span>${escapeHtml(m.username)}</span>
          ${m.role === 'creator' ? '<span class="member-chip__role">creator</span>' : ''}
          ${isCreator && String(m.userId) !== userId && m.role !== 'creator' ? `<button class="btn btn--sm btn--danger" data-remove-member="${m.userId}" style="padding:0 4px;font-size:0.6rem;margin-left:2px;">×</button>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  // Bind remove buttons
  container.querySelectorAll('[data-remove-member]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.removeMember;
      if (!confirm('Remove this member?')) return;
      try {
        await frameMembersAPI.remove(frameId, targetId);
        frameBody.members = frameBody.members.filter(m => String(m.userId) !== String(targetId));
        renderFrame();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function renderAddSection() {
  const container = document.getElementById('addSectionArea');
  container.innerHTML = `
    <div class="add-section-bar">
      <input type="text" class="form-input" id="newSectionTitle" placeholder="New section title..." maxlength="80">
      <select class="form-input" id="newSectionType" style="width: auto;">
        <option value="discussion">Discussion</option>
        <option value="resources">Resources</option>
        <option value="faq">FAQ</option>
      </select>
      <button class="btn btn--primary btn--sm" id="addSectionBtn">+ Add Section</button>
    </div>
  `;

  document.getElementById('addSectionBtn').addEventListener('click', handleAddSection);
}

// ── Action Handlers ──

async function handleJoin() {
  try {
    await frameMembersAPI.join(frameId);
    await loadFrame();
  } catch (err) {
    alert(err.message);
  }
}

async function handleLeave() {
  if (!confirm('Leave this frame?')) return;
  try {
    await frameMembersAPI.leave(frameId);
    await loadFrame();
  } catch (err) {
    alert(err.message);
  }
}

async function handleArchive() {
  if (!confirm('Archive this frame? It will become inactive but can be adopted by someone else.')) return;
  try {
    await framesAPI.archive(frameId);
    window.location.href = '/pillars/knowledge/';
  } catch (err) {
    alert(err.message);
  }
}

async function handleAddSection() {
  const title = document.getElementById('newSectionTitle').value.trim();
  const type = document.getElementById('newSectionType').value;

  if (!title || title.length < 2) return;

  try {
    const result = await frameSectionsAPI.add(frameId, title, type);
    frameBody.sections.push(result.section);
    currentSectionIdx = frameBody.sections.length - 1;
    renderFrame();
  } catch (err) {
    alert(err.message);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Run
init();
