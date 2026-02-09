/**
 * OpenWorld Developer Portal
 * API Explorer Logic
 */

import { auth } from './services/auth.js';

// DOM Elements
const userBadge = document.getElementById('userBadge');
const consoleContext = document.getElementById('consoleContext');
const contextUser = document.getElementById('contextUser');
const methodSelect = document.getElementById('methodSelect');
const endpointInput = document.getElementById('endpointInput');
const bodyInput = document.getElementById('bodyInput');
const bodySection = document.getElementById('bodySection');
const sendBtn = document.getElementById('sendBtn');
const responseOutput = document.getElementById('responseOutput');
const diagnosticsArea = document.getElementById('diagnosticsArea');

// Initialize
function init() {
  initAuth();
  setupEventListeners();
  updateBodyVisibility();
}

function setupEventListeners() {
  // Method change toggles body visibility
  methodSelect.addEventListener('change', updateBodyVisibility);

  // Send Request
  sendBtn.addEventListener('click', executeRequest);

  // Presets
  document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
      // populate logic
      methodSelect.value = card.dataset.method;
      const endpoint = card.dataset.endpoint;
      endpointInput.value = endpoint;
      
      const bodyStr = card.dataset.body;
      if (bodyStr) {
        try {
           bodyInput.value = JSON.stringify(JSON.parse(bodyStr), null, 2);
        } catch(e) {
           bodyInput.value = bodyStr;
        }
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

function initAuth() {
  auth.subscribe(user => {
    if (user) {
      userBadge.innerHTML = `
        <div class="user-badge__trigger">
          <img src="${user.avatar}" class="user-badge__avatar">
          <span>${user.username}</span>
        </div>
      `;
      // Update Console Context
      contextUser.textContent = user.username;
      consoleContext.style.display = 'flex';
      
    } else {
      userBadge.innerHTML = `<button id="loginBtn" class="console-btn small">Sign In</button>`;
      document.getElementById('loginBtn')?.addEventListener('click', () => auth.login());
      
      // Hide Context
      consoleContext.style.display = 'none';
    }
  });
  
  // Trigger initial load
  auth.getUser(); 
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
  diagnosticsArea.style.display = 'none';
  diagnosticsArea.innerHTML = '';
  
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
        throw new Error('Invalid JSON in request body. Please check commas and quotes.');
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
    let json = null;
    
    if (contentType && contentType.includes('application/json')) {
      json = await response.json();
      text = JSON.stringify(json, null, 2);
      responseOutput.innerHTML = syntaxHighlight(text);
    } else {
      text = await response.text();
       // Try to parse JSON from text even if header is wrong
       try {
          json = JSON.parse(text);
          text = JSON.stringify(json, null, 2);
          responseOutput.innerHTML = syntaxHighlight(text);
       } catch(e) {
          responseOutput.textContent = text;
       }
    }
    
    // Run Diagnostics
    checkDiagnostics(response.status, json, endpoint);
    
  } catch (error) {
    statusCode.textContent = 'Error';
    statusCode.className = 'status-badge error';
    responseOutput.textContent = error.message;
    
    checkDiagnostics(0, { error: error.message }, endpoint);
  } finally {
    sendBtn.textContent = 'Run';
    sendBtn.disabled = false;
  }
}

function checkDiagnostics(status, data, endpoint) {
  let suggestions = [];
  
  // 1. Auth Issues
  if (status === 401) {
    suggestions.push({
      title: 'Authentication Required',
      desc: 'You are not logged in or your token is invalid. Please sign in using the button in the top right.',
      action: 'Sign In',
      handler: () => auth.login()
    });
  }
  
  // 2. JSON Issues
  if (data?.error && data.error.includes('JSON')) {
     suggestions.push({
      title: 'Invalid JSON',
      desc: 'The request body is malformed. Check for trailing commas or missing quotes.',
    });
  }

  // 3. Method Not Allowed
  if (status === 405) {
     suggestions.push({
      title: 'Wrong HTTP Method',
      desc: `The endpoint '${endpoint}' does not support this method. Try switching GET/POST.`,
    });
  }
  
  // 4. Rate Limit (Logic guess based on 429 or generic 500s from fast clicking)
  if (status === 429) {
     suggestions.push({
      title: 'Rate Limited',
      desc: 'You are sending requests too fast. Please wait a moment.',
    });
  }

  // Render Suggestions
  if (suggestions.length > 0) {
    diagnosticsArea.innerHTML = suggestions.map((s, i) => `
      <div class="diagnostic-card">
        <div class="diagnostic-icon">💡</div>
        <div class="diagnostic-content">
          <strong>${s.title}</strong>
          <p>${s.desc}</p>
          ${s.action ? `<button class="diagnostic-btn" id="diagBtn${i}">${s.action}</button>` : ''}
        </div>
      </div>
    `).join('');
    
    diagnosticsArea.style.display = 'block';
    
    // Bind actions
    suggestions.forEach((s, i) => {
      if (s.action) {
        document.getElementById(`diagBtn${i}`).addEventListener('click', s.handler);
      }
    });
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
