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
const statusCode = document.getElementById('statusCode');
const timingBadge = document.getElementById('timingBadge');
const uniSearchInput = document.getElementById('uniSearchInput');
const uniSearchBtn = document.getElementById('uniSearchBtn');
const uniSearchResults = document.getElementById('uniSearchResults');

// State
let startTime = 0;

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

  // Universal Search
  uniSearchBtn.addEventListener('click', performUniversalSearch);
  uniSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performUniversalSearch();
  });

  // Presets
  document.querySelectorAll('.preset-card').forEach(card => {
    // ... existing preset logic ...
    card.addEventListener('click', () => {
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

// ... existing updateBodyVisibility and initAuth ...

// Universal Search Logic
async function performUniversalSearch() {
  const query = uniSearchInput.value.trim();
  if (!query) return;

  uniSearchBtn.textContent = '...';
  uniSearchBtn.disabled = true;
  uniSearchResults.innerHTML = '<p class="text-dim text-xs">Searching OpenWorld...</p>';

  try {
    const results = [];

    // Parallel Search
    const [profileRes, reposRes] = await Promise.all([
      // 1. Search Users (via get-profile)
      fetch(`/.netlify/functions/get-profile?username=${query}`),
      // 2. Search Repos
      fetch(`/.netlify/functions/search-repos?q=${query}`)
    ]);

    // Process User
    if (profileRes.ok) {
      const user = await profileRes.json();
      results.push({
        type: 'user',
        title: user.login || query,
        data: user
      });
    }

    // Process Repos
    if (reposRes.ok) {
      const repos = await reposRes.json();
      if (Array.isArray(repos) && repos.length > 0) {
        repos.forEach(repo => {
          results.push({
            type: 'repo',
            title: repo.name,
            data: repo
          });
        });
      }
    }

    // Render
    renderSearchResults(results);

  } catch (error) {
    uniSearchResults.innerHTML = `<p class="text-error text-xs">Search failed: ${error.message}</p>`;
  } finally {
    uniSearchBtn.textContent = 'Search';
    uniSearchBtn.disabled = false;
  }
}

function renderSearchResults(results) {
  if (results.length === 0) {
    uniSearchResults.innerHTML = '<p class="text-dim text-xs">No results found.</p>';
    return;
  }

  uniSearchResults.innerHTML = results.map((item, index) => `
    <div class="result-item" onclick="loadResultIntoConsole(${index})">
      <span class="result-type ${item.type}">${item.type}</span>
      <div class="result-title">${item.title}</div>
      ${renderstats(item)}
    </div>
  `).join('');

  // Store results globally or attaches to DOM for click handler? 
  // Easy hack: attach to window for onclick (not best practice but works for simple console)
  window.lastSearchResults = results;
}

function renderstats(item) {
  if (item.type === 'repo') {
    return `<div class="mt-1">
      <span class="result-stat">★ ${item.stargazers_count || 0}</span>
      <span class="result-stat">🍴 ${item.forks_count || 0}</span>
    </div>`;
  }
  if (item.type === 'user') {
    return `<div class="mt-1">
      <span class="result-stat">${item.public_repos || 0} Repos</span>
      <span class="result-stat">${item.followers || 0} Followers</span>
    </div>`;
  }
  return '';
}

// Global handler for result clicks
window.loadResultIntoConsole = (index) => {
  const item = window.lastSearchResults[index];
  if (!item) return;

  // Populate Console
  responseOutput.innerHTML = syntaxHighlight(JSON.stringify(item.data, null, 2));
  responseOutput.scrollIntoView({ behavior: 'smooth' });
  
  // Update badges
  const statusCode = document.getElementById('statusCode'); // Re-selecting here safely
  if(statusCode) {
    statusCode.textContent = '200 OK (Preview)';
    statusCode.className = 'status-badge success';
  }
};

// ... existing executeRequest and checkDiagnostics ...

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
