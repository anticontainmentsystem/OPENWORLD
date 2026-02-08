import { readData } from './utils/gh.js';

/**
 * Get Repo Contents (API Endpoint)
 * List files/directories in a repo path.
 */
export async function handler(event, context) {
  const { owner, repo, path } = event.queryStringParameters || {};
  
  if (!owner || !repo) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing owner or repo' })
    };
  }

  const targetPath = path || '';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}`;
  
  // Prefer user token if provided (for private repos), fallback to System PAT
  const userToken = event.headers.authorization ? event.headers.authorization.replace('Bearer ', '') : null;
  const token = userToken || process.env.GITHUB_PAT;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
       // Forward GitHub error (e.g. 404 if path doesn't exist)
       return {
         statusCode: response.status,
         body: await response.text()
       };
    }

    const data = await response.json();
    
    // Transform to simple format
    const contents = Array.isArray(data) ? data.map(item => ({
      name: item.name,
      type: item.type, // 'file' or 'dir'
      path: item.path,
      sha: item.sha,
      size: item.size,
      url: item.html_url,
      download_url: item.download_url
    })) : data; // Single file returns object, not array

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 min cache
      },
      body: JSON.stringify(contents)
    };

  } catch (error) {
    console.error(`[API] Get Repo Contents Error:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch repo contents' })
    };
  }
}
