/**
 * FrameCard Component
 * Renders a frame card for the Knowledge Portal listing grid
 */

const CATEGORY_COLORS = {
  coding: '#79c0ff',
  art: '#f778ba',
  music: '#d2a8ff',
  writing: '#a5d6ff',
  engineering: '#79c0ff',
  photography: '#ffa657',
  design: '#ff7b72',
  science: '#56d364',
  craft: '#e3b341',
  other: '#8b949e'
};

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export class FrameCard {
  constructor(frame, options = {}) {
    this.frame = frame;
    this.onClick = options.onClick || (() => {});
  }

  render() {
    const f = this.frame;
    const catColor = CATEGORY_COLORS[f.category] || CATEGORY_COLORS.other;
    const isArchived = f.status === 'archived';

    const el = document.createElement('a');
    el.href = `/pillars/knowledge/frame.html?id=${f.id}`;
    el.className = `frame-card${isArchived ? ' frame-card--archived' : ''}`;
    el.onclick = (e) => {
      if (this.onClick(f, e) === false) e.preventDefault();
    };

    el.innerHTML = `
      <div class="frame-card__header">
        <span class="frame-card__icon">${f.icon || '📡'}</span>
        <span class="frame-card__category" style="color: ${catColor}">${f.category}</span>
        ${isArchived ? '<span class="frame-card__status">archived</span>' : ''}
      </div>
      <h3 class="frame-card__title">${this.escapeHtml(f.title)}</h3>
      <p class="frame-card__desc">${this.escapeHtml(f.description)}</p>
      ${f.tags && f.tags.length > 0 ? `
        <div class="frame-card__tags">
          ${f.tags.map(t => `<span class="frame-card__tag">${this.escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}
      <div class="frame-card__meta">
        <img src="${f.creatorAvatar}" alt="${f.creatorUsername}" class="frame-card__avatar">
        <span class="frame-card__creator">${this.escapeHtml(f.creatorUsername)}</span>
        <span class="frame-card__dot">·</span>
        <span class="frame-card__members">${f.memberCount || 1} member${(f.memberCount || 1) !== 1 ? 's' : ''}</span>
        <span class="frame-card__dot">·</span>
        <span class="frame-card__time">${timeAgo(f.lastActivityAt || f.createdAt)}</span>
      </div>
    `;

    return el;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
