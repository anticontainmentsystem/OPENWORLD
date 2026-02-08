/**
 * OpenWorld Auth Service
 * Real GitHub OAuth via Netlify Functions
 */

const STORAGE_KEY = 'openworld_user';
const POSTS_KEY = 'openworld_posts';

class AuthService {
  constructor() {
    this.user = this.loadUser();
    this.listeners = [];
  }

  loadUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log('[Auth] Loading user from localStorage:', stored ? 'Found data' : 'No data');
      const user = stored ? JSON.parse(stored) : null;
      if (user) {
        console.log('[Auth] User loaded:', user.username);
      }
      return user;
    } catch (e) {
      console.error('[Auth] Error loading user:', e);
      return null;
    }
  }

  getUser() {
    console.log('[Auth] getUser called, user:', this.user ? this.user.username : 'null');
    return this.user;
  }

  getAccessToken() {
    return this.user?.accessToken || null;
  }

  isLoggedIn() {
    return !!this.user;
  }

  login() {
    // Redirect to Netlify function for GitHub OAuth
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
    this.notify();
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
// POSTS SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class PostsService {
  constructor() {
    this.posts = this.loadPosts();
  }

  loadPosts() {
    try {
      const stored = localStorage.getItem(POSTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  savePosts() {
    localStorage.setItem(POSTS_KEY, JSON.stringify(this.posts));
  }

  getPosts() {
    return this.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getPostsByUser(userId) {
    return this.posts.filter(p => p.userId === userId);
  }

  createPost({ content, type = 'thought', repo = null }) {
    const user = auth.getUser();
    if (!user) throw new Error('Not logged in');

    const post = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      userName: user.name,
      content,
      type,
      repo,
      reactions: { fire: 0, heart: 0, rocket: 0 },
      comments: 0,
      createdAt: new Date().toISOString()
    };

    this.posts.unshift(post);
    this.savePosts();
    return post;
  }

  reactToPost(postId, reactionType) {
    const post = this.posts.find(p => p.id === postId);
    if (post && post.reactions[reactionType] !== undefined) {
      post.reactions[reactionType]++;
      this.savePosts();
    }
    return post;
  }

  deletePost(postId) {
    const user = auth.getUser();
    if (!user) return false;

    const index = this.posts.findIndex(p => p.id === postId && p.userId === user.id);
    if (index > -1) {
      this.posts.splice(index, 1);
      this.savePosts();
      return true;
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
