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
export async function readData(path) {
  try {
    const response = await fetch(
      `${API_BASE}/repos/${DATA_OWNER}/${DATA_REPO}/contents/${path}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const file = await response.json();
    const content = atob(file.content);
    return {
      data: JSON.parse(content),
      sha: file.sha
    };
  } catch (error) {
    console.error('[GitHubData] Read error:', error);
    return null;
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
    const result = await readData('posts.json');
    return result?.data || [];
  },
  
  async create(post, token) {
    const result = await readData('posts.json');
    const posts = result?.data || [];
    const sha = result?.sha;
    
    posts.unshift(post);
    
    await writeData('posts.json', posts, sha, token, `Add post by @${post.username}`);
    return post;
  },
  
  async delete(postId, username, token) {
    const result = await readData('posts.json');
    if (!result) return false;
    
    const posts = result.data.filter(p => p.id !== postId);
    await writeData('posts.json', posts, result.sha, token, `Delete post by @${username}`);
    return true;
  },
  
  async react(postId, reactionType, token) {
    const result = await readData('posts.json');
    if (!result) return null;
    
    const post = result.data.find(p => p.id === postId);
    if (post && post.reactions[reactionType] !== undefined) {
      post.reactions[reactionType]++;
      await writeData('posts.json', result.data, result.sha, token, `React to post`);
    }
    return post;
  }
};

/**
 * Users API
 */
export const usersAPI = {
  async get(username) {
    const result = await readData(`users/${username}.json`);
    return result?.data || null;
  },
  
  async save(user, token) {
    const result = await readData(`users/${user.username}.json`);
    await writeData(
      `users/${user.username}.json`,
      user,
      result?.sha,
      token,
      `Update profile for @${user.username}`
    );
    return user;
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
