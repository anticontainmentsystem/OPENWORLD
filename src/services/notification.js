/**
 * Notification Service
 * Polls backend for new notifications
 */
import { auth } from './auth.js';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.listeners = [];
    this.pollingInterval = null;
  }

  startPolling() {
    if (this.pollingInterval) return;
    
    // Initial fetch
    this.fetchNotifications();
    
    // Poll every 60s
    this.pollingInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && auth.isLoggedIn()) {
        this.fetchNotifications();
      }
    }, 60000);
  }

  async fetchNotifications() {
    const token = auth.getAccessToken();
    if (!token) return;

    try {
      const response = await fetch('/.netlify/functions/get-notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) return;
      
      this.notifications = await response.json();
      this.updateUnreadCount();
      this.notify();
      
    } catch (error) {
      console.error('[Notifications] Fetch error:', error);
    }
  }

  async markAsRead(notificationIds = null) {
    const token = auth.getAccessToken();
    if (!token) return;

    // Optimistic update
    if (!notificationIds) {
      // Mark all
      this.notifications.forEach(n => n.read = true);
    } else {
      this.notifications.forEach(n => {
        if (notificationIds.includes(n.id)) n.read = true;
      });
    }
    this.updateUnreadCount();
    this.notify();

    try {
      await fetch('/.netlify/functions/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          notificationIds, 
          markAll: !notificationIds 
        })
      });
    } catch (error) {
      console.error('[Notifications] Mark read error:', error);
    }
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  subscribe(callback) {
    this.listeners.push(callback);
    // Immediate callback
    callback(this.notifications, this.unreadCount);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.notifications, this.unreadCount));
  }
}

export const notificationService = new NotificationService();
