import { error, json } from '@sveltejs/kit';
import { env, requireUser } from '$lib/server/env';

export async function POST(event) {
	const user = requireUser(event);
	const { DB } = env(event);
	const id = event.params.id;
	const exists = await DB.prepare('SELECT 1 FROM posts WHERE id = ? AND deleted_at IS NULL').bind(id).first();
	if (!exists) error(404, 'Post not found');
	const del = await DB.prepare("DELETE FROM reactions WHERE post_id = ? AND user_id = ? AND kind = 'fire'").bind(id, user.id).run();
	if (!del.meta.changes) {
		await DB.prepare("INSERT INTO reactions (post_id, user_id, kind, created_at) VALUES (?, ?, 'fire', ?)").bind(id, user.id, Date.now()).run();
	}
	const count = await DB.prepare("SELECT COUNT(*) AS n FROM reactions WHERE post_id = ? AND kind = 'fire'").bind(id).first<{ n: number }>();
	return json({ fire: count?.n ?? 0, firedByMe: !del.meta.changes });
}
