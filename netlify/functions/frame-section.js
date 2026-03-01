/**
 * Frame Section
 * Actions: add, edit, remove, reorder
 * Creator-only operations for managing frame sections
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

const SECTION_TYPES = ['discussion', 'resources', 'faq'];

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
    const { action, frameId, sectionId } = payload;

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
    if (!body.sections) body.sections = [];

    // Only creator can manage sections
    const isCreator = body.members?.some(m => m.role === 'creator' && String(m.userId) === String(user.id));
    if (!isCreator) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Only the frame creator can manage sections' }) };
    }

    const now = new Date().toISOString();
    let message = '';

    if (action === 'add') {
      const { title, type } = payload;

      if (!title || title.trim().length < 2 || title.trim().length > 80) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Section title must be 2-80 characters' }) };
      }
      if (!type || !SECTION_TYPES.includes(type)) {
        return { statusCode: 400, body: JSON.stringify({ error: `Section type must be one of: ${SECTION_TYPES.join(', ')}` }) };
      }
      if (body.sections.length >= 20) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Maximum 20 sections per frame' }) };
      }

      const newSection = {
        id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        type,
        title: title.trim(),
        order: body.sections.length,
        createdAt: now,
        threads: type === 'discussion' ? [] : undefined,
        resources: type === 'resources' ? [] : undefined,
        items: type === 'faq' ? [] : undefined
      };

      body.sections.push(newSection);
      message = `Add section "${title}" to frame by @${user.login}`;

      await writeData(bodyPath, body, bodyResult.sha, message);

      // Update section count in shard
      await updateShardSectionCount(frameId, body.sections.length, now);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, section: newSection })
      };

    } else if (action === 'edit') {
      if (!sectionId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing sectionId' }) };

      const section = body.sections.find(s => s.id === sectionId);
      if (!section) return { statusCode: 404, body: JSON.stringify({ error: 'Section not found' }) };

      const { title } = payload;
      if (title) {
        if (title.trim().length < 2 || title.trim().length > 80) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Section title must be 2-80 characters' }) };
        }
        section.title = title.trim();
      }

      section.updatedAt = now;
      message = `Edit section "${section.title}" by @${user.login}`;

      await writeData(bodyPath, body, bodyResult.sha, message);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, section })
      };

    } else if (action === 'remove') {
      if (!sectionId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing sectionId' }) };

      if (body.sections.length <= 1) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Cannot remove the last section' }) };
      }

      const idx = body.sections.findIndex(s => s.id === sectionId);
      if (idx === -1) return { statusCode: 404, body: JSON.stringify({ error: 'Section not found' }) };

      const removed = body.sections.splice(idx, 1)[0];

      // Re-order remaining sections
      body.sections.forEach((s, i) => { s.order = i; });

      message = `Remove section "${removed.title}" from frame by @${user.login}`;
      await writeData(bodyPath, body, bodyResult.sha, message);

      await updateShardSectionCount(frameId, body.sections.length, now);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, removed: removed.title, sectionCount: body.sections.length })
      };

    } else if (action === 'reorder') {
      const { order } = payload;
      if (!Array.isArray(order)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'order must be an array of section IDs' }) };
      }

      // Validate all IDs exist
      const currentIds = new Set(body.sections.map(s => s.id));
      const orderIds = new Set(order);
      if (order.length !== body.sections.length || ![...orderIds].every(id => currentIds.has(id))) {
        return { statusCode: 400, body: JSON.stringify({ error: 'order must contain all existing section IDs exactly once' }) };
      }

      // Reorder
      const sectionMap = Object.fromEntries(body.sections.map(s => [s.id, s]));
      body.sections = order.map((id, i) => {
        const s = sectionMap[id];
        s.order = i;
        return s;
      });

      message = `Reorder sections by @${user.login}`;
      await writeData(bodyPath, body, bodyResult.sha, message);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, sections: body.sections.map(s => ({ id: s.id, title: s.title, order: s.order })) })
      };

    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action. Use: add, edit, remove, reorder' }) };
    }

  } catch (error) {
    console.error('Frame Section Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

/**
 * Update the sectionCount in the index shard
 */
async function updateShardSectionCount(frameId, count, now) {
  try {
    const timestamp = getTimestampFromId(frameId);
    const shardPath = getShardPath(timestamp);
    const shardResult = await readData(shardPath);
    if (!shardResult?.data) return;

    const frames = shardResult.data;
    const frame = frames.find(f => f.id === frameId);
    if (!frame) return;

    frame.sectionCount = count;
    frame.lastActivityAt = now;

    await writeData(shardPath, frames, shardResult.sha, `Update section count for "${frame.title}"`);
  } catch (e) {
    console.error('Error updating shard section count:', e);
  }
}
