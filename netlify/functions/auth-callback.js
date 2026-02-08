/**
 * GitHub OAuth Callback
 * Exchanges code for access token and fetches user data
 */
export async function handler(event, context) {
  const { code } = event.queryStringParameters || {};
  
  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing authorization code' })
    };
  }
  
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GitHub OAuth not configured' })
    };
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }
    
    const accessToken = tokenData.access_token;
    
    // Fetch user data from GitHub
    const userResponse = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          query {
            viewer {
              id
              login
              name
              bio
              avatarUrl
              location
              websiteUrl
              company
              createdAt
              followers { totalCount }
              following { totalCount }
              repositories(first: 6, orderBy: {field: STARGAZERS, direction: DESC}, privacy: PUBLIC) {
                nodes {
                  name
                  description
                  url
                  stargazerCount
                  primaryLanguage { name }
                }
              }
            }
          }
        `
      })
    });
    
    const userData = await userResponse.json();
    const viewer = userData.data?.viewer;
    
    if (!viewer) {
      throw new Error('Failed to fetch user data');
    }
    
    // Build user object
    const user = {
      id: viewer.id,
      username: viewer.login,
      name: viewer.name || viewer.login,
      avatar: viewer.avatarUrl,
      bio: viewer.bio || '',
      location: viewer.location || '',
      website: viewer.websiteUrl || '',
      company: viewer.company || '',
      joinedAt: viewer.createdAt,
      followers: viewer.followers.totalCount,
      following: viewer.following.totalCount,
      github: viewer.login,
      accessToken: accessToken,
      repos: viewer.repositories.nodes.map(repo => ({
        name: repo.name,
        description: repo.description || '',
        url: repo.url,
        stars: repo.stargazerCount,
        language: repo.primaryLanguage?.name || 'Unknown'
      }))
    };
    
    // Encode user data for client
    const userDataEncoded = encodeURIComponent(JSON.stringify(user));
    
    // Redirect back to app with user data
    const redirectUrl = `${process.env.URL || 'http://localhost:8888'}/auth-success.html?user=${userDataEncoded}`;
    
    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl,
        'Cache-Control': 'no-cache'
      }
    };
    
  } catch (error) {
    console.error('OAuth error:', error);
    return {
      statusCode: 302,
      headers: {
        Location: `${process.env.URL || 'http://localhost:8888'}/auth-error.html?error=${encodeURIComponent(error.message)}`
      }
    };
  }
}
