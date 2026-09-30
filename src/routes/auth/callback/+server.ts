import { error, redirect } from '@sveltejs/kit';
import { createSession, encrypt, upsertGithubUser, type GithubProfile } from '$lib/server/auth';
import { env } from '$lib/server/env';

export async function GET(event) {
	const { DB, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET } = env(event);
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	if (!code || !state) error(400, 'Missing code or state');

	const valid = await DB.prepare('DELETE FROM oauth_states WHERE state = ? AND created_at > ? RETURNING state')
		.bind(state, Date.now() - 10 * 60 * 1000)
		.first();
	if (!valid) error(400, 'Login expired or invalid. Please try again.');

	const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code })
	});
	const tokenData = (await tokenRes.json()) as { access_token?: string; error_description?: string };
	if (!tokenData.access_token) error(400, tokenData.error_description ?? 'GitHub login failed');

	const userRes = await fetch('https://api.github.com/user', {
		headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'OpenWorld', Accept: 'application/vnd.github+json' }
	});
	if (!userRes.ok) error(502, 'Could not read your GitHub profile');
	const profile = (await userRes.json()) as GithubProfile;

	const userId = await upsertGithubUser(DB, profile);
	const tokenEnc = SESSION_SECRET ? await encrypt(tokenData.access_token, SESSION_SECRET) : null;
	await createSession(DB, event.cookies, userId, tokenEnc, event.url.protocol === 'https:');
	redirect(302, '/');
}
