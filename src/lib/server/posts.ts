import type { Block, FeedPage, Post, Snapshot } from '$lib/types';

export const PAGE_SIZE = 10;

interface Row {
	id: string;
	blocks_json: string;
	snapshot_json: string;
	created_at: number;
	author_id: number;
	username: string;
	name: string | null;
	avatar: string | null;
	fire: number;
	fired_by_me: number;
}

const SELECT = `
	SELECT p.id, p.blocks_json, p.snapshot_json, p.created_at,
	       u.id AS author_id, u.username, u.name, u.avatar,
	       (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.kind = 'fire') AS fire,
	       EXISTS(SELECT 1 FROM reactions r WHERE r.post_id = p.id AND r.kind = 'fire' AND r.user_id = ?1) AS fired_by_me
	FROM posts p JOIN users u ON u.id = p.author_id
	WHERE p.deleted_at IS NULL`;

function toPost(r: Row): Post {
	return {
		id: r.id,
		author: { id: r.author_id, username: r.username, name: r.name, avatar: r.avatar },
		blocks: JSON.parse(r.blocks_json) as Block[],
		snapshot: JSON.parse(r.snapshot_json) as Snapshot,
		createdAt: r.created_at,
		fire: r.fire,
		firedByMe: !!r.fired_by_me
	};
}

export type FeedScope = { kind: 'all' } | { kind: 'following' } | { kind: 'author'; authorId: number };

/** Cursor is `${created_at}_${id}`; pages go from newest to oldest ("older") or oldest to newest ("newer"). */
export function parseCursor(c: string | null): { t: number; id: string } | null {
	const m = c?.match(/^(\d+)_(.+)$/);
	return m ? { t: Number(m[1]), id: m[2] } : null;
}
const cursorOf = (p: Post) => `${p.createdAt}_${p.id}`;

export async function getFeed(
	db: D1Database,
	viewerId: number | null,
	scope: FeedScope,
	opts: { before?: string | null; after?: string | null; inclusive?: boolean } = {}
): Promise<FeedPage> {
	const where: string[] = [];
	const args: unknown[] = [viewerId ?? 0];
	if (scope.kind === 'following') {
		where.push('p.author_id IN (SELECT followee_id FROM follows WHERE follower_id = ?)');
		args.push(viewerId ?? 0);
	} else if (scope.kind === 'author') {
		where.push('p.author_id = ?');
		args.push(scope.authorId);
	}
	const newer = !!opts.after;
	const c = parseCursor(opts.before ?? opts.after ?? null);
	if (c) {
		const cmp = newer ? '>' : opts.inclusive ? '<=' : '<';
		where.push(`(p.created_at, p.id) ${cmp} (?, ?)`);
		args.push(c.t, c.id);
	}
	const order = newer ? 'ASC' : 'DESC';
	const sql = `${SELECT} ${where.map((w) => `AND ${w}`).join(' ')} ORDER BY p.created_at ${order}, p.id ${order} LIMIT ${PAGE_SIZE + 1}`;
	const { results } = await db.prepare(sql).bind(...args).all<Row>();
	let posts = results.slice(0, PAGE_SIZE).map(toPost);
	const more = results.length > PAGE_SIZE;
	if (newer) posts = posts.reverse();
	return { posts, next: more ? cursorOf(newer ? posts[0] : posts[posts.length - 1]) : null };
}

export async function getPost(db: D1Database, viewerId: number | null, id: string): Promise<Post | null> {
	const row = await db.prepare(`${SELECT} AND p.id = ?2`).bind(viewerId ?? 0, id).first<Row>();
	return row ? toPost(row) : null;
}

export function newPostId(): string {
	const rand = crypto.getRandomValues(new Uint8Array(6));
	return Date.now().toString(36) + Array.from(rand, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 8);
}

export { cursorOf };
