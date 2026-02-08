import { readData } from './utils/gh.js';

/**
 * Get Post (API Endpoint)
 * Fetch a specific post by ID using the System PAT.
 * Avoiding direct client-side fetch due to raw.githubusercontent lag/CORS.
 */
export async function handler(event, context) {
  const { id } = event.queryStringParameters || {};
  
  // 1. Validation
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing post ID' })
    };
  }

  // 2. Fetch Posts.json using System PAT
  try {
    const file = await readData('posts.json');
    
    if (!file || !file.data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'posts.json not found' })
      };
    }

    // Find the specific post
    const post = file.data.find(p => p.id === id);

    if (!post) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Post not found' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      },
      body: JSON.stringify(post)
    };

  } catch (error) {
    console.error(`[API] Get Post Error (${id}):`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch post' })
    };
  }
}
