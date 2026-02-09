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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user));
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
    this.listeners = [];
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

  async create(postData) {
    const user = auth.getUser();
    if (!user) throw new Error('Not logged in');

    const fullPost = {
      ...postData,
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      userName: user.name,
      createdAt: new Date().toISOString(),
      reactions: { fire: 0, heart: 0, rocket: 0 },
      comments: 0
    };

    const token = auth.getAccessToken();
    // postsAPI.create expects the full object now? Or does it expect data?
    // Looking at previous createPost, postsAPI.create took (post, token).
    const newPost = await postsAPI.create(fullPost, token);
    this.posts.unshift(newPost);
    this.notify();
    return newPost;
  }

  async edit(postId, postData) {
    const token = auth.getAccessToken();
    await postsAPI.edit(postId, postData, token);
    
    // Update local state
    const index = this.posts.findIndex(p => p.id === postId);
    if (index !== -1) {
      this.posts[index] = { ...this.posts[index], ...postData };
      this.notify();
    }
  }

  async delete(postId, username) {
    const token = auth.getAccessToken();
    await postsAPI.delete(postId, username, token);
    
    // Update local state: Soft delete (mark as deleted, don't remove)
    const post = this.posts.find(p => p.id === postId);
    if (post) {
        post.deleted = true;
        post.deletedAt = new Date().toISOString();
    }
    this.notify();
  }

  // Subscribe to changes (for reactive UI)
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.posts));
  }

  getPosts() {
    return this.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getPostsByUser(userIdOrName) {
    const target = String(userIdOrName).toLowerCase();
    return this.posts.filter(p => 
      String(p.userId) === String(userIdOrName) || 
      (p.username && p.username.toLowerCase() === target)
    );
  }

  async createPost({ content, type = 'thought', repo = null, code = null, activity = null, media = null }) {
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
      activity,
      media,
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
        // Soft delete locally
        this.posts[index].deleted = true;
        this.posts[index].deletedAt = new Date().toISOString();
        // Trigger UI update (which will filter it out)
        return true;
      } catch (error) {
        console.error('[Posts] Delete error:', error);
      }
    }
    return false;
  }

  async editPost(postId, { content, repo, media, activity, code }) {
    const user = auth.getUser();
    const token = auth.getAccessToken();
    if (!user || !token) throw new Error('Not logged in');

    try {
       const res = await fetch('/.netlify/functions/manage-post', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({
           action: 'edit',
           postId,
           content,
           repo,
           media,
           activity,
           code
         })
       });
       
       if (!res.ok) throw new Error('Failed to edit');
       
       // Optimistic local update
       const post = this.posts.find(p => p.id === postId);
       if (post) {
         if (!post.versions) post.versions = [];
         post.versions.push({
           timestamp: post.lastEditedAt || post.createdAt,
           content: post.content,
           repo: post.repo,
           media: post.media,
           activity: post.activity,
           code: post.code,
           reason: 'Edit'
         });
         
         post.content = content;
         post.repo = repo;
         post.media = media;
         post.activity = activity;
         post.code = code;
         
         post.lastEditedAt = new Date().toISOString();
       }
       return true;
    } catch (error) {
       console.error('[Posts] Edit error:', error);
       throw error;
    }
  }

  async restorePost(postId) {
    const user = auth.getUser();
    const token = auth.getAccessToken();
    if (!user || !token) throw new Error('Not logged in');

    try {
       const res = await fetch('/.netlify/functions/manage-post', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({
           action: 'restore',
           postId
         })
       });
       
       if (!res.ok) throw new Error('Failed to restore');
       
       const post = this.posts.find(p => p.id === postId);
       if (post) {
         post.deleted = false;
         post.deletedAt = null;
       }
       return true;
    } catch (error) {
       console.error('[Posts] Restore error:', error);
       throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-TIME UPDATES (POLLING)
  // ═══════════════════════════════════════════════════════════════════════════

  startPolling(interval = 4000) {
    if (this.pollInterval) return;
    // console.log('[Posts] Started polling...');
    this.pollInterval = setInterval(async () => {
      try {
        const token = auth.getAccessToken();
        // Silent fetch (no loading indicators)
        const latestPosts = await postsAPI.getAll(token);
        this.reconcilePosts(latestPosts);
      } catch (e) {
        console.error('[Posts] Polling error (silent):', e);
      }
    }, interval);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  reconcilePosts(remotePosts) {
    if (!remotePosts || !Array.isArray(remotePosts)) return;

    remotePosts.forEach(remotePost => {
      const localPost = this.posts.find(p => p.id === remotePost.id);
      
      if (localPost) {
        // 1. Check Reactions
        // We only care if the counts changed. The "hasReacted" state for the *current* user 
        // is technically derived from the "reactedBy" array if we had it.
        // But for now, we just sync the counts for everyone.
        
        const localReactions = localPost.reactions || { fire: 0, heart: 0, rocket: 0 };
        const remoteReactions = remotePost.reactions || { fire: 0, heart: 0, rocket: 0 };
        
        // Simple JSON comparison for efficiency
        if (JSON.stringify(localReactions) !== JSON.stringify(remoteReactions)) {
          // console.log('[Posts] Syncing reactions for:', remotePost.id);
          localPost.reactions = remoteReactions;
          this.updateReactionUI(remotePost.id, remoteReactions);
        }
        
        // 2. Check Comments Count
        const localComments = Array.isArray(localPost.comments) ? localPost.comments.length : (localPost.comments || 0);
        const remoteComments = Array.isArray(remotePost.comments) ? remotePost.comments.length : (remotePost.comments || 0);
        
        if (localComments !== remoteComments) {
           localPost.comments = remotePost.comments;
           this.updateCommentCountUI(remotePost.id, remoteComments);
        }

        // 3. Check Content/Edit Status
        if (localPost.content !== remotePost.content) {
          localPost.content = remotePost.content;
          localPost.versions = remotePost.versions;
          localPost.lastEditedAt = remotePost.lastEditedAt;
          // Trigger a re-render for this card context if possible, or just let next render handle it.
          // For now, we update the data. Full UI update would require more DOM logic.
        }
        
        // 4. Check Deletion Status
        if (localPost.deleted !== remotePost.deleted) {
          localPost.deleted = remotePost.deleted;
          localPost.deletedAt = remotePost.deletedAt;
          // If deleted changed, we might need to hide/show. 
          // Ideally we'd trigger a UI refresh here.
        }

      } else {
        // New Post Found - user might want to see it?
        // For now, let's NOT automatically inject new posts to avoid layout shifts.
        // We could show a "New posts available" toaster in the future.
        if (!this.posts.some(p => p.id === remotePost.id)) {
             // Add to local data AND render immediately (Real-time "Pop")
             this.posts.unshift(remotePost); 
             this.notify();
        }
      }
    });
  }

  updateReactionUI(postId, reactions) {
    // Find the post card in the DOM
    const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
    if (!postCard) return;

    // Helper to safe update
    const updateCount = (type, count) => {
      // Find button by looking for the emoji text context or data-action
      // Implementation depends on how renderPostCard outputs HTML.
      // Based on renderPostCard: 
      // <button class="post-card__action" data-action="react" ...>🔥 <span>0</span></button>
      // Wait, renderPostCard currently assumes only 'fire' or generic 'react'.
      // But let's support fire specifically for now as it's the main one requested.
      
      const btn = postCard.querySelector(`.post-card__action[data-action="react"]`);
      if (btn) {
         const span = btn.querySelector('span');
         // Sum of all reactions or just fire? 
         // The user specifically mentioned "fire icon... displays 14 or 15".
         // Currently renderPostCard sums ALL reactions: Object.values(...).reduce...
         
         const total = Object.values(reactions).reduce((a, b) => a + b, 0);
         if (span) span.textContent = total;
      }
    };

    updateCount('fire', reactions.fire || 0);
  }
  
  updateCommentCountUI(postId, count) {
      const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
      if (!postCard) return;
      
      const btn = postCard.querySelector(`.post-card__action[data-action="comment"] span`);
      if (btn) btn.textContent = count;
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
