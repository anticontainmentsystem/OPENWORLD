import { auth, formatRelativeTime } from '../services/auth.js';
import { LANGUAGES } from './code-editor.js';

export function renderPostCard(post) {
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
  
  const codeHtml = post.code ? `
    <div class="code-block" data-post-code>
      <div class="code-block__header">
        <span class="code-block__language">${LANGUAGES.find(l => l.id === post.code.language)?.name || post.code.language}</span>
        <button class="code-block__copy" title="Copy code" data-code="${encodeURIComponent(post.code.code)}">📋</button>
      </div>
      <pre class="code-block__body"><code>${escapeHtml(post.code.code)}</code></pre>
    </div>
  ` : '';

  let activityHtml = '';
  if (post.activity) {
      const act = post.activity;
      let icon, title, desc, link;
      
      if (act.type === 'commit') {
          icon = '📝';
          title = `Commit on ${act.repo.name}`;
          desc = act.commit.message;
          link = act.commit.html_url || act.commit.url;
      } else if (act.type === 'issue') {
          icon = '🐛';
          title = `Issue #${act.issue.number}: ${act.issue.title}`;
          desc = `State: ${act.issue.state}`;
          link = act.issue.html_url;
      } else if (act.type === 'pr') {
          icon = '🔀';
          title = `PR #${act.pr.number}: ${act.pr.title}`;
          desc = `State: ${act.pr.state}`;
          link = act.pr.html_url;
      }
      
      activityHtml = `
        <a href="${link}" target="_blank" class="activity-card-embed" style="display: flex; gap: 12px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin-top: 12px; text-decoration: none; color: inherit; background: var(--surface);">
           <div style="font-size: 1.5rem;">${icon}</div>
           <div style="min-width: 0;">
              <div style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</div>
              <div class="text-dim text-sm" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${desc}</div>
           </div>
        </a>
      `;
  }
  
  // Media rendering (image/video/gif)
  let mediaHtml = '';
  if (post.media && post.media.url) {
    const mediaUrl = post.media.url.startsWith('github://') 
      ? convertGitHubUrl(post.media.url)
      : post.media.url;
    
    if (post.media.type === 'video') {
      mediaHtml = `
        <div class="post-card__media post-card__media--video">
          <video controls preload="metadata" playsinline>
            <source src="${escapeHtml(mediaUrl)}" type="video/mp4">
            Your browser does not support video playback.
          </video>
        </div>
      `;
    } else {
      // image or gif
      mediaHtml = `
        <div class="post-card__media">
          <img src="${escapeHtml(mediaUrl)}" alt="Post media" loading="lazy" onclick="this.classList.toggle('expanded')">
        </div>
      `;
    }
  }
  
  const totalReactions = Object.values(post.reactions || { fire: 0 }).reduce((a, b) => a + b, 0);
  const currentUser = auth.getUser();
  
  // Robust check: Match ID (loose) OR Username (fallback)
  // This ensures buttons appear even if ID formats drift, backend still validates security.
  const isOwner = currentUser && (
    String(post.userId) === String(currentUser.id) || 
    post.username === currentUser.username
  );

  const isDeleted = post.deleted;

  // Trash View State
  if (isDeleted) {
    return `
      <article class="post-card post-card--deleted" data-post-id="${post.id}">
        <div class="post-card__content text-dim">
          🗑️ <strong>Deleted Post</strong> <span class="text-muted">(${formatRelativeTime(post.deletedAt)})</span>
        </div>
        ${isOwner ? `
          <footer class="post-card__actions">
            <button class="post-card__action text-moss" data-action="restore" data-post-id="${post.id}">
              ♻️ Restore
            </button>
            <button class="post-card__action text-dim" style="margin-left: auto;" title="Permanent delete coming soon">
              ⚠️ Purge
            </button>
          </footer>
        ` : ''}
      </article>
    `;
  }
  
  // Edit History Badge
  const isEdited = post.versions && post.versions.length > 0;
  const editedBadge = isEdited 
    ? `<a href="#" class="post-card__edited-badge" data-action="history" data-post-id="${post.id}" title="View Edit History">(edited)</a>` 
    : '';

  // Modular structure: Text → Media → Attachments (code, repo, activity)
  return `
    <article class="post-card" data-post-id="${post.id}">
      <header class="post-card__header">
        <a href="/pillars/community/profile.html?user=${post.username}" class="post-card__avatar-link">
          <img src="${post.userAvatar}" alt="${post.userName}" class="post-card__avatar">
        </a>
        <div class="post-card__meta">
          <div class="post-card__author">
            <a href="/pillars/community/profile.html?user=${post.username}" class="post-card__name">${post.userName}</a>
            <a href="/pillars/community/profile.html?user=${post.username}" class="post-card__username">@${post.username}</a>
          </div>
          <div class="post-card__time">
             ${formatRelativeTime(post.createdAt)}
             ${editedBadge}
          </div>
        </div>
        ${post.type ? `<span class="post-card__type post-card__type--${post.type}">${typeLabels[post.type] || post.type}</span>` : ''}
      </header>
      
      ${post.content ? `<div class="post-card__content">${escapeHtml(post.content)}</div>` : ''}
      
      ${mediaHtml}
      
      ${codeHtml}
      
      ${activityHtml}
      
      ${repoHtml}
      
      <footer class="post-card__actions">
        <button class="post-card__action" data-action="react" data-post-id="${post.id}">
          🔥 <span>${totalReactions}</span>
        </button>
        <button class="post-card__action" data-action="comment" data-post-id="${post.id}">
          💬 <span>${Array.isArray(post.comments) ? post.comments.length : 0}</span>
        </button>
        ${isOwner ? `
          <div style="margin-left: auto; display: flex; gap: 8px;">
            <button class="post-card__action" data-action="edit" data-post-id="${post.id}">✏️</button>
            <button class="post-card__action" data-action="delete" data-post-id="${post.id}">🗑️</button>
          </div>
        ` : ''}
      </footer>
      <div class="post-card__comments" id="comments-${post.id}" style="display: none;"></div>
    </article>
  `;
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Convert github:// URL to raw GitHub content URL
 * Format: github://owner/repo/path/to/file.ext
 */
function convertGitHubUrl(githubUrl) {
  if (!githubUrl.startsWith('github://')) return githubUrl;
  const path = githubUrl.replace('github://', '');
  const parts = path.split('/');
  if (parts.length < 3) return githubUrl;
  const owner = parts[0];
  const repo = parts[1];
  const filePath = parts.slice(2).join('/');
  return `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
}
