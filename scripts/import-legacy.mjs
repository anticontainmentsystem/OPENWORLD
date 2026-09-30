#!/usr/bin/env node
/**
 * One-time import of the old GitHub-backed data (anticontainmentsystem/openworld-data)
 * into D1. Prints SQL to stdout.
 *
 *   node scripts/import-legacy.mjs ../openworld-data > legacy.sql
 *   npx wrangler d1 execute openworld --remote --file legacy.sql
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
if (!root || !existsSync(root)) {
	console.error('Usage: node scripts/import-legacy.mjs <path-to-openworld-data>');
	process.exit(1);
}

const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8').replace(/^﻿/, ''));
const walk = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.json') ? [join(dir, e.name)] : []));

const out = [];
const users = new Map();

for (const f of existsSync(join(root, 'users')) ? walk(join(root, 'users')) : []) {
	const u = readJson(f);
	users.set(String(u.id), u);
	out.push(
		`INSERT OR IGNORE INTO users (github_id, username, name, avatar, bio, created_at) VALUES (${q(String(u.id))}, ${q(u.username)}, ${q(u.name)}, ${q(u.avatar)}, ${q(u.bio || null)}, ${q(Date.parse(u.joinedAt) || Date.now())});`
	);
}

const posts = [];
if (existsSync(join(root, 'posts.json'))) posts.push(...readJson(join(root, 'posts.json')));
if (existsSync(join(root, 'data/posts'))) for (const f of walk(join(root, 'data/posts'))) posts.push(...readJson(f));

const seen = new Set();
for (const p of posts) {
	if (!p?.id || p.deleted || seen.has(p.id)) continue;
	seen.add(p.id);
	if (!users.has(String(p.userId))) {
		users.set(String(p.userId), p);
		out.push(
			`INSERT OR IGNORE INTO users (github_id, username, name, avatar, created_at) VALUES (${q(String(p.userId))}, ${q(p.username)}, ${q(p.userName)}, ${q(p.userAvatar)}, ${q(Date.parse(p.createdAt))});`
		);
	}
	const blocks = [];
	if (p.content) blocks.push({ type: 'text', data: { body: String(p.content).slice(0, 5000) } });
	if (p.media?.url?.startsWith('http')) blocks.push({ type: 'image', data: { url: p.media.url } });
	if (p.repo?.name) blocks.push({ type: 'github-repo', data: { repo: p.repo.name } });
	if (p.code?.code) blocks.push({ type: 'code', data: { code: p.code.code, language: p.code.language || '' } });
	if (!blocks.length) continue;
	const first = blocks.find((b) => b.type === 'text');
	const snapshot = {
		title: p.repo?.name ?? null,
		excerpt: first ? first.data.body.slice(0, 140) : null,
		image: p.media?.url ?? (p.repo?.name ? `https://opengraph.githubassets.com/1/${p.repo.name}` : null),
		kinds: [...new Set(blocks.map((b) => b.type))]
	};
	out.push(
		`INSERT OR IGNORE INTO posts (id, author_id, blocks_json, snapshot_json, created_at) SELECT ${q('legacy_' + p.id)}, id, ${q(JSON.stringify(blocks))}, ${q(JSON.stringify(snapshot))}, ${q(Date.parse(p.createdAt))} FROM users WHERE github_id = ${q(String(p.userId))};`
	);
}

for (const [id, u] of users) {
	for (const target of u.followingList ?? []) {
		out.push(
			`INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) SELECT a.id, b.id, ${Date.now()} FROM users a, users b WHERE a.github_id = ${q(id)} AND b.username = ${q(target)};`
		);
	}
}

console.log(out.join('\n'));
