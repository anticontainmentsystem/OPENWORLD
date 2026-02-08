/**
 * Mark Notifications Read
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
    // Verify user
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!userRes.ok) throw new Error('Invalid token');
    const user = await userRes.json();
    
    const { notificationIds, markAll } = JSON.parse(event.body);

    const filePath = `notifications/${user.login}.json`;
    const result = await readData(filePath);
    
    if (!result || !result.data) {
       return { statusCode: 200, body: JSON.stringify({ success: true, count: 0 }) };
    }
    
    let notifications = result.data;
    let modified = false;
    
    if (markAll) {
      notifications.forEach(n => {
        if (!n.read) {
          n.read = true;
          modified = true;
        }
      });
    } else if (Array.isArray(notificationIds)) {
      notifications.forEach(n => {
        if (notificationIds.includes(n.id) && !n.read) {
          n.read = true;
          modified = true;
        }
      });
    }

    if (modified) {
      await writeData(filePath, notifications, result.sha, 'Mark notifications read');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Mark Read Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
