/**
 * Embed providers: turn a public share URL into a safe embed URL.
 * The embed src is always *computed* from a matched pattern, never taken from user input.
 */

export type EmbedKind = 'video' | 'audio' | 'code' | 'design' | '3d' | 'social' | 'document' | 'archive';

export interface EmbedInfo {
	provider: string;
	kind: EmbedKind;
	src: string;
	/** width / height, or a fixed pixel height when `height` is set */
	aspect?: number;
	height?: number;
	thumbnail?: string;
}

interface Provider {
	name: string;
	match: (u: URL) => EmbedInfo | null;
}

const host = (u: URL) => u.hostname.replace(/^www\./, '').replace(/^m\./, '');
const enc = encodeURIComponent;

const providers: Provider[] = [
	{
		name: 'YouTube',
		match(u) {
			let id: string | null = null;
			if (host(u) === 'youtu.be') id = u.pathname.slice(1);
			else if (host(u) === 'youtube.com' || host(u) === 'music.youtube.com') {
				id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1] ?? null;
			}
			if (!id || !/^[\w-]{11}$/.test(id)) return null;
			const shorts = u.pathname.startsWith('/shorts/');
			return {
				provider: 'YouTube',
				kind: 'video',
				src: `https://www.youtube-nocookie.com/embed/${id}`,
				aspect: shorts ? 9 / 16 : 16 / 9,
				thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
			};
		}
	},
	{
		name: 'Vimeo',
		match(u) {
			if (host(u) !== 'vimeo.com') return null;
			const id = u.pathname.match(/^\/(?:video\/)?(\d+)/)?.[1];
			return id ? { provider: 'Vimeo', kind: 'video', src: `https://player.vimeo.com/video/${id}`, aspect: 16 / 9 } : null;
		}
	},
	{
		name: 'Spotify',
		match(u) {
			if (host(u) !== 'open.spotify.com') return null;
			const m = u.pathname.match(/^\/(?:intl-[\w-]+\/)?(track|album|playlist|episode|show|artist)\/(\w+)/);
			if (!m) return null;
			return {
				provider: 'Spotify',
				kind: 'audio',
				src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
				height: m[1] === 'track' || m[1] === 'episode' ? 152 : 352
			};
		}
	},
	{
		name: 'SoundCloud',
		match(u) {
			if (host(u) !== 'soundcloud.com' || u.pathname.split('/').filter(Boolean).length < 2) return null;
			return {
				provider: 'SoundCloud',
				kind: 'audio',
				src: `https://w.soundcloud.com/player/?url=${enc(u.origin + u.pathname)}&visual=true&show_comments=false`,
				height: 300
			};
		}
	},
	{
		name: 'Mixcloud',
		match(u) {
			if (host(u) !== 'mixcloud.com' || u.pathname.split('/').filter(Boolean).length < 2) return null;
			return { provider: 'Mixcloud', kind: 'audio', src: `https://www.mixcloud.com/widget/iframe/?feed=${enc(u.pathname)}`, height: 180 };
		}
	},
	{
		name: 'Apple Music',
		match(u) {
			if (host(u) !== 'music.apple.com') return null;
			return { provider: 'Apple Music', kind: 'audio', src: `https://embed.music.apple.com${u.pathname}${u.search}`, height: 175 };
		}
	},
	{
		name: 'CodePen',
		match(u) {
			if (host(u) !== 'codepen.io') return null;
			const m = u.pathname.match(/^\/([\w-]+)\/(?:pen|full|details)\/(\w+)/);
			return m ? { provider: 'CodePen', kind: 'code', src: `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result`, aspect: 4 / 3 } : null;
		}
	},
	{
		name: 'CodeSandbox',
		match(u) {
			if (host(u) !== 'codesandbox.io') return null;
			const id = u.pathname.match(/^\/(?:s|p\/sandbox|embed)\/([\w-]+)/)?.[1];
			return id ? { provider: 'CodeSandbox', kind: 'code', src: `https://codesandbox.io/embed/${id}`, aspect: 4 / 3 } : null;
		}
	},
	{
		name: 'Sketchfab',
		match(u) {
			if (host(u) !== 'sketchfab.com') return null;
			const id = u.pathname.match(/^\/(?:3d-models\/[\w-]*?-?|models\/)([0-9a-f]{32})/)?.[1];
			return id ? { provider: 'Sketchfab', kind: '3d', src: `https://sketchfab.com/models/${id}/embed`, aspect: 16 / 10 } : null;
		}
	},
	{
		name: 'Figma',
		match(u) {
			if (host(u) !== 'figma.com' || !/^\/(file|design|proto|board)\//.test(u.pathname)) return null;
			return { provider: 'Figma', kind: 'design', src: `https://www.figma.com/embed?embed_host=openworld&url=${enc(u.href)}`, aspect: 16 / 10 };
		}
	},
	{
		name: 'Loom',
		match(u) {
			if (host(u) !== 'loom.com') return null;
			const id = u.pathname.match(/^\/share\/(\w+)/)?.[1];
			return id ? { provider: 'Loom', kind: 'video', src: `https://www.loom.com/embed/${id}`, aspect: 16 / 9 } : null;
		}
	},
	{
		name: 'TikTok',
		match(u) {
			if (host(u) !== 'tiktok.com') return null;
			const id = u.pathname.match(/\/video\/(\d+)/)?.[1];
			return id ? { provider: 'TikTok', kind: 'social', src: `https://www.tiktok.com/embed/v2/${id}`, aspect: 9 / 16 } : null;
		}
	},
	{
		name: 'Instagram',
		match(u) {
			if (host(u) !== 'instagram.com') return null;
			const m = u.pathname.match(/^\/(p|reel|tv)\/([\w-]+)/);
			return m ? { provider: 'Instagram', kind: 'social', src: `https://www.instagram.com/${m[1]}/${m[2]}/embed`, aspect: 4 / 5 } : null;
		}
	},
	{
		name: 'Google Drive',
		match(u) {
			if (host(u) !== 'drive.google.com') return null;
			const id = u.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] ?? (u.pathname === '/open' ? u.searchParams.get('id') : null);
			return id ? { provider: 'Google Drive', kind: 'document', src: `https://drive.google.com/file/d/${id}/preview`, aspect: 4 / 3 } : null;
		}
	},
	{
		name: 'Google Docs',
		match(u) {
			if (host(u) !== 'docs.google.com') return null;
			const m = u.pathname.match(/^\/(document|presentation|spreadsheets|forms)\/d\/([\w-]+)/);
			return m ? { provider: 'Google Docs', kind: 'document', src: `https://docs.google.com/${m[1]}/d/${m[2]}/preview`, aspect: m[1] === 'presentation' ? 16 / 9 : 3 / 4 } : null;
		}
	},
	{
		name: 'Internet Archive',
		match(u) {
			if (host(u) !== 'archive.org') return null;
			const id = u.pathname.match(/^\/details\/([^/]+)/)?.[1];
			return id ? { provider: 'Internet Archive', kind: 'archive', src: `https://archive.org/embed/${id}`, aspect: 4 / 3 } : null;
		}
	}
];

export const providerNames = providers.map((p) => p.name);

export function parseUrl(raw: string): URL | null {
	try {
		const u = new URL(raw.trim());
		return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
	} catch {
		return null;
	}
}

export function matchEmbed(raw: string): EmbedInfo | null {
	const u = parseUrl(raw);
	if (!u) return null;
	for (const p of providers) {
		const info = p.match(u);
		if (info) return info;
	}
	return null;
}

const ext = (raw: string) => parseUrl(raw)?.pathname.toLowerCase().match(/\.(\w+)$/)?.[1] ?? '';
export const isImageUrl = (u: string) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext(u));
export const isVideoUrl = (u: string) => ['mp4', 'webm', 'mov', 'm4v'].includes(ext(u));
export const isAudioUrl = (u: string) => ['mp3', 'ogg', 'wav', 'flac', 'm4a', 'opus'].includes(ext(u));
export const isPdfUrl = (u: string) => ext(u) === 'pdf';

/** `owner/name` from a GitHub repo URL or shorthand. */
export function parseGithubRepo(raw: string): string | null {
	const s = raw.trim();
	if (/^[\w.-]+\/[\w.-]+$/.test(s)) return s;
	const u = parseUrl(s);
	if (!u || host(u) !== 'github.com') return null;
	const [owner, name] = u.pathname.split('/').filter(Boolean);
	return owner && name ? `${owner}/${name.replace(/\.git$/, '')}` : null;
}
