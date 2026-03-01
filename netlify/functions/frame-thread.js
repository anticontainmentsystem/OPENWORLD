/**
 * Frame Thread
 * Actions: create, reply, pin, lock, delete
 * Discussion threads within frame sections
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
    const { action, frameId, sectionId, threadId, replyId } = payload;

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
    const userId = String(user.id);
    const isCreator = body.members?.some(m => m.role === 'creator' && String(m.userId) === userId);
    const isMember = body.members?.some(m => String(m.userId) === userId);
    const now = new Date().toISOString();

    // Find the target section (for create/reply)
    let section;
    if (sectionId) {
      section = body.sections?.find(s => s.id === sectionId);
      if (!section) return { statusCode: 404, body: JSON.stringify({ error: 'Section not found' }) };
      if (section.type !== 'discussion') {
        return { statusCode: 400, body: JSON.stringify({ error: 'Threads can only be added to discussion sections' }) };
      }
      if (!section.threads) section.threads = [];
    }

    if (action === 'create') {
      if (!sectionId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing sectionId' }) };

      const { title, content } = payload;
      if (!title || title.trim().length < 2 || title.trim().length > 150) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Thread title must be 2-150 characters' }) };
      }
      if (!content || content.trim().length < 1 || content.trim().length > 5000) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Thread content must be 1-5000 characters' }) };
      }

      // Auto-join on first contribution
      if (!isMember) {
        body.members.push({
          userId,
          username: user.login,
          avatar: user.avatar_url,
          role: 'member',
          joinedAt: now
        });
      }

      const thread = {
        id: 'thr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        title: title.trim(),
        content: content.trim(),
        authorId: userId,
        authorUsername: user.login,
        authorAvatar: user.avatar_url,
        createdAt: now,
        pinned: false,
        locked: false,
        deleted: false,
        replies: []
      };

      section.threads.unshift(thread);

      await writeData(bodyPath, body, bodyResult.sha, `New thread "${title}" by @${user.login}`);

      // Update shard activity
      await updateShardActivity(frameId, now, body.members.length);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, thread })
      };

    } else if (action === 'reply') {
      if (!sectionId || !threadId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing sectionId or threadId' }) };
      }

      const thread = section.threads?.find(t => t.id === threadId);
      if (!thread) return { statusCode: 404, body: JSON.stringify({ error: 'Thread not found' }) };
      if (thread.deleted) return { statusCode: 400, body: JSON.stringify({ error: 'Cannot reply to a deleted thread' }) };
      if (thread.locked && !isCreator) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Thread is locked' }) };
      }

      const { content } = payload;
      if (!content || content.trim().length < 1 || content.trim().length > 3000) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Reply must be 1-3000 characters' }) };
      }

      // Auto-join
      if (!isMember) {
        body.members.push({
          userId,
          username: user.login,
          avatar: user.avatar_url,
          role: 'member',
          joinedAt: now
        });
      }

      if (!thread.replies) thread.replies = [];

      const reply = {
        id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        content: content.trim(),
        authorId: userId,
        authorUsername: user.login,
        authorAvatar: user.avatar_url,
        createdAt: now,
        deleted: false
      };

      thread.replies.push(reply);

      await writeData(bodyPath, body, bodyResult.sha, `Reply to "${thread.title}" by @${user.login}`);
      await updateShardActivity(frameId, now, body.members.length);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, reply })
      };

    } else if (action === 'pin' || action === 'lock') {
      if (!isCreator) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Only the frame creator can pin/lock threads' }) };
      }
      if (!sectionId || !threadId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing sectionId or threadId' }) };
      }

      const thread = section.threads?.find(t => t.id === threadId);
      if (!thread) return { statusCode: 404, body: JSON.stringify({ error: 'Thread not found' }) };

      if (action === 'pin') {
        thread.pinned = !thread.pinned;
      } else {
        thread.locked = !thread.locked;
      }

      await writeData(bodyPath, body, bodyResult.sha, `${action === 'pin' ? 'Toggle pin' : 'Toggle lock'} on "${thread.title}" by @${user.login}`);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, pinned: thread.pinned, locked: thread.locked })
      };

    } else if (action === 'delete') {
      if (!sectionId || !threadId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing sectionId or threadId' }) };
      }

      const thread = section.threads?.find(t => t.id === threadId);
      if (!thread) return { statusCode: 404, body: JSON.stringify({ error: 'Thread not found' }) };

      const isAuthor = String(thread.authorId) === userId;
      if (!isAuthor && !isCreator) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Only the thread author or frame creator can delete' }) };
      }

      // If deleting a reply specifically
      if (replyId) {
        const reply = thread.replies?.find(r => r.id === replyId);
        if (!reply) return { statusCode: 404, body: JSON.stringify({ error: 'Reply not found' }) };

        const isReplyAuthor = String(reply.authorId) === userId;
        if (!isReplyAuthor && !isCreator) {
          return { statusCode: 403, body: JSON.stringify({ error: 'Only the reply author or frame creator can delete' }) };
        }

        reply.deleted = true;
        reply.deletedAt = now;
        reply.content = '[deleted]';

        await writeData(bodyPath, body, bodyResult.sha, `Delete reply by @${user.login}`);
        return { statusCode: 200, body: JSON.stringify({ success: true, deletedReply: replyId }) };
      }

      // Soft-delete the entire thread
      thread.deleted = true;
      thread.deletedAt = now;

      await writeData(bodyPath, body, bodyResult.sha, `Delete thread "${thread.title}" by @${user.login}`);
      await updateShardActivity(frameId, now);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, deletedThread: threadId })
      };

    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action. Use: create, reply, pin, lock, delete' }) };
    }

  } catch (error) {
    console.error('Frame Thread Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

/**
 * Update lastActivityAt (and optionally memberCount) in the index shard
 */
async function updateShardActivity(frameId, now, memberCount) {
  try {
    const timestamp = getTimestampFromId(frameId);
    const shardPath = getShardPath(timestamp);
    const shardResult = await readData(shardPath);
    if (!shardResult?.data) return;

    const frames = shardResult.data;
    const frame = frames.find(f => f.id === frameId);
    if (!frame) return;

    frame.lastActivityAt = now;
    if (memberCount !== undefined) frame.memberCount = memberCount;

    await writeData(shardPath, frames, shardResult.sha, `Update activity for "${frame.title}"`);
  } catch (e) {
    console.error('Error updating shard activity:', e);
  }
}
