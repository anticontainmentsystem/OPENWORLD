import { error, json } from '@sveltejs/kit';
import { env } from '$lib/server/env';
import { getFeed, type FeedScope } from '$lib/server/posts';

export async function GET(event) {
	const { DB } = env(event);
	const p = event.url.searchParams;
	const scopeParam = p.get('scope') ?? 'all';
	let scope: FeedScope = { kind: 'all' };
	if (scopeParam === 'following') {
		if (!event.locals.user) error(401, 'Sign in to see who you follow');
		scope = { kind: 'following' };
	} else if (scopeParam.startsWith('u:')) {
		const u = await DB.prepare('SELECT id FROM users WHERE username = ?').bind(scopeParam.slice(2)).first<{ id: number }>();
		if (!u) error(404, 'No such user');
		scope = { kind: 'author', authorId: u.id };
	}
	const page = await getFeed(DB, event.locals.user?.id ?? null, scope, {
		before: p.get('before'),
		after: p.get('after'),
		inclusive: p.get('inclusive') === '1'
	});
	return json(page);
}
