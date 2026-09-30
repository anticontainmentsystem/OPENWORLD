import { error } from '@sveltejs/kit';
import { env, githubToken } from '$lib/server/env';
import { STALE_MS, getRepo, syncRepo } from '$lib/server/repos';

export async function load(event) {
	const e = env(event);
	const row = await getRepo(e.DB, `${event.params.owner}/${event.params.name}`);
	if (!row) error(404, 'This repo isn’t on OpenWorld yet. If it’s yours, add it from your profile.');

	// Serve what we have; refresh from GitHub in the background when it's old.
	if (Date.now() - row.synced_at > STALE_MS) {
		const refresh = githubToken(event).then((t) => syncRepo(e.DB, row.full_name, t, e.GITHUB_API_BASE)).catch(() => {});
		event.platform?.ctx?.waitUntil?.(refresh);
	}

	const owner = await e.DB.prepare('SELECT id, username, name, avatar FROM users WHERE id = ?')
		.bind(row.owner_id)
		.first<{ id: number; username: string; name: string | null; avatar: string | null }>();
	return { repo: row.data, owner: owner!, syncedAt: row.synced_at, isOwner: event.locals.user?.id === row.owner_id };
}
