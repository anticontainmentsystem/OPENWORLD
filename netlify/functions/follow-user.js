/**
 * Follow/Unfollow User
 * Updates social graph for both users
 */
import { readData, writeData } from './utils/gh.js';
import { createNotification } from './utils/notifications.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { targetUsername, action } = JSON.parse(event.body); // action: 'follow' | 'unfollow'
    const token = authHeader.slice(7);

    // 1. Get Current User (Actor)
    const actorRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!actorRes.ok) throw new Error('Invalid token');
    const actor = await actorRes.json();
    const actorUsername = actor.login;

    if (actorUsername === targetUsername) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cannot follow self' }) };
    }

    // 2. Read contents of both users
    // Note: In a real DB we'd use a transaction. Here we just do best effort sequential updates.
    // We read both first to fail early if target doesn't exist.
    
    // Read Actor
    const actorPath = `users/${actorUsername}.json`;
    const actorData = await readData(actorPath);
    let actorProfile = actorData?.data || { username: actorUsername };

    // Read Target
    // Read Target
    const targetPath = `users/${targetUsername}.json`;
    const targetData = await readData(targetPath);
    
    let targetProfile;
    let targetSha = null;

    if (targetData) {
      targetProfile = targetData.data;
      targetSha = targetData.sha;
    } else {
      // Target not in DB? Fetch from GitHub
      console.log(`Target ${targetUsername} not found in DB, fetching from GitHub...`);
      const targetUserRes = await fetch(`https://api.github.com/users/${targetUsername}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
      });
      
      if (!targetUserRes.ok) {
           return { statusCode: 404, body: JSON.stringify({ error: 'Target user not found on GitHub' }) };
      }
      const ghTarget = await targetUserRes.json();
      
      targetProfile = {
          id: String(ghTarget.id),
          username: ghTarget.login,
          name: ghTarget.name || ghTarget.login,
          avatar: ghTarget.avatar_url,
          bio: ghTarget.bio,
          location: ghTarget.location,
          joinedAt: ghTarget.created_at,
          followers: ghTarget.followers,
          following: ghTarget.following,
          followersList: [],
          followingList: [],
          pinnedRepos: [],
          starredRepos: []
      };
    }

    // Initialize lists if missing
    actorProfile.followingList = actorProfile.followingList || [];
    targetProfile.followersList = targetProfile.followersList || [];

    // 3. Apply Logic
    let changed = false;

    if (action === 'follow') {
      if (!actorProfile.followingList.includes(targetUsername)) {
        actorProfile.followingList.push(targetUsername);
        targetProfile.followersList.push(actorUsername);
        changed = true;
        
        // Notify Target
        // We import dynamically or use the helper if strictly ESM
        // Since we are in Netlify functions (Node), we can import at top level if we change signature
        // But for now let's assume we update imports
        await createNotification(targetUsername, 'follow', {
          username: actorUsername,
          avatar: actorProfile.avatar
        });
      }
    } else if (action === 'unfollow') {
      if (actorProfile.followingList.includes(targetUsername)) {
        actorProfile.followingList = actorProfile.followingList.filter(u => u !== targetUsername);
        targetProfile.followersList = targetProfile.followersList.filter(u => u !== actorUsername);
        changed = true;
      }
    }

    if (!changed) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No change needed' }) };
    }

    // Update Counts
    actorProfile.following = actorProfile.followingList.length;
    targetProfile.followers = targetProfile.followersList.length;

    // 4. Write Back (Parallel-ish)
    // We write actor first, then target. If target fails, we have partial state (following but not followed), which is acceptable for MVP.
    // Ideally we'd eventually consistency check this.
    
    await writeData(
      actorPath,
      actorProfile,
      actorData?.sha,
      `${action} @${targetUsername}`
    );

    // optimize: fetch latest SHA for target in case it changed? 
    // For now we use the one we read a moment ago. 
    // High concurrency could cause conflicts here (409 Conflict). 
    // Retry logic would be needed for production.
    try {
        await writeData(
        targetPath,
        targetProfile,
        targetSha, // Use the SHA we resolved (null if new file)
        `Was ${action}ed by @${actorUsername}`
        );
    } catch (e) {
        // If writing target fails, we log it but don't fail the request completely
        // since the user's "I am following X" state is saved.
        console.error('Failed to update target user state:', e);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        following: actorProfile.following,
        targetFollowers: targetProfile.followers,
        isFollowing: action === 'follow'
      })
    };

  } catch (error) {
    console.error('Follow Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
