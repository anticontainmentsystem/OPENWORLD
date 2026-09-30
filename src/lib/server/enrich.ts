/**
 * Server-side enrichment: fetch shareable metadata for blocks that need it
 * (link previews, GitHub repo info). Results are cached in D1.
 */
import type { Block } from '$lib/types';
import { parseGithubRepo, parseUrl } from '$lib/modules/providers';

const TTL_OK = 24 * 60 * 60 * 1000;
const TTL_ERROR = 60 * 60 * 1000;
const MAX_HTML = 512 * 1024;

export interface LinkPreview {
	title: string | null;
	description: string | null;
	image: string | null;
	siteName: string | null;
	url: string;
}

export interface RepoInfo {
	description: string | null;
	stars: number;
	forks: number;
	language: string | null;
	topics: string[];
	homepage: string | null;
	updatedAt: string | null;
}

async function cached<T>(db: D1Database, key: string, load: () => Promise<T | null>): Promise<T | null> {
	const row = await db.prepare('SELECT data_json, status, fetched_at FROM link_cache WHERE url = ?').bind(key).first<{
		data_json: string | null;
		status: string;
		fetched_at: number;
	}>();
	if (row && Date.now() - row.fetched_at < (row.status === 'ok' ? TTL_OK : TTL_ERROR)) {
		return row.status === 'ok' && row.data_json ? (JSON.parse(row.data_json) as T) : null;
	}
	let data: T | null = null;
	try {
		data = await load();
	} catch {
		data = null;
	}
	await db
		.prepare('INSERT OR REPLACE INTO link_cache (url, data_json, status, fetched_at) VALUES (?, ?, ?, ?)')
		.bind(key, data ? JSON.stringify(data) : null, data ? 'ok' : 'error', Date.now())
		.run();
	return data;
}

function isPublicHost(u: URL): boolean {
	const h = u.hostname;
	if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || !h.includes('.')) return false;
	if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
	if (h.startsWith('[')) return false;
	return true;
}

const decodeEntities = (s: string) =>
	s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;|&apos;/g, "'")
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

function metaContent(html: string, names: string[]): string | null {
	for (const name of names) {
		const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, 'i');
		const tag = html.match(re)?.[0];
		const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
		if (content) return decodeEntities(content).trim();
	}
	return null;
}

async function readLimited(res: Response): Promise<string> {
	const reader = res.body?.getReader();
	if (!reader) return '';
	const chunks: Uint8Array[] = [];
	let size = 0;
	while (size < MAX_HTML) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
		size += value.length;
	}
	reader.cancel().catch(() => {});
	const all = new Uint8Array(size);
	let o = 0;
	for (const c of chunks) {
		all.set(c.subarray(0, Math.min(c.length, size - o)), o);
		o += c.length;
	}
	return new TextDecoder().decode(all);
}

export async function fetchLinkPreview(db: D1Database, raw: string): Promise<LinkPreview | null> {
	const u = parseUrl(raw);
	if (!u || !isPublicHost(u)) return null;
	return cached(db, `link:${u.href}`, async () => {
		const res = await fetch(u.href, {
			headers: { 'User-Agent': 'OpenWorldBot/1.0 (+link preview)', Accept: 'text/html' },
			redirect: 'follow',
			signal: AbortSignal.timeout(6000)
		});
		if (!res.ok || !(res.headers.get('content-type') ?? '').includes('html')) return null;
		const html = await readLimited(res);
		const abs = (v: string | null) => {
			if (!v) return null;
			try {
				const r = new URL(v, res.url || u.href);
				return r.protocol === 'https:' || r.protocol === 'http:' ? r.href : null;
			} catch {
				return null;
			}
		};
		const title = metaContent(html, ['og:title', 'twitter:title']) ?? decodeEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').trim();
		return {
			url: u.href,
			title: title?.slice(0, 200) || null,
			description: metaContent(html, ['og:description', 'twitter:description', 'description'])?.slice(0, 400) ?? null,
			image: abs(metaContent(html, ['og:image', 'og:image:url', 'twitter:image'])),
			siteName: metaContent(html, ['og:site_name'])?.slice(0, 80) ?? u.hostname.replace(/^www\./, '')
		};
	});
}

export async function fetchRepoInfo(db: D1Database, fullName: string, token?: string | null): Promise<RepoInfo | null> {
	return cached(db, `gh:${fullName.toLowerCase()}`, async () => {
		const res = await fetch(`https://api.github.com/repos/${fullName}`, {
			headers: {
				'User-Agent': 'OpenWorld',
				Accept: 'application/vnd.github+json',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			},
			signal: AbortSignal.timeout(6000)
		});
		if (!res.ok) return null;
		const r = (await res.json()) as any;
		return {
			description: r.description ?? null,
			stars: r.stargazers_count ?? 0,
			forks: r.forks_count ?? 0,
			language: r.language ?? null,
			topics: Array.isArray(r.topics) ? r.topics.slice(0, 8) : [],
			homepage: r.homepage || null,
			updatedAt: r.pushed_at ?? null
		};
	});
}

/** Attach server-fetched data to blocks that need it. Never fails the post. */
export async function enrichBlocks(db: D1Database, blocks: Block[], token?: string | null): Promise<Block[]> {
	return Promise.all(
		blocks.map(async (b) => {
			if (b.type === 'link') {
				const preview = await fetchLinkPreview(db, String(b.data.url));
				return preview ? { ...b, data: { ...b.data, preview } } : b;
			}
			if (b.type === 'github-repo') {
				const name = parseGithubRepo(String(b.data.repo));
				if (!name) return b;
				const info = await fetchRepoInfo(db, name, token);
				return { ...b, data: { ...b.data, repo: name, ...(info ? { info } : {}) } };
			}
			return b;
		})
	);
}
