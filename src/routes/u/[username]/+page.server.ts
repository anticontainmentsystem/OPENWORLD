import { error } from '@sveltejs/kit';
import { env } from '$lib/server/env';
import { getFeed } from '$lib/server/posts';

export async function load(event) {
	const { DB } = env(event);
	const viewer = event.locals.user?.id ?? null;
	const profile = await DB.prepare(
		`SELECT u.id, u.username, u.name, u.avatar, u.bio, u.website, u.github_id, u.created_at,
		   (SELECT COUNT(*) FROM follows WHERE followee_id = u.id) AS followers,
		   (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following,
		   (SELECT COUNT(*) FROM posts WHERE author_id = u.id AND deleted_at IS NULL) AS posts,
		   EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = u.id) AS followed
		 FROM users u WHERE u.username = ?`
	)
		.bind(viewer ?? 0, event.params.username)
		.first<{
			id: number; username: string; name: string | null; avatar: string | null; bio: string | null; website: string | null;
			github_id: string | null; created_at: number; followers: number; following: number; posts: number; followed: number;
		}>();
	if (!profile) error(404, 'No one here by that name');
	const page = await getFeed(DB, viewer, { kind: 'author', authorId: profile.id });
	return { profile: { ...profile, followed: !!profile.followed, isGithub: !!profile.github_id && !profile.github_id.startsWith('-') }, page };
}
