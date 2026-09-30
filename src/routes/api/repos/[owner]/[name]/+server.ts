import { error, json } from '@sveltejs/kit';
import { env, requireUser } from '$lib/server/env';

export async function DELETE(event) {
	const user = requireUser(event);
	const { DB } = env(event);
	const r = await DB.prepare('DELETE FROM repos WHERE full_name = ? AND owner_id = ?')
		.bind(`${event.params.owner}/${event.params.name}`, user.id)
		.run();
	if (!r.meta.changes) error(404, 'Not found');
	return json({ ok: true });
}
