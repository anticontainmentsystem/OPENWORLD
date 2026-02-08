/**
 * Search GitHub Repositories
 * Search any public repo on GitHub by name
 */
export async function handler(event, context) {
  const authHeader = event.headers.authorization;
  const { q } = event.queryStringParameters || {};
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }
  
  if (!q || q.length < 2) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Query must be at least 2 characters' })
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
          query SearchRepos($query: String!) {
            search(query: $query, type: REPOSITORY, first: 10) {
              nodes {
                ... on Repository {
                  id
                  name
                  nameWithOwner
                  description
                  url
                  stargazerCount
                  primaryLanguage { name color }
                  owner { login avatarUrl }
                }
              }
            }
          }
        `,
        variables: { query: q }
      })
    });
    
    const data = await response.json();
    const repos = data.data?.search?.nodes?.filter(n => n.id) || [];
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repos.map(repo => ({
        id: repo.id,
        name: repo.nameWithOwner,
        description: repo.description || '',
        url: repo.url,
        stars: repo.stargazerCount,
        language: repo.primaryLanguage?.name || null,
        languageColor: repo.primaryLanguage?.color || null,
        owner: repo.owner?.login,
        ownerAvatar: repo.owner?.avatarUrl
      })))
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
