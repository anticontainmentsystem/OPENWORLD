import { error, json } from '@sveltejs/kit';
import { parseGithubRepo } from '$lib/modules/providers';
import { GithubError, fetchRepo } from '$lib/server/github';
import { env, githubToken, requireUser } from '$lib/server/env';
import { getRepo } from '$lib/server/repos';

/** Register one of your GitHub repos as an OpenWorld creative repo. */
export async function POST(event) {
	const user = requireUser(event);
	const e = env(event);
	const { repo } = ((await event.request.json().catch(() => ({}))) ?? {}) as { repo?: string };
	const name = typeof repo === 'string' ? parseGithubRepo(repo) : null;
	if (!name) error(400, 'Use a github.com repo URL or owner/name');
	if (name.split('/')[0].toLowerCase() !== user.username.toLowerCase()) error(403, `You can add repos owned by @${user.username}`);
	if (await getRepo(e.DB, name)) error(409, 'That repo is already on OpenWorld');

	let data;
	try {
		data = await fetchRepo(name, await githubToken(event), e.GITHUB_API_BASE);
	} catch (err) {
		if (err instanceof GithubError) error(err.status, err.message);
		throw err;
	}
	if (data.ownerLogin.toLowerCase() !== user.username.toLowerCase()) error(403, `That repo belongs to @${data.ownerLogin}`);

	const count = await e.DB.prepare('SELECT COUNT(*) AS n FROM repos WHERE owner_id = ?').bind(user.id).first<{ n: number }>();
	if ((count?.n ?? 0) >= 100) error(400, 'You can show up to 100 repos');

	const { ownerLogin: _, ...stored } = data;
	await e.DB.prepare('INSERT INTO repos (owner_id, full_name, data_json, synced_at, created_at) VALUES (?, ?, ?, ?, ?)')
		.bind(user.id, data.fullName, JSON.stringify(stored), Date.now(), Date.now())
		.run();
	return json({ fullName: data.fullName, hasManifest: data.hasManifest, issues: data.manifest.issues }, { status: 201 });
}
