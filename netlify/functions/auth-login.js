/**
 * GitHub OAuth Login Redirect
 * Redirects user to GitHub authorization page
 */
export async function handler(event, context) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GitHub OAuth not configured' })
    };
  }
  
  // Build the OAuth URL
  const redirectUri = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/auth-callback`;
  const scope = 'read:user user:email public_repo';
  
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', generateState());
  
  return {
    statusCode: 302,
    headers: {
      Location: authUrl.toString(),
      'Cache-Control': 'no-cache'
    }
  };
}

function generateState() {
  return Math.random().toString(36).substring(2, 15);
}
