import { readData } from './utils/gh.js';

export const handler = async (event, context) => {
  const { username } = event.queryStringParameters;

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Username is required' })
    };
  }

  try {
    const profile = await readData(`users/${username}.json`);
    
    if (!profile) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify(profile.content ? JSON.parse(atob(profile.content)) : profile)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch profile', details: error.message })
    };
  }
};
