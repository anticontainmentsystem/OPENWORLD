import { readData } from './utils/gh.js';

// Helper: Determine shard path from timestamp/ID
function getShardPath(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `data/posts/${year}/${month}.json`;
}

// Helper: Get timestamp from Post ID
function getTimestampFromId(postId) {
  if (!postId) return null;
  const parts = String(postId).split('_');
  if (parts.length >= 2 && !isNaN(parts[1])) {
    return parseInt(parts[1]);
  }
  // If legacy numeric ID (timestamp-ish)
  if (!isNaN(postId) && String(postId).length > 10) {
      return parseInt(postId);
  }
  return null;
}

export const handler = async (event, context) => {
  const { id } = event.queryStringParameters || {};
  
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing id' }) };
  }

  // Caching for single post (stale-while-revalidate)
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const timestamp = getTimestampFromId(id);
    let post = null;
    
    // 1. Try Shard (if we can derive date)
    if (timestamp) {
        const shardPath = getShardPath(timestamp);
        try {
            const file = await readData(shardPath);
            if (file) {
                const posts = file.data;
                post = posts.find(p => String(p.id) === String(id));
            }
        } catch (e) {
            console.log(`[GetPost] Shard ${shardPath} not found.`);
        }
    }
    
    // 2. Fallback: Legacy posts.json
    if (!post) {
        try {
             const file = await readData('posts.json');
             if (file) {
                 post = file.data.find(p => String(p.id) === String(id));
             }
        } catch (e) {}
    }

    if (!post) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Post not found' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(post)
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
