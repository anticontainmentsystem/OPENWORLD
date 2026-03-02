/**
 * Create Frame
 * Creates a new Knowledge Portal frame (index record + body file)
 */
import { readData, writeData } from './utils/gh.js';

const ALLOWED_CATEGORIES = [
  'coding', 'art', 'music', 'writing', 'engineering',
  'photography', 'design', 'science', 'craft',
  'performance', 'film', 'games', 'light-art', 'mixed-media',
  'architecture', 'cuisine', 'language', 'nature', 'wellness',
  'other'
];

// Main category names (IDs + display labels) — subcategories can't duplicate these
const MAIN_CATEGORY_NAMES = new Set([
  ...ALLOWED_CATEGORIES,
  'coding', 'art', 'music', 'writing', 'engineering', 'photography', 'design',
  'science', 'craft', 'performance', 'film', 'games', 'light art', 'mixed media',
  'architecture', 'cuisine', 'language', 'nature', 'wellness', 'other'
]);

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

/**
 * Normalize a subcategory string for duplicate detection.
 * Strips plural 's', gerund '-ing' to noun stem, lowercases.
 */
function normalizeSubcategory(str) {
  let s = str.toLowerCase().trim();
  if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) {
    s = s.slice(0, -1);
  }
  if (s.length > 5 && s.endsWith('ing')) {
    s = s.slice(0, -3);
    if (s.length > 2 && s[s.length - 1] === s[s.length - 2]) {
      s = s.slice(0, -1);
    }
    if (s.length > 2 && /[bcdfghjklmnpqrstvwxyz]$/.test(s)) {
      s = s + 'e';
    }
  }
  return s;
}

/**
 * Validate a subcategory. Returns error string or null.
 */
function validateSubcategory(raw, existingSubcategories) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length < 2) return 'Subcategory must be at least 2 characters';
  if (trimmed.length > 40) return 'Subcategory must be under 40 characters';

  const lower = trimmed.toLowerCase();

  // Can't be a main category
  if (MAIN_CATEGORY_NAMES.has(lower)) {
    return `"${trimmed}" is already a main category`;
  }

  // Reject gerund (-ing) forms — require noun
  if (lower.length > 5 && lower.endsWith('ing')) {
    const stem = lower.slice(0, -3);
    let noun = stem;
    if (noun.length > 2 && noun[noun.length - 1] === noun[noun.length - 2]) {
      noun = noun.slice(0, -1);
    } else if (/[bcdfghjklmnpqrstvwxyz]$/.test(noun)) {
      noun = noun + 'e';
    }
    return `Use the noun form: "${noun}" instead of "${trimmed}"`;
  }

  // Fuzzy duplicate check against existing subcategories in this category
  if (existingSubcategories && existingSubcategories.length > 0) {
    const normalized = normalizeSubcategory(trimmed);
    for (const existing of existingSubcategories) {
      if (normalizeSubcategory(existing) === normalized) {
        return `A similar subcategory already exists: "${existing}"`;
      }
    }
  }

  return null;
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

    const { title, description, category, subcategory, tags, icon } = payload;

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

    // Read shard (needed for both subcategory validation and saving)
    const shardPath = getShardPath();
    let shardResult;
    try {
      shardResult = await readData(shardPath);
    } catch (e) {
      shardResult = { data: [], sha: null };
    }
    const frames = shardResult?.data || [];
    const sha = shardResult?.sha;

    // Subcategory validation
    let cleanSubcategory = null;
    if (subcategory && subcategory.trim()) {
      const existingSubs = frames
        .filter(f => f.category === category && f.subcategory && !f.deleted)
        .map(f => f.subcategory);

      const subError = validateSubcategory(subcategory, existingSubs);
      if (subError) {
        return { statusCode: 400, body: JSON.stringify({ error: subError }) };
      }
      cleanSubcategory = subcategory.trim().substring(0, 40);
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
      subcategory: cleanSubcategory,
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
