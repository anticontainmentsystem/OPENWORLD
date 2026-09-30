import { error } from '@sveltejs/kit';
import { env } from '$lib/server/env';
import { cursorOf, getFeed, getPost, type FeedScope } from '$lib/server/posts';

export async function load(event) {
	const { DB } = env(event);
	const viewer = event.locals.user?.id ?? null;
	const post = await getPost(DB, viewer, event.params.id);
	if (!post) error(404, 'This post doesn’t exist (or was deleted)');

	let scope = event.url.searchParams.get('scope') ?? 'all';
	let feedScope: FeedScope = { kind: 'all' };
	if (scope === 'following' && viewer) feedScope = { kind: 'following' };
	else if (scope.startsWith('u:')) feedScope = { kind: 'author', authorId: post.author.id };
	else scope = 'all';

	const cursor = cursorOf(post);
	const page = await getFeed(DB, viewer, feedScope, { before: cursor, inclusive: true });
	if (page.posts[0]?.id !== post.id) page.posts.unshift(post);
	return { post, page, scope, newerFrom: cursor };
}
