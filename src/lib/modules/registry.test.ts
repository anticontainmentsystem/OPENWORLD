import { describe, expect, it } from 'vitest';
import { matchEmbed, parseGithubRepo } from './providers';
import { buildSnapshot, stripServerKeys, suggestBlock, validateBlock } from './registry';

describe('embed providers', () => {
	it.each([
		['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
		['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
		['https://vimeo.com/76979871', 'https://player.vimeo.com/video/76979871'],
		['https://open.spotify.com/intl-de/track/abc123', 'https://open.spotify.com/embed/track/abc123'],
		['https://drive.google.com/file/d/FILEid_1/view?usp=sharing', 'https://drive.google.com/file/d/FILEid_1/preview']
	])('%s', (url, src) => expect(matchEmbed(url)?.src).toBe(src));

	it('never embeds unknown or unsafe URLs', () => {
		expect(matchEmbed('https://evil.example/embed')).toBeNull();
		expect(matchEmbed('javascript:alert(1)')).toBeNull();
		expect(matchEmbed('https://www.youtube.com/watch?v="><script>')).toBeNull();
	});

	it('parses GitHub repos', () => {
		expect(parseGithubRepo('https://github.com/a/b.git')).toBe('a/b');
		expect(parseGithubRepo('a/b')).toBe('a/b');
		expect(parseGithubRepo('https://gitlab.com/a/b')).toBeNull();
	});
});

describe('blocks', () => {
	it('validates, drops unknown keys, and splits list fields', () => {
		const r = validateBlock({ type: 'credits', data: { lines: 'A — B\n\nC — D', evil: 1 } });
		expect(r).toEqual({ ok: true, block: { type: 'credits', data: { lines: ['A — B', 'C — D'] } } });
	});
	it('rejects bad input', () => {
		expect(validateBlock({ type: 'nope', data: {} }).ok).toBe(false);
		expect(validateBlock({ type: 'image', data: { url: 'javascript:alert(1)' } }).ok).toBe(false);
		expect(validateBlock({ type: 'palette', data: { colors: 'red' } }).ok).toBe(false);
		expect(validateBlock({ type: 'text', data: { body: 'x'.repeat(5001) } }).ok).toBe(false);
	});
	it('strips server-only fields sent by clients', () => {
		expect(stripServerKeys({ type: 'link', data: { url: 'https://x.org', preview: { title: 'fake' } } }).data).toEqual({ url: 'https://x.org' });
	});
	it('suggests modules for pasted links', () => {
		expect(suggestBlock('https://github.com/a/b')?.type).toBe('github-repo');
		expect(suggestBlock('https://youtu.be/dQw4w9WgXcQ')?.type).toBe('embed');
		expect(suggestBlock('https://x.org/a.png')?.type).toBe('image');
		expect(suggestBlock('https://x.org/page')?.type).toBe('link');
	});
	it('builds snapshots from the first useful values', () => {
		const s = buildSnapshot([
			{ type: 'text', data: { body: 'hello' } },
			{ type: 'embed', data: { url: 'https://youtu.be/dQw4w9WgXcQ' } }
		]);
		expect(s).toEqual({ title: null, excerpt: 'hello', image: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', kinds: ['text', 'embed'] });
	});
});
