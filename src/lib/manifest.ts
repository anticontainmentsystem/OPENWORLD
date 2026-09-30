/**
 * openworld.yml — the file a creator puts in a GitHub repo to describe their work.
 * See docs/MANIFEST.md for the format.
 *
 * Parsing never throws: problems are collected in `issues` so the owner can fix them,
 * and everything that is valid still shows.
 */
import { parse } from 'yaml';
import { moduleMap, validateBlock } from '$lib/modules/registry';
import type { Block } from '$lib/types';

export const MEDIUMS = [
	'theater', 'dance', 'music', 'sound', 'film', 'visual-art', 'sculpture', 'photography', 'writing',
	'poetry', 'code', 'games', 'design', 'architecture', 'craft', 'cuisine', 'fashion', 'performance',
	'light-art', 'mixed-media', 'other'
];

export const MAX_MANIFEST_BYTES = 64 * 1024;
const MAX_SHOWCASE = 30;

export interface Manifest {
	title: string | null;
	medium: string | null;
	summary: string | null;
	cover: string | null;
	credits: string[];
	links: string[];
	showcase: Block[];
	issues: string[];
}

export const emptyManifest = (): Manifest => ({
	title: null, medium: null, summary: null, cover: null, credits: [], links: [], showcase: [], issues: []
});

/** Turn a repo-relative path into a raw file URL; absolute http(s) URLs pass through. */
export function resolvePath(value: string, repo: string, branch: string): string | null {
	const v = value.trim();
	if (/^https?:\/\//i.test(v)) return v;
	if (/^[a-z][\w+.-]*:/i.test(v)) return null; // other schemes (javascript:, data:, …)
	const path = v.replace(/^\.?\//, '');
	if (!path || path.split('/').some((seg) => seg === '..')) return null;
	return `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const strList = (v: unknown, max: number) =>
	(Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : [])
		.map((x) => (typeof x === 'string' || typeof x === 'number' ? String(x).trim() : ''))
		.filter(Boolean)
		.slice(0, max);

/** The field a short-form entry (`- gallery: [a.jpg, b.jpg]`) fills. */
function primaryField(type: string) {
	return moduleMap[type]?.fields.find((f) => f.required) ?? moduleMap[type]?.fields[0];
}

function toBlock(entry: unknown, repo: string, branch: string): Block | string {
	if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'Each showcase item must be like "- image: path/to/file.jpg"';
	const obj = entry as Record<string, unknown>;
	let type: string;
	let data: Record<string, unknown>;

	if (typeof obj.type === 'string') {
		// Long form: - type: gallery / urls: [...] / layout: masonry
		type = obj.type;
		data = { ...obj };
		delete data.type;
	} else {
		// Short form: - gallery: [a.jpg, b.jpg]
		const keys = Object.keys(obj);
		if (keys.length !== 1) return `Use either "- type: …" or a single "- module: value" (got ${keys.join(', ')})`;
		type = keys[0];
		const field = primaryField(type);
		if (!field) return `Unknown module "${type}"`;
		data = { [field.key]: obj[type] };
	}

	const def = moduleMap[type];
	if (!def) return `Unknown module "${type}"`;

	for (const f of def.fields) {
		const v = data[f.key];
		if (f.type === 'url' && typeof v === 'string') {
			const r = resolvePath(v, repo, branch);
			if (!r) return `${def.name}: "${v}" is not a valid path or URL`;
			data[f.key] = r;
		} else if (f.type === 'urls') {
			const list = strList(v, 100).map((x) => resolvePath(x, repo, branch));
			if (list.some((x) => !x)) return `${def.name}: contains an invalid path or URL`;
			data[f.key] = list;
		} else if (typeof v === 'number') {
			data[f.key] = String(v);
		} else if (v instanceof Date) {
			data[f.key] = v.toISOString().slice(0, 10);
		}
	}

	const r = validateBlock({ type, data });
	return r.ok ? r.block : r.error;
}

export function parseManifest(source: string, repo: string, branch: string): Manifest {
	const m = emptyManifest();
	if (source.length > MAX_MANIFEST_BYTES) {
		m.issues.push('openworld.yml is larger than 64 KB');
		return m;
	}
	let doc: unknown;
	try {
		doc = parse(source, { maxAliasCount: 20, prettyErrors: true });
	} catch (e) {
		m.issues.push(`openworld.yml could not be read: ${(e as Error).message.split('\n')[0]}`);
		return m;
	}
	if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
		m.issues.push('openworld.yml should be a set of "key: value" lines (title, medium, showcase, …)');
		return m;
	}
	const d = doc as Record<string, unknown>;

	m.title = str(d.title, 120);
	m.summary = str(d.summary ?? d.description, 600);
	const medium = str(d.medium, 40)?.toLowerCase().replace(/\s+/g, '-') ?? null;
	m.medium = medium;
	if (medium && !MEDIUMS.includes(medium)) m.issues.push(`Medium "${medium}" isn’t a known one yet — it still shows, but consider one of: ${MEDIUMS.join(', ')}`);

	if (d.cover !== undefined) {
		const c = typeof d.cover === 'string' ? resolvePath(d.cover, repo, branch) : null;
		if (c) m.cover = c;
		else m.issues.push('cover: must be a path in the repo or an https URL');
	}

	m.credits = strList(d.credits, 60);
	for (const l of strList(d.links, 20)) {
		if (/^https?:\/\//i.test(l)) m.links.push(l);
		else m.issues.push(`links: "${l}" is not an http(s) URL`);
	}

	if (d.showcase !== undefined) {
		if (!Array.isArray(d.showcase)) m.issues.push('showcase: must be a list (each line starting with "- ")');
		else {
			d.showcase.slice(0, MAX_SHOWCASE).forEach((entry, i) => {
				const b = toBlock(entry, repo, branch);
				if (typeof b === 'string') m.issues.push(`showcase item ${i + 1}: ${b}`);
				else m.showcase.push(b);
			});
			if (d.showcase.length > MAX_SHOWCASE) m.issues.push(`showcase: only the first ${MAX_SHOWCASE} items are shown`);
		}
	}
	return m;
}
