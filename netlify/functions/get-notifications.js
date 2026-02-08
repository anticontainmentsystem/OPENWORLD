/**
 * Get Notifications
 * Fetch user notifications
 */
import { readData } from './utils/gh.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
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

    // Read notifications
    const result = await readData(`notifications/${user.login}.json`);
    const notifications = result?.data || [];

    return {
      statusCode: 200,
      body: JSON.stringify(notifications)
    };

  } catch (error) {
    console.error('Get Notifications Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
