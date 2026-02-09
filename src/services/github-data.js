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
  async getAll() {
    try {
      // Phase 2: Use Sharded/Cached Feed Endpoint
      const response = await fetch('/.netlify/functions/get-feed');
      if (!response.ok) throw new Error('Failed to fetch feed');
      
      const posts = await response.json();
      return posts; // Return array directly (was wrapped in {data})
    } catch (error) {
      console.error('[PostsAPI] Get error:', error);
      return [];
    }
  },

  // Write (Queued + Optimistic)
  async create(post, token) {
     // 1. Prepare Optimistic Data
     const tempId = `post_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
     const optimisticPost = {
         id: tempId,
         key: tempId, // for React
         createdAt: new Date().toISOString(),
         reactions: { fire: 0 },
         replyCount: 0,
         ...post
     };
     
     // 2. Add to Queue (Background Sync)
     // We pass the RAW post data needed by the function
     queue.add({
         type: 'create',
         data: post
     });
     
     // 3. Return immediately
     return optimisticPost;
  },
  
  async delete(postId, username, token) {
    queue.add({
        type: 'delete',
        data: { postId }
    });
    return true;
  },
  
  async edit(postId, postData, token) {
      // postData is { content, repo, media, activity, code }
      queue.add({
          type: 'edit',
          data: { postId, ...postData }
      });
      return true;
  },
  
  async react(postId, reactionType, token) {
    queue.add({
        type: 'react',
        data: { postId, reactionType }
    });
    // Optimistic toggle return logic is handled by UI state usually, 
    // but the caller expects a result. We'll return a fake success.
    return { success: true }; 
  }
};

/**
 * Comments API
 */
export const commentsAPI = {
  async add(postId, content, attachments, token) {
    try {
      const response = await fetch('/.netlify/functions/add-comment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId, content, attachments })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add comment');
      }
      
      return result.comment;
    } catch (error) {
      console.error('[CommentsAPI] Add error:', error);
      throw error;
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
  },

  async getStarred(username, token) {
    try {
      const response = await fetch(`${API_BASE}/users/${username}/starred?sort=created&direction=desc`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('[ReposAPI] GetStarred error:', error);
      return [];
    }
  }
};

/**
 * Users API
 */
 export const usersAPI = {
  async getEvents(username, token = null) {
      try {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(`${API_BASE}/users/${username}/events`, { headers });
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error('[UsersAPI] Events error:', error);
        return [];
      }
  },

  async get(username, token = null) {
    // 1. Try our internal DB first
    try {
      const result = await readData(`users/${username}.json`, token);
      if (result?.data) return result.data;
    } catch (ignore) {
      // Ignore read errors, proceed to fallback
    }

    // 2. Fallback to GitHub API (User might exist but not have a profile file)
    try {
       console.log(`[UsersAPI] Falling back to GitHub for ${username}`);
       const headers = { 'Accept': 'application/vnd.github.v3+json' };
       if (token) headers['Authorization'] = `Bearer ${token}`;
       
       const res = await fetch(`${API_BASE}/users/${username}`, { headers });
       if (!res.ok) return null;
       
       const ghUser = await res.json();
       
       // Return a normalized profile object
       return {
           id: String(ghUser.id),
           username: ghUser.login, // Use correct casing from GitHub
           name: ghUser.name || ghUser.login,
           avatar: ghUser.avatar_url,
           bio: ghUser.bio,
           location: ghUser.location,
           joinedAt: ghUser.created_at,
           followers: ghUser.followers,
           following: ghUser.following,
           repos: [], // Base fallback has no cached repos
           website: ghUser.blog || ghUser.html_url
       };
    } catch (e) {
        console.error('GitHub user fetch failed', e);
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
