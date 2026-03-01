/**
 * Get Frames
 * Lists Knowledge Portal frames with filtering, search, and caching
 */
import { readData } from './utils/gh.js';

function getShardPath(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `data/frames/${year}/${month}.json`;
}

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const params = event.queryStringParameters || {};
    const { category, search, status, creator } = params;

    // Load current month shard
    const shardPath = getShardPath();
    let frames = [];

    try {
      const file = await readData(shardPath);
      frames = file ? file.data : [];
    } catch (e) {
      frames = [];
    }

    // Fallback: load previous month if few frames
    if (frames.length < 5) {
      const prev = new Date();
      prev.setMonth(prev.getMonth() - 1);
      const prevPath = getShardPath(prev);
      try {
        const prevFile = await readData(prevPath);
        const prevFrames = prevFile ? prevFile.data : [];
        frames = [...frames, ...prevFrames];
      } catch (e) {
        // Ignore
      }
    }

    // Filter out deleted
    frames = frames.filter(f => !f.deleted);

    // Filter by status
    if (status === 'active') {
      frames = frames.filter(f => f.status === 'active');
    } else if (status === 'archived') {
      frames = frames.filter(f => f.status === 'archived');
    }

    // Filter by category
    if (category && category !== 'all') {
      frames = frames.filter(f => f.category === category);
    }

    // Filter by creator
    if (creator) {
      frames = frames.filter(f => f.creatorUsername === creator);
    }

    // Search (title, description, tags)
    if (search && search.trim().length >= 2) {
      const q = search.trim().toLowerCase();
      frames = frames.filter(f =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.tags && f.tags.some(t => t.includes(q)))
      );
    }

    // Sort by last activity
    frames.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(frames)
    };

  } catch (error) {
    console.error('Get Frames Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
