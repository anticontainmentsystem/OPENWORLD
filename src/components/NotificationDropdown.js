/**
 * Notification Dropdown Component
 * Renders the bell icon and dropdown list
 */
import { notificationService } from '../services/notification.js';
import { formatRelativeTime } from '../services/auth.js';

export class NotificationDropdown {
  constructor(container) {
    this.container = container;
    this.render();
    this.bindEvents();
    
    // Subscribe to updates
    notificationService.subscribe((notifications, unreadCount) => {
      this.updateUI(notifications, unreadCount);
    });
    
    // Start polling
    notificationService.startPolling();
  }

  render() {
    this.container.innerHTML = `
      <div class="notification-wrapper">
        <button class="btn btn--icon notification-trigger" id="notifBtn">
          🔔
          <span class="notification-badge" id="notifBadge" style="display: none;">0</span>
        </button>
        
        <div class="notification-dropdown" id="notifDropdown">
          <div class="notification-header">
            <h3>Notifications</h3>
            <button class="btn btn--text btn--sm" id="markReadBtn">Mark all read</button>
          </div>
          <div class="notification-list" id="notifList">
            <div class="text-dim" style="padding: var(--sp-4); text-align: center;">No notifications</div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const btn = this.container.querySelector('#notifBtn');
    const dropdown = this.container.querySelector('#notifDropdown');
    const markReadBtn = this.container.querySelector('#markReadBtn');

    btn.onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    };

    markReadBtn.onclick = (e) => {
      e.stopPropagation();
      notificationService.markAsRead(); // Mark all
    };

    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });
  }

  updateUI(notifications, unreadCount) {
    const badge = this.container.querySelector('#notifBadge');
    const list = this.container.querySelector('#notifList');

    // Update Badge
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }

    // Update List
    if (notifications.length === 0) {
      list.innerHTML = `<div class="text-dim" style="padding: var(--sp-4); text-align: center;">No notifications</div>`;
      return;
    }

    list.innerHTML = notifications.map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}">
        <div class="notification-icon">
          ${this.getIcon(n.type)}
        </div>
        <div class="notification-content">
          <p class="notification-text">
            <strong>@${n.actor.username}</strong> ${this.getText(n)}
          </p>
          <span class="notification-time">${formatRelativeTime(n.createdAt)}</span>
        </div>
      </div>
    `).join('');
  }

  getIcon(type) {
    switch (type) {
      case 'follow': return '👤';
      case 'star': return '⭐';
      case 'reaction': return '❤️';
      case 'reply': return '💬';
      default: return 'bell';
    }
  }

  getText(n) {
    switch (n.type) {
      case 'follow': return 'started following you';
      case 'star': return `starred <strong>${n.data.repoName}</strong>`;
      case 'reaction': return `reacted to your post`;
      case 'reply': return `replied to your post`;
      default: return 'interacted with you';
    }
  }
}
