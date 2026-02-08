/**
 * Fetch User's GitHub Gists
 * Returns gists for the logged-in user to attach to posts
 */
export async function handler(event, context) {
  const authHeader = event.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }
  
  const accessToken = authHeader.slice(7);
  
  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          query {
            viewer {
              gists(first: 20, orderBy: {field: CREATED_AT, direction: DESC}, privacy: PUBLIC) {
                nodes {
                  id
                  name
                  description
                  url
                  createdAt
                  files { name language { name } text }
                }
              }
            }
          }
        `
      })
    });
    
    const data = await response.json();
    const gists = data.data?.viewer?.gists?.nodes || [];
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gists.map(gist => ({
        id: gist.id,
        name: gist.name || gist.files?.[0]?.name || 'Untitled Gist',
        description: gist.description || '',
        url: gist.url,
        createdAt: gist.createdAt,
        files: gist.files?.map(f => ({
          name: f.name,
          language: f.language?.name || 'Text',
          preview: f.text?.substring(0, 100) || ''
        })) || []
      })))
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
