/**
 * OpenWorld — Main Entry Point
 * The living nervous system of the portal
 */

import { auth } from './services/auth.js';

// ═══════════════════════════════════════════════════════════════════════════
// AUTH HANDLING FOR PORTAL
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
    renderUserBadge(user);
  } else {
    renderLoginButton();
  }
}

function renderUserBadge(user) {
  userBadge.innerHTML = `
    <button class="user-badge__trigger" id="userBadgeTrigger">
      <img src="${user.avatar}" alt="${user.name}" class="user-badge__avatar">
      <span class="user-badge__name">${user.username}</span>
      <span class="user-badge__chevron">▼</span>
    </button>
    <div class="user-badge__dropdown">
      <div class="user-badge__dropdown-header">
        <div class="user-badge__dropdown-name">${user.name}</div>
        <div class="user-badge__dropdown-username">@${user.username}</div>
      </div>
      <ul class="user-badge__dropdown-menu">
        <li><a href="/pillars/community/profile.html" class="user-badge__dropdown-item">👤 Your Profile</a></li>
        <li><a href="/pillars/community/" class="user-badge__dropdown-item">🌐 Community</a></li>
        <li class="user-badge__dropdown-divider"></li>
        <li><button class="user-badge__dropdown-item user-badge__dropdown-item--danger" id="logoutBtn">🚪 Sign Out</button></li>
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
  
  document.getElementById('navLoginBtn').addEventListener('click', async () => {
    const btn = document.getElementById('navLoginBtn');
    btn.textContent = 'Signing in...';
    await auth.login();
  });
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', initAuth);

// ═══════════════════════════════════════════════════════════════════════════
// PORTAL ANIMATIONS & INTERACTIONS
// ═══════════════════════════════════════════════════════════════════════════
// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Intersection Observer for fade-in animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const fadeInObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('ow-visible');
      fadeInObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all pillar cards and sections
document.querySelectorAll('.ow-pillar-card, .ow-manifesto__principle').forEach(el => {
  el.classList.add('ow-fade-in');
  fadeInObserver.observe(el);
});

// Dynamic ambient orb movement based on mouse
const ambient = document.querySelector('.ow-ambient');
if (ambient) {
  const orbs = ambient.querySelectorAll('.ow-ambient__orb');
  
  document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    orbs.forEach((orb, i) => {
      const factor = (i + 1) * 10;
      const translateX = (x - 0.5) * factor;
      const translateY = (y - 0.5) * factor;
      orb.style.transform = `translate(${translateX}px, ${translateY}px)`;
    });
  });
}

// Navigation background on scroll
const nav = document.querySelector('.ow-nav');
if (nav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('ow-nav--scrolled');
    } else {
      nav.classList.remove('ow-nav--scrolled');
    }
  });
}

// Console signature
console.log(`
%c◈ OpenWorld
%cA living creative ecosystem

https://openworld.dev
`, 
'color: #00f5d4; font-size: 24px; font-weight: bold;',
'color: #a0a0b5; font-size: 12px;'
);

// Inject fade-in styles dynamically
const style = document.createElement('style');
style.textContent = `
  .ow-fade-in {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .ow-visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .ow-nav--scrolled {
    background: rgba(10, 10, 15, 0.95);
  }
`;
document.head.appendChild(style);
