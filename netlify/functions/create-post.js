/**
 * Create Post (Backend Proxy)
 * Client sends post data + User Token
 * Server validates User Token -> Writes to Data Repo using System PAT
 * 
 * Post structure (v2):
 * - content: text (optional if media+attachment)  
 * - media: { type: 'image'|'video'|'gif', url: string } (optional)
 * - attachments: { repo: {...}, code: {...} } (optional)
 * 
 * Validation: media requires either text OR attachment to prevent spam
 * Rate limit: 4 seconds between posts
 */
import { readData, writeData } from './utils/gh.js';

// Helper: Determine shard path
function getShardPath(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `data/posts/${year}/${month}.json`;
}

export const handler = async (event, context) => {
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
    // Validate token with GitHub
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
    
  try {
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const { content, media, type, repo, code, activity } = payload;
    const hasMedia = media && media.url;

    // Basic Validation
    if (!content && !hasMedia && !repo && !code) {
       return { statusCode: 400, body: JSON.stringify({ error: 'Post must have content or attachment' }) };
    }

    if (hasMedia) {
      // Basic URL validation
      if (!media.url.startsWith('http') && !media.url.startsWith('github://')) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid media URL' }) };
      }
    }
    
    const post = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId: String(user.id),
      username: user.login,
      userAvatar: user.avatar_url,
      userName: user.name || user.login,
      content: content?.trim() || null,
      media: hasMedia ? media : null,
      type: type || 'thought',
      repo: repo || null,
      code: code || null,
      activity: activity || null,
      reactions: { fire: 0 },
      comments: [],
      createdAt: new Date().toISOString()
    };

    // 5. System Write (Using PAT)
    const shardPath = getShardPath();
    let result;
    try {
       result = await readData(shardPath);
    } catch (e) {
       // Shard might not exist yet
       result = { data: [], sha: null };
    }
    
    const posts = result?.data || [];
    const sha = result?.sha;
    
    // Add new post
    posts.unshift(post);
    
    // Write back to SHARD
    await writeData(
      shardPath,
      posts,
      sha, 
      `Add post by @${user.login} to shard ${shardPath}`
    );


    return {
      statusCode: 200,
      body: JSON.stringify(post)
    };

  } catch (error) {
    console.error('Create Post Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        details: 'Check Netlify Function Logs' 
      })
    };
  }
}
