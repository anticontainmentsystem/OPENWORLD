/**
 * Create Post (Backend Proxy)
 * Client sends post data + User Token
 * Server validates User Token -> Writes to Data Repo using System PAT
 */
const { readData, writeData } = require('./utils/gh');

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
    
    // 2. Parse Post Data
    const { content, type, repo, code } = JSON.parse(event.body);
    const user = await userRes.json();
    
    const post = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId: String(user.id),
      username: user.login,
      userAvatar: user.avatar_url,
      userName: user.name || user.login,
      content,
      type: type || 'thought',
      repo,
      code,
      reactions: { fire: 0, heart: 0, rocket: 0 },
      comments: 0,
      createdAt: new Date().toISOString()
    };

    // 3. System Write (Using PAT)
    // Read current posts
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

    return {
      statusCode: 200,
      body: JSON.stringify(post)
    };

  } catch (error) {
    console.error('Create Post Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
