/**
 * Create Frame
 * Creates a new Knowledge Portal frame (index record + body file)
 */
import { readData, writeData } from './utils/gh.js';

const ALLOWED_CATEGORIES = ['coding', 'art', 'music', 'writing', 'engineering', 'photography', 'design', 'science', 'craft', 'other'];

// Rate limiting
const rateLimits = new Map();
const COOLDOWN_MS = 10000;

function getShardPath(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `data/frames/${year}/${month}.json`;
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
    .replace(/^-|-$/g, '');
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { authorization } = event.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing or invalid Authorization header' }) };
  }

  const token = authorization.split(' ')[1];
  let user;

  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!userRes.ok) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid GitHub Token' }) };
    }
    user = await userRes.json();
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Authentication failed' }) };
  }

  // Rate limit
  const lastCreate = rateLimits.get(String(user.id));
  if (lastCreate && Date.now() - lastCreate < COOLDOWN_MS) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Please wait before creating another frame' }) };
  }

  try {
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const { title, description, category, tags, icon } = payload;

    // Validate
    if (!title || title.trim().length < 3 || title.trim().length > 100) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Title must be 3-100 characters' }) };
    }
    if (!description || description.trim().length < 10 || description.trim().length > 500) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Description must be 10-500 characters' }) };
    }
    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return { statusCode: 400, body: JSON.stringify({ error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}` }) };
    }

    const now = new Date().toISOString();
    const frameId = 'frame_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Index record (stored in shard)
    const indexRecord = {
      id: frameId,
      slug: slugify(title),
      title: title.trim(),
      description: description.trim(),
      category,
      tags: Array.isArray(tags) ? tags.slice(0, 5).map(t => t.trim().toLowerCase()) : [],
      icon: icon || '📡',
      creatorId: String(user.id),
      creatorUsername: user.login,
      creatorAvatar: user.avatar_url,
      creatorName: user.name || user.login,
      status: 'active',
      memberCount: 1,
      sectionCount: 1,
      lastActivityAt: now,
      createdAt: now,
      deleted: false,
      archivedAt: null,
      archivedBy: null,
      adoptedBy: null,
      adoptedAt: null
    };

    // Body file (dedicated file per frame)
    const bodyRecord = {
      id: frameId,
      sections: [
        {
          id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          type: 'discussion',
          title: 'General Discussion',
          order: 0,
          createdAt: now,
          threads: []
        }
      ],
      members: [
        {
          userId: String(user.id),
          username: user.login,
          avatar: user.avatar_url,
          role: 'creator',
          joinedAt: now
        }
      ],
      linkedPosts: [],
      linkedRepos: []
    };

    // Write index record to shard
    const shardPath = getShardPath();
    let result;
    try {
      result = await readData(shardPath);
    } catch (e) {
      result = { data: [], sha: null };
    }

    const frames = result?.data || [];
    const sha = result?.sha;
    frames.unshift(indexRecord);

    await writeData(shardPath, frames, sha, `Create frame "${title}" by @${user.login}`);

    // Write body file
    const bodyPath = `data/frames/body/${frameId}.json`;
    await writeData(bodyPath, bodyRecord, null, `Create frame body for "${title}" by @${user.login}`);

    rateLimits.set(String(user.id), Date.now());

    return {
      statusCode: 200,
      body: JSON.stringify({ frame: indexRecord, body: bodyRecord })
    };

  } catch (error) {
    console.error('Create Frame Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message, details: 'Check Netlify Function Logs' })
    };
  }
};
