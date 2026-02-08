/**
 * GitHub API Utility (Backend Proxy)
 * Uses System PAT for internal operations (Create Post, Delete, etc.)
 */

const { GITHUB_OWNER, GITHUB_REPO } = process.env;
const GITHUB_PAT = process.env.GITHUB_PAT ? process.env.GITHUB_PAT.trim() : '';

// Config
const DATA_OWNER = GITHUB_OWNER || 'anticontainmentsystem';
const DATA_REPO = GITHUB_REPO || 'openworld-data';
const DATA_BRANCH = 'main';
const API_BASE = 'https://api.github.com';

// Validate PAT on startup
if (!GITHUB_PAT) {
  console.error('[System] GITHUB_PAT is missing from environment variables!');
} else if (!GITHUB_PAT.startsWith('github_pat_')) {
  console.warn('[System] GITHUB_PAT does not start with "github_pat_". It might be a classic token or malformed.');
} else {
  console.log(`[System] GITHUB_PAT loaded (starts with ${GITHUB_PAT.substring(0, 15)}...)`);
}

/**
 * Read file from data repo using System PAT
 */
export async function readData(path) {
  try {
    const response = await fetch(
      `${API_BASE}/repos/${DATA_OWNER}/${DATA_REPO}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_PAT}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API Error ${response.status}: ${await response.text()}`);
    }

    const file = await response.json();
    
    // Log content type for debugging
    console.log(`[System] Read ${path}: Type=${file.type}, Encoding=${file.encoding}, Size=${file.size}`);

    if (!file.content) {
       console.warn(`[System] File ${path} has no content field`);
       return { data: [], sha: file.sha };
    }

    let content = Buffer.from(file.content, 'base64').toString('utf-8');
    
    // Remove BOM if present
    if (content.length > 0 && content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }

    try {
      return {
        data: JSON.parse(content),
        sha: file.sha
      };
    } catch (parseError) {
      console.error(`[System] JSON parse error for ${path}:`, parseError);
      return { data: [], sha: file.sha };
    }
  } catch (error) {
    console.error(`[System] Read error for ${path}:`, error);
    if (error.message.includes('404')) return null;
    throw error;
  }
}

/**
 * Write file to data repo using System PAT
 */
export async function writeData(path, data, sha, message) {
  try {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    const body = {
      message: message,
      content: content,
      branch: DATA_BRANCH
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(
      `${API_BASE}/repos/${DATA_OWNER}/${DATA_REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_PAT}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API Error ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[System] Write error for ${path}:`, error);
    throw error;
  }
}
