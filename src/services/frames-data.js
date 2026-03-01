/**
 * Frames Data Service
 * Client-side API wrapper for all Knowledge Portal frame endpoints
 */
import { auth } from './auth.js';

function getAuthHeaders() {
  const token = auth.getAccessToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(endpoint, options = {}) {
  const response = await fetch(`/.netlify/functions/${endpoint}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

/**
 * Frames API — listing and creation
 */
export const framesAPI = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.creator) params.set('creator', filters.creator);
    if (filters.limit) params.set('limit', filters.limit);

    const qs = params.toString();
    const url = `/.netlify/functions/get-frames${qs ? '?' + qs : ''}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  },

  async get(frameId) {
    const url = `/.netlify/functions/get-frame?id=${encodeURIComponent(frameId)}`;
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Frame not found');
    }
    return await response.json();
  },

  async create(frameData) {
    return request('create-frame', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(frameData)
    });
  },

  async edit(frameId, updates) {
    return request('manage-frame', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'edit', frameId, ...updates })
    });
  },

  async archive(frameId) {
    return request('manage-frame', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'archive', frameId })
    });
  },

  async adopt(frameId) {
    return request('manage-frame', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'adopt', frameId })
    });
  },

  async delete(frameId) {
    return request('manage-frame', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'delete', frameId })
    });
  }
};

/**
 * Members API
 */
export const frameMembersAPI = {
  async join(frameId) {
    return request('frame-member', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'join', frameId })
    });
  },

  async leave(frameId) {
    return request('frame-member', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'leave', frameId })
    });
  },

  async remove(frameId, targetUserId) {
    return request('frame-member', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'remove', frameId, targetUserId })
    });
  }
};

/**
 * Sections API
 */
export const frameSectionsAPI = {
  async add(frameId, title, type) {
    return request('frame-section', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'add', frameId, title, type })
    });
  },

  async edit(frameId, sectionId, title) {
    return request('frame-section', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'edit', frameId, sectionId, title })
    });
  },

  async remove(frameId, sectionId) {
    return request('frame-section', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'remove', frameId, sectionId })
    });
  },

  async reorder(frameId, order) {
    return request('frame-section', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'reorder', frameId, order })
    });
  }
};

/**
 * Threads API
 */
export const frameThreadsAPI = {
  async create(frameId, sectionId, title, content) {
    return request('frame-thread', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'create', frameId, sectionId, title, content })
    });
  },

  async reply(frameId, sectionId, threadId, content) {
    return request('frame-thread', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'reply', frameId, sectionId, threadId, content })
    });
  },

  async pin(frameId, sectionId, threadId) {
    return request('frame-thread', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'pin', frameId, sectionId, threadId })
    });
  },

  async lock(frameId, sectionId, threadId) {
    return request('frame-thread', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'lock', frameId, sectionId, threadId })
    });
  },

  async deleteThread(frameId, sectionId, threadId) {
    return request('frame-thread', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'delete', frameId, sectionId, threadId })
    });
  },

  async deleteReply(frameId, sectionId, threadId, replyId) {
    return request('frame-thread', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'delete', frameId, sectionId, threadId, replyId })
    });
  }
};

/**
 * Resources & FAQ API
 */
export const frameResourcesAPI = {
  async addResource(frameId, sectionId, title, url, description) {
    return request('frame-resource', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'add-resource', frameId, sectionId, title, url, description })
    });
  },

  async removeResource(frameId, sectionId, itemId) {
    return request('frame-resource', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'remove-resource', frameId, sectionId, itemId })
    });
  },

  async addFaq(frameId, sectionId, question, answer) {
    return request('frame-resource', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'add-faq', frameId, sectionId, question, answer })
    });
  },

  async removeFaq(frameId, sectionId, itemId) {
    return request('frame-resource', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'remove-faq', frameId, sectionId, itemId })
    });
  }
};
