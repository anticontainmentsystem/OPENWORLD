import { error, json } from '@sveltejs/kit';
import { MAX_BLOCKS, buildSnapshot, stripServerKeys, validateBlock } from '$lib/modules/registry';
import { enrichBlocks } from '$lib/server/enrich';
import { env, githubToken, requireUser } from '$lib/server/env';
import { getPost, newPostId } from '$lib/server/posts';
import type { Block } from '$lib/types';

const COOLDOWN_MS = 5000;

export async function POST(event) {
	const user = requireUser(event);
	const e = env(event);
	const body = (await event.request.json().catch(() => null)) as { blocks?: unknown } | null;
	if (!body || !Array.isArray(body.blocks) || body.blocks.length === 0) error(400, 'A post needs at least one module');
	if (body.blocks.length > MAX_BLOCKS) error(400, `At most ${MAX_BLOCKS} modules per post`);

	const blocks: Block[] = [];
	for (const raw of body.blocks) {
		const r = validateBlock(raw);
		if (!r.ok) error(400, r.error);
		blocks.push(stripServerKeys(r.block));
	}

	const last = await e.DB.prepare('SELECT MAX(created_at) AS t FROM posts WHERE author_id = ?').bind(user.id).first<{ t: number | null }>();
	if (last?.t && Date.now() - last.t < COOLDOWN_MS) error(429, 'Slow down a little — try again in a few seconds');

	const enriched = await enrichBlocks(e.DB, blocks, await githubToken(event));
	const id = newPostId();
	await e.DB.prepare('INSERT INTO posts (id, author_id, blocks_json, snapshot_json, created_at) VALUES (?, ?, ?, ?, ?)')
		.bind(id, user.id, JSON.stringify(enriched), JSON.stringify(buildSnapshot(enriched)), Date.now())
		.run();
	return json(await getPost(e.DB, user.id, id), { status: 201 });
}
