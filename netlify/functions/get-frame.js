/**
 * Get Frame
 * Returns a single frame's full body by ID
 */
import { readData } from './utils/gh.js';

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const params = event.queryStringParameters || {};
    const { id } = params;

    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing frame id parameter' }) };
    }

    const bodyPath = `data/frames/body/${id}.json`;
    const result = await readData(bodyPath);

    if (!result || !result.data) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Frame not found' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.data)
    };

  } catch (error) {
    console.error('Get Frame Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
