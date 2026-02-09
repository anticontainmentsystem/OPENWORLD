/**
 * OpenWorld Developer Portal
 * API Explorer Logic
 */

import { auth } from './services/auth.js';

// DOM Elements
const userBadge = document.getElementById('userBadge');
const methodSelect = document.getElementById('methodSelect');
const endpointInput = document.getElementById('endpointInput');
const bodyInput = document.getElementById('bodyInput');
const bodySection = document.getElementById('bodySection');
const sendBtn = document.getElementById('sendBtn');
const responseOutput = document.getElementById('responseOutput');
const statusCode = document.getElementById('statusCode');
const timingBadge = document.getElementById('timingBadge');

// State
let startTime = 0;

// Initialize
function init() {
  initAuth();
  setupEventListeners();
  updateBodyVisibility();
}

function initAuth() {
  auth.subscribe(user => {
    if (user) {
      userBadge.innerHTML = `
        <div class="user-badge__trigger">
          <img src="${user.avatar}" class="user-badge__avatar">
          <span>${user.username}</span>
        </div>
      `;
    } else {
      userBadge.innerHTML = `<button id="loginBtn" class="console-btn small">Sign In</button>`;
      document.getElementById('loginBtn')?.addEventListener('click', () => auth.login());
    }
  });
  
  // Trigger initial load
  auth.getUser(); // Triggers listener if already loaded, or we wait
}

function setupEventListeners() {
  // Method change toggles body visibility
  methodSelect.addEventListener('change', updateBodyVisibility);

  // Send Request
  sendBtn.addEventListener('click', executeRequest);

  // Presets
  document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
      methodSelect.value = card.dataset.method;
      endpointInput.value = card.dataset.endpoint;
      
      if (card.dataset.body) {
        bodyInput.value = JSON.stringify(JSON.parse(card.dataset.body), null, 2);
      }
      
      updateBodyVisibility();
      
      // Highlight effect
      card.style.borderColor = 'var(--text-main)';
      setTimeout(() => card.style.borderColor = '', 300);
    });
  });
}

function updateBodyVisibility() {
  const method = methodSelect.value;
  bodySection.style.display = (method === 'POST' || method === 'PUT') ? 'block' : 'none';
}

async function executeRequest() {
  const method = methodSelect.value;
  const endpoint = endpointInput.value.replace(/^\//, ''); // Remove leading slash
  const url = `/.netlify/functions/${endpoint}`;
  
  sendBtn.textContent = 'Wait...';
  sendBtn.disabled = true;
  responseOutput.textContent = 'Fetching...';
  statusCode.textContent = '';
  timingBadge.textContent = '';
  responseOutput.className = 'console-output';
  
  startTime = performance.now();
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add Auth Token
    const token = auth.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('No auth token found. Request might fail.');
    }
    
    const options = {
      method,
      headers
    };
    
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const bodyText = bodyInput.value.trim();
        if (bodyText) {
          options.body = JSON.stringify(JSON.parse(bodyText));
        }
      } catch (e) {
        throw new Error('Invalid JSON in request body');
      }
    }
    
    const response = await fetch(url, options);
    const endTime = performance.now();
    
    // Render Status
    statusCode.textContent = `${response.status} ${response.statusText}`;
    statusCode.className = `status-badge ${response.ok ? 'success' : 'error'}`;
    timingBadge.textContent = `${Math.round(endTime - startTime)}ms`;
    
    // Render Body
    const contentType = response.headers.get('content-type');
    let text;
    
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json();
      text = JSON.stringify(json, null, 2);
      responseOutput.innerHTML = syntaxHighlight(text);
    } else {
      text = await response.text();
      responseOutput.textContent = text;
    }
    
  } catch (error) {
    statusCode.textContent = 'Error';
    statusCode.className = 'status-badge error';
    responseOutput.textContent = error.message;
  } finally {
    sendBtn.textContent = 'Run';
    sendBtn.disabled = false;
  }
}

// Simple JSON Syntax Highlighter
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

// Run
init();
