import { error, json } from '@sveltejs/kit';
import { suggestBlock } from '$lib/modules/registry';
import { enrichBlocks } from '$lib/server/enrich';
import { env, requireUser } from '$lib/server/env';

/** Suggest the best module for a pasted URL, with any server-fetched preview. */
export async function POST(event) {
	requireUser(event);
	const { DB } = env(event);
	const { url } = ((await event.request.json().catch(() => ({}))) ?? {}) as { url?: string };
	const block = typeof url === 'string' ? suggestBlock(url) : null;
	if (!block) error(400, 'That doesn’t look like a link');
	const [enriched] = await enrichBlocks(DB, [block]);
	return json(enriched);
}
