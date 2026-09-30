import { error, json } from '@sveltejs/kit';
import { GithubError } from '$lib/server/github';
import { env, githubToken, requireUser } from '$lib/server/env';
import { getRepo, syncRepo } from '$lib/server/repos';

/** Owner-triggered re-read from GitHub (e.g. right after editing openworld.yml). */
export async function POST(event) {
	const user = requireUser(event);
	const e = env(event);
	const row = await getRepo(e.DB, `${event.params.owner}/${event.params.name}`);
	if (!row || row.owner_id !== user.id) error(404, 'Not found');
	if (Date.now() - row.synced_at < 15_000) error(429, 'Just refreshed — give it a few seconds');
	try {
		const data = await syncRepo(e.DB, row.full_name, await githubToken(event), e.GITHUB_API_BASE);
		return json({ fullName: data.fullName, issues: data.manifest.issues });
	} catch (err) {
		if (err instanceof GithubError) error(err.status, err.message);
		throw err;
	}
}
