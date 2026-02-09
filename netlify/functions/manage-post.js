/**
 * Manage Post (Backend Proxy)
 * Handle Deletion and Reactions
 */
const { getFile, writeData } = require('./utils/gh');

// Helper: Determine shard path from timestamp/ID
function getShardPath(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `data/posts/${year}/${month}.json`;
}

// Helper: Get timestamp from Post ID (format: post_TIMESTAMP_RANDOM)
function getTimestampFromId(postId) {
  if (!postId) return Date.now();
  const parts = postId.split('_');
  if (parts.length >= 2 && !isNaN(parts[1])) {
    return parseInt(parts[1]);
  }
  return Date.now();
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { user } = context.clientContext || {};
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {

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
    // 3. Process Action
    if (action === 'delete') {
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Post not found' }) };
      }
      
      const post = posts[postIndex];
      // Verify ownership
      if (String(post.userId) !== String(user.id)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized: Not your post' }) };
      }
      
      // Soft Delete
      post.deleted = true;
      post.deletedAt = new Date().toISOString();
      message = `Soft delete post ${postId} by @${user.login}`;
      
    } else if (action === 'edit') {
       const { content, repo, media, activity, code } = JSON.parse(event.body);
       const post = posts.find(p => p.id === postId);
       
       if (!post) return { statusCode: 404, body: JSON.stringify({ error: 'Post not found' }) };
       if (String(post.userId) !== String(user.id)) return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
       
       // Create version snapshot of the complete previous state
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
       
       // Update all fields
       post.content = content;
       post.repo = repo;
       post.media = media;
       post.activity = activity;
       post.code = code;
       
       post.lastEditedAt = new Date().toISOString();
       message = `Edit post ${postId} by @${user.login}`;
       
    } else if (action === 'restore') {
      const post = posts.find(p => p.id === postId);
      if (!post) return { statusCode: 404, body: JSON.stringify({ error: 'Post not found' }) };
      if (String(post.userId) !== String(user.id)) return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
      
      post.deleted = false;
      post.deletedAt = null;
      message = `Restore post ${postId} by @${user.login}`;

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
      const userId = String(user.id);
      
      // Ensure specific reaction array exists
      if (!post.reactedBy[reactionType]) {
        post.reactedBy[reactionType] = [];
      }
      
      const hasReacted = post.reactedBy[reactionType].includes(userId);
      
      if (hasReacted) {
        // Remove reaction (toggle off)
        post.reactedBy[reactionType] = post.reactedBy[reactionType].filter(id => id !== userId);
        message = `Remove ${reactionType} from post ${postId} via OpenWorld Proxy`;
      } else {
        // Add reaction (toggle on)
        post.reactedBy[reactionType].push(userId);
        message = `Add ${reactionType} to post ${postId} via OpenWorld Proxy`;
        
        // Notify Post Owner (only on add, not remove)
        if (post.username !== user.login) {
          import('./utils/notifications.js').then(({ createNotification }) => {
             createNotification(post.username, 'reaction', {
               username: user.login,
               avatar: user.avatar_url,
               nodeId: user.node_id // Pass node_id if available or fetch it
             }, {
               postId: post.id,
               type: reactionType,
               content: post.content ? post.content.substring(0, 50) : 'Code snippet'
             });
          }).catch(console.error);
        }
      }
      
      // FORCE CONSISTENCY: Count must match unique users
      // This fixes legacy/mock data issues where count != array length
      post.reactions[reactionType] = post.reactedBy[reactionType].length;
      
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
    // Write back to the specific shard
    await writeData(shardPath, posts, message);
    
    return {
      statusCode: 200,
      body: JSON.stringify(action === 'delete' ? { success: true } : { post: posts.find(p => p.id === postId) || posts[0] }) // Return the updated post
    };

  } catch (error) {
    console.error('Manage Post Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
