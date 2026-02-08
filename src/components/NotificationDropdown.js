/**
 * Notification Dropdown Component
 * Renders inline notification list in user menu
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
      <div class="notification-menu-wrapper">
        <button class="user-badge__dropdown-item notification-trigger-inline" id="notifBtn">
          <span class="flex items-center gap-2">
             🔔 Notifications
             <span class="notification-badge-inline" id="notifBadge" style="display: none;">0</span>
          </span>
        </button>
        
        <div class="notification-list-inline" id="notifList" style="display: none;">
          <div class="notification-header-inline">
            <button class="btn btn--text btn--xs" id="markReadBtn">Mark all read</button>
          </div>
          <div id="notifItems">
            <div class="text-dim" style="padding: var(--sp-2); text-align: center; font-size: 0.8rem;">No notifications</div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const btn = this.container.querySelector('#notifBtn');
    const list = this.container.querySelector('#notifList');
    const markReadBtn = this.container.querySelector('#markReadBtn');

    btn.onclick = (e) => {
      e.stopPropagation();
      const isHidden = list.style.display === 'none';
      list.style.display = isHidden ? 'block' : 'none';
      btn.classList.toggle('active', !isHidden);
    };

    markReadBtn.onclick = (e) => {
      e.stopPropagation();
      notificationService.markAsRead(); 
    };
    
    // Handle Item Clicks (Delegation)
    list.onclick = (e) => {
      e.stopPropagation();
      
      const item = e.target.closest('.notification-item-inline');
      if (!item) return;

      // If clicked the actor link specifically, let it handle navigation
      if (e.target.closest('.notif-actor-link')) {
        return;
      }
      
      // Otherwise navigate to context
      const url = item.dataset.url;
      if (url) {
        window.location.href = url;
      }
    };
  }

  updateUI(notifications, unreadCount) {
    const badge = this.container.querySelector('#notifBadge');
    const listItems = this.container.querySelector('#notifItems');

    // Update Badge
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }

    // Update List
    if (notifications.length === 0) {
      listItems.innerHTML = `<div class="text-dim" style="padding: var(--sp-2); text-align: center; font-size: 0.8rem;">No notifications</div>`;
      return;
    }

    listItems.innerHTML = notifications.map(n => `
      <div class="notification-item-inline ${n.read ? '' : 'unread'}" data-url="${this.getUrl(n)}" style="cursor: pointer;">
        <div class="notification-icon-inline">
          ${this.getIcon(n.type)}
        </div>
        <div class="notification-content">
          <p class="notification-text">
            <strong><a href="/pillars/community/profile.html?user=${n.actor.username}" class="notif-actor-link">@${n.actor.username}</a></strong> ${this.getText(n)}
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

  getUrl(n) {
    switch (n.type) {
      case 'follow': 
        return `/pillars/community/profile.html?user=${n.actor.username}`;
      case 'star':
        return `https://github.com/${n.data.repoName}`;
      case 'reaction':
      case 'reply':
        return `/pillars/community/?post=${n.data.postId}`; // Simplified deep link
      default: 
        return '#';
    }
  }
}
