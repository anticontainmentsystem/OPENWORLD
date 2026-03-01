/**
 * Frame Member
 * Actions: join, leave, remove (creator removes someone)
 */
import { readData, writeData } from './utils/gh.js';

function getTimestampFromId(id) {
  if (!id) return Date.now();
  const parts = id.split('_');
  return parts.length >= 2 && !isNaN(parts[1]) ? parseInt(parts[1]) : Date.now();
}

function getShardPath(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `data/frames/${year}/${month}.json`;
}

export const handler = async (event) => {
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
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!userRes.ok) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid GitHub Token' }) };
    user = await userRes.json();
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Authentication failed' }) };
  }

  try {
    const payload = JSON.parse(event.body);
    const { action, frameId, targetUserId } = payload;

    if (!frameId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing frameId' }) };

    // Read body file
    const bodyPath = `data/frames/body/${frameId}.json`;
    let bodyResult;
    try {
      bodyResult = await readData(bodyPath);
    } catch (e) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Frame body not found' }) };
    }
    if (!bodyResult?.data) return { statusCode: 404, body: JSON.stringify({ error: 'Frame not found' }) };

    const body = bodyResult.data;
    if (!body.members) body.members = [];

    const now = new Date().toISOString();
    const userId = String(user.id);
    const isCreator = body.members.some(m => m.role === 'creator' && String(m.userId) === userId);

    if (action === 'join') {
      const alreadyMember = body.members.some(m => String(m.userId) === userId);
      if (alreadyMember) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Already a member' }) };
      }

      body.members.push({
        userId,
        username: user.login,
        avatar: user.avatar_url,
        role: 'member',
        joinedAt: now
      });

      await writeData(bodyPath, body, bodyResult.sha, `@${user.login} joined frame`);

      // Update member count in index shard
      await updateShardMemberCount(frameId, body.members.length, now);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, memberCount: body.members.length })
      };

    } else if (action === 'leave') {
      if (isCreator) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Creator cannot leave. Archive the frame instead.' }) };
      }

      const idx = body.members.findIndex(m => String(m.userId) === userId);
      if (idx === -1) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Not a member' }) };
      }

      body.members.splice(idx, 1);
      await writeData(bodyPath, body, bodyResult.sha, `@${user.login} left frame`);

      await updateShardMemberCount(frameId, body.members.length, now);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, memberCount: body.members.length })
      };

    } else if (action === 'remove') {
      if (!isCreator) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Only the creator can remove members' }) };
      }
      if (!targetUserId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing targetUserId' }) };
      }
      if (String(targetUserId) === userId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Cannot remove yourself' }) };
      }

      const idx = body.members.findIndex(m => String(m.userId) === String(targetUserId));
      if (idx === -1) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Target user is not a member' }) };
      }

      const removed = body.members.splice(idx, 1)[0];
      await writeData(bodyPath, body, bodyResult.sha, `@${user.login} removed @${removed.username} from frame`);

      await updateShardMemberCount(frameId, body.members.length, now);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, removed: removed.username, memberCount: body.members.length })
      };

    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action. Use: join, leave, remove' }) };
    }

  } catch (error) {
    console.error('Frame Member Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

/**
 * Update the memberCount in the index shard
 */
async function updateShardMemberCount(frameId, count, now) {
  try {
    const timestamp = getTimestampFromId(frameId);
    const shardPath = getShardPath(timestamp);
    const shardResult = await readData(shardPath);
    if (!shardResult?.data) return;

    const frames = shardResult.data;
    const frame = frames.find(f => f.id === frameId);
    if (!frame) return;

    frame.memberCount = count;
    frame.lastActivityAt = now;

    await writeData(shardPath, frames, shardResult.sha, `Update member count for "${frame.title}"`);
  } catch (e) {
    console.error('Error updating shard member count:', e);
  }
}
