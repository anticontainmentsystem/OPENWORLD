import { error, json } from '@sveltejs/kit';
import { env, requireUser } from '$lib/server/env';

export async function POST(event) {
	const user = requireUser(event);
	const { DB } = env(event);
	const target = await DB.prepare('SELECT id FROM users WHERE username = ?').bind(event.params.username).first<{ id: number }>();
	if (!target) error(404, 'No such user');
	if (target.id === user.id) error(400, 'You can’t follow yourself');
	const del = await DB.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').bind(user.id, target.id).run();
	if (!del.meta.changes) {
		await DB.prepare('INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)').bind(user.id, target.id, Date.now()).run();
	}
	const n = await DB.prepare('SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?').bind(target.id).first<{ n: number }>();
	return json({ following: !del.meta.changes, followers: n?.n ?? 0 });
}
