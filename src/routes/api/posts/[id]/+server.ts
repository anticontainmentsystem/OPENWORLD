import { error, json } from '@sveltejs/kit';
import { env, requireUser } from '$lib/server/env';

export async function DELETE(event) {
	const user = requireUser(event);
	const { DB } = env(event);
	const r = await DB.prepare('UPDATE posts SET deleted_at = ? WHERE id = ? AND author_id = ? AND deleted_at IS NULL')
		.bind(Date.now(), event.params.id, user.id)
		.run();
	if (!r.meta.changes) error(404, 'Post not found');
	return json({ ok: true });
}
