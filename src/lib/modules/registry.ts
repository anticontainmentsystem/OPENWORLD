/**
 * Tier-1 module registry ("blocks").
 *
 * Each module declares its fields once. The composer form, server validation,
 * and feed snapshots are all derived from these declarations, so adding a
 * module means adding one entry here plus one renderer component.
 */
import type { Block, Snapshot } from '$lib/types';
import { isAudioUrl, isImageUrl, isPdfUrl, isVideoUrl, matchEmbed, parseGithubRepo, parseUrl } from './providers';

export type FieldType = 'text' | 'textarea' | 'url' | 'urls' | 'lines' | 'enum' | 'date' | 'colors' | 'code';

export interface Field {
	key: string;
	label: string;
	type: FieldType;
	required?: boolean;
	max?: number;
	placeholder?: string;
	help?: string;
	options?: string[];
	/** Extra check for url fields; return an error message or null. */
	check?: (value: string) => string | null;
}

export type ModuleCategory = 'words' | 'media' | 'embeds' | 'work' | 'details';

export interface ModuleDef {
	id: string;
	name: string;
	icon: string;
	category: ModuleCategory;
	description: string;
	fields: Field[];
	snapshot: (d: Record<string, any>) => Partial<Snapshot>;
}

const first = (s: unknown, n = 140) => {
	if (typeof s !== 'string') return null;
	const t = s.replace(/\s+/g, ' ').trim();
	return t.length > n ? t.slice(0, n - 1) + '…' : t || null;
};

export const modules: ModuleDef[] = [
	{
		id: 'text',
		name: 'Text',
		icon: '¶',
		category: 'words',
		description: 'Words, thoughts, context. Links become clickable.',
		fields: [{ key: 'body', label: 'Text', type: 'textarea', required: true, max: 5000 }],
		snapshot: (d) => ({ excerpt: first(d.body) })
	},
	{
		id: 'quote',
		name: 'Quote',
		icon: '❝',
		category: 'words',
		description: 'A quote, statement, or artist note.',
		fields: [
			{ key: 'text', label: 'Quote', type: 'textarea', required: true, max: 1000 },
			{ key: 'source', label: 'Source', type: 'text', max: 120 }
		],
		snapshot: (d) => ({ excerpt: first(`“${d.text}”`) })
	},
	{
		id: 'link',
		name: 'Link card',
		icon: '↗',
		category: 'embeds',
		description: 'Any page on the internet, shown as a preview card.',
		fields: [{ key: 'url', label: 'URL', type: 'url', required: true }],
		snapshot: (d) => ({ title: d.preview?.title ?? null, excerpt: first(d.preview?.description), image: d.preview?.image ?? null })
	},
	{
		id: 'embed',
		name: 'Embed',
		icon: '▶',
		category: 'embeds',
		description: 'Play it where it lives: YouTube, Vimeo, Spotify, SoundCloud, CodePen, Sketchfab, Figma, Drive and more.',
		fields: [
			{
				key: 'url',
				label: 'Share URL',
				type: 'url',
				required: true,
				check: (v) => (matchEmbed(v) ? null : 'No embed player for this site yet — try a Link card instead')
			},
			{ key: 'caption', label: 'Caption', type: 'text', max: 200 }
		],
		snapshot: (d) => ({ image: matchEmbed(d.url)?.thumbnail ?? null, excerpt: first(d.caption) })
	},
	{
		id: 'image',
		name: 'Image',
		icon: '▣',
		category: 'media',
		description: 'One image from anywhere it is hosted.',
		fields: [
			{ key: 'url', label: 'Image URL', type: 'url', required: true },
			{ key: 'alt', label: 'Description (for screen readers)', type: 'text', max: 300 },
			{ key: 'caption', label: 'Caption', type: 'text', max: 200 }
		],
		snapshot: (d) => ({ image: d.url, excerpt: first(d.caption) })
	},
	{
		id: 'gallery',
		name: 'Gallery',
		icon: '▦',
		category: 'media',
		description: 'Several images as a grid, masonry wall, or carousel.',
		fields: [
			{ key: 'urls', label: 'Image URLs (one per line)', type: 'urls', required: true, max: 40 },
			{ key: 'layout', label: 'Layout', type: 'enum', options: ['grid', 'masonry', 'carousel'] },
			{ key: 'caption', label: 'Caption', type: 'text', max: 200 }
		],
		snapshot: (d) => ({ image: d.urls?.[0] ?? null, excerpt: first(d.caption) })
	},
	{
		id: 'before-after',
		name: 'Before / After',
		icon: '◧',
		category: 'media',
		description: 'Drag to compare two images: restoration, process, transformation.',
		fields: [
			{ key: 'before', label: 'Before image URL', type: 'url', required: true },
			{ key: 'after', label: 'After image URL', type: 'url', required: true },
			{ key: 'caption', label: 'Caption', type: 'text', max: 200 }
		],
		snapshot: (d) => ({ image: d.after, excerpt: first(d.caption) })
	},
	{
		id: 'video',
		name: 'Video file',
		icon: '◉',
		category: 'media',
		description: 'A video file hosted anywhere (.mp4, .webm).',
		fields: [
			{ key: 'url', label: 'Video URL', type: 'url', required: true, check: (v) => (isVideoUrl(v) ? null : 'Must link to a video file (.mp4, .webm, .mov)') },
			{ key: 'poster', label: 'Poster image URL', type: 'url' },
			{ key: 'caption', label: 'Caption', type: 'text', max: 200 }
		],
		snapshot: (d) => ({ image: d.poster ?? null, excerpt: first(d.caption) })
	},
	{
		id: 'audio',
		name: 'Audio file',
		icon: '♪',
		category: 'media',
		description: 'A sound file hosted anywhere (.mp3, .wav, .ogg, .flac).',
		fields: [
			{ key: 'url', label: 'Audio URL', type: 'url', required: true, check: (v) => (isAudioUrl(v) ? null : 'Must link to an audio file (.mp3, .wav, .ogg, .flac, .m4a)') },
			{ key: 'title', label: 'Title', type: 'text', max: 120 },
			{ key: 'cover', label: 'Cover image URL', type: 'url' }
		],
		snapshot: (d) => ({ title: d.title ?? null, image: d.cover ?? null })
	},
	{
		id: 'document',
		name: 'Document',
		icon: '▤',
		category: 'work',
		description: 'Scripts, scores, zines, portfolios: a PDF or a shared Google Drive / Docs file.',
		fields: [
			{
				key: 'url',
				label: 'PDF or Drive/Docs URL',
				type: 'url',
				required: true,
				check: (v) => (isPdfUrl(v) || ['Google Drive', 'Google Docs'].includes(matchEmbed(v)?.provider ?? '') ? null : 'Must be a .pdf link or a shared Google Drive / Docs link')
			},
			{ key: 'title', label: 'Title', type: 'text', max: 120 }
		],
		snapshot: (d) => ({ title: d.title ?? null })
	},
	{
		id: 'github-repo',
		name: 'GitHub repo',
		icon: '⎇',
		category: 'work',
		description: 'Showcase a repository: your project’s home for material and deliverables.',
		fields: [
			{ key: 'repo', label: 'Repo URL or owner/name', type: 'text', required: true, max: 200, check: (v) => (parseGithubRepo(v) ? null : 'Use a github.com repo URL or owner/name') }
		],
		snapshot: (d) => {
			const r = parseGithubRepo(String(d.repo ?? ''));
			return { title: r, excerpt: first(d.info?.description), image: r ? `https://opengraph.githubassets.com/1/${r}` : null };
		}
	},
	{
		id: 'credits',
		name: 'Credits',
		icon: '✦',
		category: 'details',
		description: 'Who made it. One per line: Role — Name.',
		fields: [{ key: 'lines', label: 'Credits', type: 'lines', required: true, max: 60, placeholder: 'Director — Ada Lovelace\nLighting — Grace Hopper' }],
		snapshot: () => ({})
	},
	{
		id: 'event',
		name: 'Event',
		icon: '◷',
		category: 'details',
		description: 'A show, opening, premiere, performance, or workshop.',
		fields: [
			{ key: 'title', label: 'Title', type: 'text', required: true, max: 120 },
			{ key: 'date', label: 'Date', type: 'date', required: true },
			{ key: 'venue', label: 'Venue / place', type: 'text', max: 160 },
			{ key: 'url', label: 'Tickets or info URL', type: 'url' }
		],
		snapshot: (d) => ({ title: d.title ?? null, excerpt: [d.date, d.venue].filter(Boolean).join(' · ') || null })
	},
	{
		id: 'tracklist',
		name: 'Tracklist',
		icon: '≡',
		category: 'details',
		description: 'Tracks, acts, scenes, or chapters. One per line: Title — 3:45.',
		fields: [
			{ key: 'title', label: 'Release / work title', type: 'text', max: 120 },
			{ key: 'lines', label: 'Items', type: 'lines', required: true, max: 100 }
		],
		snapshot: (d) => ({ title: d.title ?? null })
	},
	{
		id: 'timeline',
		name: 'Process timeline',
		icon: '⋮',
		category: 'work',
		description: 'How it came to be. One step per line: When — What happened.',
		fields: [{ key: 'lines', label: 'Steps', type: 'lines', required: true, max: 60, placeholder: 'March — First sketches\nApril — Clay maquette\nJune — Bronze cast' }],
		snapshot: () => ({})
	},
	{
		id: 'recipe',
		name: 'Recipe',
		icon: '◍',
		category: 'work',
		description: 'Ingredients and steps, for cuisine and any craft with a method.',
		fields: [
			{ key: 'title', label: 'Title', type: 'text', max: 120 },
			{ key: 'ingredients', label: 'Ingredients / materials (one per line)', type: 'lines', required: true, max: 80 },
			{ key: 'steps', label: 'Steps (one per line)', type: 'lines', required: true, max: 80 }
		],
		snapshot: (d) => ({ title: d.title ?? null })
	},
	{
		id: 'materials',
		name: 'Materials & tools',
		icon: '⚒',
		category: 'details',
		description: 'What it’s made with: media, instruments, software, tools.',
		fields: [{ key: 'lines', label: 'Items (one per line)', type: 'lines', required: true, max: 60 }],
		snapshot: () => ({})
	},
	{
		id: 'palette',
		name: 'Palette',
		icon: '◐',
		category: 'details',
		description: 'The colors of the work.',
		fields: [
			{ key: 'colors', label: 'Colors (hex, one per line)', type: 'colors', required: true, max: 16, placeholder: '#b87333\n#4a6741' },
			{ key: 'name', label: 'Name', type: 'text', max: 80 }
		],
		snapshot: () => ({})
	},
	{
		id: 'map',
		name: 'Place',
		icon: '⌖',
		category: 'details',
		description: 'Where it is: murals, installations, venues, landscapes.',
		fields: [
			{ key: 'place', label: 'Address or place name', type: 'text', required: true, max: 200 },
			{ key: 'caption', label: 'Caption', type: 'text', max: 200 }
		],
		snapshot: (d) => ({ excerpt: first(d.place) })
	},
	{
		id: 'code',
		name: 'Code',
		icon: '{}',
		category: 'work',
		description: 'A snippet of code, a shader, a patch.',
		fields: [
			{ key: 'language', label: 'Language', type: 'text', max: 40 },
			{ key: 'code', label: 'Code', type: 'code', required: true, max: 20000 }
		],
		snapshot: (d) => ({ excerpt: first(d.code, 100) })
	}
];

export const moduleMap: Record<string, ModuleDef> = Object.fromEntries(modules.map((m) => [m.id, m]));

export const categories: { id: ModuleCategory; name: string }[] = [
	{ id: 'embeds', name: 'From anywhere' },
	{ id: 'media', name: 'Media' },
	{ id: 'words', name: 'Words' },
	{ id: 'work', name: 'The work' },
	{ id: 'details', name: 'Details' }
];

export const MAX_BLOCKS = 20;

/** Fields a server may attach during enrichment (never accepted from clients). */
const SERVER_KEYS: Record<string, string[]> = { link: ['preview'], 'github-repo': ['info'] };

function checkUrl(v: string): string | null {
	return parseUrl(v) ? null : 'Must be an http(s) URL';
}

/**
 * Validate one block against its module definition.
 * Returns cleaned data (unknown keys dropped) or an error.
 */
export function validateBlock(input: unknown): { ok: true; block: Block } | { ok: false; error: string } {
	if (!input || typeof input !== 'object') return { ok: false, error: 'Invalid block' };
	const { type, data } = input as { type?: unknown; data?: unknown };
	const def = typeof type === 'string' ? moduleMap[type] : undefined;
	if (!def) return { ok: false, error: `Unknown module "${String(type)}"` };
	const src = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
	const out: Record<string, unknown> = {};

	for (const f of def.fields) {
		const raw = src[f.key];
		const label = `${def.name}: ${f.label}`;

		if (f.type === 'urls' || f.type === 'lines' || f.type === 'colors') {
			const list = (Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split('\n') : [])
				.map((x) => String(x).trim())
				.filter(Boolean);
			if (f.required && !list.length) return { ok: false, error: `${label} is required` };
			if (f.max && list.length > f.max) return { ok: false, error: `${label}: at most ${f.max} items` };
			for (const item of list) {
				if (item.length > 300) return { ok: false, error: `${label}: items must be under 300 characters` };
				if (f.type === 'urls' && checkUrl(item)) return { ok: false, error: `${label}: "${item}" is not a valid URL` };
				if (f.type === 'colors' && !/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(item)) return { ok: false, error: `${label}: "${item}" is not a hex color` };
			}
			if (list.length) out[f.key] = list;
			continue;
		}

		const value = typeof raw === 'string' ? raw.trim() : '';
		if (!value) {
			if (f.required) return { ok: false, error: `${label} is required` };
			continue;
		}
		const max = f.max ?? (f.type === 'url' ? 2000 : 500);
		if (value.length > max) return { ok: false, error: `${label} must be under ${max} characters` };
		if (f.type === 'url') {
			const e = checkUrl(value);
			if (e) return { ok: false, error: `${label}: ${e}` };
		}
		if (f.type === 'enum' && f.options && !f.options.includes(value)) return { ok: false, error: `${label}: invalid option` };
		if (f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false, error: `${label}: invalid date` };
		const e = f.check?.(value);
		if (e) return { ok: false, error: `${label}: ${e}` };
		out[f.key] = value;
	}
	return { ok: true, block: { type: def.id, data: out } };
}

export function stripServerKeys(block: Block): Block {
	const keys = SERVER_KEYS[block.type];
	if (!keys) return block;
	const data = { ...block.data };
	for (const k of keys) delete data[k];
	return { ...block, data };
}

export function buildSnapshot(blocks: Block[]): Snapshot {
	const snap: Snapshot = { title: null, excerpt: null, image: null, kinds: [] };
	for (const b of blocks) {
		const def = moduleMap[b.type];
		if (!def) continue;
		if (!snap.kinds.includes(def.id)) snap.kinds.push(def.id);
		const s = def.snapshot(b.data);
		snap.title ??= s.title ?? null;
		snap.excerpt ??= s.excerpt ?? null;
		snap.image ??= s.image ?? null;
	}
	return snap;
}

/** Suggest the best module for a pasted URL. */
export function suggestBlock(raw: string): Block | null {
	const url = raw.trim();
	const repo = /github\.com\//.test(url) ? parseGithubRepo(url) : null;
	if (repo) return { type: 'github-repo', data: { repo } };
	const embed = matchEmbed(url);
	if (embed?.kind === 'document') return { type: 'document', data: { url } };
	if (embed) return { type: 'embed', data: { url } };
	if (!parseUrl(url)) return null;
	if (isImageUrl(url)) return { type: 'image', data: { url } };
	if (isVideoUrl(url)) return { type: 'video', data: { url } };
	if (isAudioUrl(url)) return { type: 'audio', data: { url } };
	if (isPdfUrl(url)) return { type: 'document', data: { url } };
	return { type: 'link', data: { url } };
}
