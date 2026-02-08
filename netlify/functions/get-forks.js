/**
 * Get Forks (API Endpoint)
 * List forks of a specific repository to show community engagement.
 */
export async function handler(event, context) {
  const { owner, repo } = event.queryStringParameters || {};
  
  if (!owner || !repo) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing owner or repo' })
    };
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/forks?sort=stargazers&per_page=10`;
  const GITHUB_PAT = process.env.GITHUB_PAT;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
       return {
         statusCode: response.status,
         body: await response.text()
       };
    }

    const data = await response.json();
    
    // Transform to simple format
    const forks = data.map(fork => ({
      id: fork.id,
      name: fork.name, // e.g. "openworld-fork"
      full_name: fork.full_name, // e.g. "user123/openworld-fork"
      owner: fork.owner.login,
      owner_avatar: fork.owner.avatar_url,
      description: fork.description,
      url: fork.html_url,
      stars: fork.stargazers_count,
      updated_at: fork.updated_at
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600' // 10 min cache
      },
      body: JSON.stringify(forks)
    };

  } catch (error) {
    console.error(`[API] Get Forks Error:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch forks' })
    };
  }
}
