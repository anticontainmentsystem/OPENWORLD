/**
 * GitHub Data Service
 * Stores posts and profiles as JSON in a GitHub repo
 */

// Data repo - will be created in user's account
const DATA_OWNER = 'anticontainmentsystem';
const DATA_REPO = 'openworld-data';
const DATA_BRANCH = 'main';

// API endpoints
const API_BASE = 'https://api.github.com';

/**
 * Read a JSON file from the data repo
 */
/**
 * Read a JSON file from the data repo
 */
export async function readData(path, token = null) {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${API_BASE}/repos/${DATA_OWNER}/${DATA_REPO}/contents/${path}`,
      { headers }
    );
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const file = await response.json();
    
    if (!file.content) {
      console.warn('[GitHubData] File has no content:', path);
      return { data: [], sha: file.sha };
    }

    let content = decodeURIComponent(escape(window.atob(file.content)));
    
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    try {
      return {
        data: JSON.parse(content),
        sha: file.sha
      };
    } catch (e) {
      console.error('[GitHubData] React content parse error:', e);
      // Return empty data but keep SHA so next write can fix it
      return {
        data: [],
        sha: file.sha
      };
    }
  } catch (error) {
    console.error('[GitHubData] Read error:', error);
    // If it's a 404 (returned null above), we return null. 
    // If it's another error (like 403 rate limit), we should probably re-throw 
    // so we don't accidentally try to overwrite the file thinking it doesn't exist.
    if (error.message.includes('404')) return null;
    throw error;
  }
}

/**
 * Write a JSON file to the data repo (requires auth)
 */
export async function writeData(path, data, sha, token, message) {
  try {
    const content = btoa(JSON.stringify(data, null, 2));
    
    const body = {
      message: message || `Update ${path}`,
      content: content,
      branch: DATA_BRANCH
    };
    
    if (sha) {
      body.sha = sha; // Required for updates
    }
    
    const response = await fetch(
      `${API_BASE}/repos/${DATA_OWNER}/${DATA_REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[GitHubData] Write error:', error);
    throw error;
  }
}

/**
 * Posts API
 */
export const postsAPI = {
  async getAll(token = null) {
    try {
      const result = await readData('posts.json', token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to load posts:', error);
      return [];
    }
  },

  /**
   * Fetch a single post by ID (Secure Proxy)
   */
  async get(postId, token) {
    try {
      const response = await fetch(`/.netlify/functions/get-post?id=${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[PostsAPI] Get error:', error);
      return null;
    }
  },
  
  async create(post, token) {
    // Backend Proxy: use Netlify Function
    try {
      const response = await fetch('/.netlify/functions/create-post', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(post)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }
      
      return await response.json();
    } catch (error) {
      console.error('[PostsAPI] Create error:', error);
      throw error;
    }
  },
  
  async delete(postId, username, token) {
    try {
      const response = await fetch('/.netlify/functions/manage-post', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          postId
        })
      });
      
      const result = await response.json();
      return !!result.success;
    } catch (error) {
      console.error('[PostsAPI] Delete error:', error);
      return false;
    }
  },
  
  async react(postId, reactionType, token) {
    try {
      const response = await fetch('/.netlify/functions/manage-post', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'react',
          postId,
          reactionType
        })
      });
      
      const result = await response.json();
      if (!result.success) return null;

      // Optimistically return the updated post structure (client will incremement locally)
      // Or we could re-fetch. For now, returning minimal object to signal success.
      return { id: postId, reactions: { [reactionType]: 1 } }; 
    } catch (error) {
      console.error('[PostsAPI] React error:', error);
      return null;
    }
  }
};

/**
 * Repositories API (New)
 */
export const reposAPI = {
  async getContents(owner, repo, path = '', token) {
    try {
      // Handle root path
      const queryPath = path ? `&path=${encodeURIComponent(path)}` : '';
      const url = `/.netlify/functions/get-repo-contents?owner=${owner}&repo=${repo}${queryPath}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('[ReposAPI] Contents error:', error);
      return [];
    }
  },

  async getForks(owner, repo, token) {
    try {
      const response = await fetch(`/.netlify/functions/get-forks?owner=${owner}&repo=${repo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('[ReposAPI] Forks error:', error);
      return [];
    }
  },

  async search(query, token) {
    try {
      const response = await fetch(`/.netlify/functions/search-repos?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const repos = await response.json();
      if (repos.error || !Array.isArray(repos)) return [];
      return repos;
    } catch (error) {
      console.error('[ReposAPI] Search error:', error);
      return [];
    }
  }
};

/**
 * Users API
 */
 export const usersAPI = {
  async get(username, token = null) {
    try {
      const result = await readData(`users/${username}.json`, token);
      return result?.data || null;
    } catch (error) {
      return null;
    }
  },
  
  async save(user, token) {
    try {
      const response = await fetch('/.netlify/functions/update-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save profile');
      }
      
      const result = await response.json();
      return result.profile;
    } catch (error) {
      console.error('Failed to save user:', error);
      throw error;
    }
  },
  
  async getAll() {
    try {
      const response = await fetch(
        `${API_BASE}/repos/${DATA_OWNER}/${DATA_REPO}/contents/users`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (!response.ok) return [];
      
      const files = await response.json();
      const users = [];
      
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          const user = await this.get(file.name.replace('.json', ''));
          if (user) users.push(user);
        }
      }
      
      return users;
    } catch (error) {
      console.error('[GitHubData] Get all users error:', error);
      return [];
    }
  }
};
