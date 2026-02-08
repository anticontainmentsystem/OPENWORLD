/**
 * OpenWorld Auth Service
 * Real GitHub OAuth via Netlify Functions + GitHub data storage
 */

import { postsAPI, usersAPI } from './github-data.js';

const STORAGE_KEY = 'openworld_user';

class AuthService {
  constructor() {
    this.user = this.loadUser();
    this.listeners = [];
  }

  loadUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const user = stored ? JSON.parse(stored) : null;
      
      if (user) {
        if (!user.accessToken) {
          console.warn('[Auth] User data missing valid access token. Clearing session.');
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        console.log('[Auth] User loaded:', user.username);
      }
      return user;
    } catch (e) {
      console.error('[Auth] Error loading user:', e);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  getUser() {
    return this.user;
  }

  getAccessToken() {
    return this.user?.accessToken || null;
  }

  isLoggedIn() {
    return !!this.user;
  }

  login() {
    window.location.href = '/.netlify/functions/auth-login';
  }

  logout() {
    this.user = null;
    localStorage.removeItem(STORAGE_KEY);
    this.notify();
  }

  updateProfile(updates) {
    if (!this.user) return;
    
    this.user = { ...this.user, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user));
    
    // Also save to GitHub
    const token = this.getAccessToken();
    if (token) {
      usersAPI.save(this.user, token).catch(console.error);
    }
    
    this.notify();
  }

  async followUser(targetUsername, action = 'follow') {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not logged in');

    // Optimistic Update
    if (this.user) {
      let list = this.user.followingList || [];
      if (action === 'follow' && !list.includes(targetUsername)) {
        list.push(targetUsername);
        this.user.following = (this.user.following || 0) + 1;
      } else if (action === 'unfollow' && list.includes(targetUsername)) {
        list = list.filter(u => u !== targetUsername);
        this.user.following = Math.max(0, (this.user.following || 0) - 1);
      }
      this.user.followingList = list;
      this.notify(); // Update UI immediately
    }

    try {
      const res = await fetch('/.netlify/functions/follow-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUsername, action })
      });
      
      if (!res.ok) throw new Error('Follow action failed');
      return await res.json();
    } catch (error) {
      console.error('Follow error:', error);
      // Revert optimistic update? For now, we leave it or reload.
      throw error;
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.user));
  }
}

export const auth = new AuthService();

// ═══════════════════════════════════════════════════════════════════════════
// POSTS SERVICE (GitHub-backed)
// ═══════════════════════════════════════════════════════════════════════════

class PostsService {
  constructor() {
    this.posts = [];
    this.loaded = false;
  }

  async loadPosts() {
    if (this.loaded) return this.posts;
    try {
      console.log('[Posts] Loading from GitHub...');
      // Use token if available to avoid rate limits
      const token = auth.getAccessToken();
      this.posts = await postsAPI.getAll(token);
      this.loaded = true;
      console.log('[Posts] Loaded', this.posts.length, 'posts');
    } catch (error) {
      console.error('[Posts] Load error:', error);
      this.posts = [];
    }
    return this.posts;
  }

  getPosts() {
    return this.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getPostsByUser(userId) {
    return this.posts.filter(p => p.userId === userId);
  }

  async createPost({ content, type = 'thought', repo = null, code = null }) {
    const user = auth.getUser();
    if (!user) throw new Error('Not logged in');
    
    const token = auth.getAccessToken();
    if (!token) throw new Error('No access token');

    const post = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      userName: user.name,
      content,
      type,
      repo,
      code,
      reactions: { fire: 0, heart: 0, rocket: 0 },
      comments: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await postsAPI.create(post, token);
      this.posts.unshift(post);
      console.log('[Posts] Created post:', post.id);
    } catch (error) {
      console.error('[Posts] Create error:', error);
      throw new Error('Failed to save post: ' + error.message);
    }
    
    return post;
  }

  async reactToPost(postId, reactionType) {
    const token = auth.getAccessToken();
    if (!token) return null;
    
    try {
      // Server handles toggle logic now
      const result = await postsAPI.react(postId, reactionType, token);
      
      if (result && result.post) {
        // Update local post with server data
        const localPost = this.posts.find(p => p.id === postId);
        if (localPost) {
          localPost.reactions = result.post.reactions;
        }
        return {
          id: postId,
          reactions: result.post.reactions,
          hasReacted: result.hasReacted
        };
      }
      return null;
    } catch (error) {
      console.error('[Posts] React error:', error);
      return null;
    }
  }

  async deletePost(postId) {
    const user = auth.getUser();
    const token = auth.getAccessToken();
    if (!user || !token) return false;

    const index = this.posts.findIndex(p => p.id === postId && p.userId === user.id);
    if (index > -1) {
      try {
        await postsAPI.delete(postId, user.username, token);
        this.posts.splice(index, 1);
        return true;
      } catch (error) {
        console.error('[Posts] Delete error:', error);
      }
    }
    return false;
  }
}

export const posts = new PostsService();

// ═══════════════════════════════════════════════════════════════════════════
// REPOS SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchUserRepos() {
  const token = auth.getAccessToken();
  if (!token) return [];

  try {
    const response = await fetch('/.netlify/functions/get-repos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch repos');
    return await response.json();
  } catch (error) {
    console.error('Error fetching repos:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
