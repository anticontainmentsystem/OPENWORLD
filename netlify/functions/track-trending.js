/**
 * Track Trending
 * Updates trending.json when a repo is starred
 */
import { readData, writeData } from './utils/gh.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  const token = authHeader.slice(7);

  try {
    // Verify user to get actor info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!userRes.ok) throw new Error('Invalid token');
    const user = await userRes.json();

    const { repo, action } = JSON.parse(event.body); // action: 'star' | 'unstar'
    
    // Read trending data
    const result = await readData('trending.json');
    let trending = result?.data || { repos: {} };
    
    const repoKey = repo.id || repo.name;
    
    if (!trending.repos[repoKey]) {
      trending.repos[repoKey] = {
        name: repo.name,
        description: repo.description,
        url: repo.url,
        score: 0,
        stars: 0
      };
    }
    
    const change = action === 'star' ? 1 : -1;
    trending.repos[repoKey].score += change;
    trending.repos[repoKey].stars += change;
    trending.repos[repoKey].lastActivity = new Date().toISOString();
    
    // Notify Owner
    if (action === 'star' && repo.owner) {
        const ownerLogin = typeof repo.owner === 'object' ? repo.owner.login : repo.owner;
        await createNotification(ownerLogin, 'star', {
            username: user.login,
            avatar: user.avatar_url
        }, {
            repoName: repo.name,
            repoUrl: repo.url
        });
    }
    
    // Write back
    await writeData(
      'trending.json', 
      trending, 
      result?.sha, 
      `Update trending: ${action} ${repo.name}`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, score: trending.repos[repoKey].score })
    };

  } catch (error) {
    console.error('Track Trending Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
