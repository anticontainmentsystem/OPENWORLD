/**
 * Add Comment (Backend Proxy)
 * Adds a comment to a post with optional attachments
 */
import { readData, writeData } from './utils/gh.js';
import { createNotification } from './utils/notifications.js';

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
    // Verify user
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
        body: JSON.stringify({ error: `Please wait ${waitTime} seconds before commenting again` }) 
      };
    }
    
    const { postId, content, attachments } = JSON.parse(event.body);
    
    // 3. Validate Input
    if (!postId || !content?.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Post ID and content are required' }) };
    }

    // 4. Read Current Posts
    const result = await readData('posts.json');
    if (!result) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Data store not found' }) };
    }
    
    let posts = result.data;
    let sha = result.sha;

    // 5. Find Post
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Post not found' }) };
    }

    // 6. Create Comment
    const comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: user.id,
      username: user.login,
      userAvatar: user.avatar_url,
      userName: user.name || user.login,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      attachments: attachments || null
    };

    // Initialize comments array if not exists
    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }
    
    post.comments.push(comment);

    // 7. Write Back
    await writeData('posts.json', posts, sha, `Add comment by @${user.login} via OpenWorld Proxy`);
    
    // 8. Update rate limit
    rateLimits.set(user.id, now);

    // 9. Notify post owner (if not self-commenting)
    if (post.username !== user.login) {
      try {
        await createNotification(post.username, 'reply', {
          username: user.login,
          avatar: user.avatar_url
        }, {
          postId: post.id,
          commentId: comment.id,
          preview: content.substring(0, 50)
        });
      } catch (e) {
        console.error('Notification failed:', e);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, comment })
    };

  } catch (error) {
    console.error('Add Comment Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack
      })
    };
  }
};
