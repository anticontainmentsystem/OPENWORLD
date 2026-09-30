/**
 * Reads a public GitHub repo and turns it into an OpenWorld creative repo:
 * repo info, openworld.yml, README, releases (deliverables), contributors (credits),
 * and recent commits (process).
 */
import { MAX_MANIFEST_BYTES, emptyManifest, parseManifest, type Manifest } from '$lib/manifest';

const MAX_README = 200 * 1024;

export interface Release {
	name: string;
	tag: string;
	url: string;
	publishedAt: string | null;
	notes: string | null;
	assets: { name: string; url: string; size: number }[];
}

export interface RepoData {
	fullName: string;
	branch: string;
	description: string | null;
	homepage: string | null;
	topics: string[];
	language: string | null;
	license: string | null;
	stars: number;
	forks: number;
	pushedAt: string | null;
	fork: boolean;
	parent: string | null;
	manifest: Manifest;
	hasManifest: boolean;
	readmeHtml: string | null;
	releases: Release[];
	contributors: { login: string; avatar: string; contributions: number }[];
	commits: { message: string; date: string | null; author: string | null; url: string }[];
}

export class GithubError extends Error {
	constructor(message: string, public status: number) {
		super(message);
	}
}

export function githubClient(token?: string | null, base = 'https://api.github.com') {
	return async function gh(path: string, accept = 'application/vnd.github+json'): Promise<Response> {
		return fetch(`${base}${path}`, {
			headers: {
				'User-Agent': 'OpenWorld',
				Accept: accept,
				'X-GitHub-Api-Version': '2022-11-28',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			},
			signal: AbortSignal.timeout(8000)
		});
	};
}

async function jsonOr<T>(res: Response, fallback: T): Promise<T> {
	return res.ok ? ((await res.json()) as T) : fallback;
}

export async function fetchRepo(fullName: string, token?: string | null, base?: string): Promise<RepoData & { ownerLogin: string }> {
	const gh = githubClient(token, base);
	const res = await gh(`/repos/${fullName}`);
	if (res.status === 404) throw new GithubError('Repository not found (it must be public)', 404);
	if (res.status === 403 || res.status === 429) throw new GithubError('GitHub is rate-limiting us — try again in a few minutes', 429);
	if (!res.ok) throw new GithubError(`GitHub error ${res.status}`, 502);
	const r = (await res.json()) as any;
	if (r.private) throw new GithubError('Private repos can’t be shown', 403);

	const full: string = r.full_name;
	const branch: string = r.default_branch;
	const ref = `?ref=${encodeURIComponent(branch)}`;

	const [manifestRes, readmeRes, releasesRes, contribRes, commitsRes] = await Promise.all([
		gh(`/repos/${full}/contents/openworld.yml${ref}`, 'application/vnd.github.raw+json'),
		gh(`/repos/${full}/readme${ref}`, 'application/vnd.github.html+json'),
		gh(`/repos/${full}/releases?per_page=6`),
		gh(`/repos/${full}/contributors?per_page=12`),
		gh(`/repos/${full}/commits?per_page=8&sha=${encodeURIComponent(branch)}`)
	]);

	let manifestRes2 = manifestRes;
	if (manifestRes.status === 404) manifestRes2 = await gh(`/repos/${full}/contents/openworld.yaml${ref}`, 'application/vnd.github.raw+json');
	const hasManifest = manifestRes2.ok;
	const manifestText = hasManifest ? (await manifestRes2.text()).slice(0, MAX_MANIFEST_BYTES + 1) : '';
	const manifest = hasManifest ? parseManifest(manifestText, full, branch) : emptyManifest();

	const readme = readmeRes.ok ? await readmeRes.text() : null;

	const releases = (await jsonOr<any[]>(releasesRes, [])).filter((x) => !x.draft).map(
		(x): Release => ({
			name: x.name || x.tag_name,
			tag: x.tag_name,
			url: x.html_url,
			publishedAt: x.published_at,
			notes: typeof x.body === 'string' && x.body.trim() ? x.body.trim().slice(0, 400) : null,
			assets: (x.assets ?? []).slice(0, 10).map((a: any) => ({ name: a.name, url: a.browser_download_url, size: a.size }))
		})
	);

	const contributors = (await jsonOr<any[]>(contribRes, []))
		.filter((c) => c.type !== 'Bot')
		.map((c) => ({ login: c.login, avatar: c.avatar_url, contributions: c.contributions }));

	const commits = (await jsonOr<any[]>(commitsRes, [])).map((c) => ({
		message: String(c.commit?.message ?? '').split('\n')[0].slice(0, 140),
		date: c.commit?.author?.date ?? null,
		author: c.author?.login ?? c.commit?.author?.name ?? null,
		url: c.html_url
	}));

	return {
		ownerLogin: r.owner?.login,
		fullName: full,
		branch,
		description: r.description ?? null,
		homepage: r.homepage || null,
		topics: Array.isArray(r.topics) ? r.topics.slice(0, 12) : [],
		language: r.language ?? null,
		license: r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : null,
		stars: r.stargazers_count ?? 0,
		forks: r.forks_count ?? 0,
		pushedAt: r.pushed_at ?? null,
		fork: !!r.fork,
		parent: r.parent?.full_name ?? null,
		manifest,
		hasManifest,
		readmeHtml: readme && readme.length <= MAX_README ? readme : null,
		releases,
		contributors,
		commits
	};
}

export const repoTitle = (d: RepoData) => d.manifest.title ?? d.fullName.split('/')[1];
