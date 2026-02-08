/**
 * Update Profile (Backend Proxy)
 * Securely update user profile
 */
const { readData, writeData } = require('./utils/gh');

exports.handler = async function(event, context) {
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

    const githubUser = await userRes.json();
    const updates = JSON.parse(event.body);

    // Verify we are updating the correct user
    if (updates.username !== githubUser.login) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Cannot update another user' }) };
    }

    // 2. Read Current Profile (or create new)
    const filePath = `users/${githubUser.login}.json`;
    const result = await readData(filePath);
    
    let profile = result?.data || {
      id: String(githubUser.id),
      username: githubUser.login,
      joinedAt: new Date().toISOString()
    };
    
    // Merge updates (allow-list fields for safety)
    const safeUpdates = {
      name: updates.name || profile.name,
      bio: updates.bio || profile.bio,
      location: updates.location || profile.location,
      avatar: updates.avatar || profile.avatar || githubUser.avatar_url,
      website: updates.website || profile.website,
      // System generated fields
      followers: profile.followers || 0,
      following: profile.following || 0,
      repos: updates.repos || profile.repos || [] 
    };

    // 3. Write Back
    await writeData(
      filePath, 
      { ...profile, ...safeUpdates }, 
      result?.sha, 
      `Update profile for @${githubUser.login}`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, profile: { ...profile, ...safeUpdates } })
    };

  } catch (error) {
    console.error('Update Profile Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack
      })
    };
  }
};
