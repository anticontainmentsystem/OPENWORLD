import { env } from '$lib/server/env';
import { getFeed } from '$lib/server/posts';

export async function load(event) {
	const { DB } = env(event);
	const following = event.url.searchParams.get('scope') === 'following' && !!event.locals.user;
	const page = await getFeed(DB, event.locals.user?.id ?? null, following ? { kind: 'following' } : { kind: 'all' });
	return { page, scope: following ? 'following' : 'all', view: event.url.searchParams.get('view') === 'grid' ? 'grid' : 'focus' };
}
