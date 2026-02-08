/**
 * Manage Post (Backend Proxy)
 * Handle Deletion and Reactions
 */
import { readData, writeData } from './utils/gh.js';

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
    const { action, postId, reactionType } = JSON.parse(event.body);

    // 2. Read Current Data
    const result = await readData('posts.json');
    if (!result) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Data store not found' }) };
    }
    
    let posts = result.data;
    let sha = result.sha;
    let message = '';

    // 3. Process Action
    if (action === 'delete') {
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Post not found' }) };
      }
      
      // Verify ownership (String/Number comparison safety)
      if (String(posts[postIndex].userId) !== String(user.id)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized: Not your post' }) };
      }
      
      posts.splice(postIndex, 1);
      message = `Delete post by @${user.login} via OpenWorld Proxy`;
      
    } else if (action === 'react') {
      const post = posts.find(p => p.id === postId);
      if (!post) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Post not found' }) };
      }
      
      // Initialize reactions if not exists
      if (!post.reactions) {
        post.reactions = { fire: 0 };
      }
      
      // Initialize reactedBy tracking if not exists
      if (!post.reactedBy) {
        post.reactedBy = {};
      }
      if (!post.reactedBy[reactionType]) {
        post.reactedBy[reactionType] = [];
      }
      
      const userId = String(user.id);
      const hasReacted = post.reactedBy[reactionType].includes(userId);
      
      if (hasReacted) {
        // Remove reaction (toggle off)
        post.reactions[reactionType] = Math.max(0, (post.reactions[reactionType] || 0) - 1);
        post.reactedBy[reactionType] = post.reactedBy[reactionType].filter(id => id !== userId);
        message = `Remove ${reactionType} from post ${postId} via OpenWorld Proxy`;
      } else {
        // Add reaction (toggle on)
        post.reactions[reactionType] = (post.reactions[reactionType] || 0) + 1;
        post.reactedBy[reactionType].push(userId);
        message = `Add ${reactionType} to post ${postId} via OpenWorld Proxy`;
        
        // Notify Post Owner (only on add, not remove)
        if (post.username !== user.login) {
          import('./utils/notifications.js').then(({ createNotification }) => {
             createNotification(post.username, 'reaction', {
               username: user.login,
               avatar: user.avatar_url
             }, {
               postId: post.id,
               type: reactionType,
               content: post.content ? post.content.substring(0, 50) : 'Code snippet'
             });
          }).catch(console.error);
        }
      }
      
      // Write data before returning
      await writeData('posts.json', posts, sha, message);
      
      // Return whether user has now reacted
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          post: { id: post.id, reactions: post.reactions },
          hasReacted: !hasReacted
        })
      };
      
      
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
    }

    // 4. Write Back (System PAT)
    await writeData('posts.json', posts, sha, message);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Manage Post Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack
      })
    };
  }
};
