/**
 * OpenWorld Portal — Main Entry Point
 */

import { auth } from './services/auth.js';
import { NotificationDropdown } from './components/NotificationDropdown.js';
import { initCursorTrail } from './components/CursorTrail.js';

// Initialize Easter Eggs
initCursorTrail();

// Add styles
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/src/styles/notification.css';
document.head.appendChild(link);

// ═══════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════

const userBadge = document.getElementById('userBadge');

function initAuth() {
  if (!userBadge) return;
  auth.subscribe(updateAuthUI);
  updateAuthUI(auth.getUser());
}

function updateAuthUI(user) {
  if (!userBadge) return;
  
  if (user) {
    userBadge.innerHTML = `
      <button class="user-badge__trigger" id="userBadgeTrigger">
        <img src="${user.avatar}" alt="${user.name}" class="user-badge__avatar">
        <span class="user-badge__name">${user.username}</span>
      </button>
      <div class="user-badge__dropdown" id="userDropdown">
        <div class="user-badge__dropdown-header">
          <div class="user-badge__dropdown-name">${user.name}</div>
          <div class="user-badge__dropdown-username">@${user.username}</div>
        </div>
        <ul class="user-badge__dropdown-menu">
          <li><a href="/pillars/community/profile.html" class="user-badge__dropdown-item">👤 Profile</a></li>
          <li><a href="/pillars/community/" class="user-badge__dropdown-item">🌐 Community</a></li>
          
          <!-- Notification Container -->
          <li id="notificationContainer"></li>
          
          <li class="user-badge__dropdown-divider"></li>
          <li><button class="user-badge__dropdown-item" id="logoutBtn">Sign Out</button></li>
        </ul>
      </div>
    `;
    
    // Init Notification Dropdown
    const notifContainer = userBadge.querySelector('#notificationContainer');
    if(notifContainer) {
       new NotificationDropdown(notifContainer);
    }

    const trigger = userBadge.querySelector('#userBadgeTrigger');
    
    trigger.onclick = (e) => {
       e.stopPropagation();
       userBadge.classList.toggle('user-badge--open');
    };

    document.addEventListener('click', () => userBadge.classList.remove('user-badge--open'));
    document.getElementById('logoutBtn').addEventListener('click', () => auth.logout());
  } else {
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
}

document.addEventListener('DOMContentLoaded', initAuth);

// ═══════════════════════════════════════════════════════════════════════════
// SMOOTH SCROLL
// ═══════════════════════════════════════════════════════════════════════════

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Console signature
console.log('%c◈ OpenWorld', 'color: #b87333; font-size: 20px; font-weight: bold;');
