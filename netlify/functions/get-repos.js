/**
 * Fetch User's GitHub Repositories
 * Returns repos for the logged-in user to attach to posts
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
              repositories(first: 20, orderBy: {field: PUSHED_AT, direction: DESC}, privacy: PUBLIC) {
                nodes {
                  id
                  name
                  nameWithOwner
                  description
                  url
                  stargazerCount
                  primaryLanguage { name color }
                  pushedAt
                }
              }
            }
          }
        `
      })
    });
    
    const data = await response.json();
    const repos = data.data?.viewer?.repositories?.nodes || [];
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(repos.map(repo => ({
        id: repo.id,
        name: repo.nameWithOwner,
        description: repo.description || '',
        url: repo.url,
        stars: repo.stargazerCount,
        language: repo.primaryLanguage?.name || null,
        languageColor: repo.primaryLanguage?.color || null,
        pushedAt: repo.pushedAt
      })))
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
