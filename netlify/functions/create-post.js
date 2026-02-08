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

// Rate limiting cache (in-memory, resets on cold start)
const rateLimits = new Map();
const COOLDOWN_MS = 4000; // 4 seconds

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 1. Validate User
  const authHeader = event.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  const userToken = authHeader.slice(7);

  try {
    // Verify user identity with GitHub
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (!userRes.ok) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid user token' }) };
    }
    
    const user = await userRes.json();
    
    // 2. Rate Limit Check
    const lastPost = rateLimits.get(user.id);
    const now = Date.now();
    if (lastPost && (now - lastPost) < COOLDOWN_MS) {
      const waitTime = Math.ceil((COOLDOWN_MS - (now - lastPost)) / 1000);
      return { 
        statusCode: 429, 
        body: JSON.stringify({ error: `Please wait ${waitTime} seconds before posting again` }) 
      };
    }
    
    // 3. Parse Post Data
    const { content, type, repo, code, media, activity } = JSON.parse(event.body);
    
    // 4. Validation
    const hasContent = content && content.trim();
    const hasMedia = media && media.url;
    const hasAttachment = repo || code || activity;
    
    // Must have at least one of: content, attachment
    if (!hasContent && !hasAttachment) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Post must have text or an attachment' }) 
      };
    }
    
    // If media only, must also have content OR attachment (prevent image spam)
    if (hasMedia && !hasContent && !hasAttachment) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Media must be accompanied by text or an attachment' }) 
      };
    }
    
    // Validate media URL format if present
    if (hasMedia) {
      const validMediaTypes = ['image', 'video', 'gif'];
      if (!validMediaTypes.includes(media.type)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid media type' }) };
      }
      
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
    const result = await readData('posts.json');
    const posts = result?.data || [];
    const sha = result?.sha;
    
    // Add new post
    posts.unshift(post);
    
    // Write back
    await writeData(
      'posts.json',
      posts,
      sha, 
      `Add post by @${user.login} (via OpenWorld Proxy)`
    );
    
    // 6. Update rate limit
    rateLimits.set(user.id, now);

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
