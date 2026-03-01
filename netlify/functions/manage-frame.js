/**
 * Manage Frame
 * Actions: edit, archive, adopt, delete
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
    const { action, frameId } = payload;

    if (!frameId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing frameId' }) };

    // Read index shard
    const timestamp = getTimestampFromId(frameId);
    const shardPath = getShardPath(timestamp);
    let shardResult;
    try {
      shardResult = await readData(shardPath);
    } catch (e) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Frame shard not found' }) };
    }

    const frames = shardResult?.data || [];
    const shardSha = shardResult?.sha;
    const frame = frames.find(f => f.id === frameId);
    if (!frame) return { statusCode: 404, body: JSON.stringify({ error: 'Frame not found' }) };

    const isCreator = String(frame.creatorId) === String(user.id);
    const now = new Date().toISOString();
    let message = '';

    if (action === 'edit') {
      if (!isCreator) return { statusCode: 403, body: JSON.stringify({ error: 'Only the frame creator can edit' }) };

      const { title, description, category, tags, icon } = payload;

      // Store version
      if (!frame.versions) frame.versions = [];
      frame.versions.push({
        timestamp: frame.updatedAt || frame.createdAt,
        title: frame.title,
        description: frame.description,
        category: frame.category,
        tags: frame.tags,
        icon: frame.icon
      });

      if (title) frame.title = title.trim();
      if (description) frame.description = description.trim();
      if (category) frame.category = category;
      if (tags) frame.tags = tags.slice(0, 5).map(t => t.trim().toLowerCase());
      if (icon) frame.icon = icon;
      frame.updatedAt = now;
      frame.lastActivityAt = now;
      message = `Edit frame "${frame.title}" by @${user.login}`;

    } else if (action === 'archive') {
      if (!isCreator) return { statusCode: 403, body: JSON.stringify({ error: 'Only the frame creator can archive' }) };

      frame.status = 'archived';
      frame.archivedAt = now;
      frame.archivedBy = user.login;
      frame.lastActivityAt = now;
      message = `Archive frame "${frame.title}" by @${user.login}`;

    } else if (action === 'adopt') {
      if (frame.status !== 'archived') {
        return { statusCode: 400, body: JSON.stringify({ error: 'Only archived frames can be adopted' }) };
      }

      frame.status = 'active';
      frame.adoptedBy = user.login;
      frame.adoptedAt = now;
      frame.creatorId = String(user.id);
      frame.creatorUsername = user.login;
      frame.creatorAvatar = user.avatar_url;
      frame.creatorName = user.name || user.login;
      frame.archivedAt = null;
      frame.archivedBy = null;
      frame.lastActivityAt = now;
      message = `Adopt frame "${frame.title}" by @${user.login}`;

      // Add new creator to members in body
      const bodyPath = `data/frames/body/${frameId}.json`;
      try {
        const bodyResult = await readData(bodyPath);
        if (bodyResult?.data) {
          const body = bodyResult.data;
          const alreadyMember = body.members?.some(m => String(m.userId) === String(user.id));
          if (!alreadyMember) {
            body.members.push({
              userId: String(user.id),
              username: user.login,
              avatar: user.avatar_url,
              role: 'creator',
              joinedAt: now
            });
            frame.memberCount = body.members.length;
          }
          // Demote old creator role
          const oldCreator = body.members.find(m => m.role === 'creator' && String(m.userId) !== String(user.id));
          if (oldCreator) oldCreator.role = 'member';

          await writeData(bodyPath, body, bodyResult.sha, `Update members for adoption by @${user.login}`);
        }
      } catch (e) {
        console.error('Error updating body on adopt:', e);
      }

    } else if (action === 'delete') {
      if (!isCreator) return { statusCode: 403, body: JSON.stringify({ error: 'Only the frame creator can delete' }) };

      frame.deleted = true;
      frame.deletedAt = now;
      message = `Soft delete frame "${frame.title}" by @${user.login}`;

    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action. Use: edit, archive, adopt, delete' }) };
    }

    await writeData(shardPath, frames, shardSha, message);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, frame })
    };

  } catch (error) {
    console.error('Manage Frame Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
