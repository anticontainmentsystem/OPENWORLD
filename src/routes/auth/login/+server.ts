import { error, redirect } from '@sveltejs/kit';
import { randomToken } from '$lib/server/auth';
import { env } from '$lib/server/env';

export async function GET(event) {
	const { DB, GITHUB_CLIENT_ID } = env(event);
	if (!GITHUB_CLIENT_ID) error(500, 'GitHub login is not configured (GITHUB_CLIENT_ID)');
	const state = randomToken(16);
	await DB.prepare('DELETE FROM oauth_states WHERE created_at < ?').bind(Date.now() - 10 * 60 * 1000).run();
	await DB.prepare('INSERT INTO oauth_states (state, created_at) VALUES (?, ?)').bind(state, Date.now()).run();
	const url = new URL('https://github.com/login/oauth/authorize');
	url.searchParams.set('client_id', GITHUB_CLIENT_ID);
	url.searchParams.set('redirect_uri', `${event.url.origin}/auth/callback`);
	url.searchParams.set('state', state);
	redirect(302, url.toString());
}
