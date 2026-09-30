import { error, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { createSession, upsertGithubUser } from '$lib/server/auth';
import { env } from '$lib/server/env';

/** Local-only sign-in as a fake user, for developing without a GitHub OAuth app. */
export async function GET(event) {
	const e = env(event);
	if (!dev || e.DEV_LOGIN !== '1') error(404, 'Not found');
	const name = (event.url.searchParams.get('as') ?? 'dev-artist').replace(/[^\w-]/g, '').slice(0, 39) || 'dev-artist';
	const existing = await e.DB.prepare('SELECT id FROM users WHERE username = ?').bind(name).first<{ id: number }>();
	if (existing) {
		await createSession(e.DB, event.cookies, existing.id, null, false);
		redirect(302, '/');
	}
	const fakeId = -Math.abs([...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
	const userId = await upsertGithubUser(e.DB, { id: fakeId, login: name, name, avatar_url: '', bio: null, blog: null });
	await createSession(e.DB, event.cookies, userId, null, false);
	redirect(302, '/');
}
