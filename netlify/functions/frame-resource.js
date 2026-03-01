/**
 * Frame Resource
 * Actions: add-resource, remove-resource, add-faq, remove-faq
 * Manages resources and FAQ items within frame sections
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
    const { action, frameId, sectionId, itemId } = payload;

    if (!frameId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing frameId' }) };
    if (!sectionId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing sectionId' }) };

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

    const section = body.sections?.find(s => s.id === sectionId);
    if (!section) return { statusCode: 404, body: JSON.stringify({ error: 'Section not found' }) };

    if (action === 'add-resource') {
      if (section.type !== 'resources') {
        return { statusCode: 400, body: JSON.stringify({ error: 'Can only add resources to resource sections' }) };
      }

      const { title, url, description } = payload;
      if (!title || title.trim().length < 2 || title.trim().length > 150) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Resource title must be 2-150 characters' }) };
      }
      if (!url || url.trim().length < 5) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Valid URL required' }) };
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

      if (!section.resources) section.resources = [];

      if (section.resources.length >= 100) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Maximum 100 resources per section' }) };
      }

      const resource = {
        id: 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        title: title.trim(),
        url: url.trim(),
        description: description ? description.trim().substring(0, 300) : '',
        addedBy: user.login,
        addedById: userId,
        addedAt: now,
        deleted: false
      };

      section.resources.push(resource);

      await writeData(bodyPath, body, bodyResult.sha, `Add resource "${title}" by @${user.login}`);
      await updateShardActivity(frameId, now, body.members.length);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, resource })
      };

    } else if (action === 'remove-resource') {
      if (!itemId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing itemId' }) };

      const resource = section.resources?.find(r => r.id === itemId);
      if (!resource) return { statusCode: 404, body: JSON.stringify({ error: 'Resource not found' }) };

      const isAuthor = String(resource.addedById) === userId;
      if (!isAuthor && !isCreator) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Only the resource author or frame creator can remove' }) };
      }

      resource.deleted = true;
      resource.deletedAt = now;

      await writeData(bodyPath, body, bodyResult.sha, `Remove resource "${resource.title}" by @${user.login}`);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, removed: itemId })
      };

    } else if (action === 'add-faq') {
      if (section.type !== 'faq') {
        return { statusCode: 400, body: JSON.stringify({ error: 'Can only add FAQ items to FAQ sections' }) };
      }

      const { question, answer } = payload;
      if (!question || question.trim().length < 5 || question.trim().length > 300) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Question must be 5-300 characters' }) };
      }
      if (!answer || answer.trim().length < 2 || answer.trim().length > 3000) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Answer must be 2-3000 characters' }) };
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

      if (!section.items) section.items = [];

      if (section.items.length >= 100) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Maximum 100 FAQ items per section' }) };
      }

      const faqItem = {
        id: 'faq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        question: question.trim(),
        answer: answer.trim(),
        addedBy: user.login,
        addedById: userId,
        addedAt: now,
        deleted: false
      };

      section.items.push(faqItem);

      await writeData(bodyPath, body, bodyResult.sha, `Add FAQ "${question.substring(0, 40)}" by @${user.login}`);
      await updateShardActivity(frameId, now, body.members.length);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, faq: faqItem })
      };

    } else if (action === 'remove-faq') {
      if (!itemId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing itemId' }) };

      const faq = section.items?.find(f => f.id === itemId);
      if (!faq) return { statusCode: 404, body: JSON.stringify({ error: 'FAQ item not found' }) };

      const isAuthor = String(faq.addedById) === userId;
      if (!isAuthor && !isCreator) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Only the FAQ author or frame creator can remove' }) };
      }

      faq.deleted = true;
      faq.deletedAt = now;

      await writeData(bodyPath, body, bodyResult.sha, `Remove FAQ by @${user.login}`);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, removed: itemId })
      };

    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action. Use: add-resource, remove-resource, add-faq, remove-faq' }) };
    }

  } catch (error) {
    console.error('Frame Resource Error:', error);
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
