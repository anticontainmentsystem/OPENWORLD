/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseManifest, resolvePath } from './manifest';

const R = 'someone/work';

describe('resolvePath', () => {
	it('maps repo paths to raw URLs on the branch', () => {
		expect(resolvePath('media/a b.jpg', R, 'main')).toBe('https://raw.githubusercontent.com/someone/work/main/media/a%20b.jpg');
		expect(resolvePath('./x.png', R, 'main')).toBe('https://raw.githubusercontent.com/someone/work/main/x.png');
	});
	it('passes https URLs through and rejects traversal and other schemes', () => {
		expect(resolvePath('https://example.com/a.jpg', R, 'main')).toBe('https://example.com/a.jpg');
		expect(resolvePath('../secret', R, 'main')).toBeNull();
		expect(resolvePath('a/../../b', R, 'main')).toBeNull();
		expect(resolvePath('javascript:alert(1)', R, 'main')).toBeNull();
		expect(resolvePath('data:text/html,hi', R, 'main')).toBeNull();
	});
});

describe('parseManifest', () => {
	it('reads fields and short/long-form showcase entries', () => {
		const m = parseManifest(
			`title: Piece
medium: Visual Art
cover: media/c.jpg
credits: [Director — A]
showcase:
  - image: media/a.jpg
  - gallery: [1.jpg, https://x.org/2.jpg]
  - type: event
    title: Opening
    date: 2027-01-02
`,
			R,
			'main'
		);
		expect(m.title).toBe('Piece');
		expect(m.medium).toBe('visual-art');
		expect(m.cover).toContain('/main/media/c.jpg');
		expect(m.credits).toEqual(['Director — A']);
		expect(m.showcase.map((b) => b.type)).toEqual(['image', 'gallery', 'event']);
		expect(m.showcase[1].data.urls).toEqual(['https://raw.githubusercontent.com/someone/work/main/1.jpg', 'https://x.org/2.jpg']);
		expect(m.showcase[2].data.date).toBe('2027-01-02');
		expect(m.issues).toEqual([]);
	});

	it('collects problems instead of failing', () => {
		const m = parseManifest(
			`showcase:
  - hologram: x
  - image: ../../etc/passwd
  - link: javascript:alert(1)
  - embed: https://unknown.example/v/1
  - text: ok
`,
			R,
			'main'
		);
		expect(m.showcase.map((b) => b.type)).toEqual(['text']);
		expect(m.issues).toHaveLength(4);
	});

	it('survives invalid YAML and alias bombs', () => {
		expect(parseManifest('title: [unclosed', R, 'main').issues[0]).toMatch(/could not be read/);
		const bomb = 'a: &a [x,x,x,x,x,x,x,x,x]\n' + Array.from({ length: 30 }, (_, i) => `b${i}: &b${i} [*${i ? 'b' + (i - 1) : 'a'},*${i ? 'b' + (i - 1) : 'a'}]`).join('\n');
		expect(parseManifest(bomb, R, 'main').issues.length).toBe(1);
	});

	it('every bundled template parses cleanly', () => {
		for (const t of readdirSync('templates', { withFileTypes: true }).filter((d) => d.isDirectory())) {
			const m = parseManifest(readFileSync(`templates/${t.name}/openworld.yml`, 'utf8'), R, 'main');
			expect(m.issues, t.name).toEqual([]);
			expect(m.showcase.length, t.name).toBeGreaterThan(3);
		}
	});
});
